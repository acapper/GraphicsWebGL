class Model {
	constructor(model) {
		this.meshes = [];
		for (var i = 0; i < model.meshes.length; i++) {
			this.meshes.push(
				new Mesh({
					gl: model.gl,
					texture: model.texture[i],
					texturescale: model.texturescale,
					normalmap: model.normalmap,
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

	getMeshes() {
		return this.meshes;
	}

	setMeshes(meshes) {
		this.meshes = meshes;
	}

	draw(gl, world, view, proj, lightsJSON) {
		for (var i = 0; i < this.meshes.length; i++) {
			this.meshes[i].draw(gl, world, view, proj, lightsJSON);
		}
	}

	update() {
		for (var i = 0; i < this.meshes.length; i++) {
			this.meshes[i].update();
		}
	}
}
