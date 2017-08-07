"use strict";
const OF = require("./ObjectFormatter");
const MAX_DATE_VALUE = 8640000000000000;
const CookieDefs = {
	Name:{
		types:["String"],
		def:""
	},
	Value:{
		types:["String"],
		def:""
	},
	Expires:{
		types:["Date","Number","String"],
		def:new Date(MAX_DATE_VALUE),
		required:false
	},
	MaxAge:{
		types:["String","Number"],
		def:86400,
		required:false
	},
	Domain:{
		types:["String"],
		def:"",
		required:false
	},
	Path:{
		types:["String"],
		def:"/",
		required:false
	},
	Secure:{
		types:["Boolean"],
		def:false
	},
	HttpOnly:{
		types:["Boolean"],
		def:false
	}
};
const cook = (c)=>{
	let fh = "";
	let AddAttr = (_name,_val)=>{
		if(typeof _name=="undefined"){_name="";}
		if(typeof _val=="undefined"){_val="";}
		if(_name.length>0){
			fh+="; "+_name;
			if(_val.length>0){
				fh+="="+_val;
			}
		}
	};
	c=OF.format(c,CookieDefs);
	if(c.Name.length>0&&c.Value.length>0){
		fh+=encodeURIComponent(c.Name)+"="+encodeURIComponent(c.Value);
		if(c.hasOwnProperty("Expires")){
			if(typeof c.Expires!=="string"){
				switch(c.Expires.constructor.name){
					case "Date":{
						c.Expires=c.Expires.toUTCString();
					}
					break;
					case "Number":{
						if(c.Expires<(-MAX_DATE_VALUE)){
							c.Expires=(-MAX_DATE_VALUE);
						}else if(c.Expires>MAX_DATE_VALUE){
							c.Expires=MAX_DATE_VALUE;
						}
						c.Expires=new Date(c.Expires).toUTCString();
					}
					break;
					default:{
						c.Expires=new Date(MAX_DATE_VALUE).toUTCString();
					}
				}
			}
			AddAttr("Expires",c.Expires);
		}
		if(c.hasOwnProperty("MaxAge")){
			if(typeof c.MaxAge=="string"){
				c.MaxAge=parseInt(c.MaxAge);
			}
			if(c.MaxAge!==NaN){
				AddAttr("Max-Age",c.MaxAge);
			}
		}
		if(c.hasOwnProperty("Domain")){
			AddAttr("Domain",c.Domain);
		}
		if(c.hasOwnProperty("Path")){
			AddAttr("Path",c.Path);
		}
		if(c.Secure){
			AddAttr("Secure");
		}
		if(c.HttpOnly){
			AddAttr("HttpOnly");
		}
		return fh;
	}
	return null;
}; // Set-Cookie
const eat = (c)=>{
	let fc = {};
	c=c.trim().replace(/;\s/g,";").split(";").filter((t)=>{return t.split("=").filter((s)=>{return s.length>0;}).length>1;});
	for(let i=0;i<c.length;i++){
		fc[decodeURIComponent(c[i].split("=")[0])]=decodeURIComponent(c[i].split("=").slice(1).join("="));
	}
	return fc;
} // Cookie
module.exports = {cook,eat};
