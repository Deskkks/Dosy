import { prisma } from "../../prisma.js";
import Express from "express";
import dashboard from "./dashboard.js";
import doseDia from "./doseDia.js";

// Post criar histórico de medicação

const router = Express.Router();

router.post("/", async (req, res) => {
	const newHistory = await prisma.historico.create({
		data: req.body
	}).then((newHistory) => {
		res.status(201).json(newHistory);
	}).catch((error) => {
		res.status(500).json({
			error: "Erro ao criar histórico de medicação",
			details: error.message
		})
	})
})

router.get("/:id", async (req, res) => {
	const history = await prisma.historico.findMany({
		where: {
			usuario_id: Number(req.params.id)
		},
		select: {
			id: true,
			medicamento_id: true,
			tomado_em: true
		},
		orderBy: {
			tomado_em: "desc"
		}
	}).then((history) => {
		res.status(200).json(history);
	});
})

router.use("/dashboard", dashboard);
router.use("/doseDia", doseDia);

export default router;