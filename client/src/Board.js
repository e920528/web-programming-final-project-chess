import React, { Component } from 'react';
import Square from './Square';

class Board extends Component {
/*Empty: 0
*        King | Queen | Bishop | Knight | Rook | Pawn
* Black|  1       2       3        4        5     6
* White|  7       8       9       10       11    12
*/
    renderSquare(i, j) {
        let background;
        switch(this.props.status[i][j]){
            case 0:
                if((i + j) % 2 > 0)
                    background = "light";
                else
                    background = "dark";
                break;
            case 1:
                background = "green";
                break;
            case 2:
                background = "blue";
                break;
            default:
                background = "red";
        }
            
        return (
            <Square background = {background} value = {this.props.squares[i][j]} onClick = {() => this.props.onClick(i, j)}/>
        );
    }
    createView = () => {
        let render = [];
        if(this.props.player==="white") {
            for (let i = 0;  i < 8; i++) {
                let row = [];
                for (let j = 0; j < 8; j++) {
                    row.push(this.renderSquare(i, j))
                }
                render.push(<div>{row}</div>)
            }
        }
        else if(this.props.player==="black") {
            for (let i = 7;  i >= 0; i--) {
                let row = [];
                for (let j = 7; j >= 0; j--) {
                    row.push(this.renderSquare(i, j))
                }
                render.push(<div>{row}</div>)
            }
        }
        else {
            for (let i = 7;  i >= 0; i--) {
                let row = [];
                for (let j = 7; j >= 0; j--) {
                    row.push(this.renderSquare(j, i))
                }
                render.push(<div>{row}</div>)
            }
        }
        

        
        return render;

    }
   

    render() {
        return (
            <div className="board">
                {this.createView()}
            </div>
            
        );
    }
}

export default Board;