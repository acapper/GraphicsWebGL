precision mediump float;

uniform sampler2D sampler;

uniform vec3 lightCol;
uniform vec3 lightDir;

varying vec2 fTexture;
varying vec3 fNormal;
varying vec4 fPosition;
varying vec4 flight;

void main()
{
	vec4 texel = texture2D(sampler, fTexture);
	vec4 diffuse_colour = vec4(texel.rgba);

	vec4 ambient = vec4(diffuse_colour.rgb * 0.2, diffuse_colour.a);

	vec3 N = normalize(fNormal);			// Be careful with the order of multiplication!
	vec3 L = normalize(flight.xyz - fPosition.xyz);					// Ensure light_dir is unit length
	float intensity = max(dot(L, N), 0.0);
	vec4 diffuse = intensity * diffuse_colour;

	// Calculate specular lighting
	vec4 specular_colour = vec4(lightCol, 1.0);
	float shininess = 3.0;							// smaller values give sharper specular responses, larger more spread out
	vec3 V = normalize(-fPosition.xyz);						// Viewing vector is reverse of vertex position in eye space
	vec3 R = reflect(-L, N);							// Calculate the reflected beam, N defines the plane (see diagram on labsheet)
	vec4 specular = pow(max(dot(R, V), 0.0), shininess) * specular_colour;	// Calculate specular component

	float distanceToLight = length(lightDir - fPosition.xyz);
	float attenuation_kc = 1.0;
	float attenuation_kl = 0.05;
	float attenuation_kq = 0.001;

	float attenuation = 1.0 / (attenuation_kc + attenuation_kl * distanceToLight + attenuation_kq * pow(distanceToLight, 2.0));

	gl_FragColor = ambient + attenuation * (diffuse + specular);
	//gl_FragColor = vec4(specular.xyz, 1.0);
	//gl_FragColor = ambient + diffuse + specular;
	//gl_FragColor = vec4(fNormal, 1.0);
}

