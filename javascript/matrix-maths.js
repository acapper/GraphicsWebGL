var rotMat = mat4.create();
var scaleMat = mat4.create();
var transMat = mat4.create();
// Create a matrix 4x4 from rotation, translation and scale
var mat4FromRotTransScale = function(mat, rot, trans, scale) {
	mat4.identity(mat);
	// Translate
	mat4.fromTranslation(transMat, trans);
	mat4.mul(mat, mat, transMat);
	// Scale
	mat4.fromScaling(scaleMat, scale);
	mat4.mul(mat, mat, scaleMat);
	// Rotate
	mat4.fromRotation(rotMat, glMatrix.toRadian(rot[0]), [1, 0, 0]);
	mat4.mul(mat, mat, rotMat);
	mat4.fromRotation(rotMat, glMatrix.toRadian(rot[1]), [0, 1, 0]);
	mat4.mul(mat, mat, rotMat);
	mat4.fromRotation(rotMat, glMatrix.toRadian(rot[2]), [0, 0, 1]);
	mat4.mul(mat, mat, rotMat);
	return mat;
};
