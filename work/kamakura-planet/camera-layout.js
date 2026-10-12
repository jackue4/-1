import * as THREE from 'three';
import {direction} from './surface.js';

// Keep the established coast angle. Resizing changes only the lens: browser
// chrome, orientation changes and world switches must not reset a user's orbit.
export function coastCameraPose(surface){
 const up=direction(-.06,-.25),target=up.clone().multiplyScalar(surface.R+.02);
 const east=new THREE.Vector3(Math.cos(-.25),0,-Math.sin(-.25));
 const south=new THREE.Vector3().crossVectors(east,up).normalize();
 return{target,up,position:target.clone().addScaledVector(up,4.5).addScaledVector(east,1.45).addScaledVector(south,1.9)};
}

export function setCameraViewport(camera,mode,width,height){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return false;
 camera.aspect=width/height;
 const base=mode==='globe'?37:mode==='town'?55:mode==='coast'?43:48;
 camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(base)/2)/Math.min(1,Math.max(.1,camera.aspect))));
 camera.clearViewOffset();
 if(mode==='coast'&&camera.aspect<1){
  // In portrait the eastern bay used to sit beyond the right edge while the
  // western shoulder left spare room. Rebalance the crop, without moving it
  // when the user merely rotates the device through the square breakpoint.
  const portrait=1-THREE.MathUtils.smoothstep(camera.aspect,.7,1);
  camera.setViewOffset(width,height,width*.17*portrait,height*.07*portrait,width,height);
 }
 camera.updateProjectionMatrix();
 return true;
}
