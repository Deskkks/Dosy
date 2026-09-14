import express from "express";
import meds from "./meds.js";
import users from "./users.js";
import history from "./history.js";

const router = express.Router();

router.use("/meds", meds);
router.use("/users", users);
router.use("/historys", history);

export default router;