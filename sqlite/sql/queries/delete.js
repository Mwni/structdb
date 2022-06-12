export default function({ table, where, limit }){
	return [
		{
			text: `DELETE FROM "${table}"`
		},
		{
			text: `WHERE %`,
			items: where.items.length > 0
				? [where]
				: ['1']
		},
		limit 
			? {text: `LIMIT ?`, values: [limit]} 
			: null
	]
}