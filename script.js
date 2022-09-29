// script.js
// FRONTEND JS FOR SOUNDBARS

const settings = {
    width: 1200,
    height: 600,
    frameRate: 120,
    gravity: 0.02,
    collisionThreshold: 0.1,
    clickThreshold: 8,
    backgroundColor: '#EEE',
    numNotes: 36,
    menuHeight: 50,
    ballRadius: 4,
    pitchMethod: "cosine",
}

const NOTES = [
 //   "C2", "C#2", "D2", "D#2", "E2", "F2", "F#2", "G2", "G#2", "A2", "A#2", "B2",
    "C3", "C#3", "D3", "D#3", "E3", "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3",
    "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4",
    "C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5", "G#5", "A5", "A#5", "B5",
];

const COLORS = {
    black: '#000000',
    red: '#FF0000',
    lime: '#00FF00',
    blue: '#0000FF',
    yellow: '#FFFF00',
    cyan: '#00FFFF',
    magenta: '#FF00FF',
    maroon: '#800000',
    green: '#008000',
    gold: '#FFD700',
    silver: '#C0C0C0',
    purple: '#800080',
    teal: '#008080',
    navy: '#000080',
}

const state = {
    timerId: null,
    frameCounter: 0,
    point: {x: -1, y: -1},
    mousePos: {x: -1, y: -1},
    lines: [],                  //p1, p2, color
    balls: [],
    droppers: [],               //x, y, framesPerDrop
    currentColor: '#0033FF',
    keyPresses: [],
    isPaused: false,
    settingDropper: null
}

const doc = {
    canvas: null,
    ctx: null,
    synth: null,
    frameRateSlider: null,
    frameRateLabel: null,
    gravitySlider: null,
    gravityLabel: null,
    collisionSlider: null,
    collisionLabel: null,
    ballRadiusSlider: null,
    ballRadiusLabel: null,
    pitchLabel: null,
    pitchSelect: null,
}
//TODO! Its probably best to move some of these calls to the html page
function init() {
    doc.canvas = document.getElementById("sbCanvas");
    doc.ctx = doc.canvas.getContext('2d');
    setCanvasResolution();
    
    state.droppers.push({x: 40, y: 10, framesPerDrop: 500});
    
    // Update Menu
    doc.frameRateSlider = document.getElementById("framerate");
    doc.frameRateLabel = document.getElementById("framerate-label");
    doc.frameRateLabel.innerHTML = `FrameRate: ${settings.frameRate}`;
    doc.frameRateSlider.value = settings.frameRate;

    doc.gravitySlider = document.getElementById("gravity");
    doc.gravityLabel = document.getElementById("gravity-label");
    doc.gravityLabel.innerHTML = `Gravity: ${settings.gravity}`;
    doc.gravitySlider.value = settings.gravity;

    doc.collisionSlider = document.getElementById("collision");
    doc.collisionLabel = document.getElementById("collision-label");
    doc.collisionLabel.innerHTML = `Collision Threshold: ${settings.collisionThreshold}`;
    doc.collisionSlider.value = settings.collisionThreshold;

    doc.ballRadiusSlider = document.getElementById("ballradius");
    doc.ballRadiusLabel = document.getElementById("ballradius-label");
    doc.ballRadiusLabel.innerHTML = `Ball Radius: ${settings.ballRadius}`;
    doc.ballRadiusSlider.value = settings.ballRadius;
    
    doc.pitchLabel = document.getElementById("pitch-label");
    doc.pitchSelect = document.getElementById("pitch");

    clearCanvas();
    // ADDING EVENT LISTENERS
    doc.canvas.addEventListener('click', handleClick);
    doc.canvas.addEventListener('mousemove', mouseMove);
    doc.frameRateSlider.addEventListener('change', handleSlider);
    doc.gravitySlider.addEventListener('change', handleSlider);
    doc.collisionSlider.addEventListener('change', handleSlider);
    doc.ballRadiusSlider.addEventListener('change', handleSlider);


    window.addEventListener('keydown', function (e) {
        e.preventDefault();
        console.log(e.key);
        state.keyPresses[e.key] = true;
    })

    window.addEventListener('keyup', function (e) {
        state.keyPresses[e.key] = false;
    })

    doc.synth = new Tone.Synth().toDestination();
    //doc.synth = new Tone.MembraneSynth().toDestination();
    //doc.synth = new Tone.PluckSynth().toDestination();
    //doc.synth = new Tone.MetalSynth().toDestination();

    startFrames();
};

function handleSlider(e) {
    console.log(e.currentTarget.id);
    switch(e.currentTarget.id) {
        case "framerate":
            settings.frameRate = Number(doc.frameRateSlider.value);
            doc.frameRateLabel.innerHTML = `FrameRate: ${settings.frameRate}`;
            clearInterval(state.timerId);
            startFrames();
            break;
        case "gravity":
            settings.gravity = Number(doc.gravitySlider.value);
            doc.gravityLabel.innerHTML = `Gravity: ${settings.gravity}`;
            break;
        case "collision":
            settings.collisionThreshold = Number(doc.collisionSlider.value);
            doc.collisionLabel.innerHTML = `Collision Threshold: ${settings.collisionThreshold}`;
            break;
        case "ballradius":
            settings.ballRadius = Number(doc.ballRadiusSlider.value);
            doc.ballRadiusLabel.innerHTML = `Ball Radius: ${settings.ballRadius}`;
    }
}
function clearBalls() {
    state.balls = [];
}

function pauseFrames() {
    state.isPaused = true;
}
function resumeFrames() {
    state.isPaused = false;
}

