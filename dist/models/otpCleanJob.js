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
const cron = __importStar(require("node-cron"));
const users_1 = __importDefault(require("./users")); // Import your User model
const sequelize_1 = require("sequelize");
// Schedule a job to run every 5 minutes
cron.schedule('*/5 * * * *', async () => {
    try {
        // Calculate the time threshold for deleting expired OTPs (e.g., 5 minutes ago)
        const fiveMinutesAgo = new Date();
        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
        // Find and delete users with expired OTPs
        await users_1.default.update({ otp: null }, {
            where: {
                otp: {
                    [sequelize_1.Op.ne]: null,
                },
                created_at: {
                    [sequelize_1.Op.lt]: fiveMinutesAgo,
                },
            },
        });
    }
    catch (error) {
        console.error('Error deleting users with expired OTPs:', error);
    }
});
