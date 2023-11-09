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
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMoneyToTotalPersonalSavings = void 0;
const wallets_1 = __importStar(require("../models/wallets"));
const transactions_1 = __importStar(require("../models/transactions")); // Import the Transactions model and related enums
const uuid_1 = require("uuid");
const addMoneyToTotalPersonalSavings = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { amount } = req.body;
        if (typeof amount !== 'number') {
            return res.status(400).json({
                message: 'Invalid amount',
            });
        }
        const newSavingsWallet = await wallets_1.default.findOne({
            where: { user_id: userId, type: wallets_1.type.SAVINGS },
        });
        if (!newSavingsWallet) {
            return res.status(400).json({
                message: 'Personal wallet not found',
            });
        }
        const globalWallet = await wallets_1.default.findOne({
            where: { user_id: userId, type: wallets_1.type.GLOBAL },
        });
        if (!globalWallet) {
            return res.status(400).json({
                message: 'Global Wallet not found',
            });
        }
        if (globalWallet.total_amount < amount) {
            const failedTransaction = await transactions_1.default.create({
                id: (0, uuid_1.v4)(),
                wallet_id: newSavingsWallet.id,
                owner_id: userId,
                amount: amount,
                status: transactions_1.transaction_status.UNSUCCESSFUL,
                action: transactions_1.action.CREDIT,
                type: transactions_1.transaction_type.SAVINGS,
                receiver: userId,
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
        const successfulTransaction = await transactions_1.default.create({
            id: (0, uuid_1.v4)(),
            wallet_id: newSavingsWallet.id,
            owner_id: userId,
            amount: amount,
            status: transactions_1.transaction_status.SUCCESSFUL,
            action: transactions_1.action.CREDIT,
            type: transactions_1.transaction_type.SAVINGS,
            receiver: '',
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
    }
    catch (error) {
        console.error('Error adding money to total personal savings', error);
        return res.status(500).json({
            message: 'Internal server error',
        });
    }
};
exports.addMoneyToTotalPersonalSavings = addMoneyToTotalPersonalSavings;
