"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Payment_controller_1 = require("../controllers/Payment-controller");
const authorization_1 = require("../middleware/authorization");
const router = express_1.default.Router();
router.post("/pay", authorization_1.auth, Payment_controller_1.InitiatePayment);
router.get("/callback/:reference", Payment_controller_1.getPayment);
// router.get("/onepayment", getSinglePayment);
exports.default = router;
