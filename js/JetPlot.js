import JetPlotShape, { SHAPE_TYPE } from './JetPlotShape.js';

const dotShape = (ctx, x, y, size = 'big') => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, size === 'big' ? 5 : 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'black';
    ctx.globalAlpha = 0.5;
    if (size === 'big') {
        ctx.stroke();
    } else {
        ctx.fill();
    }
    ctx.restore();

    if (size === 'big') {
        dotShape(ctx, x, y, 'small');
    }
}

class JetPlot {
    constructor(canvas, { debug = true } = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        this._shapes = [];

        this.debug = debug;
    }

    setDimensions(width, height) {
        const dpr = window.devicePixelRatio;

        this.width = width;
        this.height = height;
    
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.ctx.scale(dpr, dpr);
    }

    _checkPrevious() {
        if (this._shape) {
            console.warn('There was a previous path that wasn\'t finished');
        }
    }

    _protect() {
        if (!this._shape) {
            throw new Error('No shape/path set');
        }
    }

    _reset() {
        this._shape = false;
    }

    circle(cx, cy, radius, segments = 50, startingAngle = 0) {
        return this.arc(cx, cy, radius, (Math.PI * 2), segments, startingAngle);
    }

    arc(cx, cy, radius, angle, segments = 50, startingAngle = 0) {
        this._checkPrevious();

        const angleSegment = angle / segments;
        const angleOffset = startingAngle ? (Math.PI * 2) * ((startingAngle % 360) / 360) : 0;
        const path = [];
        
        for (let i = 0; i <= segments; i++) {
            const x = cx + (Math.cos(angleOffset + (angleSegment * i)) * radius);
            const y = cy + (Math.sin(angleOffset + (angleSegment * i)) * radius);

            path.push({ x, y });

            if (this.debug) {
                dotShape(this.ctx, x, y);
            }
        }

        this._connectPath(path);

        return this;
    }

    rect(tlx, tly, width, height) {
        this._checkPrevious();

        const path = [
            { x: tlx, y: tly },
            { x: tlx + width, y: tly },
            { x: tlx + width, y: tly + height },
            { x: tlx, y: tly + height },
        ];

        if (this.debug) {
            path.forEach(p => {
                dotShape(this.ctx, p.x, p.y);
            });
        }

        path.push({ x: path[0].x, y: path[0].y });

        this._connectPath(path);

        return this;
    }

    path() {
        this._shape = new JetPlotShape();
        return this;
    }

    moveTo(x, y) {
        this._protect();

        if (this.debug) {
            dotShape(this.ctx, x, y);
        }

        this._shape.addCoords(x, y);

        return this;
    }

    lineTo(x, y) {
        this._protect();

        if (this.debug) {
            dotShape(this.ctx, x, y);
        }

        this._shape.addCoords(x, y);

        return this;
    }

    cubicBezierTo(cp1x, cp1y, cp2x, cp2y, p2x, p2y, segments = 50) {
        this._protect();

        const angleSegment = 1 / segments;

        const p1 = this._shape.getLastPoint() || { x: 0, y: 0 };

        if (this.debug) {
            dotShape(this.ctx, cp1x, cp1y);
            dotShape(this.ctx, cp2x, cp2y);
            dotShape(this.ctx, p2x, p2y);
        }
        
        for (let i = 1; i < segments; i++) {
            const t = angleSegment * i;
            
            const { x, y } = this._getPointOnCubicBezier(
                t,
                p1,
                { x: cp1x, y: cp1y },
                { x: cp2x, y: cp2y },
                { x: p2x, y: p2y },
            );

            this.lineTo(x, y);

            if (this.debug) {
                dotShape(this.ctx, x, y);
            }
        }

        this.lineTo(p2x, p2y);

        return this;
    }

    // https://stackoverflow.com/a/31506960
    _getPointOnCubicBezier(t, p0, p1, p2, p3) {
        const ret = {};
        const coords = ['x', 'y'];

        coords.forEach(k => {
            ret[k] = Math.pow(1 - t, 3) * p0[k] + 3 * Math.pow(1 - t, 2) * t * p1[k] + 3 * (1 - t) * Math.pow(t, 2) * p2[k] + Math.pow(t, 3) * p3[k];
        });

        return ret;
    }

    quadraticBezierTo(cp1x, cp1y, p2x, p2y, segments = 50) {
        this._protect();

        const angleSegment = 1 / segments;

        const p1 = this._shape.getLastPoint() || { x: 0, y: 0 };

        if (this.debug) {
            dotShape(this.ctx, cp1x, cp1y);
            dotShape(this.ctx, p2x, p2y);
        }
        
        for (let i = 1; i < segments; i++) {
            const t = angleSegment * i;
            
            const { x, y } = this._getPointOnQuadraticBezier(
                t,
                p1,
                { x: cp1x, y: cp1y },
                { x: p2x, y: p2y },
            );

            this.lineTo(x, y);

            if (this.debug) {
                dotShape(this.ctx, x, y);
            }
        }

        this.lineTo(p2x, p2y);

        return this;
    }

    // https://stackoverflow.com/a/5634528
    _getPointOnQuadraticBezier(t, p0, p1, p2) {
        let invT = 1 - t;
        return {
            x: invT * invT * p0.x + 2 * invT * t * p1.x + t * t * p2.x,
            y: invT * invT * p0.y + 2 * invT * t * p1.y + t * t * p2.y
        };
    }

    translate(x, y) {
        this._protect();

        this._shape.translate(x, y);

        return this;
    }

    scale(xFactor, yFactor) {
        this._protect();

        this._shape.scale(xFactor, yFactor);

        return this;
    }

    color(color) {
        this._shape.setColor(color);
        return this;
    }

    close() {
        this._protect();

        const { x, y } = this._shape.getPointAt(0);
        this._shape.addCoords(x, y);

        return this;
    }

    loadSvg(filePath) {
        this.path();
        this._shape.loadSvg(filePath)

        return this;
    }

    _connectPath(path) {
        this.path();
        const first = path[0];
        const last = path[path.length - 1];

        this.moveTo(first.x, first.y);
        path.forEach(({x: _x, y: _y}, index) => {
            if (index > 0) {
                this.lineTo(_x, _y);
            }
        });

        return this;
    }

    save() {
        return this._shape.saveState();
    }

    use(shapeObj) {
        this.path();
        this._shape.useState(shapeObj);
        return this;
    }

    stroke() {
        this._protect();
        this._pushShape(this._shape);
        this._reset();

        return this;
    }

    fill(density = 10) {
        this._protect();
        
        this._shape.setType(SHAPE_TYPE.DOTS);
        this._shape.setInfo({ fillDensity: density });

        this._pushShape(this._shape);
        this._reset();

        return this;
    }

    /**
     * Pushes the shape to the master
     * 
     * @param {Object<JetPlotShape>} shape Shape object
     */
    _pushShape(shape) {
        this._shapes.push(shape);
    }

    draw() {
        return Promise.all(
            this._shapes.map(s => {
                return s.draw(this.canvas, this.ctx);
            })
        );
    }

    getCommands() {
        const all = this._shapes.map(s => {
            return s.getCommand(this.width, this.height);
        }).flat();

        return {
            commands: all,
            layers: all.reduce((acc, currCal) => {
                if (!acc[currCal.color]) {
                    acc[currCal.color] = [];
                }

                acc[currCal.color].push(currCal);
                return acc;
            }, {})
        }
    }
}

export default JetPlot;