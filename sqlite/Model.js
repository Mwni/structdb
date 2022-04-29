import InsertQuery from './queries/InsertQuery.js'
import SelectQuery from './queries/SelectQuery.js'


export default function compile({ database, config }){
	

	return class{
		get name(){
			return config.table.name
		}

		constructor(data){
			Object.assign(this, data)
		}

		async createOne({ data: inputData }){
			let tableData = {}

			for(let { key } of config.table.fields){
				if(!inputData.hasOwnProperty(key))
					continue
				
				tableData[key] = inputData[key]
			}

			let { lastInsertRowid } = database.run(
				new InsertQuery()
					.data(tableData)
					.into(config.table.name)
			)

			return await this.readOne({ rowid: lastInsertRowid })
		}

		async readOne({ where }){
			let row = database.get(
				new SelectQuery('*')
					.from(config.table.name)
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
}