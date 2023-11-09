import axios, { AxiosResponse } from 'axios';

export interface FormType{

email:string
amount: number


};

type InitializePaymentCallback = (error: Error | null, response: AxiosResponse<any> | null) => void;
const APP_SECRET = process.env.PAYSTACK_KEY;

const MySecretKey: string = `Bearer ${APP_SECRET}`; // Replace with your own secret key


const initializePayment = async (form: FormType): Promise<AxiosResponse<any> | null> => {
  try {
    const url: string = 'https://api.paystack.co/transaction/initialize';

    const headers = {
      authorization: MySecretKey,
      'content-type': 'application/json',
      'cache-control': 'no-cache',
    };

    const response = await axios.post(url, form, { headers });

    return response.data;
  } catch (error) {
    return null;
  }
};

type VerifyPaymentCallback = (error: Error | null, response: AxiosResponse<any> | null) => void;

const verifyPayment = async (ref: string) => {
  try {
    const url: string = 'https://api.paystack.co/transaction/verify/' + encodeURIComponent(ref);

    const headers = {
      authorization: MySecretKey,
      'content-type': 'application/json',
      'cache-control': 'no-cache',
    };

    const response = await axios.get(url, { headers });

    return response.data;
  } catch (error) {
    console.log(error)
  }
};

export { initializePayment, verifyPayment };