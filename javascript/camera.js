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

	setLookAt(look) {
		this.viewLook = look;
	}

	// Create and return a camera view matrix
	getCameraMat() {
		mat4.lookAt(this.proj, this.viewPos, this.viewLook, this.viewUp);
		return this.proj;
	}

	// Translate camera lookat and position
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

	// 3d rotate camera position [xaxisangle, yaxisangle, zaxisangle]
	rotateViewPos(rot) {
		// Convert position to homogeneous coordinates
		var viewPosH = [
			this.viewPos[0] - this.viewLook[0],
			this.viewPos[1] - this.viewLook[1],
			this.viewPos[2] - this.viewLook[2],
			1
		];
		// Create rotation matrix
		this.rotMat = this.rotateMat(
			this.rotMat,
			glMatrix.toRadian(rot[0]),
			glMatrix.toRadian(rot[1]),
			glMatrix.toRadian(rot[2])
		);
		// Transform homogeneous position
		vec4.transformMat4(viewPosH, viewPosH, this.rotMat);
		// Covert position to vec3
		this.viewPos = [
			viewPosH[0] + this.viewLook[0],
			viewPosH[1] + this.viewLook[1],
			viewPosH[2] + this.viewLook[2]
		];
		viewPosH = null;
		rot = null;
	}

	// 3d rotate camera lokkat [xaxisangle, yaxisangle, zaxisangle]
	rotateLookAt(rot) {
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
			glMatrix.toRadian(rot[0]),
			glMatrix.toRadian(rot[1]),
			glMatrix.toRadian(rot[2])
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
