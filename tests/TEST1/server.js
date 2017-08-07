"use strict";
const path = require("path");
const Pineapple = require(path.join(__dirname,"..",".."));
const App = new Pineapple();
App .public(path.join(__dirname,"public"),"/")
    .set("port",process.env.PORT||5000)
    .set("host","0.0.0.0")
    .on("start",(servers,ports)=>{
        console.log("App is running on port "+ports[0]);
    })
    .on("request",()=>{
        process.stdout.write("|");
    })
    .start();