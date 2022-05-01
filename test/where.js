import SelectQuery from "@jxdb/sqlite/queries/SelectQuery.js";

let query = new SelectQuery()
	.from('Test')
	.where({
		OR: [
			{
				a: 1,
			},
			{
				a: {
					in: [10,11,12]
				}
			}
		]
	})

console.log(query.render())