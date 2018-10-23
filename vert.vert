precision mediump float;

attribute vec2 position;
attribute vec3 colour;

varying vec3 fColour;

void main()
{
	fColour = colour;
	gl_Position = vec4(position, 0.0, 1.0);
}