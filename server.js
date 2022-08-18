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
const { captureRejectionSymbol } = require("events");
const io = new Server(server);

app.use(express.urlencoded({ extended: false }));
app.use('/',authentication);

app.get('/',(req,res)=>{
    res.render('login.ejs');
});

app.get('/logout',(req,res)=>{
    res.render('login.ejs')
})

function createOneUpdateScript(originalData){
    return {
        updateOne: {
            "filter": {
                username: originalData.username,
                identificationNumber: originalData.identificationNumber
            },
            "update": {
                username: originalData.username,
                identificationNumber: originalData.identificationNumber-1,
                contents: originalData.contents
            }
        }
    }
}
function createMultipleUpdateScript(noteList,deletedIdentificationNumber){
    let updateList = []
    noteList.forEach((note)=>{
        if(note.identificationNumber > deletedIdentificationNumber){
            updateList.push(createOneUpdateScript(note));
        }
    })
    return updateList;
}

// display sidebar
io.on("connection",(socket)=>{
    console.log("connection established.....");
    
    socket.on("getNoteList",(data)=>{
        const list = [];
        notesData.find(data,(err,notes)=>{
            notes.forEach((note)=>{
                list.push(note.identificationNumber);
            })
            socket.emit("recievingNoteList",list);    
        })
    })

    socket.on("newNote",(data)=>{
        console.log("CREATING NEW NOTE!!!!")
        notesData.find({},(err,noteList)=>{
            data["identificationNumber"] = noteList.length+1;
            notesData.create(data);
        })
    })

    socket.on("askingForContents",(data)=>{
        notesData.find(data,(err,noteList)=>{
            socket.emit("sendingContents",noteList[0]);
        })
    })

    socket.on("deletingNote",(data)=>{
        const identificationNumberToBeDeleted = parseInt(data.identificationNumber);
        notesData.deleteOne(data,(err)=>{
            socket.emit("changeIdentificationNumber",identificationNumberToBeDeleted);
            // Redefine the identification numbers
        })
    })

    socket.on("changeIdentificationNumber",(deletedIdentificationNumber)=>{
        notesData.find({},(err,data)=>{
            const updateScripts = createMultipleUpdateScript(data,deletedIdentificationNumber);
            notesData.bulkWrite(updateScripts);
        })
        // send the data to the from end to refine the list again
        setTimeout(() => {
            notesData.find({},(err,noteList)=>{
                console.log(noteList)
                const identificationNumbers = [];
                noteList.forEach((note)=>{
                    identificationNumbers.push(note.identificationNumber);
                })
                socket.emit("afterDeletingNote",identificationNumbers);
            });
        }, 500);
        
        // When you change all the number, the current note number has to change as well. 
    })

    socket.on("editingContents",async (data)=>{
        console.log(data)
        await notesData.findOneAndUpdate({username: data.username,identificationNumber: data.identificationNumber}, {contents: data.contents});
    })
 

})

const PORT = process.env.PORT || 3000;
server.listen(PORT,()=>{
    console.log('listening to port.....');
})
