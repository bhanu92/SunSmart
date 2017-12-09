var express = require('express');
var router = express.Router();
var path = require('path');
var User = require("../Models/usersModel");
var pass = require('../pass');
var nodemailer = require("nodemailer");
var Base64 = require('js-base64').Base64;
var jwt = require("jwt-simple");

var tokenSecret = 'SunSmart';


var smtpTransport = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  auth: {
    user: "bhanuprakash.2811",
    pass: "Password@92"
  }
});


/* Login */
router.post('/signin', function(req, res, next) {

  if (req.body.email == '' || req.body.password == '' || req.body.username == '') {
    req.session.error = 'Please fill the required fields (name, email and password).';
    req.session.loginMode = 'signup';
    res.redirect('/');
  } else {
    User.findOne({
      email: req.body.email
    }, function(err, user) {
      if (err) throw err;
      if (!user) {
        var pwd = pass(req.body.password);

        var newuser = new User({
          username: req.body.name,
          password: pwd.hash,
          salt: pwd.salt,
          email: req.body.email,
          authentication: false
        });

        newuser.save(function(err) {
          if (err) {
            console.log(err.message);
            req.session.error = err.message;
            req.session.loginMode = 'signup';
            res.redirect('/');
            return;
          }
          req.session.error = "Please verify your registered Email";
          req.session.loginMode = 'successSignup';
          res.redirect('/');
          //res.render(path.join(__dirname, '../views/mainpage'),{userAddedMsg : "User added"});
          //res.status(200).send("{userAddedMsg : User added}");
        });
        var encodedEmail = encodeURIComponent(Base64.encode(req.body.email));
        var mailOptions = {
          to: "bhanupm2811@gmail.com",
          subject: "Email Testing",
          text: 'http://ec2-13-59-250-78.us-east-2.compute.amazonaws.com/users/userAuthentication?encodedString=' + encodedEmail
        }
        console.log(mailOptions);
        smtpTransport.sendMail(mailOptions, function(error, response) {
          if (error) {
            console.log(error);
            res.end("error");
          } else {
            console.log("Message sent: " + response.message);
            res.end("sent");
          }
        });
      } else {
        req.session.error = 'User Already Exists. Please login to continue.';
        req.session.loginMode = 'signup';
        res.redirect('/');
      }
    })
  }
});

// User Authentication
router.get('/userAuthentication', function(req, res) {
  if (req.query.encodedString == "" || req.query.encodedString == null)
    res.status(200).send("Invalid Email or encoded string");
  else {
    var _email = Base64.decode(req.query.encodedString);
    var updateQuery = {
      email: _email
    };
    var newValues = {
      authentication: true
    };
    User.updateOne(updateQuery, newValues, function(err, result) {
      if (err) {
        console.log(err.message);
        return res.status(201).send(err.message);
      }
      res.render(path.join(__dirname, '../views/index'), {
        email: req.body.email
      });
    });
  }
});

// Sends a token when given valid username/password
router.post('/login', function(req, res) {
  // Get user from the database
  if (req.body.email == '' || req.body.password == '') {
    req.session.error = 'Please fill the required fields (Email and password).';
    req.session.loginMode = 'login';
    res.redirect('/');
  } else {
    User.findOne({
      email: req.body.email
    }, function(err, user) {
      if (err) throw err;
      if (!user) {
        // Username not in the database
        req.session.loginMode = 'login';
        req.session.error = 'User name does not exist.';
        res.redirect('/');
      } else if (user.authentication == false) {
        req.session.loginMode = 'login';
        req.session.error = 'User Authentication pending!!!';
        res.redirect('/');
      } else {
        // Does given password hash match the database password hash?
        if (pass(req.body.password, user.password)) {
          res.render(path.join(__dirname, '../views/index'), {
            email: req.body.email
          });
          var token = jwt.encode({
            email: user.email
          }, tokenSecret);
          res.status(200).json({
            token: token
          });
        } else {
          // Username not in the database
          req.session.loginMode = 'login';
          req.session.error = 'Incorrect username or password.';
          res.redirect('/');
        }
      }
    });
  }
});

module.exports = router;