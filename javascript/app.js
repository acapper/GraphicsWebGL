const canvas = document.getElementById('mycanvas');
const fpsElem = document.querySelector('#fps');
const tankSpeed = document.querySelector('#tankSpeed');

var world = new Float32Array(16);
var view = new Float32Array(16);
var proj = new Float32Array(16);

var viewPos = [0, 3, -5];

var lights = [];
var lightsJSON;

var light;
var tank;
var deer1;
var deer2;
var plane;

var lightMove;

var keys = [];
var gl;

var shadowgen;
var shadowMapCameras;

var shadowMapCube;
var shadowMapRenderBuffer;
var shadowMapFrameBuffer;
var shadowMapProj;
var shadowClip;

// Initialise resources needed for opengl scene
var Init = function() {
	// Load external resources
	var proms = loadAll([
		'textures/Rock/Rock_025_COLOR.jpg',
		'shaders/vert.vert',
		'shaders/frag.frag',
		'shaders/light.frag',
		'models/sphere.json',
		'models/plane.json',
		'textures/Rock/Rock_025_NORM.jpg',
		'textures/texture4.png',
		'textures/Stone Wall/Stone_Wall_009_COLOR.jpg',
		'textures/Stone Wall/Stone_Wall_009_NORM.jpg',
		'shaders/shadow.vert',
		'shaders/shadow.frag',
		'shaders/shadowmapgen.vert',
		'shaders/shadowmapgen.frag'
	]);

	// Wait for external resources to load
	Promise.all(proms)
		// External resources have loaded
		.then(promsR => {
			// Get webgl package
			gl = canvas.getContext('webgl');

			// If cant get standard webgl package use experimental
			if (!gl) {
				gl = canvas.getContext('experimental-webgl');
			}

			// If still cant get webgl package browser doesn't support
			if (!gl) {
				alert('Your browser does not support WebGL');
			}

			// Set gl statemachine values
			gl.clearColor(0, 0, 0, 1);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			gl.enable(gl.DEPTH_TEST);
			gl.enable(gl.CULL_FACE);
			gl.frontFace(gl.CCW);
			gl.cullFace(gl.BACK);

			// Load and create shaders
			var shader = new Shader(gl, promsR[1], promsR[2]);
			var lightshader = new Shader(gl, promsR[1], promsR[3]);
			var shadowshader = new Shader(gl, promsR[10], promsR[11]);
			shadowgen = new Shader(gl, promsR[12], promsR[13]);

			// Run gl scene
			Run(
				promsR[0],
				shader,
				lightshader,
				promsR[4],
				promsR[5],
				promsR[6],
				promsR[7],
				promsR[8],
				promsR[9],
				shadowshader
			);
		})
		// Catch any errors once the external resources have loaded
		.catch(err => {
			throw err;
		});
};

// Create and run gl scene
var Run = function(
	rockTexture,
	shader,
	lightshader,
	spherejson,
	planejson,
	rockNormal,
	white,
	stoneWallTexture,
	stoneWallNormal,
	shadowshader
) {
	var s = 20;

	plane = new Mesh({
		gl,
		texture: stoneWallTexture,
		texturescale: s,
		normalmap: stoneWallNormal,
		mesh: planejson.meshes[0],
		shader: shadowshader,
		rotation: [0, 0, 0],
		scale: [s, s, s],
		translation: [0, -1, 0]
	});

	ball = new Mesh({
		gl,
		texture: rockTexture,
		texturescale: 3,
		normalmap: rockNormal,
		mesh: spherejson.meshes[0],
		shader: shadowshader,
		rotation: [0, 0, 0],
		scale: [1, 1, 1],
		translation: [0, 0, 0]
	});

	ball2 = new Mesh({
		gl,
		texture: rockTexture,
		texturescale: 3,
		normalmap: rockNormal,
		mesh: spherejson.meshes[0],
		shader: shadowshader,
		rotation: [0, 0, 0],
		scale: [2, 2, 2],
		translation: [0, -1, -5]
	});

	// Create red light
	light = new Light(
		{
			gl,
			texture: white,
			mesh: spherejson.meshes[0],
			shader: lightshader,
			rotation: [0, 0, 0],
			scale: [0.5, 0.5, 0.5],
			//translation: [100, 500, -100]
			translation: [-3, 1, 5]
		},
		{ name: 'sun', colour: [1, 0.9, 0.8], direction: [0, 0, 0], on: 1 }
	);
	// Add light to light tracker
	lights.push(light);

	shadowClip = vec2.fromValues(0.05, 50.0);
	shadowMapProj = mat4.create();
	mat4.perspective(
		shadowMapProj,
		glMatrix.toRadian(90),
		1.0,
		shadowClip[0],
		shadowClip[1]
	);

	// Create world, view and project matrix
	mat4.identity(world);
	camera = new Camera({
		viewPos: [0, 2, 2],
		viewLook: [0, 0, 0],
		viewUp: [0, 1, 0]
	});
	view = camera.getCameraMat();
	mat4.perspective(
		proj,
		glMatrix.toRadian(90),
		canvas.clientWidth / canvas.clientHeight,
		0.1,
		10000.0
	);

	shadowMapCube = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, shadowMapCube);
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

	gl.getExtension('OES_texture_float');
	gl.getExtension('OES_texture_float_linear');

	for (var i = 0; i < 6; i++) {
		gl.texImage2D(
			gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
			0,
			gl.RGBA,
			2048,
			2048,
			0,
			gl.RGBA,
			gl.FLOAT,
			null
		);
	}

	shadowMapFrameBuffer = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, shadowMapFrameBuffer);

	shadowMapRenderBuffer = gl.createRenderbuffer();
	gl.bindRenderbuffer(gl.RENDERBUFFER, shadowMapRenderBuffer);
	gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 2048, 2048);

	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

	// Start draw loop
	requestAnimationFrame(draw);
};

