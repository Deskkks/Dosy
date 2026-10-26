import { prisma } from "../../prisma.js";
import Express from "express";
import defStatus from "../../utils/defstatus.js"
import { DateTime } from "luxon";

const router = Express.Router();

// Get Dose do dia

router.get("/:id", async (req, res) => {

	const dataInicio = DateTime.now().startOf('day').toJSDate()
	const dataFim = DateTime.now().endOf("day").toJSDate()

	const meds = await prisma.medicamentos.findMany({
		where: {
			usuario_id: Number(req.params.id)
		},
		select: {
			nome: true,
			dosagem: true,
			unidade_dosagem: true,
			data_inicio: true,
			frequencia: true,
			id: true,
			historico: {
				where: {
					tomado_em: {
						gte: dataInicio,
						lte: dataFim
					}
				},
				select: {
					tomado_em: true
				}
			}
		}
	}).then((meds) => {

		const medsRes = meds.map((med: any) => {
			
			return {
				nome: med.nome,
				dosagem: String(med.dosagem) + " " + med.unidade_dosagem,
				doses: defStatus(med, dataInicio, dataFim)
			}
		});

		res.status(200).json(medsRes);
	}).catch((error) => {
		res.status(500).json({
			error: "Erro ao buscar doses do dia",
			details: error.message
		})
	})
});

export default router;