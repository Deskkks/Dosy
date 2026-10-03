import express from "express";
import { prisma } from "../../prisma.js";
import defStatus from "../../utils/defstatus.js"

const router = express.Router();

// Get Dashboard

router.get("/", async (req, res) => {
	const hoje = new Date()
	const dataInicio = new Date(hoje.getFullYear(), hoje.getMonth()-1, hoje.getDate(),0)
	const dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(),23,59,59,999)

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
						lt: dataFim
					}
				},
				select: {
					data: true
				}
			}
		}
	})

	var dash = new Array
	
	var adesaoR = meds.map((med:any) => {

		var status

		status = defStatus(med, dataInicio, dataFim)

		dash.push(status)

		var dosesEsp = status.filter((stats) => stats.status != "pendente").length
		var dosesTom = status.filter((stats) => stats.status == "tomado").length

		var adesao = (dosesTom / dosesEsp) * 100
		
		return({
			remedio: med.nome,
			dosesEsp: dosesEsp,
			dosesTom: dosesTom,
			adesao: adesao.toFixed(0)
		})
	})

	dash = dash.flat(Infinity)
	
	var dosesEsp = dash.length
	var dosesTom = dash.filter((dash) => dash?.status == "tomado").length
	var dosesAtr = dash.filter((dash) => dash?.status == "atrasado").length
	var dosesNT = dash.filter((dash) => dash?.status == "não tomado").length
	var adesao = ((dosesTom / dosesEsp) * 100).toFixed(1)
	
	var inicioUltSem = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - hoje.getDay() - 7, 0)
	var fimUltSem = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - hoje.getDay(),23,59,59,999)

	var medsUltSem = await prisma.medicamento.findMany({
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
						gte: inicioUltSem,
						lt: fimUltSem
					}
				},
				select: {
					data: true
				}
			}
		}
	})

	var statusEsq = new Array
	var statusD = new Array
	
	medsUltSem.map((medUltSem: any) => {
		let dataAtual = new Date(inicioUltSem)
		
		for(let i = 0; i < 7; i++){
			let proximoDia = new Date(hoje.getFullYear(), hoje.getMonth(), dataAtual.getDate() + 1,23,59,59,999)
			var status

			status = defStatus(medUltSem, dataAtual, proximoDia)
			statusEsq.push(status)

			var dosesEsp = status.filter((dash) => dash.status != "pendente").length
			var dosesTom = status.filter((dash) => dash.status == "tomado").length

			statusD.push({
				dosesEsp: dosesEsp,
				dosesTom: dosesTom,
				diaSem: dataAtual
			})
			
			dataAtual = new Date(dataAtual)
			dataAtual.setDate(dataAtual.getDate() + 1)
			dataAtual.setHours(0, 0, 0, 0)
		}
	})

	var adesaoD = new Array

	for(let i = 0; i < 7; i++){
		let adesao = statusD.filter(statD => {
			return statD.diaSem.getDay() == i
		})

		let dosesEsp = 0
		let dosesTom = 0
		let diaSem

		adesao.map(ad => {
			dosesEsp += ad.dosesEsp
			dosesTom += ad.dosesTom
			diaSem = ad.diaSem.toLocaleString('pt-BR', { weekday: 'long' })
		})

		adesaoD.push({
			adesao: ((dosesTom / dosesEsp) * 100).toFixed(1),
			diaSem: diaSem
		})
	}
	
	var horariosEsq = new Array
	let horarios = new Array
	
	statusEsq = statusEsq.flat(Infinity)

	statusEsq.map((statsEsq) => {
		if(!horarios.some((horario) => horario == statsEsq.horario)){
			horarios.push(statsEsq.horario)
		}
	})
	
	horarios.sort()

	horarios.map((horario) => {
		
		let statusEsquecidos = statusEsq.filter(statsEsq => {
			return statsEsq.status == "não tomado" && statsEsq.horario == horario
		})
		
		let statusPorHora = statusEsq.filter(statsEsq => {
			return statsEsq.horario == horario
		})
		
		horariosEsq.push({
			horario: horario,
			qtd: statusEsquecidos.length,
			porcentgem:	((statusEsquecidos.length / statusPorHora.length) * 100).toFixed(1)
		})
	})

	res.json({
		adesao: adesao,
		dosesEsp: dosesEsp,
		dosesTom: dosesTom,
		dosesAtr: dosesAtr,
		dosesNT: dosesNT,
		adesaoD: adesaoD,
		adesaoR: adesaoR,
		horariosEsq: horariosEsq
	})
})

export default router; 