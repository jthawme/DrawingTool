import JetPlot from './JetPlot.js';

const canvas = document.querySelector('canvas');

const WIDTH = 640;
const HEIGHT = 480;

const plotter = new JetPlot(canvas, { debug: false });
plotter.setDimensions(WIDTH, HEIGHT);

plotter.circle(320, 240, 50, 4).color('green').stroke();

const dip = plotter.arc(320, 240, 50, Math.PI, 4).save();

plotter.use(dip).color('blue').translate(0, 40).scale(1.5, 1).stroke();
plotter.use(dip).color('red').translate(0, 80).scale(2, 1).stroke();
plotter.use(dip).color('purple').translate(0, 120).scale(2.5, 1).stroke();

const curve = plotter.path()
    .moveTo(50, 50)
    .cubicBezierTo(150, 50, 50, 150, 150, 150)
    .save();

plotter.use(curve)
    .color('blue')
    .fill();

plotter.use(curve)
    .color('orange')
    .stroke();

const pac = plotter
    .arc(500, 100, 50, Math.PI * 1.5, 50, 270)
    .lineTo(500, 100)
    .lineTo(500, 50)
    .save();

plotter.use(pac).color('cyan').fill(6);
plotter.use(pac).scale(1.3, 1.3).color('pink').stroke();

plotter.draw();