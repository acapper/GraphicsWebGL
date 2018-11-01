precision mediump float;

const int MAX_LIGHTS = 10;  

uniform sampler2D sampler;

uniform vec3 lightCol[MAX_LIGHTS];
uniform vec3 lightDir[MAX_LIGHTS];
uniform vec3 lightPos[MAX_LIGHTS];
uniform int lightOn[MAX_LIGHTS];
uniform float attenuation_kc;
uniform float attenuation_kl;
uniform float attenuation_kq;

varying vec2 fTexture;
varying vec3 fNormal;
varying vec4 fPosition;
varying mat4 fWorld;
varying mat4 fView;

void main()
{
	vec4 texel = texture2D(sampler, fTexture);
	vec4 diffuse_colour = vec4(texel.rgba);

	vec4 ambient = vec4(diffuse_colour.rgb * 0.3, diffuse_colour.a);

	vec4 totalDiffuse;
	vec4 totalSpec;
	for(int i=0; i<MAX_LIGHTS; ++i)
	{	
		if(lightOn[i] == 1){
			vec4 lightPosH = fView * fWorld * vec4(lightPos[i], 1.0);
			vec3 N = normalize(fNormal);			// Be careful with the order of multiplication!
			vec3 L = normalize(lightPosH.xyz - fPosition.xyz);					// Ensure light_dir is unit length
			float intensity = max(dot(L, N), 0.0);
			vec4 diffuse = (intensity * vec4(lightCol[i], 1.0)) + intensity * diffuse_colour;

			// Calculate specular lighting
			vec4 specular_colour = vec4(lightCol[i], 1.0);
			float shininess = 10.0;						// smaller values give sharper specular responses, larger more spread out
			vec3 V = normalize(-fPosition.xyz);						// Viewing vector is reverse of vertex position in eye space
			vec3 R = reflect(-L, N);							// Calculate the reflected beam, N defines the plane (see diagram on labsheet)
			vec4 specular = pow(max(dot(R, V), 0.0), shininess) * specular_colour;	// Calculate specular component

			float distanceToLight = length(lightPos[i] - fPosition.xyz);

			float attenuation = 1.0 / (attenuation_kc + attenuation_kl * distanceToLight + attenuation_kq * pow(distanceToLight, 2.0));
			//float attenuation = 1.0 / pow(distanceToLight, 2.0);

			totalDiffuse += attenuation * diffuse;
			totalSpec += attenuation * specular;
		}
	}

	gl_FragColor = ambient + totalDiffuse + totalSpec;
	//gl_FragColor = vec4(totalSpec.xyz, 1.0);
	//gl_FragColor = vec4(specular.xyz, 1.0);
	//gl_FragColor = ambient + diffuse + specular;
	//gl_FragColor = vec4(fNormal, 1.0);
}

