import express from "express";
import meds from "./meds";
import users from "./users";
import history from "./history";

const router = express.Router();

router.use("/meds", meds);
router.use("/users", users);
router.use("/historys", history);

export default router;