// models/user.js
var db = require("../db");

// Create a model from the schema
var User = db.model("user", {
  username: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  salt: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  authentication: {
    type: Boolean,
    default: false
  }
});

module.exports = User;