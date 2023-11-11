
import { Response, Request } from "express";
import { verify} from "../../utils/helpers";

export const createHook = (req:Request, res:Response)=>{
    const PAYSTACK_KEY: string | undefined = process.env.PAYSTACK_KEY ;
const eventData = req.body
const signature = req.headers['x-paystack-signature']
if (!process.env.PAYSTACK_KEY) {
    return res.status(500).send('PAYSTACK_KEY is not defined');
  }

  // Verify the signature
  if (typeof signature === 'string' && verify(eventData, signature)) {
    return res.sendStatus(400);
  }

if(eventData.event === 'charge.success'){
    const transactionId =eventData.data?.id
    if (transactionId) {
        console.log(`Transaction ${transactionId} was successful`);
      }
   
}
return res.sendStatus(200)
}
