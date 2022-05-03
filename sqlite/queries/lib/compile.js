export default function({ setters, render }){
	class Query{
		constructor(){
			this.$data = {}
		}

		render(){
			let { sql, data: renderedData } = render(this.$data)
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
						piece.braces !== false ? `(` : null,
						...piece.list
							.map((item, i) => [i > 0 ? piece.join || ',' : null, item]),
							piece.braces !== false ? `)` : null,
						...ast
					]
					continue
				}

				frags.push(piece)
			}

			/*console.log({ 
				sql: frags.join(' '), 
				data: renderedData
			})*/

			return { 
				sql: frags.join(' '), 
				data: renderedData || {}
			}
		}
	}

	for(let [key, transform] of Object.entries(setters)){
		Query.prototype[key] = function(value){
			this.$data[key] = transform(value, this.$data[key])
			return this
		}
	}

	return Query
}