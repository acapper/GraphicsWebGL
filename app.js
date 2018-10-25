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
	//var model = loadJSONResource('models/T34/T34.json');
	var model = loadJSONResource('models/lowpolydeer/deer.json');

	return Promise.all([image, vsText, fsText, model]).then(
		([imageR, vsTextR, fsTextR, modelR]) => {
			Run(imageR, vsTextR, fsTextR, modelR);
		}
	);
};

var Run = function(texture, vsText, fsText, model) {
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

	var s = [0.009, 0.009, 0.009];
	var r = [270, 0, 50];
	var t = [0, 0, -500];

	var model = new Model(gl, model, texture, shader, s, r, t);

	const fpsElem = document.querySelector('#fps');

	var world = new Float32Array(16);
	var view = new Float32Array(16);
	var proj = new Float32Array(16);

	mat4.identity(world);
	mat4.lookAt(view, [0, 8, -10], [0, 4, -2], [0, 1, 0]);
	mat4.perspective(proj, glMatrix.toRadian(90), 1280 / 960, 0.1, 1000.0);

	var mShaderProgram = model.getShader().getProgram();
	gl.useProgram(mShaderProgram);

	var worldL = gl.getUniformLocation(mShaderProgram, 'world');
	var viewL = gl.getUniformLocation(mShaderProgram, 'view');
	var projL = gl.getUniformLocation(mShaderProgram, 'proj');

	gl.uniformMatrix4fv(worldL, gl.FALSE, world);
	gl.uniformMatrix4fv(viewL, gl.FALSE, view);
	gl.uniformMatrix4fv(projL, gl.FALSE, proj);

	var lightL = gl.getUniformLocation(mShaderProgram, 'light');
	var lightDirL = gl.getUniformLocation(mShaderProgram, 'lightDir');
	var lightPosL = gl.getUniformLocation(mShaderProgram, 'lightPos');

	gl.uniform3f(lightL, 1, 1, 1);
	gl.uniform3f(lightDirL, 100.0, 50.0, 150.0);
	gl.uniform3f(lightPosL, 0.0, 10.0, -10.0);

	var then = 0;
	var loop = function(now) {
		now *= 0.001; // convert to seconds
		const deltaTime = now - then; // compute time since last frame
		then = now; // remember time for next frame
		const fps = 1 / deltaTime; // compute frames per second
		fpsElem.textContent = fps.toFixed(1); // update fps display

		model.draw(performance.now(), world, view);

		requestAnimationFrame(loop);
	};
	requestAnimationFrame(loop);
};
