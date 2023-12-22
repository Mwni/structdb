import * as queryBuilders from './queries/index.js'

function compile(tree){
	if(typeof tree === 'string'){
		tree = {
			text: tree
		}
	}else if(Array.isArray(tree)){
		tree = {
			text: `%`,
			join: ` `,
			items: tree,
			values: []
		}
	}

	let sql = tree.text || tree.sql
	let values = tree.values || []

	if(tree.items){
		let itemTexts = []
		let itemValues = []

		for(let item of tree.items){
			if(!item)
				continue

			let { sql, values } = compile(item)

			itemTexts.push(sql)
			itemValues.push(...values)
		}

		sql = sql.replace('%', itemTexts.join(tree.join || ' '))
		values = [...values, ...itemValues]
	}

	return { sql, values }
}




export default Object.entries(queryBuilders).reduce(
	(queries, [key, builder]) => ({ 
		...queries, 
		[key]: args => compile(builder(args))
	}),
	{}
)