class Mesh {
	/*{
		gl: glContext,
		texture: texture,
		model: modeljson,
		shader: shader,
		rotation: [0, 0, 0],
		scale: [0, 0, 0],
		translation: [0, 0, 0]
	}*/
	constructor(mesh) {
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
			},
			{
				key: 'tangent',
				numOfEls: 3,
				size: 3,
				offset: 0
			},
			{
				key: 'binormal',
				numOfEls: 3,
				size: 3,
				offset: 0
			}
		];

		this.vertBuffer = null;
		this.textBuffer = null;
		this.normBuffer = null;
		this.tangentBuffer = null;
		this.binormalBuffer = null;
		this.indices = null;
		this.indicesNum = null;

		this.meshTexture = null;
		this.texture = mesh.texture;
		this.normalMap = mesh.normalmap;
		this.glTexture = null;
		this.shader = mesh.shader;
		this.rotation = mesh.rotation;
		this.scale = mesh.scale;
		this.translation = mesh.translation;

		// Allocate memory
		this.model = mat4.create();
		this.nmatrix4 = mat4.create();
		this.nmatrix3 = mat3.create();

		// Move to shader code
		var program = this.shader.getProgram();
		gl.useProgram(program);
		// Store shader attribute locations
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
		this.textureSampler = gl.getUniformLocation(program, 'textureSampler');
		this.normalSampler = gl.getUniformLocation(program, 'normalSampler');
		gl.uniform1i(this.textureSampler, 0); // texture unit 0
		gl.uniform1i(this.normalSampler, 1); // texture unit 1

		// Create opengl buffers
		this.createBuffers(gl, mesh.mesh, mesh.texturescale);
		// Bind texture
		if (this.texture) {
			this.meshTexture = this.createTexture(gl, this.texture);
		}
		if (this.normalMap) {
			this.normalTexture = this.createTexture(gl, this.normalMap);
		}
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

	createBuffers(gl, mesh, scale) {
		if (!scale) scale = 1;
		// Get indicies
		var meshIndicies = [].concat.apply([], mesh.faces);
		// Get vertices
		var meshVerts = mesh.vertices;
		// Get texturecoords
		var meshTextureCoords = mesh.texturecoords[0];
		meshTextureCoords = meshTextureCoords.map(x => x * scale);
		// Get normals
		var meshNormals = mesh.normals;
		var meshTangents = mesh.tangents;
		var meshBinormals = mesh.binormals;

		this.indicesNum = meshIndicies.length;

		// Create new index buffer
		this.indices = gl.createBuffer();
		// Bind mesh index list
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);
		gl.bufferData(
			gl.ELEMENT_ARRAY_BUFFER,
			new Uint16Array(meshIndicies),
			gl.STATIC_DRAW
		);

		// Create new data buffer
		this.vertBuffer = gl.createBuffer();
		// Bind mesh verts
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array(meshVerts),
			gl.STATIC_DRAW
		);
		// Create new data buffer
		this.textBuffer = gl.createBuffer();
		// Bind mesh TextureCoords
		gl.bindBuffer(gl.ARRAY_BUFFER, this.textBuffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array(meshTextureCoords),
			gl.STATIC_DRAW
		);
		// Create new data buffer
		this.normBuffer = gl.createBuffer();
		// Bind mesh Normals
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array(meshNormals),
			gl.STATIC_DRAW
		);
		// Create new data buffer
		this.tangentBuffer = gl.createBuffer();
		// Bind mesh Normals
		gl.bindBuffer(gl.ARRAY_BUFFER, this.tangentBuffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array(meshTangents),
			gl.STATIC_DRAW
		);
		// Create new data buffer
		this.binormalBuffer = gl.createBuffer();
		// Bind mesh Normals
		gl.bindBuffer(gl.ARRAY_BUFFER, this.binormalBuffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array(meshBinormals),
			gl.STATIC_DRAW
		);
	}

	createTexture(gl, texture) {
		var glTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, glTexture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		// Set image wrap eg. strech, tile, center
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		// Set image filtering
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		// Bind image data
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			texture
		);
		gl = null;
		return glTexture;
	}

	// Bind model uniforms
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

		gl.uniform1f(this.attenkcL, 0.005);
		gl.uniform1f(this.attenklL, 0.005);
		gl.uniform1f(this.attenkqL, 0.005);
		gl = null;
		world = null;
		view = null;
		proj = null;
		lights = null;
	}

	// Bind attributes outlined in bufferKeys to opengl
	bindArrayBuffers(gl, buffers) {
		var program = this.shader.getProgram();
		var j = 0;

		// For each key item in bufferKeys
		this.bufferKeys.forEach(e => {
			// Get location of attribute
			var location = gl.getAttribLocation(program, e.key);
			//Work on error handling for missing attribs
			if (location != -1) {
				gl.bindBuffer(gl.ARRAY_BUFFER, buffers[j]);
				gl.vertexAttribPointer(
					location, // Attribute location
					e.numOfEls, // Number of elements per attribute
					gl.FLOAT, // Type of elements
					gl.FALSE,
					e.size * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
					e.offset * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
				);
				gl.enableVertexAttribArray(location);
			} else {
				//console.log(e.key);
				//console.log(this.modeljson);
				//throw 'Error';
			}
			j++;
		});
		gl = null;
	}

	draw(gl, world, view, proj, lights) {
		// Use shader
		gl.useProgram(this.shader.getProgram());
		// Bind texture
		gl.activeTexture(gl.TEXTURE0);
		if (this.meshTexture) {
			gl.bindTexture(gl.TEXTURE_2D, this.meshTexture);
		}
		gl.activeTexture(gl.TEXTURE1);
		if (this.normalTexture) {
			gl.bindTexture(gl.TEXTURE_2D, this.normalTexture);
		}

		// Calculate normal matrix
		mat4.identity(this.nmatrix4);
		mat4.mul(this.nmatrix4, this.nmatrix4, view);
		mat4.mul(this.nmatrix4, this.nmatrix4, world);
		mat4.mul(this.nmatrix4, this.nmatrix4, this.model);

		mat3.fromMat4(this.nmatrix3, this.nmatrix4);
		mat3.invert(this.nmatrix3, this.nmatrix3);
		mat3.transpose(this.nmatrix3, this.nmatrix3);

		// Bind data at location i
		this.bindArrayBuffers(gl, [
			this.vertBuffer,
			this.textBuffer,
			this.normBuffer,
			this.tangentBuffer,
			this.binormalBuffer
		]);

		this.bindUniforms(gl, world, this.model, view, proj, lights);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices);

		// Draw bound data
		gl.drawElements(gl.TRIANGLES, this.indicesNum, gl.UNSIGNED_SHORT, 0);
	}

	update() {
		// Update model transformation matrix
		this.model = mat4FromRotTransScale(
			this.model,
			this.rotation,
			this.translation,
			this.scale
		);
	}
}
