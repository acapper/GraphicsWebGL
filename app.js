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
		'texture4.png',
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

var worldTrans = [0, 0, 0];

var lights = [];
var redLight;
var blueLight;
var lightsJSON;

var light;
var tank;
var deer1;
var deer2;
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
	deer1 = new Model({
		gl,
		texture: texture,
		model: deerjson,
		shader: shader,
		rotation: [-90, 0, 0],
		scale: [0.002, 0.002, 0.002],
		translation: [5, 0, 0]
	});
	deer2 = new Model({
		gl,
		texture: texture,
		model: deerjson,
		shader: shader,
		rotation: [-90, 0, 0],
		scale: [0.002, 0.002, 0.002],
		translation: [-5, 0, 0]
	});

	tank = new Tank({
		gl,
		texture: texture2,
		model: modeljson,
		shader: shader,
		top: {
			rotation: [0, 0, 0],
			scale: [0.006, 0.006, 0.006],
			translation: [0, 0, -3],
			indices: [0, 2, 3, 7, 9, 10, 13]
		},
		bot: {
			rotation: [0, 0, 0],
			scale: [0.006, 0.006, 0.006],
			translation: [0, 0, -3],
			indices: [1, 4, 5, 6, 8, 11, 12, 14]
		},
		bomb: {
			texture: texture3,
			model: bulletjson,
			rotation: [0, -90, -90],
			scale: [0.05, 0.05, 0.05],
			translation: [0, 1.36, 0.2],
			light: {
				name: 'bomb',
				colour: [1, 0, 0],
				direction: [0, 0, 0],
				on: 0
			}
		},
		camera: {
			position: viewPos
		}
	});

	light = new Light(
		{
			gl,
			texture: texture,
			model: spherejson,
			shader: lightshader,
			rotation: [0, 0, 0],
			scale: [0.25, 0.25, 0.25],
			translation: [2, 3, 0]
		},
		{ name: 'red', colour: [1, 0, 0], direction: [0, 0, 0], on: 1 }
	);

	lights.push(light);

	light = new Light(
		{
			gl,
			texture: texture,
			model: spherejson,
			shader: lightshader,
			rotation: [0, 0, 0],
			scale: [0.25, 0.25, 0.25],
			translation: [-2, 3, 0]
		},
		{ name: 'blue', colour: [0, 0, 1], direction: [0, 0, 0], on: 1 }
	);
	lights.push(light);

	lights.push(tank.getBomb());

	mat4.identity(world);
	view = tank.getCamera().getCameraMat();
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
		if (e.name != 'bomb' && e.on != 0)
			e.draw(gl, world, view, proj, lightsJSON);
	});
	tank.draw(gl, world, view, proj, lightsJSON);
	deer1.draw(gl, world, view, proj, lightsJSON);
	deer2.draw(gl, world, view, proj, lightsJSON);
	delta = null;
};

var update = function(delta) {
	lightsJSON = getLightJSON();
	keyboard(delta);
	lights.forEach(e => {
		e.update();
	});
	tank.update(delta, keys);
	deer1.update();
	deer2.update();
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
	if (keys['I'.charCodeAt(0)]) {
		tank.getCamera().rotateViewPos([0, camrot * delta, 0]);
	}
	if (keys['Y'.charCodeAt(0)]) {
		tank.getCamera().rotateViewPos([0, -camrot * delta, 0]);
	}
	if (keys['P'.charCodeAt(0)]) {
		tank.getCamera().rotateViewPos([camrot * delta, 0, 0]);
	}
	if (keys[186]) {
		tank.getCamera().rotateViewPos([-camrot * delta, 0, 0]);
	}
	if (keys['M'.charCodeAt(0)]) {
		var trans = tank.getTranslation();
		var camera = new Camera({
			viewPos: [
				trans[0] + viewPos[0],
				trans[1] + viewPos[1],
				trans[2] + viewPos[2]
			],
			viewLook: tank.getTranslation(),
			viewUp: [0, 1, 0]
		});
		camera.rotateViewPos([0, 0, 0]);
		camera.rotateViewPos(tank.getRotation());
		tank.setCamera(camera);
	}
	tank.getCamera().transCamera(cameraTrans);
	tank.getCamera().rotateLookAt([0, 0, 0]);
	view = tank.getCamera().getCameraMat();
	if (keys['1'.charCodeAt(0)]) {
		var pos = lights[0].getTranslation();
		pos[2] += 0.5 * delta;
		lights[0].getTranslation(pos);
	}
	if (keys['2'.charCodeAt(0)]) {
		var pos = lights[0].getTranslation();
		pos[2] -= 0.5 * delta;
		lights[0].getTranslation(pos);
	}
	if (keys['3'.charCodeAt(0)]) {
		var pos = lights[0].getTranslation();
		pos[0] += 0.5 * delta;
		lights[0].getTranslation(pos);
	}
	if (keys['4'.charCodeAt(0)]) {
		var pos = lights[0].getTranslation();
		pos[0] -= 0.5 * delta;
		lights[0].getTranslation(pos);
	}
	if (keys['5'.charCodeAt(0)]) {
		var pos = lights[0].getTranslation();
		pos[1] -= 0.5 * delta;
		lights[0].getTranslation(pos);
	}
	if (keys['6'.charCodeAt(0)]) {
		var pos = lights[0].getTranslation();
		pos[1] += 0.5 * delta;
		lights[0].getTranslation(pos);
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
