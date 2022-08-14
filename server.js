const express = require("express");
const app = express();
const authentication = require('./models/authentication.js');


app.get('/',authentication);


const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>{
    console.log('listening to port.....');
})
