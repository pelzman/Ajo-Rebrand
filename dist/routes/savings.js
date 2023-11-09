"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const savings_controllers_1 = require("../controllers/savingsTarget-controllers/Targets-controllers/savings-controllers");
const savings_controllers_2 = require("../controllers/savingsTarget-controllers/Targets-controllers/savings-controllers");
const authorization_1 = require("../middleware/authorization");
const addMoneyToTotalGroupSavings_controllers_1 = require("../controllers/addMoneyToTotalGroupSavings-controllers");
const router = express_1.default.Router();
router.post("/create", authorization_1.auth, savings_controllers_1.createTarget);
router.get("/get_all_user_target", authorization_1.auth, savings_controllers_1.getAllTargetsByUser);
router.get("/get_single_target/:savingsId", authorization_1.auth, savings_controllers_2.userGetSingleTarget);
router.get("/get_personal_savings_wallet", authorization_1.auth, addMoneyToTotalGroupSavings_controllers_1.getTotalPersonalSaving);
router.post("/fund_target/:savingsId", authorization_1.auth, savings_controllers_1.userFundTarget);
router.post("/withdraw_from_target/:savingsId", authorization_1.auth, savings_controllers_1.userWithdrawTarget);
exports.default = router;
