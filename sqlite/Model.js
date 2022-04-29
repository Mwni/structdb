import InsertQuery from './queries/InsertQuery.js'
import SelectQuery from './queries/SelectQuery.js'


export default function createModel({ data: modelData, database, config }){
	class Model{
		constructor(data){
			Object.assign(this, data)
		}

		async createOne({ data: inputData }){
			let tableData = {}

			for(let { key } of config.head.table.fields){
				if(!inputData.hasOwnProperty(key))
					continue
				
				tableData[key] = inputData[key]
			}

			let { lastInsertRowid } = database.run(
				new InsertQuery()
					.data(tableData)
					.into(config.head.table.name)
			)

			return await this.readOne({ rowid: lastInsertRowid })
		}

		async readOne({ where }){
			let row = database.get(
				new SelectQuery('*')
					.from(config.head.table.name)
					.where(where)
					.limit(1)
			)

			if(!row)
				return null

			return createModel({
				data: row,
				database,
				config
			})
		}
	}

	return new Model(modelData)
}