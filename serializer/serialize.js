const utf8 = new TextEncoder()


export function serialize(data, schema){
	this.methods[schema.type].call(this, data, schema)
}

export function object(data, schema){
	if(schema.dynamicProperties.length > 0){
		writeBitfield.call(
			this,
			schema.dynamicProperties.map(
				({ key }) => data[key] != undefined
			)
		)

		for(let { key, schema: subschema } of schema.dynamicProperties){
			serialize.call(this, data[key], subschema)
		}
	}

	for(let { key, schema: subschema } of schema.staticProperties){
		serialize.call(this, data[key], subschema)
	}
}

export function array(data, schema){
	writeSize.call(this, data.length)

	for(let item of data){
		serialize.call(this, item, schema.items)
	}
}

export function string(data){
	let bytes = utf8.encode(data)

	writeSize.call(this, bytes.length)

	for(let i=0; i<bytes.length; i++){
		this.view.setUint8(this.offset++, bytes[i])
	}
}

export function integer(data){
	this.view.setInt32(this.offset, data)
	this.offset += 4
}

export function number(data){
	this.view.setFloat64(this.offset, data)
	this.offset += 8
}

export function blob(data){
	let bytes = new Uint8Array(data)

	this.view.setUint32(this.offset, bytes.length)
	this.offset += 4

	new Uint8Array(this.buffer).set(
		bytes,
		this.offset
	)
	this.offset += bytes.length
}


function writeSize(size){
	writeCompact.call(
		this, 
		new Uint8Array(
			new Uint32Array([size])
				.buffer
		)
	)
}

function writeCompact(data){
	let last = data.length - 1
	let continuations = last
	let bits = 8

	while(!data[last] && last > 0){
		last--
		continuations--
	}

	if(data[last])
		while(!(data[last] & (1 << bits - 1)))
			bits--
	else
		bits = 0
	

	if(bits > 6 - continuations)
		continuations++

	let bytes = new Uint8Array(1 + continuations)

	if(continuations === 0){
		bytes[0] = 128 | data[0]
	}else if(continuations < 8){
		bytes[0] = 255 << (7 - continuations)
	
		for(let i=0; i<=last; i++){
			bytes[continuations - i] |= data[i]
		}
	}else{
		throw `more than ${bits} bits currenty not supported`
	}

	for(let i=0; i<bytes.length; i++){
		this.view.setUint8(this.offset++, bytes[i])
	}
}

function writeBitfield(bits){
	let bytes = Array(Math.ceil(bits.length / 8))
		.fill(0)
		.map(() => 0)

	for(let i=0; i<bits.length; i++){
		let bi = Math.ceil(i / 8)

		if(bits[i])
			bytes[bi] |= 1 << (i % 8)
	}

	for(let i=0; i<bytes.length; i++){
		this.view.setUint8(this.offset++, bytes[i])
	}
}