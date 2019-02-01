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
    constructor() {
        this.type = SHAPE_TYPE.LINES;
        this.info = {
            color: false
        };

        this._pathPoints = [];

        this._resolveChain = null;
        this._promise = new Promise((resolve, reject) => {
            this._resolveChain = resolve;
        });
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
        let _x = x;
        let _y = y;
        this._promise.then(() => {
            this._pathPoints.push({ x:_x, y:_y });
        });
    }

    translate(x, y) {
        this._promise.then(() => {
            this._pathPoints = this._pathPoints.map(p => {
                return {
                    x: p.x + x,
                    y: p.y + y,
                };
            });
        });
    }

    scale(xFactor, yFactor) {
        const { width, height, centre, topLeft, bottomRight } = this._getBounds();

        const widthIncrease = (width * xFactor) - width;
        const heightIncrease = (height * yFactor) - height;

        this._promise(() => {
            this._pathPoints = this._pathPoints.map(p => {
                return {
                    x: (((p.x - topLeft.x) * xFactor) + topLeft.x) - (widthIncrease / 2),
                    y: (((p.y - topLeft.y) * yFactor) + topLeft.y) - (heightIncrease / 2),
                };
            });
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
            color: this.info.color
        };
    }

    _getPath(pathPoints = false) {
        const _pathPoints = pathPoints ? pathPoints : this._pathPoints;

        const path = new Path2D();
        _pathPoints.forEach((p, index) => {
            if (index === 0) {
                path.moveTo(p.x, p.y);
            } else {
                path.lineTo(p.x, p.y);
            }
        });
        return path;
    }

    setColor(color) {
        this.info.color = color;
    }

    setType(type) {
        this.type = type;
    }

    setInfo(info) {
        this.info = Object.assign({}, this.info, info);
    }

    generate() {
        this._promise.then(() => {
            console.log(this._pathPoints);
            return this._pathPoints;
        });
        this._resolveChain();
    }

    draw(canvas, ctx) {
        const p = this._promise.then(() => {
            if (this.type === SHAPE_TYPE.DOTS) {
                return this._getDots(this._pathPoints, canvas, ctx)
                    .then(dotPoints => this._drawDots(dotPoints, ctx))
                    .then(() => {
                        return this._pathPoints;
                    });
            }

            if (this.type === SHAPE_TYPE.LINES) {
                return this._drawLines(this._pathPoints, ctx)
                    .then(() => {
                        return this._pathPoints;
                    })
            }

            return false;
        });

        this.generate();

        return p;
    }

    _getDots(pathPoints, canvas, ctx, optimise = 1) {
        return new Promise((resolve, reject) => {
            const { fillDensity } = this.info;

            let counterX = 0;
            let counterY = 0;
            const dpr = window.devicePixelRatio;
            const path = this._getPath(pathPoints);
            const shape = [];
    
            for (let y = 0; y < canvas.height; y += optimise) {
                for (let x = 0; x < canvas.width; x += optimise) {
                    if (counterX % fillDensity === 0 && counterY % fillDensity === 0) {
                        if (ctx.isPointInPath(path, x, y)) {
                            shape.push({ x: x / 2, y: y / 2 });
                        }
                    }
    
                    counterX += optimise;
                }
    
                counterX = 0;
                counterY += optimise;
            }
    
            resolve(shape);
        });
    }

    _drawDots(points, ctx) {
        return new Promise((resolve, reject) => {
            ctx.save();
            ctx.fillStyle = this.info.color || DEFAULT_FILL;
            points.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
                ctx.fill();
            });
    
            ctx.restore();

            resolve();
        });
    }

    _drawLines(points, ctx) {
        return new Promise((resolve, reject) => {
            ctx.save();
            ctx.strokeStyle = this.info.color || DEFAULT_STROKE;
            ctx.stroke(this._getPath(points));
            ctx.restore();
            resolve();
        });
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
        return { command, x, y, color: this.info.color ? this.info.color : DEFAULT_FILL };
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