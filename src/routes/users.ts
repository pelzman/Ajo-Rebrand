import { Request, Response, NextFunction } from "express";
import {
  resendOTP,
  updateUser,
  verifyOTP,
  withdrawFromUserGroupWallet,
  withdrawFromUserSavingsWallet,
  getGlobalWallet,
} from "../controllers/user-controllers/users-controllers";
import { getUserUpcomingActivities } from "../controllers/user-controllers/users-controllers";
import {
  createUser,
  getAllUserTransactionsByUser,
  loginUser,
  userChangePassword,
} from "../controllers/user-controllers/users-controllers";

import { userResetPassword, verifyChangePasswordEmail } from "../controllers/user-controllers/users-controllers";

import { getTotalIncomePerMonth,getTotalIncomePerMonthWithinAPeriod } from "../controllers/user-controllers/users-controllers";
import {} from "../controllers/user-controllers/users-controllers";
import { uploadProfilePicture } from "../controllers/profilePicController";
import { Router } from "express";
import { auth } from "../middleware/authorization";
import { upload } from "../middleware/upload";

const router = Router();

/* GET users listing. */
router.get("/", function (req: Request, res: Response, next: NextFunction) {
  res.send("respond with a resource");
});

router.post("/forgotPass", verifyChangePasswordEmail);
router.post("/resetPass", auth, userResetPassword);
router.post("/register", createUser);
router.post("/resend-otp", auth, resendOTP);
router.post("/verify-otp", auth, verifyOTP);
router.post("/login", loginUser);
router.post("/change-password", auth, userChangePassword);
router.get("/get-user-transactions", auth, getAllUserTransactionsByUser);
router.get("/get-user-upcoming-activities", auth, getUserUpcomingActivities);
router.patch("/updateUser", upload.fields([{name: "profilePic", maxCount: 1}, {name: "identification_doc", maxCount: 1}, {name: "proof_of_address_doc", maxCount: 1}]), auth, updateUser)

router.get("/totalincome/:id", getTotalIncomePerMonth);
router.get("/totalincomepermonth/:id", getTotalIncomePerMonthWithinAPeriod);

router.post("/uploadProfilePicture", uploadProfilePicture);

router.post("/groupwithdraw", auth, withdrawFromUserGroupWallet);
router.post("/savingswithdraw", auth, withdrawFromUserSavingsWallet);
router.get("/global-wallet", auth, getGlobalWallet);

export default router;
