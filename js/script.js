import JetPlot from './JetPlot.js';

const canvas = document.querySelector('canvas');

const WIDTH = 640;
const HEIGHT = 480;

const plotter = new JetPlot(canvas, { debug: false });
plotter.setDimensions(WIDTH, HEIGHT);

plotter.circle(320, 240, 10, 100).color('black').fill(10);
plotter.circle(320, 240, 50, 4).color('green').stroke();
plotter.circle(320, 240, 80, 6).color('red').stroke();
plotter.circle(320, 240, 110, 8).color('blue').stroke();
plotter.circle(320, 240, 140, 10).color('orange').stroke();
plotter.circle(320, 240, 170, 12).color('purple').stroke();

plotter.draw();