var express = require('express');
var socket = require('socket.io');

var Board = require('./models/Board.js');

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
mongoose.connect('mongodb://localhost:27017/Chess', { promiseLibrary: require('bluebird') })
  .then(() =>  console.log('connection succesful'))
  .catch((err) => console.error(err));

var app = express();

server = app.listen(3125);

io = socket(server);

var inUseWhite = new Set();
var inUseBlack = new Set();

var newBoard = [];
for (let i = 0; i < 8; ++i){
  newBoard[i] = [];
  for(let j = 0; j < 8; ++j){
    newBoard[i][j] = 0;
  }
}
newBoard[0][0] = 5;
newBoard[0][1] = 4;
newBoard[0][2] = 3;
newBoard[0][3] = 1;
newBoard[0][4] = 2;
newBoard[0][5] = 3;
newBoard[0][6] = 4;
newBoard[0][7] = 5;
for(let i = 0; i < 8; i++){
  newBoard[1][i] = 6;
}
newBoard[7][0] = 11;
newBoard[7][1] = 10;
newBoard[7][2] = 9;
newBoard[7][3] = 7;
newBoard[7][4] = 8;
newBoard[7][5] = 9;
newBoard[7][6] = 10;
newBoard[7][7] = 11;
for(let i = 0; i < 8; i++){
  newBoard[6][i] = 12;
}

io.on('connection', socket => {

  socket.on("create", () => {
    let board = newBoard.map(arr => arr.slice());
    let id;

    Board.create( {board: board, blackIsNext: false} , function (err, game) {
      if (err) return
      id = game._id;
      data = { color : "white", board : board, blackIsNext : false, id : id };

      inUseWhite.add(data.id.toString());
      socket.emit("init", data);
    })
  } );

  socket.on("load", (data) => {

    if(inUseWhite.has(data.id.toString())) {
      socket.emit("denied", {reason : "full"} );
      return
    }

    Board.findById(data.id, function (err, game) {
      if (err) {
        socket.emit("denied", {reason : "nonexist"});
        return
      }
      
      data = { color : "white", board : game.board, blackIsNext : game.blackIsNext, id : game._id };
      inUseWhite.add(data.id.toString());

      socket.emit("init", data);
    });
  } );

  socket.on("join", (data) => {

    if(!inUseWhite.has(data.id.toString())) {
      socket.emit("denied", {reason : "nonexist"} );
      return
    }
    
    if(inUseBlack.has(data.id.toString())) {
      socket.emit("denied", {reason : "full"} );
      return
    }

    Board.findById(data.id, function (err, game) {
      if (err) {
        socket.emit("denied", {reason : "nonexist"});
        return
      }
      
      data = { color : "black", board : game.board, blackIsNext : game.blackIsNext, id : game._id };
      inUseBlack.add(data.id.toString());
      socket.emit("init", data);
    });
  } );

  socket.on("view", (data) => {

    if(!inUseWhite.has(data.id.toString()) || !inUseBlack.has(data.id.toString())) {
      socket.emit("denied", {reason : "nonexist"} );
      return
    }

    Board.findById(data.id, function (err, game) {
      if (err) {
        socket.emit("denied", {reason : "nonexist"});
        return
      }
      
      data = { color : "view", board : game.board, blackIsNext : game.blackIsNext, id : game._id };
      socket.emit("init", data);
    });
  } );

  

  socket.on("move", message => {

    Board.findById(message.id, function (err, game) {
      if (err) return

      let board = game.board;
      let blackIsNext = !game.blackIsNext;
      //archive
      board[message.endPos[0]][message.endPos[1]] = message.endPiece;
      board[message.startPos[0]][message.startPos[1]] = 0;
      
      Board.findByIdAndUpdate(message.id, {board: board, blackIsNext: blackIsNext}, function (err) {
        if (err) return
      });

      socket.broadcast.emit("move", message);
    });
  });

  socket.on("finish", message => {
    inUseWhite.delete(message.id.toString());
    inUseBlack.delete(message.id.toString());
    Board.findByIdAndRemove(message.id, function (err) {
      if (!err) {
        socket.broadcast.emit("finish", message);
      }
    });
  })

  socket.on("close", (message) => {
    inUseWhite.delete(message.id.toString());
    inUseBlack.delete(message.id.toString());
    socket.broadcast.emit("dropped", message);
  })

});