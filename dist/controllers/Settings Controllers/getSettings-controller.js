"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserSettings = void 0;
const settings_1 = __importDefault(require("../../models/settings"));
const getUserSettings = async (req, res) => {
    try {
        const user_id = req.user.id;
        const owner_id = user_id;
        const userGetSettings = await settings_1.default.findOne({ where: { owner_id } });
        if (!userGetSettings)
            res.status(400).json({ message: "userSetting cannot be found" });
        return res.status(200).json({
            message: "Settings fetched succesfully",
            method: req.method,
            data: userGetSettings
        });
    }
    catch (error) {
        return res.status(500).json({ error: "An error occurred while retrieving user settings" });
    }
};
exports.getUserSettings = getUserSettings;
