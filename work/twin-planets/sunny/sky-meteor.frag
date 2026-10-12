#version 300 es
precision highp float;
#define varying in
out vec4 pc_fragColor;
#define gl_FragColor pc_fragColor
varying vec2 vTrail;uniform float uOpacity;void main(){float edge=pow(max(0.,1.-abs(vTrail.y*2.-1.)),1.6);float fade=pow(1.-vTrail.x,1.6);vec3 tint=mix(vec3(1.,.94,.75),vec3(.61,.76,1.),vTrail.x);gl_FragColor=vec4(tint,edge*fade*uOpacity);}