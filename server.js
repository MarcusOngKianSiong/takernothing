const accountData = require("./public/database/database.js").accountData
const notesData = require("./public/database/database.js").notesData
const express = require("express");
const app = express();
const authentication = require("./models/authentication.js");


const http = require('http');
const server = http.createServer(app);
const {Server} = require("socket.io");
const { SocketAddress } = require("net");
const { gunzipSync } = require("zlib");
const io = new Server(server);

app.use(express.urlencoded({ extended: false }));
app.use('/',authentication);

app.get('/',(req,res)=>{
    res.render('login.ejs');
});

app.get('/logout',(req,res)=>{
    res.render('login.ejs')
})

// display sidebar
io.on("connection",(socket)=>{
    console.log("connection established.....");


    socket.on("getNoteList",(data)=>{
        const list = [];
        notesData.find(data,(err,notes)=>{
            notes.forEach((note)=>{
                list.push(note.identificationNumber);
            })
            socket.emit("recievingNoteList",list)
        })
    })

    socket.on("newNote",(data)=>{
        notesData.create(data);
    })

    socket.on("editing",async (items)=>{
        console.log("--------------------")
        console.log("username: ",items.username);
        console.log("identificationNumber: ",items.identificationNumber);
        console.log("content: ",items.contents);
        await notesData.findOneAndUpdate({username: items.username, identificationNumber: items.identificationNumber},{contents: items.contents});
        //await was the problem here. right now this works because i'm going to assume you seed the data then hardcode username. However, your schema do not match at all. That will cause a lot of problems later.
        // notesData.updateOne({username: "marcus"},{content: "hello?"});
    })

    socket.on("addNewNote",async (username)=>{
        console.log("ENTERED!!!")
        let newNumberOfNotes = 0;
        notesData.find({username: username},(err,data)=>{
            console.log("ERROR!!! --> ",username)
            console.log({username: username, identificationNumber: newNumberOfNotes, contents: "Write something!!!"})
            const user = username;
            newNumberOfNotes = data.length+1;
            notesData.create({identificationNumber: newNumberOfNotes, username: user, contents: "Write something!!!"});
            socket.emit("Refresh note list",newNumberOfNotes);
        })
    })

    socket.on("changeContent",(notesMetaData)=>{
        notesData.find({username: notesMetaData.username,identificationNumber: notesMetaData.identificationNumber},(err,data)=>{
            const contents = data[0].contents;
            socket.emit("changeContent",contents);
        })
        // notesData.find({username: usernameAndIdentificationNumber.username, identificationNumber: usernameAndIdentificationNumber.identificationNumber},(data)=>{
        //     console.log(data)
        //     // socket.emit("changeContent",data.contents);
        // });
    })
    
    socket.on("deleteNote",(metaData)=>{
        console.log("deleting data: ",metaData);
        notesData.deleteOne(metaData, async (err)=>{
            const deletedIdentificationNumber = metaData.identificationNumber
            const user = metaData.username;
            notesData.find({username: user},(err,data)=>{
                // Any identification number above deletedIdentificationNumber should be reduced by 1
                data.forEach((note)=>{
                    if(note.identificationNumber > deletedIdentificationNumber){
                        notesData.findOneAndUpdate({username: note.username, identificationNumber: note.identificationNumber},{identificationNumber: note.identificationNumber-1})
                    }
                }) 
                notesData.find({username: user},(err,data)=>{
                    socket.emit("Refresh note list after delete",data);
                })
            })
        });
    }) 

})

const PORT = process.env.PORT || 3000;
server.listen(PORT,()=>{
    console.log('listening to port.....');
})
