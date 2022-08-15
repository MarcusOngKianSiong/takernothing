const accountData = require("./public/database/database.js").accountData
const notesData = require("./public/database/database.js").notesData
const express = require("express");
const app = express();
const authentication = require("./models/authentication.js");
const updateContent = require("./models/updateContent.js")

const http = require('http');
const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server);

app.use(express.urlencoded({ extended: false }));
app.use('/',authentication);

app.get('/',(req,res)=>{
    res.render('login.ejs');
});

app.get('/logout',(req,res)=>{
    res.render('login.ejs')
})

// app.post('/save',(req,res)=>{
//     console.log('passing through!@!!')
//     notesData.findOneAndUpdate({username: "marcus"},{identificationNumber: "thefuck"},(error,data)=>{
//         if(error){
//             console.log(error);
//         }else{
//             console.log(data);
//             res.render("display.ejs")
//         }
//     })
// })

io.on("connection",(socket)=>{
    console.log("connection established.....")
    socket.on("editing",async (items)=>{
        console.log("--------------------")
        console.log("username: ",items.username);
        console.log("identificationNumber: ",items.identificationNumber);
        console.log("content: ",items.contents);
        await notesData.findOneAndUpdate({username: items.username},{contents: items.contents});
        //await was the problem here. right now this works because i'm going to assume you seed the data then hardcode username. However, your schema do not match at all. That will cause a lot of problems later.
        // notesData.updateOne({username: "marcus"},{content: "hello?"});
    })
})

const PORT = process.env.PORT || 3000;
server.listen(PORT,()=>{
    console.log('listening to port.....');
})
