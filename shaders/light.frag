precision mediump float;

uniform sampler2D sampler;

uniform vec3 lightCol;
uniform vec3 lightDir;

varying vec2 fTexture;
varying vec3 fNormal;
varying vec4 fPosition;
varying vec4 flight;

void main()
{
	gl_FragColor = vec4(lightCol.xyz, 1.0);
}

