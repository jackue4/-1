#version 300 es
precision highp float;
#define attribute in
#define varying out
in vec3 position;in vec2 uv;uniform mat4 modelViewMatrix;uniform mat4 projectionMatrix;
attribute float aSize;attribute float aPhase;attribute float aStrength;attribute vec3 color;uniform float uTime;uniform float uPixelRatio;varying vec3 vTint;varying float vGlow;varying float vLarge;void main(){vTint=color;vGlow=aStrength*(.76+.24*sin(uTime*(.38+aPhase*.025)+aPhase));vLarge=step(3.,aSize);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=aSize*uPixelRatio;}