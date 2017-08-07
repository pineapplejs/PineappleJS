"use strict";
const vm = require("vm");
const TEMPLATE_REGEXP = /\{\{\s?(.*?)\s?\}\}/gi;
const LOOP_START_REGEXP = /\{\{\s?([A-Za-z0-9_$]{1,})\s{1,}in\s{1,}(.*){1,}\s?\}\}/i;
const LOOP_END_REGEXP = /\{\{\s?\/([A-Za-z0-9_$]{1,})\s?\}\}/i;
const evalInContext = (t,d,toThrow)=>{
	if(typeof toThrow=="undefined"){toThrow=false;}
	try{
		return vm.runInNewContext(t,d);
	}catch(e){
		if(toThrow){
			throw e;
		}
		return "";
	}
};
const template = class{
	constructor(t,BI){
		if(typeof t=="undefined"){t="";}
		if(typeof BI=="undefined"){BI={};}
		this.t = t;
		this.BuiltIns = BI;
	}
	render(o){
		if(typeof o=="undefined"){o={};}
		let t_data = Object.assign({},o);
		let loops = [];
		let __ID__ = 0;
		let LoopIDs = [];
		let GetID = (n)=>{
			let a = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
			let r = n % a.length;
			let result;
			if(n-r==0){
				result = a.charAt(r);
			}else{
				result = GetID((n-r)/a.length)+a.charAt(r);
			}
			return result;
		};
		let GenID = ()=>{
			return GetID(__ID__++);
		};
		let GenTag = (id)=>{
			return new RegExp("<!PINEAPPLE_LOOP#"+id+">([\\s\\S]{1,})?<\/!PINEAPPLE_LOOP#"+id+">","g");
		};
		let GenMatcher = (id,ender)=>{
			return new RegExp("<!PINEAPPLE_LOOP#"+id+">([\\s\\S]{1,})?"+ender,"g");
		};
		let OpenID = ()=>{
			for(let i=loops.length-1;i>-1;i--){
				if(!loops[i].closed){
					return loops[i].id;
				}
			}
			return "";
		};
		let isLoopOpen = ()=>OpenID().length>0;
		let c = this.t;
		c = c.replace(TEMPLATE_REGEXP,function(){
			let groups = arguments;
			let _Full = groups[0];
			if(LOOP_START_REGEXP.test(_Full)){
				// Start of loop
				let n_groups = LOOP_START_REGEXP.exec(_Full);
				let _ARR = evalInContext(n_groups[2],t_data);
				let l_id = GenID();
				loops.push({
					var_name:n_groups[1],
					arr:_ARR,
					len:_ARR.length,
					index:0,
					start_position:groups[groups.length-2]+_Full.length,
					id:l_id,
					closed:false
				});
				return ("<!PINEAPPLE_LOOP#"+l_id+">");
			}else if(LOOP_END_REGEXP.test(_Full)){
				// End of loop
				let n_groups = LOOP_END_REGEXP.exec(_Full);
				let itrtr = n_groups[1];
				let s_loop = null;
				let in_s = null;
				for(let i=0;i<loops.length;i++){
					if(loops[i].var_name==itrtr){
						loops[i].end_position=groups[groups.length-2];
						loops[i].closed=true;
						s_loop = loops[i];
						in_s = i;
						break;
					}
				}
				if(s_loop!==null){
					s_loop.content = c.substring(s_loop.start_position,s_loop.end_position);
					let f_c = "";
					for(;s_loop.index<s_loop.len;s_loop.index++){
						t_data[s_loop.var_name] = s_loop.arr[s_loop.index];
						f_c += new template(s_loop.content).render(t_data);
					}
					let s_id = s_loop.id;
					delete t_data[s_loop.var_name];
					loops.splice(in_s,1);
					LoopIDs.push(s_id);
					return ("</!PINEAPPLE_LOOP#"+s_id+">"+f_c);
				}
				return "";
			}else{
				// Var
				return (evalInContext(groups[1],t_data));
			}
		});
		for(let i=0;i<LoopIDs.length;i++){
			c = c.replace(GenTag(LoopIDs[i]),"");
		}
		c = c.replace(/<!PINEAPPLE_LOOP(#[A-Z]{1,})?>/gi,"").replace(/<\/!PINEAPPLE_LOOP(#[A-Z]{1,})?>/g,"");
		return c;
	}
};
module.exports = template;
