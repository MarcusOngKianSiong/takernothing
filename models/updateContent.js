const accountData = require("../public/database/database.js").accountData
const notesData = require("../public/database/database.js").notesData

function update(name,contenting,identify){
    console.log("testing update function: ");
    console.log("username: ",name);
    console.log("content: ",contenting);
    console.log("identificationNumber: ",identify);
    // notesData.find({username: "marcus",identificationNumber: "1"},(err,data)=>{
    //     console.log(data);
    // })
}

module.exports = update;
