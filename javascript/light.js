class Light extends Mesh {
	/*{
		// Model class input
		gl: glContext,
		texture: modelTexture,
		model: modeljson,
		shader: lightmodelshader,
		rotation: [0, 0, 0],
		scale: [0, 0, 0],
		translation: [0, 0, 0]
	},
	// Light class input
	{ name: lightname, colour: [0, 0, 0], direction: [0, 0, 0], on: on(1)/off(0) }*/
	constructor(model, light) {
		var gl = model.gl;
		// Initialise parent class
		super(model);

		// Initialise attributes
		this.name = light.name;
		this.lightCol = light.colour;
		this.lightDir = light.direction;
		this.on = light.on;

		// Get uniform locations
		var program = this.shader.getProgram();
		gl.useProgram(program);
		this.colourL = gl.getUniformLocation(program, 'lightcolour');
		program = null;
		gl = null;
	}

	getColour() {
		return this.lightCol;
	}

	getDirection() {
		return this.lightDir;
	}

	getPosition() {
		return this.translation;
	}

	getOn() {
		return this.on;
	}

	setOn(on) {
		this.on = on;
	}

	getName() {
		return this.name;
	}

	// Draw light model (optional)
	draw(gl, world, view, proj, lights) {
		var program = this.shader.getProgram();
		gl.useProgram(program);
		gl.uniform3fv(this.colourL, this.lightCol);
		super.draw(gl, world, view, proj, lights);
		program = null;
	}

	// Light keyboard input
	keyboard(delta, keys) {
		// Make sure light is on before moving
		if (this.getOn() == 1) {
			if (keys['1'.charCodeAt(0)]) {
				var pos = this.getTranslation();
				pos[2] += 1 * delta;
				this.getTranslation(pos);
			}
			if (keys['2'.charCodeAt(0)]) {
				var pos = this.getTranslation();
				pos[2] -= 1 * delta;
				this.getTranslation(pos);
			}
			if (keys['3'.charCodeAt(0)]) {
				var pos = this.getTranslation();
				pos[0] += 1 * delta;
				this.getTranslation(pos);
			}
			if (keys['4'.charCodeAt(0)]) {
				var pos = this.getTranslation();
				pos[0] -= 1 * delta;
				this.getTranslation(pos);
			}
			if (keys['5'.charCodeAt(0)]) {
				var pos = this.getTranslation();
				pos[1] -= 1 * delta;
				this.getTranslation(pos);
			}
			if (keys['6'.charCodeAt(0)]) {
				var pos = this.getTranslation();
				pos[1] += 1 * delta;
				this.getTranslation(pos);
			}
		}
	}
}
