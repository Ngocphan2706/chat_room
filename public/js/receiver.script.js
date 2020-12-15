var socket;

window.onload = function(){
	socket = io.connect();
	socket.emit('setRole', 'receiver');
	socket.on('receivePhoto', function(data){
		document.getElementById("showPhoto").src = data.path
	});
}