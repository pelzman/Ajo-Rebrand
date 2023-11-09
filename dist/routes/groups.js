"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const group_controllers_1 = require("../controllers/group-controllers/group-controllers");
const authorization_1 = require("../middleware/authorization");
const upload_1 = require("../middleware/upload");
const addMoneyToTotalGroupSavings_controllers_1 = require("../controllers/addMoneyToTotalGroupSavings-controllers");
const addMoneyToTotalPersonalSavings_controllers_1 = require("../controllers/addMoneyToTotalPersonalSavings-controllers");
const router = express_1.default.Router();
/* GET users listing. */
router.get("/", function (req, res, next) {
    res.send("respond with a resource");
});
router.post("/create-group", authorization_1.auth, upload_1.upload.single("group_image"), group_controllers_1.createGroup);
router.get("/get-users-groups", authorization_1.auth, group_controllers_1.getAllUsersGroups);
router.get("/get-groups", group_controllers_1.getAllGroups);
router.get("/get_all_members/:member", authorization_1.auth, group_controllers_1.getAllMemberGroups);
router.get("/get-users-groups", authorization_1.auth, group_controllers_1.getAllUsersGroups);
router.get("/get-groups", authorization_1.auth, group_controllers_1.getAllGroups);
router.get("/getsinglegroup/:id", authorization_1.auth, group_controllers_1.userGetSingleGroup);
router.post("/join/:id", authorization_1.auth, group_controllers_1.joinGroup);
router.post("/leave/:id", authorization_1.auth, group_controllers_1.leaveGroup);
router.post("/contribute/:groupId", authorization_1.auth, group_controllers_1.userContributesToAGroup);
router.post("/add-money/total-group-savings", authorization_1.auth, addMoneyToTotalGroupSavings_controllers_1.addMoneytoTotalGroupSavings);
router.post("/add-money/total-personal-savings", authorization_1.auth, addMoneyToTotalPersonalSavings_controllers_1.addMoneyToTotalPersonalSavings);
router.get("/totalGroup-saving", authorization_1.auth, addMoneyToTotalGroupSavings_controllers_1.getTotalGroupSaving);
router.get("/get-single-group-transactions/:id", authorization_1.auth, group_controllers_1.getSingleGroupTransactions);
exports.default = router;
