import JetPlot from '../js/JetPlot.js';

const canvas = document.querySelector('canvas');

const WIDTH = 640;
const HEIGHT = 480;
const SIZE = 150;

const plotter = new JetPlot(canvas, { debug: false });
plotter.setDimensions(WIDTH, HEIGHT);

const rectangle = plotter.rect((WIDTH / 2) - SIZE, (HEIGHT / 2) - SIZE, SIZE, SIZE).save();

plotter.use(rectangle).color('cyan').stroke();
plotter.use(rectangle).translate(SIZE, SIZE).color('magenta').fill();

plotter.draw();