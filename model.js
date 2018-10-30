class Model {
	constructor(json) {
		var gl = json.gl;
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
		gl.useProgram(program);
		this.modelL = gl.getUniformLocation(program, 'model');
		this.nmatrixL = gl.getUniformLocation(program, 'nmatrix');
		this.viewL = gl.getUniformLocation(program, 'view');
		this.worldL = gl.getUniformLocation(program, 'world');
		this.projL = gl.getUniformLocation(program, 'proj');
		this.lightColL = gl.getUniformLocation(program, 'lightCol');
		this.lightDirL = gl.getUniformLocation(program, 'lightDir');
		this.lightPosL = gl.getUniformLocation(program, 'lightPos');
		this.lightOnL = gl.getUniformLocation(program, 'lightOn');
		this.attenkcL = gl.getUniformLocation(program, 'attenuation_kc');
		this.attenklL = gl.getUniformLocation(program, 'attenuation_kl');
		this.attenkqL = gl.getUniformLocation(program, 'attenuation_kq');

		this.staticTransform();
		this.createBuffers(gl);
		this.bindTexture(gl);
	}

	getShader() {
		return this.shader;
	}

	createBuffers(gl) {
		var i = 0;
		this.modeljson.meshes.forEach(e => {
			if (this.meshIndices == null || this.meshIndices.indexOf(i) > -1) {
				var modelIndicies = [].concat.apply([], e.faces);
				var modelVerts = e.vertices;
				var modelTextureCoords = e.texturecoords[0];
				var modelNormals = e.normals;

				this.indicesLength.push(modelIndicies.length);
				this.createNewIndexBuffer(gl);
				this.bindBufferData(
					gl,
					this.getLastIndexBuffer(),
					new Uint16Array(modelIndicies),
					gl.ELEMENT_ARRAY_BUFFER
				);

				this.createNewBuffer(gl);
				this.bindBufferData(
					gl,
					this.getLastBuffer(),
					new Float32Array(modelVerts),
					gl.ARRAY_BUFFER
				);
				this.createNewBuffer(gl);
				this.bindBufferData(
					gl,
					this.getLastBuffer(),
					new Float32Array(modelTextureCoords),
					gl.ARRAY_BUFFER
				);
				this.createNewBuffer(gl);
				this.bindBufferData(
					gl,
					this.getLastBuffer(),
					new Float32Array(modelNormals),
					gl.ARRAY_BUFFER
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

	setRotationF(rot) {
		this.fRot = rot;
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

	createNewIndexBuffer(gl) {
		this.indexBuffer.push(gl.createBuffer());
	}

	createNewBuffer(gl) {
		this.buffers.push(gl.createBuffer());
	}

	bindBufferData(gl, bufferL, data, type) {
		gl.bindBuffer(type, bufferL);
		gl.bufferData(type, data, gl.STATIC_DRAW);
	}

	getLastBuffer() {
		return this.buffers[this.buffers.length - 1];
	}

	getLastIndexBuffer() {
		return this.indexBuffer[this.indexBuffer.length - 1];
	}

	bindIndexBuffers(gl, i) {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer[i]);
	}

	bindArrayBuffers(gl, i) {
		var program = this.shader.getProgram();
		var j = 0;

		this.bufferKeys.forEach(e => {
			var location = gl.getAttribLocation(program, e.key);
			//Work on error handling for missing attribs
			if (location != -1) {
				this.bindArrayBuffer(
					gl,
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

	bindArrayBuffer(gl, vbo, attribL, numOfEls, size, offset) {
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.vertexAttribPointer(
			attribL, // Attribute location
			numOfEls, // Number of elements per attribute
			gl.FLOAT, // Type of elements
			gl.FALSE,
			size * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
			offset * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
		);
		gl.enableVertexAttribArray(attribL);
	}

	bindTexture(gl) {
		this.modelTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.modelTexture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			this.texture
		);
		gl.activeTexture(gl.TEXTURE0);
	}

	bindUniforms(gl, world, view, proj, lights) {
		//Uniforms
		gl.useProgram(this.shader.getProgram());

		gl.uniformMatrix4fv(this.projL, gl.FALSE, proj);
		gl.uniformMatrix4fv(this.viewL, gl.FALSE, view);
		gl.uniformMatrix4fv(this.worldL, gl.FALSE, world);
		gl.uniformMatrix4fv(this.modelL, gl.FALSE, this.model);

		gl.uniformMatrix4fv(this.modelL, gl.FALSE, this.model);
		gl.uniformMatrix3fv(this.nmatrixL, gl.FALSE, this.nmatrix3);

		//console.log(tc);
		//throw 'error';

		gl.uniform3fv(this.lightColL, lights.c);
		gl.uniform3fv(this.lightDirL, lights.d);
		gl.uniform3fv(this.lightPosL, lights.p);
		gl.uniform1iv(this.lightOnL, lights.on);

		gl.uniform1f(this.attenkcL, 1.0);
		gl.uniform1f(this.attenklL, 0.05);
		gl.uniform1f(this.attenkqL, 0.05);
	}

	draw(gl, world, view, proj, lights) {
		mat4.fromTranslation(world, this.trans);

		gl.bindTexture(gl.TEXTURE_2D, this.modelTexture);
		gl.activeTexture(gl.TEXTURE0);
		for (var i = 0; i < this.indexBuffer.length; i++) {
			mat4.identity(this.nmatrix4);
			mat4.mul(this.nmatrix4, this.nmatrix4, view);
			mat4.mul(this.nmatrix4, this.nmatrix4, world);
			mat4.mul(this.nmatrix4, this.nmatrix4, this.model);

			mat3.fromMat4(this.nmatrix3, this.nmatrix4);
			mat3.invert(this.nmatrix3, this.nmatrix3);
			mat3.transpose(this.nmatrix3, this.nmatrix3);

			this.bindArrayBuffers(gl, i);
			this.bindIndexBuffers(gl, i);
			this.bindUniforms(gl, world, view, proj, lights);

			gl.drawElements(
				gl.TRIANGLES,
				this.indicesLength[i],
				gl.UNSIGNED_SHORT,
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
