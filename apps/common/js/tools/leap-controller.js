import Leap from 'leapjs';

const controller = new Leap.Controller({
  background: true,
  frameEventName: 'animationFrame',
  optimizeHMD: false
});
controller.connect();

controller.on('connect', function () {
  console.log('Leap controller service connected.');
});

export default controller;
