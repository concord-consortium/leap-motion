import Leap from 'leapjs';
import {rollingAvg} from '../tools/avg';

const RUNNING_AVG_LEN = 60;

let prevTime = null;
let avgFps = 0;

Leap.loop(function () {
  let time = Date.now();
  if (prevTime) {
    let currentFps = 1000 / (time - prevTime);
    avgFps = rollingAvg(currentFps, avgFps, RUNNING_AVG_LEN);
  }
  prevTime = time;
});

export default function leapFps() {
  return avgFps;
}
