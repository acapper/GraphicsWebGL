class Fire {
	constructor(fire) {
		this.shader = fire.shader;
		this.maxPoints = fire.maxpoints;
		this.center = fire.center;
		this.maxHeight = fire.maxheight;
		this.radius = fire.radius;

		this.points = [];
		for (var i = 0; i < this.maxPoints; i++) {
			this.points.push(
				this.createPoint(fire.center, fire.radius, fire.maxheight)
			);
		}

		this.pointBuffer = gl.createBuffer();
		var pointsVectors = [];
		this.points.forEach(e => {
			pointsVectors = pointsVectors.concat(e.getPosition());
		});

		gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array(pointsVectors),
			gl.DYNAMIC_DRAW
		);

		this.texture = this.createTexture(gl, fire.texture);

		var program = this.shader.getProgram();
		gl.useProgram(program);
		this.viewL = gl.getUniformLocation(program, 'view');
		this.worldL = gl.getUniformLocation(program, 'world');
		this.projL = gl.getUniformLocation(program, 'proj');
		this.cameraPositionL = gl.getUniformLocation(program, 'cameraPosition');
		this.positionL = gl.getUniformLocation(program, 'position');
		this.textureSampler = gl.getUniformLocation(program, 'tex');
		gl.uniform1i(this.textureSampler, 0); // texture unit 0
	}

	createPoint(center, radius, maxHeight) {
		var r = radius * Math.sqrt(Math.random());
		var theta = Math.random() * 2 * Math.PI;
		var x = center[0] + r * Math.cos(theta);
		var z = center[2] + r * Math.sin(theta);
		return new Point({
			position: [x, center[1] + maxHeight * Math.sqrt(Math.random()), z],
			maxheight: maxHeight
		});
	}

	createTexture(gl, texture) {
		var glTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, glTexture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		// Set image wrap eg. strech, tile, center
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		// Set image filtering
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		// Bind image data
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			texture
		);
		gl = null;
		return glTexture;
	}

	draw(gl, world, view, proj, cameraPosition) {
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		// Use shader
		gl.useProgram(this.shader.getProgram());
		//Uniforms
		gl.uniformMatrix4fv(this.projL, gl.FALSE, proj);
		gl.uniformMatrix4fv(this.viewL, gl.FALSE, view);
		gl.uniformMatrix4fv(this.worldL, gl.FALSE, world);
		gl.uniform3fv(this.cameraPositionL, cameraPosition);
		gl.uniform3fv(this.centerL, this.center);

		// Bind texture
		gl.activeTexture(gl.TEXTURE0);
		if (this.texture) {
			gl.bindTexture(gl.TEXTURE_2D, this.texture);
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
		gl.vertexAttribPointer(
			this.positionL, // Attribute location
			3, // Number of elements per attribute
			gl.FLOAT, // Type of elements
			gl.FALSE,
			3 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
			0 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
		);
		gl.enableVertexAttribArray(this.positionL);

		gl.drawArrays(gl.POINTS, 0, this.points.length);
	}

	update(delta) {
		var pointsVectors = [];
		var pos = vec3.create();
		this.points.forEach(e => {
			this.updatePoint(e, delta, pos);
			pointsVectors = pointsVectors.concat(e.getPosition());
		});

		gl.bindBuffer(gl.ARRAY_BUFFER, this.pointBuffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array(pointsVectors),
			gl.DYNAMIC_DRAW
		);
	}

	updatePoint(point, delta, pos) {
		pos = point.getPosition();
		var dirToCenter = vec3.create();
		vec3.sub(dirToCenter, pos, this.center);
		dirToCenter[1] = 0;

		pos[0] -= delta * point.getCenterSpeed() * dirToCenter[0];
		pos[2] -= delta * point.getCenterSpeed() * dirToCenter[2];

		pos[1] += delta * point.getSpeed() * Math.sqrt(Math.random());
		if (pos[1] > point.getMaxHeight()) {
			var r = this.radius * Math.sqrt(Math.random());
			var theta = Math.random() * 2 * Math.PI;
			var x = this.center[0] + r * Math.cos(theta);
			var z = this.center[2] + r * Math.sin(theta);
			pos = [x, this.center[1], z];
		}
		point.setPosition(pos);
	}
}
