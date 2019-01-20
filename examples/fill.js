import JetPlot from '../js/JetPlot.js';

const canvas = document.querySelector('canvas');

const WIDTH = 640;
const HEIGHT = 480;
const SIZE = 50;

const plotter = new JetPlot(canvas, { debug: false });
plotter.setDimensions(WIDTH, HEIGHT);

for (let i = 0; i < 5; i++) {
    plotter.rect((i * SIZE) + 200, (i * SIZE) + 120, SIZE, SIZE).fill(i + 4);
}

plotter.draw();