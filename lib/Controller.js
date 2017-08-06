const OF = require("./ObjectFormatter");
const Toolbox = require("./Toolbox");
module.exports=class{
	constructor(_PATH="/",_GET={},_Data={},_Method="GET",_RCookies={},_Request_Headers={},_URL="http://127.0.0.1/",_Request={}){
		this._PATH=_PATH;
		this._GET=_GET;
		this._Data=_Data;
		this._Method=_Method;
		this._Request_Cookies=_RCookies;
		this._Request_Headers = _Request_Headers;
		this._URL = _URL;
		this._Request = _Request;

		this._Cookies=[];
		this._Status=200;
		this._Headers={};
		this._Content="";
		this._Encoding = "utf8";
		this._Message = null;
		/*this._Credentials = {
			username:"",
			password:""
		};
		this._AuthorizationEnabled=false;*/
		this._Serve = "";
		this._Backend = {};
		this._Trigger = [];
	}
	Cookie(c,val,ops){
		if(typeof c=="undefined"){return false;}
		if(OF.isObject(c)){
			this._Cookies.push(c);
			return this;
		}
		if(typeof c=="string"&&c.length>0){
			if(typeof val!=="undefined"){
				let fc = {Name:c,Value:val};
				if(OF.isObject(ops)){
					if(ops.hasOwnProperty("Action")){
						if(ops.Action.toString().toUpperCase()=="DELETE"){
							fc.Expires = 0;
						}
						delete ops.Action;
					}
					fc = Object.assign(ops,fc);
				}
				this._Cookies.push(fc);
				return this;
			}else{
				for(let i=0;i<this._Cookies.length;i++){
					if(this._Cookies[i].Name==c){
						return this._Cookies[i].Value;
					}
				}
				if(this._Request_Cookies.hasOwnProperty(c)){
					return this._Request_Cookies[c];
				}
				return null;
			}
		}
		return this;
	}
	Header(h,val,ops){
		if(typeof h=="object"&&h!==null&&h.constructor.name=="Object"){
			if(typeof val=="boolean"&&val==true){
				for(let p in h){
					if(!(this._Headers.hasOwnProperty(p))&&h.hasOwnProperty(p)){
						this.Header(p,h[p]);
					}
				}
			}else{
				this._Headers=Object.assign(this._Headers,h);
				for(let p in h){
					if(h.hasOwnProperty(p)){
						this.Header(p,h[p]);
					}
				}
			}
			return this;
		}
		if(typeof h=="string"&&h.length>0){
			if(typeof val=="string"||(typeof val=="object"&&Array.isArray(val))){
				if(typeof ops!=="undefined"&&ops!==null&&ops.constructor.name=="Object"){
					if(ops.hasOwnProperty("Action")){
						if(ops.Action.toString().toUpperCase()=="DELETE"&&this._Headers.hasOwnProperty(h)){
							delete this._Headers[h];
							return this;
						}
					}
				}
				if(Array.isArray(val)){
					val = val.filter(v=>typeof v=="string");
				}
				if(typeof val=="string"||(Array.isArray(val)&&val.length>0)){
					this._Headers[h]=val;
				}
				return this;
			}else{
				return Toolbox.GetValue(h,this._Headers);
			}
		}
		return this;
	}
	Status(s){
		if(typeof s=="undefined"){return this._Status;}
		if((typeof s=="number"&&s!==NaN)||(typeof s=="string"&&!isNaN(s)&&parseInt(s)!==NaN)){
			if(typeof s=="number"){
				this._Status=s;
			}else{
				this._Status=parseInt(s);
			}
		}
		return this;
	}
	Encoding(e){
		if(typeof e=="undefined"){return this._Encoding;}
		if(typeof e=="string"&&e.length>0){
			this._Encoding=e;
		}
		return this;
	}
	Write(t,op){
		if(typeof op=="undefined"||op=="+"){
			try{
				this._Content+=t.toString();
			}catch(e){
				this._Content+=String(t);
			}
		}else if(op=="="){
			this._Content=t.toString();
		}
		return this;
	}
	Serve(f){
		if(typeof f=="undefined"){return this._Serve;}
		if((typeof f=="string"&&f.length>0)||(typeof f=="number"&&f!==NaN&&f>0&&f!==Infinity)){
			this._Serve=f;
		}
		return this;
	}
	Message(m){
		if(typeof m=="undefined"){return this._Message;}
		if(typeof m=="string"){this._Message=m;this._MessageSelected=true;}
		return this;
	}
	Backend(n,v){
		if(typeof n=="undefined"){return this._Backend;}
		if(typeof n=="string"&&typeof v=="undefined"){return this._Backend.hasOwnProperty(n)?this._Backend[n]:null;}
		if(typeof n=="string"){
			this._Backend[n] = v;
		}
		return this;
	}
	Trigger(e){
		if(typeof e=="string"&&e.length>0){
			this._Trigger.push(e);
		}else if(typeof e=="object"&&Array.isArray(e)){
			e = e.filter(v=>typeof v=="string"&&v.length>0);
			if(e.length>0){
				this._Trigger.concat(e);
			}
		}else{
			return this._Trigger;
		}
	}
	RequestHeader(h=""){
		return Toolbox.GetValue(h,this._Request_Headers);
	}
	/*SetCredentials(u,p){
		if(typeof u=="string"&&typeof p=="string"){
			this._Credentials.username=u;
			this._Credentials.password=p;
			this._AuthorizationEnabled=true;
		}
		return this;
	}*/
	get Path(){
		return this._PATH;
	}
	get GET(){
		return Object.assign({},this._GET);
	}
	get Data(){
		return Object.assign({},this._Data);
	}
	get Method(){
		return this._Method;
	}
	get URL(){
		return this._URL;
	}
	get Request(){
		return this._Request;
	}
	get Headers(){
		return this._Headers;
	}
	get Cookies(){
		return Object.assign((()=>{
			let fco = {};
			for(let i=0;i<this._Cookies.length;i++){
				if(OF.isObject(this._Cookies[i])&&this._Cookies[i].hasOwnProperty("Name")&&typeof this._Cookies[i].Name=="string"&&this._Cookies[i].hasOwnProperty("Value")){
					fco[this._Cookies[i].Name] = this._Cookies[i].Value;
				}
			}
			return fco;
		})(),this._Request_Cookies);
	}
	get CookiesToSet(){
		return this._Cookies;
	}
	get Content(){
		return this._Content;
	}
	get RequestHeaders(){
		return this._Request_Headers;
	}
}
