// Holds logic for a two model tank that can fire and has a camera that follows
class Tank {
	/*{
		gl: glContext,
		texture: tankTexture,
		model: tankmodeljson,
		shader: tankshader,
		top: {
			rotation: [0, 0, 0],
			scale: [0, 0, 0],
			translation: [0, 0, 0],
			indices: null // List of model mesh indices for top
		},
		bot: {
			rotation: [0, 0, 0],
			scale: [0, 0, 0],
			translation: [0, 0, 0],
			indices: null // List of model mesh indices for bot
		},
		bomb: {
			texture: bulletTexture,
			model: bulletjson,
			rotation: [0, 0, 0],
			scale: [0, 0, 0],
			translation: [0, 0, 0],
			light: {
				name: 'bomb',
				colour: [0, 0, 0],
				direction: [0, 0, 0],
				on: 0
			}
		},
		camera: {
			position: viewPosition // [0, 0, 0]
		}
	}*/
	constructor(model) {
		// Create tank top model
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
		// Create tank bot model
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
		// Create tank bomb light
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

		// Create camera with the view position relative to the tank position
		this.camera = new Camera({
			viewPos: [
				model.top.translation[0] + model.camera.position[0],
				model.top.translation[1] + model.camera.position[1],
				model.top.translation[2] + model.camera.position[2]
			],
			viewLook: model.top.translation,
			viewUp: [0, 1, 0]
		});
		// Make sure camera is directly behind the tank
		this.camera.rotateViewPos(model.top.rotation);

		// Initialise attributes
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

	// Draw tank
	draw(gl, world, view, proj, lights) {
		this.top.draw(gl, world, view, proj, lights);
		this.bot.draw(gl, world, view, proj, lights);
		// Only draw bomb if visible
		if (this.bombVisible) this.bomb.draw(gl, world, view, proj, lights);
	}

	// Update tank
	update(delta, keys) {
		// Check for inputs
		this.input(delta, keys);
		// Update model transforms
		this.top.update();
		this.bot.update();
		this.bomb.update();
		// If bomb is fired update position
		if (this.fired) {
			var trans = this.bomb.getTranslation();
			this.bomb.setTranslation([
				trans[0] + delta * this.bombSpeed * this.bombDirection[0],
				trans[1],
				trans[2] + delta * this.bombSpeed * this.bombDirection[2]
			]);
		}
	}

	// Check for rotate, move and camera inputs
	input(delta, keys) {
		this.rotate(delta, keys);
		this.move(delta, keys);
		this.cameraMovement(delta, keys);
	}

	// Check to see if the camera should be moved
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
			// Reset camera to original position
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
		// Apply any transforms to the camera
		this.camera.transCamera(cameraTrans);
		// Update camera look at
		this.camera.setLookAt(this.getTranslation());
	}

	// Check to see if tank should be rotated
	rotate(delta, keys) {
		// Rotate top and bomb
		if (keys['E'.charCodeAt(0)]) {
			this.rotateModel(delta, -this.turrentSpeed, this.top);
			this.rotateBomb(delta, -this.turrentSpeed);
		}
		if (keys['Q'.charCodeAt(0)]) {
			this.rotateModel(delta, this.turrentSpeed, this.top);
			this.rotateBomb(delta, this.turrentSpeed);
		}
		// Rotate top, bot and bomb
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

	// Rotate bomb position
	rotateBomb(delta, speed) {
		// Calculate end of turret and store value
		var tankPos = this.top.getTranslation();
		vec3.rotateY(
			this.bombPos,
			this.bombPos,
			tankPos,
			glMatrix.toRadian(speed * delta)
		);

		// Calculate turret rotation and store it
		this.bombRot[1] = this.bombRot[1] + speed * delta;
		if (!this.fired) {
			// If not fired move bomb to end of turret and set rotation
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

	// Rotate a model arround the y axis
	rotateModel(delta, speed, model) {
		var rot = model.getRotation();
		rot[1] = rot[1] + speed * delta;
		model.setRotation(rot);
	}

	// Check to see if the tank should be moved
	move(delta, keys) {
		if (keys['W'.charCodeAt(0)]) {
			// Move whole model forward
			this.moveModel(delta * this.tankSpeed);
		}
		if (keys['S'.charCodeAt(0)]) {
			// Move whole model backward
			this.moveModel(delta * -this.tankSpeed);
		}
		// If the fired key is pressed set bomb fired to true
		if (keys['V'.charCodeAt(0)] && !this.fired) {
			// Calculate the forward vector of the bomb
			var rot = this.bomb.getRotation();
			var forward = [
				Math.cos(glMatrix.toRadian(rot[1])),
				0,
				-Math.sin(glMatrix.toRadian(rot[1]))
			];
			// Normalize forward vector
			vec3.normalize(forward, forward);
			// Calculate a forward * bomb speed to get get velocity
			vec3.mul(
				forward,
				[this.bombSpeed, this.bombSpeed, this.bombSpeed],
				forward
			);
			// Make sure bomb is in correct state and visible
			this.bombDirection = forward;
			this.fired = true;
			this.bombVisible = true;
			var that = this;
			this.bomb.setOn(1);
			// Create a clean up function to run in 1.5 seconds
			setTimeout(function() {
				// Turn off bomb move back to end of turret
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
				// Hide visibilty of bomb
				that.fired = false;
				that.bombVisible = false;
				that = null;
			}, 1500);
		}
	}

	// Move entire tank model by a speed amount
	moveModel(speed) {
		// Calculate forward vector
		var rot = this.bot.getRotation();
		var forward = [
			Math.sin(glMatrix.toRadian(rot[1])),
			0,
			Math.cos(glMatrix.toRadian(rot[1]))
		];
		// Normalize forward vector
		vec3.normalize(forward, forward);
		// Calculate a forward * speed to get get velocity
		vec3.mul(forward, [speed, speed, speed], forward);
		// Translate top and bot
		this.translateModel(forward, this.top);
		this.translateModel(forward, this.bot);
		// Move camera
		this.camera.transCamera(forward);
		// Update end of turret position
		vec3.add(this.bombPos, this.bombPos, forward);
	}

	// Translate a model by a forward velocity
	translateModel(forward, model) {
		var trans = model.getTranslation();
		vec3.add(trans, trans, forward);
		model.setTranslation(trans);
	}
}
