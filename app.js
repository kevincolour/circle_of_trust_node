const express = require('express');
var cors = require('cors');
const app = express();
app.use(cors())
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
var io = new Server(server,{
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

io.on('connection', (socket) => {
    socket.on('clicked', (msg) => {
        console.log('value: ' + msg);
        io.emit('userClick',{data: msg + "hi22"})
      });

      socket.on('playerMove', (msg) => {
        console.log('value: ' + msg);
        io.emit('playerMove',{data: msg})
      });

      

  console.log('a user connected');
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});