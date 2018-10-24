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

	readTextFile('vert.vert', vsText => {
		readTextFile('frag.frag', fsText => {
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
				console.error(
					'ERROR linking program!',
					gl.getProgramInfoLog(program)
				);
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

			var boxVertices = [
				// X, Y, Z           R, G, B
				// Top
				-1.0,
				1.0,
				-1.0,
				1,
				0,
				0,
				-1.0,
				1.0,
				1.0,
				1,
				0,
				0,
				1.0,
				1.0,
				1.0,
				1,
				0,
				0,
				1.0,
				1.0,
				-1.0,
				1,
				0,
				0,

				// Left
				-1.0,
				1.0,
				1.0,
				0,
				1,
				0,
				-1.0,
				-1.0,
				1.0,
				0,
				1,
				0,
				-1.0,
				-1.0,
				-1.0,
				0,
				1,
				0,
				-1.0,
				1.0,
				-1.0,
				0,
				1,
				0,

				// Right
				1.0,
				1.0,
				1.0,
				0,
				0,
				1,
				1.0,
				-1.0,
				1.0,
				0,
				0,
				1,
				1.0,
				-1.0,
				-1.0,
				0,
				0,
				1,
				1.0,
				1.0,
				-1.0,
				0,
				0,
				1,

				// Front
				1.0,
				1.0,
				1.0,
				1,
				1,
				0,
				1.0,
				-1.0,
				1.0,
				1,
				1,
				0,
				-1.0,
				-1.0,
				1.0,
				1,
				1,
				0,
				-1.0,
				1.0,
				1.0,
				1,
				1,
				0,

				// Back
				1.0,
				1.0,
				-1.0,
				0,
				1,
				1,
				1.0,
				-1.0,
				-1.0,
				0,
				1,
				1,
				-1.0,
				-1.0,
				-1.0,
				0,
				1,
				1,
				-1.0,
				1.0,
				-1.0,
				0,
				1,
				1,

				// Bottom
				-1.0,
				-1.0,
				-1.0,
				1,
				0,
				1,
				-1.0,
				-1.0,
				1.0,
				1,
				0,
				1,
				1.0,
				-1.0,
				1.0,
				1,
				0,
				1,
				1.0,
				-1.0,
				-1.0,
				1,
				0,
				1
			];

			var boxIndices = [
				// Top
				0,
				1,
				2,
				0,
				2,
				3,

				// Left
				5,
				4,
				6,
				6,
				4,
				7,

				// Right
				8,
				9,
				10,
				8,
				10,
				11,

				// Front
				13,
				12,
				14,
				15,
				14,
				12,

				// Back
				16,
				17,
				18,
				16,
				18,
				19,

				// Bottom
				21,
				20,
				22,
				22,
				20,
				23
			];

			//Indexes
			var VIBO = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, VIBO);
			gl.bufferData(
				gl.ELEMENT_ARRAY_BUFFER,
				new Uint16Array(boxIndices),
				gl.STATIC_DRAW
			);

			//Vertexes
			var VBO = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
			gl.bufferData(
				gl.ARRAY_BUFFER,
				new Float32Array(boxVertices),
				gl.STATIC_DRAW
			);

			var positionL = gl.getAttribLocation(program, 'position');
			gl.vertexAttribPointer(
				positionL,
				3,
				gl.FLOAT,
				gl.FALSE,
				6 * Float32Array.BYTES_PER_ELEMENT,
				0
			);
			gl.enableVertexAttribArray(positionL);

			var colourL = gl.getAttribLocation(program, 'colour');
			gl.vertexAttribPointer(
				colourL,
				3,
				gl.FLOAT,
				gl.FALSE,
				6 * Float32Array.BYTES_PER_ELEMENT,
				3 * Float32Array.BYTES_PER_ELEMENT
			);
			gl.enableVertexAttribArray(colourL);

			//Uniforms
			gl.useProgram(program);

			var modelL = gl.getUniformLocation(program, 'model');
			var viewL = gl.getUniformLocation(program, 'view');
			var projL = gl.getUniformLocation(program, 'proj');

			var model = new Float32Array(16);
			var view = new Float32Array(16);
			var proj = new Float32Array(16);

			mat4.identity(model);
			mat4.lookAt(view, [0, 0, -5], [0, 0, 0], [0, 1, 0]);
			mat4.perspective(
				proj,
				glMatrix.toRadian(90),
				canvas.clientWidth / canvas.clientHeight,
				0.1,
				1000.0
			);

			gl.uniformMatrix4fv(modelL, gl.FALSE, model);
			gl.uniformMatrix4fv(viewL, gl.FALSE, view);
			gl.uniformMatrix4fv(projL, gl.FALSE, proj);

			//Draw
			var identityMat = new Float32Array(16);
			var xRot = new Float32Array(16);
			var yRot = new Float32Array(16);
			var zRot = new Float32Array(16);

			var identityMat = new Float32Array(16);
			mat4.identity(identityMat);
			var angle = 0;
			var loop = function() {
				angle = (performance.now() / 1000 / 6) * 2 * Math.PI;
				mat4.rotate(xRot, identityMat, angle / 2, [1, 0, 0]);
				mat4.rotate(yRot, identityMat, angle / 4, [0, 1, 0]);
				mat4.rotate(zRot, identityMat, angle / 6, [0, 0, 1]);

				mat4.mul(model, identityMat, xRot);
				mat4.mul(model, model, yRot);
				mat4.mul(model, model, zRot);

				gl.clearColor(0, 0, 0, 1);
				gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
				gl.uniformMatrix4fv(modelL, gl.FALSE, model);

				gl.drawElements(
					gl.TRIANGLES,
					boxIndices.length,
					gl.UNSIGNED_SHORT,
					0
				);

				requestAnimationFrame(loop);
			};
			requestAnimationFrame(loop);
		});
	});
};
