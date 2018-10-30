class Tank {
	constructor(top, bot, bomb) {
		this.modeltop = new Model(top);
		this.modelbot = new Model(bot);
		this.bomb = new Light(bomb[0], bomb[1]);

		this.v = 75;
		this.rottop = this.modeltop.getRotation();
		this.rotbot = this.modelbot.getRotation();
		this.rotf = this.modeltop.getRotationF();
		this.transtop = this.modeltop.getTrans();
		this.transtop = this.modeltop.getTrans();
		this.temp = vec3.create();
		this.forward = [
			Math.sin(glMatrix.toRadian(this.rottop[1] + this.rotf[1])),
			0,
			Math.cos(glMatrix.toRadian(this.rottop[1] + this.rotf[1]))
		];
		this.d = 0.15;
		this.bombVisible = false;
		this.bombMoving = false;
		this.bombDirection = [0, 0, 0];
		this.bombTrans = this.bomb.getModel().getTrans();
		this.bombSpeed = 10;
		//this.bombSpeed = 0;
	}

	getBomb() {
		return this.bomb;
	}

	keyboardInput(delta, keys) {
		this.move(delta, keys);
		this.rotate(delta, keys);
		this.fire(keys);
	}

	rotate(delta, keys) {
		if (keys['E'.charCodeAt(0)]) {
			this.rotateTop(delta, -this.v, [0, 1, 0]);
		}
		if (keys['Q'.charCodeAt(0)]) {
			this.rotateTop(delta, this.v, [0, 1, 0]);
		}
		if (keys['D'.charCodeAt(0)]) {
			this.rotateTopAndBot(delta, -this.v * 0.5, [0, 1, 0]);
		}
		if (keys['A'.charCodeAt(0)]) {
			this.rotateTopAndBot(delta, this.v * 0.5, [0, 1, 0]);
		}
	}

	rotateTop(delta, v, axis) {
		this.rottop = this.modeltop.getRotation();
		this.rottop = this.calcRotation(axis, v, delta, this.rottop);
		this.modeltop.setRotation(this.rottop);
	}

	rotateBot(delta, v, axis) {
		this.rotbot = this.modelbot.getRotation();
		this.rotbot = this.calcRotation(axis, v, delta, this.rotbot);
		this.modelbot.setRotation(this.rotbot);
	}

	rotateTopAndBot(delta, v, axis) {
		this.rotateTop(delta, v, axis);
		this.rotateBot(delta, v, axis);
	}

	calcRotation(axis, v, delta, rot) {
		axis.forEach(function(e, index) {
			if (e == 1) {
				rot[index] += v * delta;
			}
		});
		return rot;
	}

	move(delta, keys) {
		if (keys['W'.charCodeAt(0)]) {
			this.moveForward(delta * this.d);
		}
		if (keys['S'.charCodeAt(0)]) {
			this.moveForward(delta * -this.d);
		}
	}

	moveForward(d) {
		this.rot = this.modelbot.getRotation();
		this.rotf = this.modelbot.getRotationF();
		this.forward = [
			Math.sin(glMatrix.toRadian(this.rot[1] + this.rotf[1])),
			0,
			Math.cos(glMatrix.toRadian(this.rot[1] + this.rotf[1]))
		];
		vec3.normalize(this.forward, this.forward);
		this.transbot = this.modelbot.getTrans();
		this.transtop = this.modeltop.getTrans();
		this.temp = vec3.create();
		vec3.mul(this.temp, [d, d, d], this.forward);
		vec3.add(this.transbot, this.transbot, this.temp);
		this.modelbot.setTrans(this.transbot);
		vec3.add(this.transtop, this.transtop, this.temp);
		this.modelbot.setTrans(this.transtop);
	}

	fire(keys) {
		if (!this.bombVisible) {
			if (keys['V'.charCodeAt(0)] && !this.bombVisible) {
				this.transtop = this.modeltop.getTrans();
				this.rot = this.modeltop.getRotation();
				this.rotf = this.modeltop.getRotationF();
				this.forward = [
					Math.sin(glMatrix.toRadian(this.rot[1] + this.rotf[1])),
					1,
					Math.cos(glMatrix.toRadian(this.rot[1] + this.rotf[1]))
				];
				this.bomb
					.getModel()
					.setTrans([
						this.transtop[0] + 3 * this.forward[0] - 2.87,
						1.36,
						this.transtop[2] + 3 * this.forward[2]
					]);
				this.bomb.getModel().setRotation([-this.rot[1], 0, 0]);
				this.bombVisible = true;

				var that = this;
				this.bombDirection = this.forward;
				this.bombMoving = true;
				this.bomb.setOn(1);
				setTimeout(function() {
					that.getBomb().setOn(0);
					that.hideBomb();
					that = null;
				}, 1500);
			}
		}
	}

	hideBomb() {
		this.bombVisible = false;
		this.bombMoving = false;
	}

	draw(gl, world, view, proj, light) {
		this.modeltop.draw(gl, world, view, proj, light);
		this.modelbot.draw(gl, world, view, proj, light);
		if (this.bombVisible) {
			this.bomb.draw(gl, world, view, proj, light);
		}
	}

	update(delta) {
		this.modeltop.update(delta);
		this.modelbot.update(delta);
		this.bomb.getModel().update(delta);
		if (this.bombMoving) {
			this.bombTrans = this.bomb.getModel().getTrans();
			this.bomb
				.getModel()
				.setTrans([
					this.bombTrans[0] +
						delta * this.bombSpeed * this.bombDirection[0],
					this.bombTrans[1],
					this.bombTrans[2] +
						delta * this.bombSpeed * this.bombDirection[2]
				]);
		}
	}
}
