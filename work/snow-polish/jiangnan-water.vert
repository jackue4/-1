#version 300 es
precision highp float;precision highp int;
#define texture2D texture
uniform vec3 cameraPosition;uniform mat4 viewMatrix;
#define attribute in
#define varying out
uniform mat4 modelMatrix,projectionMatrix;in vec3 position,normal;
attribute float waterDepth;varying float vDepth;varying vec3 vPosition;varying vec3 vWorld;varying vec3 vNormal;
   void main(){vDepth=waterDepth;vPosition=position;vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*world;}