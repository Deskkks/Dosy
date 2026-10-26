export default function padData(data: any){
	if(data instanceof Date){
		return String(data.getHours()).padStart(2, '0') + ":" + String(data.getMinutes()).padStart(2, '0')
	}
	return data
}