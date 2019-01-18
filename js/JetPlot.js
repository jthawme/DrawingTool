const dotShape = (ctx, x, y, size = 'big') => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, size === 'big' ? 5 : 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'black';
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
        this.strokeColor = 'black';
        this.fillColor = 'black';

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

    newPath() {
        this.currPath = new Path2D();
    }

    circle(cx, cy, radius, segments = 50) {
        if (!this.currPath) {
            this.newPath();
        }

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
        if (!this.currPath) {
            this.newPath();
        }
        
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

    _connectPath(path) {
        const first = path[0];
        const last = path[path.length - 1];

        this.currPath.moveTo(first.x, first.y);
        path.forEach(({x: _x, y: _y}, index) => {
            if (index > 0) {
                this.currPath.lineTo(_x, _y);
            }
        });
        this.currPath.lineTo(first.x, first.y);

        return this;
    }

    stroke() {
        if (!this.currPath) {
            console.error('No current path to stroke');
            return this;
        }

        this.ctx.save();
        this.ctx.strokeStyle = this.strokeColor;
        this.ctx.stroke(this.currPath);
        this.ctx.restore();

        this.currPath = false;

        return this;
    }

    fill(density = 4) {
        if (!this.currPath) {
            console.error('No current path to fill');
            return this;
        }

        this.ctx.save();
        this.ctx.strokeStyle = this.fillColor;

        this.dotGrid(this.currPath, density);

        this.ctx.restore();

        this.currPath = false;

        return this;
    }

    dotGrid(path, density = 5, optimise = 2) {
        let counterX = 0;
        let counterY = 0;
        const dpr = window.devicePixelRatio;

        for (let y = 0; y < this.canvas.height; y += optimise) {
            for (let x = 0; x < this.canvas.width; x += optimise) {
                if (counterX % density === 0 && counterY % density === 0) {
                    if (this.ctx.isPointInPath(path, x, y)) {
                        this.ctx.beginPath();
                        this.ctx.arc(x / 2, y /2, 1, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                }

                counterX += optimise;
            }

            counterX = 0;
            counterY += optimise;
        }
    }
}

export default JetPlot;