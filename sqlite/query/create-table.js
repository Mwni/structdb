import squel from 'squel'

 
class CreateTableBlock extends squel.cls.Block {
	table (name){
		this._name = name
	}

	_toParamString(options){
		return {
				text:   this._name,
				values: []
		}
	}
}
 
class CreateFieldBlock extends squel.cls.Block {
	constructor (options){
		super(options)
		this._fields = []
	}
 
	field(field){
		this._fields.push(field)
	}
 
	_toParamString (options) {
		let str = this._fields
			.map(
				field => 
				[
					`"${field.name}"`,
					field.type,
					field.notNull ? `NOT NULL` : ``,
					field.primary ? `PRIMARY KEY` : ``,
					field.autoincrement ? `AUTOINCREMENT` : ``,
					field.default !== undefined ? `DEFAULT ${JSON.stringify(field.default)}` : ``
				]
				.join(' ')
				.replace(/ +/, ' ')
			)
			.join(', ')
 
		return {
			text: `(${str})`,
			values: []
		}
	}
}
 
export default class CreateTableQuery extends squel.cls.QueryBuilder{
	constructor (options, blocks) {
		super(options, blocks || [
			new squel.cls.StringBlock(options, 'CREATE TABLE'),
			new CreateTableBlock(options),
			new CreateFieldBlock(options),
		])
	}
}