// Web gl main draw loop
var then = 0; // Keep track of last frame time
var draw = function(now) {
	now *= 0.001; // convert to seconds
	const deltaTime = now - then; // compute time since last frame
	then = now; // remember time for next frame
	const fps = 1 / deltaTime; // compute frames per second
	fpsElem.textContent = fps.toFixed(1); // update fps display

	genShadowMap();
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	// Update loop
	update(deltaTime);
	// Render loop
	render();
	// Get next frame
	requestAnimationFrame(draw);
};

var genShadowMap = function() {
	shadowMapCameras = [
		//Positive X
		new Camera({
			viewPos: light.getPosition(),
			viewLook: vec3.add(
				vec3.create(),
				light.getPosition(),
				vec3.fromValues(1, 0, 0)
			),
			viewUp: [0, -1, 0]
		}),
		//Negative X
		new Camera({
			viewPos: light.getPosition(),
			viewLook: vec3.add(
				vec3.create(),
				light.getPosition(),
				vec3.fromValues(-1, 0, 0)
			),
			viewUp: [0, -1, 0]
		}),
		//Positive Y
		new Camera({
			viewPos: light.getPosition(),
			viewLook: vec3.add(
				vec3.create(),
				light.getPosition(),
				vec3.fromValues(0, 1, 0)
			),
			viewUp: [0, 0, 1]
		}),
		//Negative Y
		new Camera({
			viewPos: light.getPosition(),
			viewLook: vec3.add(
				vec3.create(),
				light.getPosition(),
				vec3.fromValues(0, -1, 0)
			),
			viewUp: [0, 0, -1]
		}),
		//Positive Z
		new Camera({
			viewPos: light.getPosition(),
			viewLook: vec3.add(
				vec3.create(),
				light.getPosition(),
				vec3.fromValues(0, 0, 1)
			),
			viewUp: [0, -1, 0]
		}),
		//Negative Z
		new Camera({
			viewPos: light.getPosition(),
			viewLook: vec3.add(
				vec3.create(),
				light.getPosition(),
				vec3.fromValues(0, 0, -1)
			),
			viewUp: [0, -1, 0]
		})
	];

	gl.useProgram(shadowgen.getProgram());
	gl.bindTexture(gl.TEXTURE_CUBE_MAP, shadowMapCube);
	gl.bindFramebuffer(gl.FRAMEBUFFER, shadowMapFrameBuffer);
	gl.bindRenderbuffer(gl.RENDERBUFFER, shadowMapRenderBuffer);

	gl.viewport(0, 0, 2048, 2048);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);

	var shadowClipL = gl.getUniformLocation(
		shadowgen.getProgram(),
		'shadowClip'
	);
	gl.uniform2fv(shadowClipL, shadowClip);

	var lightPosL = gl.getUniformLocation(shadowgen.getProgram(), 'lightPos');
	gl.uniform3fv(lightPosL, light.getPosition());

	var projL = gl.getUniformLocation(shadowgen.getProgram(), 'proj');
	gl.uniformMatrix4fv(projL, gl.FALSE, shadowMapProj);

	for (var i = 0; i < shadowMapCameras.length; i++) {
		var viewL = gl.getUniformLocation(shadowgen.getProgram(), 'view');
		gl.uniformMatrix4fv(
			viewL,
			gl.FALSE,
			shadowMapCameras[i].getCameraMat()
		);

		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,
			gl.COLOR_ATTACHMENT0,
			gl.TEXTURE_CUBE_MAP_POSITIVE_X + i,
			shadowMapCube,
			0
		);

		gl.framebufferRenderbuffer(
			gl.FRAMEBUFFER,
			gl.DEPTH_ATTACHMENT,
			gl.RENDERBUFFER,
			shadowMapRenderBuffer
		);

		gl.clearColor(1, 1, 1, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		ball.shadowGen(gl, world, shadowgen.getProgram());
		ball2.shadowGen(gl, world, shadowgen.getProgram());
		plane.shadowGen(gl, world, shadowgen.getProgram());
	}

	gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.bindRenderbuffer(gl.RENDERBUFFER, null);
};

