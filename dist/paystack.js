"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPayment = exports.initializePayment = void 0;
const axios_1 = __importDefault(require("axios"));
;
const APP_SECRET = process.env.PAYSTACK_KEY;
const MySecretKey = `Bearer ${APP_SECRET}`; // Replace with your own secret key
const initializePayment = async (form) => {
    try {
        const url = 'https://api.paystack.co/transaction/initialize';
        const headers = {
            authorization: MySecretKey,
            'content-type': 'application/json',
            'cache-control': 'no-cache',
        };
        const response = await axios_1.default.post(url, form, { headers });
        return response.data;
    }
    catch (error) {
        return null;
    }
};
exports.initializePayment = initializePayment;
const verifyPayment = async (ref) => {
    try {
        const url = 'https://api.paystack.co/transaction/verify/' + encodeURIComponent(ref);
        const headers = {
            authorization: MySecretKey,
            'content-type': 'application/json',
            'cache-control': 'no-cache',
        };
        const response = await axios_1.default.get(url, { headers });
        return response.data;
    }
    catch (error) {
        console.log(error);
    }
};
exports.verifyPayment = verifyPayment;
