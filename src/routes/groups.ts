import express, { Request, Response, NextFunction } from "express";
import {
  createGroup,
  getAllGroups,
  getAllUsersGroups,
  userGetSingleGroup,
  getAllMemberGroups,
  joinGroup,
  leaveGroup,
  userContributesToAGroup,
  getSingleGroupTransactions,
} from "../controllers/group-controllers/group-controllers";
import { auth } from "../middleware/authorization";
import { upload } from "../middleware/upload";
import {
  addMoneytoTotalGroupSavings,
  getTotalGroupSaving,
} from "../controllers/addMoneyToTotalGroupSavings-controllers";
import { addMoneyToTotalPersonalSavings } from "../controllers/addMoneyToTotalPersonalSavings-controllers";

const router = express.Router();

/* GET users listing. */
router.get("/", function (req: Request, res: Response, next: NextFunction) {
  res.send("respond with a resource");
});

router.post("/create-group", auth, upload.single("group_image"), createGroup);
router.get("/get-users-groups", auth, getAllUsersGroups);
router.get("/get-groups", getAllGroups);
router.get("/get_all_members/:member", auth, getAllMemberGroups);
router.get("/get-users-groups", auth, getAllUsersGroups);
router.get("/get-groups", auth, getAllGroups);
router.get("/getsinglegroup/:id", auth, userGetSingleGroup);
router.post("/join/:id", auth, joinGroup);
router.post("/leave/:id", auth, leaveGroup);
router.post("/contribute/:groupId", auth, userContributesToAGroup);
router.post(
  "/add-money/total-group-savings",
  auth,
  addMoneytoTotalGroupSavings
);
router.post(
  "/add-money/total-personal-savings",
  auth,
  addMoneyToTotalPersonalSavings
);
router.get("/totalGroup-saving", auth, getTotalGroupSaving);
router.get(
  "/get-single-group-transactions/:id",
  auth,
  getSingleGroupTransactions
);

export default router;
