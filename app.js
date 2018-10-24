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

	var vShader = gl.createShader(gl.VERTEX_SHADER);
	var fShader = gl.createShader(gl.FRAGMENT_SHADER);

	gl.shaderSource(vShader, vsText);
	gl.shaderSource(fShader, fsText);

	gl.compileShader(vShader);
	if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) {
		console.error(
			'ERROR compiling vertex shader!',
			gl.getShaderInfoLog(vShader)
		);
		return;
	}

	gl.compileShader(fShader);
	if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) {
		console.error(
			'ERROR compiling fragment shader!',
			gl.getShaderInfoLog(fShader)
		);
		return;
	}

	var program = gl.createProgram();
	gl.attachShader(program, vShader);
	gl.attachShader(program, fShader);
	gl.linkProgram(program);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error('ERROR linking program!', gl.getProgramInfoLog(program));
		return;
	}

	gl.validateProgram(program);
	if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
		console.error(
			'ERROR validating program!',
			gl.getProgramInfoLog(program)
		);
		return;
	}

	//
	// Create buffer
	//
	var modelIndicies = [].concat.apply([], model.meshes[0].faces);
	var modelVerts = model.meshes[0].vertices;
	var modelTextureCoords = model.meshes[0].texturecoords[0];
	var modelNormals = model.meshes[0].normals;

	var modelIndexBO = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelIndexBO);
	gl.bufferData(
		gl.ELEMENT_ARRAY_BUFFER,
		new Uint16Array(modelIndicies),
		gl.STATIC_DRAW
	);

	var modelPosVBO = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, modelPosVBO);
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array(modelVerts),
		gl.STATIC_DRAW
	);

	var modelTextCoordVBO = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, modelTextCoordVBO);
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array(modelTextureCoords),
		gl.STATIC_DRAW
	);

	var modelNormalVBO = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, modelNormalVBO);
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array(modelNormals),
		gl.STATIC_DRAW
	);

	gl.bindBuffer(gl.ARRAY_BUFFER, modelPosVBO);
	var positionAttribLocation = gl.getAttribLocation(program, 'position');
	gl.vertexAttribPointer(
		positionAttribLocation, // Attribute location
		3, // Number of elements per attribute
		gl.FLOAT, // Type of elements
		gl.FALSE,
		3 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
		0 // Offset from the beginning of a single vertex to this attribute
	);
	gl.enableVertexAttribArray(positionAttribLocation);

	gl.bindBuffer(gl.ARRAY_BUFFER, modelTextCoordVBO);
	var texCoordAttribLocation = gl.getAttribLocation(program, 'texture');
	gl.vertexAttribPointer(
		texCoordAttribLocation, // Attribute location
		2, // Number of elements per attribute
		gl.FLOAT, // Type of elements
		gl.FALSE,
		2 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
		0 // Offset from the beginning of a single vertex to this attribute
	);
	gl.enableVertexAttribArray(texCoordAttribLocation);

	gl.bindBuffer(gl.ARRAY_BUFFER, modelNormalVBO);
	var normalAttribLocation = gl.getAttribLocation(program, 'normal');
	gl.vertexAttribPointer(
		normalAttribLocation, // Attribute location
		3, // Number of elements per attribute
		gl.FLOAT, // Type of elements
		gl.TRUE,
		3 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
		0 // Offset from the beginning of a single vertex to this attribute
	);
	gl.enableVertexAttribArray(normalAttribLocation);

	//
	// Create texture
	//
	var modelTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, modelTexture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texImage2D(
		gl.TEXTURE_2D,
		0,
		gl.RGBA,
		gl.RGBA,
		gl.UNSIGNED_BYTE,
		texture
	);
	gl.bindTexture(gl.TEXTURE_2D, null);

	//Uniforms
	gl.useProgram(program);

	var modelL = gl.getUniformLocation(program, 'model');
	var worldL = gl.getUniformLocation(program, 'world');
	var viewL = gl.getUniformLocation(program, 'view');
	var projL = gl.getUniformLocation(program, 'proj');

	var nmatrixL = gl.getUniformLocation(program, 'nmatrix');

	var lightL = gl.getUniformLocation(program, 'light');
	var lightDirL = gl.getUniformLocation(program, 'lightDir');
	var lightPosL = gl.getUniformLocation(program, 'lightPos');

	var model = new Float32Array(16);
	var world = new Float32Array(16);
	var view = new Float32Array(16);
	var proj = new Float32Array(16);

	mat4.identity(model);
	mat4.identity(world);
	mat4.lookAt(view, [0, 0, -10], [0, 0, 0], [0, 1, 0]);
	mat4.perspective(
		proj,
		glMatrix.toRadian(90),
		canvas.clientWidth / canvas.clientHeight,
		0.1,
		1000.0
	);

	var nmatrix4 = new Float32Array(16);
	var nmatrix3 = new Float32Array(9);

	gl.uniform3f(lightL, 1, 1, 1);
	gl.uniform3f(lightDirL, 100.0, 100.0, 100.0);
	gl.uniform3f(lightPosL, 0.0, 10.0, -10.0);

	//Draw
	var identityMat = new Float32Array(16);
	var xRot = new Float32Array(16);
	var yRot = new Float32Array(16);
	var zRot = new Float32Array(16);

	var fxRot = new Float32Array(16);
	var fyRot = new Float32Array(16);
	var fzRot = new Float32Array(16);

	var scale = new Float32Array(16);
	var trans = new Float32Array(16);

	var identityMat = new Float32Array(16);
	mat4.identity(identityMat);

	mat4.rotate(fxRot, identityMat, glMatrix.toRadian(270), [1, 0, 0]);
	mat4.rotate(fyRot, identityMat, glMatrix.toRadian(0), [0, 1, 0]);
	mat4.rotate(fzRot, identityMat, glMatrix.toRadian(150), [0, 0, 1]);

	var s = 0.01;
	//var s = 5;
	mat4.fromScaling(scale, [s, s, s]);
	mat4.fromTranslation(trans, [0, 0, -600]);
	//mat4.fromTranslation(trans, [0, 0, 0]);

	const fpsElem = document.querySelector('#fps');

	var angle = 0;
	var then = 0;
	var loop = function(now) {
		now *= 0.001; // convert to seconds
		const deltaTime = now - then; // compute time since last frame
		then = now; // remember time for next frame
		const fps = 1 / deltaTime; // compute frames per second
		fpsElem.textContent = fps.toFixed(1); // update fps display

		angle = ((performance.now() / 1000) * (2 * Math.PI)) / 4;
		mat4.rotate(xRot, identityMat, 0, [1, 0, 0]);
		mat4.rotate(yRot, identityMat, 0, [0, 1, 0]);
		mat4.rotate(zRot, identityMat, angle / 6, [0, 0, 1]);

		mat4.mul(model, identityMat, identityMat);
		mat4.mul(model, model, scale);
		mat4.mul(model, model, fxRot);
		mat4.mul(model, model, fyRot);
		mat4.mul(model, model, fzRot);
		mat4.mul(model, model, trans);
		mat4.mul(model, model, xRot);
		mat4.mul(model, model, yRot);
		mat4.mul(model, model, zRot);

		mat4.mul(world, identityMat, identityMat);

		mat4.identity(nmatrix4);
		mat4.mul(nmatrix4, nmatrix4, view);
		mat4.mul(nmatrix4, nmatrix4, world);
		mat4.mul(nmatrix4, nmatrix4, model);

		mat3.fromMat4(nmatrix3, nmatrix4);
		mat3.invert(nmatrix3, nmatrix3);
		mat3.transpose(nmatrix3, nmatrix3);

		gl.uniformMatrix4fv(modelL, gl.FALSE, model);
		gl.uniformMatrix4fv(worldL, gl.FALSE, world);
		gl.uniformMatrix4fv(viewL, gl.FALSE, view);
		gl.uniformMatrix4fv(projL, gl.FALSE, proj);

		gl.uniformMatrix3fv(nmatrixL, gl.FALSE, nmatrix3);

		gl.clearColor(0.1, 0.1, 0.1, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.uniformMatrix4fv(modelL, gl.FALSE, model);

		gl.bindTexture(gl.TEXTURE_2D, modelTexture);
		gl.activeTexture(gl.TEXTURE0);

		gl.drawElements(
			gl.TRIANGLES,
			modelIndicies.length,
			gl.UNSIGNED_SHORT,
			0
		);

		requestAnimationFrame(loop);
	};
	requestAnimationFrame(loop);
};
