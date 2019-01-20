import JetPlot from '../js/JetPlot.js';

const canvas = document.querySelector('canvas');

const WIDTH = 640;
const HEIGHT = 480;

const plotter = new JetPlot(canvas, { debug: false });
plotter.setDimensions(WIDTH, HEIGHT);

plotter.arc(320, 240, 100, Math.PI * 1.5, 90).color('gold').stroke();

plotter.draw();