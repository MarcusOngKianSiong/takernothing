// Fundamental configuration
const mongoose = require("mongoose");
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/' + `notetaking`;
mongoose.connect(MONGODB_URI);
const db = mongoose.connection;



// Schemas
const accountDataSchema = {username: String,password: String};
const notesDataSchema = {username: String, identificationNumber: String, contents: String};

const notes = mongoose.model('note',notesDataSchema);
const account = mongoose.model('account',accountDataSchema); 

module.exports.notesData = notes;
module.exports.accountData = account;

