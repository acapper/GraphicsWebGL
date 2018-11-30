precision mediump float;

const int MAX_LIGHTS = 10;  

uniform sampler2D textureSampler;
uniform sampler2D normalSampler;
uniform samplerCube shadowMap0;
uniform samplerCube shadowMap1;
uniform samplerCube shadowMap2;

uniform vec2 shadowClip[MAX_LIGHTS];

uniform vec3 lightCol[MAX_LIGHTS];
uniform vec3 lightDir[MAX_LIGHTS];
uniform int lightOn[MAX_LIGHTS];
uniform vec3 lightPos[MAX_LIGHTS];
uniform vec3 attenuation[MAX_LIGHTS];
uniform float shininess;
uniform vec3 emmissive;		

varying vec2 fTexture;
varying vec3 fNormal;
varying vec4 fPosition;
varying vec4 fPositionShadow;
varying mat4 fWorld;
varying mat4 fView;
varying mat3 fTangSpace;

float getShadowMapValue(in vec3 lightDistVecN, in samplerCube shadowMap){
	return textureCube(shadowMap, -lightDistVecN).r;
}

float getAttenuation(in float distanceToLight, in vec3 attenuation){
	return 1.0 / (attenuation.x + attenuation.y * distanceToLight + attenuation.z * pow(distanceToLight, 2.0));
}

void main()
{					

	vec4 texel = texture2D(textureSampler, fTexture);
	// Convert normal values
	vec3 normal = normalize(texture2D(normalSampler, fTexture).xyz*2.0 - 1.0);
	vec4 diffuse_colour = vec4(texel.rgba);
	if(texel.a == 0.0) discard;

	vec4 totalDiffuse;
	vec4 totalSpec;
	vec4 totalAmbient;
	for(int i=0; i<MAX_LIGHTS; ++i)
	{	
		if(lightOn[i] == 1){
			vec4 lightViewPos = fView * fWorld * vec4(lightPos[i], 1.0);

			// Shadows
			vec4 lightPosH = fWorld * vec4(lightPos[i], 1.0);
			vec4 lightDistVec = lightPosH - fPositionShadow;
			float lightDist = (length(lightDistVec) - shadowClip[i].x) / (shadowClip[i].y - shadowClip[i].x);
			vec3 lightDistVecN = normalize(lightDistVec.xyz);
			float shadowMapValue = 0.0;

			// Get shadow map value for current light
			if(i == 0){
				shadowMapValue = getShadowMapValue(lightDistVecN, shadowMap0);
			}else if(i == 1){
				shadowMapValue = getShadowMapValue(lightDistVecN, shadowMap1);
			}else if(i == 2){
				shadowMapValue = getShadowMapValue(lightDistVecN, shadowMap2);
			}

			// Light Diffuse
			vec3 N = normalize(normal);	
			// Convert to tangent space															// Be careful with the order of multiplication!
			vec3 L = normalize(fTangSpace * (lightViewPos.xyz - fPosition.xyz));		// Ensure light_dir is unit length
			float intensity = max(dot(L, N), 0.0);
			vec4 diffuse = (intensity * vec4(lightCol[i], 1.0)) + intensity * diffuse_colour;

			// Light Specular
			vec4 specular_colour = vec4(lightCol[i], 1.0);						// smaller values give sharper specular responses, larger more spread out
			// Convert to tangent space			
			vec3 V = normalize(fTangSpace * -fPosition.xyz);  			// Viewing vector is reverse of vertex position in eye space
			vec3 R = reflect(-L, N);												// Calculate the reflected beam, N defines the plane (see diagram on labsheet)
			vec4 specular = pow(max(dot(R, V), 0.0), shininess) * specular_colour;	// Calculate specular component
			float distanceToLight = length(lightViewPos.xyz - fPosition.xyz);

			// Light Attenuation
			float att = getAttenuation(distanceToLight, attenuation[i]);
			
			// If light attenuation params are 0 set attenuation to 1
			if(attenuation[i].x == 0.0){
				att = 1.0;
			}

			// Apply shadow map bias
			if(shadowMapValue + 0.00001 >= lightDist){
				// Not in shadow
				totalDiffuse += mix(totalDiffuse, att * diffuse, 1.0);
				totalSpec += mix(totalDiffuse, att * specular, 1.0);
			}

			// In shadow and out
			float ambientFactor = 0.5 * att;
			totalAmbient += mix(totalAmbient, diffuse_colour * vec4(lightCol[i], 1.0) * vec4(ambientFactor, ambientFactor, ambientFactor, 1.0), 1.0);
		}
	}
	gl_FragColor = totalAmbient + totalDiffuse + totalSpec + vec4(emmissive, 1.0);
	//gl_FragColor = vec4(totalDiffuse.xyz, 1.0);
	//gl_FragColor = vec4(totalSpec.xyz, 1.0);
	//gl_FragColor = ambient + diffuse + specular;
	//gl_FragColor = vec4(fNormal, 1.0);
	//gl_FragColor = vec4(normal, 1.0);
	//gl_FragColor = vec4(texel.xyz, 1.0);
	//gl_FragColor = texel;
	//gl_FragColor = ambient;
	//gl_FragColor = vec4(1.0,0.0,0.0, 1.0);
}

