export const SHAPE_TYPE = {
    LINES: 'lines',
    DOTS: 'dots'
};

export const COMMANDS = {
    MOVE_TO: 'move_to',
    PEN_DOWN: 'pen_down',
    PEN_UP: 'pen_up'
};

const DEFAULT_STROKE = 'red';
const DEFAULT_FILL = 'black';

class JetPlotShape {
    constructor(type = SHAPE_TYPE.LINES) {
        this.type = type;
        this._pathPoints = [];

        this.color = false;
    }

    _getBounds() {
        const x = this._pathPoints.map(p => p.x).sort();
        const y = this._pathPoints.map(p => p.y).sort();

        const topLeft = {x: x[0], y: y[0]};
        const bottomRight = {x: x[x.length - 1], y: y[y.length - 1]};

        const width = bottomRight.x - topLeft.x;
        const height = bottomRight.y - topLeft.y;

        return {
            topLeft,
            bottomRight,
            width,
            height,
            centre: {
                x: topLeft.x + (width / 2),
                y: topLeft.y + (height / 2),
            }
        };
    }

    getPointAt(index) {
        return this._pathPoints[index];
    }

    getLastPoint() {
        return this._pathPoints.length ? this._pathPoints[this._pathPoints.length - 1] : false;
    }

    addCoords(x, y) {
        this._pathPoints.push({ x, y });
    }

    translate(x, y) {
        this._pathPoints = this._pathPoints.map(p => {
            return {
                x: p.x + x,
                y: p.y + y,
            };
        });
    }

    scale(xFactor, yFactor) {
        const { width, height, centre, topLeft, bottomRight } = this._getBounds();

        const widthIncrease = (width * xFactor) - width;
        const heightIncrease = (height * yFactor) - height;

        this._pathPoints = this._pathPoints.map(p => {
            return {
                x: (((p.x - topLeft.x) * xFactor) + topLeft.x) - (widthIncrease / 2),
                y: (((p.y - topLeft.y) * yFactor) + topLeft.y) - (heightIncrease / 2),
            };
        });
    }

    useState({ type, path, color }) {
        this.type = type;
        this._pathPoints = path.slice();
        this.setColor(color);
    }

    saveState() {
        return {
            type: this.type,
            path: this._pathPoints.slice(),
            color: this.color
        };
    }

    getPath() {
        if (this.type === SHAPE_TYPE.DOTS) {
            console.warn('You are not really meant to get the path of a dots shape');
        }

        const path = new Path2D();
        this._pathPoints.forEach((p, index) => {
            if (index === 0) {
                path.moveTo(p.x, p.y);
            } else {
                path.lineTo(p.x, p.y);
            }
        });
        return path;
    }

    setColor(color) {
        this.color = color;
    }

    draw(ctx) {
        if (this.type === SHAPE_TYPE.DOTS) {
            this._drawDots(ctx);
        }

        if (this.type === SHAPE_TYPE.LINES) {
            this._drawLines(ctx);
        }
    }

    _drawDots(ctx) {
        ctx.save();
        ctx.fillStyle = this.color || DEFAULT_FILL;
        this._pathPoints.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }

    _drawLines(ctx) {
        ctx.save();
        ctx.strokeStyle = this.color || DEFAULT_STROKE;
        ctx.stroke(this.getPath());
        ctx.restore();
    }

    getCommand(width, height) {
        if (this.type === SHAPE_TYPE.DOTS) {
            return this._getDotsCommand(width, height);
        }

        if (this.type === SHAPE_TYPE.LINES) {
            return this._getLinesCommand(width, height);
        }
    }

    _makeCommand(command, x = false, y = false) {
        return { command, x, y, color: this.color ? this.color : DEFAULT_FILL };
    }

    _getDotsCommand(width, height) {
        return this._pathPoints.map(p => {
            return [
                this._makeCommand(COMMANDS.MOVE_TO, this._convert(p.x, width), this._convert(p.y, height)),
                this._makeCommand(COMMANDS.PEN_DOWN),
                this._makeCommand(COMMANDS.PEN_UP)
            ];
        }).flat();
    }

    _getLinesCommand(width, height) {
        const { x: fx, y: fy} = this.getPointAt(0);
        const command = [
            this._makeCommand(COMMANDS.MOVE_TO, this._convert(fx, width), this._convert(fy, height)),
            this._makeCommand(COMMANDS.PEN_DOWN)
        ];

        this._pathPoints.forEach((p, index) => {
            if (index > 0) {
                command.push(this._makeCommand(COMMANDS.MOVE_TO, this._convert(p.x, width), this._convert(p.y, height)));
            }
        });

        command.push(this._makeCommand(COMMANDS.PEN_UP));

        return command;
    }

    _convert(point, size) {
        return point / size;
    }
}

export default JetPlotShape;