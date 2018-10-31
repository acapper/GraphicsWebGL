class Model {
	/*{
		gl,
		texture: texture,
		model: spherejson,
		shader: shader,
		rotation: [0, 0, 0],
		scale: [0, 0, 0],
		translation: [0, 0, 0],
		meshIndices: null
	};*/
	constructor(model) {
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

		this.meshIndices = model.meshIndices;
		this.texture = model.texture;
		this.glTexture = null;
		this.shader = model.shader;
		this.rotation = model.rotation;
		this.scale = model.scale;
		this.translation = model.translation;

		this.indicesLength = [];
		this.indexBuffer = [];
		this.buffers = [];

		this.model = mat4.create();
		this.nmatrix4 = mat4.create();
		this.nmatrix3 = mat3.create();

		var program = this.shader.getProgram();
		//Move to shader code
		gl.useProgram(program);
		this.nmatrixL = gl.getUniformLocation(program, 'nmatrix');
		this.viewL = gl.getUniformLocation(program, 'view');
		this.worldL = gl.getUniformLocation(program, 'world');
		this.projL = gl.getUniformLocation(program, 'proj');
		this.modelL = gl.getUniformLocation(program, 'model');
		this.lightColL = gl.getUniformLocation(program, 'lightCol');
		this.lightDirL = gl.getUniformLocation(program, 'lightDir');
		this.lightPosL = gl.getUniformLocation(program, 'lightPos');
		this.lightOnL = gl.getUniformLocation(program, 'lightOn');
		this.attenkcL = gl.getUniformLocation(program, 'attenuation_kc');
		this.attenklL = gl.getUniformLocation(program, 'attenuation_kl');
		this.attenkqL = gl.getUniformLocation(program, 'attenuation_kq');

		this.createBuffers(gl, model.model);
		this.bindTexture(gl);
	}

	getRotation() {
		return this.rotation;
	}

	setRotation(rotation) {
		this.rotation = rotation;
	}

	getTranslation() {
		return this.translation;
	}

	setTranslation(translation) {
		this.translation = translation;
	}

	createBuffers(gl, model) {
		var i = 0;
		model.meshes.forEach(e => {
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
		gl = null;
		model = null;
	}

	createNewIndexBuffer(gl) {
		this.indexBuffer.push(gl.createBuffer());
		gl = null;
	}

	createNewBuffer(gl) {
		this.buffers.push(gl.createBuffer());
		gl = null;
	}

	bindBufferData(gl, bufferL, data, type) {
		gl.bindBuffer(type, bufferL);
		gl.bufferData(type, data, gl.STATIC_DRAW);
		gl = null;
		bufferL = null;
		data = null;
		type = null;
	}

	getLastBuffer() {
		return this.buffers[this.buffers.length - 1];
	}

	getLastIndexBuffer() {
		return this.indexBuffer[this.indexBuffer.length - 1];
	}

	bindIndexBuffers(gl, i) {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer[i]);
		gl = null;
		i = null;
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
		gl = null;
		i = null;
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
		gl = null;
		vbo = null;
		attribL = null;
		numOfEls = null;
		size = null;
		offset = null;
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
		gl = null;
	}

	bindUniforms(gl, world, model, view, proj, lights) {
		//Uniforms
		gl.uniformMatrix4fv(this.projL, gl.FALSE, proj);
		gl.uniformMatrix4fv(this.viewL, gl.FALSE, view);
		gl.uniformMatrix4fv(this.worldL, gl.FALSE, world);
		gl.uniformMatrix4fv(this.modelL, gl.FALSE, model);

		gl.uniformMatrix3fv(this.nmatrixL, gl.FALSE, this.nmatrix3);

		gl.uniform3fv(this.lightColL, lights.c);
		gl.uniform3fv(this.lightDirL, lights.d);
		gl.uniform3fv(this.lightPosL, lights.p);
		gl.uniform1iv(this.lightOnL, lights.on);

		gl.uniform1f(this.attenkcL, 1.0);
		gl.uniform1f(this.attenklL, 0.05);
		gl.uniform1f(this.attenkqL, 0.05);
		gl = null;
		world = null;
		view = null;
		proj = null;
		lights = null;
	}

	draw(gl, world, view, proj, lights) {
		gl.useProgram(this.shader.getProgram());
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
			this.bindUniforms(gl, world, this.model, view, proj, lights);

			gl.drawElements(
				gl.TRIANGLES,
				this.indicesLength[i],
				gl.UNSIGNED_SHORT,
				0
			);
		}
		gl = null;
		world = null;
		view = null;
		proj = null;
		lights = null;
	}

	update() {
		this.model = mat4FromRotTransScale(
			this.model,
			this.rotation,
			this.translation,
			this.scale
		);
	}
}
