import JetPlotSVG from './JetPlotSVG.js';

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
        this._history = [];

        this._resolveChain = null;
        this._promise = new Promise((resolve, reject) => {
            this._resolveChain = resolve;
        });

        this.svgCom = new JetPlotSVG();
    }

    _getBounds(_pathPoints = false) {
        const points = _pathPoints ? _pathPoints : this._pathPoints;

        const x = points.map(p => p.x).sort();
        const y = points.map(p => p.y).sort();

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

    addCoords(x, y, returnPromise = false) {
        let _x = x;
        let _y = y;

        this._addHistory('addCoords', [ x, y, returnPromise ]);

        this._promise = this._promise.then(() => {
            this._pathPoints.push({ x:_x, y:_y });
        });
    }

    translate(x, y) {
        this._addHistory('translate', [ x, y ]);

        this._promise = this._promise.then(() => {
            this._pathPoints = this._pathPoints.map(p => {
                return {
                    x: p.x + x,
                    y: p.y + y,
                };
            });
        });
    }

    scale(xFactor, yFactor) {
        this._addHistory('scale', [ xFactor, yFactor ]);

        this._promise = this._promise.then(() => {
            const { width, height, centre, topLeft, bottomRight } = this._getBounds();
    
            const widthIncrease = (width * xFactor) - width;
            const heightIncrease = (height * yFactor) - height;

            this._pathPoints = this._pathPoints.map(p => {
                return {
                    x: (((p.x - topLeft.x) * xFactor) + topLeft.x) - (widthIncrease / 2),
                    y: (((p.y - topLeft.y) * yFactor) + topLeft.y) - (heightIncrease / 2),
                };
            });
        });
    }

    loadSvg(filePath) {
        this._addHistory('loadSvg', [ filePath ]);

        this._promise = this._promise.then(() => {
            return this.svgCom.parse(filePath)
                .then(shapes => {
                    this._bootload(shapes.flat());
                    return true;
                });
        });
    }

    useState({ type, history, info }) {
        this.setType(type);
        this.setInfo(info);
        this._buildFromHistory(history);

        return this;
    }

    saveState() {
        return {
            type: this.type,
            history: this._history,
            info: Object.assign({}, this.info)
        };
    }

    _bootload(pathPoints) {
        pathPoints.map((p, index) => {
            this._pathPoints.push(p);
        });
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
        this._promise = this._promise.then(() => this._pathPoints);
        this._resolveChain();
    }

    draw(canvas, ctx) {
        this._promise = this._promise.then(() => {
            if (this.type === SHAPE_TYPE.DOTS) {
                return this._getDots(this._pathPoints, canvas, ctx)
                    .then(dotPoints => this._drawDots(dotPoints, ctx))
                    .then(() => this._pathPoints);
            } else if (this.type === SHAPE_TYPE.LINES) {
                return this._drawLines(this._pathPoints, ctx)
                    .then(() => this._pathPoints);
            } else {
                return false;
            }
        });

        this.generate();
        return this._promise;
    }

    _getDots(pathPoints, canvas, ctx, optimise = 1) {
        return new Promise((resolve, reject) => {
            const { fillDensity } = this.info;

            const dpr = window.devicePixelRatio;
            const { topLeft, bottomRight} = this._getBounds(pathPoints);
            const path = this._getPath(pathPoints);
            const shape = [];

            let counterX = 0;
            let counterY = 0;
    
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
            window.testPaths = points;
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

    _addHistory(command, data) {
        this._history.push({
            command,
            data
        });
    }

    _buildFromHistory(history) {
        history.forEach(h => {
            this[h.command].apply(this, h.data);
        });
    }
}

export default JetPlotShape;