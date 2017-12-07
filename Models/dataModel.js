// models/user.js
var db = require("../db");

var deviceSchema = new db.Schema({
    apikey:       { type: String },
    deviceId:     { type: String, required: true },
    latitude:    { type: String, required: true },
    longitude:  { type: String, required: true },
	uv:  		{ type: String, required: true },
	time: 		{type: Date, required: true }
});

var DataModel = db.model("deviceData", deviceSchema);

module.exports = DataModel;