import { ConflictResolutionMode } from "@azure/cosmos";
import { onError, port } from "./port";
import { GameState, PlayersObject, Player, RoomsGameState } from "./types";

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);


 

const globalGameState : RoomsGameState = {}
const globalPlayers : PlayersObject = {}

const INITIAL_POSITION = [0,0]

io.of("/").adapter.on("create-room", (room) => {
  console.log(`room ${room} was created`);
});

io.of("/").adapter.on("join-room", (room, id) => {
  console.log(`socket ${id} has joined room ${room}`);
});

// Add messages when sockets open and close connections
io.on('connection', socket => {
  console.log(`[${socket.id}] socket connected`);

  socket.on('initialize', () => {
    console.log("initializing player");
    
    printGameState()

    io.emit('playerJoin',{})

    // const newPlayer : Player = {
    //   id : socket.id,
    //   position: INITIAL_POSITION,
    //   room: "NOROOM"
    // }
    // gameState.players[socket.id] = (newPlayer)
  })
  socket.on('joinRoom', (room : string) => {
    
      const rooms = io.of("/").adapter.rooms;
      if (rooms.has(room)){
        //room found
        joinRoomHelper(room,socket)
        socket.emit('roomFound');
      }
      else{
        console.log("Can't find room code : " + room);
        socket.emit('roomNotFound');
      }

  })
    
  socket.on('createRoom', (room : string) => {
    joinRoomHelper(room,socket)
  })
  
  socket.on('disconnect', reason => {
    if (globalPlayers[socket.id]){
      const socketRoom = globalPlayers[socket.id].room;
      delete globalPlayers[socket.id];
      if (globalGameState[socketRoom]){
        delete globalGameState[socketRoom].players[socket.id]
      }
    }
    console.log(`[${socket.id}] socket disconnected - ${reason}`);
    console.log(`------new Game State-----`);
    printGameState()
  });

  socket.on('playerMove', (positionDataPlayer : Player) => {
    if (globalPlayers[socket.id]){
      const socketRoom = globalPlayers[socket.id].room;
      const gameState = globalGameState[socketRoom];
      if (gameState.players){
        gameState.players[socket.id].position = positionDataPlayer.position;
      }
    }
  });
});

const joinRoomHelper = (room,socket) => {
  console.log("joining Room : " + room);
  socket.join(room)

  const newPlayer : Player = {
    id : socket.id,
    position: INITIAL_POSITION,
    room: room
  }
  const gameState : GameState = {
    players : {}
  }
  globalPlayers[socket.id] = newPlayer;

  //add new gamestate obj when creating a room
  if (!globalGameState[room]){
    globalGameState[room] = gameState;
  }
  globalGameState[room].players[socket.id] = newPlayer
  printGameState()
}
const sendUpdates = () =>{
  const rooms = io.of("/").adapter.rooms;
  rooms.forEach((_, room) => {
    if (globalGameState[room]){
      io.to(room).emit('playerMoveUpdate',globalGameState[room])
    }
  })
}

setInterval(sendUpdates, 1000 / 40);

// Broadcast the current server time as global message, every 1s
// setInterval(() => {
//   io.sockets.emit('time-msg', { time: new Date().toISOString() });
// }, 1000);

// Show the index.html by default
app.get('/', (req, res) => res.send({test:"hi"}));

app.use((err, req, res, next) => {
  if (! err) {
      return next();
  }

  res.status(500);
  res.send('500: Internal server error');
});


// Start the express server
http.listen(port, function(){
  console.log('listening on *:3000');
});
http.on('error', onError);



function printGameState() {
  console.log("-----------current game state -----------");
  Object.keys(globalGameState).forEach((val,ind) => {
    const gameStateForRoom = globalGameState[val];
    const playersInRoom = gameStateForRoom.players;
    console.log("in room ", val)
    Object.keys(playersInRoom).map((val,ind) => {
      console.log("player " + playersInRoom[val].id + " : " + playersInRoom[val].position)
      console.log("----------")
    })

  })
}