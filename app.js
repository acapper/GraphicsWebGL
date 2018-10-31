var readTextFile = function(file, call) {
	var rawFile = new XMLHttpRequest();
	rawFile.open('GET', file, true);
	rawFile.onreadystatechange = function() {
		if (rawFile.readyState === 4) {
			if (rawFile.status === 200 || rawFile.status == 0) {
				var allText = rawFile.responseText;
				call(allText);
			}
		}
	};
	rawFile.send(null);
};

var gl;
var Init = function() {
	var proms = loadAll([
		'texture.png',
		'texture2.png',
		'texture3.png',
		'shaders/vert.vert',
		'shaders/frag.frag',
		'shaders/light.frag',
		'models/T34/T34.json',
		'models/lowpolydeer/deer.json',
		'models/sphere/sphere.json',
		'models/TankShell/TankShell.json'
	]);

	Promise.all(proms).then(promsR => {
		var canvas = document.getElementById('mycanvas');
		gl = canvas.getContext('webgl');

		if (!gl) {
			gl = canvas.getContext('experimental-webgl');
		}

		if (!gl) {
			alert('Your browser does not support WebGL');
		}

		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);
		gl.frontFace(gl.CCW);
		gl.cullFace(gl.BACK);

		var shader = new Shader(gl, promsR[3], promsR[4]);
		var lightshader = new Shader(gl, promsR[3], promsR[5]);
		Run(
			promsR[0],
			promsR[1],
			promsR[2],
			shader,
			lightshader,
			promsR[6],
			promsR[7],
			promsR[8],
			promsR[9]
		);
	});
};

var identityMat = new Float32Array(16);
mat4.identity(identityMat);

var world = new Float32Array(16);
var view = new Float32Array(16);
var proj = new Float32Array(16);
var temp = new Float32Array(16);

var viewPos = [0, 3, -5];
var viewLook = [0, 3, 0];
var viewUp = [0, 1, 0];

var worldTrans = [0, 0, 0];

var lights = [];
var redLight;
var blueLight;
var lightsJSON;

var light;
var tank;
var deer;
var model;

var camera;

const fpsElem = document.querySelector('#fps');

var Run = function(
	texture,
	texture2,
	texture3,
	shader,
	lightshader,
	modeljson,
	deerjson,
	spherejson,
	bulletjson
) {
	camera = new Camera({
		viewPos: viewPos,
		viewLook: viewLook,
		viewUp: viewUp
	});

	deer = new Model({
		gl,
		texture: texture,
		model: deerjson,
		shader: shader,
		rotation: [-90, 0, 0],
		scale: [0.003, 0.003, 0.003],
		translation: [5, 0, 0]
	});

	model = new Model({
		gl,
		texture: texture,
		model: modeljson,
		shader: shader,
		rotation: [0, 180, 0],
		scale: [0.006, 0.006, 0.006],
		translation: [0, 0, 0]
	});

	light = new Light(
		{
			gl,
			texture: texture,
			model: spherejson,
			shader: lightshader,
			rotation: [0, 0, 0],
			scale: [0.25, 0.25, 0.25],
			translation: [2, 1, 0]
		},
		{ name: 'red', colour: [1, 0, 0], direction: [0, 0, 0], on: 1 }
	);

	lights.push(light);

	mat4.identity(world);
	view = camera.getCameraMat();
	mat4.perspective(proj, glMatrix.toRadian(90), 1280 / 960, 0.1, 10000.0);

	requestAnimationFrame(draw);
};

var then = 0;
var draw = function(now) {
	now *= 0.001; // convert to seconds
	const deltaTime = now - then; // compute time since last frame
	then = now; // remember time for next frame
	const fps = 1 / deltaTime; // compute frames per second
	fpsElem.textContent = fps.toFixed(1); // update fps display

	update(deltaTime);
	render(deltaTime);
	requestAnimationFrame(draw);
	now = null;
};

