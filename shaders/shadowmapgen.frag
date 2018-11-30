precision mediump float;

uniform vec2 shadowClip;

varying vec4 fPosition;
varying vec4 fLightPos;

void main()
{
	vec3 lightDistVec = fLightPos.xyz - fPosition.xyz;
	// Convert light distance into normalised value in view clip space
	float lightDist = (length(lightDistVec) - shadowClip.x) / (shadowClip.y - shadowClip.x);

	gl_FragColor = vec4(lightDist, lightDist, lightDist, 1.0);
}