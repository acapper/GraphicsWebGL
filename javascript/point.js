class Point {
	constructor(point) {
		this.position = point.position;
		this.maxHeight =
			point.maxheight +
			Math.random() * point.maxheight * 1.5 +
			-point.maxheight;
		this.speed = point.maxheight + Math.random() * 4 + 1;
		this.centerSpeed = point.maxheight + Math.random() * 2 - 2;
	}

	// Getters
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

	// Setters
	setPosition(pos) {
		this.position = pos;
	}
}
