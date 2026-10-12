import assert from 'node:assert/strict';
import * as THREE from 'three';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createNightSky} from './night-sky.js';
import {createPaintedLightRamp} from './painted-style.js';
import {createTreeTexture} from './tree-asset.js';
const checks=[],sky=createNightSky(111),camera=new THREE.PerspectiveCamera(38,1.8,.1,60);camera.position.set(.45,5.95,2.15);camera.lookAt(0,2.67,0);camera.updateMatrixWorld();
const night={night:1,cloud:.2,rain:0,snow:0},day={...night,night:0};
sky.update(.1,0,day,camera);assert.equal(sky.stars.visible,false);assert.equal(sky.meteor.visible,false);assert.equal(sky.stars.geometry.attributes.position.count,1100);assert.ok(sky.stars.geometry.attributes.aSize.array.some(v=>v>4));checks.push('1100 batched stars vary in brightness and size, and are hidden during daylight');
let elapsed=0,heads=0,intervals=[],lastBirth=0,previousSeen=0;
for(let i=0;i<6000;i++){elapsed+=.05;sky.update(.05,elapsed,night,camera,1.25);if(sky.getState().meteorsSeen!==previousSeen){intervals.push(elapsed-lastBirth);lastBirth=elapsed;previousSeen=sky.getState().meteorsSeen;}
 if(sky.meteor.visible){heads++;const p=new THREE.Vector3().fromBufferAttribute(sky.meteor.geometry.attributes.position,0).add(camera.position).project(camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1&&p.z<1,'meteor visible in game camera');assert.ok(sky.meteor.geometry.attributes.position.array.every(Number.isFinite));}}
assert.ok(heads>20);assert.ok(previousSeen>=5&&previousSeen<12);assert.ok(new Set(intervals.map(v=>Math.round(v))).size>2);checks.push('Clear nights produce infrequent meteors with finite tapered trails inside the garden camera view');
const before=sky.getState().meteorsSeen;for(let i=0;i<1200;i++)sky.update(.05,elapsed+i*.05,{...night,rain:1,cloud:1},camera);assert.equal(sky.getState().meteorsSeen,before);assert.ok(sky.getState().visibility<.1);sky.update(.1,400,day,camera);assert.equal(sky.meteor.visible,false);checks.push('Storms dim stars and suppress new meteors; daylight clears active trails');
camera.aspect=.65;camera.fov=49;camera.updateProjectionMatrix();for(let i=0;i<450;i++){sky.update(.05,410+i*.05,night,camera);if(sky.meteor.visible){const p=new THREE.Vector3().fromBufferAttribute(sky.meteor.geometry.attributes.position,0).add(camera.position).project(camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1);}}checks.push('Meteor placement also fits the portrait camera');
for(const [name,mat] of [['sky-stars',sky.stars.material],['sky-meteor',sky.meteor.material]]){
 const base='work/planet-v2/'+name,v=base+'.vert',f=base+'.frag';fs.writeFileSync(v,'#version 300 es\nprecision highp float;\n#define attribute in\n#define varying out\nin vec3 position;in vec2 uv;uniform mat4 modelViewMatrix;uniform mat4 projectionMatrix;\n'+mat.vertexShader);fs.writeFileSync(f,'#version 300 es\nprecision highp float;\n#define varying in\nout vec4 pc_fragColor;\n#define gl_FragColor pc_fragColor\n'+mat.fragmentShader);const result=spawnSync('work/glslang/bin/glslangValidator.exe',['-l',v,f],{encoding:'utf8'});assert.equal(result.status,0,result.stdout+result.stderr);
}checks.push('Both new star and meteor shader pairs compile and link');
const ramp=createPaintedLightRamp(),texture=createTreeTexture();assert.equal(ramp.image.width,64);assert.ok(texture.generateMipmaps);const bytes=texture.image.data;let low=255,high=0;for(let i=0;i<bytes.length;i+=4){low=Math.min(low,bytes[i]);high=Math.max(high,bytes[i]);}assert.ok(high-low>45);checks.push('Painted vegetation retains mipmapped brush textures and soft light ramps');
texture.dispose();ramp.dispose();sky.dispose();console.log(JSON.stringify({passed:checks.length,checks},null,2));
