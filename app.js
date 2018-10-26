var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var admin = require('./routes/admin');
var authentication = require('./routes/authentication');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session(
   {
      secret:'A SECRET KEY. SHOULD BE UNIQE TO THE APP. DONT EVER SHOW IT TO ANYONE',
      resave : true,
      saveUninitialized : true,
      rolling : true,
      cookie : {maxAge : 600000}
   }
));

app.use(express.static(path.join(__dirname, 'public')));

app.listen(process.env.PORT || 8080, () => console.log('All is okay!'));

app.get('/', function(req, res, next) {
   res.sendFile( 'index.html', { root : __dirname + "/public" } );
});

// Handle any authentication endpoints first
app.use('/wordgame/api/v3', authentication);
app.use('/wordgame/api/v3/admins', admin);
app.use('/wordgame/api/v3', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
   app.use(function(err, req, res, next) {
      res.status(err.status || 500);
      res.send( { msg : err.message } );
   });
}


// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
   res.status(err.status || 500);
   res.send( { msg: err.message } );
  } );


module.exports = app;
