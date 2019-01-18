import JetPlot from './JetPlot.js';

const canvas = document.querySelector('canvas');

const WIDTH = 640;
const HEIGHT = 480;

const plotter = new JetPlot(canvas, { debug: false });
plotter.setDimensions(640, 480);

plotter.circle(320, 240, 150).fill(10);

plotter.circle(100, 100, 50).fill(10);
plotter.circle(100, 100, 50).stroke();

plotter.rect(120, 300, 50, 100).fill(20);
plotter.rect(380, 20, 220, 10).stroke();