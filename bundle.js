// GLOBAL VARIABLES
let canvas, ctx;
let rocketShip, asteroidsBelt, interactDetector;

// CONSTANTS
const FPS = 30;
const FRAME_INTERVAL = 1000 / FPS;
const BASE_SIZE = 30;

const ROCKET_SHIP_INITIAL_ANGLE = 90;
const ROCKET_SHIP_TURN_ANGLE = 360;
const THRUST_FORCE = 5;
const FRICTION = 0.5;

const ASTEROIDS_NUMBER = 3;
const ASTEROIDS_MIN_SPEED = 4;
const ASTEROIDS_MAX_SPEED = 40;
const ASTEROIDS_VERTICES_NUMBER = 10;
const JAGGEDNESS = 0.4

const TEST = false;
const DESTRUCT_NUMBER = 2;
const EXPLODE_DURATION = 0.3;
const BLINKER_DURATION = 0.3;
const INVISIBLE_DURATION = 3;

// DATA STRUCTURES
function RocketShip(shape, rotation, thrust) {
    this.shape = shape;
    this.rotation = rotation;
    this.thrust = thrust;
}

function Asteroid(polygon, rotation, direction) {
    this.polygon = polygon;
    this.rotation = rotation;
    this.direction = direction;
    this.offsets = [];
}

function Polygon(point, radius, verticesNumber) {
    Shape.call(this, point, radius);
    this.verticesNumber = verticesNumber;
}

Polygon.prototype = Object.create(Shape.prototype);
Polygon.prototype.constructor = Polygon;

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
    Direction.call(this, point);
    this.isThrustung = false;
}

Thrust.prototype = Object.create(Direction.prototype);
Thrust.prototype.constructor = Thrust;

function Direction(point) {
    this.point = point;
}

function InteractDetector(explosion, blinker) {
    this.explosion = explosion;
    this.blinker = blinker;
}

function Explosion(time) {
    this.time = time;
    this.isExplplode = false;
}

function Blinker(time, number) {
    this.time = time;
    this.number = number;
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
    initAsteroidsBeltInstance(ASTEROIDS_NUMBER);
    initInteractDetectorInstance();
}

function update() {
    drawSpaceBg();
    updateAsteroidsBeltPhysicsAndRender();
    updateRocketShipPhysicsAndRender();
    drawTestElements(rocketShip, asteroidsBelt);
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
    if (!isExplosionMode() && !isBlinkerOff()) {
        if (isRocketShipThrust()) {
            drawThrustTriangles(rocketShip);
        }
        drawRocketShipTriangle(rocketShip);
    } else if (isExplosionMode()) {
        drawExplosion(rocketShip);
    }
    updateModesLogic();
}

function handleRocketShipPosition() {
    rotateRocketShip();
    moveRocketShip();
    thrustRocketShip();
    handleEdgeOfScreen(rocketShip.shape.point, rocketShip.shape.radius);
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
    if (isExplosionMode()) {
        thrustPoint.x =  0;
        thrustPoint.y = 0;
    } else if (isRocketShipThrust()) {
        thrustPoint.x +=  THRUST_FORCE * Math.cos(angle) / FPS;
        thrustPoint.y -= THRUST_FORCE * Math.sin(angle) / FPS;
    } else {
        thrustPoint.x -= FRICTION * thrustPoint.x / FPS;
        thrustPoint.y -= FRICTION * thrustPoint.y / FPS;
    }
}

function turnRocketShipLeft() {
    rocketShip.rotation.increment = convertToRadians(ROCKET_SHIP_TURN_ANGLE) / FPS;
}

