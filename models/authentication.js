const express = require("express");
const authentication = express.Router();
const accountData = require("../public/database/database.js").accountData
const notesData = require("../public/database/database.js").notesData

authentication.post('/login',(req,res)=>{
    const username = req.body.username;
    const password = req.body.password;
    accountData.find({username: username, password: password},(error,data)=>{
        if(data.length !== 0){
            res.render('display.ejs');
        }else{
            res.render('login.ejs');
        }
    })
});

module.exports = authentication;
