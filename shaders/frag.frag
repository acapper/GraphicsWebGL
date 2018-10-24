precision mediump float;

uniform sampler2D sampler;

uniform vec3 ambient;
uniform vec3 light;
uniform vec3 lightDir;

varying vec2 fTexture;
varying vec3 fNormal;

void main()
{

	vec4 texel = texture2D(sampler, fTexture);

	vec3 lightIntesity = ambient + light * max(dot(normalize(fNormal), normalize(lightDir)), 0.0);

	gl_FragColor = vec4(texel.rgb * lightIntesity, texel.a);
}