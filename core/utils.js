export function deepCompare(obj1, obj2, reversed){
	for(let key in obj1){
		if(typeof obj1[key] === 'object' && typeof obj2[key] === 'object'){
			if(!deepCompare(obj1[key], obj2[key])) 
				return false
		}else if(obj1[key] !== obj2[key]) 
			return false
	}

	return reversed ? true : deepCompare(obj2, obj1, true)
}