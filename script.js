// script.js
// FRONTEND JS FOR SOUNDBARS

// CONSTS
const WIDTH = 600;
const HEIGHT = 300;
const FRAME_RATE = 96;
const FRAMES_PER_BALL = 500; 
const GRAVITY = .03;
const COLLISION_THRESHOLD = .3;
// GAME COLORS
const BG_COLOR = '#EEE';

// GLOBAL VARIABLES
const state = {
    frameCounter: 0,
    point: {x: -1, y: -1},
    mousePos: {x: -1, y: -1},
    lines: [],
    balls: [],
    droppers: [],
    currentColor: '#0033FF',
}
let canvas, ctx;

function init() {
    console.log("test");
    
    canvas = document.getElementById("sbCanvas");
    ctx = canvas.getContext('2d');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    
    state.droppers.push({x: 40, y: 10});

    clearCanvas();
    // ADDING EVENT LISTENERS
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', mouseMove)
    startFrames();
};

function handleClick(e) {
    console.log("click: ", e.offsetX, e.offsetY, state.point);
    if(state.point.x === -1) {
        state.point = {
            x: e.offsetX, 
            y: e.offsetY
        };
        console.log('assigned point');
    }
    else {
        // Disregards lines with two identical points
        if(state.point.x === e.offsetX && state.point.y === e.offsetY) {
            return;
        }

        console.log("created a line");
        let p1 = state.point;
        let p2 = {x: e.offsetX, y: e.offsetY};
        // always have p1 be left point
        if(p1.x > p2.x) {
            p1 = p2;
            p2 = state.point;
        }
        state.lines.push({
            p1:p1,
            p2:p2,
            color: state.currentColor
        });
        state.point = {x:-1, y:-1};
    }
}

function mouseMove(e) {
    state.mousePos.x = e.offsetX;
    state.mousePos.y = e.offsetY;
}

function startFrames() {
    const id = setInterval(() => {
        update();
    }, 1000/ FRAME_RATE);
}

function update() {
    state.frameCounter++;

    if(state.frameCounter % FRAMES_PER_BALL === 0) {
        addBall();
    }

    state.balls.forEach((ball) => {
        ball.x += ball.velX;
        ball.y += ball.velY;
        ball.velY += GRAVITY;
    })
    
    state.balls = state.balls.filter((ball) => {
        if(ball.y > HEIGHT || ball.x < 0 || ball.x > WIDTH) {
            console.log("ball removed");
            return false;
        }
        return true;
    })

    for(let b = 0; b < state.balls.length; b++) {
        for(let l = 0; l < state.lines.length; l++) {
            let ballPos = {x:state.balls[b].x, y:state.balls[b].y};
            let line = state.lines[l];
            // if the sum of the distances between the ball and pt1, and ball and pt2 is 
            // reasonably close to the distance between pt1 and pt2, then we can claim intersection
            let lineDistance = getDistance(line.p1, line.p2); 
            let distance1 = getDistance(ballPos, line.p1);
            let distance2 = getDistance(ballPos, line.p2);
            // Collision Detected
            if (distance1 + distance2 - lineDistance <= COLLISION_THRESHOLD) {
                state.balls[b] = handleBounce(state.balls[b], line);
            }
        }
    }
    paintCanvas();
}

function getDistance(p1, p2) {
    let x = p2.x - p1.x;
    let y = p2.y - p1.y;
    return Math.sqrt(x*x + y*y);
}

function handleBounce(ball, line) {
    let lineAngle = Math.atan2(line.p2.y-line.p1.y,line.p2.x-line.p1.x);
    let ballAngle = Math.atan2(ball.velY, ball.velX);
    if (ballAngle <= 0) {
        ballAngle += Math.PI;
    }
    else {
        ballAngle -= Math.PI;
    }
    let lineNormal = lineAngle - Math.PI*.5;
    if (ballAngle > 0) {
        lineNormal = lineAngle + Math.PI*.5;    
    }
    let reflectionAngle = 2*lineNormal - ballAngle;
    
    let velocityVector = Math.sqrt(ball.velX*ball.velX + ball.velY*ball.velY);
    ball.velX = Math.cos(reflectionAngle) * velocityVector;
    ball.velY = Math.sin(reflectionAngle) * velocityVector;

    console.log(ballAngle, lineAngle, lineNormal, reflectionAngle);
    return ball;
}

function paintCanvas() {
    clearCanvas();  
    
    // draw line after point is placed
    if(state.point.x !== -1) {
        ctx.fillStyle = state.currentColor;
        ctx.fillRect(state.point.x-1, state.point.y-1, 3, 3);
        ctx.fillRect(state.mousePos.x-1, state.mousePos.y-1, 3, 3);
        let line = {
            p1: state.point,
            p2: state.mousePos,
            color:state.currentColor
        };
        drawLine(line);
    }
    // draw completed lines
    state.lines.forEach(drawLine);

    // draw balls
    state.balls.forEach(drawBall);
}

function addBall() {
    console.log("Ball added");
    state.droppers.forEach((pos) => {
        state.balls.push({x:pos.x, y: pos.y, velX: 0, velY: GRAVITY})
    })
}

function clearCanvas() {
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawLine(line) {
    ctx.beginPath();
    ctx.strokeStyle = line.color;
    ctx.moveTo(line.p1.x, line.p1.y);
    ctx.lineTo(line.p2.x, line.p2.y);
    ctx.stroke();
}

function drawBall(ball) {
    ctx.fillStyle = '#333';
    ctx.fillRect(ball.x - 2, ball.y - 2, 5, 5);
}

