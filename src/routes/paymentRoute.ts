import express,{Request, Response} from "express";
import { InitiatePayment, getPayment } from "../controllers/Payment-controller";
// import { createHook } from "../controllers/webhook-controller/paystack_webhook";
import { auth } from "../middleware/authorization";
import crypto from "crypto"

const router = express.Router();
router.post("/pay", auth, InitiatePayment);
router.get("/callback/:reference", getPayment);

router.post("/webhook", function(req:Request, res:Response) {
const secret:string | undefined = process.env.PAYSTACK_KEY ;
if (!secret) {
    throw new Error('PAYSTACK_KEY is not defined');
  }
    //validate event
    const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
  
    if (hash == req.headers['x-paystack-signature']) {
      // Retrieve the request's body
      const event = req.body;
      // Do something with event
      if (event && event.event === 'transfer.success') {

     const transactionId =event.data.id
    if (transactionId) {
        console.log(`Transaction ${transactionId} was successful`);
        // return res.status(200).json({ message: `Transaction ${transactionId} was successful` })
      }
     
      }  
    } 
    
    res.send(200);
  });
// router.get("/onepayment", getSinglePayment);

export default router;
