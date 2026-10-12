#version 300 es
precision highp float;precision highp int;
#define HIGH_PRECISION
#define average threeAverage
#define SHADER_TYPE Test
#define SHADER_NAME Test
#define NUM_DIR_LIGHTS 2
#define NUM_POINT_LIGHTS 0
#define NUM_SPOT_LIGHTS 0
#define NUM_SPOT_LIGHT_MAPS 0
#define NUM_SPOT_LIGHT_COORDS 0
#define NUM_LIGHT_PROBES 0
#define NUM_RECT_AREA_LIGHTS 0
#define NUM_HEMI_LIGHTS 1
#define NUM_DIR_LIGHT_SHADOWS 1
#define NUM_POINT_LIGHT_SHADOWS 0
#define NUM_SPOT_LIGHT_SHADOWS 0
#define NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS 0
#define NUM_CLIPPING_PLANES 0
#define UNION_CLIPPING_PLANES 0
#define USE_GRADIENTMAP
#define USE_FOG
#define FOG_EXP2
#define USE_SHADOWMAP
#define SHADOWMAP_TYPE_PCF_SOFT
#define texture2D texture
#define textureCube texture
#define texture2DLodEXT textureLod
#define texture2DGradEXT textureGrad
#define textureCubeLodEXT textureLod
uniform mat4 viewMatrix;uniform vec3 cameraPosition;uniform bool isOrthographic;
#define varying in
out vec4 pc_fragColor;
#define gl_FragColor pc_fragColor
vec4 linearToOutputTexel(vec4 c){return c;}
uniform float uPollenLight;varying float vPollen;void main(){float r=length(gl_PointCoord-.5)*2.;float a=(1.-smoothstep(.1,1.,r))*vPollen*uPollenLight;if(a<.01)discard;gl_FragColor=vec4(1.,.92,.68,a);}