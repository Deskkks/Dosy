import express from "express";
import { prisma } from "../prisma";

const router = express.Router();

function padData(data: any){
	if(data instanceof Date){
		let hora = data.getHours() < 10 ? "0" + data.getHours() : data.getHours()
		let minutos = data.getMinutes() < 10 ? "0" + data.getMinutes() : data.getMinutes()
		return hora + ":" + minutos
	}
	return data
}

function desStatus(med:any, dataInicio: Date, dataFim: Date){
	var horarios = new Array
	var dataAtual = new Date(dataInicio)
	
	while(dataAtual <= dataFim){
		for (let i = 0; 24 > med.frequencia * i; i++) {
			let status
			var horarioTomado
			var diferenca: number
			var dose = new Date(dataAtual)
			dose = new Date(dose.setHours(med.dataInicio.getHours() + (i * med.frequencia), med.dataInicio.getMinutes()))
	
			let dataTomado = med.historicos.find((historico: any) => {
				diferenca = historico.data.getTime() - dose.getTime()
				return (diferenca >= 0 && diferenca <= med.frequencia*60*60*1000)
			})
			
			horarioTomado = dataTomado ? dataTomado.data : null
			
			if(horarioTomado != null){
				if(horarioTomado.getTime() - dose.getTime() > 10*60*1000){
					status = "atrasado"
				}else {
					status = "tomado"
				}
			} else {
				if (new Date().getTime() > dose.getTime()) {
					status = "não tomado";
				} else {
					status = "pendente";
				}
			}
			horarios.push({
				horario: padData(dose),
				tomado: padData(horarioTomado),
				status: status
			})
		}
		dataAtual.setDate(dataAtual.getDate()+1)
	}
	return horarios
}

// Post criar histórico de medicação

router.post("/", async (req, res) => {
	const newHistory = await prisma.historico.create({
		data: req.body.data,
	});
	res.status(201).json(newHistory);
});

// Get hoje

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
		
		doses.push(desStatus(med, dataInicio, dataFim))
		return {
			nome: med.nome,
			dosagem: String(med.dosagem) + " " + med.unidadeDosagem,
			doses: doses
		}
	});

	res.json(medsRes);
});


// Get Dashboard

router.get("/dashboard", async (req, res) => {
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

		status = desStatus(med, dataInicio, dataFim)

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

			status = desStatus(medUltSem, dataAtual, proximoDia)
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