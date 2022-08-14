// Fundamental configuration
const mongoose = require("mongoose");
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/' + `account`;
mongoose.connect(MONGODB_URI);
const db = mongoose.connection;


// Schemas
const accountDataSchema = {username: String,password: String};
const notesDataSchema = {user: String, name: String, identificationNumber: String, contents: String}

const notes = mongoose.model('notes',notesDataSchema);
const account = mongoose.model('accounts',accountDataSchema); 

