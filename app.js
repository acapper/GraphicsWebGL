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

var Init = function() {
	var image = loadImage('texture.png');
	var image2 = loadImage('texture2.png');
	var vsText = loadTextResource('shaders/vert.vert');
	var fsText = loadTextResource('shaders/frag.frag');
	var lfsText = loadTextResource('shaders/light.frag');
	var model = loadJSONResource('models/T34/T34.json');
	var deer = loadJSONResource('models/lowpolydeer/deer.json');
	var sphere = loadJSONResource('models/sphere/sphere.json');

	return Promise.all([
		image,
		image2,
		vsText,
		fsText,
		lfsText,
		model,
		deer,
		sphere
	]).then(
		([
			imageR,
			image2R,
			vsTextR,
			fsTextR,
			lfsTextR,
			modelR,
			deerR,
			sphereR
		]) => {
			var canvas = document.getElementById('mycanvas');
			var gl = canvas.getContext('webgl');

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

			var shader = new Shader(gl, vsTextR, fsTextR);
			var lightshader = new Shader(gl, vsTextR, lfsTextR);
			Run(
				gl,
				imageR,
				image2R,
				shader,
				lightshader,
				modelR,
				deerR,
				sphereR
			);
		}
	);
};

var identityMat = new Float32Array(16);
mat4.identity(identityMat);

var world = new Float32Array(16);
var view = new Float32Array(16);
var proj = new Float32Array(16);
var temp = new Float32Array(16);

var viewPos = [0, 3, -4];
var viewLook = [0, 0, 0];
var viewUp = [0, 1, 0];

var worldTrans = [0, 0, 0];

var bomb;

var Run = function(
	gl,
	texture,
	texture2,
	shader,
	lightshader,
	modeljson,
	deerjson,
	spherejson
) {
	var s = [0.1, 0.1, 0.1];
	var r = [0, 90, 0];
	var t = [0, 0, 0];

	var light = new Light(
		{ colour: [1, 1, 1], direction: [1, 0, 0] },
		{
			gl,
			modeljson: spherejson,
			texture,
			shader: lightshader,
			s,
			r,
			t,
			meshIndices: null
		}
	);

	var s = [0.006, 0.006, 0.006];
	var r = [0, 90, 0];
	var t = [0, 0, -3];

	var tankTop = [0, 2, 3, 7, 9, 10, 13];
	var tankBot = [1, 4, 5, 6, 8, 11, 12, 14];

	var bs = [0.1, 0.1, 0.1];
	var br = [0, 0, 0];
	var bt = [0, 0, 0];

	var tank = new Tank(
		{
			gl,
			modeljson: modeljson,
			texture: texture2,
			shader,
			s,
			r,
			t,
			meshIndices: tankTop
		},
		{
			gl,
			modeljson: modeljson,
			texture: texture2,
			shader,
			s,
			r,
			t,
			meshIndices: tankBot
		},
		[
			{ colour: [1, 0.6, 0], direction: [1, 0, 0] },
			{
				gl,
				modeljson: spherejson,
				texture: texture,
				shader: lightshader,
				s: bs,
				r: br,
				t: bt,
				meshIndices: null
			}
		]
	);

	var s = [0.0015, 0.0015, 0.0015];
	var r = [90, 180, 270];
	var t = [0, -2, 0];
	var deer = new Model({
		gl,
		modeljson: deerjson,
		texture: texture,
		shader,
		s,
		r,
		t,
		meshIndices: null
	});

	const fpsElem = document.querySelector('#fps');

	mat4.identity(world);
	mat4.lookAt(view, viewPos, viewLook, viewUp);
	mat4.perspective(proj, glMatrix.toRadian(90), 1280 / 960, 0.1, 10000.0);

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
	};
	requestAnimationFrame(draw);

	var render = function(delta) {
		gl.clearColor(0.1, 0.1, 0.1, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		world = identityMat;

		tank.draw(world, view, proj, light);
		deer.draw(world, view, proj, light);
		light.draw(world, view, proj, light);
	};

	var update = function(delta) {
		keyboard(delta);
		tank.update(delta);
		deer.update(delta);
	};

	var keyboard = function(delta) {
		if (keys['U'.charCodeAt(0)]) {
			viewPos[2] += 0.5 * delta;
			viewLook[2] += 0.5 * delta;
			mat4.lookAt(view, viewPos, viewLook, viewUp);
		}
		if (keys['J'.charCodeAt(0)]) {
			viewPos[2] -= 0.5 * delta;
			viewLook[2] -= 0.5 * delta;
			mat4.lookAt(view, viewPos, viewLook, viewUp);
		}
		if (keys['H'.charCodeAt(0)]) {
			viewPos[0] += 0.5 * delta;
			viewLook[0] += 0.5 * delta;
			mat4.lookAt(view, viewPos, viewLook, viewUp);
		}
		if (keys['K'.charCodeAt(0)]) {
			viewPos[0] -= 0.5 * delta;
			viewLook[0] -= 0.5 * delta;
			mat4.lookAt(view, viewPos, viewLook, viewUp);
		}
		if (keys['O'.charCodeAt(0)]) {
			viewPos[1] += 0.5 * delta;
			viewLook[1] += 0.5 * delta;
			mat4.lookAt(view, viewPos, viewLook, viewUp);
		}
		if (keys['L'.charCodeAt(0)]) {
			viewPos[1] -= 0.5 * delta;
			viewLook[1] -= 0.5 * delta;
			mat4.lookAt(view, viewPos, viewLook, viewUp);
		}
		if (keys['M'.charCodeAt(0)]) {
			viewPos = [0, 3, -4];
			viewLook = [0, 0, 0];
			mat4.lookAt(view, viewPos, viewLook, viewUp);
		}
		if (keys['T'.charCodeAt(0)]) {
			var pos = light.getLightPos();
			pos[2] += 0.5 * delta;
			light.setLightPos(pos);
		}
		if (keys['G'.charCodeAt(0)]) {
			var pos = light.getLightPos();
			pos[2] -= 0.5 * delta;
			light.setLightPos(pos);
		}
		if (keys['R'.charCodeAt(0)]) {
			var pos = light.getLightPos();
			pos[0] += 0.5 * delta;
			light.setLightPos(pos);
		}
		if (keys['Y'.charCodeAt(0)]) {
			var pos = light.getLightPos();
			pos[0] -= 0.5 * delta;
			light.setLightPos(pos);
		}
		if (keys['5'.charCodeAt(0)]) {
			var pos = light.getLightPos();
			pos[1] -= 0.5 * delta;
			light.setLightPos(pos);
		}
		if (keys['6'.charCodeAt(0)]) {
			var pos = light.getLightPos();
			pos[1] += 0.5 * delta;
			light.setLightPos(pos);
		}
		tank.keyboardInput(delta, keys);
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
