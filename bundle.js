let canvas, ctx;

let ship, roids, level, text, textAlpha, lives, score, scoreHigh;

const fxLaser = new Sound('sounds/laser.m4a', 5, 0.05);
const fxExplode = new Sound('sounds/explode.m4a', 1, 0.1);
const fxHit = new Sound('sounds/hit.m4a', 5, 0.3);
const fxThrust = new Sound('sounds/thrust.m4a', 1, 0.3);

const FPS = 30; // frames per sec
const FRICTION = 0.7;   // friction coefficient of space (0 = no friction, 1 = lots of friction)
const GAME_LIVES = 3;
const SHIP_SIZE = 30;   // ship height in pixels
const SHIP_THRUST = 5; // acceleration ship in sec
const TURN_SPEED = 360; // turn degrees per second
const SHIP_EXPLODE_DUR = 0.3;  // duration of ship explosion in seconds
const SHIP_BLINK_DUR = 0.1;  // duration of ship blinking in seconds
const SHIP_INV_DUR = 3; // duration of ship invulnerability in seconds
const ROIDS_NUM = 1;    // starting number of asteroids
const ROIDS_SIZE = 100;  // start asteroid height in pixels
const ROIDS_SPD = 30;    // max stating asteroid speed in pixels per sec
const ROIDS_VERT = 10;  // number of vertices on each asteroid
const ROIDS_JAG = 0.4;  // jaggedness of each asteroid
const ROIDS_PTS_LGE = 25;  // points scored for each asteroid
const ROIDS_PTS_MD = 50;  // points scored for each asteroid
const ROIDS_PTS_SM = 100;  // points scored for each asteroid
const LASER_MAX = 10;  // max number of lasers fired
const LASER_SPD = 500;  // speed of lasers in pixels per sec
const LASER_DIST = 0.6;  // max distance of each laser as a fraction
const LASER_EXP_DUR = 0.1; // duration of laser explosion in seconds
const TEXT_FADE_TIME = 2.5;  // duration of text fade in seconds
const TEXT_SIZE = 40;  // font size of text in pixels
const SHOW_BOUNDINGS = false;  // show or hide collision boundaries
const SHOW_CENTER_DOT = false;  // show or hide center dot
const SOUND_ON = true;
const SAVE_KEY_SCORE = 'highscore'; // key in localStorage to save high score

window.onload = function () {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    newGame();

    document.addEventListener('keydown', keyDown);
    document.addEventListener('keyup', keyUp);

    setInterval(update, 1000/ FPS)
}

