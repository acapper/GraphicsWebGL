precision mediump float;

uniform vec3 lightCol;
uniform vec3 lightDir;
uniform vec3 lightcolour;

varying vec3 fNormal;
varying vec4 fPosition;
varying vec4 flight;

void main()
{
	gl_FragColor = vec4(lightcolour.xyz, 1.0);
}

