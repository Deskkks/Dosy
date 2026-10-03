import { prisma } from "../../prisma.js";
import Express from "express";
import defStatus from "../../utils/defstatus.js"

const router = Express.Router();

// Get Dose do dia

router.get("/", async (req, res) => {

	const dataInicio = new Date(new Date().setHours(0, 0, 0, 0))
	const dataFim = new Date(new Date().setHours(23, 59, 59, 999))

	const meds = await prisma.medicamento.findMany({
		where: {
			userId: Number(req.query.id)
		},
		select: {
			nome: true,
			dosagem: true,
			unidadeDosagem: true,
			dataInicio: true,
			frequencia: true,
			id: true,
			historicos: {
				where: {
					data: {
						gte: dataInicio,
						lt: dataFim,
					}
				},
				select: {
					data: true
				}
			}
		}
	})

	const medsRes = meds.map((med: any) => {
	
		let doses = []
		
		doses.push(defStatus(med, dataInicio, dataFim))
		return {
			nome: med.nome,
			dosagem: String(med.dosagem) + " " + med.unidadeDosagem,
			doses: doses
		}
	});

	res.json(medsRes);
});

export default router;