import net from "net";

const server = net.createServer(function(socket) {
	socket.on("data", data => {
		console.log(data.toString());
		if(data.toString()==="kill") {
			socket.destroy();
		}
	});
	socket.pipe(socket);
});

server.listen(1337, "127.0.0.1");