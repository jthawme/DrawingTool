import JetPlot from '../js/JetPlot.js';
import JetPlotRunner from '../js/JetPlotRunner.js';

const canvas = document.querySelector('canvas');

const WIDTH = 640;
const HEIGHT = 480;

const plotter = new JetPlot(canvas, { debug: false });
plotter.setDimensions(WIDTH, HEIGHT);

plotter.circle(WIDTH / 2, HEIGHT / 2, 50, 10).stroke()
plotter.path()
    .moveTo(100, 100)
    .cubicBezierTo(250, 100, 150, 250, 350, 350, 10)
    .stroke();
plotter.rect(350, 150, 25, 25).fill(10);

const commands = plotter.getCommands();
const runner = new JetPlotRunner(commands);

function logger(log) {
    const el = document.createElement('DIV');
    el.innerText = log;

    const logEl = document.querySelector('.log');
    logEl.prepend(el);
}

runner.debugMode(canvas, WIDTH, HEIGHT, logger).start();

setInterval(() => {
    runner.next();
}, 150);

logger(`${commands.length} commands`);