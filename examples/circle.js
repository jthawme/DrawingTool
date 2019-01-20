import JetPlot from '../js/JetPlot.js';

const canvas = document.querySelector('canvas');

const WIDTH = 640;
const HEIGHT = 480;

const plotter = new JetPlot(canvas, { debug: false });
plotter.setDimensions(WIDTH, HEIGHT);

for (let i = 0; i < 40; i++) {
    plotter.circle(320, 240, (i * 10) + 5, (i * 2) + 4).color(`rgb(${(i * 10) + 10}, 0, 255)`).stroke();
}

plotter.draw();