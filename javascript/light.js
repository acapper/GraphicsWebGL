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

	keyboard(delta, keys) {
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
