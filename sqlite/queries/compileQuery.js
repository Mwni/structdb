export default function({ setters, render }){
	let Query = function(){}
	let data = {}
	
	for(let [key, transform] of Object.entries(setters)){
		Query.prototype[key] = function(value){
			data[key] = transform(value, data[key])
		}
	}

	Query.render = function(){
		let { sql, values } = render(data)
		let ast = sql.slice()
		let frags = []

		while(ast.length > 0){
			let piece = ast.shift()

			if(!piece)
				continue
			else if(Array.isArray(piece))
				ast = [...piece, ...ast]
			else
				frags.push(piece)
		}

		return { 
			sql: frags.join(' '), 
			values 
		}
	}

	return Query
}