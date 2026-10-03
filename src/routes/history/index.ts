import { prisma } from "../../prisma.js";
import Express from "express";
import dashboard from "./dashboard.js";
import doseDia from "./doseDia.js";

// Post criar histórico de medicação

const router = Express.Router();

router.post("/", async (req, res) => {
	const newHistory = await prisma.historico.create({
		data: req.body.data,
	});
	res.status(201).json(newHistory);
});

router.use("/dashboard", dashboard);
router.use("/doseDia", doseDia);

export default router;