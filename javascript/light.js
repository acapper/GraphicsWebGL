class Light extends Mesh {
	/*{
		// Model class input
		gl: glContext,
		texture: modelTexture,
		model: modeljson,
		shader: lightmodelshader,
		rotation: [0, 0, 0],
		scale: [0, 0, 0],
		translation: [0, 0, 0]
	},
	// Light class input
	{ name: lightname, colour: [0, 0, 0], direction: [0, 0, 0], on: on(1)/off(0) }*/
	constructor(model, light) {
		var gl = model.gl;
		// Initialise parent class
		super(model);

		// Initialise attributes
		this.name = light.name;
		this.lightCol = light.colour;
		this.lightDir = light.direction;
		this.on = light.on;
		this.attenuation = light.attenuation;

		this.shadowgen = light.shadowgen;
		this.shadowclip = light.shadowclip;

		this.shadowMapCreate();

		// Get uniform locations
		var program = this.shader.getProgram();
		gl.useProgram(program);
		this.colourL = gl.getUniformLocation(program, 'lightcolour');
		program = null;
		gl = null;
	}

	getColour() {
		return this.lightCol;
	}

	setColour(c) {
		this.lightCol = c;
	}

	getDirection() {
		return this.lightDir;
	}

	getPosition() {
		return this.translation;
	}

	getOn() {
		return this.on;
	}

	setOn(on) {
		this.on = on;
	}

	getName() {
		return this.name;
	}

	getShadowMap() {
		return this.shadowMapCube;
	}

	getAttenuation() {
		return this.attenuation;
	}

	getShadowClip() {
		return this.shadowclip;
	}

	shadowMapCreate() {
		this.shadowMapCube = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.shadowMapCube);
		// Set image wrap eg. strech, tile, center
		gl.texParameteri(
			gl.TEXTURE_CUBE_MAP,
			gl.TEXTURE_WRAP_S,
			gl.MIRRORED_REPEAT
		);
		gl.texParameteri(
			gl.TEXTURE_CUBE_MAP,
			gl.TEXTURE_WRAP_T,
			gl.MIRRORED_REPEAT
		);
		// Set image filtering
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

		// Increase size of colours in image
		var float = gl.getExtension('OES_texture_float');
		var floatlinear = gl.getExtension('OES_texture_float_linear');

		// If extensions are found use gl.Float or use default unsigned byte
		var bitSize = gl.UNSIGNED_BYTE;
		if (float && floatlinear) bitSize = gl.FLOAT;

		// Create cube map
		for (var i = 0; i < 6; i++) {
			gl.texImage2D(
				gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
				0,
				gl.RGBA,
				2048,
				2048,
				0,
				gl.RGBA,
				bitSize,
				null
			);
		}

		// Create framebuffer
		this.shadowMapFrameBuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowMapFrameBuffer);

		// Create renderbuffer with depth
		this.shadowMapRenderBuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, this.shadowMapRenderBuffer);
		gl.renderbufferStorage(
			gl.RENDERBUFFER,
			gl.DEPTH_COMPONENT16,
			2048,
			2048
		);

		// Unbind
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

		// Create view matrixes for light source
		this.createShadowCameras();

		// Create projection matrix for cameras
		this.shadowMapProj = mat4.create();
		mat4.perspective(
			this.shadowMapProj,
			glMatrix.toRadian(90),
			1.0,
			this.shadowclip[0],
			this.shadowclip[1]
		);
	}

	// Draw light model (optional)
	draw(gl, world, view, proj, lights) {
		var program = this.shader.getProgram();
		gl.useProgram(program);
		gl.uniform3fv(this.colourL, this.lightCol);
		super.draw(gl, world, view, proj, lights);
		program = null;
	}

	// Light keyboard input
	keyboard(delta, keys) {
		// Make sure light is on before moving
		if (this.getOn() == 1) {
			if (keys['1'.charCodeAt(0)]) {
				var pos = this.getTranslation();
				pos[2] += 1 * delta;
				this.getTranslation(pos);
			}
			if (keys['2'.charCodeAt(0)]) {
				var pos = this.getTranslation();
				pos[2] -= 1 * delta;
				this.getTranslation(pos);
			}
			if (keys['3'.charCodeAt(0)]) {
				var pos = this.getTranslation();
				pos[0] += 1 * delta;
				this.getTranslation(pos);
			}
			if (keys['4'.charCodeAt(0)]) {
				var pos = this.getTranslation();
				pos[0] -= 1 * delta;
				this.getTranslation(pos);
			}
			if (keys['5'.charCodeAt(0)]) {
				var pos = this.getTranslation();
				pos[1] -= 1 * delta;
				this.getTranslation(pos);
			}
			if (keys['6'.charCodeAt(0)]) {
				var pos = this.getTranslation();
				pos[1] += 1 * delta;
				this.getTranslation(pos);
			}
		}
	}

	// Create six view matrixes for light one in each direction eg. up down left right forward back
	createShadowCameras() {
		this.shadowMapCameras = [
			//Positive X
			new Camera({
				viewPos: this.getPosition(),
				viewLook: vec3.add(
					vec3.create(),
					this.getPosition(),
					vec3.fromValues(1, 0, 0)
				),
				viewUp: [0, -1, 0]
			}),
			//Negative X
			new Camera({
				viewPos: this.getPosition(),
				viewLook: vec3.add(
					vec3.create(),
					this.getPosition(),
					vec3.fromValues(-1, 0, 0)
				),
				viewUp: [0, -1, 0]
			}),
			//Positive Y
			new Camera({
				viewPos: this.getPosition(),
				viewLook: vec3.add(
					vec3.create(),
					this.getPosition(),
					vec3.fromValues(0, 1, 0)
				),
				viewUp: [0, 0, 1]
			}),
			//Negative Y
			new Camera({
				viewPos: this.getPosition(),
				viewLook: vec3.add(
					vec3.create(),
					this.getPosition(),
					vec3.fromValues(0, -1, 0)
				),
				viewUp: [0, 0, -1]
			}),
			//Positive Z
			new Camera({
				viewPos: this.getPosition(),
				viewLook: vec3.add(
					vec3.create(),
					this.getPosition(),
					vec3.fromValues(0, 0, 1)
				),
				viewUp: [0, -1, 0]
			}),
			//Negative Z
			new Camera({
				viewPos: this.getPosition(),
				viewLook: vec3.add(
					vec3.create(),
					this.getPosition(),
					vec3.fromValues(0, 0, -1)
				),
				viewUp: [0, -1, 0]
			})
		];
	}

	genShadowMap(models, world) {
		// Make sure light views are upto date
		this.createShadowCameras();

		// Bind shadow gen shader
		gl.useProgram(this.shadowgen.getProgram());

		// Bind the cube map
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.shadowMapCube);

		// Bind buffers for drawing
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowMapFrameBuffer);
		gl.bindRenderbuffer(gl.RENDERBUFFER, this.shadowMapRenderBuffer);

		// Set viewport width and height to cube size
		gl.viewport(0, 0, 2048, 2048);
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);

		// Bind uniforms
		var shadowClipL = gl.getUniformLocation(
			this.shadowgen.getProgram(),
			'shadowClip'
		);
		gl.uniform2fv(shadowClipL, this.shadowclip);

		var lightPosL = gl.getUniformLocation(
			this.shadowgen.getProgram(),
			'lightPos'
		);
		gl.uniform3fv(lightPosL, this.getPosition());

		var projL = gl.getUniformLocation(this.shadowgen.getProgram(), 'proj');
		gl.uniformMatrix4fv(projL, gl.FALSE, this.shadowMapProj);

		// For each light view
		for (var i = 0; i < this.shadowMapCameras.length; i++) {
			// Bind view
			var viewL = gl.getUniformLocation(
				this.shadowgen.getProgram(),
				'view'
			);
			gl.uniformMatrix4fv(
				viewL,
				gl.FALSE,
				this.shadowMapCameras[i].getCameraMat()
			);

			// Bind framebuffer output
			gl.framebufferTexture2D(
				gl.FRAMEBUFFER,
				gl.COLOR_ATTACHMENT0,
				gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
				this.shadowMapCube,
				0
			);

			// Bind framebuffer depth buffer
			gl.framebufferRenderbuffer(
				gl.FRAMEBUFFER,
				gl.DEPTH_ATTACHMENT,
				gl.RENDERBUFFER,
				this.shadowMapRenderBuffer
			);

			// Clear frame buffer
			gl.clearColor(1, 1, 1, 1);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

			// Draw meshes
			for (var j = 0; j < models.length; j++) {
				models[j].shadowGen(gl, world, this.shadowgen.getProgram());
			}
		}

		// Unbind
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		return this.shadowMapCube;
	}
}
