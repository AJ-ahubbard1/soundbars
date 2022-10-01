// script.js
// FRONTEND JS FOR SOUNDBARS

const settings = {
    width: 1200,
    height: 600,
    framerate: 120,
    gravity: 0.02,
    collision: 0.1,
    clickThreshold: 8,
    backgroundColor: '#EEE',
    numNotes: 60,
    menuHeight: 50,
    ballradius: 4,
    pitch: "cosine",
    instrument: 0,
    numInstruments: 0,
    instrumentList: [],
}

const NOTES = [
    "C2", "C#2", "D2", "D#2", "E2", "F2", "F#2", "G2", "G#2", "A2", "A#2", "B2",
    "C3", "C#3", "D3", "D#3", "E3", "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3",
    "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4",
    "C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5", "G#5", "A5", "A#5", "B5",
    "C6", "C#6", "D6", "D#6", "E6", "F6", "F#6", "G6", "G#6", "A6", "A#6", "B6",
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
    synth: [],
    menu: [
        {id: "framerate", input: null, label: null},
        {id: "gravity", input: null, label: null},
        {id: "collision", input: null, label: null},
        {id: "ballradius", input: null, label: null},
        {id: "pitch", input: null, label: null},
        {id: "instrument", input: null, label: null},
    ],
}
const getMenu = (id) => {return doc.menu.find((m) => {return m.id === id})}

const addInstrumentOption = (instrument) => {
    let option = document.createElement('option'); 
    option.textContent = instrument;
    option.value = settings.numInstruments++;
    let m = getMenu("instrument").input.appendChild(option);
}


const updateMenu = (menu) => {
    menu.input = document.getElementById(menu.id);
    menu.label = document.getElementById(`${menu.id}-label`);
    menu.input.value = settings[menu.id];
    if(menu.id !== "pitch" && menu.id !== "instrument") {
        menu.input.addEventListener("input", handleSlider);
        menu.label.innerHTML = `${menu.id}: ${settings[menu.id]}`;
    }
    return menu;
}

function init() {
    doc.canvas = document.getElementById("sbCanvas");
    doc.ctx = doc.canvas.getContext('2d');
    setCanvasResolution();
    
    state.droppers.push({x: 40, y: 10, framesPerDrop: 500});
    
    // Update Menu
    doc.menu.map((m) => updateMenu(m));

    clearCanvas();
   
    // ADDING EVENT LISTENERS
    doc.canvas.addEventListener('click', handleClick);
    doc.canvas.addEventListener('mousemove', mouseMove);
    window.addEventListener('keydown', function (e) {
        e.preventDefault();
        state.keyPresses[e.key] = true;
    })
    window.addEventListener('keyup', function (e) {
        state.keyPresses[e.key] = false;
    })

    doc.synth[0] = new Tone.Sampler({
        urls: {
            /* note map for salamander piano */
            A0: "A0.mp3",
            C1: "C1.mp3",
            "D#1": "Ds1.mp3",
            "F#1": "Fs1.mp3",
            A1: "A1.mp3",
            C2: "C2.mp3",
            "D#2": "Ds2.mp3",
            "F#2": "Fs2.mp3",
            A2: "A2.mp3",
            C3: "C3.mp3",
            "D#3": "Ds3.mp3",
            "F#3": "Fs3.mp3",
            A3: "A3.mp3",
            C4: "C4.mp3",
            "D#4": "Ds4.mp3",
            "F#4": "Fs4.mp3",
            A4: "A4.mp3",
            C5: "C5.mp3",
            "D#5": "Ds5.mp3",
            "F#5": "Fs5.mp3",
            A5: "A5.mp3",
            C6: "C6.mp3",
            "D#6": "Ds6.mp3",
            "F#6": "Fs6.mp3",
            A6: "A6.mp3",
            C7: "C7.mp3",
            "D#7": "Ds7.mp3",
            "F#7": "Fs7.mp3",
            A7: "A7.mp3",
            C8: "C8.mp3"
        },
        release: 1,
        baseUrl: "https://tonejs.github.io/audio/salamander/"    
    }).toDestination();    
    doc.synth[1] = new Tone.Sampler({
        urls: {
            "A1": "A1.mp3",
            "A2": "A2.mp3",
        },
        baseUrl: "https://tonejs.github.io/audio/casio/",
    }).toDestination();
    doc.synth[2] = new Tone.PluckSynth().toDestination();
    doc.synth[3] = new Tone.FMSynth().toDestination();
    doc.synth[4] = new Tone.Synth().toDestination();
    doc.synth[5] = new Tone.MembraneSynth().toDestination();
    doc.synth[6] = new Tone.MetalSynth().toDestination();

    settings.instrumentList = ["piano", "casio", "plucky", "fmsynth", "synth", "membrane", "metal"];
    settings.instrumentList.forEach(addInstrumentOption);

    startFrames();
};


// Event Handlers
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

const mouseMove = (e) => state.mousePos = {x: e.offsetX, y: e.offsetY}

function handleSlider(e) {
    let {id} = e.currentTarget;
    let menu = doc.menu.find((m) => {return m.id === id});
    settings[id] = menu.input.valueAsNumber;
    menu.label.innerHTML = `${menu.id}: ${settings[id]}`;
    if (id === "framerate") {
        clearInterval(state.timerId);
        startFrames();
    }
}
const clearBalls = () => {state.balls = []}
const pauseFrames = () => {state.isPaused = true}
const resumeFrames = () => {state.isPaused = false}
const pitchMethod = () => {settings.pitch = doc.menu[4].input.value}
const selectInstrument = () => {
    console.log("selected Instrument")
    settings.instrument = doc.menu[5].input.value
}
const startFrames = () => {state.timerId = setInterval(() => update(), 1000/settings.framerate)}

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
            if (distance1 + distance2 - lineDistance <= settings.collision) {
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

    playNotes(velocityVector, lineLength);
    return ball;
}

function playNotes(velocityVector, lineLength) {
    let note = null;
    switch(settings.pitch) {
        case "random":
            note = Math.floor(Math.random() * settings.numNotes);
            break;
        case "cosine":
            note = Math.floor(Math.abs(Math.cos(velocityVector) * settings.numNotes));
            break;
        case "line-length":
            note = Math.floor(lineLength/8);
            if(note > settings.numNotes - 1) {
                note = settings.numNotes - 1;
            }
            note = settings.numNotes - 1 - note;
            break;
        default:
            note = Math.floor(velocityVector*velocityVector);
    }
    // Add Instrument choices
    doc.menu[4].label.innerHTML = NOTES[note];

    doc.synth[settings.instrument].triggerAttackRelease(NOTES[note], 2);
    //doc.synth.triggerAttack(NOTES[note], 1);
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

const addBall = dropper => {state.balls.push({x: dropper.x, y: dropper.y, velX: 0, velY: settings.gravity})}

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
    let r = settings.ballradius;
    doc.ctx.fillStyle = color;
    doc.ctx.fillRect(ball.x - r, ball.y - r, r*2, r*2);
}

