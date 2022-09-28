// script.js
// FRONTEND JS FOR SOUNDBARS

const settings = {
    width: 1200,
    height: 600,
    frameRate: 120,
    gravity: 0.02,
    collisionThreshold: 0.1,
    backgroundColor: '#EEE',
    numNotes: 48,
    menuHeight: 50,
}

const NOTES = [
    "C2", "C#2", "D2", "D#2", "E2", "F2", "F#2", "G2", "G#2", "A2", "A#2", "B2",
    "C3", "C#3", "D3", "D#3", "E3", "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3",
    "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4",
    "C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5", "G#5", "A5", "A#5", "B5",
];

const state = {
    frameCounter: 0,
    point: {x: -1, y: -1},
    mousePos: {x: -1, y: -1},
    lines: [],                  //p1, p2, color
    balls: [],
    droppers: [],               //x, y, framesPerDrop
    currentColor: '#0033FF',
}

let canvas, ctx;
let synth = null;

function init() {
    canvas = document.getElementById("sbCanvas");
    ctx = canvas.getContext('2d');
    setCanvasResolution();
    
    synth = new Tone.Synth().toDestination();
    state.droppers.push({x: 40, y: 10, framesPerDrop: 500});

    clearCanvas();
    // ADDING EVENT LISTENERS
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', mouseMove)
    startFrames();
};

function handleClick(e) {
    // If on first click, save point
    // Else get second point, and create a line, reset state.point to -1
    if(state.point.x === -1) {
        state.point = {
            x: e.offsetX, 
            y: e.offsetY
        };
    }
    else {
        // Disregards lines with two identical points
        if(state.point.x === e.offsetX && state.point.y === e.offsetY) {
            return;
        }
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
    }, 1000/ settings.frameRate);
}

function setCanvasResolution() {
    settings.width = window.innerWidth;
    settings.height = window.innerHeight - settings.menuHeight;
    canvas.width = settings.width;
    canvas.height = settings.height;
}

function update() {
    state.frameCounter++;

    if(settings.width !== window.innerWidth && settings.height !== window.innerHeight - settings.menuHeight) {
        setCanvasResolution();
    }
    state.droppers.forEach((dropper) => {
        if(state.frameCounter % dropper.framesPerDrop === 0) {
            addBall(dropper);
        }
    })

    state.balls.forEach((ball) => {
        ball.x += ball.velX;
        ball.y += ball.velY;
        ball.velY += settings.gravity;
    })
    
    state.balls = state.balls.filter((ball) => {
        if(ball.y > settings.height || ball.x < 0 || ball.x > settings.width) {
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
            if (distance1 + distance2 - lineDistance <= settings.collisionThreshold) {
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
        lineNormal = line,Angle + Math.PI*.5;        
    }
    let reflectionAngle = 2*lineNormal - ballAngle;
    
    let velocityVector = Math.sqrt(ball.velX*ball.velX + ball.velY*ball.velY);
    ball.velX = Math.cos(reflectionAngle) * velocityVector;
    ball.velY = Math.sin(reflectionAngle) * velocityVector;

    // Add Methods for choosing notes
    let note = Math.floor(Math.abs(Math.sin(velocityVector) * settings.numNotes));

    // Add Instrument choices
    synth.triggerAttackRelease(NOTES[note], "8n");
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

function addBall(dropper) {
    state.balls.push({x: dropper.x, y: dropper.y, velX: 0, velY: settings.gravity})
}

function clearCanvas() {
    ctx.fillStyle = settings.backgroundColor;
    ctx.fillRect(0, 0, settings.width, settings.height);
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

