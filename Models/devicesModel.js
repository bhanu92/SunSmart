// models/user.js
var db = require("../db");

var deviceSchema = new db.Schema({
    apikey:       { type: String, required: true },
    deviceId:     { type: String, required: true },
    userEmail:    { type: String, required: true },
    registeredTime:  { type: Date, default: Date.now },
	lastContact:  { type: Date, default: Date.now }
});

var Device = db.model("device", deviceSchema);

module.exports = Device;