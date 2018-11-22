precision mediump float;

const int MAX_LIGHTS = 10;  

attribute vec3 position;
attribute vec2 texture;
attribute vec3 normal;
attribute vec3 tangent;
attribute vec3 binormal;

uniform mat4 model;
uniform mat4 world;
uniform mat4 view;
uniform mat4 proj;
uniform mat3 nmatrix;

varying vec2 fTexture;
varying vec3 fNormal;
varying vec4 fPosition;
varying mat4 fWorld;
varying mat4 fView;
varying mat3 fTangSpace;

void main()
{
	fTexture = texture;
	vec3 norm =  normalize((nmatrix * normal).xyz);
	vec3 tang = normalize((view * world * model * vec4(tangent, 0.0)).xyz);
	vec3 bitang = normalize(cross(norm, tang));

	fTangSpace = mat3 (
		tang.x, bitang.x, norm.x,
		tang.y, bitang.y, norm.y,
		tang.z, bitang.z, norm.z
	);

	fWorld = world;
	fView = view;
	fPosition = view * world * model * vec4(position, 1.0);	
	gl_Position = proj * view * world * model * vec4(position, 1.0);
}