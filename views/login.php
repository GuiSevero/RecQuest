<div class="well well-small">
			
				<h2>Login</h2>
				<p>Choose your username.</p>				
				<label class="description" for="userName">Username</label>
				<input id="userName" name="userName" class="element text large" type="text" maxlength="255" value="" placeholder="John Nash"/ required><br> 
				<input id="btnConnect" class="btn btn-small btn-primary" type="button" name="btnConnect" value="Connect" />
				<input id="serverIp" readonly name="serverIp" class="element text large" type="hidden" maxlength="255" value="http://<?php echo $_SERVER['SERVER_ADDR']; ?>"/> 					
				<input type="hidden" id="myIp" size="30" value="<?php echo $_SERVER['REMOTE_ADDR']; ?>"/><br>
				
		</div>
<script>
//bind buttons
$('#btnConnect').click(connect);
console.log('Binding connect button');
</script>