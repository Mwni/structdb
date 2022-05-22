export function create({ schema, codecs }){
	let fieldEncoders = {}
	let fieldDecoders = {}

	for(let [key, prop] of Object.entries(schema.properties)){
		let def = codecs.find(codec => {
			if(codec.acceptsType && codec.acceptsType !== prop.type)
				return false

			if(codec.acceptsFormat && codec.acceptsFormat !== prop.format)
				return false

			return true
		})

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