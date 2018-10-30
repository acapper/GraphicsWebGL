class Light {
	constructor(light, model) {
		gl = model.gl;
		this.model = new Model({
			gl: model.gl,
			modeljson: model.modeljson,
			texture: model.texture,
			shader: model.shader,
			s: model.s,
			r: model.r,
			t: [0, 0, 0],
			meshIndices: model.meshIndices
		});

		this.name = light.name;
		this.lightCol = light.colour;
		this.lightDir = light.direction;
		this.setLightPos(model.t);
		this.on = light.on;

		var program = this.model.getShader().getProgram();
		gl.useProgram(program);
		this.colourL = gl.getUniformLocation(program, 'lightcolour');
	}

	getName() {
		return this.name;
	}

	getOn() {
		return this.on;
	}

	setOn(on) {
		this.on = on;
	}

	setLightCol(col) {
		this.lightCol = col;
	}

	getLightCol() {
		return this.lightCol;
	}

	setLightDir(dir) {
		this.lightDir = dir;
	}

	getLightDir() {
		return this.lightDir;
	}

	setLightPos(pos) {
		this.model.setTrans(pos);
	}

	getLightPos() {
		return this.model.getTrans();
	}

	getModel() {
		return this.model;
	}

	draw(gl, world, view, proj, light) {
		gl.useProgram(
			this.getModel()
				.getShader()
				.getProgram()
		);
		gl.uniform3fv(this.colourL, this.lightCol);
		this.model.draw(gl, world, view, proj, light);
	}
}
