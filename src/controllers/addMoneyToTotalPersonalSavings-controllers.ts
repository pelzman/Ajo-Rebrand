import { NextFunction, Request, Response } from "express";
import Wallets, { WalletAttributes, type } from "../models/wallets";
import { JwtPayload } from "jsonwebtoken";
import Transactions, { transaction_status, action, transaction_type } from "../models/transactions"; // Import the Transactions model and related enums
import { v4 as uuidv4 } from "uuid";

export const addMoneyToTotalPersonalSavings = async (req: JwtPayload, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (typeof amount !== 'number') {
      return res.status(400).json({
        message: 'Invalid amount',
      });
    }

    const newSavingsWallet = await Wallets.findOne({
      where: { user_id: userId, type: type.SAVINGS },
    });

    if (!newSavingsWallet) {
      return res.status(400).json({
        message: 'Personal wallet not found',
      });
    }

    const globalWallet = await Wallets.findOne({
      where: { user_id: userId, type: type.GLOBAL },
    });

    if (!globalWallet) {
      return res.status(400).json({
        message: 'Global Wallet not found',
      });
    }

    if (globalWallet.total_amount < amount) {
      const failedTransaction = await Transactions.create({

        id: uuidv4(),
        wallet_id: newSavingsWallet.id,
        owner_id: userId,
        amount: amount,
        status: transaction_status.UNSUCCESSFUL,
        action: action.CREDIT,
        type: transaction_type.SAVINGS,
        receiver: userId, // Provide a default value for created_at
        created_at: new Date(), // Provide a default value for created_at
      });

      if (!failedTransaction) {
        return res.status(500).json({
          message: 'Failed to create a transaction record for the unsuccessful transaction',
        });
      }

      return res.status(400).json({
        message: 'Not enough funds in the global Wallet',
        transaction: failedTransaction, // Include the failed transaction in the response
      });
    }

    globalWallet.total_amount -= amount;
    await globalWallet.save();

    newSavingsWallet.total_amount += amount;
    await newSavingsWallet.save();
// Create a successful transaction record
// const successfulTransaction = await Transactions.create({
//   id: uuidv4(), // Generate a unique transaction ID
//   wallet_id: newSavingsWallet.id,
//   owner_id: userId,
//   amount: amount,
//   status: transaction_status.SUCCESSFUL,
//   action: action.CREDIT,
//   type: transaction_type.SAVINGS,
//   created_at: new Date(), // Provide a default value for created_at
// });
    
    const successfulTransaction = await Transactions.create({

      id: uuidv4(),
      wallet_id: newSavingsWallet.id,
      owner_id: userId,
      amount: amount,
      status: transaction_status.SUCCESSFUL,
      action: action.CREDIT,
      type: transaction_type.SAVINGS,
      receiver: '', // Add the receiver property and set it to an empty string
      created_at: new Date(), // Provide a default value for created_at
    });

    if (!successfulTransaction) {
      return res.status(500).json({
        message: 'Failed to create a transaction record for the successful transaction',
      });
    }

    return res.status(201).json({
      message: 'Money added to total personal savings successfully',
      wallet: newSavingsWallet,
      transaction: successfulTransaction, // Include the successful transaction in the response
    });
  } catch (error) {
    console.error('Error adding money to total personal savings', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};
