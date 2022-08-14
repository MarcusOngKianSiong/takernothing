const express = require("express");
const authentication = express.Router();


authentication.get("/login",(req,res)=>{
    const username = req.username;
    const password = req.password;
    console.log(username,password)
    res.render('display.ejs')
});

module.exports = authentication