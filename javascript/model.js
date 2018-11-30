class Model {
	constructor(model) {
		this.meshes = [];
		// Create a mesh object for each mesh
		for (var i = 0; i < model.meshes.length; i++) {
			this.meshes.push(
				new Mesh({
					gl: model.gl,
					texture: model.texture[i],
					texturescale: model.texturescale,
					normalmap: model.normalmap[i],
					mesh: model.meshes[i],
					shader: model.shader,
					rotation: model.rotation,
					scale: model.scale,
					translation: model.translation,
					shininess: model.shininess,
					emmissive: model.emmissive
				})
			);
		}
	}

	// Get Meshes
	getMeshes() {
		return this.meshes;
	}

	// Set Meshes
	setMeshes(meshes) {
		this.meshes = meshes;
	}

	// Draw all meshes
	draw(gl, world, view, proj, lightsJSON) {
		for (var i = 0; i < this.meshes.length; i++) {
			this.meshes[i].draw(gl, world, view, proj, lightsJSON);
		}
	}

	// Update all meshes
	update() {
		for (var i = 0; i < this.meshes.length; i++) {
			this.meshes[i].update();
		}
	}
}
