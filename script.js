// script.js
// FRONTEND JS FOR SOUNDBARS

const settings = {
    width: 1200,
    height: 600,
    framerate: 120,
    droprate: 120,
    gravity: 0.02,
    collision: 0.1,
    maxVelocity: 5,
    clickThreshold: 8,
    backgroundColor: '#EEE',
    numNotes: 60,
    menuHeight: 96,
    ballradius: 4,
    pitch: 'cosine',
    instrumentList: [],
}

const NOTES = [
    'C2', 'C#2', 'D2', 'D#2', 'E2', 'F2', 'F#2', 'G2', 'G#2', 'A2', 'A#2', 'B2',
    'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3',
    'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4',
    'C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5', 'A5', 'A#5', 'B5',
    'C6', 'C#6', 'D6', 'D#6', 'E6', 'F6', 'F#6', 'G6', 'G#6', 'A6', 'A#6', 'B6',
]

const COLORS = [
    {name: 'black', rgb: '#000000'},
    {name: 'red', rgb: '#FF0000'},
    {name: 'lime', rgb: '#00FF00'},
    {name: 'blue', rgb: '#0000FF'},
    {name: 'yellow', rgb: '#FFFF00'},
    {name: 'cyan', rgb: '#00FFFF'},
    {name: 'magenta', rgb: '#FF00FF'},
    {name: 'maroon', rgb: '#800000'},
    {name: 'green', rgb: '#008000'},
    {name: 'gold', rgb: '#FFD700'},
    {name: 'silver', rgb: '#C0C0C0'},
    {name: 'purple', rgb: '#800080'},
    {name: 'teal', rgb: '#008080'},
    {name: 'navy', rgb: '#000080'},
]

const state = {
    timerId: null,
    frameCounter: 0,
    point: {x: -1, y: -1},
    mousePos: {x: -1, y: -1},
    lines: [],                  //p1, p2, color
    balls: [],
    droppers: [],               //x, y
    currentColor: '#0033FF',
    keyPresses: [],
    isPaused: false,
    settingDropper: null,
    numChannels: 0,
    currentChannel: 0,
    channels: []
}

const doc = {
    canvas: null,
    ctx: null,
    synth: [],
    menu: [
        {id: 'framerate', input: null, label: null},
        {id: 'gravity', input: null, label: null},
        {id: 'collision', input: null, label: null},
        {id: 'ballradius', input: null, label: null},
        {id: 'pitch', input: null, label: null},
        {id: 'droprate', input: null, label: null},
    ],
}


