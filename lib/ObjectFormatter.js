const getType = (v)=>{
	if(typeof v!=="object"){
		let t = typeof v;
		return t.charAt(0).toUpperCase()+t.slice(1).toLowerCase();
	}else{
		if(typeof v=="undefined"){
			return "Undefined";
		}else if(v==null){
			return "Null";
		}else{
			try{
				return v.constructor.name;
			}catch(e){
				return "Undefined";
			}
		}
	}
};
const format = (obj,defs)=>{
	if(!isObject(obj)){obj={};}
	if(!isObject(defs)){defs={};}
	for(let p in defs){
		if(defs.hasOwnProperty(p)&&!(isObject(defs[p])&&defs[p].hasOwnProperty("types")&&Array.isArray(defs[p].types)&&defs[p].hasOwnProperty("def"))){
			delete defs[p];
		}
	}
	for(let p in obj){
		if(obj.hasOwnProperty(p)){
			if(!defs.hasOwnProperty(p)){
				delete obj[p];
				continue;
			}
			if(defs[p].types.indexOf(getType(obj[p]))==-1){
				obj[p]=defs[p].def;
			}
		}
	}
	for(let p in defs){
		if(defs.hasOwnProperty(p)&&!obj.hasOwnProperty(p)&&((!defs[p].hasOwnProperty("required"))||(defs[p].hasOwnProperty("required")&&typeof defs[p].required=="boolean"&&defs[p].required))){
			obj[p]=defs[p].def;
		}
	}
	return obj;
};
const SuperMerge = (o1={},o2={},ops={})=>{
	ops = format(ops,{
		Merge:{
			types:["Array"],
			def:[]
		},
		Prioritize:{
			types:["Array"],
			def:[]
		}
	});
	let f_obj = {};
	if(isObject(o1)&&isObject(o2)){
		for(let p in o2){
			if(o2.hasOwnProperty(p)){
				if(o1.hasOwnProperty(p)){
					if(!isObject(o2[p])){
						if(ops.Merge.indexOf(p)>-1){
							f_obj[p]=o1[p]+o2[p];
						}else{
							f_obj[p]=o2[p];
						}
					}else{
						if(isObject(o1[p])){
							f_obj[p] = SuperMerge(o1[p],o2[p]);
						}else{
							f_obj[p]=o2[p];
						}
					}
				}else{
					f_obj[p]=o2[p];
				}
			}
		}
		for(let p in o1){
			if(o1.hasOwnProperty(p)&&!f_obj.hasOwnProperty(p)){
				f_obj[p]=o1[p];
			}
		}
		for(let i=0;i<ops.Prioritize.length;i++){
			if(o1.hasOwnProperty(ops.Prioritize[i])){
				f_obj[ops.Prioritize[i]]=o1[ops.Prioritize[i]];
			}
		}
	}
	return f_obj;
};
const isObject = (o)=>{
	return typeof o!=="undefined"&&o!==null&&o!==undefined&&typeof o=="object"&&typeof o.constructor!=="undefined"&&o.constructor==Object;
}
module.exports = {format,SuperMerge,isObject};
