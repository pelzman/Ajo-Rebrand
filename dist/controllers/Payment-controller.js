"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPayment = exports.InitiatePayment = void 0;
const payment_1 = __importDefault(require("../models/payment"));
const uuid_1 = require("uuid");
const axios_1 = __importDefault(require("axios"));
const wallets_1 = __importDefault(require("../models/wallets"));
const InitiatePayment = async (req, res) => {
    try {
        const { amount, email } = req.body;
        const apiKey = process.env.PAYSTACK_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "Paystack API key is missing" });
        }
        // Create a payment request
        const paymentData = {
            email,
            amount: amount * 100, // Paystack uses kobo as the currency unit
        };
        // Make a POST request to Paystack to initialize the payment
        const paystackResponse = await axios_1.default.post("https://api.paystack.co/transaction/initialize", paymentData, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
        });
        const responseData = paystackResponse.data;
        console.log({ responseData });
        if (responseData.status && responseData.data) {
            // Redirect the user to the Paystack payment page
            const payment = await payment_1.default.create({
                reference: responseData.data.reference,
                amount,
                email,
                id: (0, uuid_1.v4)(),
                owner_id: req.user.id,
            });
            return res.status(200).json({
                message: "Payment successfully initialized",
                url: responseData.data.authorization_url,
            });
        }
        else {
            return res.status(400).json({ error: "Failed to initialize payment" });
        }
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.InitiatePayment = InitiatePayment;
const getPayment = async (req, res) => {
    try {
        const reference = req.params.reference;
        const apiKey = process.env.PAYSTACK_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "Paystack API key is missing" });
        }
        const paystackResponse = await axios_1.default.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });
        const responseData = paystackResponse.data;
        const response = responseData;
        if (response.status === true && response.data.status === "success") {
            console.log(response.data);
            // Payment is successful
            const { reference, amount, email, id, owner_id } = response.data;
            try {
                // Create a new Payment instance and save it to the database
                const payment = await payment_1.default.findOne({
                    where: { reference, status: "initiated" },
                });
                if (!payment)
                    return;
                payment.status = "successful";
                payment.paystackId = id;
                await payment.save();
                const userWallet = (await wallets_1.default.findOne({
                    where: { user_id: payment.owner_id, type: "Global" },
                }));
                userWallet.total_amount += amount / 100;
                await userWallet.save();
                // Redirect the user to a success page or provide a response
                res.status(200).json({ message: "Payment successful", data: payment });
            }
            catch (error) {
                console.error("Error saving payment to the database:", error);
                return res
                    .status(500)
                    .json({ error: "Failed to save payment to the database" });
            }
        }
        else {
            // Handle payment failure or verification failure
            return res
                .status(400)
                .json({ error: "Payment verification failed", data: response.data });
        }
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.getPayment = getPayment;
