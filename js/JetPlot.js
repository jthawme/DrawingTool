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
        this.strokeColor = 'red';
        this.fillColor = 'black';

        this.debug = debug;
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

    dotGrid(path, density = 4) {
        let counterX = 0;
        let counterY = 0;
        const dpr = window.devicePixelRatio;

        for (let y = 0; y < this.canvas.height; y += 2) {
            for (let x = 0; x < this.canvas.width; x += 2) {
                if (counterX % density === 0 && counterY % density === 0) {
                    if (this.ctx.isPointInPath(path, x, y)) {
                        this.ctx.beginPath();
                        this.ctx.arc(x / dpr, y / dpr, 1, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                }

                counterX++;
            }

            counterX = 0;
            counterY++;
        }
    }
}

export default JetPlot;