var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var gameState = {
    players: {}
};
var INITIAL_POSITION = [0, 0];
io.of("/").adapter.on("create-room", function (room) {
    console.log("room ".concat(room, " was created"));
    var rooms = io.of("/").adapter.rooms;
});
io.of("/").adapter.on("join-room", function (room, id) {
    console.log("socket ".concat(id, " has joined room ").concat(room));
    var rooms = io.of("/").adapter.rooms;
});
// Add messages when sockets open and close connections
io.on('connection', function (socket) {
    console.log("[".concat(socket.id, "] socket connected"));
    socket.on('initialize', function () {
        console.log("initializing player");
        printGameState();
        io.emit('playerJoin', gameState);
        var newPlayer = {
            id: socket.id,
            position: INITIAL_POSITION
        };
        gameState.players[socket.id] = (newPlayer);
    });
    socket.on('joinRoom', function (room) {
        var rooms = io.of("/").adapter.rooms;
        if (rooms.has(room)) {
            //room found
            console.log("joining Room : " + room);
            socket.join(room);
            socket.emit('roomFound');
        }
        else {
            console.log("Can't find room code : " + room);
            socket.emit('roomNotFound');
        }
    });
    socket.on('createRoom', function (room) {
        socket.join(room);
    });
    socket.on('disconnect', function (reason) {
        delete gameState.players[socket.id];
        console.log("[".concat(socket.id, "] socket disconnected - ").concat(reason));
        console.log("------new Game State-----");
        printGameState();
    });
    socket.on('playerMove', function (positionDataPlayer) {
        if (gameState.players[socket.id]) {
            gameState.players[socket.id].position = positionDataPlayer.position;
        }
    });
});
var sendUpdates = function () {
    var rooms = io.of("/").adapter.rooms;
    rooms.forEach(function (value, key) {
        io.to(key).emit('playerMoveUpdate', gameState);
    });
};
setInterval(sendUpdates, 1000 / 40);
// Broadcast the current server time as global message, every 1s
// setInterval(() => {
//   io.sockets.emit('time-msg', { time: new Date().toISOString() });
// }, 1000);
// Show the index.html by default
app.get('/', function (req, res) { return res.send({ test: "hi" }); });
app.use(function (err, req, res, next) {
    if (!err) {
        return next();
    }
    res.status(500);
    res.send('500: Internal server error');
});
// Start the express server
http.listen(3000, function () {
    console.log('listening on *:3000');
});
function printGameState() {
    console.log("-----------current game state -----------");
    Object.keys(gameState.players).map(function (val, ind) {
        console.log("player " + val + " : " + gameState.players[val].position);
        console.log("----------");
    });
}
