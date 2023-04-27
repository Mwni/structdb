import sql from '../../sql/index.js'
import { composeFilter } from '../common.js'


export async function remove({ database, struct, where = {}, limit }){
	return await database.exec(
		sql.delete({
			table: struct.table.name,
			tableAlias: 'T',
			where: composeFilter({ where, struct }),
			/*orderBy: {
				[struct.table.idKey]: 'asc'
			},
			limit*/
		})
	)
}