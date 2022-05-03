import compile from './lib/compile.js'
import { compose as composeWhere } from './lib/where.js'


export default compile({
	setters: {
		fields: x => x,
		from: x => x,
		where: (where, previous = {}) => ({...previous, ...where}),
		orderBy: (field, dir) => ({ field, dir }),
		limit: x => x,
		offset: x => x,
	},
	render: p => {
		let { sql: whereSql, data: whereData } = composeWhere(p.where)

		return {
			sql: [
				`SELECT`,
				p.fields ? p.fields.map(field => `"${field}"`).join(', ') : '*',
				`FROM "${p.from}"`,
				whereSql ? [`WHERE`, whereSql] : null,
				p.orderBy ? `ORDER BY "${p.orderBy.field}" ${p.orderBy.dir}` : null,
				p.limit ? `LIMIT @limit` : null
			],
			data: {
				limit: p.limit,
				...whereData
			}
		}
	}
})
