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
	var vsText = loadTextResource('shaders/vert.vert');
	var fsText = loadTextResource('shaders/frag.frag');
	var model = loadJSONResource('models/T34/T34.json');
	//var model = loadJSONResource('models/51tank/m1.json');
	//var model = loadJSONResource('models/lowpolydeer/deer.json');

	return Promise.all([image, vsText, fsText, model]).then(
		([imageR, vsTextR, fsTextR, modelR]) => {
			Run(imageR, vsTextR, fsTextR, modelR);
		}
	);
};

var Run = function(texture, vsText, fsText, modeljson) {
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

	var shader = new Shader(gl, vsText, fsText);

	var s = [0.006, 0.006, 0.006];
	var r = [0, 90, 0];
	var t = [0, 0, 0];

	var tankTop = [0, 2, 3, 7, 9, 10, 13];
	var tankBot = [1, 4, 5, 6, 8, 11, 12, 14];

	var modeltop = new Model(gl, modeljson, texture, shader, s, r, t, tankTop);
	var modelbot = new Model(gl, modeljson, texture, shader, s, r, t, tankBot);

	const fpsElem = document.querySelector('#fps');

	var world = new Float32Array(16);
	var view = new Float32Array(16);
	var proj = new Float32Array(16);

	mat4.identity(world);
	mat4.lookAt(view, [0, 3, -4], [0, 0, 0], [0, 1, 0]);
	mat4.perspective(proj, glMatrix.toRadian(90), 1280 / 960, 0.1, 10000.0);

	var mShaderProgram = modeltop.getShader().getProgram();
	gl.useProgram(mShaderProgram);

	var mvmatrixL = gl.getUniformLocation(mShaderProgram, 'mvmatrix');
	var projL = gl.getUniformLocation(mShaderProgram, 'proj');

	gl.uniformMatrix4fv(mvmatrixL, gl.FALSE, mat4.mul(view, world, view));
	gl.uniformMatrix4fv(projL, gl.FALSE, proj);

	var lightL = gl.getUniformLocation(mShaderProgram, 'light');
	var lightDirL = gl.getUniformLocation(mShaderProgram, 'lightDir');
	var lightPosL = gl.getUniformLocation(mShaderProgram, 'lightPos');

	gl.uniform3f(lightL, 1, 1, 1);
	gl.uniform3f(lightDirL, 100.0, 50.0, 150.0);
	gl.uniform3f(lightPosL, 0.0, 10.0, -10.0);

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
		modeltop.draw(world, view);
		modelbot.draw(world, view);
	};

	var update = function(delta) {
		keyboard(delta);
		modeltop.update(delta);
		modelbot.update(delta);
	};

	var keyboard = function(delta) {
		var v = 75;
		if (keys['E'.charCodeAt(0)]) {
			var rot = modeltop.getRotation();
			rot[1] -= v * 1 * delta;
			modeltop.setRotation(rot);
		}
		if (keys['Q'.charCodeAt(0)]) {
			var rot = modeltop.getRotation();
			rot[1] += v * 1 * delta;
			modeltop.setRotation(rot);
		}
		if (keys['D'.charCodeAt(0)]) {
			var rot = modelbot.getRotation();
			rot[1] -= v * 0.5 * delta;
			modelbot.setRotation(rot);
		}
		if (keys['A'.charCodeAt(0)]) {
			var rot = modelbot.getRotation();
			rot[1] += v * 0.5 * delta;
			modelbot.setRotation(rot);
		}
	};
};

var keys = [];
window.addEventListener(
	'keydown',
	function(e) {
		keys[e.keyCode] = true;
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
