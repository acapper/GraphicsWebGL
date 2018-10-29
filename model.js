class Model {
	constructor(json) {
		this.gl = json.gl;

		this.modeljson = json.modeljson;
		this.texture = json.texture;
		this.modelTexture = null;
		this.meshIndices = json.meshIndices;

		this.shader = json.shader;

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
		this.fRot = json.r;
		this.fRotMat = new Float32Array(16);

		this.fscale = json.s;
		this.fScaleMat = new Float32Array(16);
		this.ftrans = json.t;
		this.fTransMat = new Float32Array(16);
		this.rxm = mat4.create();
		this.rym = mat4.create();
		this.rzm = mat4.create();

		// Dynamic transforms
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

		var program = this.shader.getProgram();
		this.gl.useProgram(program);
		this.modelL = this.gl.getUniformLocation(program, 'model');
		this.nmatrixL = this.gl.getUniformLocation(program, 'nmatrix');
		this.viewL = this.gl.getUniformLocation(program, 'view');
		this.worldL = this.gl.getUniformLocation(program, 'world');
		this.projL = this.gl.getUniformLocation(program, 'proj');
		this.lightColL = this.gl.getUniformLocation(program, 'lightCol');
		this.lightDirL = this.gl.getUniformLocation(program, 'lightDir');
		this.lightPosL = this.gl.getUniformLocation(program, 'lightPos');
		this.lightOnL = this.gl.getUniformLocation(program, 'lightOn');

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

	getRotationF() {
		return this.fRot;
	}

	setTrans(trans) {
		this.trans = trans;
	}

	getTrans() {
		return this.trans;
	}

	createNewIndexBuffer() {
		this.indexBuffer.push(this.gl.createBuffer());
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
			//Work on error handling for missing attribs
			if (location != -1) {
				this.bindArrayBuffer(
					this.buffers[i * this.bufferKeys.length + j],
					location,
					e.numOfEls,
					e.size,
					e.offset
				);
			} else {
				//console.log(e.key);
				//console.log(this.modeljson);
				//throw 'Error';
			}
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

	bindUniforms(world, view, proj, lights) {
		//Uniforms
		this.gl.useProgram(this.shader.getProgram());

		this.gl.uniformMatrix4fv(this.projL, this.gl.FALSE, proj);
		this.gl.uniformMatrix4fv(this.viewL, this.gl.FALSE, view);
		this.gl.uniformMatrix4fv(this.worldL, this.gl.FALSE, world);
		this.gl.uniformMatrix4fv(this.modelL, this.gl.FALSE, this.model);

		this.gl.uniformMatrix4fv(this.modelL, this.gl.FALSE, this.model);
		this.gl.uniformMatrix3fv(this.nmatrixL, this.gl.FALSE, this.nmatrix3);

		//console.log(tc);
		//throw 'error';

		this.gl.uniform3fv(this.lightColL, lights.c);
		this.gl.uniform3fv(this.lightDirL, lights.d);
		this.gl.uniform3fv(this.lightPosL, lights.p);
		this.gl.uniform1iv(this.lightOnL, lights.on);
	}

	draw(world, view, proj, lights) {
		mat4.fromTranslation(world, this.trans);

		this.gl.bindTexture(this.gl.TEXTURE_2D, this.modelTexture);
		this.gl.activeTexture(this.gl.TEXTURE0);
		for (var i = 0; i < this.indexBuffer.length; i++) {
			mat4.identity(this.nmatrix4);
			mat4.mul(this.nmatrix4, this.nmatrix4, view);
			mat4.mul(this.nmatrix4, this.nmatrix4, world);
			mat4.mul(this.nmatrix4, this.nmatrix4, this.model);

			mat3.fromMat4(this.nmatrix3, this.nmatrix4);
			mat3.invert(this.nmatrix3, this.nmatrix3);
			mat3.transpose(this.nmatrix3, this.nmatrix3);

			this.bindArrayBuffers(i);
			this.bindIndexBuffers(i);
			this.bindUniforms(world, view, proj, lights);

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

		// Scale
		mat4.fromScaling(scaleMat, scale);
		mat4.mul(model, model, scaleMat);
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