function init() {
    doc.canvas = document.getElementById('sbCanvas')
    doc.ctx = doc.canvas.getContext('2d')
    setCanvasResolution()
    
    state.droppers.push({x: 40, y: 10})
    
    // Grab menu DOM elements and add event listeners to sliders
    doc.menu.map((m) => updateMenu(m))
   
    // Adding mouse and keyboard event listeners
    doc.canvas.addEventListener('click', handleClick)
    doc.canvas.addEventListener('mousemove', mouseMove)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    // Load instruments
    doc.synth[0] = new Tone.Sampler({
        urls: {
            /* note map for salamander piano */
            'A0': 'A0.mp3',
            'C1': 'C1.mp3',
            'D#1': 'Ds1.mp3',
            'F#1': 'Fs1.mp3',
            'A1': 'A1.mp3',
            'C2': 'C2.mp3',
            'D#2': 'Ds2.mp3',
            'F#2': 'Fs2.mp3',
            'A2': 'A2.mp3',
            'C3': 'C3.mp3',
            'D#3': 'Ds3.mp3',
            'F#3': 'Fs3.mp3',
            'A3': 'A3.mp3',
            'C4': 'C4.mp3',
            'D#4': 'Ds4.mp3',
            'F#4': 'Fs4.mp3',
            'A4': 'A4.mp3',
            'C5': 'C5.mp3',
            'D#5': 'Ds5.mp3',
            'F#5': 'Fs5.mp3',
            'A5': 'A5.mp3',
            'C6': 'C6.mp3',
            'D#6': 'Ds6.mp3',
            'F#6': 'Fs6.mp3',
            'A6': 'A6.mp3',
            'C7': 'C7.mp3',
            'D#7': 'Ds7.mp3',
            'F#7': 'Fs7.mp3',
            'A7': 'A7.mp3',
            'C8': 'C8.mp3'
        },
        release: 1,
        baseUrl: 'https://tonejs.github.io/audio/salamander/'    
    }).toDestination()    
    doc.synth[1] = new Tone.Sampler({
        urls: {
            'A1': 'A1.mp3',
            'A2': 'A2.mp3',
        },
        baseUrl: 'https://tonejs.github.io/audio/casio/',
    }).toDestination()
    doc.synth[2] = new Tone.Synth().toDestination()
    doc.synth[3] = new Tone.AMSynth().toDestination()
    doc.synth[4] = new Tone.FMSynth().toDestination()
    doc.synth[5] = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
            type: "fatsawtooth",
            count: 3,
            spread: 30
        },
        envelope: {
            attack: 0.01,
            decay: 0.1,
            sustain: 0.5,
            release: 0.4,
            attackCurve: "exponential"
        },
    }).toDestination();
    doc.synth[6] = new Tone.MembraneSynth().toDestination()
    doc.synth[7] = new Tone.MetalSynth().toDestination()
    doc.synth[8] = new Tone.PolySynth(Tone.MonoSynth, {
        volume: -8,
        oscillator: {
            type: "square8"
        },
        envelope: {
            attack: 0.05,
            decay: 0.3,
            sustain: 0.4,
            release: 0.8,
        },
        filterEnvelope: {
            attack: 0.001,
            decay: 0.7,
            sustain: 0.1,
            release: 0.8,
            baseFrequency: 300,
            octaves: 4
        }
    }).toDestination()
    // currently need to manually add instrument names here, in the same order as the doc.synth array above
    settings.instrumentList = ['piano', 'casio', 'synth', 'amsynth', 'fmsynth', 'fatsawtooth', 'membrane', 'metal', 'poly']
    
    addChannel()
    
    document.getElementById('ch-0').checked = true
    startFrames()
}

/** Grab DOM elements for each menu element, and their labels, and adds the event listeners */
const updateMenu = (menu) => {
    menu.input = document.getElementById(menu.id)
    menu.label = document.getElementById(`${menu.id}-label`)
    menu.input.value = settings[menu.id]
    if(menu.id !== 'pitch') {
        menu.input.addEventListener('input', handleSlider)
        //menu.label.innerHTML = `${menu.id}: ${settings[menu.id]}`
    }
    return menu
}

const getMenu = (id) => {return doc.menu.find((m) => {return m.id === id})}

// Event Handlers
function handleSlider(e) {
    let {id} = e.currentTarget
    let menu = doc.menu.find((m) => {return m.id === id})
    settings[id] = menu.input.valueAsNumber
    //menu.label.innerHTML = `${menu.id}: ${settings[id]}`
    if (id === 'framerate') {
        clearInterval(state.timerId)
        startFrames()
    }
}

function handleClick(e) {
    let clickP = {x: e.offsetX, y: e.offsetY}
    // If on first click, save point
    // Else get second point, and create a line, reset state.point to -1
    if(state.settingDropper) {
        state.settingDropper = clickP
        state.droppers.push(state.settingDropper)
        state.settingDropper = null
    }
    else if(state.point.x === -1) {
        let d1,d2
        // Moving objects on canvas
        if (state.keyPresses['Shift']) {
            
            let clickedLine = state.lines.find((line) => {
                d1 = getDistance(line.p1,clickP)
                d2 = getDistance(line.p2,clickP)
                return (d1 <= settings.clickThreshold || d2 <= settings.clickThreshold)
            })
            if(clickedLine) {
                state.lines = state.lines.filter(line => {return line !== clickedLine})
                if(d1<=settings.clickThreshold) {
                    state.point = clickedLine.p2
                } else {
                    state.point = clickedLine.p1
                }
            } else {
                let clickedDropper = state.droppers.find((dropper) => {
                    d1 = getDistance(dropper, clickP)
                    return (d1 <= settings.clickThreshold)
                })
                if (clickedDropper) {
                    state.settingDropper = clickedDropper
                    state.droppers = state.droppers.filter(dropper => {return dropper !== clickedDropper})
                }
            }
        } else {
            state.point = clickP
        }
    }
    else {
        // Disregards lines with two identical points
        if(state.point.x === e.offsetX && state.point.y === e.offsetY) {
            return
        }
        let p1 = state.point
        let p2 = clickP
        // always have p1 be left point
        if(p1.x > p2.x) {
            p1 = p2
            p2 = state.point
        }
        state.lines.push({
            p1:p1,
            p2:p2,
            channel: state.currentChannel
        })
        state.point = {x:-1, y:-1}
    }
}

