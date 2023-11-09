import { NextFunction, Request, Response } from "express";
import Wallets, { WalletAttributes, type } from "../models/wallets";
import { JwtPayload } from "jsonwebtoken";
import Transactions, { transaction_status, action, transaction_type, TransactionAttributes } from "../models/transactions"; // Import the Transactions model and related enums
import { v4 as uuidv4 } from "uuid";

export const addMoneytoTotalGroupSavings = async (req: JwtPayload, res: Response, next: NextFunction) => {
  const userId = req.user.id;
  console.log(userId)
  const { amount } = req.body;
  
  try {

    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        message: 'Invalid amount',
      });
    }
    const personalGroupWallet = await Wallets.findOne({
      where: { user_id: userId, type: type.GROUP_WALLET },
    });

    if (!personalGroupWallet) {
      return res.status(400).json({
        message: 'Group wallet not found',
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
      // Create an unsuccessful transaction record
      const failedTransaction = await Transactions.create({
        id: uuidv4(),
        wallet_id: personalGroupWallet.id,
        owner_id: userId,
        amount: amount,
        status: transaction_status.UNSUCCESSFUL,
        action: action.CREDIT,
        type: transaction_type.GROUP_WALLET,
        created_at: new Date(),
        receiver: userId, // Provide a default value for created_at
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

    personalGroupWallet.total_amount += amount;
    await personalGroupWallet.save();

    // Create a successful transaction record
        const successfulTransaction = await Transactions.create({
            id: uuidv4(),
            wallet_id: personalGroupWallet.id,
            owner_id: userId,
            amount: amount,
            status: transaction_status.SUCCESSFUL,
            action: action.CREDIT,
            type: transaction_type.GROUP_WALLET,
            created_at: new Date(), // Add created_at
            receiver: userId, // Add the receiver (you might need to replace this with the actual receiver)
          });

    if (!successfulTransaction) {
      return res.status(500).json({
        message: 'Failed to create a transaction record for the successful transaction',
      });
    }

    res.status(201).json({
      message: 'Money added to total group savings successfully',
      wallet: personalGroupWallet,
      transaction: successfulTransaction, // Include the successful transaction in the response
    });
  } catch (error) {
    console.error('Error adding money to total group savings', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
};


export const getTotalGroupSaving = async(req:JwtPayload, res: Response )=>{
  try {
    const userId = req.user.id;
    const totalGroupSavings = (await Wallets.findOne({
      where: { user_id: userId, type: type.GROUP_WALLET },
    })) 
    console.log(totalGroupSavings)
    if(!totalGroupSavings){
        
        return res.status(400).json({message:"oops an Error occur, failed to get savings amount" })
      }
      return res.status(200).json({
        status: "Success",
        method : req.method,
        message: "savings fetched successfully",
        data : totalGroupSavings
      })
  } catch (error:any) {
    console.log(error.message)
    return res.status(500).json({
      message: `Internal server error`
    })
  }

}

export const getTotalPersonalSaving = async(req:JwtPayload, res: Response )=>{
  try {
    const userId = req.user.id;
    const totalPersonalSavings = (await Wallets.findOne({
      where: { user_id: userId, type: type.SAVINGS },
    })) 
    console.log(totalPersonalSavings)
    if(!totalPersonalSavings){
        
        return res.status(400).json({message:"oops an Error occur, failed to get savings amount" })
      }
      return res.status(200).json({
        status: "Success",
        method : req.method,
        message: "savings fetched successfully",
        data : totalPersonalSavings
      })
  } catch (error:any) {
    console.log(error.message)
    return res.status(500).json({
      message: `Internal server error`
    })
  }

}


