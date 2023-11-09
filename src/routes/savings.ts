import express from 'express';
import {  createTarget, getAllTargetsByUser,userFundTarget, userWithdrawTarget } from '../controllers/savingsTarget-controllers/Targets-controllers/savings-controllers';
import { userGetSingleTarget } from '../controllers/savingsTarget-controllers/Targets-controllers/savings-controllers';
import {auth} from '../middleware/authorization'
import { getTotalPersonalSaving } from '../controllers/addMoneyToTotalGroupSavings-controllers';

const router = express.Router();

router.post("/create", auth, createTarget);
router.get("/get_all_user_target", auth, getAllTargetsByUser);
router.get("/get_single_target/:savingsId", auth, userGetSingleTarget);
router.get("/get_personal_savings_wallet", auth, getTotalPersonalSaving)
router.post("/fund_target/:savingsId", auth, userFundTarget);
router.post("/withdraw_from_target/:savingsId", auth, userWithdrawTarget);





export default router

