export default function padData(data: any){
	if(data instanceof Date){
		let hora = data.getHours() < 10 ? "0" + data.getHours() : data.getHours()
		let minutos = data.getMinutes() < 10 ? "0" + data.getMinutes() : data.getMinutes()
		return hora + ":" + minutos
	}
	return data
}