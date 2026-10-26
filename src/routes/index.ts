import express from "express";
import meds from "./meds/index.js";
import users from "./users/index.js";
import history from "./history/index.js";
import notification from "./notification.js";

const router = express.Router();

router.use("/meds", meds);
router.use("/users", users);
router.use("/historys", history);
router.use("/notification", notification);

export default router;