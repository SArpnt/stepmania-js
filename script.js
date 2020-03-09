const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

var startTime
var step
{
	var tpsC = 0
	var now = 0
	step = function () {
		tpsC = now
		now = performance.now() - startTime
		document.getElementById("tps").innerHTML = Math.round(1000 / (now - tpsC))
		window.setTimeout(step, 8.333333333333334) //120 tps
	}
}
var lastMs = 0
function draw(ms) {
	ctx.fillStyle = "magenta"
	ctx.fillRect(0, 0, 640, 480)//temporary background

	document.getElementById("fps").innerHTML = Math.round(1000 / (ms - lastMs))//fps counter
	lastMs = ms

	requestAnimationFrame(draw)
}

addEventListener("keydown", press(true))
addEventListener("keyup", press(false))

var keyInput = [
	{
		up: false,
		down: false,
		left: false,
		right: false
	},
	{
		up: false,
		down: false,
		left: false,
		right: false
	}
]

function press(v) {
	return function (key) {
		switch (key.code) {
			case "ArrowUp":
				keyInput[1].up = v; break
			case "ArrowDown":
				keyInput[1].down = v; break
			case "ArrowLeft":
				keyInput[1].left = v; break
			case "ArrowRight":
				keyInput[1].right = v; break
		}
	}
}

var chartPath = 'https://tumpnt.github.io/stepmania-js/Songs/WinDEU Hates You Forever/Sebben Crudele/'
{
	var xhr = new XMLHttpRequest()
	xhr.onreadystatechange = function () {
		if (xhr.readyState == 4 && xhr.status == 200) {
			let data = parseSM(xhr.responseText)

			canvas.onclick = () => {
				startGame(data)
				canvas.onclick = null
			}
		}
	}
	xhr.open('GET', chartPath + 'Sebben Crudele.sm')
	xhr.send()
}
function parseSM(sm) {
	var out = {notes:[]}
	sm = sm.replace(/\/\/.*/g, '')
		.replace(/\r?\n|\r/g, '')
		.split(';')
	for (let i = sm.length - 1; i >= 0; i -= 1) {
		if (sm[i]) {
			sm[i] = sm[i].split(/:/g)
			for (let p in sm[i])
				sm[i][p] = sm[i][p].trim()
		}
		else
			sm.splice(i, 1)
	}
	var steps
	var bpms
	for (i in sm) {
		let p = sm[i]
		switch (p[0]) {
			case '#MUSIC':
				out.audio = new Audio(chartPath + p[1])
				break
			case '#BPMS':
				bpms = p[1].split('=')//doesn't work with bpm changes
				break
			case '#NOTES':
				steps = p[6].split(',') //only grabs first difficulty
				break
			default:
				console.log(`Unrecognised sm property "${p[0]}"`)
		}
	}
	/*{
		let t = [steps, bpms]
		for (let i in t)
			if (!t[i]) throw `Missing neccesary info (${t[i]})`
	}*/
	{
		let unfinHolds = [undefined, undefined, undefined, undefined]
		for (let m in steps) { // m for measure
			steps[m] = steps[m].trim()
			if (steps[m].length % 4) // if length is not divisible by 4
				throw `Invalid length on measure ${m}, ${steps[m].length}, ${steps[m]}`
			steps[m] = steps[m].match(/(.{4})/g)

			let t = steps[m].length // t for time (time between notes)
			for (let l in steps[m]) { // l for line
				let nt = steps[m][l]
				let note = [{}, {}, {}, {}]
				let b = m * l * t // for efficiency
				for (let d = 0; d < note.length; d++) { // d for direction
					switch (nt[d]) {
						case '3':
							if (!unfinHolds[d]) throw `hold end without any hold before at measure ${m}, line ${l}`
							out.notes[unfinHolds[d]].beatend = b
							// add more hold end script
							delete unfinHolds[d]
						case '0':
							note.splice(d, 1)
							d--
							continue
						case '4':
						case '2':
							if (unfinHolds[d]) throw `new hold started before last ended at measure ${m}, line ${l}`
							unfinHolds[d] = out.notes.length + d
						case '1':
						case 'M':
							note[d].type = nt[d]
							break
						default:
							throw `invalid note type ${nt[d]} at measure ${m}, line ${l}`
					}
					note[d].beat = b
					note[d].column = d
				}
				out.notes = out.notes.concat(note)
			}
		}
	}
	console.log(out.notes)
	return out
}

function startGame({ audio, notes }) {
	if (audio) audio.play()
	startTime = performance.now()
	step()
	requestAnimationFrame(draw)
}

ctx.fillStyle = "black"
ctx.fillRect(0, 0, 640, 480)