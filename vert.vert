precision mediump float;

attribute vec3 position;
attribute vec3 colour;

uniform mat4 model;
uniform mat4 view;
uniform mat4 proj;

varying vec3 fColour;

void main()
{
	fColour = colour;
	gl_Position = proj * view * model * vec4(position, 1.0);
}