var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require("passport");
var flash = require('connect-flash');
var moment = require('moment');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'www', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'www')));

app.use(session({
  secret: 'secret snowman',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

var index = require('./routes/index');
var users = require('./routes/users');
var quiz = require('./routes/quiz');
app.use('/v', index);
app.use('/v/users', users);
app.use('/v/quiz', quiz);

app.use('/', function(req, res) {
  res.render('layout/index', {
    user: req.user,
    pretty: true
  });
});

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
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});





var debug = require('debug')('testexpress:server');
var http = require('http');

var port = normalizePort(process.env.PORT || 80);
app.set('port', port);

var server = http.createServer(app);

var io = require('socket.io')(server);
io.on('connection', function (socket) {
  console.log("connection.");
  
  socket.broadcast.emit('user connected');
  
  socket.on('login', function(msg){
    console.log("socket:login:"+msg);
    io.emit('message', msg+"さんがログインしました。");
  });
  
  socket.on('message', function(msg){
    console.log("socket:message:"+msg);
    io.emit('message', msg);
  });
  
  socket.on('chat home message', function(msg){
    msg.time = moment().format("MM月DD日 HH時mm分ss秒").toString();
    io.emit('chat home message', msg);
  });
});

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/** Normalize a port into a number, string, or false. */
function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/** Event listener for HTTP server "error" event. */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**  Event listener for HTTP server "listening" event. */
function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
