precision mediump float;

attribute vec3 position;

uniform mat4 model;
uniform mat4 world;
uniform mat4 view;
uniform mat4 proj;

uniform vec3 lightPos;

varying vec4 fPosition;
varying vec4 fLightPos;

void main()
{
	fPosition = world * model * vec4(position, 1.0);	
	fLightPos = world * model * vec4(lightPos, 1.0);	
	gl_Position = proj * view * world * model * vec4(position, 1.0);
}