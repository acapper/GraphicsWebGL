class Point {
	constructor(point) {
		this.position = point.position;
		this.init(point.maxheight);
	}

	init(height) {
		this.maxHeight = height + Math.random() * 1.5 + -1;
		this.speed = height + Math.random() * 4 + 1;
		this.centerSpeed = height + Math.random() * 0.75 + 0.25;
	}

	getPosition() {
		return this.position;
	}

	getSpeed() {
		return this.speed;
	}

	getCenterSpeed() {
		return this.centerSpeed;
	}

	getMaxHeight() {
		return this.maxHeight;
	}

	setPosition(pos) {
		this.position = pos;
	}

	update() {
		this.position[1] += 0.1 * Math.sqrt(Math.random());
		if (this.position[1] > 1.5) {
			this.position[1] = 0;
		}
	}
}
