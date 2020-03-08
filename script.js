const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

var chartPath='./Songs/WinDEU Hates You Forever/Sebben Crudele/'
var audio = new Audio(chartPath+'Sebben Crudele.ogg')

function step() {

	window.setTimeout(step, 8.333333333333334) //120 tps
	document.getElementById("tps").innerHTML = Math.round(1000 / 8.333333333333334)
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

canvas.onclick = function () {
	audio.play()
	step()
	requestAnimationFrame(draw)
	canvas.onclick = ''
}
ctx.fillStyle = "black"
ctx.fillRect(0, 0, 640, 480)