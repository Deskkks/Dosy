import express from "express";
import meds from "./meds/index.js";
import users from "./users/index.js";
import history from "./history/index.js";

const router = express.Router();

router.use("/meds", meds);
router.use("/users", users);
router.use("/historys", history);

export default router;