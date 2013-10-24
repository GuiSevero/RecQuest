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
      , server_base_text: 'basetext.txt'
      , question_uri: "/JunctionServerExecution/current/"
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

  app.get("/JunctionServerExecution/current/", function (req, res){

    res.send(" OK ");
  });


  //INDEX
  app.get('/', function(req, res){
    res.render('index',  { server: req.headers.host , port: app.get('port'), ip: req.connection.remoteAddress });
  });

  app.get('/wait', function(req, res){

    fs.readFile(server.server_base_text, 'utf-8', function(err, data){
      if(err) res.send(500);
      else{
        res.render('wait',  { server: req.headers.host , port: app.get('port'), ip: req.connection.remoteAddress, basetext: data });    
      }
    }); 
  });

  app.get('/make', function(req, res){
    res.render('make',  { server: req.headers.host , port: app.get('port'), ip: req.connection.remoteAddress });
  });

  app.get('/solve', function(req, res){

    fs.readFile(server.server_msg,'utf-8', function (err, data) {

      if(err){
        res.send(500);
        return;
      }
      sv = JSON.parse(data);
      
      var server_ip = req.headers.host;
      var user_ip = req.connection.remoteAddress;

      res.render('solve',  {
         question_uri: 'http://' + server_ip + server.question_uri
         , numq: sv.NUMQ
         , username: users[user_ip].name
         , user_ip: user_ip
      });


    });

  });

    app.get('/results', function(req, res){

        fs.readFile(server.server_msg,'utf-8', function (err, data) {
          if(err) { res.send(500); return; }
          var sv = JSON.parse(data);
          res.render('results',  { server: req.headers.host , port: app.get('port'), ip: req.connection.remoteAddress, serverStatus: sv,  question_uri: 'http://' +  req.headers.host + server.question_uri });
        });
        
    });

    app.get('/basetext', function(req, res){
      fs.readFile(server.server_base_text, 'utf-8', function(err, data){
        if(err) { res.send(500, err); return; }
        res.render('basetext',  { server: req.headers.host , port: app.get('port'), ip: req.connection.remoteAddress, text: data, writeSuccess: false });
      });
    
  });

    app.post('/basetext', function(req, res){
      var unorm = require('unorm');
      var text = req.body.base_text;
      var regex = /[\u0300-\u036F]/g;
      text = unorm.nfkd(text).replace(regex, '');

      fs.writeFile(server.server_base_text, text, 'utf-8', function(err){
          if(err) { res.send(500); return; }
          res.render('basetext',{text: text, writeSuccess: true});
      });
      
    
  });



  app.post('/sobek', function(req, res){

        var client = req.connection.remoteAddress + '.txt';
        var exec = require('child_process').exec;
        var unorm = require('unorm');

        var buffer = '';
        var text = req.body.texto;
        
        var regex = /[\u0300-\u036F]/g;
        text = unorm.nfkd(text).replace(regex, '');




        function baseTextCallback(error, stdout, stderr) { 
            
           
          fs.unlink(client, function(err){
            if (err) { res.send(500, "ERROR ON PARSING BASETEXT"); return;}
            buffer += stdout;
            res.charset = 'utf-8';
            res.send(buffer.split('\n').join(' '));
          })   
        }


        fs.writeFile(client, text, function(err){

            if (err){ res.send(500); return;}

            exec("java -jar sobek.jar " + client , function(err, stdout, stderr){
              if(err) { res.send(500, "ERROR ON PARSING CLIENT TEXT"); return; }

              buffer += stdout;              
              exec("java -jar sobek.jar basetext.txt",baseTextCallback); 
            });
        });
     

    //EXECUTAR DUAS VEZES O SOBEK. UMA COM O TEXTO BASE E OUTRA COM A QUESTÃO. 
    //PEGAR N CONCEITOS DE CADA UMA E MANDAR PARA O USUARIO
  });



    app.get("/JunctionServerExecution/current/:q", function(req, res, next){

      fs.readFile("JunctionServerExecution/current/" + req.params.q, 'utf-8', function(err, data){

        if(err){
          res.send(404);
          return;
        }else{
          res.send(data);  
        }
        
      });

    console.log(req.params);    
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
    
    fs.readFile(server.server_msg,'utf-8', function (err, data) {
      if (err){ 
        socket.emit('server_changed', "SERVER OFFLINE");
        socket.emit('displayError', "SERVER OFFLINE");
        server.isOnline = false;
        return; 
        }

      socket.emit('server_changed', "SERVER ONLINE");
      teacherMsg = JSON.parse(data);
      server.isOnline = true; 

      fs.readFile(server.server_path + userIp + '.txt','utf-8', function (err, data) {

          if(err) { console.log('NEW USER AT ' + userIp); return; }

          var usrMsg = JSON.parse(data);
          console.log(usrMsg.NAME + " has been reconected");
              socket.user = {
              name: usrMsg.NAME
            , ip: userIp
            , teacherMsg: teacherMsg

            };

            users[userIp] = socket.user;

          socket.emit("restore_state", {name: usrMsg.NAME, ip: userIp, teacherMsg: teacherMsg, loged: true});
      });
       
    });

socket.on('login', function(data, fnAck){

    fs.readFile(server.server_msg,'utf-8', function (err, teacherData) {

      if (err){ 
        socket.emit('displayError', "SERVER OFFLINE");
        return;
      }

      teacherMsg = JSON.parse(teacherData);

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



        socket.emit(teacherMsg.TYPE, {
            name: socket.user.name
          , ip: socket.user.ip
          , teacherMsg: teacherMsg
          , loged: true
        });
        
        console.log(data.MSG.NAME + " LOGED ON IP " + data.MSG.IP );
        users[userIp] = socket.user;
        
        fnAck(data.MSG);
        socket.emit(teacherMsg.TYPE, teacherMsg);


      });  
       
    });

});

    socket.on('get_server_state', function(){
      fs.readFile(server.server_msg,'utf-8', function (err, teacherData) {

        if(err){
          socket.emit('displayError', "SERVER OFFLINE");
          return;
        }
         var teacherMsg = JSON.parse(teacherData);
        console.log("RESTORING " + teacherMsg.TYPE)
        socket.emit(teacherMsg.TYPE);

      });
    });

    socket.on('question', function(data){});

    socket.on('solve', function(data){});


  });

})()