export function create({ schema, codecs }){
	let fieldEncoders = {}
	let fieldDecoders = {}

	for(let [key, prop] of Object.entries(schema.properties)){
		let def = select({ schema: prop, codecs })

		if(!def)
			continue

		fieldEncoders[key] = def.encode
		fieldDecoders[key] = def.decode
	}

	return {
		encode(data){
			let encoded = { ...data }

			for(let [k, v] of Object.entries(data)){
				if(k in fieldEncoders)
					encoded[k] = fieldEncoders[k](v)
			}

			return encoded
		},

		decode(data){
			let decoded = { ...data }

			for(let [k, v] of Object.entries(data)){
				if(k in fieldDecoders)
					decoded[k] = fieldDecoders[k](v)
			}

			return decoded
		}
	}
}

export function select({ schema, codecs }){
	return codecs.find(codec => {
		if(codec.acceptsType && codec.acceptsType !== schema.type)
			return false

		if(codec.acceptsFormat && codec.acceptsFormat !== schema.format)
			return false

		return true
	})
}