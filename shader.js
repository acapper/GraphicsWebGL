class Shader {
	constructor(gl, vsText, fsText) {
		this.gl = gl;

		var vShader = this.gl.createShader(gl.VERTEX_SHADER);
		var fShader = this.gl.createShader(gl.FRAGMENT_SHADER);

		this.gl.shaderSource(vShader, vsText);
		this.gl.shaderSource(fShader, fsText);

		this.compileShader('ERROR compiling vertex shader!', vShader);
		this.compileShader('ERROR compiling fragment shader!', fShader);
		this.program = this.createProgram(vShader, fShader);
		this.linkProgram(this.program);
		this.validateProgram(this.program);
	}

	compileShader(err, shader) {
		this.gl.compileShader(shader);
		if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
			console.error(err, this.gl.getShaderInfoLog(shader));
			return;
		}
	}

	createProgram(vShader, fShader) {
		var program = this.gl.createProgram();
		this.gl.attachShader(program, vShader);
		this.gl.attachShader(program, fShader);
		return program;
	}

	linkProgram() {
		this.gl.linkProgram(this.program);

		if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
			console.error(
				'ERROR linking program!',
				this.gl.getProgramInfoLog(this.program)
			);
			return;
		}
	}

	validateProgram() {
		this.gl.validateProgram(this.program);
		if (
			!this.gl.getProgramParameter(this.program, this.gl.VALIDATE_STATUS)
		) {
			console.error(
				'ERROR validating program!',
				this.gl.getProgramInfoLog(this.program)
			);
			return;
		}
	}

	getProgram() {
		return this.program;
	}
}
