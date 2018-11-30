class Point {
	constructor(point) {
		this.position = point.position;
		this.init(point.maxheight);
	}

	init(height) {
		this.maxHeight = height + Math.random() * height * 1.5 + -height;
		this.speed = height + Math.random() * 4 + 1;
		this.centerSpeed = height + Math.random() * 2 - 2;
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
