import { Request, Response } from "express";
import Users from "../../models/users";
import { Op } from "sequelize";
import { v4 } from "uuid";
import Settings, { SettingsAttribute } from "../../models/settings";
import { JwtPayload } from "jsonwebtoken";

export const toggleSettings = async (req: JwtPayload, res: Response) => {
  const owner_id = req.user.id;

  const { settingName } = req.body;

  try {
    const userSettings = (await Settings.findOne({
      where: { owner_id },
    })) as unknown as SettingsAttribute;

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
  } catch (error) {
    return res
      .status(500)
      .json({ error: "An error occurred while retrieving user settings" });
  }
};
