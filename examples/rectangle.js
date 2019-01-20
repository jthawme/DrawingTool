import JetPlot from '../js/JetPlot.js';

const canvas = document.querySelector('canvas');

const WIDTH = 640;
const HEIGHT = 480;

const plotter = new JetPlot(canvas, { debug: false });
plotter.setDimensions(WIDTH, HEIGHT);

for (let i = 0; i <= 40; i++) {
    let perc = i / 40;
    plotter.rect(0, 0, perc * WIDTH, perc * HEIGHT).color(`rgb(0, ${(i * 10) + 10}, 255)`).stroke();
}

plotter.draw();