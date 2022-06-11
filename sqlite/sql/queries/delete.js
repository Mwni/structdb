export default function({ table, where }){
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
	]
}