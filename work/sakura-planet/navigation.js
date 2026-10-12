import * as THREE from 'three';

// Turn the surface underneath a safe close camera, without a polar stop.
export function rotateSurface(planet,camera,dx,dy,height){
  const scale=2*Math.PI/Math.max(height,200);
  const right=new THREE.Vector3(1,0,0).applyQuaternion(camera.quaternion);
  const up=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion);
  planet.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(right,dy*scale));
  planet.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(up,dx*scale)).normalize();
}

export function installSurfaceDrag(canvas,camera,planet,isActive,activity,dragged){
  const pointers=new Map();
  const pending=new THREE.Vector2(),velocity=new THREE.Vector2();let lastMove=0,multi=false;
  function reset(){pending.set(0,0);velocity.set(0,0);lastMove=0;}
  function start(e){
    if(!isActive()||(e.pointerType!=='touch'&&e.button!==0))return;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    reset();multi=pointers.size>1;
    canvas.setPointerCapture?.(e.pointerId);activity(true);
    if(pointers.size>1)dragged();
  }
  function move(e){
    const previous=pointers.get(e.pointerId);if(!previous)return;
    const dx=e.clientX-previous.x,dy=e.clientY-previous.y;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(!isActive()||pointers.size!==1)return;
    if(Math.abs(dx)+Math.abs(dy)>.2){
      const now=performance.now(),dt=lastMove?Math.max(.008,Math.min(.05,(now-lastMove)/1000)):1/60;lastMove=now;
      pending.x+=dx;pending.y+=dy;velocity.lerp(new THREE.Vector2(dx/dt,dy/dt).clampLength(0,1000),.55);
      dragged();activity(true);
    }
  }
  function end(e){pointers.delete(e.pointerId);if(e.type==='pointercancel'||multi||performance.now()-lastMove>100)reset();activity(pointers.size>0);if(!pointers.size)multi=false;}
  function cancel(){pointers.clear();reset();activity(false);}
  function update(dt){
    if(!isActive()){reset();return;}
    const step=Math.min(Math.max(dt,0),.05);if(!step)return;
    if(!pointers.size){const decay=Math.exp(-7.5*step);pending.addScaledVector(velocity,(1-decay)/7.5);velocity.multiplyScalar(decay);if(velocity.lengthSq()<1)velocity.set(0,0);}
    const amount=1-Math.exp(-24*step),dx=pending.x*amount,dy=pending.y*amount;
    if(Math.abs(dx)+Math.abs(dy)>.0001)rotateSurface(planet,camera,dx,dy,canvas.getBoundingClientRect().height);
    pending.multiplyScalar(1-amount);
  }
  const listeners=[['pointerdown',start],['pointermove',move],['pointerup',end],['pointercancel',end],['lostpointercapture',end]];
  listeners.forEach(([name,fn])=>canvas.addEventListener(name,fn));window.addEventListener('blur',cancel);
  const dispose=()=>{listeners.forEach(([name,fn])=>canvas.removeEventListener(name,fn));window.removeEventListener('blur',cancel);cancel();};
  dispose.update=update;dispose.reset=cancel;dispose.getState=()=>({speed:velocity.length(),pending:pending.length()});return dispose;
}
