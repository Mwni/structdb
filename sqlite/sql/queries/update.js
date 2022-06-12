export default function({ table, data, where, limit }){
	return [
		{
			text: `UPDATE "${table}"`
		},
		{
			text: `SET %`,
			join: `, `,
			items: Object.entries(data)
				.map(([key, value]) => ({
					text: `"${key}" = ?`,
					values: [value]
				})),
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