const mouseMove = (e) => state.mousePos = {x: e.offsetX, y: e.offsetY}

const handleKeyDown = (e) => {

    state.keyPresses[e.key] = true
}
const handleKeyUp = (e) => {state.keyPresses[e.key] = false}
const pitchMethod = () => {settings.pitch = doc.menu[4].input.value}
const clearBalls = () => {state.balls = []}
const pauseFrames = () => {state.isPaused = true}
const resumeFrames = () => {state.isPaused = false}
const selectChannel = (e) => {state.currentChannel = Number(e.currentTarget.value)}
const addDropper = (e) => { state.settingDropper = {...settings.mousePos} }

function addChannel() {
    let num = state.numChannels++
    
    let channelList = document.getElementById('channel-list')
    let addBtn = document.getElementById('add-channel')
    let div = document.createElement('div')
    let radio = document.createElement('input')
    let label = document.createElement('label')
    let selInst = document.createElement('select')
    let selCol = document.createElement('select')
    let startPitch = document.createElement('select')
    let endPitch = document.createElement('select')
    let deleteBtn = document.createElement('button')
    let br = document.createElement('br')
    
    div.className = 'channel'
    div.id = `ch-${num}`
    radio.type = 'radio'
    radio.name = 'channels'
    radio.value = num
    radio.addEventListener('change', selectChannel)
    div.appendChild(radio)
    label.htmlFor = `ch-${num}`
    label.innerHTML = `${num+1}:`
    div.appendChild(label)
    selInst.className = 'instrument'
    selInst.name = 'instrument'
    selInst.id = `instrument-list-${num}`
    selInst.addEventListener('change', selectInstrument)
    for(let i = 0; i < settings.instrumentList.length; i++) {
        let option = document.createElement('option') 
        option.innerHTML = settings.instrumentList[i]
        option.value = i
        selInst.appendChild(option)
    }
    div.appendChild(selInst)
    selCol.className = 'color'
    selCol.name = 'color'
    selCol.id = `color-list-${num}`
    selCol.addEventListener('change', selectColor)
    for(let i = 0; i < COLORS.length; i++) {
        let option = document.createElement('option') 
        option.value = COLORS[i].rgb
        option.innerHTML = COLORS[i].name
        selCol.appendChild(option)
    }
    div.appendChild(selCol)
    startPitch.id = `start-pitch-${num}`
    endPitch.id = `end-pitch-${num}`
    startPitch.addEventListener('change', selectStartPitch)
    endPitch.addEventListener('change', selectEndPitch)
    NOTES.forEach((note, i) => {
        let start = document.createElement('option')
        let end = document.createElement('option')
        start.value = i
        end.value = i
        start.innerHTML = note
        end.innerHTML = note
        startPitch.appendChild(start)
        endPitch.appendChild(end)
    })
    endPitch.value = NOTES.length - 1
    div.appendChild(startPitch)
    div.appendChild(endPitch)
    deleteBtn.innerHTML = 'X'
    deleteBtn.value = num
    deleteBtn.addEventListener('click', deleteChannel)
    div.appendChild(deleteBtn)
    div.appendChild(br)
    channelList.insertBefore(div, addBtn)
    getChannel(num)
}
const deleteChannel = (e) => {
    if(state.numChannels === 1) {
        return
    }
    let num = e.currentTarget.value
    state.channels = state.channels.filter((channel, i) => {return num !== i})
    document.getElementById(`ch-${num}`).remove()
}

