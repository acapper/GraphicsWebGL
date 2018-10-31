class Camera {
	constructor(camera) {
		this.viewPos = camera.viewPos;
		this.viewLook = camera.viewLook;
		this.viewUp = camera.viewUp;
		this.proj = new Float32Array(16);
		this.identityMat = new Float32Array(16);
		mat4.identity(this.identityMat);
		this.rxm = mat4.create();
		this.rym = mat4.create();
		this.rzm = mat4.create();
		this.rotMat = mat4.create();
	}

	getCameraMat() {
		mat4.lookAt(this.proj, this.viewPos, this.viewLook, this.viewUp);
		return this.proj;
	}

	transCamera(trans) {
		this.viewPos = [
			this.viewPos[0] + trans[0],
			this.viewPos[1] + trans[1],
			this.viewPos[2] + trans[2]
		];
		this.viewLook = [
			this.viewLook[0] + trans[0],
			this.viewLook[1] + trans[1],
			this.viewLook[2] + trans[2]
		];
		trans = null;
	}

	rotateViewPos(rot) {
		var viewPosH = [
			this.viewPos[0] - this.viewLook[0],
			this.viewPos[1] - this.viewLook[1],
			this.viewPos[2] - this.viewLook[2],
			1
		];
		this.rotMat = this.rotateMat(this.rotMat, rot[0], rot[1], rot[2]);
		vec4.transformMat4(viewPosH, viewPosH, this.rotMat);
		this.viewPos = [
			viewPosH[0] + this.viewLook[0],
			viewPosH[1] + this.viewLook[1],
			viewPosH[2] + this.viewLook[2]
		];
		viewPosH = null;
		rot = null;
	}

	rotateLookAt(rot) {
		var viewPosH = [
			viewPos[0] - viewLook[0],
			viewPos[1] - viewLook[1],
			viewPos[2] - viewLook[2],
			1
		];
		this.rotMat = this.rotateMat(this.rotMat, rot[0], rot[1], rot[2]);
		vec4.transformMat4(viewPosH, viewPosH, this.rotMat);
		this.viewPos = [
			viewPosH[0] + viewLook[0],
			viewPosH[1] + viewLook[1],
			viewPosH[2] + viewLook[2]
		];
		viewPosH = null;
		rot = null;
	}

	rotateMat(mat, rxa, rya, rza) {
		mat4.fromRotation(this.rxm, rxa, [1, 0, 0]);
		mat4.fromRotation(this.rym, rya, [0, 1, 0]);
		mat4.fromRotation(this.rzm, rza, [0, 0, 1]);
		mat4.mul(mat, this.identityMat, this.identityMat);
		mat4.mul(mat, mat, this.rxm);
		mat4.mul(mat, mat, this.rym);
		mat4.mul(mat, mat, this.rzm);
		rxa = null;
		rya = null;
		rza = null;
		return mat;
	}
}
