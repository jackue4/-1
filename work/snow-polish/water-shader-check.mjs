import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import * as THREE from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/three/build/three.module.js';
import {createJiangnanWater} from '../snow-planet/water.js';
const water=createJiangnanWater({THREE,parent:new THREE.Group(),groundHeight:()=>-.13,landField:()=>-.2}),compiler='C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/glslang/bin/glslangValidator.exe';
const expand=source=>source.replace(/#include <([\w_]+)>/g,(_,name)=>expand(THREE.ShaderChunk[name]));
const common='#version 300 es\nprecision highp float;precision highp int;\n#define texture2D texture\nuniform vec3 cameraPosition;uniform mat4 viewMatrix;\n';
const vertexPrefix='#define attribute in\n#define varying out\nuniform mat4 modelMatrix,projectionMatrix;in vec3 position,normal;\n';
const fragmentPrefix='#define varying in\nout vec4 pc_fragColor;\n#define gl_FragColor pc_fragColor\n#define TONE_MAPPING\n'+THREE.ShaderChunk.tonemapping_pars_fragment+'\nvec3 toneMapping(vec3 c){return ACESFilmicToneMapping(c);}\n'+THREE.ShaderChunk.colorspace_pars_fragment+'\nvec4 linearToOutputTexel(vec4 c){return LinearTosRGB(c);}\n';
const files=[];for(const [stage,prefix,source] of [['vert',vertexPrefix,water.mesh.material.vertexShader],['frag',fragmentPrefix,water.mesh.material.fragmentShader]]){const filename=new URL(`./jiangnan-water.${stage}`,import.meta.url);fs.writeFileSync(filename,common+prefix+expand(source));files.push(filename.pathname.replace(/^\/([A-Z]:)/,'$1'));}
const result=spawnSync(compiler,['-l',...files],{encoding:'utf8'});const report={scope:'Offline GLSL ES 3.00 compilation/linkage with current Three.js ACES and sRGB chunks; GPU validation belongs to the app browser pass.',passed:result.status===0,status:result.status,output:result.stdout+result.stderr,threeRevision:THREE.REVISION};fs.writeFileSync(new URL('./water-shader-report.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));water.dispose();if(result.status!==0)process.exit(1);
