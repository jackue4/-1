// Animate the preview container rather than two simultaneous WebGL renderers.
// Superseded transitions settle immediately and never clear the newest animation.
export function createPlanetTransitions({root,preview,story,reducedMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches}){
 let animations=[],generation=0,phase='idle';
 const elements=[preview,story];
 const sample=element=>{const style=getComputedStyle(element);return{opacity:style.opacity,transform:style.transform==='none'?'translate(0,0) scale(1)':style.transform};};
 function clear(){for(const animation of animations)animation.cancel();animations=[];}
 async function run(kind,direction=1){
  const ticket=++generation,from=elements.map(sample);clear();phase=kind;root.dataset.transition=kind;
  const reduced=reducedMotion(),duration=reduced?90:kind==='leaving'?310:740;
  const poses=kind==='leaving'?[
   [{...from[0]},{opacity:0,transform:reduced?'none':`translateX(${-direction*52}px) scale(.82) rotate(${-direction*4}deg)`}],
   [{...from[1]},{opacity:0,transform:reduced?'none':'translateY(-9px)'}]
  ]:[
   [{opacity:0,transform:reduced?'none':`translateX(${direction*66}px) scale(.84) rotate(${direction*4}deg)`},{opacity:1,transform:'translateX(0) scale(1) rotate(0deg)'}],
   [{opacity:0,transform:reduced?'none':'translateY(12px)'},{opacity:1,transform:'translateY(0)'}]
  ];
  animations=elements.map((element,i)=>element.animate(poses[i],{duration:i?Math.min(duration,kind==='leaving'?200:500):duration,delay:kind==='entering'&&!reduced&&i?80:0,easing:kind==='leaving'?'cubic-bezier(.4,0,.7,.3)':'cubic-bezier(.16,1,.3,1)',fill:'both'}));
  await Promise.all(animations.map(animation=>animation.finished.catch(()=>{})));
  if(ticket!==generation)return false;
  if(kind==='entering'){clear();phase='idle';root.dataset.transition='idle';}
  return true;
 }
 return{leave:direction=>run('leaving',direction),enter:direction=>run('entering',direction),cancel(){generation++;clear();phase='idle';root.dataset.transition='idle';},getState:()=>({phase,generation})};
}
