var genTrees = function(
	minradius,
	maxradius,
	num,
	json,
	bark,
	leaves,
	shader,
	scalemin,
	scalemax
) {
	var trees = [];
	for (var i = 0; i < num; i++) {
		var r = (maxradius - minradius) * Math.sqrt(Math.random()) + minradius;
		var theta =
			Math.random() * (maxradius - minradius) * Math.PI + minradius;
		var x = 0 + r * Math.cos(theta);
		var z = 0 + r * Math.sin(theta);
		var pos = [x, 0, z];

		var sw = Math.random() * (scalemax - scalemin) + scalemin;
		var sh = Math.random() * (scalemax - scalemin) + scalemin;
		trees.push(
			new Model({
				gl,
				texture: [bark, leaves],
				texturescale: 1,
				normalmap: null,
				meshes: json.meshes,
				shader: shader,
				rotation: [0, 125, 0],
				scale: [sw, sh, sw],
				translation: pos,
				shininess: 10,
				emmissive: [0, 0, 0]
			})
		);
	}
	return trees;
};
