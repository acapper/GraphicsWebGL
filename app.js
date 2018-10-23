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

			var verts = [
				0.0,
				0.5,
				1,
				0,
				0,
				-0.5,
				-0.5,
				0,
				1,
				0,
				0.5,
				-0.5,
				0,
				0,
				1
			];

			var VBO = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
			gl.bufferData(
				gl.ARRAY_BUFFER,
				new Float32Array(verts),
				gl.STATIC_DRAW
			);

			var positionL = gl.getAttribLocation(program, 'position');
			gl.vertexAttribPointer(
				positionL,
				2,
				gl.FLOAT,
				gl.FALSE,
				5 * Float32Array.BYTES_PER_ELEMENT,
				0
			);
			gl.enableVertexAttribArray(positionL);

			var colourL = gl.getAttribLocation(program, 'colour');
			gl.vertexAttribPointer(
				colourL,
				3,
				gl.FLOAT,
				gl.FALSE,
				5 * Float32Array.BYTES_PER_ELEMENT,
				2 * Float32Array.BYTES_PER_ELEMENT
			);
			gl.enableVertexAttribArray(colourL);

			gl.useProgram(program);

			gl.drawArrays(gl.TRIANGLES, 0, 3);
		});
	});
};
