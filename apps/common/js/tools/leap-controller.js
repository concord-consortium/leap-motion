import Leap from 'leapjs';

const controller = new Leap.Controller({
  background: true,
  frameEventName: 'animationFrame'
});
controller.connect();

controller.on('connect', function () {
  console.log('Leap controller connected.');
});

export default controller;
