"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const updateSettings_controller_1 = require("../controllers/Settings Controllers/updateSettings-controller");
const getSettings_controller_1 = require("../controllers/Settings Controllers/getSettings-controller");
const authorization_1 = require("../middleware/authorization");
const router = express_1.default.Router();
router.put("/toggle", authorization_1.auth, updateSettings_controller_1.toggleSettings);
router.get("/userSettings", authorization_1.auth, getSettings_controller_1.getUserSettings);
exports.default = router;
