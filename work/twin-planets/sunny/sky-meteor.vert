#version 300 es
precision highp float;
#define attribute in
#define varying out
in vec3 position;in vec2 uv;uniform mat4 modelViewMatrix;uniform mat4 projectionMatrix;
varying vec2 vTrail;void main(){vTrail=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}