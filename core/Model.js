import Schema from './Schema.js'


export default class Model{
	constructor(schema){
		this.schema = new Schema(schema)
	}
}