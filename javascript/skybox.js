class Skybox {
	constructor(skybox) {
		var gl = skybox.gl;

		var s = skybox.scale;
		this.cube = [];

		var faces = [
			[s, 0, 0],
			[-s, 0, 0],
			[0, s, 0],
			[0, -s, 0],
			[0, 0, -s],
			[0, 0, s]
		];

		var facesRot = [
			[90, 0, 90],
			[90, 0, -90],
			[0, 0, 180],
			[0, 0, 0],
			[90, 0, 0],
			[90, 0, 180]
		];

		// Create skybox cube
		for (var i = 0; i < skybox.textures.length; i++) {
			this.cube.push(
				new Mesh({
					gl,
					texture: skybox.textures[i],
					texturescale: 1,
					mesh: skybox.mesh,
					shader: skybox.shader,
					rotation: facesRot[i],
					scale: [s + 1, s + 1, s + 1],
					translation: faces[i],
					emmissive: [0, 0, 0]
				})
			);
		}
	}

	// Draw skybox cube
	draw(gl, world, view, proj) {
		for (var i = 0; i < this.cube.length; i++) {
			this.cube[i].draw(gl, world, view, proj);
		}
	}

	// Update skybox cube
	update() {
		for (var i = 0; i < this.cube.length; i++) {
			this.cube[i].update();
		}
	}
}
