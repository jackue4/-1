// Each world owns a DOM subtree while sharing one page, origin, and storage.
// Rendering pauses when its host is inactive; no frames or secondary documents.
export function createWorldDocument(host,markup,css,attributes={}){
 const actual=document,root=host.shadowRoot||host.attachShadow({mode:'open'});
 root.innerHTML=`<style>${css}</style>${markup}`;
 for(const [name,value] of Object.entries(attributes))host.setAttribute(name,value);
 let active=false;
 const cleanups=[];
 const scoped={
  getElementById:id=>root.getElementById(id),querySelector:s=>root.querySelector(s),querySelectorAll:s=>root.querySelectorAll(s),
  createElement:actual.createElement.bind(actual),createTextNode:actual.createTextNode.bind(actual),
  documentElement:host,body:host,get hidden(){return actual.hidden||!active;},
  addEventListener(type,fn,options){
   if(type==='visibilitychange'){
    actual.addEventListener(type,fn,options);host.addEventListener('worldvisibility',fn,options);
    cleanups.push(()=>{actual.removeEventListener(type,fn,options);host.removeEventListener('worldvisibility',fn,options);});
   }else{root.addEventListener(type,fn,options);cleanups.push(()=>root.removeEventListener(type,fn,options));}
  },
  removeEventListener(type,fn,options){if(type==='visibilitychange'){actual.removeEventListener(type,fn,options);host.removeEventListener('worldvisibility',fn,options);}else root.removeEventListener(type,fn,options);},
  setActive(value){active=value;host.hidden=!value;host.inert=!value;host.dispatchEvent(new Event('worldvisibility'));},
  dispose(){cleanups.forEach(fn=>fn());},root
 };
 return scoped;
}
