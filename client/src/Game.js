import React, { Component } from 'react';
import './Game.css';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css'
import Board from './Board';
import socketIOClient from 'socket.io-client';
import ToggleDisplay from 'react-toggle-display';


/* Initialize the board 
* Empty: 0
*        King | Queen | Bishop | Knight | Rook | Pawn
* Black|  1       2       3        4        5     6
* White|  7       8       9       10       11    12
*/
let initSquares = new Array(8);
for (let i = 0; i < 8; i++) {
  initSquares[i] = Array(8).fill(0); 
}

//0: not selected/can't move, 1: selected, 2: can move, 3: can eat
let statusArray = new Array(8);
for (let i = 0; i < 8; i++) {
  statusArray[i] = Array(8).fill(0); 
}

class Game extends Component {
  constructor(props) {
    super(props);
    this.status = statusArray.map(arr => arr.slice())
    this.squareArray = initSquares.map(arr => arr.slice())
    this.state = {
      squares: this.squareArray,
      blackIsNext: false,
      info: "",
      select: false,
      selectNum: [],
      status: this.status,
      finished: false,

      playerColor: "white",
      gameID: ""
    }
    this.socket = socketIOClient('http://localhost:3125');
    this.socket.on("init", data => {
      console.log(data);
      var tmp_info = "Next Player is: ";
      if(data.blackIsNext)
        tmp_info += "black";
      else
        tmp_info += "white";
      
      var tmp_squares = data.board.map(arr => arr.slice());

      this.setState( { blackIsNext : data.blackIsNext, info : tmp_info, squares : tmp_squares, playerColor : data.color, gameID : data.id } );
    } );
    
    this.socket.on("move", message => {
      if(message.id===this.state.gameID) {
        let next;
        if(this.state.blackIsNext){
          next = "white";
        }
        else{
          next = "black";
        }

        let squares = this.state.squares.map(arr => arr.slice());
        squares[message.endPos[0]][message.endPos[1]] = message.endPiece;
        squares[message.startPos[0]][message.startPos[1]] = 0;
        this.setState({
          squares: squares,
          info: "Next Player is: " + next,
          blackIsNext: !this.state.blackIsNext
        })
      }
    } );

    this.socket.on("finish", message => {
      if(message.id===this.state.gameID) {
        this.setState({
          info: "Winner is: " + message.winner,
          finished: true
        })
      }
    } );

    this.socket.on("dropped", (message) => {
      if(message.id===this.state.gameID) {
        alert("Player dropped.");
        this.restart();
      }
    } );

    this.socket.on("denied", (message) => {
      if(message.reason==="nonexist")
        alert("Match does not exist!!!");
      else if(message.reason==="full")
        alert("Room is full");
    } );

    window.addEventListener("beforeunload", (ev) => {
      if(this.state.gameID!=="" && this.state.playerColor!=="view")
        this.socket.emit("close", {id : this.state.gameID});
    } );

  }

