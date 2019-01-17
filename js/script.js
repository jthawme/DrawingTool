import JetPlot from './JetPlot.js';

function setDimensions(canvas, width, height) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
}

const canvas = document.querySelector('canvas');
setDimensions(canvas, 640, 480);

const plotter = new JetPlot(canvas, { debug: false });
// plotter.circle(320, 240, 150, 100).stroke();
plotter.circle(320, 240, 150, 100).fill();
plotter.circle(100, 100, 50, 100).fill(5);