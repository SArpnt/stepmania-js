"use strict";

const canvas = document.getElementById('canvas'),
	ctx = canvas.getContext('2d');
//const gl = canvas.getContext('webgl')
//if (!gl) alert("Unable to initialize WebGL. Your browser or machine may not support it.");

function getLastStop(time, valueType) {
	return stops.find((e, i, a) => (i + 1 == a.length) || (a[i + 1][valueType] >= time));
}
function getLastBpm(time, valueType) {
	return bpmChanges.find((e, i, a) => (i + 1 == a.length) || (a[i + 1][valueType] >= time));
}
function secToBeat(sec) {
	let b = getLastBpm(sec, 'sec');
	let s = stops
		.filter(({ sec: i }) => (i >= b.sec) && (i < sec))
		.map(i => (i.sec + i.len > sec) ? (sec - i.sec) : i.len);
	for (let i in s)
		sec -= s[i];
	return ((sec - b.sec) * b.bpm / 60) + b.beat;
}
function beatToSec(beat) {
	let b = getLastBpm(beat, 'beat');
	let x = ((beat - b.beat) / b.bpm * 60) + b.sec;
	let s = stops
		.filter(({ beat: i }) => (i >= b.beat) && (i < beat))
		.map(i => i.len);
	for (let i in s) {
		x += s[i];
	}
	return x;
}

function startGame({ audio, offset }) {
	if (audio) audio.play();
	else console.warn(`No audio found`);
	startTime = performance.now() - offset * 1000;
	step();
	requestAnimationFrame(draw);
}

let startTime,
step,
draw;
{
	const elems = {
		bpm: document.getElementById('bpm'),
		beat: document.getElementById('beat'),
		sec: document.getElementById('sec'),
		fps: document.getElementById('fps'),
		tps: document.getElementById('tps'),
	};
	let
		tpsC = 0,
		fpsC = 0,
		getSec = () => (performance.now() - startTime) / 1000;

	step = function () {
		window.setTimeout(step, 0);
		let now = getSec();
		elems.tps.innerHTML = Math.round(1 / (now - tpsC));
		tpsC = now;
	};

	draw = function () {
		requestAnimationFrame(draw);
		let
			sec = getSec(),
			beat = secToBeat(sec),
			size = 32, //temporary render variable
			xMod = 4, //temporary render variable
			cMod = 480 / 60; //temporary render variable
		ctx.fillStyle = "#000000";
		ctx.fillRect(0, 0, 640, 480); //temporary background
		ctx.fillStyle = "#666666";
		for ( //bar lines
			let i = Math.ceil(beat / 4) * 4;
			i < (Math.ceil(beat / 4) + 8) * 4;
			i += 4
		) {
			ctx.fillRect(
				0 * size,
				(i - beat) * xMod * size,
				size * 4,
				size / 4
			);
			ctx.fillRect(
				5 * size,
				(beatToSec(i) - sec) * cMod * size,
				size * 4,
				size / 4
			);
		}

		const noteTimings = {
			4: '#ff0000',
			8: '#0000ff',
			12: '#8800ff',
			16: '#00ff00',
			24: '#8800ff',
			32: '#ffff00',
			48: '#8800ff',
			64: '#00ffff',
			192: '#00ffff',
			def: '#888888',
		};
		function renderNote(note) { //notes
			if (note.sec - sec > 0)
				ctx.fillStyle = {
					'M': _ => '#880000',
					'1': function () {
						let b = note.beat;

						for (let t in noteTimings)
							if ((b + 1e-4) % (4 / t) < 1e-4)
								return noteTimings[t];

						return noteTimings.def;
					},
					'2': _ => '#00ffff',
					'4': _ => '#00ff00',
				}[note.type]();
			else
				ctx.fillStyle = '#ff00ff';

			ctx.fillRect(
				note.column * size,
				(note.beat - beat) * xMod * size,
				size,
				(note.beatLength * xMod * size || 0) + size);
			ctx.fillRect(
				(5 + note.column) * size,
				(note.sec - sec) * cMod * size,
				size,
				(note.secLength * cMod * size || 0) + size
			);
		}
		notes.forEach(renderNote);

		elems.fps.innerHTML = Math.round(1 / (sec - fpsC));
		{
			elems.bpm.innerHTML = getLastBpm(sec, 'sec').bpm;
			let y = getLastStop(sec, 'sec');
			elems.bpm.style = `color:${y && (y.sec + y.len > sec) ? '#ff0000' : '#000000'}`;
		}
		fpsC = sec;

		elems.sec.innerHTML = sec;
		elems.beat.innerHTML = beat;
	};
}

addEventListener("keydown", press(true));
addEventListener("keyup", press(false));

let keyInput = [
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
];

function press(v) {
	return function (key) {
		switch (key.code) {
			case "ArrowUp":
				keyInput[1].up = v; break;
			case "ArrowDown":
				keyInput[1].down = v; break;
			case "ArrowLeft":
				keyInput[1].left = v; break;
			case "ArrowRight":
				keyInput[1].right = v; break;
		}
	};
}

