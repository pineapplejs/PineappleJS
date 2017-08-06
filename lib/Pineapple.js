// TODO:
	// .pineappleconfig file
	// Base directory
	// File indexing for public folders.

const OF = require("./ObjectFormatter");
const Toolbox = require("./Toolbox");
const CookieChef = require("./CookieChef");
const HTTP_CODES = require("./HTTP_Codes");
const MIME_TYPES = require("./ContentTypes");

const http = require("http");
const https = require("https");
const fs = require("fs");
const querystring = require("querystring");
const url = require("url");
const __PATH__ = require("path");
const vm = require("vm");

const backend = require("./backend");
const Controller = require("./Controller");

const _Events = ["start","request","response","error","server_error"];
const RespDefs = {
	Status: {types:["Number","Function"],def:null},
	Content: {types:["String","Function"],def:""},
	Headers: {types:["Object","Function"],def:{}},
	Encoding: {types:["String"],def:null},
	Backend:{types:["Object","Function"],def:{}},
	Serve:{types:["String","Function","Number"],def:"",required:false},
	Controller:{types:["Function"],def:(c)=>{}},
	Message:{types:["String","Function"],def:null}
};
const PageDefs = {
	CaseSensitive: {types:["Boolean"],def:false},
	Accepts:{types:["Array"],def:["*"]},
	Response:{types:["Function","Object"],def:()=>{return {};}},
	Path:{types:["String"],def:"/"},
	Serve:{types:["String","Number"],def:"",required:false},
	Controller:{types:["Function"],def:c=>{}},
	Realm:{types:["String"],def:"",required:false},
	Template:{types:["Boolean"],def:false}
};
const RequestResponseDefs = {
	Headers:{
		types:["Object"],
		def:{
			"Content-Type":"text/html"
		}
	},
	Message:{
		types:["String"],
		def:"OK"
	},
	Status:{
		types:["Number"],
		def:200
	},
	Response:{
		types:["String","Buffer"],
		def:""
	},
	Encoding:{
		types:["String","Function"],
		def:"utf8"
	}
};
const Indexes = [
	"index.html",
	"index.htm",
	"home.html",
	"home.htm"
];
module.exports = class{
	constructor(ops){
		if(!OF.isObject(ops)){
			ops = {protocol:"http"};
		}
		if(typeof ops.protocol!=="string"){
			ops.protocol = "http";
		}
		if(ops.protocol.toUpperCase()=="HTTPS"){
			this._protocol = https;
			delete ops.protocol;
			this._options = [ops];
			this._isHTTPS = true;
		}else{
			this._protocol = http;
			this._options = [];
			this._isHTTPS = false;
		}
		this.version = require("../package.json").version;
		this.ContentTypes=MIME_TYPES;
		this.runningServer=[];
		this.runBackend = ["","html","json","xml","txt","htm","yaml","yml","js","css"];
		this.GlobalControllers = [];
		this.HTTP_CODES=HTTP_CODES;
		this.pages = [
			...(()=>{
				let fea = [];
				for(let p in this.HTTP_CODES){
					fea.push(OF.format({
						Path:("#"+p),
						Response:{
							Backend:{
								code:p,
								message:this.HTTP_CODES[p],
								version:this.version
							},
							Status:parseInt(p),
							Serve:__PATH__.join(__dirname,"Pages","Error.html")
						},
						Template:true
					},PageDefs));
				}
				return fea;
			})()
		];
		this.events = {
			pages:[],
			HTTP_CODES:[]
		};
		for(let i=0;i<_Events.length;i++){
			this.events[_Events[i]]=[];
		}
		this.aliases = [];
		this.SuperURLs = [];
		this.realms={};
		this.config = {
			port:process.env.PORT||80,
			https_port:443,
			enable_HEAD:true,
			enable_OPTIONS:true,
			auto_https:true,
			templating:false
		};
	}
	GET_EXTENSION(f){
		return f.split("/").pop().split("\\").pop().split(".").pop();
	}
	GET_TYPE(f){
		if(typeof f!=="string"||f.length==0){return "text/plain";}
		f=Toolbox.GetValue(this.GET_EXTENSION(f),this.ContentTypes);
		return f==null?"text/html":f;
	}
	on(evt,callback,third,fourth){
		let isGlobalController = typeof evt=="function"&&typeof callback=="undefined";
		if(isGlobalController){
			this.GlobalControllers.push(evt);
			return this;
		}
		if(typeof evt!=="string"){return false;}
		let isEvent = typeof callback=="function"&&this.events.hasOwnProperty(evt)&&_Events.indexOf(evt)>-1;
		let isPage = evt.charAt(0)=="/"&&typeof callback=="object"&&OF.isObject(callback);
		let isErrorPage = evt.charAt(0)=="#"&&typeof callback=="object"&&!isNaN(evt.substr(1,evt.length))&&evt.length>1;
		let isPageEvent = typeof callback=="function"&&evt.charAt(0)=="/";
		let isErrorEvent = typeof callback=="function"&&evt.charAt(0)=="#"&&!isNaN(evt.substr(1,evt.length))&&evt.length>1;
		let isAlias = (evt.charAt(0)=="/")&&typeof callback=="string";
		let isMIMEType = evt.charAt(0)=="."&&evt.length>1&&typeof callback=="string"&&callback.split("/").filter(v=>v.length>0).length>1;
		let isSuperURLPage = evt.charAt(0)=="/"&&typeof callback=="object"&&OF.isObject(callback)&&typeof third=="object"&&OF.isObject(third);
		let isBackendRunner = evt.charAt(0)=="."&&evt.length>1&&typeof callback=="boolean";
		let isUserCredentials = evt.charAt(0)=="|"&&evt.length>1&&typeof callback=="string"&&typeof third=="string";
		if(!isEvent&&!isPage&&!isErrorPage&&!isPageEvent&&!isErrorEvent&&!isAlias&&!isMIMEType&&!isSuperURLPage&&!isBackendRunner&&!isGlobalController&&!isUserCredentials){return false;}
		if(isEvent){
			this.events[evt].push(callback);
		}else if(isSuperURLPage){
			if(Object.keys(callback).length>0){
				let sup = OF.format(third,PageDefs);
				delete sup.Path;
				this.SuperURLs.push([evt,callback,sup]);
			}else{
				return this.on(evt,third);
			}
		}else if(isPage||isErrorPage){
			var page = OF.format(callback,PageDefs);
			page.Path = evt;
			this.pages.push(page);
		}else if(isPageEvent){
			let PECS = false;
			if(typeof third=="boolean"){
				PECS = third;
			}
			this.events.pages.push({
				Path:evt,
				callback:callback,
				CaseSensitive:PECS
			});
		}else if(isErrorEvent){
			this.events.HTTP_CODES.push({
				code:parseInt(evt.substr(1,evt.length)),
				callback:callback
			});
		}else if(isAlias){
			let SC = 301;
			let ACS = false;
			if(typeof third=="boolean"){
				ACS = third;
			}
			if(typeof fourth=="number"&&(fourth==302||fourth==301)){
				SC = fourth;
			}
			this.aliases.push([evt,callback,ACS,SC]);
		}else if(isMIMEType){
			this.ContentTypes[evt.slice(1)]=callback;
		}else if(isBackendRunner){
			if(callback&&this.runBackend.indexOf(evt)<=-1){
				this.runBackend.push(evt.slice(1).toLowerCase());
			}else if(this.runBackend.indexOf(evt)>-1&&!callback){
				this.runBackend.splice(this.runBackend.indexOf(evt),1);
			}
		}else if(isUserCredentials){
			let realm = evt.slice(1);
			if(!Toolbox.Has(realm,this.realms)){
				this.realms[realm]=[];
			}
			realm = Toolbox.GetName(realm,this.realms);
			for(let i=0;i<this.realms[realm].length;i++){
				if(this.realms[realm][i][0].toLowerCase()==callback.toLowerCase()){
					this.realms[realm][i][1]=third;
					return this;
				}
			}
			this.realms[realm].push([callback.toLowerCase(),third]);
		}
		return this;
	}
	set(_var="",_val=""){
		if(this.config.hasOwnProperty(_var)&&typeof this.config[_var]==typeof _val){
			this.config[_var]=_val;
		}
		return this;
	}
	getPage(path,Method,__Data={},evt){
		path = Toolbox.ActualPath(path);
		let __Page = null;
		let __PageExists = false;
		for(let i=0;i<this.pages.length;i++){
			if(((new RegExp("^"+this.pages[i].Path+"$").test(path)||((!this.pages[i].CaseSensitive)&&new RegExp("^"+this.pages[i].Path+"$","i").test(path)))||(path.charAt(0)=="#"&&path==this.pages[i].Path))){
				if(this.pages[i].Accepts.indexOf(Method)>-1||this.pages[i].Accepts.indexOf("*")>-1){
					__Page = this.pages[i];
					break;
				}else{
					__PageExists = true;
				}
			}
		}
		if(__Page==null){
			for(let i=0;i<this.SuperURLs.length;i++){
				let flags = "";
				if(!this.SuperURLs[i][2].CaseSensitive){
					flags += "i";
				}
				let sureg = new RegExp(this.SuperURLs[i][0],flags);
				if(sureg.test(path)){
					if(this.SuperURLs[i][2].Accepts.indexOf(Method)||this.SuperURLs[i][2].Accepts.indexOf("*")>-1){
						__Page = this.SuperURLs[i][2];
						let matches = sureg.exec(path);
						let args = Object.assign({},this.SuperURLs[i][1]);
						for(let p in args){
							if(args.hasOwnProperty(p)){
								/*for(let m=0;m<matches.length;m++){
									args[p] = String(args[p]).replace(new RegExp("\{\{[\\x"+m.toString().charCodeAt(0).toString(16)+"]\}\}","g"),typeof matches[m]!=="undefined"?matches[m]:"");
								}*/
								args[p] = String(args[p]).replace(/\{\{([0-9]+)\}\}/gi,(f,o)=>{
									if(typeof matches[parseInt(o)]=="string"){
										return matches[parseInt(o)];
									}else{
										return "";
									}
								});
							}
						}
						args = Object.assign(__Data,args);
						return [__Page,args];
					}else{
						__PageExists = true;
					}
				}
			}
		}
		if(__Page==null){
			for(let i=0;i<this.aliases.length;i++){
				if((!this.aliases[i][2]&&new RegExp("^"+this.aliases[i][0]+"$","i").test(path))||(this.aliases[i][2]&&new RegExp("^"+this.aliases[i][0]+"$").test(path))||(path.charAt(0)=="#"&&path==this.aliases[i][0])){
					let matches = path.match(this.aliases[i][0]);
					let FPU = this.aliases[i][1].replace(/\{\{([0-9]){1,}\}\}/g,(F,N)=>{
						if(typeof matches[parseInt(N)]!=="undefined"){
							return matches[parseInt(N)];
						}
						return "";
					});
					let pFPU = url.parse(FPU);
					let isURL = pFPU.protocol!==null&&pFPU.host!==null&&pFPU.host.split(".").filter(v=>v.length>0).length>1;
					if(isURL){
						let frh = [this.aliases[i][3]];
						if(this.HTTP_CODES.hasOwnProperty(frh[0].toString())){
							frh.push(this.HTTP_CODES[frh[0].toString()]);
						}
						frh.push({
							"Location":FPU
						});
						return frh;
					}
					let AFPU = url.parse(FPU,true);
					return this.getPage(AFPU.pathname,Method,Object.assign(__Data,AFPU.query));
				}
			}
		}
		if(__Page==null){
			// #404 || #405
			if(__PageExists){
				return this.getPage("#405",Method,__Data,"#405");
			}else{
				return this.getPage("#404",Method,__Data,"#404");
			}
		}
		__Page = OF.format(__Page,PageDefs);
		let ToReturn = [__Page,__Data];
		if(typeof evt=="string"){
			ToReturn.push(evt);
		}
		return ToReturn;
	}
	runEvent(evt,args=[]){
		if(typeof evt!=="string"&&evt!=="pages"&&evt!=="HTTP_CODES"){return false;}
		let _PageEvent = evt.charAt(0)=="/";
		let _ErrorEvent = evt.charAt(0)=="#"&&!isNaN(evt.substr(1))&&evt.length>1;
		let _Event = this.events.hasOwnProperty(evt);
		if(!_PageEvent&&!_ErrorEvent&&!_Event){return false;}
		if(_PageEvent){
			for(let i=0;i<this.events.pages.length;i++){
				let PRE = new RegExp("^"+this.events.pages[i].Path+"$","i");
				if(this.events.pages[i].CaseSensitive){
					PRE = new RegExp("^"+this.events.pages[i].Path+"$");
				}
				if(PRE.test(evt)){
					this.events.pages[i].callback.apply(this,args);
				}
			}
		}else if(_ErrorEvent){
			let EC = parseInt(evt.substr(1));
			for(let i=0;i<this.events.HTTP_CODES.length;i++){
				if(this.events.HTTP_CODES[i].code==EC){
					this.events.HTTP_CODES[i].callback.apply(this,args);
				}
			}
			this.runEvent("error",args);
		}else if(_Event){
			for(let i=0;i<this.events[evt].length;i++){
				this.events[evt][i].apply(this,args);
			}
		}
	}
	request(_URL="",_Data={},_Method="GET",_RequestHeaders={},isUser=true,_Request={}){
		let _Response = {};
		let URLAnalysis = url.parse(_URL,true);
		let _Path = Toolbox.ActualPath(URLAnalysis.pathname);
		var HTTP_Controller;
		if(isUser){
			this.runEvent(_Path,[_URL,_Data,_Method,_Request]);
		}
		let _Page = {};
		if(_URL.charAt(0)=="#"&&parseInt(_URL.slice(1))!==NaN){
			_Page = this.getPage(_URL,_Method,_Data);
		}else{
			_Page = this.getPage(_Path,_Method,URLAnalysis.query);
		}
		if(typeof _Page[2]=="string"&&isUser){
			this.runEvent(_Page[2],[parseInt(_Page[2].slice(1)),_Request]);
		}
		if(_Page[0]==null){
			return Object.assign({Status:500},this.request("#500",_Data,_Method,_RequestHeaders,false,_Request));
		}else{
			if(_Page[0].hasOwnProperty("Realm")&&_Page[0].Realm.length>0&&Toolbox.Has(_Page[0].Realm,this.realms)){
				let unauthorized = true;
				let s_realm = Toolbox.GetName(_Page[0].Realm,this.realms);
				let AuthorizationCredentials = Toolbox.GetValue("Authorization",_RequestHeaders);
				if(AuthorizationCredentials!==null){
					if(Array.isArray(AuthorizationCredentials)){
						AuthorizationCredentials = AuthorizationCredentials[0];
					}
					AuthorizationCredentials = AuthorizationCredentials.trim().split(/[\s]{1,}/);
					if(AuthorizationCredentials.length>1&&AuthorizationCredentials[0].trim().toUpperCase()=="BASIC"){
						let creds = new Buffer(AuthorizationCredentials[1],"base64").toString("ascii").split(":");
						if(creds.length==2){
							let un = creds[0];
							let pw = creds[1];
							for(let i=0;i<this.realms[s_realm].length;i++){
								if(this.realms[s_realm][i][0].toLowerCase()===un.toLowerCase()&&this.realms[s_realm][i][1]===pw){
									unauthorized = false;
								}
							}
						}
					}
				}
				if(unauthorized){
					let AuReRe = this.request("#401",_Data,_Method,_RequestHeaders,false,_Request);
					this.runEvent("#401",[_URL,_Data,_Method,_Request,401]);
					AuReRe.Headers["WWW-Authenticate"] = "Basic realm=\""+s_realm+"\"";
					return AuReRe;
				}
			}
			if(typeof _Page[0]=="number"&&(typeof _Page[1]=="object"||(typeof _Page[1]=="string"&&typeof _Page[2]=="object"))){
				_Response.Status = _Page[0];
				if(typeof _Page[1]=="object"){
					_Response.Headers = _Page[1];
				}else{
					_Response.Message = _Page[1];
					_Response.Headers = _Page[2];
				}
			}else{
				var GET = _Page[1];
				var __COOKIES__ = {};
				for(let h in _RequestHeaders){
					if(_RequestHeaders.hasOwnProperty(h)&&h.toUpperCase()=="COOKIE"){
						__COOKIES__ = CookieChef.eat(_RequestHeaders[h]);
					}
				}
				let _Protocol = (()=>{
					try{
						let tfp = vm.runInNewContext("_RQST.connection.encrypted",{
							_RQST:_Request
						});
						if(typeof tfp!=="undefined"){
							return "https";
						}
						return "http";
					}catch(e){
						return "http";
					}
				})()+"://";
				let _Host = Toolbox.GetValue("Host",_RequestHeaders);
				if(_Host==null){
					_Host = "127.0.0.1";
				}
				let FULL_URL = _Protocol+Toolbox.ActualPath(_Host+"/"+_URL);
				HTTP_Controller = new Controller(_Path,GET,_Data,_Method,__COOKIES__,_RequestHeaders,FULL_URL,_Request);
				let resp = {};
				let parse_args = [HTTP_Controller];
				if(typeof _Page[0].Response=="function"){
					resp = _Page[0].Response(...parse_args);
				}else if(typeof _Page[0].Response=="object"){
					resp = _Page[0].Response;
				}
				resp = OF.format(resp,RespDefs);
				let StatusCode = resp.Status;
				if(typeof StatusCode=="function"){
					StatusCode = StatusCode(...parse_args);
				}
				if(typeof StatusCode=="string"){
					StatusCode = parseInt(StatusCode);
				}
				if(typeof StatusCode=="number"&&StatusCode!==NaN){
					HTTP_Controller.Status(StatusCode);
				}
				StatusCode=null;
				let Headers = resp.Headers;
				if(typeof Headers=="function"){
					Headers = Headers(...parse_args);
				}
				if(typeof Headers=="object"&&Headers!==null&&Headers.constructor.name=="Object"){
					HTTP_Controller.Header(Headers);
				}
				Headers=null;
				let Content = resp.Content;
				if(typeof Content=="function"){
					Content = Content(...parse_args);
				}
				if(typeof Content!=="undefined"){
					HTTP_Controller.Write(Content);
				}
				Content = null;
				let Encoding = resp.Encoding;
				if(typeof Encoding=="function"){
					Encoding = Encoding(...parse_args);
				}
				if(typeof Encoding=="string"){
					HTTP_Controller.Encoding(Encoding);
				}
				Encoding = null;
				let Message = resp.Message;
				if(typeof Message=="function"){
					Message = Message(...parse_args);
				}
				if(typeof Message=="string"){
					HTTP_Controller.Message(Message);
				}
				Message = null;
				let __Backend = resp.Backend;
				if(typeof __Backend=="function"){
					__Backend = __Backend(HTTP_Controller);
				}
				if(typeof __Backend=="object"&&__Backend!==null&&__Backend.constructor.name=="Object"){
					for(let p in __Backend){
						if(__Backend.hasOwnProperty(p)){
							HTTP_Controller.Backend(p,__Backend[p]);
						}
					}
				}
				__Backend = null;
				_Page[0].Controller(...parse_args);
				resp.Controller(...parse_args);
				for(let i=0;i<this.GlobalControllers.length;i++){
					this.GlobalControllers[i].apply(this,parse_args);
				}
				let serve = HTTP_Controller.Serve();
				let serve_Response = {};
				if(resp.hasOwnProperty("Serve")||_Page[0].hasOwnProperty("Serve")){
					serve = resp.hasOwnProperty("Serve")?resp.Serve:_Page[0].Serve;
					if(typeof serve=="function"){
						serve = serve(...parse_args);
					}
				}
				let serve_found = false;
				if(typeof serve=="number"&&this.HTTP_CODES.hasOwnProperty(serve.toString())){
					serve_Response = this.request("#"+serve,_Data,_Method,_RequestHeaders,false,_Request);
					serve_found = true;
				}
				let ServeContent = "";
				serve = String(serve);
				if(serve.length>0&&fs.existsSync(serve)&&fs.fstatSync(fs.openSync(serve,"r")).isFile()&&!serve_found){
					if(Object.keys(HTTP_Controller.Backend()).length>0||this.runBackend.indexOf(this.GET_EXTENSION(serve).toLowerCase())>-1){
						let BI = {
							__dirname:__PATH__.parse(serve).dir,
							Controller:HTTP_Controller
						};
						let t = new backend(fs.readFileSync(serve).toString(),BI,(this.config.templating||_Page[0].Template));
						ServeContent = t.render(HTTP_Controller.Backend());
					}else{
						HTTP_Controller.Encoding("base64");
						ServeContent = new Buffer(fs.readFileSync(serve)).toString("base64");
					}
					HTTP_Controller.Header({
						"Content-Type":this.GET_TYPE(serve)
					},true);
				}
				HTTP_Controller.Write(ServeContent);
				HTTP_Controller.Header({
					"Content-Type":"text/html"
				},true);
				let _Setted_Cookies = HTTP_Controller.CookiesToSet;
				let _Final_Cookies = [...(()=>{
					let ExistingHeader = HTTP_Controller.Header("Set-Cookie");
					if(ExistingHeader!==null){
						if(typeof ExistingHeader=="string"){
							return[ExistingHeader];
						}else if(Array.isArray(ExistingHeader)){
							return ExistingHeader;
						}
					}
					return[];
				})()];
				for(let i=0;i<_Setted_Cookies.length;i++){
					let CookedCookie = CookieChef.cook(_Setted_Cookies[i]);
					if(CookedCookie!==null&&typeof CookedCookie=="string"&&CookedCookie.length>0){
						_Final_Cookies.push(CookedCookie);
					}
				}
				if(_Final_Cookies.length>0){
					HTTP_Controller.Header({
						"Set-Cookie":_Final_Cookies
					});
				}
				if(isUser){
					for(let i=0;i<HTTP_Controller.Trigger().length;i++){
						let la = [];
						if(HTTP_Controller.Trigger()[i].charAt(0)=="#"){
							la.push(parseInt(HTTP_Controller.Trigger()[i].slice(1)));
						}
						this.runEvent(HTTP_Controller.Trigger()[i],[_URL,_Data,_Method,_Request]);
					}
				}
				_Response.Status = HTTP_Controller.Status();
				_Response.Headers = HTTP_Controller.Headers;
				_Response.Response = HTTP_Controller.Content;
				_Response.Message = HTTP_Controller.Message()==null?(typeof this.HTTP_CODES[HTTP_Controller.Status().toString()]=="string"?this.HTTP_CODES[HTTP_Controller.Status().toString()]:"OK"):HTTP_Controller.Message();
				_Response.Encoding = HTTP_Controller.Encoding();
				_Response = OF.SuperMerge(serve_Response,_Response,{
					Merge:["Response"],
					Prioritize:["Status","Message"]
				});
			}
		}
		return OF.format(_Response,RequestResponseDefs);
	}
	public(p,a="",index){
		if(fs.existsSync(p)){
			let _Stat = fs.statSync(p);
			if(_Stat.isDirectory()){
				let dp = Toolbox.ActualPath(p);
				let ep = typeof a=="string"&&a.length>0?a:__PATH__.parse(p).name;
				if(ep.charAt(0)!=="/"){
					ep = "/"+ep;
				}
				ep = Toolbox.ActualPath(ep);
				if(ep.length>0){
					this.on(ep+"(.*)?",{f:"{{1}}"},{
						Controller:(c)=>{
							if(c.GET.hasOwnProperty("f")&&c.GET.f.length>0){
								let fr = Toolbox.ActualPath(dp+"/"+c.GET.f.toString());
								if(Toolbox.ActualPath(c.GET.f.toString())=="/"||Toolbox.ActualPath(c.GET.f.toString()).length<=0){
									c.Serve(403);
									c.Trigger("#403");
								}else if(fs.existsSync(fr)){
									let rrs = fs.statSync(fr);
									if(rrs.isFile()){
										c.Serve(fr);
									}else{
										c.Serve(403);
										c.Trigger("#403");
									}
								}else{
									c.Serve(404);
									c.Trigger("#404");
								}
							}else{
								let ExistingIndex = Indexes.map((v)=>fs.existsSync(__PATH__.join(p,v)));
								if(ExistingIndex.indexOf(true)>-1){
									ExistingIndex = Indexes[ExistingIndex.indexOf(true)];
								}else{
									ExistingIndex = "";
								}
								if(typeof index=="string"&&fs.existsSync(index)){
									c.Serve(index);
								}else if(ExistingIndex.length>0){
									c.Serve(__PATH__.join(p,ExistingIndex));
								}else{
									c.Serve(403);
									c.Trigger("#403");
								}
							}
						}
					});
				}
			}else if(_Stat.isFile()){
				let fn = typeof a=="string"&&a.length>0?a:__PATH__.parse(p).base;
				if(fn.charAt(0)!=="/"){
					fn = "/"+fn;
				}
				this.on(fn,{
					Serve:p
				});
			}
		}
		return this;
	}
	server(){
		let request_callback = (request,response)=>{
			if(this._isHTTPS&&this.config.auto_https&&(typeof request.connection.encrypted=="undefined"||(typeof request.connection.encrypted=="boolean"&&request.connection.encrypted==false))){
				response.writeHead(301,HTTP_CODES["301"],{
					"Location":"https://"+Toolbox.ActualPath(Toolbox.GetValue("Host",request.headers)+"/"+request.url)
				});
				response.end();
			}
			if(this.config.enable_OPTIONS&&request.method=="OPTIONS"){
				let _All_Methods = ["GET","HEAD","POST","PUT","DELETE","CONNECT","OPTIONS","TRACE","PATCH"];
				let _Supported_Methods = [];
				for(let i=0;i<this.pages.length;i++){
					if(this.pages[i].Path.charAt(0)!=="#"){
						if(this.pages[i].Accepts.indexOf("*")>-1){
							_Supported_Methods = _Supported_Methods.concat(_All_Methods);
						}
						_Supported_Methods = _Supported_Methods.concat(this.pages[i].Accepts);
					}
				}
				_Supported_Methods = _Supported_Methods.filter((v,i,a)=>{
					return a.indexOf(v)===i&&typeof v=="string"&&v!=="*";
				}).join(", ");
				response.writeHead(200,HTTP_CODES["200"],{
					"Allow":_Supported_Methods
				});
				response.end();
			}
			this.runEvent("request",[request]);
			let data = "";
			request.on("data",chunk=>{
				data+=chunk;
			}).on("end",()=>{
				data = querystring.parse(data);
				let $Response = this.request(request.url,data,request.method,request.headers,true,request);
				response.writeHead($Response.Status,$Response.Message,$Response.Headers);
				if($Response.Response.length>0&&((!(this.config.enable_HEAD))||(this.config.enable_HEAD&&request.method.toUpperCase()!=="HEAD"))){
					response.end($Response.Response,$Response.Encoding);
				}else{
					response.end();
				}
				this.runEvent("response",[response,request.url,data,request.method,request]);
			});
		};
		let server = [http.createServer(request_callback)];
		if(this._isHTTPS){
			server.push(https.createServer(...this._options,request_callback));
		}
		for(let s=0;s<server.length;s++){
			server[s].on("error",e=>this.runEvent("server_error",[e]));
		}
		return server;
	}
	start(){
		this.runningServer = this.server();
		this.runningServer[0].listen(this.config.port);
		let ports = [this.config.port];
		if(typeof this.runningServer[1]!=="undefined"){
			this.runningServer[1].listen(this.config.https_port);
			ports.push(this.config.https_port);
		}
		this.runEvent("start",[this.runningServer,ports]);
		return this.runningServer;
	}
	stop(){
		if(typeof this.runningServer[0]!=="undefined"){
			this.runningServer[0].close();
		}
		if(typeof this.runningServer[1]!=="undefined"){
			this.runningServer[1].close();
		}
		this.runningServer = [];
		return this;
	}
}
