import { Request, Response, NextFunction } from "express";
import Users from "../../../models/users";
import { JwtPayload } from "jsonwebtoken";
import Wallets, { WalletAttributes, type } from "../../../models/wallets";
import { UserAttributes } from "../../../models/users";
import Savings, { SavingAttributes } from "../../../models/savings";
import { v4 } from "uuid";
import jwt from "jsonwebtoken";
import { validateCreateTarget } from "../../../utils/validation/validators";
import { Transporter } from "nodemailer";
import Transactions, {
  action,
  transaction_status,
  transaction_type,
} from "../../../models/transactions";
import { transporter } from "../../../utils/notification";
import { error, info } from "console";

export const userGetSingleTarget = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.user.id;
    const savingsId = req.params.savingsId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized User",
      });
    }

    const target = await Savings.findOne({
      where: { id: savingsId, user_id: userId },
    });

    if (!target) {
      return res.status(404).json({
        message: "Target not found",
      });
    }
    const endDate: any = new Date(target.endDate);
    const currentDate: any = new Date();
    const daysLeft: Number = Math.ceil(
      (endDate - currentDate) / (1000 * 60 * 60 * 24)
    );

    return res.status(200).json({
      message: "Target details successfully fetched",
      data: { ...target.dataValues, days_left: daysLeft },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const userFundTarget = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.user.id;
    const savingsId = req.params.savingsId;
    const { amountToFund } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized user",
      });
    }

    const wallet = (await Wallets.findOne({
      where: { user_id: userId, type: type.SAVINGS },
    })) as unknown as WalletAttributes;

    const user = (await Users.findOne({
      where: { id: userId },
    })) as unknown as UserAttributes;

    const target = (await Savings.findOne({
      where: { id: savingsId, user_id: userId },
    })) as unknown as SavingAttributes;

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!wallet) {
      return res.status(404).json({
        message: "Wallet not found",
      });
    }

    if (!target) {
      return res.status(404).json({
        message: "Target not found",
      });
    }

    // Check if the user has sufficient funds in their wallet
    if (wallet.total_amount < amountToFund) {
      return res.status(400).json({
        message: "Insufficient funds in your wallet",
      });
    }

    if (amountToFund <= 0) {
      return res.status(400).json({
        message: "Invalid amount",
      });
    }

    // Calculate new amounts
    let new_target_amount = target.amount_saved + amountToFund;
    let new_wallet_amount = wallet.total_amount - amountToFund;
    let personal_savings = wallet.total_personal_savings + amountToFund;

    // Update wallet and target
    const updatedWallet = (await Wallets.update(
      {
        total_amount: new_wallet_amount,
        total_personal_savings: personal_savings,
      },
      { where: { id: wallet.id } }
    )) as unknown as WalletAttributes;

    const updatedTarget = (await Savings.update(
      { amount_saved: new_target_amount },
      { where: { id: savingsId, user_id: userId } }
    )) as unknown as SavingAttributes;

    if (updatedWallet && updatedTarget) {
      const transId = v4();
      const transaction = await Transactions.create({
        id: v4(),
        wallet_id: wallet.id,
        owner_id: userId,
        amount: amountToFund,
        status: transaction_status.SUCCESSFUL,
        action: action.DEBIT,
        type: transaction_type.SAVINGS,
        receiver: target.name,
        created_at: new Date(),
      });

      if (transaction) {
        const sendMail = {
          from: "honorabletunde@gmail.com",
          to: "Afinjuomooluwatunde17@gmail.com",
          subject: "Transaction Receipt",
          html: ` <p>Dear User,</p>
          <p>Your transaction with ID ${transId} has been successfully processed.</p>
          <p>Details:</p>
          <ul>
            <li>Transaction ID: ${transId}</li>
            <li>Amount: ${amountToFund}</li>
            <li>Status: Transfer Successful</li>
            <li>Action: Debit</li>
            <li>Type: Savings</li>
          </ul>
          <p>Thank you for using our service!</p>`,
        };

        // Send the email

        try {
          await transporter.sendMail(sendMail);
        } catch (error) {
          console.log("Error sending email", error);
        }

        // Fetch the updated wallet and target data
        const findNewWallet = (await Wallets.findOne({
          where: { user_id: userId },
        })) as unknown as WalletAttributes;

        const findNewTarget = (await Savings.findOne({
          where: { id: savingsId, user_id: userId },
        })) as unknown as SavingAttributes;

        // Return response based on email sending status

        return res.status(200).json({
          message: "Target funded successfully!",
          data: {
            findNewWallet,
            findNewTarget,
          },
        });
      }
    } else {
      return res.status(400).json({
        message: `Unable to fund Target`,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const userWithdrawTarget = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.user.id;
    const savingsId = req.params.savingsId;
    const { amountToWithdraw } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized user",
      });
    }

    const wallet = (await Wallets.findOne({
      where: { user_id: userId, type: type.SAVINGS },
    })) as unknown as WalletAttributes;
    const user = (await Users.findOne({
      where: { id: userId },
    })) as unknown as UserAttributes;
    const target = (await Savings.findOne({
      where: { id: savingsId, user_id: userId },
    })) as unknown as SavingAttributes;
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    if (!wallet) {
      return res.status(404).json({
        message: "Wallet not found",
      });
    }
    if (!target) {
      return res.status(404).json({
        message: "Target not found",
      });
    }
    // Checked if the user has sufficient funds in his/her wallet
    if (target.amount_saved < amountToWithdraw) {
      return res.status(400).json({
        message: "Insufficient funds in your target wallet",
      });
    }
    if (amountToWithdraw <= 0) {
      return res.status(400).json({
        message: "Invalid amount",
      });
    }

    // Updated the target's amount and deduct the money from the user's wallet

    //get the target amount saved and deduct the new amount to it
    let new_target_amount = target.amount_saved;
    new_target_amount -= amountToWithdraw;

    //get the wallet balance and add the new amount
    let new_wallet_amount = wallet.total_amount;
    new_wallet_amount += amountToWithdraw;

    //reduce the user's personal savings
    let personal_savings = wallet.total_personal_savings;
    personal_savings -= amountToWithdraw;

    //save all variables to the wallets table and savings table
    const updatedWallet = (await Wallets.update(
      {
        total_amount: new_wallet_amount,
        total_personal_savings: personal_savings,
      },
      { where: { id: wallet.id } }
    )) as unknown as WalletAttributes;
    const updatedTarget = (await Savings.update(
      { amount_saved: new_target_amount },
      { where: { id: savingsId, user_id: userId } }
    )) as unknown as SavingAttributes;
    const findNewWallet = (await Wallets.findOne({
      where: { user_id: userId },
    })) as unknown as WalletAttributes;
    const findNewTarget = (await Savings.findOne({
      where: { id: savingsId, user_id: userId },
    })) as unknown as SavingAttributes;

    if (updatedWallet && updatedTarget) {
      const transId = v4();
      const withdrawal = await Transactions.create({
        id: v4(),
        wallet_id: wallet.id,
        owner_id: userId,
        amount: amountToWithdraw,
        status: transaction_status.SUCCESSFUL,
        action: action.DEBIT,
        type: transaction_type.SAVINGS,
        receiver: "self",
        created_at: new Date(),
      });
      if (withdrawal) {
        const sendMail = {
          from: "honorabletunde@gmail.com",
          to: "Afinjuomooluwatunde17@gmail.com",
          subject: "Transaction Receipt",
          html: ` <p>Dear User,</p>
          <p>Your withdrawal with ID ${transId} has been successfully processed.</p>
          <p>Details:</p>
          <ul>
            <li>Transaction ID: ${transId}</li>
            <li>Amount: ${amountToWithdraw}</li>
            <li>Status: Withdrawal Successful</li>
            <li>Action: Debit</li>
            <li>Type: Savings</li>
          </ul>
          <p>Thank you for using our service!</p>`,
        };
        try {
          await transporter.sendMail(sendMail);
        } catch (error) {
          console.log("Error sending email", error);
        }
      } else {
        console.log("Email sent successfully");
      }
      return res.status(200).json({
        message: "Amount withdrawn successfully",
        data: {
          findNewWallet,
          findNewTarget,
        },
      });
    }
    return res.status(400).json({
      message: `Unable to withdraw`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const createTarget = async (req: JwtPayload, res: Response) => {
  try {
    const schema = validateCreateTarget;
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const userId = req.user.id;

    if (userId) {
      const {
        name,
        target,
        target_amount,
        category,
        frequency,
        startDate,
        endDate,
      } = req.body;

      // Create a new savings target in the database
      const newSavings = (await Savings.create({
        id: v4(),
        user_id: userId,
        name,
        target,
        frequency,
        startDate: new Date(startDate).toISOString(),
        category,
        endDate: new Date(endDate).toISOString(),
        target_amount,
        amount_saved: 0,
        created_at: new Date(),
      })) as unknown as SavingAttributes;

      // Send a success response with the created savings target
      res.status(201).json({
        message: `Savings target ${name} created successfully`,
        data: newSavings,
      });
    } else {
      return res.status(400).json({
        message: `You are not an AUTHENTICATED USER`,
      });
    }
  } catch (error: any) {
    // Handle any errors and send an error response
    console.error("Error creating savings target:", error.message);
    res.status(500).json({
      error: "Internal Server Error",
      // message: error.name
    });
  }
};

export const getAllTargetsByUser = async (req: JwtPayload, res: Response) => {
  try {
    const user_Id = req.user.id;

    if (user_Id) {
      const target_Details: any = await Savings.findAll({
        where: { user_id: user_Id },
        order: [["createdAt", "DESC"]],
      });

      if (target_Details) {
        res.status(200).json({
          message: "All savings target fetched successfully!",
          data: target_Details,
        });
      } else {
        res.status(400).json({
          message: "No saving yet!",
        });
      }
    } else {
      res.status(400).json({
        message: "Please login to get all your savings target.",
      });
    }
  } catch (error) {
    console.error(error),
      res.status(500).json({
        error: "Internal server error",
      });
  }
};

export const getUserTargetsAmount = async (req: JwtPayload, res: Response) => {
  try {
    const user_Id = req.user.id;

    const target_Details: any = (await Savings.findAll({
      where: { user_id: user_Id },
    })) as unknown as SavingAttributes;

    if (target_Details) {
      let target_amount = 0;
      for (let i = 0; i < target_Details.length; i++) {
        target_amount += target_Details[i].amount_saved;
      }
      res.status(200).json({
        message: "Target amount fetched",
        data: target_amount,
      });
    } else {
      res.status(400).json({
        message: "No saving yet!",
      });
    }
  } catch (error) {
    console.error(error),
      res.status(500).json({
        error: "Internal server error",
      });
  }
};
