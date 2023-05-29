import anyTypeCodec from './type-any.js'
import arrayTypeCodec from './type-array.js'
import booleanTypeCodec from './type-boolean.js'
import dateTypeCodec from './type-date.js'
import enumCodec from './enum.js'

export default [
	anyTypeCodec,
	arrayTypeCodec,
	booleanTypeCodec,
	dateTypeCodec,
	enumCodec
]