  handleClick(i, j) {//TODO
    let squares = this.state.squares.map(arr => arr.slice());
    let status = this.state.status.map(arr => arr.slice());
    let newStatus = statusArray.map(arr => arr.slice());
    if(this.state.select){
      let chess = squares[this.state.selectNum[0]][this.state.selectNum[1]];
      switch(status[i][j]){
        case 2://can move
          if((chess === 6 && i === 7) || (chess === 12 && i === 0)){
            let promote = parseInt (prompt("Please choose what your Pawn will be promoted to.(1: Queen, 2: Bishop, 3: Knight, 4: Rook)(Default Queen)", "1"), 10 );
            if(this.state.blackIsNext){
              if(promote !== 2 && promote !== 3 && promote !== 4)
                squares[i][j] = 2;
              else
                squares[i][j] = promote + 1;
            }
            else{
              if(promote !== 2 && promote !== 3 && promote !== 4)
                squares[i][j] = 8;
              else
                squares[i][j] = promote + 7;
            }
          }
          else{
            squares[i][j] = chess;
          }
          squares[this.state.selectNum[0]][this.state.selectNum[1]] = 0;
          let next;
          if(this.state.blackIsNext){
            next = "white";
          }
          else{
            next = "black";
          }

          this.socket.emit("move", { startPos : [this.state.selectNum[0], this.state.selectNum[1]],
                                     endPos : [i,j],
                                     endPiece : squares[i][j],
                                     id : this.state.gameID} );

          this.setState({
            squares: squares,
            info: "Next Player is: " + next,
            blackIsNext: !this.state.blackIsNext,
            select: false,
            selectNum: [],
            status: newStatus
          })
          break;
        case 3://can eat
          if(squares[i][j] % 6 === 1){
            if((chess === 6 && i === 7) || (chess === 12 && i === 0)){
              let promote = parseInt (prompt("Please choose what your Pawn will be promoted to.(1: Queen, 2: Bishop, 3: Knight, 4: Rook)(Default Queen)", "1"), 10 );
              if(this.state.blackIsNext){
                if(promote !== 2 && promote !== 3 && promote !== 4)
                  squares[i][j] = 2;
                else
                  squares[i][j] = promote + 1;
              }
              else{
                if(promote !== 2 && promote !== 3 && promote !== 4)
                  squares[i][j] = 8;
                else
                  squares[i][j] = promote + 7;
              }
            }
            else{
              squares[i][j] = chess;
            }
            squares[this.state.selectNum[0]][this.state.selectNum[1]] = 0;
            let winner;
            if(this.state.blackIsNext){
              winner = "Black!"
            }
            else{
              winner = "White!"
            }

            this.socket.emit("move", { startPos : [this.state.selectNum[0], this.state.selectNum[1]],
                                       endPos : [i,j],
                                       endPiece : squares[i][j],
                                       id : this.state.gameID } );

            this.socket.emit("finish", { winner : winner, id : this.state.gameID} );

            this.setState({
              squares: squares,
              info: "Winner is: " + winner,
              select: false,
              selectNum: [],
              status: newStatus,
              finished: true
            })
          }
          else{
            if((chess === 6 && i === 7) || (chess === 12 && i === 0)){
              let promote = parseInt (prompt("Please choose what your Pawn will be promoted to.(1: Queen, 2: Bishop, 3: Knight, 4: Rook)(Default Queen)", "1"), 10 );
              if(this.state.blackIsNext){
                if(promote !== 2 && promote !== 3 && promote !== 4)
                  squares[i][j] = 2;
                else
                  squares[i][j] = promote + 1;
              }
              else{
                if(promote !== 2 && promote !== 3 && promote !== 4)
                  squares[i][j] = 8;
                else
                  squares[i][j] = promote + 7;
              }
            }
            else{
              squares[i][j] = chess;
            }
            squares[this.state.selectNum[0]][this.state.selectNum[1]] = 0;
            let next;
            if(this.state.blackIsNext){
              next = "white";
            }
            else{
              next = "black";
            }

            this.socket.emit("move", { startPos : [this.state.selectNum[0], this.state.selectNum[1]],
                                       endPos : [i,j],
                                       endPiece : squares[i][j],
                                       id : this.state.gameID } );

            this.setState({
              squares: squares,
              info: "Next Player is: " + next,
              blackIsNext: !this.state.blackIsNext,
              select: false,
              selectNum: [],
              status: newStatus
            })
          }
          break;
        default:          
          this.setState({
            select: false,
            selectNum: [],
            status: newStatus
          })          
      }
    }
    else{
      let chess = this.state.squares[i][j];
      //Player can only move its own chess
      if(chess === 0 || this.state.finished || this.state.playerColor==="view") return;
      if(chess > 6){
        if(this.state.blackIsNext || this.state.playerColor==="black") return;
      }
      else if(chess < 7){
        if(!this.state.blackIsNext || this.state.playerColor==="white") return;
      }
      newStatus[i][j] = 1;
      let selectNum = [i, j];
      switch(chess % 6){
        case 1://King
          if(i !== 7){
            //right
            if(squares[i + 1][j] === 0)
              newStatus[i + 1][j] = 2;
            else if(this.state.blackIsNext){
              if(squares[i + 1][j] > 6)
                newStatus[i + 1][j] = 3;
            }
            else{
              if(squares[i + 1][j] < 7)
                newStatus[i + 1][j] = 3;
            }
            if(j !== 7){//right up
              if(squares[i + 1][j + 1] === 0)
                newStatus[i + 1][j + 1] = 2;
              else if(this.state.blackIsNext){
                if(squares[i + 1][j + 1] > 6)
                  newStatus[i + 1][j + 1] = 3;
              }
              else{
                if(squares[i + 1][j + 1] < 7)
                  newStatus[i + 1][j + 1] = 3;
              }
            }
            if(j !== 0){//right down
              if(squares[i + 1][j - 1] === 0)
                newStatus[i + 1][j - 1] = 2;
              else if(this.state.blackIsNext){
                if(squares[i + 1][j - 1] > 6)
                  newStatus[i + 1][j - 1] = 3;
              }
              else{
                if(squares[i + 1][j + 1] < 7)
                  newStatus[i + 1][j + 1] = 3;
              }
            }
          }
          if(i !== 0){
            //left
            if(squares[i - 1][j] === 0)
              newStatus[i - 1][j] = 2;
            else if(this.state.blackIsNext){
              if(squares[i - 1][j] > 6)
                newStatus[i - 1][j] = 3;
            }
            else{
              if(squares[i - 1][j] < 7)
                newStatus[i - 1][j] = 3;
            }
            if(j !== 7){//left up
              if(squares[i - 1][j + 1] === 0)
                newStatus[i - 1][j + 1] = 2;
              else if(this.state.blackIsNext){
                if(squares[i - 1][j + 1] > 6)
                  newStatus[i - 1][j + 1] = 3;
              }
              else{
                if(squares[i - 1][j + 1] < 7)
                  newStatus[i - 1][j + 1] = 3;
              }
            }
            if(j !== 0){//left down
              if(squares[i - 1][j - 1] === 0)
                newStatus[i - 1][j - 1] = 2;
              else if(this.state.blackIsNext){
                if(squares[i - 1][j - 1] > 6)
                  newStatus[i - 1][j - 1] = 3;
              }
              else{
                if(squares[i - 1][j + 1] < 7)
                  newStatus[i - 1][j + 1] = 3;
              }
            }
          }
          if(j !== 7){//up
            if(squares[i][j + 1] === 0)
              newStatus[i][j + 1] = 2;
            else if(this.state.blackIsNext){
              if(squares[i][j + 1] > 6)
                newStatus[i][j + 1] = 3;
            }
            else{
              if(squares[i][j + 1] < 7)
                newStatus[i][j + 1] = 3;
            }
          }
          if(j !== 0){//down
            if(squares[i][j - 1] === 0)
              newStatus[i][j - 1] = 2;
            else if(this.state.blackIsNext){
              if(squares[i][j - 1] > 6)
                newStatus[i][j - 1] = 3;
            }
            else{
              if(squares[i][j - 1] < 7)
                newStatus[i][j - 1] = 3;
            }
          }
          this.setState({
            select: true,
            selectNum: selectNum,
            status: newStatus
          })
          break;
        case 2://Queen
          let xq = i;
          let yq = j;
          while(xq < 7){//right
            if(squares[xq + 1][yq] === 0){
              newStatus[xq + 1][yq] = 2;
              xq++;
              continue;
            }
            else if(this.state.blackIsNext){
              if(squares[xq + 1][yq] < 7)
                break;
              else{
                newStatus[xq + 1][yq] = 3;
                break;
              }
            }
            else{
              if(squares[xq + 1][yq] > 6)
                break;
              else{
                newStatus[xq + 1][yq] = 3;
                break;
              }
            }
          }
          xq = i;
          while(xq > 0){//left
            if(squares[xq - 1][yq] === 0){
              newStatus[xq - 1][yq] = 2;
              xq--;
              continue;
            }
            else if(this.state.blackIsNext){
              if(squares[xq - 1][yq] < 7)
                break;
              else{
                newStatus[xq - 1][yq] = 3;
                break;
              }
            }
            else{
              if(squares[xq - 1][yq] > 6)
                break;
              else{
                newStatus[xq - 1][yq] = 3;
                break;
              }
            }
          }
          xq = i;
          while(yq < 7){//up
            if(squares[xq][yq + 1] === 0){
              newStatus[xq][yq + 1] = 2;
              yq++;
              continue;
            }
            else if(this.state.blackIsNext){
              if(squares[xq][yq + 1] < 7)
                break;
              else{
                newStatus[xq][yq + 1] = 3;
                break;
              }
            }
            else{
              if(squares[xq][yq + 1] > 6)
                break;
              else{
                newStatus[xq][yq + 1] = 3;
                break;
              }
            }
          }
          yq = j;
          while(yq > 0){//down
            if(squares[xq][yq - 1] === 0){
              newStatus[xq][yq - 1] = 2;
              yq--;
              continue;
            }
            else if(this.state.blackIsNext){
              if(squares[xq][yq - 1] < 7)
                break;
              else{
                newStatus[xq][yq - 1] = 3;
                break;
              }
            }
            else{
              if(squares[xq][yq - 1] > 6)
                break;
              else{
                newStatus[xq][yq - 1] = 3;
                break;
              }
            }
          }
          xq = i;
          yq = j;
          while(xq < 7 && yq < 7){//up right
            if(squares[xq + 1][yq + 1] === 0){
              xq++;
              yq++;
              newStatus[xq][yq] = 2;
              continue;
            }
            else if(this.state.blackIsNext){
              if(squares[xq + 1][yq + 1] > 6){
                newStatus[xq + 1][yq + 1] = 3;
              }
              break;
            }
            else{
              if(squares[xq + 1][yq + 1] < 7){
                newStatus[xq + 1][yq + 1] = 3;
              }
              break;
            }
          }
          xq = i;
          yq = j;
          while(xq > 0 && yq < 7){
            if(squares[xq - 1][yq + 1] === 0){
              xq--;
              yq++;
              newStatus[xq][yq] = 2;
              continue;
            }
            else if(this.state.blackIsNext){
              if(squares[xq - 1][yq + 1] > 6){
                newStatus[xq - 1][yq + 1] = 3;
              }
              break;
            }
            else{
              if(squares[xq - 1][yq + 1] < 7){
                newStatus[xq - 1][yq + 1] = 3;
              }
              break;
            }
          }
          xq = i;
          yq = j;
          while(xq < 7 && yq > 0){
            if(squares[xq + 1][yq - 1] === 0){
              xq++;
              yq--;
              newStatus[xq][yq] = 2;
              continue;
            }
            else if(this.state.blackIsNext){
              if(squares[xq + 1][yq - 1] > 6){
                newStatus[xq + 1][yq - 1] = 3;
              }
              break;
            }
            else{
              if(squares[xq + 1][yq - 1] < 7){
                newStatus[xq + 1][yq - 1] = 3;
              }
              break;
            }
          }
          xq = i;
          yq = j;
          while(xq > 0 && yq > 0){
            if(squares[xq - 1][yq - 1] === 0){
              xq--;
              yq--;
              newStatus[xq][yq] = 2;
              continue;
            }
            else if(this.state.blackIsNext){
              if(squares[xq - 1][yq - 1] > 6){
                newStatus[xq - 1][yq - 1] = 3;
              }
              break;
            }
            else{
              if(squares[xq - 1][yq - 1] < 7){
                newStatus[xq - 1][yq - 1] = 3;
              }
              break;
            }
          }
          this.setState({
            select: true,
            selectNum: selectNum,
            status: newStatus
          })
          break;
        case 3://Bishop
          let xb = i;
          let yb = j;
          while(xb < 7 && yb < 7){//up right
            if(squares[xb + 1][yb + 1] === 0){
              xb++;
              yb++;
              newStatus[xb][yb] = 2;
              continue;
            }
            else if(this.state.blackIsNext){
              if(squares[xb + 1][yb + 1] > 6){
                newStatus[xb + 1][yb + 1] = 3;
              }
              break;
            }
            else{
              if(squares[xb + 1][yb + 1] < 7){
                newStatus[xb + 1][yb + 1] = 3;
              }
              break;
            }
          }
          xb = i;
          yb = j;
          while(xb > 0 && yb < 7){
            if(squares[xb - 1][yb + 1] === 0){
              xb--;
              yb++;
              newStatus[xb][yb] = 2;
              continue;
            }
            else if(this.state.blackIsNext){
              if(squares[xb - 1][yb + 1] > 6){
                newStatus[xb - 1][yb + 1] = 3;
              }
              break;
            }
            else{
              if(squares[xb - 1][yb + 1] < 7){
                newStatus[xb - 1][yb + 1] = 3;
              }
              break;
            }
          }
          xb = i;
          yb = j;
          while(xb < 7 && yb > 0){
            if(squares[xb + 1][yb - 1] === 0){
              xb++;
              yb--;
              newStatus[xb][yb] = 2;
              continue;
            }
            else if(this.state.blackIsNext){
              if(squares[xb + 1][yb - 1] > 6){
                newStatus[xb + 1][yb - 1] = 3;
              }
              break;
            }
            else{
              if(squares[xb + 1][yb - 1] < 7){
                newStatus[xb + 1][yb - 1] = 3;
              }
              break;
            }
          }
          xb = i;
          yb = j;
          while(xb > 0 && yb > 0){
            if(squares[xb - 1][yb - 1] === 0){
              xb--;
              yb--;
              newStatus[xb][yb] = 2;
              continue;
            }
            else if(this.state.blackIsNext){
              if(squares[xb - 1][yb - 1] > 6){
                newStatus[xb - 1][yb - 1] = 3;
              }
              break;
            }
            else{
              if(squares[xb - 1][yb - 1] < 7){
                newStatus[xb - 1][yb - 1] = 3;
              }
              break;
            }
          }
          this.setState({
            select: true,
            selectNum: selectNum,
            status: newStatus
          })
          break;
        case 4://Knight
          if(i < 6){
            if(j < 7){
              if(squares[i + 2][j + 1] === 0)
                newStatus[i + 2][j + 1] = 2;
              else if(this.state.blackIsNext){
                if(squares[i + 2][j + 1] > 6){
                  newStatus[i + 2][j + 1] = 3;
                }
              }
              else{
                if(squares[i + 2][j + 1] < 7){
                  newStatus[i + 2][j + 1] = 3;
                }
              }
            }
            if(j > 0){
              if(squares[i + 2][j - 1] === 0)
                newStatus[i + 2][j - 1] = 2;
              else if(this.state.blackIsNext){
                if(squares[i + 2][j - 1] > 6){
                  newStatus[i + 2][j - 1] = 3;
                }
              }
              else{
                if(squares[i + 2][j - 1] < 7){
                  newStatus[i + 2][j - 1] = 3;
                }
              }
            }
          }
          if(i < 7){
            if(j < 6){
              if(squares[i + 1][j + 2] === 0)
                newStatus[i + 1][j + 2] = 2;
              else if(this.state.blackIsNext){
                if(squares[i + 1][j + 2] > 6){
                  newStatus[i + 1][j + 2] = 3;
                }
              }
              else{
                if(squares[i + 1][j + 2] < 7){
                  newStatus[i + 1][j + 2] = 3;
                }
              }
            }
            if(j > 1){
              if(squares[i + 1][j - 2] === 0)
                newStatus[i + 1][j - 2] = 2;
              else if(this.state.blackIsNext){
                if(squares[i + 1][j - 2] > 6){
                  newStatus[i + 1][j - 2] = 3;
                }
              }
              else{
                if(squares[i + 1][j - 2] < 7){
                  newStatus[i + 1][j - 2] = 3;
                }
              }
            }
          }
          if(i > 1){
            if(j < 7){
              if(squares[i - 2][j + 1] === 0)
                newStatus[i - 2][j + 1] = 2;
              else if(this.state.blackIsNext){
                if(squares[i - 2][j + 1] > 6){
                  newStatus[i - 2][j + 1] = 3;
                }
              }
              else{
                if(squares[i - 2][j + 1] < 7){
                  newStatus[i - 2][j + 1] = 3;
                }
              }
            }
            if(j > 0){
              if(squares[i - 2][j - 1] === 0)
                newStatus[i - 2][j - 1] = 2;
              else if(this.state.blackIsNext){
                if(squares[i - 2][j - 1] > 6){
                  newStatus[i - 2][j - 1] = 3;
                }
              }
              else{
                if(squares[i - 2][j - 1] < 7){
                  newStatus[i - 2][j - 1] = 3;
                }
              }
            }

          }
          if(i > 0){
            if(j < 6){
              if(squares[i - 1][j + 2] === 0)
                newStatus[i - 1][j + 2] = 2;
              else if(this.state.blackIsNext){
                if(squares[i - 1][j + 2] > 6){
                  newStatus[i - 1][j + 2] = 3;
                }
              }
              else{
                if(squares[i - 1][j + 2] < 7){
                  newStatus[i - 1][j + 2] = 3;
                }
              }
            }
            if(j > 1){
              if(squares[i - 1][j - 2] === 0)
                newStatus[i - 1][j - 2] = 2;
              else if(this.state.blackIsNext){
                if(squares[i - 1][j - 2] > 6){
                  newStatus[i - 1][j - 2] = 3;
                }
              }
              else{
                if(squares[i - 1][j - 2] < 7){
                  newStatus[i - 1][j - 2] = 3;
                }
              }
            }

          }
          this.setState({
            select: true,
            selectNum: selectNum,
            status: newStatus
          })
          break;
        case 5://Rook
          let x = i;
          let y = j;
          while(x < 7){//right
            if(squares[x + 1][y] === 0){
              newStatus[x + 1][y] = 2;
              x++;
              continue;
            }
            else if(this.state.blackIsNext){
              if(squares[x + 1][y] < 7)
                break;
              else{
                newStatus[x + 1][y] = 3;
                break;
              }
            }
            else{
              if(squares[x + 1][y] > 6)
                break;
              else{
                newStatus[x + 1][y] = 3;
                break;
              }
            }
          }
          x = i;
          while(x > 0){//left
            if(squares[x - 1][y] === 0){
              newStatus[x - 1][y] = 2;
              x--;
              continue;
            }
            else if(this.state.blackIsNext){
              if(squares[x - 1][y] < 7)
                break;
              else{
                newStatus[x - 1][y] = 3;
                break;
              }
            }
            else{
              if(squares[x - 1][y] > 6)
                break;
              else{
                newStatus[x - 1][y] = 3;
                break;
              }
            }
          }
          x = i;
          while(y < 7){//up
            if(squares[x][y + 1] === 0){
              newStatus[x][y + 1] = 2;
              y++;
              continue;
            }
            else if(this.state.blackIsNext){
              if(squares[x][y + 1] < 7)
                break;
              else{
                newStatus[x][y + 1] = 3;
                break;
              }
            }
            else{
              if(squares[x][y + 1] > 6)
                break;
              else{
                newStatus[x][y + 1] = 3;
                break;
              }
            }
          }
          y = j;
          while(y > 0){//down
            if(squares[x][y - 1] === 0){
              newStatus[x][y - 1] = 2;
              y--;
              continue;
            }
            else if(this.state.blackIsNext){
              if(squares[x][y - 1] < 7)
                break;
              else{
                newStatus[x][y - 1] = 3;
                break;
              }
            }
            else{
              if(squares[x][y - 1] > 6)
                break;
              else{
                newStatus[x][y - 1] = 3;
                break;
              }
            }
          }
          this.setState({
            select: true,
            selectNum: selectNum,
            status: newStatus
          })
          break;
        default://Pawn
          if(this.state.blackIsNext){
            if(i === 1){
              if(squares[i + 2][j] === 0 && squares[i + 1][j] === 0)
                newStatus[i + 2][j] = 2;
            }
            if(squares[i + 1][j] === 0)
              newStatus[i + 1][j] = 2;
            if(j > 0)
              if(squares[i + 1][j - 1] > 6)
                newStatus[i + 1][j - 1] = 3;
            if(j < 7)
              if(squares[i + 1][j + 1] > 6)
                newStatus[i + 1][j + 1] = 3;
          }
          else{
            if(i === 6){
              if(squares[i - 2][j] === 0 && squares[i - 1][j] === 0)
                newStatus[i - 2][j] = 2;
            }
            if(squares[i - 1][j] === 0)
              newStatus[i - 1][j] = 2;
            if(j > 0)
              if(squares[i - 1][j - 1] < 7 && squares[i - 1][j - 1] > 0)
                newStatus[i - 1][j - 1] = 3;
            if(j < 7)
              if(squares[i - 1][j + 1] < 7 && squares[i - 1][j + 1] > 0)
                newStatus[i - 1][j + 1] = 3;
          }         
          this.setState({
            select: true,
            selectNum: selectNum,
            status: newStatus
          })    
      }
    }
  }
  
