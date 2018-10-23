precision mediump float;

varying vec3 fColour;

void main()
{
	gl_FragColor = vec4(fColour, 1.0);
}