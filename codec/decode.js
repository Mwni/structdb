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
	let array = []
	let length = this.view.getUint32(this.offset)

	this.offset += 4

	for(let i=0; i<length; i++){
		array.push(decode.call(this, schema.items))
	}

	return array
}

export function string(){
	let length = this.view.getUint32(this.offset)
	this.offset += 4

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