"use strict";
exports.__esModule = true;
var port_1 = require("./port");
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var globalGameState = {};
var globalPlayers = {};
var INITIAL_POSITION = [0, 0];
io.of("/").adapter.on("create-room", function (room) {
    console.log("room ".concat(room, " was created"));
});
io.of("/").adapter.on("join-room", function (room, id) {
    console.log("socket ".concat(id, " has joined room ").concat(room));
});
// Add messages when sockets open and close connections
io.on('connection', function (socket) {
    console.log("[".concat(socket.id, "] socket connected"));
    socket.on('initialize', function () {
        console.log("initializing player");
        printGameState();
        io.emit('playerJoin', {});
        // const newPlayer : Player = {
        //   id : socket.id,
        //   position: INITIAL_POSITION,
        //   room: "NOROOM"
        // }
        // gameState.players[socket.id] = (newPlayer)
    });
    socket.on('joinRoom', function (room) {
        var rooms = io.of("/").adapter.rooms;
        if (rooms.has(room)) {
            //room found
            joinRoomHelper(room, socket);
            socket.emit('roomFound');
        }
        else {
            console.log("Can't find room code : " + room);
            socket.emit('roomNotFound');
        }
    });
    socket.on('createRoom', function (room) {
        joinRoomHelper(room, socket);
    });
    socket.on('disconnect', function (reason) {
        if (globalPlayers[socket.id]) {
            var socketRoom = globalPlayers[socket.id].room;
            delete globalPlayers[socket.id];
            if (globalGameState[socketRoom]) {
                delete globalGameState[socketRoom].players[socket.id];
            }
        }
        console.log("[".concat(socket.id, "] socket disconnected - ").concat(reason));
        console.log("------new Game State-----");
        printGameState();
    });
    socket.on('playerMove', function (positionDataPlayer) {
        if (globalPlayers[socket.id]) {
            var socketRoom = globalPlayers[socket.id].room;
            var gameState = globalGameState[socketRoom];
            if (gameState.players) {
                gameState.players[socket.id].position = positionDataPlayer.position;
            }
        }
    });
});
var joinRoomHelper = function (room, socket) {
    console.log("joining Room : " + room);
    socket.join(room);
    var newPlayer = {
        id: socket.id,
        position: INITIAL_POSITION,
        room: room
    };
    var gameState = {
        players: {}
    };
    globalPlayers[socket.id] = newPlayer;
    //add new gamestate obj when creating a room
    if (!globalGameState[room]) {
        globalGameState[room] = gameState;
    }
    globalGameState[room].players[socket.id] = newPlayer;
    printGameState();
};
var sendUpdates = function () {
    var rooms = io.of("/").adapter.rooms;
    rooms.forEach(function (_, room) {
        if (globalGameState[room]) {
            io.to(room).emit('playerMoveUpdate', globalGameState[room]);
        }
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
http.listen(port_1.port, function () {
    console.log('listening on *:3000');
});
http.on('error', port_1.onError);
function printGameState() {
    console.log("-----------current game state -----------");
    Object.keys(globalGameState).forEach(function (val, ind) {
        var gameStateForRoom = globalGameState[val];
        var playersInRoom = gameStateForRoom.players;
        console.log("in room ", val);
        Object.keys(playersInRoom).map(function (val, ind) {
            console.log("player " + playersInRoom[val].id + " : " + playersInRoom[val].position);
            console.log("----------");
        });
    });
}
