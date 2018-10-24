precision mediump float;

attribute vec3 position;
attribute vec2 texture;
attribute vec3 normal;

uniform mat4 model;
uniform mat4 world;
uniform mat4 view;
uniform mat4 proj;

uniform mat4 nmatrix;

varying vec2 fTexture;
varying vec3 fNormal;

void main()
{
	fTexture = texture;
	fNormal =  (nmatrix * vec4(normal, 0.0)).xyz;
	gl_Position = proj * view * world * model * vec4(position, 1.0);
}