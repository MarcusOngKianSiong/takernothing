const express = require("express");
const app = express();
const authentication = require('./models/authentication.js');

app.use('/login',authentication);

app.get('/',(req,res)=>{
    res.render('login.ejs');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>{
    console.log('listening to port.....');
})
