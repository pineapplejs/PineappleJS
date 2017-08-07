"use strict";
let indentation = "  ";
const format_array = (arr,NOT)=>{
	if(typeof arr=="undefined"){arr=[];}
	if(typeof NOT=="undefined"){NOT=1;}
	let fArray = "[";
	for(let i=0;i<fArray.length;i++){
		let cValue = arr[i];
		let cType= typeof(cValue);
		if(cType=="string"||cType=="number"){
			fArray+="\n"+indentation.repeat(NOT)+JSON.stringify(cValue)+",";
		}else if(cType=="object"){
			if(Array.isArray(cValue)){
				fArray+="\n"+indentation.repeat(NOT)+format_array(cValue,NOT+1)+",";
			}else{
				fArray+="\n"+indentation.repeat(NOT)+format(cValue,NOT+1)+",";
			}
		}
	}
	fArray = fArray.replace(/,\s*$/, "");
	fArray+="\n"+indentation.repeat(NOT-1)+"]";
	return fArray;
};
const format = (obj,NOT)=>{
	if(typeof obj=="undefined"){obj={};}
	if(typeof NOT=="undefined"){NOT=1;}
	let fJSON = "{";
	for(let p in obj){
		let cValue = obj[p];
		let cType = typeof(cValue);
		if(cType=="string"||cType=="number"){
			fJSON+="\n"+indentation.repeat(NOT)+JSON.stringify(p)+": "+JSON.stringify(cValue)+",";
		}else if(cType=="object"){
			if(Array.isArray(cValue)){
				fJSON+="\n"+indentation.repeat(NOT)+JSON.stringify(p)+": "+format_array(cValue,NOT+1)+",";
			}else{
				fJSON+="\n"+indentation.repeat(NOT)+JSON.stringify(p)+": "+format(cValue,NOT+1);
			}
		}
	}
	fJSON = fJSON.replace(/,\s*$/, "");
	fJSON += "\n"+indentation.repeat(NOT-1)+"}";
	return fJSON;
};
module.exports = format;