function turnRocketShipRight() {
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

function initAsteroidsBeltInstance(asteroidNumber) {
    asteroidsBelt = [];
    for (let i = 0; i < asteroidNumber; i++) {
        const point = getRandomPointExcludingRadiusZone(rocketShip.shape.point);
        asteroidsBelt.push(createRandomAsteroid(point, BASE_SIZE * 2));
    }
}

function createRandomAsteroid(point, radius) {
    const asteroid = new Asteroid(
        new Polygon(point, radius, getRandomVerticesNumber()),
        new Rotation(getRandomInt(0, ROCKET_SHIP_TURN_ANGLE)),
        new Direction(
            new Point(
                getRandomNumberSign(getRandomInt(ASTEROIDS_MIN_SPEED, ASTEROIDS_MAX_SPEED)),
                getRandomNumberSign(getRandomInt(ASTEROIDS_MIN_SPEED, ASTEROIDS_MAX_SPEED))
            )
        )
    );
    for (let i = 0; i < asteroid.polygon.verticesNumber; i++) {
        asteroid.offsets.push(getRandomJaggednessValue());
    }
    return asteroid;
}

function getRandomVerticesNumber() {
    return  Math.floor(Math.random() * (ASTEROIDS_VERTICES_NUMBER + 1) + ASTEROIDS_VERTICES_NUMBER / 2);
}

function getRandomJaggednessValue() {
    return Math.random() * JAGGEDNESS * 2 + 1 - JAGGEDNESS;
}

function updateAsteroidsBeltPhysicsAndRender() {
    handleAsteroidsPositions();
    drawAsteroidsBelt(asteroidsBelt);
}

function handleAsteroidsPositions() {
    moveAsteroids();
    accelerateAsteroids();
}

function moveAsteroids() {
    for (let i = 0; i < asteroidsBelt.length; i++) {
        const point = asteroidsBelt[i].polygon.point;
        const radius = asteroidsBelt[i].polygon.radius;
        const direction = asteroidsBelt[i].direction;
        point.x += direction.point.x / FPS;
        point.y += direction.point.y / FPS;
        handleEdgeOfScreen(point, radius);
    }
}

function accelerateAsteroids(accelerationNumber = 0) {
    for (let i = 0; i < asteroidsBelt.length; i++) {
        const direction = asteroidsBelt[i].direction;
        direction.point.x = direction.point.x + accelerationNumber;
        direction.point.y = direction.point.y + accelerationNumber;
    }
}

function destructAsteroid(index) {
    const prevPoint = asteroidsBelt[index].polygon.point;
    const prevRadius = asteroidsBelt[index].polygon.radius;
    for (let i = 0; i < DESTRUCT_NUMBER; i++) {
        if (prevRadius >= BASE_SIZE) {
            const point = new Point(
                prevPoint.x + getRandomNumberSign(getRandomInt(0, prevRadius)),
                prevPoint.y + getRandomNumberSign(getRandomInt(0, prevRadius)),
            );
            const radius = prevRadius / 2;
            asteroidsBelt.push(createRandomAsteroid(point, radius));
        }
    }
    asteroidsBelt.splice(index, 1);
}

function initInteractDetectorInstance() {
    interactDetector = new InteractDetector(
        new Explosion(EXPLODE_DURATION * FPS),
        new Blinker(BLINKER_DURATION * FPS, Math.ceil(INVISIBLE_DURATION / BLINKER_DURATION) )
    )
}

function updateModesLogic() {
    if (isExplosionMode()) {
        handleExplosionMode();
    } else if (isBlinkerMode()) {
        handleBlinkerMode();
    } else {
        detectRocketShipCollision();
    }
}

function detectRocketShipCollision() {
    const point = rocketShip.shape.point;
    const radius = rocketShip.shape.radius;
    const index = findCollisionAsteroidIndex(point, radius);
    if (index !== -1) {
        interactDetector.explosion.isExplplode = true;
        destructAsteroid(index);
    }
}

function findCollisionAsteroidIndex(point, radius) {
    for (let i = 0; i < asteroidsBelt.length; i++) {
        const asteroidPoint = asteroidsBelt[i].polygon.point;
        const asteroidRadius = asteroidsBelt[i].polygon.radius;
        if (getDistanceBetweenPoints(point, asteroidPoint) < radius + asteroidRadius) {
            return i;
        }
    }
    return -1;
}

function handleExplosionMode() {
    if (interactDetector.explosion.time > 0) {
        interactDetector.explosion.time--;
    } else {
        initRocketShipBaseInstance();
        initInteractDetectorInstance();
    }
}

function handleBlinkerMode() {
    interactDetector.blinker.time--;
    if (interactDetector.blinker.time === 0) {
        interactDetector.blinker.time = BLINKER_DURATION * FPS;
        interactDetector.blinker.number--;
    }
}

function isBlinkerMode() {
    return interactDetector.explosion.isExplplode === false && interactDetector.blinker.number > 0
}

function isExplosionMode() {
    return interactDetector.explosion.isExplplode === true;
}

function isBlinkerOff() {
    return interactDetector.blinker.number % 2 !== 0;
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

function drawAsteroidsBelt(asteroidsBelt) {
    for (let i = 0; i < asteroidsBelt.length; i++) {
        drawAsteroidPolygon(asteroidsBelt[i]);
    }
}

function drawAsteroidPolygon(asteroid) {
    const point = asteroid.polygon.point;
    const radius = asteroid.polygon.radius;
    const angle = asteroid.rotation.angle;
    const verticesNumber = asteroid.polygon.verticesNumber;
    const offsets = asteroid.offsets;
    ctx.strokeStyle = 'slategrey';
    ctx.lineWidth = BASE_SIZE / 20;
    ctx.beginPath();
    ctx.moveTo(
        point.x + radius * offsets[0] * Math.cos(angle),
        point.y + radius * offsets[0] * Math.sin(angle)
    );
    for (let i = 0; i < verticesNumber; i++) {
        ctx.lineTo(
            point.x + radius * offsets[i] * Math.cos(angle + i * 2 * Math.PI / verticesNumber),
            point.y + radius * offsets[i] * Math.sin(angle + i * 2 * Math.PI / verticesNumber)
        );
    }
    ctx.closePath();
    ctx.stroke();
}

function drawExplosion(rocketShip) {
    const point = rocketShip.shape.point;
    const params = [
        ['darkred', 1],
        ['red', 0.8],
        ['orange', 0.6],
        ['yellow', 0.4],
        ['white', 0.2]
    ];
    for (let i = 0; i < params.length; i++) {
        ctx.fillStyle = params[i][0];
        ctx.beginPath();
        ctx.arc(point.x, point.y, BASE_SIZE * params[i][1], 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }
}

function drawTestElements(rocketShip, asteroidsBelt) {
    if (TEST) {
        drawDot(rocketShip.shape);
        drawCircle(rocketShip.shape);
        for (let i = 0; i < asteroidsBelt.length; i++) {
            drawCircle(asteroidsBelt[i].polygon);
        }
    }
}

function drawDot(shape) {
    const point = shape.point;
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
}

function drawCircle(shape) {
    const point = shape.point;
    const radius = shape.radius;
    ctx.strokeStyle = 'green';
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.stroke();
}

// UTILS
function convertToRadians(angle) {
    return angle * Math.PI / 180;
}

function handleEdgeOfScreen(point, radius) {
    if (point.x < 0 - radius) {
        point.x = canvas.width + radius;
    } else if (point.x > canvas.width + radius) {
        point.x = 0 - radius;
    }

    if (point.y < 0 - radius) {
        point.y = canvas.height + radius;
    } else if (point.y > canvas.height + radius) {
        point.y = 0 - radius;
    }
}

function getRandomInt(min = 0, max = 100) {
    return Math.floor(Math.random() * (max - min) + min);
}

function getRandomNumberSign(number) {
    return Math.random() < 0.5 ? number : -number;
}

function getDistanceBetweenPoints(point1, point2) {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
}

function getRandomPointExcludingRadiusZone(point) {
    let finalPoint;
    do {
        finalPoint = new Point(getRandomInt(0, canvas.width + 1), getRandomInt(0, canvas.height + 1))
    } while (getDistanceBetweenPoints(point, finalPoint) < BASE_SIZE * 6);
    return finalPoint
}
