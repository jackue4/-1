import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import * as THREE from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/three/build/three.module.js';
const dir=path.dirname(fileURLToPath(import.meta.url));
const modulePath=path.join(dir,'nature-world-test.mjs');await build({entryPoints:[path.join(dir,'../twin-planets/sunny/world.js')],nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],outfile:modulePath,bundle:true,platform:'node',format:'esm'});
const {createWorld}=await import(pathToFileURL(modulePath).href);const world=createWorld();
const compiler='C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/glslang/bin/glslangValidator.exe';
if(!fs.existsSync(compiler))throw Error('GLSL compiler is not installed');
function expand(source){return source.replace(/#include <([\w\d_]+)>/g,(_,name)=>{if(!THREE.ShaderChunk[name])throw Error('Missing chunk '+name);return expand(THREE.ShaderChunk[name]);});}
const common=`#version 300 es
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
`;
const vp=`#define attribute in
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
`;
const fp=`#define varying in
out vec4 pc_fragColor;
#define gl_FragColor pc_fragColor
vec4 linearToOutputTexel(vec4 c){return c;}
`;
const instanced='#define USE_INSTANCING\n#define USE_INSTANCING_COLOR\n';
const shrub=world.landscape.meshes.find(m=>m.name==='shrub leaves');
const checks=[
  ['water',world.waterMat,'toon','#define USE_COLOR\n'],
  ['cottage-paint',world.construction.structures.find(s=>s.id==='house0').groups[0].children.find(m=>m.material?.vertexColors).material,'toon','#define USE_COLOR\n#define DOUBLE_SIDED\n'],
  ['reef',world.marine.reefMeshes[0].material,'toon',instanced],
  ['sea-grass',world.marine.reefMeshes.find(m=>m.name==='Reef weed').material,'toon',instanced+'#define DOUBLE_SIDED\n'],
  ['boat-wake',world.marine.wake.material,'basic','#define DOUBLE_SIDED\n'],
  ['grass',world.meadow.blades.material,'toon',instanced+'#define DOUBLE_SIDED\n'],
  ['shore-foam',world.surf[0].wave.material,'basic','#define DOUBLE_SIDED\n'],
  ['ground',world.land.material,'toon','#define USE_COLOR\n'],
  ['plush-fur',world.residents[2].body.children.find(o=>o.isMesh&&o.material.userData.plush).material,'toon','#define USE_COLOR\n'],
  ['shrub',shrub.material,'toon',instanced],
  ['canopy',world.canopy.material,'toon',instanced+'#define USE_COLOR\n#define USE_MAP\n#define MAP_UV uv\n'],
  ['canopy-leaves',world.canopyDetail.leaves.material,'toon',instanced+'#define DOUBLE_SIDED\n#define USE_MAP\n#define MAP_UV uv\n#define USE_ALPHATEST\n'],
  ['farm-crop-leaves',world.farm.leaves.material,'toon',instanced+'#define DOUBLE_SIDED\n'],
  ['canopy-leaves-depth',world.canopyDetail.leaves.customDepthMaterial,'depth','#define USE_INSTANCING\n#define DOUBLE_SIDED\n#define DEPTH_PACKING 3201\n#define USE_MAP\n#define MAP_UV uv\n#define USE_ALPHATEST\n'],
  ['shrub-sprays',world.landscape.meshes.find(m=>m.name==='shrub leaf sprays').material,'toon',instanced+'#define DOUBLE_SIDED\n'],
  ['canopy-depth',world.canopy.customDepthMaterial,'depth','#define USE_INSTANCING\n#define DEPTH_PACKING 3201\n']
];
let failures=0;
for(const [name,material,lib,defines] of checks){
  const shader={uniforms:{},vertexShader:THREE.ShaderLib[lib].vertexShader,fragmentShader:THREE.ShaderLib[lib].fragmentShader};material.onBeforeCompile(shader);
  const files=[];
  for(const [stage,prefix,src]of[['vert',vp,shader.vertexShader],['frag',fp,shader.fragmentShader]]){
    const filename=path.join(dir,`${name}.${stage}`);let body=expand(src);
    // Three.js expands compile-time loops before GLSL compilation.
    body=body.replace(/\bNUM_[A-Z_]+\b/g,name=>common.match(new RegExp('#define '+name+' (\\d+)'))?.[1]??name);
    body=body.replace(/#pragma unroll_loop_start\s+for\s*\(\s*int i = (\d+); i < (\d+); i \+\+ \)\s*\{([\s\S]+?)\}\s+#pragma unroll_loop_end/g,(_,a,b,code)=>Array.from({length:Number(b)-Number(a)},(_,i)=>code.replace(/\[\s*i\s*\]/g,`[${Number(a)+i}]`).replaceAll('UNROLLED_LOOP_INDEX',String(Number(a)+i))).join('\n'));
    fs.writeFileSync(filename,common+defines+prefix+body);files.push(filename);
  }
  const result=spawnSync(compiler,['-l',...files],{encoding:'utf8'});if(result.status!==0){failures++;console.error(name,result.stdout,result.stderr);}else console.log(`PASS ${name}: vertex + fragment compile and link`);
}
world.dispose();if(failures)process.exit(1);


