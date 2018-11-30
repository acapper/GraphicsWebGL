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

// Initialise resources needed for opengl scene
var Init = function() {
	// http://davidbau.com/archives/2010/01/30/random_seeds_coded_hints_and_quintillions.html
	Math.seedrandom('any string you like');

	fpsElem.textContent = 'Loading 👍';

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
		'textures/Grass/Grass_001_COLOR.jpg',
		'textures/Grass/Grass_001_NORM.jpg',
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
		'shaders/skybox.frag',
		'models/tent.json',
		'textures/Dome_Tent/1510_dome_tent_02_D.png',
		'textures/Dome_Tent/1510_dome_tent_N.png',
		'models/lantern.json',
		'textures/lantern/lantern_Base_Color.jpg',
		'textures/lantern/lantern_Normal_OpenGL.jpg',
		'models/rocks.json',
		'shaders/fire.vert',
		'shaders/fire.frag',
		'textures/fire.png',
		'models/tree.json',
		'textures/tree/bark.jpg',
		'textures/tree/branch.png',
		'models/chair.json',
		'models/firepit.json',
		'textures/firepit/Fire_Pit_Texture.png',
		'textures/firepit/Normal_Mapping.bmp',
		'models/log.json',
		'textures/log/Log_pine_color_32bpc_4k.png',
		'textures/log/Log_pine_normal_32bpc_4k.png',
		'textures/metal/Metal_004_Base_Color.png',
		'textures/metal/Metal_004_Normal.png',
		'textures/fabric/Fabric_001_COLOR.jpg',
		'textures/fabric/Fabric_001_NORM.jpg',
		'textures/plastic/Plastic_001_COLOR.jpg',
		'textures/nonormal.png'
	]);

	// Wait for external resources to load
	Promise.all(proms)
		// External resources have loaded
		.then(promsR => {
			proms = null;
			// Get webgl package
			gl = canvas.getContext('webgl');

			var float = gl.getExtension('OES_texture_float');
			var floatlinear = gl.getExtension('OES_texture_float_linear');
			if (!float && !floatlinear) {
				alert(
					'Your computer is incomptible with OES_texture_float or OES_texture_float_linear so you are running in low quailty mode'
				);
			}

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
			var skyboxshader = new Shader(gl, promsR[20], promsR[21]);
			var fireShader = new Shader(gl, promsR[29], promsR[30]);

			trees = genTrees(
				20,
				50,
				125,
				promsR[32],
				promsR[33],
				promsR[34],
				shadowshader,
				2,
				5
			);

			// Run gl scene
			// This is a mess figure out how to make it better
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
				skyboxshader,
				promsR[22],
				promsR[23],
				promsR[24],
				promsR[25],
				promsR[26],
				promsR[27],
				promsR[28],
				fireShader,
				promsR[31],
				promsR[35],
				promsR[36],
				promsR[37],
				promsR[38],
				promsR[39],
				promsR[40],
				promsR[41],
				promsR[42],
				promsR[43],
				promsR[44],
				promsR[45],
				promsR[46],
				promsR[47]
			);
		})
		// Catch any errors once the external resources have loaded
		.catch(err => {
			fpsElem.textContent = 'Error 😥';
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
	grassTexture,
	grassNormal,
	shadowshader,
	skyboxTextures,
	skyboxshader,
	tentjson,
	tentTexture,
	tentNormal,
	lanternjson,
	lanternTexture,
	lanternNormal,
	rocksjson,
	fireShader,
	fireTexture,
	chairjson,
	firepitjson,
	firepittexture,
	firepitnormal,
	logjson,
	logtexture,
	lognormal,
	metaltexture,
	metalnormal,
	fabrictexture,
	fabricnormal,
	plasticTexture,
	noNormal
) {
	var s = 20 * 100;
	s;

	// Scene Object creation
	plane = new Mesh({
		gl,
		texture: grassTexture,
		texturescale: s / 1,
		normalmap: grassNormal,
		mesh: planejson.meshes[0],
		shader: shadowshader,
		rotation: [0, 0, 0],
		scale: [s, s, s],
		translation: [0, 0, 0],
		shininess: 10,
		emmissive: [0, 0, 0]
	});

	fire = new Fire({
		gl,
		texture: fireTexture,
		shader: fireShader,
		center: [5, 0, 4],
		maxpoints: 256,
		radius: 1,
		maxheight: 2.5
	});

	tent = new Mesh({
		gl,
		texture: tentTexture,
		texturescale: 1,
		normalmap: tentNormal,
		mesh: tentjson.meshes[0],
		shader: shadowshader,
		rotation: [0, 60, 0],
		scale: [0.05, 0.05, 0.05],
		translation: [-8.5, 0, -8],
		shininess: 10000,
		emmissive: [0, 0, 0]
	});

	log = new Mesh({
		gl,
		texture: logtexture,
		texturescale: 1,
		normalmap: lognormal,
		mesh: logjson.meshes[0],
		shader: shadowshader,
		rotation: [85, -5, 130],
		scale: [0.1, 0.1, 0.1],
		translation: [3, 0.17, 8.5],
		shininess: 10000,
		emmissive: [0, 0, 0]
	});

	log2 = new Mesh({
		gl,
		texture: logtexture,
		texturescale: 1,
		normalmap: lognormal,
		mesh: logjson.meshes[0],
		shader: shadowshader,
		rotation: [85, -5, 85],
		scale: [0.1, 0.1, 0.1],
		translation: [8, 0.17, 8.6],
		shininess: 10000,
		emmissive: [0, 0, 0]
	});

	rocks = new Mesh({
		gl,
		texture: rockTexture,
		texturescale: 1,
		normalmap: rockNormal,
		mesh: rocksjson.meshes[0],
		shader: shadowshader,
		rotation: [0, 0, 0],
		scale: [0.15, 0.2, 0.15],
		translation: [5, 0, 4],
		shininess: 10000,
		emmissive: [0, 0, 0]
	});

	firepit = new Mesh({
		gl,
		texture: firepittexture,
		texturescale: 1,
		normalmap: firepitnormal,
		mesh: firepitjson.meshes[0],
		shader: shadowshader,
		rotation: [-90, 0, 0],
		scale: [0.7, 0.5, 0.7],
		translation: [5, 0, 4],
		shininess: 10000,
		emmissive: [0, 0, 0]
	});

	lantern = new Model({
		gl,
		texture: [lanternTexture],
		texturescale: 1,
		normalmap: [lanternNormal],
		meshes: lanternjson.meshes,
		shader: shadowshader,
		rotation: [0, 125, 0],
		scale: [0.01, 0.01, 0.01],
		translation: [-4, 0, -7],
		shininess: 10,
		emmissive: [0, 0, 0]
	});

	chair = new Model({
		gl,
		texture: [
			fabrictexture,
			plasticTexture,
			metaltexture,
			metaltexture,
			plasticTexture,
			plasticTexture,
			plasticTexture,
			metaltexture,
			metaltexture,
			fabrictexture
		],
		texturescale: 1,
		normalmap: [
			fabricnormal,
			noNormal,
			metalnormal,
			metalnormal,
			noNormal,
			noNormal,
			noNormal,
			metalnormal,
			metalnormal,
			fabricnormal
		],
		meshes: chairjson.meshes,
		shader: shadowshader,
		rotation: [0, 125, 0],
		scale: [0.2, 0.2, 0.2],
		translation: [-2, 0, -9],
		shininess: 10,
		emmissive: [0, 0, 0]
	});

	chair2 = new Model({
		gl,
		texture: [
			fabrictexture,
			plasticTexture,
			metaltexture,
			metaltexture,
			plasticTexture,
			plasticTexture,
			plasticTexture,
			metaltexture,
			metaltexture,
			fabrictexture
		],
		texturescale: 1,
		normalmap: [
			fabricnormal,
			noNormal,
			metalnormal,
			metalnormal,
			noNormal,
			noNormal,
			noNormal,
			metalnormal,
			metalnormal,
			fabricnormal
		],
		meshes: chairjson.meshes,
		shader: shadowshader,
		rotation: [0, 80, 0],
		scale: [0.2, 0.2, 0.2],
		translation: [2, 0, -10],
		shininess: 1,
		emmissive: [0, 0, 0]
	});

	var lm = lantern.getMeshes();
	lm[0].setEmmissive([1, 0.9, 0.7]);
	lantern.setMeshes(lm);

	light = new Light(
		{
			gl,
			texture: white,
			mesh: spherejson.meshes[0],
			shader: lightshader,
			rotation: [0, 0, 0],
			scale: [0.2, 0.2, 0.2],
			translation: [-4, 0.4, -7],
			shininess: 10,
			emmissive: [0, 0, 0]
		},
		{
			name: 'lamp',
			colour: [1, 0.9, 0.7],
			//colour: [1, 0.0, 0.0],
			//colour: [0, 0, 0],
			direction: [0, 0, 0],
			on: 1,
			attenuation: [1.0, 0.1, 0.05],
			shadowclip: [0.05, 750.0],
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
			scale: [15, 15, 15],
			translation: [-500 / 2, 160 / 2, -178 / 2],
			shininess: 10,
			emmissive: [0, 0, 0]
		},
		{
			name: 'moon',
			colour: [0.0001, 0.0001, 0.0003],
			//colour: [0.7, 0.0, 0.0],
			direction: [0, 0, 0],
			on: 1,
			attenuation: [0, 0, 0],
			shadowclip: [0.05, 750.0],
			shadowgen
		}
	);
	// Add light to light tracker
	lights.push(light2);

	light3 = new Light(
		{
			gl,
			texture: white,
			mesh: spherejson.meshes[0],
			shader: lightshader,
			rotation: [0, 0, 0],
			scale: [1, 1, 1],
			translation: [5, 0.75, 4],
			shininess: 10,
			emmissive: [0, 0, 0]
		},
		{
			name: 'campfire',
			colour: [0.7, 0.4, 0],
			//colour: [0.7, 0.0, 0.0],
			direction: [0, 0, 0],
			on: 1,
			attenuation: [1, 0.1, 0.01],
			shadowclip: [0.05, 750.0],
			shadowgen
		}
	);
	// Add light to light tracker
	lights.push(light3);

	skybox = new Skybox({
		gl,
		textures: skyboxTextures,
		mesh: planejson.meshes[0],
		shader: skyboxshader,
		scale: 500
	});

	// Create world, view and project matrix
	mat4.identity(world);
	var pos = [10, 1.5, 1];
	camera = new Camera({
		viewPos: pos,
		viewLook: vec3.add(vec3.create(), pos, [-1, 0, 0]),
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

	// Get meshes to make shadows for
	var lm = lantern.getMeshes();
	var ch = chair.getMeshes();
	var ch2 = chair2.getMeshes();
	shadowmeshes = [tent, plane, rocks, log, log2];

	lm.forEach(e => {
		shadowmeshes.push(e);
	});
	ch.forEach(e => {
		shadowmeshes.push(e);
	});
	ch2.forEach(e => {
		shadowmeshes.push(e);
	});
	trees.forEach(e => {
		e.getMeshes().forEach(m => {
			shadowmeshes.push(m);
		});
	});

	// Get light last position
	lastlightpos = light.getPosition();
	lastlightpos2 = light2.getPosition();
	lastlightpos3 = light3.getPosition();

	// Start draw loop
	requestAnimationFrame(draw);
};

var lastlightpos;
var lastlightpos2;
var lastlightpos3;

var frame = 1;

// Web gl main draw loop
var then = 0; // Keep track of last frame time
var draw = function(now) {
	now *= 0.001; // convert to seconds
	const deltaTime = now - then; // compute time since last frame
	then = now; // remember time for next frame
	const fps = 1 / deltaTime; // compute frames per second
	fpsElem.textContent = fps.toFixed(1); // update fps display

	// Update loop
	update(deltaTime);

	// Shadows
	// If its the first frame gen shadows
	// If light has moved gen shadows
	// I know that this wont work if other things move but I dont have anything else that moves
	if (frame == 1 || lastlightpos != light.getPosition())
		light.genShadowMap(shadowmeshes, world);
	if (frame == 1 || lastlightpos2 != light2.getPosition())
		light2.genShadowMap(shadowmeshes, world);
	if (frame == 1 || lastlightpos3 != light3.getPosition())
		light3.genShadowMap(shadowmeshes, world);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	if (frame == 1) frame = 0;

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
	// Debug draw lights
	/*lights.forEach(e => {
		if (e.getName() == 'campfire')
			e.draw(gl, world, view, proj, lightsJSON);
	});*/

	// Draw models
	tent.draw(gl, world, view, proj, lightsJSON);
	plane.draw(gl, world, view, proj, lightsJSON);
	lantern.draw(gl, world, view, proj, lightsJSON);
	rocks.draw(gl, world, view, proj, lightsJSON);
	trees.forEach(e => {
		e.draw(gl, world, view, proj, lightsJSON);
	});
	chair.draw(gl, world, view, proj, lightsJSON);
	chair2.draw(gl, world, view, proj, lightsJSON);
	firepit.draw(gl, world, view, proj, lightsJSON);
	log.draw(gl, world, view, proj, lightsJSON);
	log2.draw(gl, world, view, proj, lightsJSON);
	fire.draw(gl, world, view, proj, camera.getViewPosition());
	skybox.draw(gl, world, view, proj);
};

var flicker = 0.3;

var update = function(delta) {
	// Convert all lights to correct format for opengl shader
	lightsJSON = getLightJSON();

	keyboard(delta);

	// Update each light
	lights.forEach(e => {
		// If the current light is the campfire and flicker is greater than 0
		if (e.getName() == 'campfire' && flicker < 0) {
			// Move the light and change the colour a little
			var c = e.getColour();
			var r = Math.random() * 0.15 + -0.15;
			c[0] = 0.7 + r;
			c[1] = 0.4 + r;
			e.setColour(c);
			flicker = 0.5;

			var p = e.getPosition();
			r = Math.random() * -0.02;
			p[1] = 0.75 + r;
		}
		e.update();
		// If the light is the one currently selected to move check for keyevents
		if (lightMove && e.name == lightMove) e.keyboard(delta, keys);
	});

	// Decrease flicker count down
	var r = Math.random() * 0.15 + -0.1;
	flicker += r;
	flicker -= 1 * delta;

	// TODO update model method to allow for static models to avoid unneeded updates
	plane.update();
	tent.update();
	lantern.update();
	skybox.update();
	rocks.update();
	trees.forEach(e => {
		e.update();
	});
	chair.update();
	chair2.update();
	firepit.update();
	log.update();
	log2.update();
	fire.update(delta);
	view = camera.getCameraMat();
	light.keyboard(delta, keys);
};

// Converts lights into format needed for opengl uniform arrays
var getLightJSON = function() {
	var c = [];
	var d = [];
	var p = [];
	var on = [];
	var a = [];
	var sm = [];
	var sc = [];

	lights.forEach(e => {
		c = c.concat(e.getColour());
		d = d.concat(e.getDirection());
		p = p.concat(e.getPosition());
		on = on.concat(e.getOn());
		a = a.concat(e.getAttenuation());
		sm = sm.concat(e.getShadowMap());
		sc = sc.concat(e.getShadowClip());
	});

	return {
		c,
		d,
		p,
		on,
		a,
		sm,
		sc
	};
};

var keyboard = function(delta) {
	// Move camera
	if (keys['W'.charCodeAt(0)]) {
		camera.forward(1 * delta * 5);
	}
	if (keys['S'.charCodeAt(0)]) {
		camera.forward(-1 * delta * 5);
	}
	if (keys[32]) {
		camera.up(1 * delta * 5);
	}
	if (keys[16]) {
		camera.up(-1 * delta * 5);
	}
	if (keys['A'.charCodeAt(0)]) {
		camera.sideways(-1 * delta * 5);
	}
	if (keys['D'.charCodeAt(0)]) {
		camera.sideways(1 * delta * 5);
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