function pitchMethod() {
    settings.pitchMethod = doc.pitchSelect.value;
}

function handleClick(e) {
    let clickP = {x: e.offsetX, y: e.offsetY,};
    // If on first click, save point
    // Else get second point, and create a line, reset state.point to -1
    if(state.settingDropper) {
        state.settingDropper.x = clickP.x;
        state.settingDropper.y = clickP.y;
        state.droppers.push(state.settingDropper);
        state.settingDropper = null;
    }
    else if(state.point.x === -1) {
        let d1,d2;
        // Moving objects on canvas
        if (state.keyPresses["Shift"]) {
            
            let clickedLine = state.lines.find((line) => {
                d1 = getDistance(line.p1,clickP);
                d2 = getDistance(line.p2,clickP);
                return (d1 <= settings.clickThreshold || d2 <= settings.clickThreshold);
            })
            if(clickedLine) {
                state.lines = state.lines.filter(line => {return line !== clickedLine});
                if(d1<=settings.clickThreshold) {
                    state.point = clickedLine.p2;
                } else {
                    state.point = clickedLine.p1;
                }
            } else {
                let clickedDropper = state.droppers.find((dropper) => {
                    d1 = getDistance(dropper, clickP);
                    return (d1 <= settings.clickThreshold);
                })
                if (clickedDropper) {
                    state.settingDropper = clickedDropper;
                    state.droppers = state.droppers.filter(dropper => {return dropper !== clickedDropper});
                }
            }
        } else {
            state.point = clickP;
        }
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
    state.timerId = setInterval(() => {
        update();
    }, 1000/ settings.frameRate);
}

function setCanvasResolution() {
    settings.width = window.innerWidth;
    settings.height = window.innerHeight - settings.menuHeight;
    doc.canvas.width = settings.width;
    doc.canvas.height = settings.height;
}

function keyboardInputs() {
    if(state.keyPresses["Backspace"] && state.lines.length > 0) {
        if(state.point.x !== -1) {
            state.point = {x:-1, y:-1};
        } else {
            state.lines.pop();
        }
        state.keyPresses["Backspace"] = false;
    }
    if(state.keyPresses[" "]) {
        state.isPaused = !state.isPaused;
        state.keyPresses[" "] = false;
    }
}

function update() {

    if(!state.isPaused) {
        state.frameCounter++;
        // update ball physics
        state.balls.forEach((ball) => {
            ball.x += ball.velX;
            ball.y += ball.velY;
            ball.velY += settings.gravity;
        })
    }
    keyboardInputs();
    // update canvas resolution on window size changes
    if(settings.width !== window.innerWidth && settings.height !== window.innerHeight - settings.menuHeight) {
        setCanvasResolution();
    }
    // check each dropper's ball drop timer
    state.droppers.forEach((dropper) => {
        if(state.frameCounter % dropper.framesPerDrop === 0) {
            addBall(dropper);
        }
    })
    // filter out balls that fall off the screen
    state.balls = state.balls.filter((ball) => {
        if(ball.y > settings.height || ball.x < 0 || ball.x > settings.width) {
            return false;
        }
        return true;
    })
    // check collisions between lines and balls
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
                state.balls[b] = handleBounce(state.balls[b], line, lineDistance);
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

function handleBounce(ball, line, lineLength) {
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

    let note = null;
    switch(settings.pitchMethod) {
        case "random":
            note = Math.floor(Math.random() * settings.numNotes);
            break;
        case "cosine":
            note = Math.floor(Math.abs(Math.cos(velocityVector) * settings.numNotes));
            break;
        case "line-length":
            note = Math.floor(lineLength/8);
            if(note > settings.numNotes - 1) {
                console.log("OOB!", note);
                note = settings.numNotes - 1;
            }
            note = settings.numNotes - 1 - note;
            break;
        default:
            note = Math.floor(velocityVector*velocityVector);
    }
    console.log(settings.pitchMethod, note);
    // Add Instrument choices

    doc.pitchLabel.innerHTML = NOTES[note];
    doc.synth.triggerAttackRelease(NOTES[note], "2n");
    return ball;
}

function paintCanvas() {
    clearCanvas();  

    if(state.settingDropper) {
        state.settingDropper.x = state.mousePos.x;
        state.settingDropper.y = state.mousePos.y;
        drawBall(state.settingDropper, '#666');
    }
    state.droppers.forEach(dropper => drawBall(dropper, '#666'));
    
    // draw line after point is placed
    if(state.point.x !== -1) {
        doc.ctx.fillStyle = state.currentColor;
        doc.ctx.fillRect(state.point.x-1, state.point.y-1, 3, 3);
        doc.ctx.fillRect(state.mousePos.x-1, state.mousePos.y-1, 3, 3);
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
    state.balls.forEach(ball => drawBall(ball));
}

function addBall(dropper) {
    state.balls.push({x: dropper.x, y: dropper.y, velX: 0, velY: settings.gravity})
}

function clearCanvas() {
    doc.ctx.fillStyle = settings.backgroundColor;
    doc.ctx.fillRect(0, 0, settings.width, settings.height);
}

function drawLine(line) {
    doc.ctx.beginPath();
    doc.ctx.strokeStyle = line.color;
    doc.ctx.moveTo(line.p1.x, line.p1.y);
    doc.ctx.lineTo(line.p2.x, line.p2.y);
    doc.ctx.stroke();
}

function drawBall(ball, color='#333') {
    let r = settings.ballRadius;
    doc.ctx.fillStyle = color;
    doc.ctx.fillRect(ball.x - r, ball.y - r, r*2, r*2);
}