var rotMat = mat4.create();
var scaleMat = mat4.create();
var transMat = mat4.create();
var render = function(delta) {
	gl.clearColor(0.1, 0.1, 0.1, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	world = mat4FromRotTransScale(world, [0, 0, 0], [0, 0, 0], [1, 1, 1]);

	lights.forEach(e => {
		e.draw(gl, world, view, proj, lightsJSON);
	});
	model.draw(gl, world, view, proj, lightsJSON);
	deer.draw(gl, world, view, proj, lightsJSON);
	delta = null;
};

var update = function(delta) {
	lightsJSON = getLightJSON();
	keyboard(delta);
	lights.forEach(e => {
		e.update();
	});
	model.update();
	deer.update();
	delta = null;
};

var camrot = 0;

var keyboard = function(delta) {
	camrot = 30;
	var cameraTrans = [0, 0, 0];
	if (keys['U'.charCodeAt(0)]) {
		cameraTrans[2] += 0.5 * delta;
	}
	if (keys['J'.charCodeAt(0)]) {
		cameraTrans[2] -= 0.5 * delta;
	}
	if (keys['H'.charCodeAt(0)]) {
		cameraTrans[0] += 0.5 * delta;
	}
	if (keys['K'.charCodeAt(0)]) {
		cameraTrans[0] -= 0.5 * delta;
	}
	if (keys['O'.charCodeAt(0)]) {
		cameraTrans[1] += 0.5 * delta;
	}
	if (keys['L'.charCodeAt(0)]) {
		cameraTrans[1] -= 0.5 * delta;
	}
	if (keys['M'.charCodeAt(0)]) {
		camera = new Camera({
			viewPos: viewPos,
			viewLook: viewLook,
			viewUp: viewUp
		});
	}
	camera.transCamera(cameraTrans);
	camera.rotateViewPos([0, camrot * delta, 0]);
	camera.rotateLookAt([0, 0, 0]);
	view = camera.getCameraMat();
	if (keys['T'.charCodeAt(0)]) {
		var pos = lights[0].getLightPos();
		pos[2] += 0.5 * delta;
		lights[0].setLightPos(pos);
	}
	if (keys['G'.charCodeAt(0)]) {
		var pos = lights[0].getLightPos();
		pos[2] -= 0.5 * delta;
		lights[0].setLightPos(pos);
	}
	if (keys['R'.charCodeAt(0)]) {
		var pos = lights[0].getLightPos();
		pos[0] += 0.5 * delta;
		lights[0].setLightPos(pos);
	}
	if (keys['Y'.charCodeAt(0)]) {
		var pos = lights[0].getLightPos();
		pos[0] -= 0.5 * delta;
		lights[0].setLightPos(pos);
	}
	if (keys['5'.charCodeAt(0)]) {
		var pos = lights[0].getLightPos();
		pos[1] -= 0.5 * delta;
		lights[0].setLightPos(pos);
	}
	if (keys['6'.charCodeAt(0)]) {
		var pos = lights[0].getLightPos();
		pos[1] += 0.5 * delta;
		lights[0].setLightPos(pos);
	}
};
var c = [];
var d = [];
var p = [];
var on = [];

var getLightJSON = function() {
	c = [];
	d = [];
	p = [];
	on = [];

	lights.forEach(e => {
		c = c.concat(e.getColour());
		d = d.concat(e.getDirection());
		p = p.concat(e.getPosition());
		on = on.concat(e.getOn());
	});

	return {
		c,
		d,
		p,
		on
	};
};

var keys = [];

window.addEventListener(
	'keydown',
	function(e) {
		keys[e.keyCode] = true;
		//console.log(e.keyCode);
	},
	false
);

window.addEventListener(
	'keyup',
	function(e) {
		keys[e.keyCode] = false;
	},
	false
);

$("[name='redLight']").change(function() {
	if (this.checked) {
		lights.forEach(e => {
			if (e.getName() == 'red') {
				e.setOn(1);
			}
		});
	} else {
		lights.forEach(e => {
			if (e.getName() == 'red') {
				e.setOn(0);
			}
		});
	}
	lightsJSON = getLightJSON();
});

$("[name='blueLight']").change(function() {
	if (this.checked) {
		lights.forEach(e => {
			if (e.getName() == 'blue') {
				e.setOn(1);
			}
		});
	} else {
		lights.forEach(e => {
			if (e.getName() == 'blue') {
				e.setOn(0);
			}
		});
	}
	lightsJSON = getLightJSON();
});
