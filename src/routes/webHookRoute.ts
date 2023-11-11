import express from "express";
import { createHook } from "../controllers/webhook-controller/paystack_webhook";
const router = express.Router();

router.post("/",  createHook);


export default router;