function getChannel(num) {
    let c = document.getElementById(`color-list-${num}`).value
    let i = Number(document.getElementById(`instrument-list-${num}`).value)
    let s = Number(document.getElementById(`start-pitch-${num}`).value)
    let e = Number(document.getElementById(`end-pitch-${num}`).value)
    state.channels[num] = {color: c, instrument: i, startPitch: s, endPitch: e}
}
const selectInstrument = (e) => {
    let list = e.currentTarget.id
    let num = Number(list.substring(16))
    let instrument = Number(document.getElementById(`instrument-list-${num}`).value)
    state.channels[num].instrument = instrument
}
const selectColor = (e) => {
    let list = e.currentTarget.id
    let num = Number(list.substring(11))
    let color = document.getElementById(`color-list-${num}`).value
    state.channels[num].color = color
}
const selectStartPitch = (e) => {
    let list = e.currentTarget.id
    let num = Number(list.substring(12))
    let option = document.getElementById(`start-pitch-${num}`)
    let startPitch = Number(option.value)
    state.channels[num].startPitch = startPitch
    if(startPitch > state.channels[num].endPitch) {
        state.channels[num].startPitch = state.channels[num].endPitch
        option.value = state.channels[num].endPitch
    }
}
const selectEndPitch = (e) => {
    let list = e.currentTarget.id
    let num = Number(list.substring(10))
    let option = document.getElementById(`end-pitch-${num}`)
    let endPitch = Number(option.value)
    state.channels[num].endPitch = endPitch
    if(endPitch < state.channels[num].startPitch) {
        state.channels[num].endPitch = state.channels[num].startPitch
        option.value = state.channels[num].startPitch
    }
}
const toggleHelp = () => {
    let help = document.getElementById('help')
    let helpBtn = document.getElementById('help-btn')
    help.classList.toggle('hide')
    helpBtn.classList.toggle('hide')
}

const startFrames = () => {state.timerId = setInterval(() => update(), 1000/settings.framerate)}

function keyboardInputs() {
    
    if(!state.keyPresses['Shift'] && state.keyPresses['Backspace'] && state.lines.length > 0) {
        if(state.point.x !== -1) {
            state.point = {x:-1, y:-1}
        } else {
            state.lines.pop()
        }
        state.keyPresses['Backspace'] = false
    }
    if(state.keyPresses['Shift'] && state.keyPresses['Backspace'] && state.droppers.length > 1) {
        state.droppers.pop()
        state.keyPresses['Shift'] = false
        state.keyPresses['Backspace'] = false
    }
    if(state.keyPresses[' ']) {
        state.isPaused = !state.isPaused
        state.keyPresses[' '] = false
    }
}

function update() {

    if(!state.isPaused) {
        state.frameCounter++
        // update ball physics
        state.balls.forEach((ball) => {
            ball.x += ball.velX
            ball.y += ball.velY
            ball.velY += settings.gravity
        })
    }
    keyboardInputs()
    // update canvas resolution on window size changes
    if(settings.width !== window.innerWidth && settings.height !== window.innerHeight - settings.menuHeight) {
        setCanvasResolution()
    }
    // check each dropper's ball drop timer
    if(state.frameCounter % settings.droprate === 0) {
        state.droppers.forEach(dropper => addBall(dropper))    
    }
    // filter out balls that fall off the screen
    state.balls = state.balls.filter((ball) => {
        if(ball.y > settings.height || ball.x < 0 || ball.x > settings.width) {
            return false
        }
        return true
    })
    // check collisions between lines and balls
    for(let b = 0; b < state.balls.length; b++) {
        for(let l = 0; l < state.lines.length; l++) {
            let ballPos = {x:state.balls[b].x, y:state.balls[b].y}
            let line = state.lines[l]
            // if the sum of the distances between the ball and pt1, and ball and pt2 is 
            // reasonably close to the distance between pt1 and pt2, then we can claim intersection
            let lineDistance = getDistance(line.p1, line.p2) 
            let distance1 = getDistance(ballPos, line.p1)
            let distance2 = getDistance(ballPos, line.p2)
            // Collision Detected
            if (distance1 + distance2 - lineDistance <= settings.collision) {
                state.balls[b] = handleBounce(state.balls[b], line, lineDistance)
            }
        }
    }
    paintCanvas()
}

const addBall = dropper => {state.balls.push({x: dropper.x, y: dropper.y, velX: 0, velY: settings.gravity, color: '#333'})}

