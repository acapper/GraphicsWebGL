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
var light2;
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
		'shaders/shadowmapgen.frag',
		'textures/FullMoon/FullMoonRight2048.png',
		'textures/FullMoon/FullMoonLeft2048glow.png',
		'textures/FullMoon/FullMoonUp2048.png',
		'textures/FullMoon/FullMoonDown2048.png',
		'textures/FullMoon/FullMoonBack2048.png',
		'textures/FullMoon/FullMoonFront2048.png',
		'shaders/skybox.vert',
		'shaders/skybox.frag'
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
			//gl.enable(gl.CULL_FACE);
			gl.frontFace(gl.CCW);
			gl.cullFace(gl.BACK);

			// Load and create shaders
			var shader = new Shader(gl, promsR[1], promsR[2]);
			var lightshader = new Shader(gl, promsR[1], promsR[3]);
			var shadowshader = new Shader(gl, promsR[10], promsR[11]);
			shadowgen = new Shader(gl, promsR[12], promsR[13]);
			var skyboxshader = new Shader(gl, promsR[20], promsR[21]);

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
				shadowshader,
				[
					promsR[14],
					promsR[15],
					promsR[16],
					promsR[17],
					promsR[18],
					promsR[19]
				],
				skyboxshader
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
	shadowshader,
	skyboxTextures,
	skyboxshader
) {
	var s = 20;

	plane = new Mesh({
		gl,
		texture: stoneWallTexture,
		texturescale: 10,
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
		texturescale: 1,
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
		texturescale: 1,
		normalmap: rockNormal,
		mesh: spherejson.meshes[0],
		shader: shadowshader,
		rotation: [0, 0, 0],
		scale: [2, 2, 2],
		translation: [0, -1, -5]
	});

	light = new Light(
		{
			gl,
			texture: white,
			mesh: spherejson.meshes[0],
			shader: lightshader,
			rotation: [0, 0, 0],
			scale: [0.5, 0.5, 0.5],
			translation: [-3, 1, 5]
		},
		{
			name: 'sun',
			colour: [1, 0.9, 0.8],
			direction: [0, 0, 0],
			on: 1,
			shadowgen
		}
	);
	// Add light to light tracker
	lights.push(light);

	light2 = new Light(
		{
			gl,
			texture: white,
			mesh: spherejson.meshes[0],
			shader: lightshader,
			rotation: [0, 0, 0],
			scale: [0.5, 0.5, 0.5],
			translation: [3, 1, 5]
		},
		{
			name: 'sun',
			colour: [1, 0, 0],
			direction: [0, 0, 0],
			on: 1,
			shadowgen
		}
	);
	// Add light to light tracker
	lights.push(light2);

	skybox = new Skybox({
		gl,
		textures: skyboxTextures,
		mesh: planejson.meshes[0],
		shader: skyboxshader
	});

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

	shadowMapCube = light.genShadowMap([ball, ball2, plane], world, shadowClip);
	shadowMapCube2 = light2.genShadowMap(
		[ball, ball2, plane],
		world,
		shadowClip
	);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	// Update loop
	update(deltaTime);
	// Render loop
	render();
	// Get next frame
	requestAnimationFrame(draw);
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
	ball.draw(
		gl,
		world,
		view,
		proj,
		lightsJSON,
		[shadowMapCube, shadowMapCube2],
		shadowClip
	);
	ball2.draw(
		gl,
		world,
		view,
		proj,
		lightsJSON,
		[shadowMapCube, shadowMapCube2],
		shadowClip
	);
	plane.draw(
		gl,
		world,
		view,
		proj,
		lightsJSON,
		[shadowMapCube, shadowMapCube2],
		shadowClip
	);
	skybox.draw(gl, world, view, proj);
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
	skybox.update();
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
