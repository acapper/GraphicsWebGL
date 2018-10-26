precision mediump float;

attribute vec3 position;
attribute vec2 texture;
attribute vec3 normal;

uniform mat4 model;
uniform mat4 world;
uniform mat4 view;
uniform mat4 proj;
uniform mat3 nmatrix;

uniform vec3 lightPos;

varying vec2 fTexture;
varying vec3 fNormal;
varying vec4 fPosition;
varying vec4 flight;

void main()
{
	fTexture = texture;
	fNormal =  (nmatrix * normal).xyz;
	flight = view * world * vec4(lightPos, 1.0);
	fPosition = view * world * model * vec4(position, 1.0);	
	gl_Position = proj * view * world * model * vec4(position, 1.0);
}