function RecQuest(socket, container){

		var user = {
				ip: ''
			,	isLoged: false
			,	status_uri: '/JunctionServerExecution/current/MSG/'
			,	name: ''
			,	msg_uri: '/JunctionServerExecution/pushmsg.php'
			, getMsg: function(type){

				return {
					TYPE: (type) ? type : 'HAIL'
				, 	NAME: this.name
				, 	IP: this.ip 
			}
			}
		};


		var server = {
				ip: ''
			,	socket: socket
			,	uri: '/JunctionServerExecution/current/MSG/smsg.txt'
			,	questions_uri: '/JunctionServerExecution/current/'
			,	msg_uri: '/JunctionServerExecution/pushmsg.php'
			,	status: ''
			,	previous_status: ''
		};


		var options = {
				template_path: ''
			,	container: container
		};


		this.login = function(username){
			
			user.name = username;
			user.isLoged = true;
			socket.emit('login', {MSG:user.getMsg()}, registerSocketsEvents);
			
		};

		this.getUser = function(){return user;};


		/**
		* ================
		* EVENTOS DO JOGO
		* ===============
		**/ 
      
	 function registerSocketsEvents(){	

	        //IDEIA - SOH REGISTRAR LISTENERS DEPOIS DE FAZER O LOGIN
	        socket.on('WAIT_CONNECT', function(data){
	            $(options.container).html('WAIT_CONNECT');
	            $('#main-menu').load('/wait');
	          });

	        socket.on('START_MAKE', function(data){
	            $(options.container).html('START_MAKE');
	            $('#main-menu').load('/make');
	          });

	        socket.on('START_SOLVE', function(data){
	            $(options.container).html('START_SOLVE');
	            $('#main-menu').load('/solve');
	          });

	        socket.on('START_SHOW', function(data){
	            $(options.container).html('START_SHOW');
	            $('#main-menu').load('/results');
	          });

	       //Get the current state
	       socket.emit('get_server_state');
    }

    	//Register events
        socket.on('server_changed', function(status){
            $(options.container).html(status);
            console.log(status);
          });

        socket.on('restore_state', function(data){
        	for(i in data){ user[i] = data[i];}
        	console.log("Estado restaurado");
        	  //Get the current state
        	registerSocketsEvents(data.teacherMsg);
      		socket.emit('get_server_state');

        })

        socket.on('displayError', function(data){

        	 var err = document.createElement('div');

        	 $(err).addClass('alert alert-error')
        	 .html("<strong>ERROR! " + data);
        	 $('#main-menu').append(err);

              setTimeout(function(){
                $(err).remove();
              },4000);

        });

        //Funcao auxiliar para debug
        socket.on('log', function(log){console.log("DEBUG"); console.log(log)});


		
		this.waitConnectState = function(data){

		};

		this.loginState = function(data){};

		this.startMakeState = function(data){};

		this.startSolveState = function(data){};

		this.startShowState = function(data){};
		



}