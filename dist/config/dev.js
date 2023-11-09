"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const { DEV_PORT, DB_HOST, DB_NAME, DB_USERNAME, DB_PASSWORD, DB_PORT } = process.env;
exports.default = {
    PORT: DEV_PORT,
    DB_HOST,
    DB_NAME,
    DB_USERNAME,
    DB_PASSWORD,
    DB_PORT,
};
// console.log(DEV_PORT, DB_HOST, DB_NAME, DB_USERNAME, DB_PASSWORD, DB_PORT ); ====>database connection debugging
console.log("running in development mode");
