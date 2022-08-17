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
        }, 100);
        
        // When you change all the number, the current note number has to change as well. 
    })

    socket.on("editingContents",async (data)=>{
        console.log(data)
        await notesData.findOneAndUpdate({username: data.username,identificationNumber: data.identificationNumber}, {contents: data.contents});
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
            const deletedIdentificationNumber = metaData.identificationNumber;
            const user = metaData.username;
            notesData.find({username: user},(err,data)=>{ 
                // Any identification number above deletedIdentificationNumber should be reduced by 1
                data.forEach((note)=>{
                    if(note.identificationNumber > deletedIdentificationNumber){
                        notesData.updateOne({username: note.username, identificationNumber: note.identificationNumber},{identificationNumber: note.identificationNumber-1})
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
