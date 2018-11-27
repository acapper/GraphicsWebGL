precision mediump float;

attribute vec3 position;
attribute vec2 texture;

uniform mat4 model;
uniform mat4 world;
uniform mat4 view;
uniform mat4 proj;

varying vec2 fTexture;

void main()
{
	fTexture = texture;
	gl_Position = proj * view * world * model * vec4(position, 1.0);
}