(function(){


  var express = require('express')
    , routes = require('./routes')
    , http = require('http')
    , path = require('path')
    , io = require('socket.io')
    , fs = require('fs')
    , crypto = require('crypto');
    

    var server = {
        server_msg: 'JunctionServerExecution/current/MSG/smsg.txt'
      , server_msg_uri: '/JunctionServerExecution/current/MSG/smsg.txt'
      , server_path: 'JunctionServerExecution/current/MSG/'
      , isOnline: false
      , socket: {}
    }


    var users = { };


    
  //Configure server
  var app = express();

  app.configure(function(){
    app.set('port', process.env.PORT || 80);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.favicon());
    //app.use(express.logger('dev'));
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
  app.post('/JunctionServerExecution/pushmsg.php', function(req, res){
    
    

    var fname = 'MSG'+crypto.randomBytes(4).readUInt32LE(0)+'';
    var content = "" + req.body.MSG;

    fs.writeFile(server.server_path + fname, content, function (err) {
      if (err) throw res.send(404);
      console.log('Teacher Sent a File');
      console.log(req.body.MSG);
      res.send(req.body.MSG);
    });
    
  });


  app.get('/JunctionServerExecution/current/MSG/smsg.txt', function(req, res){

    fs.readFile(server.server_msg, function (err, data) {
    if (err) throw err;
    res.type('application/json');
    res.send(data);
  });

  });


  //INDEX
  app.get('/', function(req, res){
    res.render('index',  { server: req.headers.host , port: app.get('port') });
  });

  app.get('/wait', function(req, res){
    res.render('wait',  { server: req.headers.host , port: app.get('port') });
  });

  app.get('/make', function(req, res){
    res.render('make',  { server: req.headers.host , port: app.get('port') });
  });

   app.get('/solve', function(req, res){
    res.render('solve',  { server: req.headers.host , port: app.get('port') });
  });

    app.get('/results', function(req, res){
    res.render('results',  { server: req.headers.host , port: app.get('port') });
  });


    app.post('/sobek', function(req, res){
    //res.render('results',  { server: req.headers.host , port: app.get('port') });

    var exec = require('child_process').exec;
    function puts(error, stdout, stderr) { 
      res.send(stdout);
     }
    exec("java -jar sobek.jar basetext.txt", puts);
  });






  //Start Server

  var sv = http.createServer(app);
  var io = require('socket.io').listen(sv);
  sv.listen(app.get('port'), function(){
    console.log('SERVER STARTED ON PORT ' + app.get('port'))
  });

  sv.on('error', function (e) {
    if (e.code == 'EADDRINUSE') {
      console.log('PORT 80 in use. Trying the port 8080' );
      app.set('port', 8080);
      setTimeout(function () {
        sv.listen(app.get('port'));
      }, 1000);
    }
  });

  io.set('log level', 0);




  //Listener for server msgs file

  fs.watchFile(server.server_msg, function (curr, prev) {

    fs.readFile(server.server_msg, 'utf-8', function (err, data) {
      if (err) {
        io.sockets.emit('server_changed', "SERVER OFFLINE");
        server.isOnline = false; 
      }else{
            io.sockets.emit('server_changed', "SERVER ONLINE");
            var status = JSON.parse(data);
            io.sockets.emit(status.TYPE, status); 
            server.isOnline = true;  
            //io.sockets.emit('changestatus', data);   
        }
      
    });
    
  });


  // Listener for users first connection
  io.sockets.on('connection', function (socket) {

    var teacherMsg;
    var userIp = socket.handshake.address.address;
    var user = users[userIp];

    if(user) console.log(user.name  + server.isOnline);

    //VERIFICA SE O USUARIO JA ESTAVA LOGADO
    if(user){
      //Atualiza socket do usuario
      user.socket = socket;
      socket.user = user;

      //Atualiza estado do usuario
      if(server.isOnline){
        socket.emit("restore_state",
          { 
                  name: user.name
                , ip: user.ip
                , teacherMsg: teacherMsg 
                , loged: true
          });
        }
      else
        socket.emit('displayError', "SERVER OFFLINE");

    }else{
      console.log('NEW USER AT ' + userIp);
    }


    fs.readFile(server.server_msg,'utf-8', function (err, data) {
      if (err){ 
        socket.emit('server_changed', "SERVER OFFLINE");
        server.isOnline = false; 
        }
        else{
            socket.emit('server_changed', "SERVER ONLINE");
            teacherMsg = JSON.parse(data);
            server.isOnline = true; 
            //socket.emit(status.TYPE, status);
        }
       
    });

    socket.on('login', function(data, fnAck){

      if(!server.isOnline){
        socket.emit('displayError', "SERVER OFFLINE");
      return;
      }
      
      //Registra o usuario para o JunctionServer
      var fname = 'MSG'+crypto.randomBytes(4).readUInt32LE(0)+'';
      data.MSG.IP = userIp;
      var content = JSON.stringify(data.MSG);

      fs.writeFile(server.server_path + fname, content, function (err) {
      
        if (err) throw error;

          socket.user = {
          name: data.MSG.NAME
        , socket: socket
        , ip: userIp
        , teacherMsg: teacherMsg

        };

        users[userIp] = socket.user;
        

        socket.emit(teacherMsg.TYPE, {
            name: socket.user.name
          , ip: socket.user.ip
          , teacherMsg: teacherMsg
          , loged: true
        });
        
        console.log(data.MSG.NAME + " LOGED ON IP " + data.MSG.IP );
        
        fnAck(data.MSG);

      });

    });

    socket.on('get_server_state', function(){
      console.log("RESTORING " + teacherMsg.TYPE)
      socket.emit(teacherMsg.TYPE);
    });

    socket.on('question', function(data){});

    socket.on('solve', function(data){});


  });

})()