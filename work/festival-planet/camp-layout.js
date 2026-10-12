import {THREE,normal} from './core.js';

// The quiet southern clearing is outside every ride and the coaster corridor.
export const CAMP={lat:-.90,lon:-2.55,radius:1.52,raise:.115,rx:1.19,rz:.97};
export const CAMP_NAME='林间露营 · 星光营地';
export function campFrame(surface){
 const up=normal(CAMP.lat,CAMP.lon),east=new THREE.Vector3(Math.cos(CAMP.lon),0,-Math.sin(CAMP.lon)),south=new THREE.Vector3().crossVectors(east,up);
 return new THREE.Matrix4().makeBasis(east,up,south).setPosition(up.multiplyScalar(surface.height(up)+CAMP.raise));
}
export function campCoordinates(surface,x,z){const n=new THREE.Vector3(x,0,z).applyMatrix4(campFrame(surface)).normalize();return[Math.asin(n.y),Math.atan2(n.x,n.z)];}
export const CAMP_TREES=[[-1.15,-.64,2.35],[-.81,-1.19,2.50],[-.16,-1.28,2.15],[.53,-1.17,2.3],[1.12,-.89,2.15],[1.40,-.43,1.6]];
