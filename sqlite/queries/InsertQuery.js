export default class{
	constructor(){
		this.joins = []
		this.wheres = []
	}

	into(table){
		this.table = table
		return this
	}

	data(data){
		this.data = data
		return this
	}

	sql(){
		let frags = []

		frags.push(`INSERT`)
		frags.push(`INTO "${this.table}"`)
		frags.push(`(${Object.keys(this.data).map(key => `"${key}"`)})`)
		frags.push(`VALUES`)
		frags.push(`(${Object.keys(this.data).map(key => `@${key}`)})`)

		return frags.join(' ')
	}

	values(){
		return [this.data]
	}
}