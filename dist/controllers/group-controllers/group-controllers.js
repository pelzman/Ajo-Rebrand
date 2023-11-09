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
exports.getSingleGroupTransactions = exports.userContributesToAGroup = exports.leaveGroup = exports.joinGroup = exports.getAllMemberGroups = exports.userGetSingleGroup = exports.getAllGroups = exports.getAllUsersGroups = exports.createGroup = void 0;
const groups_1 = __importDefault(require("../../models/groups")); // Import your Sequelize model
const users_1 = __importDefault(require("../../models/users"));
const uuid_1 = require("uuid");
const wallets_1 = __importStar(require("../../models/wallets"));
const transactions_1 = __importStar(require("../../models/transactions"));
const notification_1 = require("../../utils/notification");
const createGroup = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(req.body);
        const user = (await users_1.default.findOne({
            where: { id: userId },
        }));
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // Extract group information from the request body
        const { group_name, purpose_and_goals, contribution_amount, amount_contributed, frequency, startDate, endDate, number_of_participants, group_image, duration, time, } = req.body;
        // Create a new group in the database
        const mem = {
            member_picture: user.profilePic,
            member_id: userId,
            name: `${user.firstName} ${user.lastName}`,
            amount_contributed: 0,
            amount_withdrawn: 0,
            date_of_last_contribution: "",
            profilePicture: user.profilePic,
        };
        const newGroup = {
            id: (0, uuid_1.v4)(),
            title: group_name,
            description: purpose_and_goals,
            admin_id: userId,
            contribution_amount: 0,
            group_image: req?.file?.path,
            // Initialize with zero contributions
            amount_contributed: 0,
            group_transactions: [],
            amount_withdrawn: 0,
            members: [mem],
            slots: [],
            availableSlots: [],
            number_of_participants,
            frequency,
            duration,
            startDate: startDate || new Date(),
            endDate: endDate || new Date(),
            created_at: new Date(),
        };
        // Save the new group to the database
        const createdGroup = await groups_1.default.create(newGroup);
        if (createdGroup) {
            const findGroup = (await groups_1.default.findOne({
                where: { admin_id: userId },
            }));
            const groupWalletId = (0, uuid_1.v4)();
            const groupWallet = await wallets_1.default.create({
                id: groupWalletId,
                user_id: findGroup.id,
                total_amount: 500000,
                type: wallets_1.type.GROUP_WALLET,
                created_at: new Date(),
                total_group_savings: 0,
                total_personal_savings: 0,
                earnings: [],
                total_income: 0,
            });
            const checkGroupWallet = await wallets_1.default.findOne({
                where: { user_id: findGroup.id },
            });
            if (!checkGroupWallet) {
                await groups_1.default.destroy({ where: { id: findGroup.id } });
                return res.status(400).json({
                    message: `Unable to register Group`,
                });
            }
            return res.status(201).json({
                message: "Group created successfully",
                group: createdGroup,
                wallet: groupWallet,
            });
        }
        return res
            .status(400)
            .json({ message: `Unable to create group, contact admin` });
    }
    catch (error) {
        console.error(error.message);
        console.log("error", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.createGroup = createGroup;
const getAllUsersGroups = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await users_1.default.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const allGroups = await groups_1.default.findAll({ where: { admin_id: userId } });
        return res
            .status(200)
            .json({ message: `All Groups Fetched`, data: allGroups });
    }
    catch (error) {
        console.error("Error fetching All Groups:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.getAllUsersGroups = getAllUsersGroups;
const getAllGroups = async (req, res) => {
    try {
        const allGroups = await groups_1.default.findAll({});
        return res
            .status(200)
            .json({ message: `Here are all the groups`, data: allGroups });
    }
    catch (error) {
        console.error("Error fetching All Groups:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.getAllGroups = getAllGroups;
const userGetSingleGroup = async (req, res) => {
    try {
        const groupId = req.params.id;
        const group = (await groups_1.default.findOne({
            where: { id: groupId },
        }));
        if (!group) {
            return res.status(400).json({
                message: `Group not available`,
            });
        }
        return res.status(200).json({
            message: `Single group fetched`,
            data: group,
        });
    }
    catch (error) {
        console.error("Error fetching Group:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.userGetSingleGroup = userGetSingleGroup;
const getAllMemberGroups = async (req, res) => {
    try {
        const userId = req.user.id;
        // Fetch groups where the user is either an admin or a member
        const allGroups = await groups_1.default.findAll({});
        const allMemberGroups = allGroups.filter((group) => group.members.some((member) => member.member_id === userId));
        return res
            .status(200)
            .json({ message: `All Member Groups Fetched`, data: allMemberGroups });
    }
    catch (error) {
        console.error("Error fetching All Member Groups:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.getAllMemberGroups = getAllMemberGroups;
const joinGroup = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const group = (await groups_1.default.findOne({
            where: { id },
        }));
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        const user = (await users_1.default.findOne({
            where: { id: userId },
        }));
        const userProfilePicture = user.profilePic;
        const member = group.members.some((member) => member.member_id === userId);
        if (member) {
            return res
                .status(400)
                .json({ message: "You are already a member of this group" });
        }
        const name = `${user.firstName} ${user.lastName}`;
        // Add the user to the group's members
        group.members.push({
            member_picture: user.profilePic,
            member_id: userId,
            name,
            amount_contributed: 0,
            amount_withdrawn: 0,
            date_of_last_contribution: "",
            profilePicture: userProfilePicture,
        });
        const no_of_participantz = (group.number_of_participants += 1);
        await groups_1.default.update({ members: group.members, number_of_participants: no_of_participantz }, { where: { id } });
        await group.save();
        const updatedGroup = (await groups_1.default.findOne({
            where: { id },
        }));
        res.json({
            message: "Successfully joined the group",
            data: updatedGroup?.members,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.joinGroup = joinGroup;
const leaveGroup = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const group = (await groups_1.default.findOne({
            where: { id },
        }));
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }
        const Member = group.members.some((member) => member.member_id === userId);
        if (!Member) {
            return res
                .status(400)
                .json({ message: "You are not a member of this group" });
        }
        const groupMemberIndex = group.members.findIndex((member) => member.member_id === userId);
        group.members.splice(groupMemberIndex, 1);
        group.number_of_participants -= 1;
        await groups_1.default.update({
            members: group.members,
            number_of_participants: group.number_of_participants,
        }, { where: { id } });
        const newGroup = await groups_1.default.findOne({ where: { id } });
        res.status(200).json({ message: "Successfully left the group", newGroup });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
exports.leaveGroup = leaveGroup;
const userContributesToAGroup = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { groupId } = req.params;
        const amount = req.body.amount;
        //Find the group
        const group = (await groups_1.default.findOne({
            where: { id: groupId },
        }));
        if (!group)
            return res
                .status(400)
                .json({ message: `Group not found, contact the admin` });
        //Ensure the amount contributed equals the expected contribution amount for the group
        if (amount < group.contribution_amount)
            return res.status(400).json({ message: `Invalid Contribution Amount` });
        //Ensure that user is a member of the group by checking for the member in the group.member's array using the index
        const groupMember = group.members.findIndex((member) => member.member_id === userId);
        if (groupMember === -1) {
            return res
                .status(400)
                .json({ message: "You are not a member of this group" });
        }
        //Get the group wallet
        const groupWallet = (await wallets_1.default.findOne({
            where: { user_id: groupId },
        }));
        //Find the user's group wallet ( contribution wallet)
        const userGroupWallet = (await wallets_1.default.findOne({
            where: { user_id: userId, type: "Group Wallet" },
        }));
        //Ensure that the user has enough money in his/her wallet to contribute
        if (userGroupWallet.total_amount < amount) {
            return res.status(400).json({
                message: `Your group wallet account balance is insufficient for this transaction`,
                Wallet_Balance: userGroupWallet.total_amount,
            });
        }
        //add the contributed amount to the member's contribution amount and update
        group.members[groupMember].amount_contributed += Number(amount);
        //set the date of recent contribution
        group.members[groupMember].date_of_last_contribution = new Date();
        //Update the total amount contributed in the group
        group.amount_contributed += Number(amount);
        await groups_1.default.update({ members: group.members, amount_contributed: group.amount_contributed }, { where: { id: groupId } });
        //deduct amount from user's wallet
        userGroupWallet.total_amount -= Number(amount);
        //add amount to the group wallet
        groupWallet.total_amount += Number(amount);
        // Save the updated data to the database
        await group.save();
        await groupWallet.save();
        await userGroupWallet.save();
        //Once everything is successful, create a transaction for the user
        const transactionId = (0, uuid_1.v4)();
        const user = (await users_1.default.findOne({
            where: { id: userId },
        }));
        const userTransaction = (await transactions_1.default.create({
            id: transactionId,
            wallet_id: userGroupWallet.id,
            owner_id: user.id,
            amount: amount,
            status: transactions_1.transaction_status.SUCCESSFUL,
            action: transactions_1.action.DEBIT,
            type: transactions_1.transaction_type.GROUP_WALLET,
            receiver: group.title,
            created_at: new Date(),
        }));
        await transactions_1.default.update({ status: "Successful" }, {
            where: {
                id: userTransaction.id,
            },
        });
        const userTrans = {
            transaction_id: userTransaction.id,
            date_initiated: new Date(),
            contributors_id: user.id,
            amount: amount,
            transaction_type: "Deposit",
        };
        group.group_transactions.push(userTrans);
        await groups_1.default.update({ group_transactions: group.group_transactions }, { where: { id: groupId } });
        //send the receipt as a mail to the contributor
        const mail_details = {
            to: user.email,
            group: group.title,
            amount: amount,
            transId: userTransaction.id,
            date: new Date(),
            account: userGroupWallet.type,
        };
        await (0, notification_1.transactionMail)(mail_details);
        //Not needed, but just to be sure the updates have been made
        const groupWallets = (await wallets_1.default.findOne({
            where: { user_id: groupId },
        }));
        const userWalletCheck = (await wallets_1.default.findOne({
            where: { user_id: userId, type: "Group Wallet" },
        }));
        const groupsCheck = (await groups_1.default.findOne({
            where: { id: groupId },
        }));
        // Respond with success message
        return res.status(200).json({
            message: `Contribution successful. Amount: N${amount}`,
            User_Wallet_Balance: userWalletCheck,
            groupWallet: groupWallets,
            group: groupsCheck,
            Transaction_receipt: userTransaction,
        });
    }
    catch (err) {
        console.log(err.message);
        return res.status(500).json({
            message: `Internal Server Error`,
        });
    }
};
exports.userContributesToAGroup = userContributesToAGroup;
const getSingleGroupTransactions = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const groupId = req.params.id;
        const group = await groups_1.default.findOne({ where: { id: groupId } });
        if (!group) {
            return res.status(405).json({ message: "Group does not exist" });
        }
        const membersId = group.members.map((member) => member.member_id);
        console.log("memberId", membersId);
        const allGroupTransactions = await transactions_1.default.findAll({ where: { receiver: group.title, owner_id: membersId } });
        if (!allGroupTransactions) {
            return res.status(400).json({
                message: "Unable to get Transactions.",
            });
        }
        else {
            return res.status(200).json({
                message: "all Transactions fetched successfully",
                data: allGroupTransactions,
            });
        }
    }
    catch (error) {
        console.error("Error fetching all group transactions:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.getSingleGroupTransactions = getSingleGroupTransactions;
