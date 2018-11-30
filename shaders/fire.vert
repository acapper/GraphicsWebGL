precision mediump float;

uniform mat4 view;
uniform mat4 world;
uniform mat4 proj;

uniform vec3 cameraPosition;

attribute vec4 position;
attribute vec4 colour;

varying vec4 fPosition;
varying float fHeight;

const float pointScale = 100.0;
const float maxDistance = 10.0;

void main()
{
    float cameraDist = distance(position.xyz, cameraPosition);
    gl_PointSize = position.w * (pointScale / cameraDist) / (position.y + 1.0);

	fPosition = proj * view * world * position;
	fHeight = position.y;
    gl_Position = fPosition;
}