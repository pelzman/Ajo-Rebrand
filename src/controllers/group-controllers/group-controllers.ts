import express, { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import Groups, { GroupAttributes, Members } from "../../models/groups"; // Import your Sequelize model
import Users, { UserAttributes } from "../../models/users";
import { v4 } from "uuid";
import { Op } from "sequelize"; // Import Sequelize's Op for advanced queries
import { JSONB } from "sequelize";
import Wallets, { WalletAttributes, type } from "../../models/wallets";
import Transactions, {
  TransactionAttributes,
  action,
  transaction_status,
  transaction_type,
} from "../../models/transactions";
import { transactionMail } from "../../utils/notification";

export const createGroup = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.user.id;
    console.log(req.body);
    const user = (await Users.findOne({
      where: { id: userId },
    })) as unknown as UserAttributes;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Extract group information from the request body
    const {
      group_name,
      purpose_and_goals,
      contribution_amount,
      amount_contributed,
      frequency,
      startDate,
      endDate,
      number_of_participants,
      group_image,
      duration,
      time,
    } = req.body;

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
    const newGroup: GroupAttributes = {
      id: v4(), // Generate a UUID for the group ID
      title: group_name,
      description: purpose_and_goals,
      admin_id: userId,
      contribution_amount: 0,
      group_image: req?.file?.path,
      // Initialize with zero contributions
      amount_contributed: 0,
      group_transactions: [], // Initialize with an empty array
      amount_withdrawn: 0, // Initialize with zero withdrawals
      members: [mem],
      slots: [],
      availableSlots: [],
      number_of_participants, // Initialize with zero participants
      frequency,
      duration,
      startDate: startDate || new Date(),
      endDate: endDate || new Date(),
      created_at: new Date(),
    };

    // Save the new group to the database
    const createdGroup = await Groups.create(newGroup);
    if (createdGroup) {
      const findGroup = (await Groups.findOne({
        where: { admin_id: userId },
      })) as unknown as GroupAttributes;
      const groupWalletId = v4();
      const groupWallet = await Wallets.create({
        id: groupWalletId,
        user_id: findGroup.id,
        total_amount: 500000,
        type: type.GROUP_WALLET,
        created_at: new Date(),
        total_group_savings: 0,
        total_personal_savings: 0,
        earnings: [],
        total_income: 0,
      });
      const checkGroupWallet = await Wallets.findOne({
        where: { user_id: findGroup.id },
      });
      if (!checkGroupWallet) {
        await Groups.destroy({ where: { id: findGroup.id } });
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
  } catch (error: any) {
    console.error(error.message);
    console.log("error", error);

    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllUsersGroups = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.user.id;
    const user = await Users.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const allGroups = await Groups.findAll({ where: { admin_id: userId } });
    return res
      .status(200)
      .json({ message: `All Groups Fetched`, data: allGroups });
  } catch (error: any) {
    console.error("Error fetching All Groups:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllGroups = async (req: JwtPayload, res: Response) => {
  try {
    const allGroups = await Groups.findAll({});
    return res
      .status(200)
      .json({ message: `Here are all the groups`, data: allGroups });
  } catch (error: any) {
    console.error("Error fetching All Groups:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const userGetSingleGroup = async (req: JwtPayload, res: Response) => {
  try {
    const groupId = req.params.id;

    const group = (await Groups.findOne({
      where: { id: groupId },
    })) as unknown as GroupAttributes;

    if (!group) {
      return res.status(400).json({
        message: `Group not available`,
      });
    }

    return res.status(200).json({
      message: `Single group fetched`,
      data: group,
    });
  } catch (error: any) {
    console.error("Error fetching Group:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllMemberGroups = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.user.id as string;

    // Fetch groups where the user is either an admin or a member
    const allGroups = await Groups.findAll({});

    const allMemberGroups = allGroups.filter((group) =>
      group.members.some((member: any) => member.member_id === userId)
    );

    return res
      .status(200)
      .json({ message: `All Member Groups Fetched`, data: allMemberGroups });
  } catch (error: any) {
    console.error("Error fetching All Member Groups:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const joinGroup = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const group: any = (await Groups.findOne({
      where: { id },
    })) as unknown as GroupAttributes;

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    const user = (await Users.findOne({
      where: { id: userId },
    })) as unknown as UserAttributes;

    const userProfilePicture = user.profilePic;

    const member = group.members.some(
      (member: JwtPayload) => member.member_id === userId
    );
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

    await Groups.update(
      { members: group.members, number_of_participants: no_of_participantz },
      { where: { id } }
    );
    await group.save();

    const updatedGroup = (await Groups.findOne({
      where: { id },
    })) as unknown as GroupAttributes;

    res.json({
      message: "Successfully joined the group",
      data: updatedGroup?.members,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const leaveGroup = async (req: JwtPayload, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const group: any = (await Groups.findOne({
      where: { id },
    })) as unknown as GroupAttributes;

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    const Member = group.members.some(
      (member: JwtPayload) => member.member_id === userId
    );
    if (!Member) {
      return res
        .status(400)
        .json({ message: "You are not a member of this group" });
    }
    const groupMemberIndex = group.members.findIndex(
      (member: { member_id: any }) => member.member_id === userId
    );

    group.members.splice(groupMemberIndex, 1);
    group.number_of_participants -= 1;

    await Groups.update(
      {
        members: group.members,
        number_of_participants: group.number_of_participants,
      },
      { where: { id } }
    );

    const newGroup = await Groups.findOne({ where: { id } });
    res.status(200).json({ message: "Successfully left the group", newGroup });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const userContributesToAGroup = async (
  req: JwtPayload,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;
    const amount = req.body.amount;

    //Find the group
    const group: any = (await Groups.findOne({
      where: { id: groupId },
    })) as unknown as GroupAttributes;
    if (!group)
      return res
        .status(400)
        .json({ message: `Group not found, contact the admin` });

    //Ensure the amount contributed equals the expected contribution amount for the group
    if (amount < group.contribution_amount)
      return res.status(400).json({ message: `Invalid Contribution Amount` });

    //Ensure that user is a member of the group by checking for the member in the group.member's array using the index
    const groupMember = group.members.findIndex(
      (member: { member_id: any }) => member.member_id === userId
    );
    if (groupMember === -1) {
      return res
        .status(400)
        .json({ message: "You are not a member of this group" });
    }
    //Get the group wallet
    const groupWallet: any = (await Wallets.findOne({
      where: { user_id: groupId },
    })) as unknown as WalletAttributes;

    //Find the user's group wallet ( contribution wallet)
    const userGroupWallet: any = (await Wallets.findOne({
      where: { user_id: userId, type: "Group Wallet" },
    })) as unknown as WalletAttributes;
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

    await Groups.update(
      { members: group.members, amount_contributed: group.amount_contributed },
      { where: { id: groupId } }
    );
    //deduct amount from user's wallet
    userGroupWallet.total_amount -= Number(amount);
    //add amount to the group wallet
    groupWallet.total_amount += Number(amount);

    // Save the updated data to the database
    await group.save();
    await groupWallet.save();
    await userGroupWallet.save();

    //Once everything is successful, create a transaction for the user
    const transactionId = v4();
    const user = (await Users.findOne({
      where: { id: userId },
    })) as unknown as UserAttributes;
    const userTransaction = (await Transactions.create({
      id: transactionId,
      wallet_id: userGroupWallet.id,
      owner_id: user.id,
      amount: amount,
      status: transaction_status.SUCCESSFUL,
      action: action.DEBIT,
      type: transaction_type.GROUP_WALLET,
      receiver: group.title,
      created_at: new Date(),
    })) as unknown as TransactionAttributes;
    await Transactions.update(
      { status: "Successful" },
      {
        where: {
          id: userTransaction.id,
        },
      }
    );
    const userTrans = {
      transaction_id: userTransaction.id,
      date_initiated: new Date(),
      contributors_id: user.id,
      amount: amount,
      transaction_type: "Deposit",
    };
    group.group_transactions.push(userTrans);

    await Groups.update(
      { group_transactions: group.group_transactions },
      { where: { id: groupId } }
    );

    //send the receipt as a mail to the contributor
    const mail_details = {
      to: user.email,
      group: group.title,
      amount: amount,
      transId: userTransaction.id,
      date: new Date(),
      account: userGroupWallet.type,
    };

    await transactionMail(mail_details);

    //Not needed, but just to be sure the updates have been made
    const groupWallets = (await Wallets.findOne({
      where: { user_id: groupId },
    })) as unknown as WalletAttributes;
    const userWalletCheck = (await Wallets.findOne({
      where: { user_id: userId, type: "Group Wallet" },
    })) as unknown as WalletAttributes;
    const groupsCheck = (await Groups.findOne({
      where: { id: groupId },
    })) as unknown as GroupAttributes;

    // Respond with success message
    return res.status(200).json({
      message: `Contribution successful. Amount: N${amount}`,
      User_Wallet_Balance: userWalletCheck,
      groupWallet: groupWallets,
      group: groupsCheck,
      Transaction_receipt: userTransaction,
    });
  } catch (err: any) {
    console.log(err.message);
    return res.status(500).json({
      message: `Internal Server Error`,
    });
  }
};

export const getSingleGroupTransactions = async (
  req: JwtPayload,
  res: Response,
  next: NextFunction
) => {
  try {

    const userId = req.user.id
    const groupId = req.params.id

    const group = await Groups.findOne({where: {id: groupId}})
    if(!group){
      return res.status(405).json({message: "Group does not exist"})
    }

    const membersId = group.members.map((member: Members) => member.member_id)
    console.log("memberId", membersId)

    const allGroupTransactions = await Transactions.findAll({where: {receiver: group.title, owner_id: membersId} })

    if (!allGroupTransactions) {
      return res.status(400).json({
        message: "Unable to get Transactions.",
      });
    } else {
      return res.status(200).json({
        message: "all Transactions fetched successfully",
        data: allGroupTransactions,
      });
    }
  } catch (error: any) {
    console.error("Error fetching all group transactions:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
