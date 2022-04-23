const utf8 = new TextEncoder()


export function encode(data, schema){
	this.methods[schema.type].call(this, data, schema)
}

export function object(data, schema){
	for(let prop of schema.staticProperties){
		encode.call(this, data[prop.key], prop.schema)
	}
}

export function array(data, schema){
	writeSize.call(this, data.length)

	for(let item of data){
		encode.call(this, item, schema.items)
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


function writeSize(size){
	writeCompact.call(this, new Uint8Array(new Uint32Array([size]).buffer))
}

function writeCompact(data){
	let last = data.length - 1
	let continuations = last
	let bits = 8

	while(!data[last]){
		last--
		continuations--
	}

	while(!(data[last] & (1 << bits - 1)))
		bits--

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