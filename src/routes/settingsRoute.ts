import express from "express";
import { toggleSettings } from "../controllers/Settings Controllers/updateSettings-controller";
import { getUserSettings } from "../controllers/Settings Controllers/getSettings-controller";
import { auth } from "../middleware/authorization";
const router = express.Router();

router.put("/toggle", auth, toggleSettings);
router.get("/userSettings", auth, getUserSettings);

export default router;
