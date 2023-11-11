import express from "express";
import { InitiatePayment, getPayment } from "../controllers/Payment-controller";
import { createHook } from "../controllers/webhook-controller/paystack_webhook";
import { auth } from "../middleware/authorization";

const router = express.Router();

router.post("/pay", auth, InitiatePayment);
router.get("/callback/:reference", getPayment);
router.post("/webhook", createHook);
// router.get("/onepayment", getSinglePayment);

export default router;
