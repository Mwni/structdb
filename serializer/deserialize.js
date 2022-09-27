const utf8 = new TextDecoder()


export function deserialize(schema){
	return this.methods[schema.type].call(this, schema)
}

export function object(schema){
	let object = {}

	if(schema.dynamicProperties.length > 0){
		let bits = readBitfield.call(this, schema.dynamicProperties.length)

		for(let i=0; i<bits.length; i++){
			if(!bits[i])
				continue

			let { key, schema: subschema } = schema.dynamicProperties[i]

			object[key] = deserialize.call(this, subschema)
		}
	}

	for(let prop of schema.staticProperties){
		object[prop.key] = deserialize.call(this, prop.schema)
	}

	return object
}

export function array(schema){
	let length = readSize.call(this)
	let array = []

	for(let i=0; i<length; i++){
		array.push(deserialize.call(this, schema.items))
	}

	return array
}

export function string(){
	let length = readSize.call(this)
	let string = utf8.decode(new Uint8Array(this.buffer.slice(this.offset, this.offset + length)))

	this.offset += length

	return string
}

export function integer(){
	let integer = this.view.getUint32(this.offset)
	this.offset += 4

	return integer
}

export function number(){
	let number = this.view.getFloat64(this.offset)
	this.offset += 8

	return number
}

export function blob(data){
	let length = this.view.getUint32(this.offset)
	this.offset += 4

	let bytes = new Uint8Array(
		new Uint8Array(this.buffer)
			.slice(this.offset, this.offset+length)
	)
	this.offset += length

	return bytes.buffer
}

function readSize(){
	let bytes = new Uint8Array(4)

	bytes.set(readCompact.call(this))

	return new Uint32Array(bytes.buffer)[0]
}

function readCompact(){
	let head = this.view.getUint8(this.offset)
	let continuations = 0

	while(head & (1 << 6 - continuations))
		continuations++

	let data = new Uint8Array(1 + continuations)

	for(let i=0; i<data.length; i++){
		let byte = this.view.getUint8(this.offset + data.length - i - 1)

		if(i === continuations)
			byte &= 255 >> continuations + 1

		data[i] = byte
	}

	this.offset += data.length

	return data[data.length - 1]
		? data
		: data.slice(0, -1)
}

function readBitfield(numBits){
	let bits = []
	let bytes = Array(Math.ceil(numBits / 8))
		.fill(0)
		.map(() => this.view.getUint8(this.offset++))

	for(let i=0; i<numBits; i++){
		let bi = Math.ceil(bits.length / 8)

		bits.push(
			bytes[bi] & (1 << (i % 8))
		)
	}

	return bits
}