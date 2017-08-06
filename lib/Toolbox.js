const ActualPath = (f)=>{
	f = String(f);
	let fp = "";
	let parameters_open = false;
	for(let i=0;i<f.length;i++){
		if(f.charAt(i)=="?"){
			parameters_open = true;
		}
		if(parameters_open||(f.charAt(i)=="/"&&(fp.slice(-1)==""||fp.slice(-1)!==f.charAt(i)))||
			(f.charAt(i)!=="/"&&f.charAt(i)!=="\\")){
			fp+=f.charAt(i);
		}else if(f.charAt(i)=="\\"&&fp.charAt(fp.length-1)!==f.charAt(i)&&fp.charAt(fp.length-1)!=="/"){
			fp+="/";
		}
	}
	if(fp!=="/"){
		for(let i=fp.length-1;i>-1;i--){
			if(fp.charAt(i)=="/"){
				fp = fp.slice(0,-1);
			}else{
				break;
			}
		}
	}
	return fp;
};
const GetName = (p,o)=>{
	for(let s in o){
		if(o.hasOwnProperty(s)&&s.toUpperCase()==p.toUpperCase()){
			return s;
		}
	}
	return null;
};
const GetValue = (p,o)=>o[GetName(p,o)];
const Has = (p,o)=>GetName(p,o)!==null;
module.exports = {ActualPath,GetName,GetValue,Has};
