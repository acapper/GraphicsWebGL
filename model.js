class Model {
	constructor(
		gl,
		modeljson,
		texture,
		shader,
		scale,
		rotation,
		translation,
		meshIndices
	) {
		this.gl = gl;

		this.modeljson = modeljson;
		this.texture = texture;
		this.modelTexture = null;
		this.meshIndices = meshIndices;

		this.shader = shader;

		this.indicesLength = [];
		this.indexBuffer = [];
		this.buffers = [];
		this.bufferKeys = [
			{
				key: 'position',
				numOfEls: 3,
				size: 3,
				offset: 0
			},
			{
				key: 'texture',
				numOfEls: 2,
				size: 2,
				offset: 0
			},
			{
				key: 'normal',
				numOfEls: 3,
				size: 3,
				offset: 0
			}
		];

		this.identityMat = new Float32Array(16);
		mat4.identity(this.identityMat);

		// Static transforms
		// TO DO Combine xrot yrot zrot into vector
		this.fRot = rotation;
		this.fRotMat = new Float32Array(16);

		this.fscale = scale;
		this.fScaleMat = new Float32Array(16);
		this.ftrans = translation;
		this.fTransMat = new Float32Array(16);
		this.rxm = mat4.create();
		this.rym = mat4.create();
		this.rzm = mat4.create();

		// Dynamic transforms
		// TO DO Combine xrot yrot zrot into vector
		this.rot = [0, 0, 0];
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
		this.bindTexture();
	}

	getShader() {
		return this.shader;
	}

	createBuffers() {
		var i = 0;
		this.modeljson.meshes.forEach(e => {
			if (this.meshIndices == null || this.meshIndices.indexOf(i) > -1) {
				var modelIndicies = [].concat.apply([], e.faces);
				var modelVerts = e.vertices;
				var modelTextureCoords = e.texturecoords[0];
				var modelNormals = e.normals;

				this.indicesLength.push(modelIndicies.length);
				this.createNewIndexBuffer();
				this.bindBufferData(
					this.getLastIndexBuffer(),
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
			i++;
		});
	}

	setRotation(rot) {
		this.rot = rot;
	}
	getRotation() {
		return this.rot;
	}

	createNewIndexBuffer() {
		this.indexBuffer.push(this.gl.createBuffer());
	}

	createNewBuffer() {
		this.buffers.push(this.gl.createBuffer());
	}

	bindBufferData(bufferL, data, type) {
		this.gl.bindBuffer(type, bufferL);
		this.gl.bufferData(type, data, this.gl.DYNAMIC_DRAW);
	}

	getLastBuffer() {
		return this.buffers[this.buffers.length - 1];
	}

	getLastIndexBuffer() {
		return this.indexBuffer[this.indexBuffer.length - 1];
	}

	bindIndexBuffers(i) {
		this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer[i]);
	}

	bindArrayBuffers(i) {
		var program = this.shader.getProgram();
		var j = 0;

		this.bufferKeys.forEach(e => {
			var location = this.gl.getAttribLocation(program, e.key);
			this.bindArrayBuffer(
				this.buffers[i * this.bufferKeys.length + j],
				location,
				e.numOfEls,
				e.size,
				e.offset
			);
			j++;
		});
	}

	bindArrayBuffer(vbo, attribL, numOfEls, size, offset) {
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo);
		this.gl.vertexAttribPointer(
			attribL, // Attribute location
			numOfEls, // Number of elements per attribute
			this.gl.FLOAT, // Type of elements
			this.gl.FALSE,
			size * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
			offset * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
		);
		this.gl.enableVertexAttribArray(attribL);
	}

	bindTexture() {
		this.modelTexture = this.gl.createTexture();
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.modelTexture);
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

	draw(world, view) {
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.modelTexture);
		this.gl.activeTexture(this.gl.TEXTURE0);
		for (var i = 0; i < this.indexBuffer.length; i++) {
			this.gl.uniformMatrix4fv(this.modelL, this.gl.FALSE, this.model);

			mat4.identity(this.nmatrix4);
			mat4.mul(this.nmatrix4, this.nmatrix4, view);
			mat4.mul(this.nmatrix4, this.nmatrix4, world);
			mat4.mul(this.nmatrix4, this.nmatrix4, this.model);

			mat3.fromMat4(this.nmatrix3, this.nmatrix4);
			mat3.invert(this.nmatrix3, this.nmatrix3);
			mat3.transpose(this.nmatrix3, this.nmatrix3);

			this.bindArrayBuffers(i);
			this.bindIndexBuffers(i);
			this.bindUniforms();

			this.gl.drawElements(
				this.gl.TRIANGLES,
				this.indicesLength[i],
				this.gl.UNSIGNED_SHORT,
				0
			);
		}
	}

	update(delta) {
		this.transform(delta);
	}

	transform(delta) {
		mat4.mul(this.model, this.identityMat, this.identityMat);

		this.staticTransform();
		this.dynamicTransform();
	}

	staticTransform() {
		this.model = this.transformModel(
			this.model,
			this.fscale,
			this.fScaleMat,
			this.fRot,
			this.fRotMat,
			this.ftrans,
			this.fTransMat
		);
	}

	dynamicTransform() {
		this.model = this.transformModel(
			this.model,
			this.scale,
			this.scaleMat,
			this.rot,
			this.rotMat,
			this.trans,
			this.transMat
		);
	}

	transformModel(model, scale, scaleMat, rot, rotMat, trans, transMat) {
		// Scale
		mat4.fromScaling(scaleMat, scale);
		mat4.mul(model, model, scaleMat);

		// Rotate
		rotMat = this.rotateMat(
			rotMat,
			glMatrix.toRadian(rot[0]),
			glMatrix.toRadian(rot[1]),
			glMatrix.toRadian(rot[2])
		);
		mat4.mul(model, model, rotMat);

		// Translate
		mat4.fromTranslation(transMat, trans);
		mat4.mul(model, model, transMat);
		return model;
	}

	rotateMat(mat, rxa, rya, rza) {
		mat4.mul(this.rxm, this.identityMat, this.identityMat);
		mat4.mul(this.rym, this.identityMat, this.identityMat);
		mat4.mul(this.rzm, this.identityMat, this.identityMat);
		mat4.fromRotation(this.rxm, rxa, [1, 0, 0]);
		mat4.fromRotation(this.rym, rya, [0, 1, 0]);
		mat4.fromRotation(this.rzm, rza, [0, 0, 1]);
		mat4.mul(mat, this.identityMat, this.identityMat);
		mat4.mul(mat, mat, this.rxm);
		mat4.mul(mat, mat, this.rym);
		mat4.mul(mat, mat, this.rzm);
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
}
