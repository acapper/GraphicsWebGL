class Light extends Model {
	constructor(model, light) {
		var gl = model.gl;
		super(model);

		this.name = light.name;
		this.lightCol = light.colour;
		this.lightDir = light.direction;
		this.on = light.on;

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

	draw(gl, world, view, proj, lights) {
		var program = this.shader.getProgram();
		gl.useProgram(program);
		gl.uniform3fv(this.colourL, this.lightCol);
		super.draw(gl, world, view, proj, lights);
		program = null;
	}
}
