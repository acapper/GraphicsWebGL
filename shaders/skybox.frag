precision mediump float;

uniform sampler2D textureSampler;

varying vec2 fTexture;

void main()
{
	vec4 texel = texture2D(textureSampler, fTexture);
	gl_FragColor = texel;
}