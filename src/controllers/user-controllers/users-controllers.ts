import { Request, Response, NextFunction } from "express";
import Users from "../../models/users";
import Groups from "../../models/groups";
import { GenerateToken, hashPassword, isValidDate, isValidEmail } from "../../utils/helpers";
import bcrypt from "bcryptjs";
import { JwtPayload } from "jsonwebtoken";
import { registerSchema, loginSchema } from "../../utils/validation/validators";
import Wallets, { WalletAttributes, type } from "../../models/wallets";
import { role, UserAttributes } from "../../models/users";
import { v4 } from "uuid";
import { resetPasswordMail, transporter } from "../../utils/notification";
import { date } from "joi";
import { DATE, Op } from "sequelize";
import { getDaysInMonth, getNextFriday } from "../../utils/helpers";
import Settings from "../../models/settings";
import Transactions, {
  TransactionAttributes,
  action,
  transaction_status,
  transaction_type,
} from "../../models/transactions";
import { randomBytes } from "crypto";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, password, confirm_password } =
      req.body;

    const validate = await registerSchema.validateAsync(req.body);

    if (validate.error) {
      console.log("error", validate);
      return res.status(400).json({
        Error: validate.error.details[0].message,
      });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?.&])[A-Za-z\d@$!%*?.&]{7,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: `Password must be at least 7 characters long and should contain at least one uppercase letter, one lowercase letter, one special character, and one number.`,
      });
    }

    if (password !== confirm_password)
      return res.status(400).json({ message: `Password mismatch` });

    const userId = v4();
    const newEmail = email.trim().toLowerCase();
    const checkUserMail = await Users.findOne({ where: { email: newEmail } });
    if (checkUserMail)
      return res.status(400).json({ message: `${newEmail} is already in use` });

    const checkUserPhone = await Users.findOne({ where: { phone } });
    if (checkUserPhone)
      return res.status(400).json({ message: `${phone} is already in use` });

    const hashedPassword = await hashPassword(password);
    // Generate OTP
    const otp = generateOTP();

    // Create the user record with an initial OTP (not seen or verified)
    const newUser = (await Users.create({
      id: userId,
      firstName,
      lastName,
      email: newEmail,
      profilePic: "",
      password: hashedPassword,
      role: role.CONTRIBUTOR,
      phone,
      otp,
      created_at: new Date(),
      gender: "",
      occupation: "",
      date_of_birth: new Date(),
      bvn: "",
      address: "",
      identification_number: "",
      identification_doc: "",
      proof_of_address_doc: "",
    })) as unknown as UserAttributes;

    // Send OTP to the user's email
    await sendOTPByEmail(email, otp);

    const findUser = (await Users.findOne({
      where: { email: newUser.email },
    })) as unknown as UserAttributes;
    if (findUser) {
      const payload = {
        id: findUser.id,
        email: findUser.email,
      };
      const token = await GenerateToken(payload);

      // Create global wallet
      const globalWalletId = v4();
      const newGlobalWallet = (await Wallets.create({
        id: globalWalletId,
        user_id: findUser.id,
        total_amount: 0,
        type: type.GLOBAL,
        total_group_savings: 200000,
        total_personal_savings: 200000,
        total_income: 0,
        earnings: [],
        created_at: new Date(),
      })) as unknown as WalletAttributes;
      const wallet = (await Wallets.findOne({
        where: { id: newGlobalWallet.id },
      })) as unknown as WalletAttributes;

      // Create savings wallet
      const savingsWalletId = v4();
      const newSavingsWallet = (await Wallets.create({
        id: savingsWalletId,
        user_id: findUser.id,
        total_amount: 0,
        type: type.SAVINGS,
        total_group_savings: 0,
        total_personal_savings: 0,
        total_income: 0,
        earnings: [],
        created_at: new Date(),
      })) as unknown as WalletAttributes;
      const savingsWallet = (await Wallets.findOne({
        where: { id: newSavingsWallet.id },
      })) as unknown as WalletAttributes;

      // Create group wallet
      const personalGroupWalletId = v4();
      const newpersonalGroupWallet = (await Wallets.create({
        id: personalGroupWalletId,
        user_id: findUser.id,
        total_amount: 0,
        type: type.GROUP_WALLET,
        total_group_savings: 0,
        total_personal_savings: 0,
        total_income: 0,
        earnings: [],
        created_at: new Date(),
      })) as unknown as WalletAttributes;
      const personalGroupWallet = (await Wallets.findOne({
        where: { id: newpersonalGroupWallet.id },
      })) as unknown as WalletAttributes;
      if (!wallet || !savingsWallet || !personalGroupWallet) {
        await Users.destroy({ where: { id: findUser.id } });
        return res.status(400).json({
          message: `Unable to register User`,
        });
      }

      // Create settings for the user
      await Settings.create({ id: v4(), owner_id: userId });

      return res.status(200).json({
        message: `Registration Successful. An OTP has been sent to your email.`,
        User: findUser,
        globalWallet: wallet,
        groupWallet: personalGroupWallet,
        savingsWallet: savingsWallet,
        token,
      });
    }
  } catch (err: any) {
    console.log(err.message);
    return res.status(500).json({
      message: `Internal Server Error`,
    });
  }
};

