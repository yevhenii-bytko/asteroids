let canvas, ctx;

let ship, roids;

const FPS = 30; // frames per sec
const FRICTION = 0.7;   // friction coefficient of space (0 = no friction, 1 = lots of friction)
const SHIP_SIZE = 30;   // ship height in pixels
const SHIP_THRUST = 5; // acceleration ship in sec
const TURN_SPEED = 360; // turn degrees per second
const ROIDS_NUM = 3;    // starting number of asteroids
const ROIDS_SIZE = 100;  // start asteroid height in pixels
const ROIDS_SPD = 10;    // max stating asteroid speed in pixels per sec
const ROIDS_VERT = 10;  // number of vertices on each asteroid
const ROIDS_JAG = 0.4;  // jaggedness of each asteroid


window.onload = function () {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    // set up spaceship object
    ship = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        r: SHIP_SIZE / 2,
        a: 90 / 180 * Math.PI,  // convert to radians
        rot: 0,
        thrusting: false,
        thrust: {
            x: 0,
            y: 0,
        }
    }

    // set up asteroids
    roids = [];
    createAsteroidBelt()

    document.addEventListener('keydown', keyDown);
    document.addEventListener('keyup', keyUp);

    setInterval(update, 1000/ FPS)
}

function keyDown(e) {
    switch (e.keyCode) {
        case 37:    // left arrow (rotate ship left)
            ship.rot = TURN_SPEED / 180 * Math.PI / FPS;
            break;
        case 38:    // up arrow (thrust ship forwards)
            ship.thrusting = true;
            break;
        case 39:    // right arrow (rotate ship right)
            ship.rot = -TURN_SPEED / 180 * Math.PI / FPS;
            break;
    }
}

function keyUp(e) {
    switch (e.keyCode) {
        case 37:    // left arrow (stop rotating left)
            ship.rot = 0;
            break;
        case 38:    // up arrow (thrust ship forwards)
            ship.thrusting = false;
            break;
        case 39:    // right arrow (stop rotating right)
            ship.rot = 0;
            break;
    }
}

function update() {
    // draw space
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // thrust ship
    if (ship.thrusting) {
        ship.thrust.x += SHIP_THRUST * Math.cos(ship.a) / FPS;
        ship.thrust.y -= SHIP_THRUST * Math.sin(ship.a) / FPS;

        // draw thruster
        ctx.fillStyle = 'red';
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = SHIP_SIZE / 10;
        ctx.beginPath();
        ctx.moveTo(
            ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)),
            ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - 0.5 * Math.cos(ship.a))
        );
        ctx.lineTo(
            ship.x - ship.r * 6 / 3 * Math.cos(ship.a),
            ship.y + ship.r * 6 / 3 * Math.sin(ship.a)
        );
        ctx.lineTo(
            ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)),
            ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + 0.5 * Math.cos(ship.a))
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

    } else {
        ship.thrust.x -= FRICTION * ship.thrust.x / FPS;
        ship.thrust.y -= FRICTION * ship.thrust.y / FPS;
    }


    // draw asteroids
    ctx.strokeStyle = 'slategrey';
    ctx.lineWidth = SHIP_SIZE / 20;
    let x, y, r, a, vert, offs;
    for (let i = 0; i < roids.length; i++) {
        // get asteroid properties
        x = roids[i].x;
        y = roids[i].y;
        r = roids[i].r;
        a = roids[i].a;
        vert = roids[i].vert;
        offs = roids[i].offs;

        // draw path
        ctx.beginPath();
        ctx.moveTo(
            x + r * offs[0] * Math.cos(a),
            y + r * offs[0] * Math.sin(a)
        );
        // draw the polygon
        for (let j = 0; j < vert; j++) {
            ctx.lineTo(
                x + r * offs[j] * Math.cos(a + j * 2 * Math.PI / vert),
                y + r * offs[j] * Math.sin(a + j * 2 * Math.PI / vert)
            );
        }
        ctx.closePath();
        ctx.stroke();


        // move the asteroid
        roids[i].x += roids[i].xv;
        roids[i].y += roids[i].yv;

        // handle edge of screen
        if (roids[i].x < 0 - roids[i].r) {
            roids[i].x = canvas.width + roids[i].r;
        } else if ( roids[i].x > canvas.width + roids[i].r) {
            roids[i].x = 0 - roids[i].r;
        } else if (roids[i].y < 0 - roids[i].r) {
            roids[i].y = canvas.width + roids[i].r;
        } else if ( roids[i].y > canvas.width + roids[i].r) {
            roids[i].y = 0 - roids[i].r;
        }
    }

    // draw ship
    ctx.strokeStyle = 'white';
    ctx.lineWidth = SHIP_SIZE / 20;
    ctx.beginPath();
    ctx.moveTo(
        ship.x + 4 / 3 * ship.r * Math.cos(ship.a),
        ship.y - 4 / 3 * ship.r * Math.sin(ship.a)
    );
    ctx.lineTo(
        ship.x - ship.r * (2 / 3 * Math.cos(ship.a) + Math.sin(ship.a)),
        ship.y + ship.r * (2 / 3 * Math.sin(ship.a) - Math.cos(ship.a))
    );
    ctx.lineTo(
        ship.x - ship.r * (2 / 3 * Math.cos(ship.a) - Math.sin(ship.a)),
        ship.y + ship.r * (2 / 3 * Math.sin(ship.a) + Math.cos(ship.a))
    );
    ctx.closePath();
    ctx.stroke();

    // rotate ship
    ship.a += ship.rot;

    // move ship
    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;


    // handle edge of screen
    if (ship.x < 0 - ship.r) {
        ship.x = canvas.width + ship.r;
    } else if (ship.x > canvas.width + ship.r) {
        ship.x = 0 - ship.r;
    }

    if (ship.y < 0 - ship.r) {
        ship.y = canvas.width + ship.r;
    } else if (ship.x > canvas.width + ship.r) {
        ship.y = 0 - ship.r;
    }

    // centre dot
    ctx.fillStyle = 'red';
    ctx.fillRect(ship.x - 1, ship.y - 1, 2, 2);
}

function createAsteroidBelt() {
    roids = [];
    for (let i = 0; i < ROIDS_NUM; i++) {
        let x, y;
        do {
            x = Math.floor(Math.random() * canvas.width);
            y = Math.floor(Math.random() * canvas.height);
        } while (distBetweenPoints(x, y, ship.x, ship.y) < ROIDS_SIZE * 2 + ship.r)
        roids.push(newAsteroid(x, y));
    }
}

function newAsteroid(x, y) {
    let roid = {
        x,
        y,
        xv: Math.random() * ROIDS_SPD / FPS * (Math.random() < 0.5 ? 1 : -1),
        yv: Math.random() * ROIDS_SPD / FPS * (Math.random() < 0.5 ? 1 : -1),
        r: ROIDS_SIZE / 2,
        a: Math.random() * Math.PI * 2,  // in radians
        vert: Math.floor(Math.random() * (ROIDS_VERT + 1) + ROIDS_VERT / 2),
        offs: [],
    }
    for (let i = 0; i < roid.vert; i++) {
        roid.offs.push(Math.random() * ROIDS_JAG * 2 + 1 - ROIDS_JAG);
    }
    return roid;
}

function distBetweenPoints(x1, y1, x2, y2) {
    return Math.floor(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)));
}
