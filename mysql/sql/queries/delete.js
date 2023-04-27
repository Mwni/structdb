export default function({ table, tableAlias, where, orderBy, limit }){
	if(orderBy){
		orderBy = {
			text: `ORDER BY %`,
			join: `, `,
			items: Object.entries(orderBy)
				.map(([key, dir]) => `\`${key}\` ${dir}`)
		}
	}

	return [
		{
			text: tableAlias
				? `DELETE \`${tableAlias}\` FROM \`${table}\` AS \`${tableAlias}\``
				: `DELETE FROM \`${table}\``
		},
		{
			text: `WHERE %`,
			items: where.items.length > 0
				? [where]
				: ['1']
		},
		orderBy,
		limit 
			? {text: `LIMIT ?`, values: [limit]} 
			: null
	]
}