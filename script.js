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

var chartPath = './Songs/WinDEU Hates You Forever/Sebben Crudele/'
{
	var xhr = new XMLHttpRequest()
	xhr.onreadystatechange = function () {
		if (xhr.readyState == 4 && xhr.status == 200) {
			canvas.onclick = () => {
				startGame(xhr.responseText)
				canvas.onclick = null
			}
		}
	}
	xhr.open('GET', chartPath + 'Sebben Crudele.sm')
	xhr.send()
}

function startGame(sm) {
	var audio = new Audio(chartPath + 'Sebben Crudele.ogg')
	console.log(sm)

	audio.play()
	startTime = performance.now()
	step()
	requestAnimationFrame(draw)
}

ctx.fillStyle = "black"
ctx.fillRect(0, 0, 640, 480)