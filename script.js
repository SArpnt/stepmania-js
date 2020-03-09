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
	var out = {}
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
	for (i in sm) {
		var p = sm[i]
		switch (p[0]) {
			case '#MUSIC':
				out.audio = new Audio(chartPath + p[1])
				break
			case '#NOTES':
				let steps = p[6]
				steps = steps.split(',')
				for (let i in steps) {
					if (steps[i].length % 4) // if length is not divisible by 4
						throw `Invalid length on measure ${i}, ${steps[i].length}, ${steps[i]}`
					steps[i].split(/.{4}/g)
					console.log(steps[i])
				}
				console.log(steps)
				break
			default:
				console.log(`Unrecognised sm property "${p[0]}"`)
		}
	}
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