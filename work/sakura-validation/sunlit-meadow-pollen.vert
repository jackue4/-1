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
#define attribute in
#define varying out
uniform mat4 modelMatrix;uniform mat4 modelViewMatrix;uniform mat4 projectionMatrix;uniform mat3 normalMatrix;
in vec3 position;in vec3 normal;in vec2 uv;
#ifdef USE_COLOR
in vec3 color;
#endif
#ifdef USE_INSTANCING
in mat4 instanceMatrix;
#endif
#ifdef USE_INSTANCING_COLOR
in vec3 instanceColor;
#endif
uniform float uPollenTime;uniform float uPollenSize;varying float vPollen;
      void main(){vec4 p=modelViewMatrix*vec4(position,1.);vPollen=.38+.30*sin(uPollenTime*.7+position.x*18.);
      gl_Position=projectionMatrix*p;gl_PointSize=clamp(uPollenSize*2.7/max(.7,-p.z),1.,3.);}