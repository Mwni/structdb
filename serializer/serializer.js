import transformSchema from './schema.js'
import * as serializationMethods from './serialize.js'
import * as deserializationMethods from './deserialize.js'

export default function createSerializer({ schema, buffer }){
	if(!buffer)
		buffer = new ArrayBuffer(1000000)

	let tSchema = transformSchema(schema)
	let view = new DataView(buffer)

	return {
		serialize(data){
			let state = {
				view,
				buffer,
				offset: 0,
				methods: serializationMethods
			}
	
			serializationMethods.serialize.call(state, data, tSchema)
	
			return buffer.slice(0, state.offset)
		},
	
		deserialize(buffer){
			let state = {
				view: new DataView(buffer),
				buffer: buffer,
				offset: 0,
				methods: deserializationMethods
			}
			
			return deserializationMethods.deserialize.call(state, tSchema)
		}
	}
}