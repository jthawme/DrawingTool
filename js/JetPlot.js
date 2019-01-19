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

    circle(cx, cy, radius, segments = 50) {
        this._checkPrevious();

        const angleSegment = (Math.PI * 2) / segments;
        const path = [];
        
        for (let i = 0; i < segments; i++) {
            const x = cx + (Math.cos(angleSegment * i) * radius);
            const y = cy + (Math.sin(angleSegment * i) * radius);

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
        this.lineTo(first.x, first.y);

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

    fill(density = 4) {
        this._protect();

        const shape = this.dotGrid(this._shape.getPath(), density);

        this._pushShape(shape);
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

    dotGrid(path, density = 5, optimise = 1) {
        let counterX = 0;
        let counterY = 0;
        const dpr = window.devicePixelRatio;
        const shape = new JetPlotShape(SHAPE_TYPE.DOTS);

        for (let y = 0; y < this.canvas.height; y += optimise) {
            for (let x = 0; x < this.canvas.width; x += optimise) {
                if (counterX % density === 0 && counterY % density === 0) {
                    if (this.ctx.isPointInPath(path, x, y)) {
                        shape.addCoords(x / 2, y / 2);
                    }
                }

                counterX += optimise;
            }

            counterX = 0;
            counterY += optimise;
        }

        return shape;
    }

    draw() {
        this._shapes.forEach(s => {
            s.draw(this.ctx);
        });
    }
}

export default JetPlot;