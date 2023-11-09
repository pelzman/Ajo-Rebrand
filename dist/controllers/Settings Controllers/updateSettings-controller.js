"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleSettings = void 0;
const settings_1 = __importDefault(require("../../models/settings"));
const toggleSettings = async (req, res) => {
    const owner_id = req.user.id;
    const { settingName } = req.body;
    try {
        const userSettings = (await settings_1.default.findOne({
            where: { owner_id },
        }));
        if (!userSettings)
            return res.status(404).json({ message: "User settings not found" });
        //  Toggle the bcauttons based on the settings name selected
        switch (settingName) {
            case "email_notification":
                userSettings.email_notification = !userSettings.email_notification;
                break;
            case "contribution_reminder":
                userSettings.contribution_reminder =
                    !userSettings.contribution_reminder;
                break;
            case "group_join_request":
                userSettings.group_join_request = !userSettings.group_join_request;
                break;
            case "two_factor_authentication":
                userSettings.two_factor_authentication =
                    !userSettings.two_factor_authentication;
                break;
            case "password_update":
                userSettings.password_update = !userSettings.password_update;
                break;
            case "profile_visibility":
                userSettings.profile_visibility = !userSettings.profile_visibility;
                break;
            case "email_privacy":
                userSettings.email_privacy = !userSettings.email_privacy;
                break;
            case " personal_saving_alert":
                userSettings.personal_saving_alert =
                    !userSettings.personal_saving_alert;
                break;
            case "deactivate_account":
                userSettings.deactivate_account = !userSettings.deactivate_account;
                break;
            default:
                return res.status(400).json({ message: "Invalid setting name" });
        }
        // Saving the settings changes
        await userSettings.save();
        return res.status(200).json({
            message: "Settings toggled successfully",
            data: userSettings,
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({ error: "An error occurred while retrieving user settings" });
    }
};
exports.toggleSettings = toggleSettings;
