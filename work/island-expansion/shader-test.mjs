import {register} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

// Offline compiler only: this checks expanded GLSL syntax and stage linkage,
// not a browser, graphics driver, rendered appearance, or runtime performance.
const dependencies='file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/three/';
register('data:text/javascript,'+encodeURIComponent(`export async function resolve(s,c,n){if(s==='three')return n('${dependencies}build/three.module.js',c);if(s.startsWith('three/'))return n('${dependencies}'+s.slice(6),c);return n(s,c);}`));
const THREE=await import('three');
const {createSurface,createLand}=await import('../kamakura-planet/surface.js');
const {createTown}=await import('../kamakura-planet/town.js');
const {createLandmarks}=await import('../kamakura-planet/landmarks.js');
const {createBeacons}=await import('../kamakura-planet/beacons.js');
const {createIslandStream}=await import('../kamakura-planet/island-stream.js');
const {createCoastalNature}=await import('../kamakura-planet/coastal-nature.js');
const {createIslandTrails}=await import('../kamakura-planet/island-trails.js');
const {createShoreLife}=await import('../kamakura-planet/shore-life.js');
const {createOcean}=await import('../kamakura-planet/ocean.js');
const artifactDir=path.join(path.dirname(fileURLToPath(import.meta.url)),'glsl');
const compiler='C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/glslang/bin/glslangValidator.exe';
if(!fs.existsSync(compiler))throw Error('Existing GLSL compiler is unavailable');
fs.mkdirSync(artifactDir,{recursive:true});
const planet=new THREE.Group(),surface=createSurface(),palette={ramp:new THREE.DataTexture(new Uint8Array([64,145,214,255]),4,1,THREE.RedFormat)};
const town=createTown({planet,surface,palette}),landmarks=createLandmarks({planet,surface,palette,town});
const beacons=createBeacons({planet,surface,palette});
const modules={
  land:createLand(planet,palette),
  stream:createIslandStream({planet,surface,palette}),
  nature:createCoastalNature({planet,surface,palette,town,landmarks}),
  trails:createIslandTrails({planet,surface,palette,town,landmarks,beacons}),
  shore:createShoreLife({planet,surface,palette,town,landmarks}),
  ocean:createOcean({planet,surface}),
  beacons
};
function expand(source){return source.replace(/#include <([\w\d_]+)>/g,(_,name)=>{if(!THREE.ShaderChunk[name])throw Error('Missing Three.js chunk '+name);return expand(THREE.ShaderChunk[name]);});}
const header=`#version 300 es
precision highp float;precision highp int;
#define HIGH_PRECISION
#define average threeAverage
#define SHADER_TYPE OfflineIslandCheck
#define SHADER_NAME OfflineIslandCheck
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
#define texture2D texture
#define textureCube texture
#define texture2DLodEXT textureLod
#define texture2DGradEXT textureGrad
#define textureCubeLodEXT textureLod
uniform mat4 viewMatrix;uniform vec3 cameraPosition;uniform bool isOrthographic;
`;
const vertexPrefix=`#define attribute in
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
const fragmentPrefix=`#define varying in
out vec4 pc_fragColor;
#define gl_FragColor pc_fragColor
${THREE.ShaderChunk.tonemapping_pars_fragment}
vec3 toneMapping(vec3 color){return ACESFilmicToneMapping(color);}
${THREE.ShaderChunk.colorspace_pars_fragment}
vec4 linearToOutputTexel(vec4 color){return sRGBTransferOETF(color);}
`;
function unroll(source){
  let body=expand(source).replace(/\bNUM_[A-Z_]+\b/g,name=>header.match(new RegExp('#define '+name+' (\\d+)'))?.[1]??name);
  return body.replace(/#pragma unroll_loop_start\s+for\s*\(\s*int i = (\d+); i < (\d+); i \+\+ \)\s*\{([\s\S]+?)\}\s+#pragma unroll_loop_end/g,(_,a,b,code)=>Array.from({length:Number(b)-Number(a)},(_,i)=>code.replace(/\[\s*i\s*\]/g,`[${Number(a)+i}]`).replaceAll('UNROLLED_LOOP_INDEX',String(Number(a)+i))).join('\n'));
}
const checks=[];
for(const [owner,module] of Object.entries(modules)){
  const seen=new Set();let index=0;
  (module.root??module.mesh).traverse(mesh=>{
    if(!mesh.isMesh)return;
    for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
      if(seen.has(material))continue;seen.add(material);
      const lib=material.isShaderMaterial?null:material.isMeshToonMaterial?'toon':material.isMeshBasicMaterial?'basic':null;
      if(!lib&&!material.isShaderMaterial)throw Error(`Unsupported material ${material.type}`);
      const shader={uniforms:{},vertexShader:lib?THREE.ShaderLib[lib].vertexShader:material.vertexShader,fragmentShader:lib?THREE.ShaderLib[lib].fragmentShader:material.fragmentShader};
      material.onBeforeCompile(shader);
      let defines='';
      const define=name=>{defines+='#define '+name+'\n';};
      if(material.vertexColors&&mesh.geometry.hasAttribute('color'))define('USE_COLOR');
      if(material.side===THREE.DoubleSide)define('DOUBLE_SIDED');
      if(material.gradientMap)define('USE_GRADIENTMAP');
      if(material.map){define('USE_MAP');define('MAP_UV uv');}
      if(material.alphaTest>0)define('USE_ALPHATEST');
      if(material.fog){define('USE_FOG');define('FOG_EXP2');}
      if(!material.transparent)define('OPAQUE');
      if(material.toneMapped)define('TONE_MAPPING');
      if(mesh.isInstancedMesh){define('USE_INSTANCING');if(mesh.instanceColor)define('USE_INSTANCING_COLOR');}
      for(const [key,value] of Object.entries(material.defines??{}))define(`${key} ${value}`);
      const baseName=`${owner}-${index++}`;
      for(const shadows of [true,false]){
        const name=baseName+(shadows?'-shadows':'-lightweight');
        const configuration=defines+(shadows?'#define USE_SHADOWMAP\n#define SHADOWMAP_TYPE_PCF_SOFT\n':'');
        const stages=[];
        for(const [stage,prefix,source] of [['vert',vertexPrefix,shader.vertexShader],['frag',fragmentPrefix,shader.fragmentShader]]){
          const file=path.join(artifactDir,name+'.'+stage);
          fs.writeFileSync(file,header+configuration+prefix+unroll(source));stages.push(file);
        }
        const result=spawnSync(compiler,['-l',...stages],{encoding:'utf8'});
        const passed=result.status===0;
        checks.push({name,owner,mesh:mesh.name,material:material.type,mode:shadows?'PCF soft shadows':'shadows disabled',passed,...(!passed?{log:result.stdout+result.stderr,error:result.error?.message}:{})});
        console.log(`${passed?'PASS':'FAIL'} ${name}: ${mesh.name}`);
        if(!passed)console.error(result.stdout,result.stderr);
      }
    }
  });
}
const sourceFiles=['surface.js','island-stream.js','coastal-nature.js','island-trails.js','shore-life.js','ocean.js','beacons.js'];
const sources=Object.fromEntries(sourceFiles.map(name=>[name,createHash('sha256').update(fs.readFileSync(new URL('../kamakura-planet/'+name,import.meta.url))).digest('hex')]));
const report={scope:'Offline CPU glslang ES 3.00 vertex/fragment compilation and linkage using current Three.js chunks, ACES/sRGB and shadow-on/off variants. No browser/GPU/render validation.',threeRevision:THREE.REVISION,passed:checks.filter(c=>c.passed).length,total:checks.length,sources,checks};
fs.writeFileSync(new URL('shader-report.json',import.meta.url),JSON.stringify(report,null,2));
for(const module of Object.values(modules))module.dispose?.();
landmarks.dispose();town.dispose();palette.ramp.dispose();
console.log(JSON.stringify({passed:report.passed,total:report.total,scope:report.scope}));
if(report.passed!==report.total)process.exitCode=1;
