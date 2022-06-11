export default function({ fields, distinct, count, table, where, joins, orderBy, limit, offset }){
	let selection
	let limitation

	if(count){
		selection = {
			text: `COUNT(%)`,
			join: `, `,
			items: count
				.map(formatField)
		}
	}else if(distinct){
		selection = {
			text: `DISTINCT %`,
			join: `, `,
			items: distinct
				.map(formatField)
		}
	}else if(fields){
		selection = {
			text: `%`,
			join: `, `,
			items: fields
				.map(formatField)
		}
	}else{
		selection = {
			text: `*`
		}
	}

	if(orderBy){
		orderBy = {
			text: `ORDER BY %`,
			join: `, `,
			items: Object.entries(orderBy)
				.map(([key, dir]) => `"${key}" ${dir}`)
		}
	}

	if(limit || offset){
		limitation = {
			text: `LIMIT ?, ?`,
			values: [
				offset || 0,
				limit
			]
		}
	}

	joins = (joins || [])
		.map(formatJoin)

	return [
		{
			text: `SELECT`
		},
		selection,
		{
			text: `FROM "${table}"`
		},
		...joins,
		{
			text: `WHERE %`,
			items: where.items.length > 0
				? [where]
				: ['1']
		},
		orderBy,
		limitation
	]
}

function formatField(field){
	if(field === '*')
		return '*'

	if(typeof field === 'string')
		field = { name: field }

	return [
		field.table
			? `"${field.table}"."${field.name}"`
			: `"${field.name}"`,
		field.nameAlias
			? `AS "${field.nameAlias}"`
			: null
	]
}

function formatJoin(join){
	return [
		`LEFT JOIN "${join.table}"`,
		join.tableAlias
			? `AS "${join.tableAlias}"`
			: null,
		{
			text: `ON (%)`,
			items: join.condition
		}
	]
}