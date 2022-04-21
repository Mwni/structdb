import { deriveBlueprint } from './schema.js'


export default class Codec{
	constructor(schema){
		this.blueprint = deriveBlueprint(schema)

		console.log(this.blueprint)
	}

	encode(data){
		
	}

	#encodeObject(){

	}
}