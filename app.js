var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , io = require('socket.io')
  , fs = require('fs')
  , crypto = require('crypto');
  
  
//Configure server
var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 80);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);  
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});



//Define routes

app.get('/', function(req, res){
  res.render('index',  { server: 'localhost', port: '80' });
  console.log(req.query);
});


app.post('/JunctionServerExecution/pushmsg.php', function(req, res){
  
  console.log(req.query);
  console.log(req.params);

  res.send(req.query.MSG);

  var fname = 'tmp'+crypto.randomBytes(4).readUInt32LE(0)+'';
  var content = "" + req.query.MSG;

  fs.writeFile('JunctionServerExecution/current/MSG/' + fname, content, function (err) {
    if (err) throw err;
    console.log('It\'s saved!');
    
    console.log('Change Status')
  });
  
});


app.get('/JunctionServerExecution/current/MSG/smsg.txt', function(req, res){

  fs.readFile('JunctionServerExecution/current/MSG/smsg.txt', function (err, data) {
  if (err) throw err;
  res.type('application/json');
  res.send(data);
});

});



//Start Server

var sv = http.createServer(app);
var io = require('socket.io').listen(sv);
sv.listen(app.get('port'), function(){
  console.log('SERVER STARTED')
});


//Listener for server msgs file

fs.watchFile('JunctionServerExecution/current/MSG/smsg.txt', function (curr, prev) {
  var msg = 'the current mtime is: ' + curr.mtime + "<br>" + 'the previous mtime was: ' + prev.mtime;

  fs.readFile('JunctionServerExecution/current/MSG/smsg.txt', function (err, data) {
    if (err) throw err;
    io.sockets.emit('changestatus', "" + data);
  });
  
});