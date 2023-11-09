"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextFriday = exports.getDaysInMonth = exports.isValidDate = exports.isValidEmail = exports.hashPassword = exports.GenerateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const APP_SECRET = process.env.APP_SECRET;
const GenerateToken = async (payload) => {
    return jsonwebtoken_1.default.sign(payload, APP_SECRET, { expiresIn: "1d" });
};
exports.GenerateToken = GenerateToken;
const hashPassword = async (password) => {
    const salt = await bcryptjs_1.default.genSalt(10);
    const hash = await bcryptjs_1.default.hash(password, salt);
    return hash;
};
exports.hashPassword = hashPassword;
const isValidEmail = async (email) => {
    // Basic email format validation using a regular expression
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
const isValidDate = async (date) => {
    // Basic date format validation (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(date);
};
exports.isValidDate = isValidDate;
const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
};
exports.getDaysInMonth = getDaysInMonth;
const getNextFriday = (date) => {
    const dayOfWeek = date.getDay();
    let daysUntilFriday = 5 - dayOfWeek;
    if (daysUntilFriday <= 0) {
        daysUntilFriday += 7;
    }
    const nextFriday = new Date(date);
    nextFriday.setDate(date.getDate() + daysUntilFriday);
    return nextFriday;
};
exports.getNextFriday = getNextFriday;