let bpmChanges,
	stops,
	notes = [],
	chartFiles;
{
	function parseSM(sm) {
		let out = {};
		sm = sm.replace(/\/\/.*/g, '')
			.replace(/\r?\n|\r/g, '')
			.split(';');
		for (let i = sm.length - 1; i >= 0; i -= 1) {
			if (sm[i]) {
				sm[i] = sm[i].split(/:/g);
				for (let p in sm[i])
					sm[i][p] = sm[i][p].trim();
			}
			else
				sm.splice(i, 1);
		}
		let steps = [];
		bpmChanges = [];
		stops = [];
		for (let i in sm) {
			let p = sm[i];
			switch (p[0]) {
				case '#MUSIC':
					out.audio = new Audio(URL.createObjectURL(chartFiles[p[1].toLowerCase()]));
					break;
				case '#OFFSET':
					out.offset = Number(p[1]);
					break;
				case '#BPMS':
					{
						let bx = p[1].split(','); // bpm list
						bx = bx.filter(i => /=/.exec(i));
						for (let i in bx) {
							let v = bx[i].split('=');
							bx[i] = {
								beat: Number(v[0]),
								bpm: Number(v[1])
							};
						}
						bpmChanges = bpmChanges.concat(bx);
					}
					break;
				case '#STOPS':
					{
						let bx = p[1].split(','); // stop list
						bx = bx.filter(i => i.includes('='));
						for (let i in bx) {
							let v = bx[i].split('=');
							bx[i] = {
								beat: Number(v[0]),
								len: Number(v[1])
							};
						}
						stops = stops.concat(bx);
						break;
					}
				case '#NOTES':
					if (p[3] == document.getElementById('difficulty').value)
						steps = p[6].split(',');
					break;
				default:
					console.debug(`Unrecognised sm property "${p[0]}"`);
			}
		}
		{
			let t = [[steps, '#NOTES'], [bpmChanges.length, '#BPMS']];
			for (let i in t)
				if (!t[i][0]) throw `Missing neccesary info (${t[i][1]})`;
		}
		{ //bpm and stop processing
			bpmChanges.sort((a, b) => a.beat - b.beat);
			if (bpmChanges[0].beat !== 0) throw `No starting bpm, first bpm change is ${bpmChanges[0]}`;
			bpmChanges.sort((a, b) => a.beat - b.beat);
			bpmChanges[0].sec = 0;
			for (let i = 1; i < bpmChanges.length; i++) {
				bpmChanges[i].sec = beatToSec(bpmChanges[i].beat);
			}
			for (let i = 0; i < stops.length; i++) {
				stops[i].sec = beatToSec(stops[i].beat);
			}
		}
		{ //note processing
			let unfinHolds = [null, null, null, null];
			for (let m in steps) { // m for measure
				steps[m] = steps[m].trim();
				if (steps[m].length % 4) // if length is not divisible by 4
					throw `Invalid length on measure ${m}, length is ${steps[m].length}, full string: ${steps[m]}`;
				steps[m] = steps[m].match(/(.{4})/g);

				let t = steps[m].length; // t for time (time between notes)
				for (let l in steps[m]) { // l for line
					let nt = steps[m][l];
					let note = [{}, {}, {}, {}];
					let b = m * 4 + l / t * 4; // for efficiency
					for (let c = 0; c < note.length; c++) { // c for column
						switch (nt[c]) {
							case '3':
								if (unfinHolds[c] == null) throw `hold end without any hold before at measure ${m}, line ${l}`;
								{
									let i = notes[unfinHolds[c]];
									i.beatEnd = b;
									i.beatLength = b - i.beat;
									i.secEnd = beatToSec(b);
									i.secLength = beatToSec(b) - beatToSec(i.beat);
								}
								// add more hold end script
								unfinHolds[c] = null;
							case '0':
								note[c] = null;
								continue;
							case '4':
							case '2':
								if (unfinHolds[c]) throw `new hold started before last ended at measure ${m}, line ${l}`;
								unfinHolds[c] = notes.length + c;
							case '1':
							case 'M':
								note[c].type = nt[c];
								break;
							default:
								throw `invalid note type ${nt[c]} at measure ${m}, line ${l}`;
						}
						note[c].beat = b;
						note[c].sec = beatToSec(b);
						note[c].column = c;
					}
					notes = notes.concat(note);
				}
			}
			notes = notes.filter(i => i !== null);
		}
		return out;
	}
	document.getElementById('startButton').onclick = function () {
		this.disabled = true;
		{
			let CFRO = document.getElementById('chartFile').files;
			chartFiles = {};
			for (let i = 0; i < CFRO.length; i++) {
				let x = CFRO[i].name.toLowerCase();
				chartFiles[x] = CFRO[i];
			}
		}
		let sm;
		for (let i in chartFiles)
			if (/.sm$/.exec(i)) {
				if (sm) throw `2 .sm files, ${sm} & ${i}`;
				else sm = i;
			}

		let reader = new FileReader();
		reader.onload = ({ target: { result } }) => {
			let data = parseSM(result);
			let sG;
			sG = function () {
				data.audio.removeEventListener('canplaythrough', sG);
				startGame(data);
			};
			data.audio.addEventListener('canplaythrough', sG);
		};
		reader.readAsText(chartFiles[sm]);
	};
}
ctx.fillStyle = "grey";
ctx.fillRect(0, 0, 640, 480);