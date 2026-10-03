import padData from "./padData.js"

export default function desStatus(med:any, dataInicio: Date, dataFim: Date){
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