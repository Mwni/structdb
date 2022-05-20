import transformSchema from './schema.js'
import * as serializationMethods from './serialize.js'
import * as deserializationMethods from './deserialize.js'

export default function createSerializer({ schema }){
	let tSchema = transformSchema(schema)
	let buffer = new ArrayBuffer(1000000)
	let view = new DataView(buffer)

	return {
		serialize(data){
			let state = {
				view,
				buffer,
				offset: 0,
				methods: serializationMethods
			}
	
			serializationMethods.encode.call(state, data, tSchema)
	
			return buffer.slice(0, state.offset)
		},
	
		deserialize(buffer){
			let state = {
				view: new DataView(buffer),
				buffer: buffer,
				offset: 0,
				methods: deserializationMethods
			}
			
			return deserializationMethods.decode.call(state, tSchema)
		}
	}
}