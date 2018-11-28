precision mediump float;

const int MAX_LIGHTS = 10;  

uniform sampler2D textureSampler;
uniform sampler2D normalSampler;

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
varying mat4 fWorld;
varying mat4 fView;
varying mat3 fTangSpace;

float getAttenuation(in float distanceToLight, in vec3 attenuation){
	return 1.0 / (attenuation.x + attenuation.y * distanceToLight + attenuation.z * pow(distanceToLight, 2.0));
}

void main()
{
	float shininess = 1.0;		
	vec4 texel = texture2D(textureSampler, fTexture);
	vec3 normal = normalize(texture2D(normalSampler, fTexture).xyz*2.0 - 1.0);
	vec4 diffuse_colour = vec4(texel.rgba);

	vec4 ambient = vec4(diffuse_colour.rgb * 0.1, diffuse_colour.a);

	vec4 totalDiffuse;
	vec4 totalSpec;
	vec4 totalAmbient;
	for(int i=0; i<MAX_LIGHTS; ++i)
	{	
		if(lightOn[i] == 1){	
			vec4 lightPosH = fView * fWorld * vec4(lightPos[i], 1.0);		
			// Light Diffuse
			vec3 N = normalize(normal);																// Be careful with the order of multiplication!
			vec3 L = normalize(fTangSpace * (lightPosH.xyz - fPosition.xyz));		// Ensure light_dir is unit length
			float intensity = max(dot(L, N), 0.0);
			vec4 diffuse = (intensity * vec4(lightCol[i], 1.0)) + intensity * diffuse_colour;

			// Light Specular
			vec4 specular_colour = vec4(lightCol[i], 1.0);						// smaller values give sharper specular responses, larger more spread out
			vec3 V = normalize(fTangSpace * -fPosition.xyz);  			// Viewing vector is reverse of vertex position in eye space
			vec3 R = reflect(-L, N);												// Calculate the reflected beam, N defines the plane (see diagram on labsheet)
			vec4 specular = pow(max(dot(R, V), 0.0), shininess) * specular_colour;	// Calculate specular component
			float distanceToLight = length(lightPosH.xyz - fPosition.xyz);

			// Light Attenuation
			float attenuation = getAttenuation(distanceToLight, attenuation[i]);
			//float attenuation = 2.0;

			totalDiffuse += mix(totalDiffuse, attenuation * diffuse, 1.0);
			totalSpec += mix(totalDiffuse, attenuation * specular, 1.0);
			totalAmbient += mix(totalAmbient, diffuse_colour * vec4(lightCol[i], 1.0) * vec4(0.05, 0.05, 0.05, 1.0), 1.0);
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
}

