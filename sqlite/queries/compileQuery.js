export default function({ setters, render }){
	let Query = function(){}
	let data = {}
	
	for(let [key, transform] of Object.entries(setters)){
		Query.prototype[key] = function(value){
			data[key] = transform(value, data[key])
			return this
		}
	}

	Query.prototype.render = function(){
		let { sql, data: renderedData } = render(data)
		let ast = sql.slice()
		let frags = []

		while(ast.length > 0){
			let piece = ast.shift()

			if(!piece)
				continue

			if(Array.isArray(piece)){
				ast = [...piece, ...ast]
				continue
			}

			if(typeof piece === 'object' && piece.list){
				ast = [
					`(`,
					...piece.list
						.map((item, i) => [i > 0 ? `,` : null, item]),
					`)`,
					...ast
				]
				continue
			}

			frags.push(piece)
		}

		console.log({ 
			sql: frags.join(' '), 
			data: renderedData
		})

		return { 
			sql: frags.join(' '), 
			data: renderedData || {}
		}
	}

	return Query
}