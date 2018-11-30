precision mediump float;

uniform sampler2D tex;

varying vec4 fPosition;
varying float fHeight;

void main()
{
	// Get point texture
	vec4 texel = texture2D(tex, gl_PointCoord);
	// Discard frag if texture is transparent
	if(texel.a == 0.0) discard;
	// Scale alpha with point height (makes it look like they fade)
	gl_FragColor = vec4(1, 0.7, 0.0, 0.7 / (1.0 + 0.5 * fHeight + 0.3 * pow(fHeight, 2.0)));
}