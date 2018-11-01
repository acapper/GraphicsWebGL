const canvas = document.getElementById('mycanvas');
const fpsElem = document.querySelector('#fps');

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

var camera;
var lightMove;

var keys = [];
var gl;

// Initialise resources needed for opengl scene
var Init = function() {
	// Load external resources
	var proms = loadAll([
		'texture4.png',
		'texture2.png',
		'texture3.png',
		'shaders/vert.vert',
		'shaders/frag.frag',
		'shaders/light.frag',
		'models/T34/T34.json',
		'models/lowpolydeer/deer.json',
		'models/sphere/sphere.json',
		'models/TankShell/TankShell.json',
		'models/Plane/Plane.json'
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

			// Make sure html checkboxes start in correct state
			$("[name='blueLight']").prop('checked', true);
			$("[name='blueLightMove']").prop('checked', false);
			$("[name='redLight']").prop('checked', true);
			$("[name='redLightMove']").prop('checked', false);

			// Set gl statemachine values
			gl.clearColor(0, 0, 0, 1);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			gl.enable(gl.DEPTH_TEST);
			gl.enable(gl.CULL_FACE);
			gl.frontFace(gl.CCW);
			gl.cullFace(gl.BACK);

			// Load and create shaders
			var shader = new Shader(gl, promsR[3], promsR[4]);
			var lightshader = new Shader(gl, promsR[3], promsR[5]);

			// Run gl scene
			Run(
				promsR[0],
				promsR[1],
				promsR[2],
				shader,
				lightshader,
				promsR[6],
				promsR[7],
				promsR[8],
				promsR[9],
				promsR[10]
			);
		})
		// Catch any errors once the external resources have loaded
		.catch(err => {
			throw err;
		});
};

// Create and run gl scene
var Run = function(
	whiteTexture,
	tankTexture,
	bulletTexture,
	shader,
	lightshader,
	tankjson,
	deerjson,
	spherejson,
	bulletjson,
	planejson
) {
	// Create deer models
	deer1 = new Model({
		gl,
		texture: whiteTexture,
		model: deerjson,
		shader: shader,
		rotation: [-90, 0, 0],
		scale: [0.002, 0.002, 0.002],
		translation: [5, 0, 0]
	});
	deer2 = new Model({
		gl,
		texture: whiteTexture,
		model: deerjson,
		shader: shader,
		rotation: [-90, 0, 0],
		scale: [0.002, 0.002, 0.002],
		translation: [-5, 0, 0]
	});
	plane = new Model({
		gl,
		texture: whiteTexture,
		model: planejson,
		shader: shader,
		rotation: [0, 0, 0],
		scale: [100, 100, 100],
		translation: [0, 0, 0]
	});

	// Create tank model
	tank = new Tank({
		gl,
		texture: tankTexture,
		model: tankjson,
		shader: shader,
		top: {
			rotation: [0, 0, 0],
			scale: [0.006, 0.006, 0.006],
			translation: [0, 0, -3],
			indices: [0, 2, 3, 7, 9, 10, 13]
		},
		bot: {
			rotation: [0, 0, 0],
			scale: [0.006, 0.006, 0.006],
			translation: [0, 0, -3],
			indices: [1, 4, 5, 6, 8, 11, 12, 14]
		},
		bomb: {
			texture: bulletTexture,
			model: bulletjson,
			rotation: [0, -90, -90],
			scale: [0.05, 0.05, 0.05],
			translation: [0, 1.36, 0.2],
			light: {
				name: 'bomb',
				colour: [1, 0, 0],
				direction: [0, 0, 0],
				on: 0
			}
		},
		camera: {
			position: viewPos
		}
	});

	// Create red light
	light = new Light(
		{
			gl,
			texture: whiteTexture,
			model: spherejson,
			shader: lightshader,
			rotation: [0, 0, 0],
			scale: [0.25, 0.25, 0.25],
			translation: [2, 3, 0]
		},
		{ name: 'red', colour: [1, 0, 0], direction: [0, 0, 0], on: 1 }
	);
	// Add light to light tracker
	lights.push(light);

	// Create blue light
	light = new Light(
		{
			gl,
			texture: whiteTexture,
			model: spherejson,
			shader: lightshader,
			rotation: [0, 0, 0],
			scale: [0.25, 0.25, 0.25],
			translation: [-2, 3, 0]
		},
		{ name: 'blue', colour: [0, 0, 1], direction: [0, 0, 0], on: 1 }
	);
	// Add light to light tracker
	lights.push(light);

	// Add tank bullet light to light tracker
	lights.push(tank.getBomb());

	// Create world, view and project matrix
	mat4.identity(world);
	view = tank.getCamera().getCameraMat();
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

	// Draw each light except the tank bomb
	// TODO improve so that each light has property draw/notdraw
	lights.forEach(e => {
		if (e.name != 'bomb' && e.on != 0)
			e.draw(gl, world, view, proj, lightsJSON);
	});

	// Draw models
	tank.draw(gl, world, view, proj, lightsJSON);
	deer1.draw(gl, world, view, proj, lightsJSON);
	deer2.draw(gl, world, view, proj, lightsJSON);
	plane.draw(gl, world, view, proj, lightsJSON);
};

var update = function(delta) {
	// Convert all lights to correct format for opengl shader
	lightsJSON = getLightJSON();

	// Update each light
	lights.forEach(e => {
		e.update();
		// If the light is the one currently selected to move check for keyevents
		if (lightMove && e.name == lightMove) e.keyboard(delta, keys);
	});

	// Update tank pass in current key states
	tank.update(delta, keys);

	// Update deer models
	// TODO update model method to allow for static models to avoid unneeded updates
	deer1.update();
	deer2.update();
	plane.update();

	// Update camera matrix
	view = tank.getCamera().getCameraMat();
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

// TODO Combine with light class
// Toggles wether the red light should be drawn and used in shader
$("[name='redLight']").change(function() {
	if (this.checked) {
		// If checked draw
		lights.forEach(e => {
			if (e.getName() == 'red') {
				e.setOn(1);
			}
		});
	} else {
		// Else dont draw
		lights.forEach(e => {
			if (e.getName() == 'red') {
				e.setOn(0);
			}
		});
	}
	lightsJSON = getLightJSON();
});

$("[name='blueLight']").change(function() {
	if (this.checked) {
		// If checked draw
		lights.forEach(e => {
			if (e.getName() == 'blue') {
				e.setOn(1);
			}
		});
	} else {
		// Else dont draw
		lights.forEach(e => {
			if (e.getName() == 'blue') {
				e.setOn(0);
			}
		});
	}
	lightsJSON = getLightJSON();
});

// Toggles wether the blue light should be moved with the light control keys
$("[name='blueLightMove']").change(function() {
	if (this.checked) {
		// If checked make sure blue movement checkbox is unticked
		$("[name='redLightMove']").prop('checked', false);
		// Set light to move to light name
		lightMove = 'blue';
	} else {
		// Else if it is unticked set light to move to null
		lightMove = null;
	}
});

// Toggles wether the red light should be moved with the light control keys
$("[name='redLightMove']").change(function() {
	if (this.checked) {
		// If checked make sure blue movement checkbox is unticked
		$("[name='blueLightMove']").prop('checked', false);
		// Set light to move to light name
		lightMove = 'red';
	} else {
		// Else if it is unticked set light to move to null
		lightMove = null;
	}
});
