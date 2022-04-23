import { deriveBlueprint } from './schema.js'
import * as encodeMethods from './encode.js'
import * as decodeMethods from './decode.js'


export default class Codec{
	constructor(schema){
		this.schema = deriveBlueprint(schema)
		this.buffer = new ArrayBuffer(1000000)
		this.view = new DataView(this.buffer)
	}

	encode(data){
		let state = {
			view: this.view,
			buffer: this.buffer,
			offset: 0,
			methods: encodeMethods
		}

		encodeMethods.encode.call(state, data, this.schema)

		return this.buffer.slice(0, state.offset)
	}

	decode(buffer){
		let state = {
			view: new DataView(buffer),
			buffer: buffer,
			offset: 0,
			methods: decodeMethods
		}
		
		return decodeMethods.decode.call(state, this.schema)
	}
}