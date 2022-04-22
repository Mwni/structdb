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
	this.view.setUint32(this.offset, data.length)
	this.offset += 4

	for(let item of data){
		encode.call(this, item, schema.items)
	}
}

export function string(data){
	let bytes = utf8.encode(data)

	this.view.setUint32(this.offset, bytes.length)
	this.offset += 4

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