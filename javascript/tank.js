class Tank {
	constructor(model) {
		/*{
		gl,
		texture: texture,
		model: modeljson,
		shader: shader,
		rotation: [0, 180, 0],
		scale: [0.006, 0.006, 0.006],
		translation: [0, 0, 0],
		topIndices: [0],
		botIndices: [1]
	}*/
		this.top = new Model({
			gl: model.gl,
			texture: model.texture,
			model: model.model,
			shader: model.shader,
			rotation: model.top.rotation,
			scale: model.top.scale,
			translation: model.top.translation,
			meshIndices: model.top.indices
		});
		this.bot = new Model({
			gl: model.gl,
			texture: model.texture,
			model: model.model,
			shader: model.shader,
			rotation: model.bot.rotation,
			scale: model.bot.scale,
			translation: model.bot.translation,
			meshIndices: model.bot.indices
		});
		this.bomb = new Light(
			{
				gl: model.gl,
				texture: model.bomb.texture,
				model: model.bomb.model,
				shader: model.shader,
				rotation: model.bomb.rotation,
				scale: model.bomb.scale,
				translation: model.bomb.translation
			},
			model.bomb.light
		);

		this.camera = new Camera({
			viewPos: [
				model.top.translation[0] + model.camera.position[0],
				model.top.translation[1] + model.camera.position[1],
				model.top.translation[2] + model.camera.position[2]
			],
			viewLook: model.top.translation,
			viewUp: [0, 1, 0]
		});
		this.camera.rotateViewPos(model.top.rotation);

		this.turrentSpeed = 60;
		this.tankRotSpeed = 45;
		this.tankSpeed = 0.4;
		this.bombVisible = false;
		this.bombDirection = [0, 0, 0];
		this.fired = false;
		this.bombSpeed = 5;
		this.bombPos = this.bomb.getTranslation();
		this.bombRot = this.bomb.getRotation();
	}

	setTankSpeed(s) {
		this.tankSpeed = s;
	}

	getCamera() {
		return this.camera.getCameraMat();
	}

	setCamera(camera) {
		this.camera = camera;
	}

	getBomb() {
		return this.bomb;
	}

	getTranslation() {
		return this.bot.getTranslation();
	}

	getRotation() {
		return this.bot.getRotation();
	}

	draw(gl, world, view, proj, lights) {
		this.top.draw(gl, world, view, proj, lights);
		this.bot.draw(gl, world, view, proj, lights);
		if (this.bombVisible) this.bomb.draw(gl, world, view, proj, lights);
	}

	update(delta, keys) {
		this.input(delta, keys);
		this.top.update();
		this.bot.update();
		this.bomb.update();
		if (this.fired) {
			var trans = this.bomb.getTranslation();
			this.bomb.setTranslation([
				trans[0] + delta * this.bombSpeed * this.bombDirection[0],
				trans[1],
				trans[2] + delta * this.bombSpeed * this.bombDirection[2]
			]);
		}
	}

	input(delta, keys) {
		this.rotate(delta, keys);
		this.move(delta, keys);
		this.cameraMovement(delta, keys);
	}

	cameraMovement(delta, keys) {
		var camrot = 30;
		var cameraTrans = [0, 0, 0];
		if (keys['U'.charCodeAt(0)]) {
			cameraTrans[2] += 0.5 * delta;
		}
		if (keys['J'.charCodeAt(0)]) {
			cameraTrans[2] -= 0.5 * delta;
		}
		if (keys['H'.charCodeAt(0)]) {
			cameraTrans[0] += 0.5 * delta;
		}
		if (keys['K'.charCodeAt(0)]) {
			cameraTrans[0] -= 0.5 * delta;
		}
		if (keys['O'.charCodeAt(0)]) {
			cameraTrans[1] += 0.5 * delta;
		}
		if (keys['L'.charCodeAt(0)]) {
			cameraTrans[1] -= 0.5 * delta;
		}
		if (keys['I'.charCodeAt(0)]) {
			this.camera.rotateViewPos([0, camrot * delta, 0]);
		}
		if (keys['Y'.charCodeAt(0)]) {
			this.camera.rotateViewPos([0, -camrot * delta, 0]);
		}
		if (keys['M'.charCodeAt(0)]) {
			var trans = this.getTranslation();
			var camera = new Camera({
				viewPos: [
					trans[0] + viewPos[0],
					trans[1] + viewPos[1],
					trans[2] + viewPos[2]
				],
				viewLook: this.getTranslation(),
				viewUp: [0, 1, 0]
			});
			camera.rotateViewPos([0, 0, 0]);
			camera.rotateViewPos(this.getRotation());
			this.camera = camera;
		}
		this.camera.transCamera(cameraTrans);
		this.camera.setLookAt(this.getTranslation());
	}

	rotate(delta, keys) {
		if (keys['E'.charCodeAt(0)]) {
			this.rotateModel(delta, -this.turrentSpeed, this.top);
			this.rotateBomb(delta, -this.turrentSpeed);
		}
		if (keys['Q'.charCodeAt(0)]) {
			this.rotateModel(delta, this.turrentSpeed, this.top);
			this.rotateBomb(delta, this.turrentSpeed);
		}
		if (keys['D'.charCodeAt(0)]) {
			this.rotateModel(delta, -this.tankRotSpeed, this.top);
			this.rotateModel(delta, -this.tankRotSpeed, this.bot);
			this.rotateBomb(delta, -this.tankRotSpeed);
			this.camera.rotateViewPos([0, delta * -this.tankRotSpeed, 0]);
		}
		if (keys['A'.charCodeAt(0)]) {
			this.rotateModel(delta, this.tankRotSpeed, this.top);
			this.rotateModel(delta, this.tankRotSpeed, this.bot);
			this.rotateBomb(delta, this.tankRotSpeed);
			this.camera.rotateViewPos([0, delta * this.tankRotSpeed, 0]);
		}
	}

	rotateBomb(delta, speed) {
		var tankPos = this.top.getTranslation();
		vec3.rotateY(
			this.bombPos,
			this.bombPos,
			tankPos,
			glMatrix.toRadian(speed * delta)
		);

		this.bombRot[1] = this.bombRot[1] + speed * delta;
		if (!this.fired) {
			this.bomb.setRotation([
				this.bombRot[0],
				this.bombRot[1],
				this.bombRot[2]
			]);
			this.bomb.setTranslation([
				this.bombPos[0],
				this.bombPos[1],
				this.bombPos[2]
			]);
		}
	}

	rotateModel(delta, speed, model) {
		var rot = model.getRotation();
		rot[1] = rot[1] + speed * delta;
		model.setRotation(rot);
	}

	move(delta, keys) {
		if (keys['W'.charCodeAt(0)]) {
			this.moveModel(delta * this.tankSpeed);
		}
		if (keys['S'.charCodeAt(0)]) {
			this.moveModel(delta * -this.tankSpeed);
		}
		if (keys['V'.charCodeAt(0)] && !this.fired) {
			var rot = this.bomb.getRotation();
			var forward = [
				Math.cos(glMatrix.toRadian(rot[1])),
				0,
				-Math.sin(glMatrix.toRadian(rot[1]))
			];
			vec3.normalize(forward, forward);
			vec3.mul(
				forward,
				[this.bombSpeed, this.bombSpeed, this.bombSpeed],
				forward
			);
			this.bombDirection = forward;
			this.fired = true;
			this.bombVisible = true;
			var that = this;
			this.bomb.setOn(1);
			setTimeout(function() {
				that.bomb.setOn(0);
				that.bomb.setRotation([
					that.bombRot[0],
					that.bombRot[1],
					that.bombRot[2]
				]);
				that.bomb.setTranslation([
					that.bombPos[0],
					that.bombPos[1],
					that.bombPos[2]
				]);
				that.fired = false;
				that.bombVisible = false;
				that = null;
			}, 1500);
		}
	}

	moveModel(speed) {
		var rot = this.bot.getRotation();
		var forward = [
			Math.sin(glMatrix.toRadian(rot[1])),
			0,
			Math.cos(glMatrix.toRadian(rot[1]))
		];
		vec3.normalize(forward, forward);
		vec3.mul(forward, [speed, speed, speed], forward);
		this.translateModel(forward, this.top);
		this.translateModel(forward, this.bot);
		this.camera.transCamera(forward);
		vec3.add(this.bombPos, this.bombPos, forward);
	}

	translateModel(forward, model) {
		var trans = model.getTranslation();
		vec3.add(trans, trans, forward);
		model.setTranslation(trans);
	}
}
