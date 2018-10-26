precision mediump float;

uniform sampler2D sampler;

uniform vec3 lightCol;
uniform vec3 lightDir;
uniform vec3 lightcolour;

varying vec2 fTexture;
varying vec3 fNormal;
varying vec4 fPosition;
varying vec4 flight;

void main()
{
	gl_FragColor = vec4(lightcolour.xyz, 1.0);
}

