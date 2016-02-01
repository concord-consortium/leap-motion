import Leap from 'leapjs';

let controller = new Leap.Controller({
  background: true
});
controller.connect();

controller.on('connect', function () {
  console.log('Leap controller connected.');
});

export default controller;
