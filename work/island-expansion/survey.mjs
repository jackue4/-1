import {register} from 'node:module';
const dep='file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/three/';
register('data:text/javascript,'+encodeURIComponent(`export async function resolve(s,c,n){if(s==='three')return n('${dep}build/three.module.js',c);if(s.startsWith('three/'))return n('${dep}'+s.slice(6),c);return n(s,c);}`));
const THREE=await import('three'),{createSurface}=await import('../kamakura-planet/surface.js'),{createTown}=await import('../kamakura-planet/town.js');
const surface=createSurface(),town=createTown({planet:new THREE.Group(),surface});
console.log(JSON.stringify(town.root.userData.placements));
