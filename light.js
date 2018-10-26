class Light {
	constructor(light, model) {
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

		this.lightCol = light.colour;
		this.lightDir = light.direction;
		this.setLightPos(model.t);
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

	draw(world, view, proj, light) {
		this.model.draw(world, view, proj, light);
	}
}
