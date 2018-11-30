precision mediump float;

uniform sampler2D tex;

varying vec4 fPosition;
varying float fHeight;

void main()
{
	vec4 texel = texture2D(tex, gl_PointCoord);
	if(texel.a == 0.0) discard;
	gl_FragColor = vec4(1, 0.7, 0.0, 0.7 / (1.0 + 0.5 * fHeight + 0.3 * pow(fHeight, 2.0)));
}