function keyDown(e) {
    if (ship.dead) {
        return;
    }
    switch (e.keyCode) {
        case 32:    // space bar
            shootLaser()
            break;
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
        case 32:    // space bar
            ship.canShoot = true
            break;
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

function newGame() {
    ship = newShip();
    lives = GAME_LIVES;
    level = 0;
    score = 0;
    scoreHigh = localStorage.getItem(SAVE_KEY_SCORE) || 0;
    newLevel();
}

function gameOver() {
    ship.dead = true;
    text = "Game Over";
    textAlpha = 1.0
}

function newLevel() {
    text = "Level " + (level + 1);
    textAlpha = 1.0;
    createAsteroidBelt()
}

function update() {
    let blinkOn = ship.blinkNumber % 2 == 0;
    let exploding = ship.explodeTime > 0;

    // draw space
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // thrust ship
    if (ship.thrusting) {
        ship.thrust.x += SHIP_THRUST * Math.cos(ship.a) / FPS;
        ship.thrust.y -= SHIP_THRUST * Math.sin(ship.a) / FPS;
        fxThrust.play();

        // draw thruster
        if (!exploding && blinkOn) {
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
        }

    } else {
        ship.thrust.x -= FRICTION * ship.thrust.x / FPS;
        ship.thrust.y -= FRICTION * ship.thrust.y / FPS;
        fxThrust.stop();
    }


    if (SHOW_BOUNDINGS) {
        ctx.strokeStyle = 'lime';
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.stroke();
    }

    // draw asteroids
    let x, y, r, a, vert, offs;
    for (let i = 0; i < roids.length; i++) {
        // get asteroid properties
        x = roids[i].x;
        y = roids[i].y;
        r = roids[i].r;
        a = roids[i].a;
        vert = roids[i].vert;
        offs = roids[i].offs;

        // draw asteroid
        ctx.strokeStyle = 'slategrey';
        ctx.lineWidth = SHIP_SIZE / 20;

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

        if (SHOW_BOUNDINGS) {
            ctx.strokeStyle = 'lime';
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.stroke();
        }
    }

    // draw ship
    if (!exploding) {
        if (blinkOn && !ship.dead) {
            drawShip(ship.x, ship.y, ship.a)
        }
        if (ship.blinkNumber > 0) {
            ship.blinkTime--;
            if (ship.blinkTime === 0) {
                ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS);
                ship.blinkNumber--;
            }
        }
    } else {
        ctx.fillStyle = 'darkred';
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.r * 1.7, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.r * 1.4, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.r * 1.2, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.r * 0.8, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(ship.x, ship.y, ship.r * 0.5, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.fill();
    }

    // draw textGame
    if (textAlpha >= 0) {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(255, 255, 255, " + textAlpha + ")";
        ctx.font = "small-caps " + TEXT_SIZE + "px dejavu sans mono";
        ctx.fillText(text, canvas.width / 2, canvas.height * 0.75);
        textAlpha -= 1.0 / TEXT_FADE_TIME / FPS;
    } else if (ship.dead) {
        newGame();
    }

    // draw lives
    let lifeColour;
    for (let i = 0; i < lives; i++) {
        lifeColour = exploding && i === lives - 1 ? 'red' : 'white';
        drawShip(SHIP_SIZE + i * SHIP_SIZE * 1.2, SHIP_SIZE, 0.5 * Math.PI, lifeColour);
    }

    // draw score
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.font = TEXT_SIZE + "px dejavu sans mono";
    ctx.fillText(score, canvas.width - SHIP_SIZE / 2, SHIP_SIZE);

    // draw high score
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.font = (TEXT_SIZE * 0.75) + "px dejavu sans mono";
    ctx.fillText("BEST " + scoreHigh, canvas.width / 2, SHIP_SIZE);

    // detect laser hit on asteroid
    let ax, ay, ar, lx, ly;
    for (let i = roids.length - 1; i >= 0; i--) {
        // grab the asteroid properties
        ax = roids[i].x;
        ay = roids[i].y;
        ar = roids[i].r;

        // loop over the lasers
        for (let j = ship.lasers.length - 1; j >= 0; j--) {
            lx = ship.lasers[j].x;
            ly = ship.lasers[j].y;

            if (ship.lasers[j].explodeTime === 0 && distBetweenPoints(ax, ay, lx, ly) < ar) {
                // remove the asteroid
                destroyAsteroid(i);
                ship.lasers[j].explodeTime = Math.ceil(LASER_EXP_DUR * FPS)
                break
            }
        }
    }

    // detect ship vs. lasers

    if (!exploding) {
        if (ship.blinkNumber === 0 && !ship.dead) {
            // check for asteroid collisions
            for (let i = 0; i < roids.length; i++) {
                if (distBetweenPoints(ship.x, ship.y, roids[i].x, roids[i].y) < roids[i].r + ship.r) {
                    explodeShip()
                    destroyAsteroid(i)
                }
            }
        }
        // rotate ship
        ship.a += ship.rot;

        // move ship
        ship.x += ship.thrust.x;
        ship.y += ship.thrust.y;
    } else {
        ship.explodeTime--;
        if (ship.explodeTime == 0) {
            lives--;
            if (lives === 0) {
                gameOver();
            } else {
                ship = newShip();
            }

        }
    }


    // move the asteroids
    for (let i = 0; i < roids.length; i++) {
        roids[i].x += roids[i].xv;
        roids[i].y += roids[i].yv;

        // handle edge of screen
        if (roids[i].x < -roids[i].r) {
            roids[i].x = canvas.width + roids[i].r;
        } else if (roids[i].x > canvas.width + roids[i].r) {
            roids[i].x = -roids[i].r;
        }

        if (roids[i].y < -roids[i].r) {
            roids[i].y = canvas.height + roids[i].r;
        } else if (roids[i].y > canvas.height + roids[i].r) {
            roids[i].y = -roids[i].r;
        }

    }

    // handle edge of screen
    if (ship.x < - ship.r) {
        ship.x = canvas.width + ship.r;
    } else if (ship.x > canvas.width + ship.r) {
        ship.x = -ship.r;
    }

    if (ship.y < -ship.r) {
        ship.y = canvas.height + ship.r;
    } else if (ship.y > canvas.height + ship.r) {
        ship.y = ship.r;
    }

    // move the lasers
    for (let i = ship.lasers.length - 1; i >= 0; i--) {
        // check distance travelled
        if (ship.lasers[i].dist > LASER_DIST + canvas.width) {
            ship.lasers.splice(i, 1);
            continue;
        }

        // handle the explosion
        if (ship.lasers[i].explodeTime > 0) {
            ship.lasers[i].explodeTime--;
            if (ship.lasers[i].explodeTime == 0) {
                ship.lasers.splice(i, 1);
                continue;
            }
        } else {
            ship.lasers[i].x += ship.lasers[i].xv;
            ship.lasers[i].y += ship.lasers[i].yv;

            // calculate distance travel
            ship.lasers[i].dist += Math.sqrt(
                Math.pow(ship.lasers[i].xv, 2) +
                Math.pow(ship.lasers[i].yv, 2)
            );
        }
        // handle edge of screen
        if (ship.lasers[i].x < 0) {
            ship.lasers[i].x = canvas.width;
        } else if (ship.lasers[i].x > canvas.width) {
            ship.lasers[i].x = 0;
        }

        if (ship.lasers[i].y < 0) {
            ship.lasers[i].y = canvas.height;
        } else if (ship.lasers[i].y > canvas.height) {
            ship.lasers[i].y = 0;
        }
    }

    // draw laser
    for (let i = 0; i < ship.lasers.length; i++) {
        if (ship.lasers[i].explodeTime == 0) {
            ctx.fillStyle = 'salmon';
            ctx.beginPath();
            ctx.arc(ship.lasers[i].x, ship.lasers[i].y, SHIP_SIZE / 15, 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.fill();
        } else {
            // draw the explosion
            ctx.fillStyle = 'orangered';
            ctx.beginPath();
            ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.75, 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'salmon';
            ctx.beginPath();
            ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.5, 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'pink';
            ctx.beginPath();
            ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.25, 0, Math.PI * 2, false);
            ctx.closePath();
            ctx.fill();
        }
    }


    // centre dot
    if (SHOW_CENTER_DOT) {
        ctx.fillStyle = 'red';
        ctx.fillRect(ship.x - 1, ship.y - 1, 2, 2);
    }
}

function newShip() {
    let ship = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        r: SHIP_SIZE / 2,
        a: 90 / 180 * Math.PI,  // convert to radians
        rot: 0,
        blinkNumber: Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR),
        blinkTime: Math.ceil(SHIP_BLINK_DUR * FPS),
        explodeTime: 0,
        canShoot: true,
        dead: false,
        lasers: [],
        thrusting: false,
        thrust: {
            x: 0,
            y: 0,
        }
    }
    return ship;
}

