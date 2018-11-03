// Holds logic for create opengl buffers, setting uniforms, transforming models and drawing triangle to the screen
class Model {
	/*{
		gl: glContext,
		texture: texture,
		model: modeljson,
		shader: shader,
		rotation: [0, 0, 0],
		scale: [0, 0, 0],
		translation: [0, 0, 0]
	}*/
	constructor(model) {
		// Information about which buffers to to read from model file
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

		// Initialise attributes
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
		this.attenkqL = gl.getUniformLocation(program, 'attenuation_kq');

		// Create opengl buffers
		this.createBuffers(gl, model.model);
		// Bind texture
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

	// Create opengl buffers
	createBuffers(gl, model) {
		var i = 0;
		// For each mesh in model file
		model.meshes.forEach(e => {
			if (this.meshIndices == null || this.meshIndices.indexOf(i) > -1) {
				// Get indicies
				var modelIndicies = [].concat.apply([], e.faces);
				// Get vertices
				var modelVerts = e.vertices;
				// Get texturecoords
				var modelTextureCoords = e.texturecoords[0];
				// Get normals
				var modelNormals = e.normals;

				// Store number of indexes in current mesh
				this.indicesLength.push(modelIndicies.length);
				// Create new index buffer
				this.createNewIndexBuffer(gl);
				// Bind mesh index list to last created index buffer
				this.bindBufferData(
					gl,
					this.getLastIndexBuffer(),
					new Uint16Array(modelIndicies),
					gl.ELEMENT_ARRAY_BUFFER
				);

				// Create new data buffer
				this.createNewBuffer(gl);
				// Bind mesh verts to last created data buffer
				this.bindBufferData(
					gl,
					this.getLastBuffer(),
					new Float32Array(modelVerts),
					gl.ARRAY_BUFFER
				);
				// Create new data buffer
				this.createNewBuffer(gl);
				// Bind mesh TextureCoords to last created data buffer
				this.bindBufferData(
					gl,
					this.getLastBuffer(),
					new Float32Array(modelTextureCoords),
					gl.ARRAY_BUFFER
				);
				// Create new data buffer
				this.createNewBuffer(gl);
				// Bind mesh Normals to last created data buffer
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

	// Add a new opengl index buffer to index buffer list
	createNewIndexBuffer(gl) {
		this.indexBuffer.push(gl.createBuffer());
		gl = null;
	}

	// Add a new opengl data buffer to data buffer list
	createNewBuffer(gl) {
		this.buffers.push(gl.createBuffer());
		gl = null;
	}

	// Bind data of type to opengl buffer at bufferLocation
	bindBufferData(gl, bufferL, data, type) {
		gl.bindBuffer(type, bufferL);
		gl.bufferData(type, data, gl.STATIC_DRAW);
		gl = null;
		bufferL = null;
		data = null;
		type = null;
	}

	// Returns the last buffer in data buffer list
	getLastBuffer() {
		return this.buffers[this.buffers.length - 1];
	}

	// Returns the last buffer in index buffer list
	getLastIndexBuffer() {
		return this.indexBuffer[this.indexBuffer.length - 1];
	}

	// Binds the index buffer at index i to opengl
	bindIndexBuffers(gl, i) {
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer[i]);
		gl = null;
		i = null;
	}

	// Bind attributes outlined in bufferKeys to opengl
	bindArrayBuffers(gl, i) {
		var program = this.shader.getProgram();
		var j = 0;

		// For each key item in bufferKeys
		this.bufferKeys.forEach(e => {
			// Get location of attribute
			var location = gl.getAttribLocation(program, e.key);
			//Work on error handling for missing attribs
			if (location != -1) {
				// Bind attribute to open gl
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

	// Bind vertex buffer object to opengl location
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

	// Create and bind texture to opengl
	bindTexture(gl) {
		this.modelTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.modelTexture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		// Set image wrap eg. strech, tile, center
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
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
			this.texture
		);
		gl.activeTexture(gl.TEXTURE0);
		gl = null;
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

		gl.uniform1f(this.attenkcL, 1);
		gl.uniform1f(this.attenklL, 0.5);
		gl.uniform1f(this.attenkqL, 0.005);
		gl = null;
		world = null;
		view = null;
		proj = null;
		lights = null;
	}

	// Draw model
	// Lights is a list of lights to be used in shader
	// Light format
	/*{
		c: [list of light colours]
		d: [list of light directions]
		p: [list of light positions]
		on: [list of whether a light is on(1)/off(0)]
	}*/
	draw(gl, world, view, proj, lights) {
		// Use shader
		gl.useProgram(this.shader.getProgram());
		// Bind texture
		gl.bindTexture(gl.TEXTURE_2D, this.modelTexture);
		gl.activeTexture(gl.TEXTURE0);
		// For every buffer
		for (var i = 0; i < this.indexBuffer.length; i++) {
			// Calculate normal matrix
			mat4.identity(this.nmatrix4);
			mat4.mul(this.nmatrix4, this.nmatrix4, view);
			mat4.mul(this.nmatrix4, this.nmatrix4, world);
			mat4.mul(this.nmatrix4, this.nmatrix4, this.model);

			mat3.fromMat4(this.nmatrix3, this.nmatrix4);
			mat3.invert(this.nmatrix3, this.nmatrix3);
			mat3.transpose(this.nmatrix3, this.nmatrix3);

			// Bind data at location i
			this.bindArrayBuffers(gl, i);
			// Bind indexes at location i
			this.bindIndexBuffers(gl, i);
			// Bind uniforms
			this.bindUniforms(gl, world, this.model, view, proj, lights);

			// Draw bound data
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

	// Update model
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