function getDistance(p1, p2) {
    let x = p2.x - p1.x
    let y = p2.y - p1.y
    return Math.sqrt(x*x + y*y)
}

function handleBounce(ball, line, lineLength) {
    let lineAngle = Math.atan2(line.p2.y-line.p1.y,line.p2.x-line.p1.x)
    let ballAngle = Math.atan2(ball.velY, ball.velX)
    if (ballAngle <= 0) {
        ballAngle += Math.PI
    }
    else {
        ballAngle -= Math.PI
    }
    let lineNormal = lineAngle - Math.PI*.5
    if (ballAngle > 0) {
        lineNormal = lineAngle + Math.PI*.5        
    }
    let reflectionAngle = 2*lineNormal - ballAngle
    
    let velocityVector = Math.sqrt(ball.velX*ball.velX + ball.velY*ball.velY)
    ball.velX = Math.cos(reflectionAngle) * velocityVector
    ball.velY = Math.sin(reflectionAngle) * velocityVector
    //set ball color to the line's color after bounce
    ball.color = state.channels[line.channel].color
    playNotes(line.channel, velocityVector, lineLength)
    return ball
}

function playNotes(channel, velocityVector, lineLength) {
    let note = null
    let {instrument, startPitch, endPitch} = state.channels[channel]
    let numNotes = endPitch - startPitch + 1
    switch(settings.pitch) {
        case 'random':
            note = Math.floor(Math.random() * numNotes) + startPitch
            break
        case 'cosine':
            note = Math.floor(Math.abs(Math.cos(velocityVector) * numNotes)) + startPitch
            break
        case 'line-length':
            note = Math.floor(lineLength/8)
            if(note > startPitch + numNotes - 1) {
                note = startPitch + numNotes - 1
            }
            note = startPitch + numNotes - 1 - note
            break
        case 'exponential':
            let alpha = numNotes / Math.pow(settings.maxVelocity, 2)
            note = Math.floor(alpha * velocityVector * velocityVector) + startPitch
            break
        default: // Logarithmic
            note = Math.floor(Math.log10(velocityVector) * numNotes) + startPitch
            break
    }
    if (note > endPitch) {
        note = endPitch
    }
    // Update pitch label and trigger note
    doc.menu[4].label.innerHTML = NOTES[note]
    doc.synth[instrument].triggerAttackRelease(NOTES[note], '4n')
}

const getColorByChannel = (num) => {return state.channels[num].color}

function paintCanvas() {
    clearCanvas()  

    if(state.settingDropper) {
        state.settingDropper.x = state.mousePos.x
        state.settingDropper.y = state.mousePos.y
        drawBall(state.settingDropper, '#666')
    }
    state.droppers.forEach(dropper => drawBall(dropper, '#666'))
    
    // draw line after point is placed
    if(state.point.x !== -1) {
        doc.ctx.fillStyle = getColorByChannel(state.currentChannel)
        doc.ctx.fillRect(state.point.x-1, state.point.y-1, 3, 3)
        doc.ctx.fillRect(state.mousePos.x-1, state.mousePos.y-1, 3, 3)
        let line = {
            p1: state.point,
            p2: state.mousePos,
            channel:state.currentChannel
        }
        drawLine(line)
    }
    // draw completed lines
    state.lines.forEach(drawLine)

    // draw balls
    state.balls.forEach(ball => drawBall(ball, ball.color))
}

function setCanvasResolution() {
    settings.width = window.innerWidth
    settings.height = window.innerHeight - settings.menuHeight
    doc.canvas.width = settings.width
    doc.canvas.height = settings.height
}

function clearCanvas() {
    doc.ctx.fillStyle = settings.backgroundColor
    doc.ctx.fillRect(0, 0, settings.width, settings.height)
}

function drawLine(line) {
    doc.ctx.beginPath()
    doc.ctx.strokeStyle = getColorByChannel(line.channel)
    doc.ctx.moveTo(line.p1.x, line.p1.y)
    doc.ctx.lineTo(line.p2.x, line.p2.y)
    doc.ctx.stroke()
}

function drawBall(ball, color='#333') {
    let r = settings.ballradius
    doc.ctx.fillStyle = color
    doc.ctx.fillRect(ball.x - r, ball.y - r, r*2, r*2)
}