function drawShip(x, y, a, colour) {
    ctx.strokeStyle = colour || 'white';
    ctx.lineWidth = SHIP_SIZE / 20;
    ctx.beginPath();
    ctx.moveTo(
        x + 4 / 3 * ship.r * Math.cos(a),
        y - 4 / 3 * ship.r * Math.sin(a)
    );
    ctx.lineTo(
        x - ship.r * (2 / 3 * Math.cos(a) + Math.sin(a)),
        y + ship.r * (2 / 3 * Math.sin(a) - Math.cos(a))
    );
    ctx.lineTo(
        x - ship.r * (2 / 3 * Math.cos(a) - Math.sin(a)),
        y + ship.r * (2 / 3 * Math.sin(a) + Math.cos(a))
    );
    ctx.closePath();
    ctx.stroke();
}

function createAsteroidBelt() {
    roids = [];
    for (let i = 0; i < ROIDS_NUM + level; i++) {
        let x, y;
        do {
            x = Math.floor(Math.random() * canvas.width);
            y = Math.floor(Math.random() * canvas.height);
        } while (distBetweenPoints(x, y, ship.x, ship.y) < ROIDS_SIZE * 2 + ship.r)
        roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 2,)));
    }
}

function newAsteroid(x, y, r = ROIDS_SIZE / 2) {
    let lvlMul = 1 + 0.1 * level;
    let roid = {
        x,
        y,
        xv: Math.random() * ROIDS_SPD * lvlMul / FPS * (Math.random() < 0.5 ? 1 : -1),
        yv: Math.random() * ROIDS_SPD * lvlMul / FPS * (Math.random() < 0.5 ? 1 : -1),
        r,
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

function explodeShip() {
    ship.explodeTime = SHIP_EXPLODE_DUR * FPS
    fxExplode.play();
}

function shootLaser() {
    // create the laser object
    if (ship.canShoot && ship.lasers.length < LASER_MAX) {
        ship.lasers.push({
            x: ship.x + 4 / 3 * ship.r * Math.cos(ship.a),
            y: ship.y - 4 / 3 * ship.r * Math.sin(ship.a),
            xv: LASER_SPD * Math.cos(ship.a) / FPS,
            yv: -LASER_SPD * Math.sin(ship.a) / FPS,
            dist: 0,
            explodeTime: 0,
        });
        fxLaser.play();
    }

    // prevent ship from shooting multiple lasers at once
    ship.canShoot = false;
}


function destroyAsteroid(index) {
    let x = roids[index].x;
    let y = roids[index].y;
    let r = roids[index].r;

    // split the asteroid in tho if necessary
    if (r === Math.ceil(ROIDS_SIZE / 2)) {
        roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 4)));
        roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 4)));
        score += ROIDS_PTS_LGE;
    } else if (r === Math.ceil(ROIDS_SIZE / 4)) {
        roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 8)));
        roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 8)));
        score += ROIDS_PTS_MD
    } else {
        score += ROIDS_PTS_SM
    }

    // check high score
    if (score > scoreHigh) {
        scoreHigh = score;
        localStorage.setItem(SAVE_KEY_SCORE, scoreHigh);
    }

    roids.splice(index, 1);


    if (roids.length == 0) {
        level++;
        newLevel();
    }
    fxHit.play();
}


function Sound(src, maxStreams = 1, volume = 1.0) {
    this.streamNum = 0;
    this.streams = [];
    for (let i = 0; i < maxStreams; i++) {
        this.streams.push(new Audio(src))
        this.streams[i].volume = volume;
    }

    this.play = function() {
        if (SOUND_ON) {
            this.streamNum = (this.streamNum + 1) % maxStreams;
            this.streams[this.streamNum].play();
        }
    }

    this.stop = function () {
        this.streams[this.streamNum].pause();
        this.streams[this.streamNum].currentTime = 0;
    }
}