export const sendOTP = async (req: JwtPayload, res: Response) => {
  const { email } = req.body;
  let otp = generateOTP();

  // Send OTP to the user's email
  await sendOTPByEmail(email, otp);

  res.json({
    message: "OTP sent successfully",
  });
};

export const verifyOTP = async (req: JwtPayload, res: Response) => {
  const { otp } = req.body;
  const user_Id = req.user.id;

  try {
    // Find the user by email
    const user = await Users.findOne({ where: { id: user_Id } });

    if (!user) {
      return res.status(400).json({
        message: "User not found.",
      });
    }

    if (user.otp === otp) {
      // OTP is valid
      // Remove the OTP from the user's record
      user.otp = null!;
      await user.save();

      res.json({
        message: "OTP verified successfully",
      });
    } else {
      res.status(401).json({
        message: "Invalid OTP",
      });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const resendOTP = async (req: JwtPayload, res: Response) => {
  const user_id = req.user.id;

  // Find the user by id
  const user = (await Users.findOne({
    where: { id: user_id },
  })) as unknown as UserAttributes;

  if (!user) {
    return res.status(400).json({
      message: "User not found.",
    });
  }

  // For demonstration, let's assume that we always resend the OTP.
  const otp = generateOTP();

  // Update the user's OTP with the new one
  user.otp = otp;
  await user.save();

  // Send OTP to the user
  await sendOTPByEmail(user.email, otp);

  res.json({
    message: "OTP resent successfully",
  });
};

const generateOTP = (): string => {
  let otp = randomBytes(2).readUInt16BE(0).toString();
  otp = otp.padStart(4, "0"); // Generate a 4-digit OTP

  return otp;
};

const sendOTPByEmail = async (email: string, otp: string) => {
  try {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "OTP for User Registration",
      text: `Your OTP is: ${otp}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:" + info.response);
  } catch (error) {
    console.error(error);
    // Handle email sending failure
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const validator = await loginSchema.validateAsync(req.body);

    if (validator.error) {
      return res.status(400).json({
        Error: validator.error.details[0].message,
      });
    }

    const confirmUser = (await Users.findOne({
      where: { email: email },
    })) as unknown as UserAttributes;

    if (!confirmUser) {
      return res.status(400).json({ message: `User does not exist` });
    }
    const confirm_password = await bcrypt.compare(
      password,
      confirmUser.password
    );

    if (!confirm_password) {
      return res.status(401).send({
        status: "error",
        method: req.method,
        message: "Password is Incorect",
      });
    }

    const token = await GenerateToken({
      id: confirmUser.id,
      email: confirmUser.email,
    });
    return res.status(200).json({
      status: "success",
      method: req.method,
      message: "Login Successful",
      confirmUser,
      token,
    });
  } catch (err: any) {
    console.log(err.message);
    return res.status(500).json({ message: `Internal Server Error` });
  }
};

export const verifyChangePasswordEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    const user: any = await Users.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "User does not exist" });
    }

    const token = await GenerateToken({
      id: user.id,
      email: user.email,
    });

    const resetLink = `${process.env.RESET_PASSWORD_URL}?token=${token}`;
    const params = {
      to: email,
      link: resetLink,
    };
    await resetPasswordMail(params);
    return res.status(200).json({
      message: "Password reset Link sent to your email",
      token,
    });
  } catch (error) {
    return res.status(401).json({ message: "Invalid User" });
  }
};

export const userResetPassword = async (req: JwtPayload, res: Response) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: `Password Mismatch`,
      });
    }
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?.&])[A-Za-z\d@$!%*?.&]{7,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: `Password must be at least 7 characters long and should contain at least one uppercase letter, one lowercase letter, one special character, and one number.`,
      });
    }
    // console.log(req)// Assuming you have user data in req.user
    const userId = req.user.id;
    const user = (await Users.findOne({
      where: { id: userId },
    })) as unknown as UserAttributes;

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const token = await GenerateToken({
      id: user.id,
      email: user.email,
    });

    res.cookie("token", token);
    // const new_salt = await GenerateSalt();
    const hash = await hashPassword(newPassword);

    const updatedUser = await Users.update(
      {
        password: hash,
      },
      { where: { id: userId } }
    );

    if (updatedUser) {
      return res.status(200).json({
        message: "You have successfully changed your password",
        id: user.id,
        email: user.email,
        role: user.role,
        token,
      });
    }

    return res.status(400).json({
      message: "Unsuccessful, contact Admin",
      user,
    });
  } catch (err: any) {
    console.log(err.message);
    return res.status(500).json({
      message: `Internal Server Error`,
    });
  }
};

export const updateUser = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.user.id;
    let {
      firstName,
      lastName,
      email,
      profilePic,
      phone,
      gender,
      occupation,
      date_of_birth,
      bvn,
      address,
      identification_number,
      identification_doc,
      proof_of_address_doc,
    } = req.body;
    console.log(req.files);
    const user = await Users.findOne({ where: { id: userId } });

    if (!user) {
      res.status(400).json({ message: "User not found" });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validation: Check if date of birth is in a valid format
    if (date_of_birth && !isValidDate(date_of_birth)) {
      return res.status(400).json({ message: "Invalid date of birth format" });
    }

    const updateField: Partial<UserAttributes> = {};

    if (firstName) {
      updateField.firstName = firstName;
    }
    if (lastName) {
      updateField.lastName = lastName;
    }
    if (email) {
      updateField.email = email;
    }
    const proPic = req.files?.["profilePic"]?.[0]?.path;

    if (proPic) {
      updateField.profilePic = proPic;
    }

    if (phone) {
      updateField.phone = phone;
    }
    if (gender) {
      updateField.gender = gender;
    }
    if (occupation) {
      updateField.occupation = occupation;
    }
    if (date_of_birth) {
      updateField.date_of_birth = date_of_birth;
    }
    if (bvn) {
      updateField.bvn = bvn;
    }
    if (address) {
      updateField.address = address;
    }
    if (identification_number) {
      updateField.identification_number = identification_number;
    }

    const identify_doc = req.files?.["identification_doc"]?.[0]?.path;
    if (identify_doc) {
      updateField.identification_doc = identify_doc; //req.file[1].path;
    }

    const proof_doc = req.files?.["proof_of_address_doc"]?.[0]?.path;
    if (proof_doc) {
      updateField.proof_of_address_doc = proof_doc; //req.file[2].path;
    }

    const [numOfUpdatedRows, updatedUsers] = await Users.update(updateField, {
      where: { id: userId },
      returning: true, // This option returns the updated rows
    });

    const updatedUser = await Users.findOne({ where: { id: userId } });

    // if (numOfUpdatedRows > 0) {
    return res
      .status(200)
      .json({ message: "User updated successfully", data: updatedUser });
    // } else {
    // return res.status(404).json({ message: "update failed" });
    // }
  } catch (error: any) {
    console.log(error.message);
    return res.status(500).json({
      message: `Internal Server Error`,
    });
  }
};

export const userChangePassword = async (req: JwtPayload, res: Response) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: `New Password and Confirm Password Mismatch`,
      });
    }
    if (oldPassword === newPassword)
      return res
        .status(400)
        .json({ message: `Old Password cannot be equal to New Password` });
    const userId = req.user.id;
    const user = (await Users.findOne({
      where: { id: userId },
    })) as unknown as UserAttributes;

    const checkPassword = await bcrypt.compare(oldPassword, user.password);

    if (!checkPassword) {
      return res.status(401).send({
        status: "error",
        method: req.method,
        message: "Old Password is Incorect",
      });
    }
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?.&])[A-Za-z\d@$!%*?.&]{7,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: `Password must be at least 7 characters long and should contain at least one uppercase letter, one lowercase letter, one special character, and one number.`,
      });
    }
    // console.log(req)// Assuming you have user data in req.user

    // const token = await GenerateToken({
    //   id: user.id,
    //   email: user.email,
    // });

    // res.cookie("token", token);
    // const new_salt = await GenerateSalt();
    const hash = await hashPassword(newPassword);

    const updatedUser = await Users.update(
      {
        password: hash,
      },
      { where: { id: userId } }
    );

    if (updatedUser) {
      return res.status(200).json({
        message: "You have successfully changed your password",
        id: user.id,
        email: user.email,
        role: user.role,
        // token,
      });
    }

    return res.status(400).json({
      message: "Unsuccessful, contact Admin",
      user,
    });
  } catch (err: any) {
    console.log(err.message);
    return res.status(500).json({
      message: `Internal Server Error`,
    });
  }
};

export const getAllUserTransactionsByUser = async (
  req: JwtPayload,
  res: Response
) => {
  try {
    const user_Id = req.user.id;

    if (user_Id) {
      const allUserTransactions:any = await Transactions.findAll({
        where: { owner_id: user_Id },
      }) as unknown as TransactionAttributes;

      if (allUserTransactions) {
        const mainTransactions = allUserTransactions.sort((a: { created_at: any; },b: { created_at: any; })=>b.created_at - a.created_at)
        return res.status(200).json({
          message: "All your transactions fetched successfully!",
          data: mainTransactions,
        });
      } else {
        return res.status(200).json({
          message: "No transactions yet",
        });
      }
    } else {
      res.status(400).json({
        message: "Please login to get all your transactions.",
      });
    }
  } catch (error) {
    console.error("ERROR");
  }
};

export const getTotalIncomePerMonth = async (
  req: JwtPayload,
  res: Response
) => {
  try {
    const userId = req.params.id; // Assuming you pass the user ID as a parameter
    const user = await Users.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const wallet = await Wallets.findOne({ where: { user_id: userId } });
    if (!wallet) {
      return res
        .status(404)
        .json({ message: "Wallet not found for this user" });
    }

    const currentDate = new Date();
    const startDate = new Date(user.created_at);
    const endDate = currentDate;

    // Assuming income is stored in an array called 'earnings' in the Wallet model
    const totalIncome = wallet.earnings
      .filter((income: any) => {
        const incomeDate = new Date(income.date); // Assuming each income has a 'date' property
        return incomeDate >= startDate && incomeDate <= endDate;
      })
      .reduce((total: any, income: any) => total + income.amount, 0);

    return res
      .status(200)
      .json({ message: "Total income fetched", totalIncome });
  } catch (error: any) {
    console.error("Error fetching total income per month:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserUpcomingActivities = async (
  req: JwtPayload,
  res: Response
) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    const allGroups = await Groups.findAll({
      where: {
        startDate: {
          [Op.lte]: currentDate,
        },
        endDate: {
          [Op.gte]: endOfMonth,
        },
      },
    });

    const groupsUserBelongs = allGroups.filter((group) => group.members.some((member: any)  => member.member_id === userId ) )

    if (!groupsUserBelongs || groupsUserBelongs.length === 0) {
      return res
        .status(400)
        .json({ message: `This user does not belong to any group` });
    }

    const contributions = [];

    for (const group of groupsUserBelongs) {
      const contributionAmount = group.contribution_amount;
      const groupName = group.title;
      const image = group.image;

      if (group.frequency === "Daily") {
        const daysInMonth = getDaysInMonth(
          currentDate.getMonth(),
          currentDate.getFullYear()
        );
        for (let day = 1; day <= daysInMonth; day++) {
          const contributionDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            day
          );
          const contributionObject = {
            groupName,
            contributionAmount,
            date: contributionDate,
            image,
          };
          if (contributionDate >= currentDate) {
            contributions.push(contributionObject);
          }
        }
      } else if (group.frequency === "Weekly") {
        const lastDayOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0
        );
        let currentWeekDate = getNextFriday(currentDate);

        while (currentWeekDate <= lastDayOfMonth) {
          const contributionObject = {
            groupName,
            contributionAmount,
            date: currentWeekDate,
            image,
          };
          if (currentWeekDate >= currentDate) {
            contributions.push(contributionObject);
          }
          currentWeekDate = new Date(
            currentWeekDate.getTime() + 7 * 24 * 60 * 60 * 1000
          );
        }
      } else if (group.frequency === "Monthly") {
        const lastDayOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0
        );
        const contributionObject = {
          groupName,
          contributionAmount,
          date: lastDayOfMonth,
          image,
        };
        if (lastDayOfMonth >= currentDate) {
          contributions.push(contributionObject);
        }
      }
    }
    return res.status(200).json({ contributions });
  } catch (error: any) {
    console.error("Error fetching upcoming activities:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getTotalIncomePerMonthWithinAPeriod = async (
  req: JwtPayload,
  res: Response
) => {
  try {
    const userId = req.params.id;
    const user = await Users.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const wallet = await Wallets.findOne({ where: { user_id: userId } });
    if (!wallet) {
      return res
        .status(404)
        .json({ message: "Wallet not found for this user" });
    }

    const currentDate = new Date();
    const startDate = new Date(currentDate);
    startDate.setMonth(startDate.getMonth() - 12); // Go back 12 months

    const monthlyIncomes = [];

    // Calculate income for each month within the last 12 months
    for (let i = 0; i < 12; i++) {
      const startOfMonth = new Date(startDate);
      startOfMonth.setMonth(startOfMonth.getMonth() + i);
      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);

      const totalIncome = wallet.earnings
        .filter((income: any) => {
          const incomeDate = new Date(income.date);
          return incomeDate >= startOfMonth && incomeDate < endOfMonth;
        })
        .reduce((total: any, income: any) => total + income.amount, 0);

      monthlyIncomes.push({
        month: startOfMonth.toLocaleString("en-us", { month: "short" }),
        totalIncome,
      });
    }

    return res
      .status(200)
      .json({ message: "Monthly incomes fetched", monthlyIncomes });
  } catch (error: any) {
    console.error("Error fetching monthly incomes:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const withdrawFromUserGroupWallet = async (
  req: JwtPayload,
  res: Response
) => {
  try {
    //retrive userId and withdraw amount from token & body.
    const userId = req.user.id;
    let { amount } = req.body;
    amount = +amount;

    console.log(typeof amount);

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized user",
      });
    }

    //get wallets
    const globalWallet = (await Wallets.findOne({
      where: { user_id: userId, type: type.GLOBAL },
    })) as unknown as WalletAttributes;

    const groupWallet = (await Wallets.findOne({
      where: { user_id: userId, type: type.GROUP_WALLET },
    })) as unknown as WalletAttributes;

    if (!globalWallet || !groupWallet) {
      return res.status(404).json({
        message: "Wallet not found",
      });
    }

    //get user
    const user = Users.findOne({
      where: { id: userId },
    }) as unknown as UserAttributes;
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Checked if the user has sufficient funds in his/her wallet
    if (groupWallet.total_amount < amount) {
      return res.status(400).json({
        message: "Insufficient funds in your group wallet",
      });
    }

    if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        message: "Invalid amount",
      });
    }

    //calculate new balances.
    const newGlobalBalance = globalWallet.total_amount + amount;
    const newGroupBalance = groupWallet.total_amount - amount;

    //update wallets with new balances
    (await Wallets.update(
      {
        total_amount: newGlobalBalance,
      },
      { where: { user_id: userId, type: type.GLOBAL } }
    )) as unknown as WalletAttributes;

    (await Wallets.update(
      {
        total_amount: newGroupBalance,
      },
      { where: { user_id: userId, type: type.GROUP_WALLET } }
    )) as unknown as WalletAttributes;

    //find updated wallets
    const newGlobalWallet = (await Wallets.findOne({
      where: { user_id: userId, type: type.GLOBAL },
    })) as unknown as WalletAttributes;

    const newGroupWallet = (await Wallets.findOne({
      where: { user_id: userId, type: type.GROUP_WALLET },
    })) as unknown as WalletAttributes;

    //create a transaction
    const transId = v4();
    const internalWithdrawal = (await Transactions.create({
      id: transId,
      wallet_id: newGroupWallet.id,
      owner_id: userId,
      amount: amount,
      status: transaction_status.SUCCESSFUL,
      action: action.DEBIT,
      type: transaction_type.GROUP_WALLET,
      receiver: newGlobalWallet.id,
      created_at: new Date(),
    })) as unknown as TransactionAttributes;

    return res.status(200).json({
      message: "Amount withdrawn successfully",
      data: {
        newGlobalWallet,
        newGroupWallet,
        internalWithdrawal,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const withdrawFromUserSavingsWallet = async (
  req: JwtPayload,
  res: Response
) => {
  try {
    //retrive userId and withdraw amount from token & body.
    const userId = req.user.id;
    let { amount } = req.body;
    amount = +amount;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized user",
      });
    }

    //get wallets
    const globalWallet = (await Wallets.findOne({
      where: { user_id: userId, type: type.GLOBAL },
    })) as unknown as WalletAttributes;

    const savingsWallet = (await Wallets.findOne({
      where: { user_id: userId, type: type.SAVINGS },
    })) as unknown as WalletAttributes;

    if (!globalWallet || !savingsWallet) {
      return res.status(404).json({
        message: "Wallet not found",
      });
    }

    //get user
    const user = Users.findOne({
      where: { id: userId },
    }) as unknown as UserAttributes;
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Checked if the user has sufficient funds in his/her wallet
    if (savingsWallet.total_amount < amount) {
      return res.status(400).json({
        message: "Insufficient funds in your savings wallet",
      });
    }

    if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        message: "Invalid amount",
      });
    }

    //calculate new balances.
    const newGlobalBalance = globalWallet.total_amount + amount;
    const newSavinsBalance = savingsWallet.total_amount - amount;

    //update wallets with new balances
    (await Wallets.update(
      {
        total_amount: newGlobalBalance,
      },
      { where: { user_id: userId, type: type.GLOBAL } }
    )) as unknown as WalletAttributes;

    (await Wallets.update(
      {
        total_amount: newSavinsBalance,
      },
      { where: { user_id: userId, type: type.SAVINGS } }
    )) as unknown as WalletAttributes;

    //find updated wallets
    const newGlobalWallet = (await Wallets.findOne({
      where: { user_id: userId, type: type.GLOBAL },
    })) as unknown as WalletAttributes;

    const newSavingsWallet = (await Wallets.findOne({
      where: { user_id: userId, type: type.SAVINGS },
    })) as unknown as WalletAttributes;

    //create a transaction
    const transId = v4();
    const internalWithdrawal = (await Transactions.create({
      id: transId,
      wallet_id: newSavingsWallet.id,
      owner_id: userId,
      amount: amount,
      status: transaction_status.SUCCESSFUL,
      action: action.DEBIT,
      type: transaction_type.SAVINGS,
      receiver: newGlobalWallet.id,
      created_at: new Date(),
    })) as unknown as TransactionAttributes;

    return res.status(200).json({
      message: "Amount withdrawn successfully",
      data: {
        newGlobalWallet,
        newSavingsWallet,
        internalWithdrawal,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const getGlobalWallet = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.user.id;
    const globalWallet = await Wallets.findOne({
      where: { user_id: userId, type: "Global" },
    });
    if (!globalWallet)
      return res.status(404).json({ message: `Wallet not found` });
    return res
      .status(200)
      .json({ message: `Wallet fetched successfully `, data: globalWallet });
  } catch (err: any) {
    console.log(err.message);
    return res.status(500).json({
      message: `Internal Server Error`,
    });
  }
};
