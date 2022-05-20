import compile from './lib/compile.js'
import { compose as composeWhere } from './lib/where.js'

export default compile({
	setters: {
		table: x => x,
		set: x => x,
		where: x => x,
		limit: x => x,
		offset: x => x,
	},
	render: p => {
		let { sql: whereSql, data: whereData } = composeWhere(p.where)

		return {
			sql: [
				`UPDATE "${p.table}"`,
				`SET`,
				Object.keys(p.set).map(key => `"${key}" = @${key}`).join(', '),
				whereSql ? [`WHERE`, whereSql] : null,
				p.limit ? `LIMIT @limit` : null
			],
			data: {
				...p.set,
				...whereData,
				limit: p.limit
			}
		}
	}
})