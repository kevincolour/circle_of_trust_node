const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

type Player = {
  id : string,
  position : number[],
  name? : string,
  score? : number
}

interface Players {
  [id:string] : Player
}

type GameState = {
  players : Players,
}

const gameState : GameState = {
  players : {}
}
const INITIAL_POSITION = [0,0]


io.of("/").adapter.on("create-room", (room) => {
  console.log(`room ${room} was created`);
  const rooms = io.of("/").adapter.rooms;
});

io.of("/").adapter.on("join-room", (room, id) => {
  console.log(`socket ${id} has joined room ${room}`);
  const rooms = io.of("/").adapter.rooms;
});

// Add messages when sockets open and close connections
io.on('connection', socket => {
  console.log(`[${socket.id}] socket connected`);

  socket.on('initialize', () => {
    console.log("initializing player");
    
    printGameState()

    io.emit('playerJoin',gameState)

    const newPlayer : Player = {
      id : socket.id,
      position: INITIAL_POSITION
    }
    gameState.players[socket.id] = (newPlayer)
  })
  socket.on('joinRoom', (room : string) => {
    
      const rooms = io.of("/").adapter.rooms;
      if (rooms.has(room)){
        //room found
        console.log("joining Room : " + room);
        socket.join(room)
        socket.emit('roomFound');
      }
      else{
        console.log("Can't find room code : " + room);
        socket.emit('roomNotFound');
      }
  })
    
  socket.on('createRoom', (room : string) => {
      socket.join(room)
  })
  
  socket.on('disconnect', reason => {
    delete gameState.players[socket.id];
    console.log(`[${socket.id}] socket disconnected - ${reason}`);
    console.log(`------new Game State-----`);
    printGameState()
  });

  socket.on('playerMove', (positionDataPlayer : Player) => {
    if (gameState.players[socket.id]){
      gameState.players[socket.id].position = positionDataPlayer.position;
    }
  });
});

const sendUpdates = () =>{
  const rooms = io.of("/").adapter.rooms;
  rooms.forEach((value, key) => {
    io.to(key).emit('playerMoveUpdate',gameState)
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
http.listen(3000, function(){
  console.log('listening on *:3000');
});



function printGameState() {
  console.log("-----------current game state -----------");
  Object.keys(gameState.players).map((val,ind) => {
    console.log("player " + val + " : " + gameState.players[val].position)
    console.log("----------")
  })
}