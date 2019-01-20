import { COMMANDS } from './JetPlotShape.js';

const DEBUG_MESSAGE = {
    [COMMANDS.MOVE_TO]: (x, y) => {
        return `Moved to (${x.toFixed(4)}, ${y.toFixed(4)})`;
    },
    [COMMANDS.PEN_UP]: () => {
        return 'Pen up';
    },
    [COMMANDS.PEN_DOWN]: () => {
        return 'Pen down';
    }
};

class JetPlotRunner {
    constructor(commands) {
        this.commands = commands;
    }

    debugMode(canvas, width, height, logger) {
        this._width = width;
        this._height = height;
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.debug = true;
        this.debugLogger = logger;
        this._prev = {x: 0, y: 0};

        return this;
    }

    start() {
        this.index = 0;
        this.penDown = false;
    }

    next() {
        if (this.index >= this.commands.length) {
            this.end();
            return false;
        }

        const curr = this.commands[this.index];

        if (curr.command === COMMANDS.PEN_DOWN) {
            this.penDown = true;
        }
        if (curr.command === COMMANDS.PEN_UP) {
            this.penDown = false;
        }
        

        if (this.debug) {
            this.debugLogger(DEBUG_MESSAGE[curr.command](curr.x, curr.y));

            switch(curr.command) {
                case COMMANDS.MOVE_TO:
                    if (this.penDown) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(this._prev.x * this._width, this._prev.y * this._height);
                        this.ctx.lineTo(curr.x * this._width, curr.y * this._height);
                        this.ctx.stroke();
                    }
                    break;
                case COMMANDS.PEN_DOWN:
                    this.ctx.beginPath();
                    this.ctx.arc(this._prev.x * this._width, this._prev.y * this._height, 1, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;
            }
        }

        if (curr.x !== false && curr.y !== false) {
            this._prev = { x: curr.x, y: curr.y };
        }

        this.index++;
    }

    end() {
        console.log('ya done');
    }
}

export default JetPlotRunner;