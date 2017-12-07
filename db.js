// db.js
var mongoose = require("mongoose");
try{	
	mongoose.connect('mongodb://localhost/sunsmartdb', {user: 'appuser', pass: 'AppuseR@123'});
}
catch(ex){
	console.log(ex);
}

module.exports = mongoose;