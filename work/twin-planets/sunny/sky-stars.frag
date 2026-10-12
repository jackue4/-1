#version 300 es
precision highp float;
#define varying in
out vec4 pc_fragColor;
#define gl_FragColor pc_fragColor
uniform float uVisibility;varying vec3 vTint;varying float vGlow;varying float vLarge;void main(){vec2 p=gl_PointCoord-.5;float r=length(p)*2.;float core=1.-smoothstep(.12,1.,r);float rays=(exp(-abs(p.x)*38.)+exp(-abs(p.y)*38.))*max(0.,1.-r)*.24*vLarge;float alpha=(core*core+rays)*vGlow*uVisibility;if(alpha<.005)discard;gl_FragColor=vec4(vTint,alpha);}