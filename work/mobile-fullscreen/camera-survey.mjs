import {register} from 'node:module';
const dep='file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/three/';
register('data:text/javascript,'+encodeURIComponent(`export async function resolve(s,c,n){if(s==='three')return n('${dep}build/three.module.js',c);if(s.startsWith('three/'))return n('${dep}'+s.slice(6),c);return n(s,c);}`));
const THREE=await import('three'),{createSurface,direction}=await import('../kamakura-planet/surface.js');
const s=createSurface();
const points=[['hill',.70,-.22,.10],['school',.58,-.50,.18],['station',s.trackLat(-.52)+.092,-.52,.12],['crossing',s.trackLat(-.2),-.2,.12],['lagoon',-.067,-.20,0],['beach',-.1,.03,0],['west shore',.2,-.95,.04],['east shore',.2,.48,.04],['tea room',.315,.7,.20],['cottage',.3,-1.13,.2],['lighthouse',.52,-1.2,.36]];
for(const [width,height] of[[390,700],[852,300],[932,360],[568,260]]){const targetLat=-.06;
 const n=direction(targetLat,-.25),p=n.clone().multiplyScalar(s.R+.02),east=new THREE.Vector3(Math.cos(-.25),0,-Math.sin(-.25)),south=new THREE.Vector3().crossVectors(east,n).normalize();
 const aspect=width/height,fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(43)/2)/Math.min(1,Math.max(.44,aspect))));const camera=new THREE.PerspectiveCamera(fov,aspect,.08,70);if(width<760&&height>width)camera.setViewOffset(width,height,0,height*.07,width,height);camera.position.copy(p).addScaledVector(n,4.5).addScaledVector(east,1.45).addScaledVector(south,1.9);camera.up.copy(n);camera.lookAt(p);camera.updateMatrixWorld();
 console.log(JSON.stringify({width,height,fov,points:points.map(([name,lat,lon,alt])=>{const q=direction(lat,lon),v=q.multiplyScalar(Math.max(s.R,s.baseHeight(q))+alt).project(camera);return[name,...v.toArray().slice(0,2).map(n=>+n.toFixed(3))];})}));
}
