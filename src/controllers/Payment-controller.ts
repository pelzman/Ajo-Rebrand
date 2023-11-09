import express, { Request, Response } from "express";
import _ from "lodash"; // Make sure to import lodash
import { initializePayment, verifyPayment } from "../paystack"; // Import your initializePayment function
import jwt, { JwtPayload } from "jsonwebtoken";
import Payments, { Payment } from "../models/payment";
import { v4 } from "uuid";
import axios, { AxiosResponse } from "axios";
import Wallets from "../models/wallets";
import { UserAttributes } from "../models/users";

export const InitiatePayment = async (req: JwtPayload, res: Response) => {
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
    const paystackResponse = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      paymentData,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const responseData = paystackResponse.data;
    console.log({ responseData });

    if (responseData.status && responseData.data) {
      // Redirect the user to the Paystack payment page
      const payment = await Payments.create({
        reference: responseData.data.reference,
        amount,
        email,
        id: v4(),
        owner_id: req.user.id,
      });
      return res.status(200).json({
        message: "Payment successfully initialized",
        url: responseData.data.authorization_url,
      });
    } else {
      return res.status(400).json({ error: "Failed to initialize payment" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getPayment = async (req: Request, res: Response) => {
  try {
    const reference = req.params.reference;
    const apiKey = process.env.PAYSTACK_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Paystack API key is missing" });
    }

    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const responseData = paystackResponse.data;

    const response = responseData;

    if (response.status === true && response.data.status === "success") {
      console.log(response.data);
      // Payment is successful
      const { reference, amount, email, id, owner_id }: Payment = response.data;

      try {
        // Create a new Payment instance and save it to the database
        const payment = await Payments.findOne({
          where: { reference, status: "initiated" },
        });
        if (!payment) return;
        payment.status = "successful";
        payment.paystackId = id;
        await payment.save();
        const userWallet = (await Wallets.findOne({
          where: { user_id: payment.owner_id, type: "Global" },
        })) as unknown as UserAttributes;

        userWallet.total_amount += amount / 100;

        await userWallet.save();

        // Redirect the user to a success page or provide a response
        res.status(200).json({ message: "Payment successful", data: payment });
      } catch (error) {
        console.error("Error saving payment to the database:", error);
        return res
          .status(500)
          .json({ error: "Failed to save payment to the database" });
      }
    } else {
      // Handle payment failure or verification failure
      return res
        .status(400)
        .json({ error: "Payment verification failed", data: response.data });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
