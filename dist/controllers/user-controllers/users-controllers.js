"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGlobalWallet = exports.withdrawFromUserSavingsWallet = exports.withdrawFromUserGroupWallet = exports.getTotalIncomePerMonthWithinAPeriod = exports.getUserUpcomingActivities = exports.getTotalIncomePerMonth = exports.getAllUserTransactionsByUser = exports.userChangePassword = exports.updateUser = exports.userResetPassword = exports.verifyChangePasswordEmail = exports.loginUser = exports.resendOTP = exports.verifyOTP = exports.sendOTP = exports.createUser = void 0;
const users_1 = __importDefault(require("../../models/users"));
const groups_1 = __importDefault(require("../../models/groups"));
const helpers_1 = require("../../utils/helpers");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const validators_1 = require("../../utils/validation/validators");
const wallets_1 = __importStar(require("../../models/wallets"));
const users_2 = require("../../models/users");
const uuid_1 = require("uuid");
const notification_1 = require("../../utils/notification");
const sequelize_1 = require("sequelize");
const helpers_2 = require("../../utils/helpers");
const settings_1 = __importDefault(require("../../models/settings"));
const transactions_1 = __importStar(require("../../models/transactions"));
const crypto_1 = require("crypto");
const createUser = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password, confirm_password } = req.body;
        const validate = await validators_1.registerSchema.validateAsync(req.body);
        if (validate.error) {
            console.log("error", validate);
            return res.status(400).json({
                Error: validate.error.details[0].message,
            });
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?.&])[A-Za-z\d@$!%*?.&]{7,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: `Password must be at least 7 characters long and should contain at least one uppercase letter, one lowercase letter, one special character, and one number.`,
            });
        }
        if (password !== confirm_password)
            return res.status(400).json({ message: `Password mismatch` });
        const userId = (0, uuid_1.v4)();
        const newEmail = email.trim().toLowerCase();
        const checkUserMail = await users_1.default.findOne({ where: { email: newEmail } });
        if (checkUserMail)
            return res.status(400).json({ message: `${newEmail} is already in use` });
        const checkUserPhone = await users_1.default.findOne({ where: { phone } });
        if (checkUserPhone)
            return res.status(400).json({ message: `${phone} is already in use` });
        const hashedPassword = await (0, helpers_1.hashPassword)(password);
        // Generate OTP
        const otp = generateOTP();
        // Create the user record with an initial OTP (not seen or verified)
        const newUser = (await users_1.default.create({
            id: userId,
            firstName,
            lastName,
            email: newEmail,
            profilePic: "",
            password: hashedPassword,
            role: users_2.role.CONTRIBUTOR,
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
        }));
        // Send OTP to the user's email
        await sendOTPByEmail(email, otp);
        const findUser = (await users_1.default.findOne({
            where: { email: newUser.email },
        }));
        if (findUser) {
            const payload = {
                id: findUser.id,
                email: findUser.email,
            };
            const token = await (0, helpers_1.GenerateToken)(payload);
            // Create global wallet
            const globalWalletId = (0, uuid_1.v4)();
            const newGlobalWallet = (await wallets_1.default.create({
                id: globalWalletId,
                user_id: findUser.id,
                total_amount: 0,
                type: wallets_1.type.GLOBAL,
                total_group_savings: 200000,
                total_personal_savings: 200000,
                total_income: 0,
                earnings: [],
                created_at: new Date(),
            }));
            const wallet = (await wallets_1.default.findOne({
                where: { id: newGlobalWallet.id },
            }));
            // Create savings wallet
            const savingsWalletId = (0, uuid_1.v4)();
            const newSavingsWallet = (await wallets_1.default.create({
                id: savingsWalletId,
                user_id: findUser.id,
                total_amount: 0,
                type: wallets_1.type.SAVINGS,
                total_group_savings: 0,
                total_personal_savings: 0,
                total_income: 0,
                earnings: [],
                created_at: new Date(),
            }));
            const savingsWallet = (await wallets_1.default.findOne({
                where: { id: newSavingsWallet.id },
            }));
            // Create group wallet
            const personalGroupWalletId = (0, uuid_1.v4)();
            const newpersonalGroupWallet = (await wallets_1.default.create({
                id: personalGroupWalletId,
                user_id: findUser.id,
                total_amount: 0,
                type: wallets_1.type.GROUP_WALLET,
                total_group_savings: 0,
                total_personal_savings: 0,
                total_income: 0,
                earnings: [],
                created_at: new Date(),
            }));
            const personalGroupWallet = (await wallets_1.default.findOne({
                where: { id: newpersonalGroupWallet.id },
            }));
            if (!wallet || !savingsWallet || !personalGroupWallet) {
                await users_1.default.destroy({ where: { id: findUser.id } });
                return res.status(400).json({
                    message: `Unable to register User`,
                });
            }
            // Create settings for the user
            await settings_1.default.create({ id: (0, uuid_1.v4)(), owner_id: userId });
            return res.status(200).json({
                message: `Registration Successful. An OTP has been sent to your email.`,
                User: findUser,
                globalWallet: wallet,
                groupWallet: personalGroupWallet,
                savingsWallet: savingsWallet,
                token,
            });
        }
    }
    catch (err) {
        console.log(err.message);
        return res.status(500).json({
            message: `Internal Server Error`,
        });
    }
};
exports.createUser = createUser;
const sendOTP = async (req, res) => {
    const { email } = req.body;
    let otp = generateOTP();
    // Send OTP to the user's email
    await sendOTPByEmail(email, otp);
    res.json({
        message: "OTP sent successfully",
    });
};
exports.sendOTP = sendOTP;
const verifyOTP = async (req, res) => {
    const { otp } = req.body;
    const user_Id = req.user.id;
    try {
        // Find the user by email
        const user = await users_1.default.findOne({ where: { id: user_Id } });
        if (!user) {
            return res.status(400).json({
                message: "User not found.",
            });
        }
        if (user.otp === otp) {
            // OTP is valid
            // Remove the OTP from the user's record
            user.otp = null;
            await user.save();
            res.json({
                message: "OTP verified successfully",
            });
        }
        else {
            res.status(401).json({
                message: "Invalid OTP",
            });
        }
    }
    catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
};
exports.verifyOTP = verifyOTP;
const resendOTP = async (req, res) => {
    const user_id = req.user.id;
    // Find the user by id
    const user = (await users_1.default.findOne({
        where: { id: user_id },
    }));
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
exports.resendOTP = resendOTP;
const generateOTP = () => {
    let otp = (0, crypto_1.randomBytes)(2).readUInt16BE(0).toString();
    otp = otp.padStart(4, "0"); // Generate a 4-digit OTP
    return otp;
};
const sendOTPByEmail = async (email, otp) => {
    try {
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: "OTP for User Registration",
            text: `Your OTP is: ${otp}`,
        };
        const info = await notification_1.transporter.sendMail(mailOptions);
        console.log("Email sent:" + info.response);
    }
    catch (error) {
        console.error(error);
        // Handle email sending failure
    }
};
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const validator = await validators_1.loginSchema.validateAsync(req.body);
        if (validator.error) {
            return res.status(400).json({
                Error: validator.error.details[0].message,
            });
        }
        const confirmUser = (await users_1.default.findOne({
            where: { email: email },
        }));
        if (!confirmUser) {
            return res.status(400).json({ message: `User does not exist` });
        }
        const confirm_password = await bcryptjs_1.default.compare(password, confirmUser.password);
        if (!confirm_password) {
            return res.status(401).send({
                status: "error",
                method: req.method,
                message: "Password is Incorect",
            });
        }
        const token = await (0, helpers_1.GenerateToken)({
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
    }
    catch (err) {
        console.log(err.message);
        return res.status(500).json({ message: `Internal Server Error` });
    }
};
exports.loginUser = loginUser;
const verifyChangePasswordEmail = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await users_1.default.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: "User does not exist" });
        }
        const token = await (0, helpers_1.GenerateToken)({
            id: user.id,
            email: user.email,
        });
        const resetLink = `${process.env.RESET_PASSWORD_URL}?token=${token}`;
        const params = {
            to: email,
            link: resetLink,
        };
        await (0, notification_1.resetPasswordMail)(params);
        return res.status(200).json({
            message: "Password reset Link sent to your email",
            token,
        });
    }
    catch (error) {
        return res.status(401).json({ message: "Invalid User" });
    }
};
exports.verifyChangePasswordEmail = verifyChangePasswordEmail;
const userResetPassword = async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body;
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                message: `Password Mismatch`,
            });
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?.&])[A-Za-z\d@$!%*?.&]{7,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                message: `Password must be at least 7 characters long and should contain at least one uppercase letter, one lowercase letter, one special character, and one number.`,
            });
        }
        // console.log(req)// Assuming you have user data in req.user
        const userId = req.user.id;
        const user = (await users_1.default.findOne({
            where: { id: userId },
        }));
        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }
        const token = await (0, helpers_1.GenerateToken)({
            id: user.id,
            email: user.email,
        });
        res.cookie("token", token);
        // const new_salt = await GenerateSalt();
        const hash = await (0, helpers_1.hashPassword)(newPassword);
        const updatedUser = await users_1.default.update({
            password: hash,
        }, { where: { id: userId } });
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
    }
    catch (err) {
        console.log(err.message);
        return res.status(500).json({
            message: `Internal Server Error`,
        });
    }
};
exports.userResetPassword = userResetPassword;
const updateUser = async (req, res) => {
    try {
        const userId = req.user.id;
        let { firstName, lastName, email, profilePic, phone, gender, occupation, date_of_birth, bvn, address, identification_number, identification_doc, proof_of_address_doc, } = req.body;
        console.log(req.files);
        const user = await users_1.default.findOne({ where: { id: userId } });
        if (!user) {
            res.status(400).json({ message: "User not found" });
        }
        if (email && !(0, helpers_1.isValidEmail)(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }
        // Validation: Check if date of birth is in a valid format
        if (date_of_birth && !(0, helpers_1.isValidDate)(date_of_birth)) {
            return res.status(400).json({ message: "Invalid date of birth format" });
        }
        const updateField = {};
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
        const [numOfUpdatedRows, updatedUsers] = await users_1.default.update(updateField, {
            where: { id: userId },
            returning: true, // This option returns the updated rows
        });
        const updatedUser = await users_1.default.findOne({ where: { id: userId } });
        // if (numOfUpdatedRows > 0) {
        return res
            .status(200)
            .json({ message: "User updated successfully", data: updatedUser });
        // } else {
        // return res.status(404).json({ message: "update failed" });
        // }
    }
    catch (error) {
        console.log(error.message);
        return res.status(500).json({
            message: `Internal Server Error`,
        });
    }
};
exports.updateUser = updateUser;
const userChangePassword = async (req, res) => {
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
        const user = (await users_1.default.findOne({
            where: { id: userId },
        }));
        const checkPassword = await bcryptjs_1.default.compare(oldPassword, user.password);
        if (!checkPassword) {
            return res.status(401).send({
                status: "error",
                method: req.method,
                message: "Old Password is Incorect",
            });
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?.&])[A-Za-z\d@$!%*?.&]{7,}$/;
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
        const hash = await (0, helpers_1.hashPassword)(newPassword);
        const updatedUser = await users_1.default.update({
            password: hash,
        }, { where: { id: userId } });
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
    }
    catch (err) {
        console.log(err.message);
        return res.status(500).json({
            message: `Internal Server Error`,
        });
    }
};
exports.userChangePassword = userChangePassword;
const getAllUserTransactionsByUser = async (req, res) => {
    try {
        const user_Id = req.user.id;
        if (user_Id) {
            const allUserTransactions = await transactions_1.default.findAll({
                where: { owner_id: user_Id },
            });
            if (allUserTransactions) {
                const mainTransactions = allUserTransactions.sort((a, b) => b.created_at - a.created_at);
                return res.status(200).json({
                    message: "All your transactions fetched successfully!",
                    data: mainTransactions,
                });
            }
            else {
                return res.status(200).json({
                    message: "No transactions yet",
                });
            }
        }
        else {
            res.status(400).json({
                message: "Please login to get all your transactions.",
            });
        }
    }
    catch (error) {
        console.error("ERROR");
    }
};
exports.getAllUserTransactionsByUser = getAllUserTransactionsByUser;
const getTotalIncomePerMonth = async (req, res) => {
    try {
        const userId = req.params.id; // Assuming you pass the user ID as a parameter
        const user = await users_1.default.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const wallet = await wallets_1.default.findOne({ where: { user_id: userId } });
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
            .filter((income) => {
            const incomeDate = new Date(income.date); // Assuming each income has a 'date' property
            return incomeDate >= startDate && incomeDate <= endDate;
        })
            .reduce((total, income) => total + income.amount, 0);
        return res
            .status(200)
            .json({ message: "Total income fetched", totalIncome });
    }
    catch (error) {
        console.error("Error fetching total income per month:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.getTotalIncomePerMonth = getTotalIncomePerMonth;
const getUserUpcomingActivities = async (req, res) => {
    try {
        const userId = req.user.id;
        const currentDate = new Date();
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const allGroups = await groups_1.default.findAll({
            where: {
                startDate: {
                    [sequelize_1.Op.lte]: currentDate,
                },
                endDate: {
                    [sequelize_1.Op.gte]: endOfMonth,
                },
            },
        });
        const groupsUserBelongs = allGroups.filter((group) => group.members.some((member) => member.member_id === userId));
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
                const daysInMonth = (0, helpers_2.getDaysInMonth)(currentDate.getMonth(), currentDate.getFullYear());
                for (let day = 1; day <= daysInMonth; day++) {
                    const contributionDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
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
            }
            else if (group.frequency === "Weekly") {
                const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                let currentWeekDate = (0, helpers_2.getNextFriday)(currentDate);
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
                    currentWeekDate = new Date(currentWeekDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                }
            }
            else if (group.frequency === "Monthly") {
                const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
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
    }
    catch (error) {
        console.error("Error fetching upcoming activities:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.getUserUpcomingActivities = getUserUpcomingActivities;
const getTotalIncomePerMonthWithinAPeriod = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await users_1.default.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const wallet = await wallets_1.default.findOne({ where: { user_id: userId } });
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
                .filter((income) => {
                const incomeDate = new Date(income.date);
                return incomeDate >= startOfMonth && incomeDate < endOfMonth;
            })
                .reduce((total, income) => total + income.amount, 0);
            monthlyIncomes.push({
                month: startOfMonth.toLocaleString("en-us", { month: "short" }),
                totalIncome,
            });
        }
        return res
            .status(200)
            .json({ message: "Monthly incomes fetched", monthlyIncomes });
    }
    catch (error) {
        console.error("Error fetching monthly incomes:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.getTotalIncomePerMonthWithinAPeriod = getTotalIncomePerMonthWithinAPeriod;
const withdrawFromUserGroupWallet = async (req, res) => {
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
        const globalWallet = (await wallets_1.default.findOne({
            where: { user_id: userId, type: wallets_1.type.GLOBAL },
        }));
        const groupWallet = (await wallets_1.default.findOne({
            where: { user_id: userId, type: wallets_1.type.GROUP_WALLET },
        }));
        if (!globalWallet || !groupWallet) {
            return res.status(404).json({
                message: "Wallet not found",
            });
        }
        //get user
        const user = users_1.default.findOne({
            where: { id: userId },
        });
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
        (await wallets_1.default.update({
            total_amount: newGlobalBalance,
        }, { where: { user_id: userId, type: wallets_1.type.GLOBAL } }));
        (await wallets_1.default.update({
            total_amount: newGroupBalance,
        }, { where: { user_id: userId, type: wallets_1.type.GROUP_WALLET } }));
        //find updated wallets
        const newGlobalWallet = (await wallets_1.default.findOne({
            where: { user_id: userId, type: wallets_1.type.GLOBAL },
        }));
        const newGroupWallet = (await wallets_1.default.findOne({
            where: { user_id: userId, type: wallets_1.type.GROUP_WALLET },
        }));
        //create a transaction
        const transId = (0, uuid_1.v4)();
        const internalWithdrawal = (await transactions_1.default.create({
            id: transId,
            wallet_id: newGroupWallet.id,
            owner_id: userId,
            amount: amount,
            status: transactions_1.transaction_status.SUCCESSFUL,
            action: transactions_1.action.DEBIT,
            type: transactions_1.transaction_type.GROUP_WALLET,
            receiver: newGlobalWallet.id,
            created_at: new Date(),
        }));
        return res.status(200).json({
            message: "Amount withdrawn successfully",
            data: {
                newGlobalWallet,
                newGroupWallet,
                internalWithdrawal,
            },
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};
exports.withdrawFromUserGroupWallet = withdrawFromUserGroupWallet;
const withdrawFromUserSavingsWallet = async (req, res) => {
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
        const globalWallet = (await wallets_1.default.findOne({
            where: { user_id: userId, type: wallets_1.type.GLOBAL },
        }));
        const savingsWallet = (await wallets_1.default.findOne({
            where: { user_id: userId, type: wallets_1.type.SAVINGS },
        }));
        if (!globalWallet || !savingsWallet) {
            return res.status(404).json({
                message: "Wallet not found",
            });
        }
        //get user
        const user = users_1.default.findOne({
            where: { id: userId },
        });
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
        (await wallets_1.default.update({
            total_amount: newGlobalBalance,
        }, { where: { user_id: userId, type: wallets_1.type.GLOBAL } }));
        (await wallets_1.default.update({
            total_amount: newSavinsBalance,
        }, { where: { user_id: userId, type: wallets_1.type.SAVINGS } }));
        //find updated wallets
        const newGlobalWallet = (await wallets_1.default.findOne({
            where: { user_id: userId, type: wallets_1.type.GLOBAL },
        }));
        const newSavingsWallet = (await wallets_1.default.findOne({
            where: { user_id: userId, type: wallets_1.type.SAVINGS },
        }));
        //create a transaction
        const transId = (0, uuid_1.v4)();
        const internalWithdrawal = (await transactions_1.default.create({
            id: transId,
            wallet_id: newSavingsWallet.id,
            owner_id: userId,
            amount: amount,
            status: transactions_1.transaction_status.SUCCESSFUL,
            action: transactions_1.action.DEBIT,
            type: transactions_1.transaction_type.SAVINGS,
            receiver: newGlobalWallet.id,
            created_at: new Date(),
        }));
        return res.status(200).json({
            message: "Amount withdrawn successfully",
            data: {
                newGlobalWallet,
                newSavingsWallet,
                internalWithdrawal,
            },
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};
exports.withdrawFromUserSavingsWallet = withdrawFromUserSavingsWallet;
const getGlobalWallet = async (req, res) => {
    try {
        const userId = req.user.id;
        const globalWallet = await wallets_1.default.findOne({
            where: { user_id: userId, type: "Global" },
        });
        if (!globalWallet)
            return res.status(404).json({ message: `Wallet not found` });
        return res
            .status(200)
            .json({ message: `Wallet fetched successfully `, data: globalWallet });
    }
    catch (err) {
        console.log(err.message);
        return res.status(500).json({
            message: `Internal Server Error`,
        });
    }
};
exports.getGlobalWallet = getGlobalWallet;