// Draw models onto gl canvas
var render = function() {
	// Clear canvas
	gl.clearColor(0.1, 0.1, 0.1, 1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// Transform world matrix
	world = mat4FromRotTransScale(world, [0, 0, 0], [0, 0, 0], [1, 1, 1]);

	// TODO improve so that each light has property draw/notdraw
	lights.forEach(e => {
		e.draw(gl, world, view, proj, lightsJSON);
	});

	// Draw models
	ball.draw(gl, world, view, proj, lightsJSON, shadowMapCube, shadowClip);
	ball2.draw(gl, world, view, proj, lightsJSON, shadowMapCube, shadowClip);
	plane.draw(gl, world, view, proj, lightsJSON, shadowMapCube, shadowClip);
};

var update = function(delta) {
	// Convert all lights to correct format for opengl shader
	lightsJSON = getLightJSON();

	keyboard(delta);

	// Update each light
	lights.forEach(e => {
		e.update();
		// If the light is the one currently selected to move check for keyevents
		if (lightMove && e.name == lightMove) e.keyboard(delta, keys);
	});
	var rot = ball.getRotation();
	ball.setRotation([rot[0], rot[1], rot[2]]);
	var rot = plane.getRotation();
	plane.setRotation([rot[0], rot[1], rot[2]]);

	// TODO update model method to allow for static models to avoid unneeded updates
	plane.update();
	ball.update();
	ball2.update();
	view = camera.getCameraMat();
	light.keyboard(delta, keys);
};

// Converts lights into format needed for opengl uniform arrays
var getLightJSON = function() {
	var c = [];
	var d = [];
	var p = [];
	var on = [];

	lights.forEach(e => {
		c = c.concat(e.getColour());
		d = d.concat(e.getDirection());
		p = p.concat(e.getPosition());
		on = on.concat(e.getOn());
	});

	return {
		c,
		d,
		p,
		on
	};
};

var keyboard = function(delta) {
	if (keys['W'.charCodeAt(0)]) {
		camera.forward(1 * delta * 3);
	}
	if (keys['S'.charCodeAt(0)]) {
		camera.forward(-1 * delta * 3);
	}
	if (keys[32]) {
		camera.up(1 * delta * 3);
	}
	if (keys[16]) {
		camera.up(-1 * delta * 3);
	}
	if (keys['A'.charCodeAt(0)]) {
		camera.sideways(-1 * delta * 3);
	}
	if (keys['D'.charCodeAt(0)]) {
		camera.sideways(1 * delta * 3);
	}
	if (keys['E'.charCodeAt(0)]) {
		camera.rotateLookAtHorizontal([0, -50 * delta, 0]);
	}
	if (keys['Q'.charCodeAt(0)]) {
		camera.rotateLookAtHorizontal([0, 50 * delta, 0]);
	}
	if (keys['R'.charCodeAt(0)]) {
		var speed = 50 * delta;
		camera.rotateLookAtVertical(speed);
	}
	if (keys['F'.charCodeAt(0)]) {
		var speed = -50 * delta;
		camera.rotateLookAtVertical(speed);
	}
};

// Bind keydown event to window
window.addEventListener(
	'keydown',
	function(e) {
		keys[e.keyCode] = true;
		//console.log(e.keyCode);
	},
	false
);

// Bind keyup event to window
window.addEventListener(
	'keyup',
	function(e) {
		keys[e.keyCode] = false;
	},
	false
);
