import squel from 'squel'

 
class CreateIndexBlock extends squel.cls.Block {
	unique (unique){
		this._unique = unique
	}

	_toParamString(options){
		return {
			text: this._unique ? `CREATE UNIQUE INDEX` : `CREATE INDEX`,
			values: []
		}
	}
}

class CreateNameBlock extends squel.cls.Block {
	name (name){
		this._name = name
	}

	_toParamString(options){
		return {
			text: this._name,
			values: []
		}
	}
}

class CreateOnTableBlock extends squel.cls.Block {
	on (name){
		this._name = name
	}

	_toParamString(options){
		return {
			text: `ON "${this._name}"`,
			values: []
		}
	}
}
 
class CreateFieldBlock extends squel.cls.Block {
	constructor (options){
		super(options)
		this._fields = []
	}

	fields(fields){
		this._fields = fields
	}
 
	field(field){
		this._fields.push(fields)
	}
 
	_toParamString (options) {
		let str = this._fields
			.map(name => `"${name}"`)
			.join(', ')
 
		return {
			text: `(${str})`,
			values: []
		}
	}
}
 
export default class CreateIndexQuery extends squel.cls.QueryBuilder{
	constructor (options, blocks) {
		super(options, blocks || [
			new CreateIndexBlock(options),
			new CreateNameBlock(options),
			new CreateOnTableBlock(options),
			new CreateFieldBlock(options),
		])
	}
}