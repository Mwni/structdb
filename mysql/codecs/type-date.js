export default {
	acceptsType: 'date',
	returnsType: 'string',
	returnsNull: true,
	
	encode(date){
		if(date === null || date === undefined)
			return null

		return date.toISOString()
			.replace('T', ' ')
			.slice(0, 19)
	},

	decode(date){
		if(!date)
			return null

		return new Date(date)
	}
}