class Camera {
	/*{
		viewPos: [0, 0, 0],
		viewLook: [0, 0, 0],
		viewUp: [0, 1, 0]
	}*/
	constructor(camera) {
		// Initialise attributes
		this.viewPos = camera.viewPos;
		this.startPos = camera.viewPos;
		this.viewLook = camera.viewLook;
		this.startLook = camera.viewLook;
		this.viewUp = camera.viewUp;

		// Allocate memory
		this.proj = new Float32Array(16);
		this.identityMat = new Float32Array(16);
		mat4.identity(this.identityMat);
		this.rxm = mat4.create();
		this.rym = mat4.create();
		this.rzm = mat4.create();
		this.rotMat = mat4.create();
	}

	getViewPosition() {
		return this.viewPos;
	}

	setLookAt(look) {
		this.viewLook = look;
	}

	// Create and return a camera view matrix
	getCameraMat() {
		mat4.lookAt(this.proj, this.viewPos, this.viewLook, this.viewUp);
		return this.proj;
	}

	getForward() {
		var forward = vec3.create();
		vec3.sub(forward, this.viewLook, this.viewPos);
		vec3.normalize(forward, forward);
		return forward;
	}

	// Translate camera lookat and position in the direction it is facing
	forward(speed) {
		var forward = vec3.create();
		vec3.sub(forward, this.viewLook, this.viewPos);
		vec3.normalize(forward, forward);
		vec3.mul(forward, [speed, speed, speed], forward);
		vec3.add(this.viewPos, forward, this.viewPos);
		vec3.add(this.viewLook, forward, this.viewLook);
	}

	// Translate camera lookat and position in the perpendicular side direction it is facing
	sideways(speed) {
		var forward = vec3.create();
		vec3.sub(forward, this.viewLook, this.viewPos);
		vec3.normalize(forward, forward);
		vec3.cross(forward, forward, this.viewUp);
		vec3.mul(forward, [speed, speed, speed], forward);
		vec3.add(this.viewPos, forward, this.viewPos);
		vec3.add(this.viewLook, forward, this.viewLook);
	}

	// Translate camera lookat and position in the perpendicular up direction it is facing
	up(speed) {
		vec3.add(this.viewPos, [0, speed, 0], this.viewPos);
		vec3.add(this.viewLook, [0, speed, 0], this.viewLook);
	}

	// 3d rotate camera lokkat [xaxisangle, yaxisangle, zaxisangle]
	rotateLookAtHorizontal(rot) {
		// Convert lookat to homogeneous coordinates
		var viewLookH = [
			this.viewLook[0] - this.viewPos[0],
			this.viewLook[1] - this.viewPos[1],
			this.viewLook[2] - this.viewPos[2],
			1
		];
		// Create rotation matrix
		this.rotMat = this.rotateMat(
			this.rotMat,
			glMatrix.toRadian(this.viewUp[0] * rot[0]),
			glMatrix.toRadian(this.viewUp[1] * rot[1]),
			glMatrix.toRadian(this.viewUp[2] * rot[2])
		);
		// Transform homogeneous lookat
		vec4.transformMat4(viewLookH, viewLookH, this.rotMat);
		// Covert lookat to vec3
		this.viewLook = [
			viewLookH[0] + this.viewPos[0],
			viewLookH[1] + this.viewPos[1],
			viewLookH[2] + this.viewPos[2]
		];
		viewLookH = null;
		rot = null;
	}

	// Rotate camera lookat around perpendicular side direction camera is facing
	rotateLookAtVertical(rot) {
		// Get forward vector
		var forward = vec3.create();
		vec3.sub(forward, this.viewLook, this.viewPos);
		vec3.normalize(forward, forward);

		// Get side vector
		var side = vec3.create();
		vec3.cross(side, forward, this.viewUp);

		// Convert lookat to homogeneous coordinates
		var viewLookH = [
			this.viewLook[0] - this.viewPos[0],
			this.viewLook[1] - this.viewPos[1],
			this.viewLook[2] - this.viewPos[2],
			1
		];
		// Create rotation matrix
		this.rotMat = this.rotateMat(
			this.rotMat,
			glMatrix.toRadian(side[0] * rot),
			glMatrix.toRadian(side[1] * rot),
			glMatrix.toRadian(side[2] * rot)
		);
		// Transform homogeneous lookat
		vec4.transformMat4(viewLookH, viewLookH, this.rotMat);
		// Covert lookat to vec3
		this.viewLook = [
			viewLookH[0] + this.viewPos[0],
			viewLookH[1] + this.viewPos[1],
			viewLookH[2] + this.viewPos[2]
		];

		viewLookH = null;
		rot = null;
	}

	// Create a rotation matrix from a xaxisangle, yaxisangle, zaxisangle
	rotateMat(mat, rxa, rya, rza) {
		// Apply axis rotation
		mat4.fromRotation(this.rxm, rxa, [1, 0, 0]);
		mat4.fromRotation(this.rym, rya, [0, 1, 0]);
		mat4.fromRotation(this.rzm, rza, [0, 0, 1]);
		// Multiply rotations together
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
