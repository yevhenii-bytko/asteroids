// GLOBAL VARIABLES
let canvas, ctx;
let rocketShip;

// CONSTANTS
const FPS = 30;
const FRAME_INTERVAL = 1000 / FPS;
const BASE_SIZE = 30;

const ROCKET_SHIP_INITIAL_ANGLE = 90;
const ROCKET_SHIP_TURN_ANGLE = 360;
const THRUST_FORCE = 5;
const FRICTION = 0.5;

// DATA STRUCTURES
function RocketShip(shape, rotation, thrust) {
    this.shape = shape;
    this.rotation = rotation;
    this.thrust = thrust;
}

function Shape(point, radius) {
    this.point = point;
    this.radius = radius;
}

function Point(x, y) {
    this.x = x;
    this.y = y;
}

function Rotation(angle, increment = 0) {
    this.angle = angle;
    this.increment = increment;
}

function Thrust(point) {
    this.point = point;
    this.isThrustung = false;
}

// ENTRY POINT
window.onload = function () {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    document.addEventListener('keydown', keyDown);
    document.addEventListener('keyup', keyUp);

    startNewGame();
    setInterval(update, FRAME_INTERVAL);
}

function startNewGame() {
    initRocketShipBaseInstance();
}

function update() {
    // draw space background;
    drawSpaceBg();
    updateRocketShipPhysicsAndRender();
}

// KEY-LISTENERS
function keyDown(e) {
    switch (e.keyCode) {
        case 37:    // left arrow (rotate ship left)
            turnRocketShipLeft();
            break;
        case 38:    // up arrow (thrust ship forwards)
            enableRocketShipThrust();
            break;
        case 39:    // right arrow (rotate ship right)
            turnRocketShipRight();
            break;
    }
}

function keyUp(e) {
    switch (e.keyCode) {
        case 37:    // left arrow (stop rotating left)
        case 39:    // right arrow (stop rotating right)
            resetRocketShipRotationIncrement();
            break;
        case 38:    // up arrow (stop thrusting forwards)
            disableRocketShipThrust();
            break;
    }
}

// LOGIC FUNCTIONS
function initRocketShipBaseInstance() {
    rocketShip = new RocketShip(
        new Shape(
            new Point(canvas.width / 2, canvas.height / 2),
            BASE_SIZE / 2,
        ),
        new Rotation(convertToRadians(ROCKET_SHIP_INITIAL_ANGLE)),
        new Thrust(new Point(0, 0))
    );
}

function updateRocketShipPhysicsAndRender() {
    handleRocketShipPosition();
    if (isRocketShipThrust()) {
        drawThrustTriangles(rocketShip);
    }
    drawRocketShipTriangle(rocketShip);
}

function handleRocketShipPosition() {
    rotateRocketShip();
    moveRocketShip();
    thrustRocketShip();
    handleEdgeOfScreen(rocketShip.shape.point);
}

function rotateRocketShip() {
    rocketShip.rotation.angle += rocketShip.rotation.increment;
}

function moveRocketShip() {
    const point = rocketShip.shape.point;
    const thrustPoint = rocketShip.thrust.point;
    point.x += thrustPoint.x;
    point.y += thrustPoint.y;
}

function thrustRocketShip() {
    let thrustPoint = rocketShip.thrust.point;
    const angle = rocketShip.rotation.angle;
    if (isRocketShipThrust()) {
        thrustPoint.x +=  THRUST_FORCE * Math.cos(angle) / FPS;
        thrustPoint.y -= THRUST_FORCE * Math.sin(angle) / FPS;
    } else {
        thrustPoint.x -= FRICTION * thrustPoint.x / FPS;
        thrustPoint.y -= FRICTION * thrustPoint.y / FPS;
    }
}

function  turnRocketShipLeft() {
    rocketShip.rotation.increment = convertToRadians(-ROCKET_SHIP_TURN_ANGLE) / FPS;
}

function  turnRocketShipRight() {
    rocketShip.rotation.increment = convertToRadians(-ROCKET_SHIP_TURN_ANGLE) / FPS;
}

function resetRocketShipRotationIncrement() {
    rocketShip.rotation.increment = 0;
}

function enableRocketShipThrust() {
    rocketShip.thrust.isThrustung = true;
}

function disableRocketShipThrust() {
    rocketShip.thrust.isThrustung = false;
}

function isRocketShipThrust() {
    return rocketShip.thrust.isThrustung;
}

// RENDER FUNCTIONS
function drawSpaceBg() {
    ctx.fillStyle = 'black';
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fill();
}

function drawRocketShipTriangle(rocketShipTriangle) {
    const point = rocketShipTriangle.shape.point;
    const radius =  rocketShipTriangle.shape.radius;
    const angle = rocketShipTriangle.rotation.angle;

    ctx.strokeStyle = 'white';
    ctx.fillStyle = 'black';
    ctx.lineWidth = BASE_SIZE / 15;
    ctx.beginPath();
    ctx.moveTo(
        point.x + 4 / 3 * radius * Math.cos(angle),
        point.y - 4 / 3 * radius * Math.sin(angle)
    );
    ctx.lineTo(
        point.x - radius * (2 / 3 * Math.cos(angle) + Math.sin(angle)),
        point.y + radius * (2 / 3 * Math.sin(angle) - Math.cos(angle))
    );
    ctx.lineTo(
        point.x - radius * (2 / 3 * Math.cos(angle) - Math.sin(angle)),
        point.y + radius * (2 / 3 * Math.sin(angle) + Math.cos(angle))
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function drawThrustTriangles(rocketShip) {
    const rocketShipPoint = rocketShip.shape.point;
    const rocketShipAngle = rocketShip.rotation.angle
    const rocketShipRadius = rocketShip.shape.radius;
    ctx.fillStyle = 'red';
    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = BASE_SIZE / 8;
    ctx.beginPath();
    ctx.moveTo(
        rocketShipPoint.x - rocketShipRadius * (2 / 3 * Math.cos(rocketShipAngle) + 0.7 * Math.sin(rocketShipAngle)),
        rocketShipPoint.y + rocketShipRadius * (2 / 3 * Math.sin(rocketShipAngle) - 0.7 * Math.cos(rocketShipAngle))
    );
    ctx.lineTo(
        rocketShipPoint.x - rocketShipRadius * 6 / 3 * Math.cos(rocketShipAngle),
        rocketShipPoint.y + rocketShipRadius * 6 / 3 * Math.sin(rocketShipAngle)
    );
    ctx.lineTo(
        rocketShipPoint.x - rocketShipRadius * (2 / 3 * Math.cos(rocketShipAngle) - 0.7 * Math.sin(rocketShipAngle)),
        rocketShipPoint.y + rocketShipRadius * (2 / 3 * Math.sin(rocketShipAngle) + 0.7 * Math.cos(rocketShipAngle))
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

// UTILS
function convertToRadians(angle) {
    return angle * Math.PI / 180;
}

function handleEdgeOfScreen(point) {
    if (point.x < 0) {
        point.x = canvas.width;
    } else if (point.x > canvas.width) {
        point.x = 0;
    }

    if (point.y < 0) {
        point.y = canvas.height;
    } else if (point.y > canvas.height) {
        point.y = 0;
    }
}
