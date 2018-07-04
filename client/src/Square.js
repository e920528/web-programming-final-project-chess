import React, { Component } from 'react';
import './Square.css'
class Square extends Component {
    /*Empty: 0
    *        King | Queen | Bishop | Knight | Rook | Pawn
    * Black|  1       2       3        4        5     6
    * White|  7       8       9       10       11    12
    */
    
    render() {
        let color;
        if(this.props.value > 6)
            color = this.props.background + " white" ;
        else if(this.props.value > 0)
            color = this.props.background + " black";
        else
            color = this.props.background;

        if(this.props.value === 0)
            return (
                <button className={color + " square"} onClick={this.props.onClick}>
                </button>
            );
        else
            switch(this.props.value % 6) {
                case 0://Pawn
                    return (
                        <button className={color + " square fas fa-chess-pawn"} onClick={this.props.onClick}>
                        </button>
                    );
                case 1://King
                    return (
                        <button className={color + " square fas fa-chess-king"} onClick={this.props.onClick}>
                        </button>
                    );
                case 2://Queen
                    return (
                        <button className={color + " square fas fa-chess-queen"} onClick={this.props.onClick}>
                        </button>
                    );
                case 3://Bishop
                    return (
                        <button className={color + " square fas fa-chess-bishop"} onClick={this.props.onClick}>
                        </button>
                    );
                case 4://Knight
                    return (
                        <button className={color + " square fas fa-chess-knight"} onClick={this.props.onClick}>
                        </button>
                    );
                default://Rook
                    return (
                        <button className={color + " square fas fa-chess-rook"} onClick={this.props.onClick}>
                        </button>
                    );

            }
    }
}

export default Square;