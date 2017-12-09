var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var session = require('express-session');
var index = require('./routes/index');
var users = require('./routes/users');
var err = '';
var msg = '';
var loginMode = '';

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');
//app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.engine('handlebars', exphbs({})); // defaultLayout: 'main'
app.set('view engine', 'handlebars');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  resave: false, // don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
  secret: 'sunsmart'
}));

app.use(function(req, res, next) {
  if (req.session != null) {
    err = req.session.error;
    msg = req.session.success;
    loginMode = req.session.loginMode;
    delete req.session.error;
    delete req.session.success;
    delete req.session.loginMode;
  }
  res.locals.message = '';
  res.locals.loginMode = '';
  if (err != '' && err) res.locals.message = '<p class="msg error" style="color: red">' + err + '</p>';
  if (msg != '' && msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
  if (loginMode != '' && loginMode) res.locals.loginMode = loginMode;
  next();
});

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  console.log("Error Handler: " + err.message);
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(80);

module.exports = app;