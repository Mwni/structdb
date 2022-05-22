import squel from 'squel'


export default class UpsertQuery extends squel.cls.QueryBuilder{
	constructor (options, blocks) {
		super(options, blocks || [
			new squel.cls.StringBlock(options, 'INSERT'),
			new squel.cls.IntoTableBlock(options),
			new squel.cls.InsertFieldValueBlock(options),
			new squel.cls.InsertFieldsFromQueryBlock(options),
			new squel.cls.StringBlock(options, 'ON CONFLICT DO UPDATE SET'),
			new UpsertSetFieldBlock(options)
		])

		this.insertSetFields = this.setFields
		this.setFields = fields => {
			this.insertSetFields(fields)
			this.setUpsertKeys(Object.keys(fields))
			return this
		}
	}
}

class UpsertSetFieldBlock extends squel.cls.Block {
	constructor (options){
		super(options)
		this._keys = []
	}

	setUpsertKeys(keys){
		this._keys = keys
	}

	_toParamString(options){
		return {
			text: this._keys.map(key => `"${key}" = excluded."${key}"`),
			values: []
		}
	}
}
