import express from "express";
import montarDash from "../../utils/montarDash.js";
import { prisma } from "../../prisma.js";

const router = express.Router();

// Get Dashboard

router.get("/:id", async (req, res) => {
	const dash = await montarDash(Number(req.params.id))
	res.status(200).json(dash)
})

router.get("/cuid/:id", async (req, res) => {
	const cuid = await prisma.cuidadores.findUnique({
		where: {
			id: Number(req.params.id)
		},
		select: {
			usuario_id:true
		}
	})
	const dash = await montarDash(Number(cuid?.usuario_id))
	res.status(200).json(dash)
})

export default router;