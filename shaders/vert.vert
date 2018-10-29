precision mediump float;

const int MAX_LIGHTS = 10;  

attribute vec3 position;
attribute vec2 texture;
attribute vec3 normal;

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

void main()
{
	fTexture = texture;
	fNormal =  (nmatrix * normal).xyz;
	fWorld = world;
	fView = view;
	fPosition = view * world * model * vec4(position, 1.0);	
	gl_Position = proj * view * world * model * vec4(position, 1.0);
}