class Skybox {
	constructor(skybox) {
		var gl = skybox.gl;

		var s = 500;
		this.cube = [];

		/*'textures/FullMoon/FullMoonRight2048.png',
		'textures/FullMoon/FullMoonLeft2048.png',
		'textures/FullMoon/FullMoonUp2048.png',
		'textures/FullMoon/FullMoonDown2048.png',
		'textures/FullMoon/FullMoonBack2048.png',
		'textures/FullMoon/FullMoonFront2048.png',*/
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

		for (var i = 0; i < skybox.textures.length; i++) {
			this.cube.push(
				new Mesh({
					gl,
					texture: skybox.textures[i],
					texturescale: 1,
					normalmap: null,
					mesh: skybox.mesh,
					shader: skybox.shader,
					rotation: facesRot[i],
					scale: [s + 1, s + 1, s + 1],
					translation: faces[i]
				})
			);
		}
	}

	draw(gl, world, view, proj) {
		for (var i = 0; i < this.cube.length; i++) {
			this.cube[i].draw(gl, world, view, proj);
		}
	}

	update() {
		for (var i = 0; i < this.cube.length; i++) {
			this.cube[i].update();
		}
	}
}
