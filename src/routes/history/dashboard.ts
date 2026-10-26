import express from "express";
import { prisma } from "../../prisma.js";
import defStatus from "../../utils/defstatus.js"
import { DateTime } from "luxon";

const router = express.Router();

const tz = "America/Sao_Paulo"

// Get Dashboard

router.get("/:id", async (req, res) => {
	const dataInicio = DateTime.now().setZone(tz).startOf("day").toJSDate()
	const dataFim = DateTime.now().setZone(tz).endOf("day").toJSDate()

	const meds = await prisma.medicamentos.findMany({
		where: {
			usuario_id: Number(req.params.id)
		},
		select: {
			nome: true,
			dosagem: true,
			unidade_: true,
			dataInicio: true,
			frequencia: true,
			id: true,
			historico: {
				where: {
					tomado_em: {
						gte: dataInicio,
						lte: dataFim,
					}
				},
				select: {
					tomado_em: true
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
		var dosesTom = status.filter((stats) => stats.status == "tomado" || stats.status == "atrasado").length
		var adesao = 0

		if(dosesEsp > 0){
			adesao = (dosesTom / dosesEsp) * 100
		}
		return({
			remedio: med.nome,
			dosesEsp: dosesEsp,
			dosesTom: dosesTom,
			adesao: adesao.toFixed(0)
		})
	})

	dash = dash.flat(Infinity)
	
	var dosesEsp = dash.filter((dash) => dash?.status != "pendente").length
	var dosesTom = dash.filter((dash) => dash?.status == "tomado" || dash?.status == "atrasado").length
	var dosesAtr = dash.filter((dash) => dash?.status == "atrasado").length
	var dosesNT = dash.filter((dash) => dash?.status == "não tomado").length
	var adesao = 0
	if(dosesEsp > 0){
		adesao = Number(((dosesTom / dosesEsp) * 100).toFixed(1))
	}
	var inicioUltSem = DateTime.now().startOf("week").minus({day: 1}).toJSDate()
	var fimUltSem = DateTime.now().endOf("week").minus({day: 1}).toJSDate()

	var medsUltSem = await prisma.medicamentos.findMany({
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
						gte: inicioUltSem,
						lte: fimUltSem
					}
				},
				select: {
					tomado_em: true
				}
			}
		}
	})

	var statusEsq = new Array
	var statusD = new Array
	
	medsUltSem.map((medUltSem: any) => {
		let dataAtual = DateTime.fromJSDate(inicioUltSem)
		
		for(let i = 0; i < 7; i++){
			let proximoDia = dataAtual.endOf("day")
			var status

			status = defStatus(medUltSem, dataAtual.toJSDate(), proximoDia.toJSDate())
			statusEsq.push(status)

			var dosesEsp = status.filter((dash) => dash.status != "pendente").length
			var dosesTom = status.filter((dash) => dash.status == "tomado" || dash.status == "atrasado").length

			statusD.push({
				dosesEsp: dosesEsp,
				dosesTom: dosesTom,
				diaSem: dataAtual
			})
			
			dataAtual = dataAtual.plus({day : 1})
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
		
		if(dosesEsp > 0){
			adesaoD.push({
				adesao: ((dosesTom / dosesEsp) * 100).toFixed(1),
				diaSem: diaSem
			})
		}else{
			adesaoD.push({
				adesao: 0,
				diaSem: diaSem
			})
		}
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
		if(statusPorHora.length > 0){
			horariosEsq.push({
				horario: horario,
				qtd: statusEsquecidos.length,
				porcentgem:	((statusEsquecidos.length / statusPorHora.length) * 100).toFixed(1)
			})
		}else{
			horariosEsq.push({
				horario: horario,
				qtd: 0,
				porcentgem: 0
			})
		}
	})

	res.status(200).json({
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