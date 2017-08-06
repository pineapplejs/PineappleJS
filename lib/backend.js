const vm = require("vm");
const template = require("./template");
const TAG_REGEX = /<:PINEAPPLE(\s){0,}([\s\S]{0,}?):>/gi;
const BUILT_INS = {
	PrettyJSON:require("./PrettyJSON")
};
const evalInContext = (t,d,toThrow=false)=>{
	try{
		return vm.runInNewContext(t,d);
	}catch(e){
		if(toThrow){
			throw e;
		}
		return "";
	}
};
const backend = class{
	constructor(t="",BI={},templating=true){
		this.backend=t;
		this.BuiltIns = BI;
		this.templating = templating;
	}
	render(data={}){
		let i_data = Object.assign(Object.assign(Object.assign(BUILT_INS,{
			Backend:Object.assign({},data),
			Time:(new Date().getTime())
		}),data),this.BuiltIns);
		let c = this.backend.replace(TAG_REGEX,(F,S,C)=>{
			C = C.trim();
			i_data.PINEAPPLE_CHUNK = "";
			evalInContext("print = (t)=>{PINEAPPLE_CHUNK += t;}",i_data);
			evalInContext(C,i_data,true);
			let cr = i_data.PINEAPPLE_CHUNK;
			delete i_data.PINEAPPLE_CHUNK;
			delete i_data.print;
			return cr;
		});
		if(this.templating){
			return new template(c).render(i_data);
		}else{
			return c;
		}
	}
};
module.exports=backend;
