import JetPlot from '../js/JetPlot.js';

const canvas = document.querySelector('canvas');

const WIDTH = 640;
const HEIGHT = 480;
const SIZE = 150;

const plotter = new JetPlot(canvas, { debug: false });
plotter.setDimensions(WIDTH, HEIGHT);

for (let i = 0; i < 10; i++) {
    plotter.arc(320, 100, 50, Math.PI, 5)
        .translate(0, i * 30)
        .scale(1 + (i / 10), 1)
        .color(`rgb(${(i * 15) + 10}, 255, 100)`).stroke();
}

plotter.draw();