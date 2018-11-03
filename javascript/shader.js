class Shader {
	constructor(gl, vsText, fsText) {
		this.gl = gl;

		// Create shader variables
		var vShader = this.gl.createShader(gl.VERTEX_SHADER);
		var fShader = this.gl.createShader(gl.FRAGMENT_SHADER);

		// Set shader source code
		this.gl.shaderSource(vShader, vsText);
		this.gl.shaderSource(fShader, fsText);

		// Compile shader source code
		this.compileShader('ERROR compiling vertex shader!', vShader);
		this.compileShader('ERROR compiling fragment shader!', fShader);
		// Create shader program
		this.program = this.createProgram(vShader, fShader);
		// Link shader program
		this.linkProgram(this.program);
		// Validate shaderr program
		this.validateProgram(this.program);
	}

	// Compile shader source code
	compileShader(err, shader) {
		this.gl.compileShader(shader);
		if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
			// If error log error
			console.error(err, this.gl.getShaderInfoLog(shader));
			return;
		}
	}

	// Create a program from two shaders
	createProgram(vShader, fShader) {
		var program = this.gl.createProgram();
		this.gl.attachShader(program, vShader);
		this.gl.attachShader(program, fShader);
		return program;
	}

	// Link shader program
	linkProgram() {
		this.gl.linkProgram(this.program);

		if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
			// If error log error
			console.error(
				'ERROR linking program!',
				this.gl.getProgramInfoLog(this.program)
			);
			return;
		}
	}

	// Vaildate shader program worked
	validateProgram() {
		this.gl.validateProgram(this.program);
		if (
			!this.gl.getProgramParameter(this.program, this.gl.VALIDATE_STATUS)
		) {
			// If error log error
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