  restart() {//TODO
    let initArray = initSquares.map(arr => arr.slice())
    let status = statusArray.map(arr => arr.slice())
    this.setState({
      squares: initArray,
      blackIsNext: false,
      info: "",
      select: false,
      selectNum: [],
      status: status,
      finished: false,
      gameID: ""
    })
  }

  create() {
    this.socket.emit("create");
  }

  load() {
    let id = prompt("Please enter match ID:");
    if(id !== null)
      this.socket.emit("load", { id : id } );
  }

  join() {
    let id = prompt("Please enter match ID:");
    if(id !== null)
      this.socket.emit("join", { id : id } );
  }

  view() {
    let id = prompt("Please enter match ID:");
    if(id !== null)
      this.socket.emit("view", { id : id } );
  }

  render() {
    /*return (
      <div className="game" id="container">
        <div className="game-board">
          <Board player= {this.state.playerColor} status = {this.state.status} onClick = {(i, j) => this.handleClick(i, j)} squares = {this.state.squares}/>
        </div>
        <div className="game-info">
          <div>
            <button className="btn btn-primary btn-sm" onClick = {() => this.restart()}>重新開始</button>
          </div>
          <div id="info">
            {this.state.info}
          </div>
        </div>
      </div>
    );*/
    return (
      <div className="game" id="container">
        <div className="game-board">
          <Board player= {this.state.playerColor} status = {this.state.status} onClick = {(i, j) => this.handleClick(i, j)} squares = {this.state.squares}/>
        </div>
        <div className="game-info">
          <ToggleDisplay show={this.state.gameID===""} tag="section">
            <div>
              <div style={{marginBottom: '5px'}}>
                <button className="btn btn-outline-primary btn-sm" onClick = {() => this.create()}>Create New Match</button>
              </div>
              <div style={{marginBottom: '5px'}}>
                <button className="btn btn-outline-secondary btn-sm" onClick = {() => this.load()}>Load Unfinished Match(as White)</button>
              </div>
              <div style={{marginBottom: '5px'}}>
                <button className="btn btn-outline-dark btn-sm" onClick = {() => this.join()}>Join Existing Match(as Black)</button>
              </div>
              <div style={{marginBottom: '5px'}}>
                <button className="btn btn-outline-success btn-sm" onClick = {() => this.view()}>Spectate Match</button>
              </div>
            </div>
          </ToggleDisplay>
          <ToggleDisplay show={this.state.gameID!==""} tag="section">
            <div id="info">
              <p>Match ID: {this.state.gameID}</p>
              <p>{this.state.info}</p>
            </div>
          </ToggleDisplay>
          <ToggleDisplay show={this.state.finished} tag="section">
            <div>
              <button className="btn btn-primary btn-sm" onClick = {() => this.restart()}>Restart</button>
            </div>
          </ToggleDisplay>
        </div>
      </div>
    );
  }
}


export default Game;
