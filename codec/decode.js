const utf8 = new TextDecoder()


export function decode(schema){
	return this.methods[schema.type].call(this, schema)
}

export function object(schema){
	let object = {}

	for(let prop of schema.staticProperties){
		object[prop.key] = decode.call(this, prop.schema)
	}

	return object
}

export function array(schema){
	let length = readSize.call(this)
	let array = []

	for(let i=0; i<length; i++){
		array.push(decode.call(this, schema.items))
	}

	return array
}

export function string(){
	let length = readSize.call(this)
	let string = utf8.decode(this.buffer.slice(this.offset, this.offset + length))

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