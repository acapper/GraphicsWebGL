class Model {
	constructor(gl, modeljson, texture, shader, scale, rotation, translation) {
		this.gl = gl;

		this.modeljson = modeljson;
		this.texture = texture;

		this.shader = shader;

		this.indicesLength = 0;
		this.indexBuffer = null;
		this.buffers = [];

		this.angle = 0;

		this.identityMat = new Float32Array(16);
		mat4.identity(this.identityMat);

		// Static transforms
		// TO DO Combine xrot yrot zrot into vector
		this.fxRot = glMatrix.toRadian(rotation[0]);
		this.fxRotMat = new Float32Array(16);
		this.fyRot = glMatrix.toRadian(rotation[1]);
		this.fyRotMat = new Float32Array(16);
		this.fzRot = glMatrix.toRadian(rotation[2]);
		this.fzRotMat = new Float32Array(16);
		this.fRotMat = new Float32Array(16);

		this.fscale = scale;
		this.fScaleMat = new Float32Array(16);
		this.ftrans = translation;
		this.fTransMat = new Float32Array(16);

		// Dynamic transforms
		// TO DO Combine xrot yrot zrot into vector
		this.xRot = new Float32Array(16);
		this.yRot = new Float32Array(16);
		this.zRot = new Float32Array(16);
		this.rotMat = new Float32Array(16);

		this.scale = [1, 1, 1];
		this.scaleMat = new Float32Array(16);

		this.trans = [0, 0, 0];
		this.transMat = new Float32Array(16);

		// Uniform matrices
		this.model = new Float32Array(16);

		this.nmatrix4 = new Float32Array(16);
		this.nmatrix3 = new Float32Array(9);

		mat4.identity(this.model);

		this.modelL = gl.getUniformLocation(this.shader.getProgram(), 'model');

		this.nmatrixL = gl.getUniformLocation(
			this.shader.getProgram(),
			'nmatrix'
		);

		this.staticTransform();

		this.createBuffers();
	}

	getShader() {
		return this.shader;
	}

	createBuffers() {
		var modelIndicies = [].concat.apply([], this.modeljson.meshes[0].faces);
		var modelVerts = this.modeljson.meshes[0].vertices;
		var modelTextureCoords = this.modeljson.meshes[0].texturecoords[0];
		var modelNormals = this.modeljson.meshes[0].normals;

		this.indicesLength = modelIndicies.length;
		this.indexBuffer = this.gl.createBuffer();
		this.bindBufferData(
			this.indexBuffer,
			new Uint16Array(modelIndicies),
			this.gl.ELEMENT_ARRAY_BUFFER
		);

		this.createNewBuffer();
		this.bindBufferData(
			this.getLastBuffer(),
			new Float32Array(modelVerts),
			this.gl.ARRAY_BUFFER
		);
		this.createNewBuffer();
		this.bindBufferData(
			this.getLastBuffer(),
			new Float32Array(modelTextureCoords),
			this.gl.ARRAY_BUFFER
		);
		this.createNewBuffer();
		this.bindBufferData(
			this.getLastBuffer(),
			new Float32Array(modelNormals),
			this.gl.ARRAY_BUFFER
		);
	}

	createNewBuffer() {
		this.buffers.push(this.gl.createBuffer());
	}

	bindBufferData(bufferL, data, type) {
		this.gl.bindBuffer(type, bufferL);
		this.gl.bufferData(type, data, this.gl.STATIC_DRAW);
	}

	getLastBuffer() {
		return this.buffers[this.buffers.length - 1];
	}

	bindArrayBuffers() {
		var pL = this.gl.getAttribLocation(
			this.shader.getProgram(),
			'position'
		);
		this.bindArrayBuffer(this.buffers[0], pL, 3, 3, 0);
		var tL = this.gl.getAttribLocation(this.shader.getProgram(), 'texture');
		this.bindArrayBuffer(this.buffers[1], tL, 2, 2, 0);
		var nL = this.gl.getAttribLocation(this.shader.getProgram(), 'normal');
		this.bindArrayBuffer(this.buffers[2], nL, 3, 3, 0);
	}

	bindArrayBuffer(vbo, attribL, numOfEls, size, offset) {
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
		this.gl.vertexAttribPointer(
			attribL, // Attribute location
			numOfEls, // Number of elements per attribute
			this.gl.FLOAT, // Type of elements
			this.gl.FALSE,
			size * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
			offset // Offset from the beginning of a single vertex to this attribute
		);
		this.gl.enableVertexAttribArray(attribL);
	}

	bindTexture() {
		var modelTexture = this.gl.createTexture();
		this.gl.bindTexture(this.gl.TEXTURE_2D, modelTexture);
		this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
		this.gl.texParameteri(
			this.gl.TEXTURE_2D,
			this.gl.TEXTURE_WRAP_S,
			this.gl.CLAMP_TO_EDGE
		);
		this.gl.texParameteri(
			this.gl.TEXTURE_2D,
			this.gl.TEXTURE_WRAP_T,
			this.gl.CLAMP_TO_EDGE
		);
		this.gl.texParameteri(
			this.gl.TEXTURE_2D,
			this.gl.TEXTURE_MIN_FILTER,
			this.gl.LINEAR
		);
		this.gl.texParameteri(
			this.gl.TEXTURE_2D,
			this.gl.TEXTURE_MAG_FILTER,
			this.gl.LINEAR
		);
		this.gl.texImage2D(
			this.gl.TEXTURE_2D,
			0,
			this.gl.RGBA,
			this.gl.RGBA,
			this.gl.UNSIGNED_BYTE,
			this.texture
		);
		this.gl.activeTexture(this.gl.TEXTURE0);
	}

	bindUniforms() {
		//Uniforms
		this.gl.useProgram(this.shader.getProgram());

		this.gl.uniformMatrix4fv(this.modelL, this.gl.FALSE, this.model);
		this.gl.uniformMatrix3fv(this.nmatrixL, this.gl.FALSE, this.nmatrix3);
	}

	rotateMat(mat, rxm, rym, rzm, rxa, rya, rza) {
		mat4.fromRotation(rxm, rxa, [1, 0, 0]);
		mat4.fromRotation(rym, rya, [0, 1, 0]);
		mat4.fromRotation(rzm, rza, [0, 0, 1]);
		mat4.mul(mat, this.identityMat, this.identityMat);
		mat4.mul(mat, mat, rxm);
		mat4.mul(mat, mat, rym);
		mat4.mul(mat, mat, rzm);
		return mat;
	}

	rotateX(angle, mat) {
		return mat4.rotate(mat, this.identityMat, angle, [1, 0, 0]);
	}

	rotateY(angle, mat) {
		return mat4.rotate(mat, this.identityMat, angle, [0, 1, 0]);
	}

	rotateZ(angle, mat) {
		return mat4.rotate(mat, this.identityMat, angle, [0, 0, 1]);
	}

	draw(delta, world, view) {
		this.transformModel(delta);

		mat4.identity(this.nmatrix4);
		mat4.mul(this.nmatrix4, this.nmatrix4, view);
		mat4.mul(this.nmatrix4, this.nmatrix4, world);
		mat4.mul(this.nmatrix4, this.nmatrix4, this.model);

		mat3.fromMat4(this.nmatrix3, this.nmatrix4);
		mat3.invert(this.nmatrix3, this.nmatrix3);
		mat3.transpose(this.nmatrix3, this.nmatrix3);

		this.bindArrayBuffers();
		this.bindUniforms();

		this.gl.clearColor(0.1, 0.1, 0.1, 1);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
		this.gl.uniformMatrix4fv(this.modelL, this.gl.FALSE, this.model);

		//this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
		//this.gl.activeTexture(this.gl.TEXTURE0);
		this.bindTexture();

		this.gl.drawElements(
			this.gl.TRIANGLES,
			this.indicesLength,
			this.gl.UNSIGNED_SHORT,
			0
		);
	}

	transformModel(delta) {
		mat4.mul(this.model, this.identityMat, this.identityMat);

		this.angle = ((delta / 1000) * (2 * Math.PI)) / 4;

		this.staticTransform();
		this.dynamicTransform();
	}

	staticTransform() {
		// Scale
		mat4.fromScaling(this.fScaleMat, this.fscale);
		mat4.mul(this.model, this.model, this.fScaleMat);

		// Rotate
		this.fRotMat = this.rotateMat(
			this.fRotMat,
			this.fxRotMat,
			this.fyRotMat,
			this.fzRotMat,
			this.fxRot,
			this.fyRot,
			this.fzRot
		);
		mat4.mul(this.model, this.model, this.fRotMat);

		// Translate
		mat4.fromTranslation(this.fTransMat, this.ftrans);
		mat4.mul(this.model, this.model, this.fTransMat);
	}

	dynamicTransform() {
		// Scale
		mat4.fromScaling(this.scaleMat, this.scale);
		mat4.mul(this.model, this.model, this.scaleMat);

		// Rotate
		this.rotMat = this.rotateMat(
			this.rotMat,
			this.xRot,
			this.yRot,
			this.zRot,
			0,
			0,
			this.angle / 6
		);
		mat4.mul(this.model, this.model, this.rotMat);

		// Translate
		mat4.fromTranslation(this.transMat, this.trans);
		mat4.mul(this.model, this.model, this.transMat);
	}
}
