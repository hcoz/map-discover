const axios = require('axios');
const fs = require('fs');

const NO_DIRECTION = 1;
const NO_CHARGE = 2;

const map = [];
const discoverQueue = [];

var logger = fs.createWriteStream('mapdata.txt', { flags: 'a' });

// custom array method to check the discovery queue
Array.prototype.inArray = function (arr) {
  for (let i in this) {
    if (this[i][0] === arr[0] && this[i][1] === arr[1])
      return true;
  }

  return false;
};

// land a new drone
async function getDrone() {
  try {
    return await axios.get('http://40.121.62.182:3000/getDrone/haldsfiou');
  } catch (error) {
    console.error(error);
    return null;
  }
}

// move the drone 
async function moveDrone(direction, data) {
  if (data && data[direction]) {
    try {
      return await axios.get('http://40.121.62.182:3000/moveDrone/haldsfiou/' + data[direction]);
    } catch (error) {
      console.error(error);
      return NO_CHARGE;
    }
  } else {
    return NO_DIRECTION;
  }
}

// discover possible next directions and add to discovery queue
function discoverNeighbours(coordinate) {
  let x = coordinate[0],
    y = coordinate[1];
  let newPoints = [
    [x, y + 1],
    [x + 1, y + 1],
    [x + 1, y],
    [x + 1, y - 1],
    [x, y - 1],
    [x - 1, y - 1],
    [x - 1, y],
    [x - 1, y + 1]
  ];

  for (let i in newPoints) {
    if (!discoverQueue.inArray(newPoints[i]) && newPoints[i][0] <= 2000 && newPoints[i][1] <= 2000)
      discoverQueue.push(newPoints[i]);
  }
}

// detect the movement direction from coordinates
function getDirection(currentPoint, nextPoint) {
  let direction = '';

  if (nextPoint[1] > currentPoint[1])
    direction = 'n';
  else if (nextPoint[1] < currentPoint[1])
    direction = 's';

  if (nextPoint[0] > currentPoint[0])
    direction += 'e';
  else if (nextPoint[0] < currentPoint[0])
    direction += 'w';

  return direction;
}

// send new drone to first point in the discovery queue
async function sendDrone(target) {
  let start = [0, 0];
  let x = Math.abs(target[0]);
  let y = Math.abs(target[1]);
  let steps = x > y ? x : y;
  let getResult = await getDrone();

  for (let i = 0; i < steps; i++) {
    let direction = getDirection(start, target);
    getResult = await moveDrone(direction, getResult.data);
    // update start node
    if (direction.indexOf('n') > -1)
      start[0]++;
    if (direction.indexOf('s') > -1)
      start[0]--;
    if (direction.indexOf('e') > -1)
      start[1]++;
    if (direction.indexOf('w') > -1)
      start[1]--;
  }

  return getResult;
}

// run the discover logic
(async () => {
  let currentPoint = [0, 0],
    nextPoint,
    i = 0;
  let getResult = await getDrone();
  // initial point is discovered
  if (getResult.data) {
    map.push({
      color: getResult.data.color,
      coordinate: [0, 0]
    });
  }

  discoverNeighbours(currentPoint);

  while (discoverQueue[i]) {
    nextPoint = discoverQueue[i];
    let direction = getDirection(currentPoint, nextPoint);
    getResult = await moveDrone(direction, getResult.data);

    if (getResult && getResult.data) {
      currentPoint = nextPoint; // moved successfully

      let discoveredPoint = {
        color: getResult.data.color,
        coordinate: currentPoint
      };
      map.push(discoveredPoint);

      discoverQueue.shift(); // remove the discovered point
      logger.write(JSON.stringify(discoveredPoint) + ',');
      discoverNeighbours(currentPoint); // add new points to the queue
    } else if (getResult === NO_CHARGE) {
      console.error('no charge');
      getResult = await sendDrone(currentPoint); // send new drone to the last point 
    } else if (getResult === NO_DIRECTION) {
      console.error('no direction');
      discoverQueue.shift(); // remove from the discovery queue because there is no such a location
    }

    console.log(discoverQueue[i]);
  }
  logger.end();

  return map;
})();
