export const PROJECTS=[
  {id:'path',name:'铺一条通往家的小路',duration:22},
  {id:'house0',name:'兔兔的第一间小屋',duration:54},
  {id:'mill',name:'会转动的风车工坊',duration:60},
  {id:'house1',name:'小熊的面包屋',duration:40},
  {id:'dock',name:'海边的木头码头',duration:36},
  {id:'house2',name:'池边的午后长椅',duration:40},
  {id:'house3',name:'菜园旁的花架',duration:40},
  {id:'house4',name:'暖灯与野餐角',duration:40},
];
let cursor=0;for(const project of PROJECTS){project.start=cursor;cursor+=project.duration;}
export const BUILD_DURATION=cursor;
export function restoreConstruction(raw){
  const elapsed=Number(raw?.elapsed);
  return{elapsed:Number.isFinite(elapsed)?Math.max(0,Math.min(BUILD_DURATION,elapsed)):0,paused:raw?.paused===true,speed:raw?.speed===3?3:1};
}
export function constructionAt(seconds){
  const elapsed=Math.max(0,Math.min(BUILD_DURATION,Number(seconds)||0));
  const index=PROJECTS.findIndex(p=>elapsed<p.start+p.duration),complete=index<0;
  const project=PROJECTS[complete?PROJECTS.length-1:index];
  const progress=complete?1:(elapsed-project.start)/project.duration;
  const phase=progress<.18?'整理地基':progress<.42?'搭起木架':progress<.72?'装好墙面':progress<.94?'盖上屋顶':'收拾花园';
  return{elapsed,index:complete?PROJECTS.length:index,project,progress,complete,phase:complete?'小岛建好啦':project.id==='path'?'铺路与立路标':project.id==='dock'?'铺木板、打木桩':phase,total:elapsed/BUILD_DURATION};
}
export function advanceConstruction(state,dt,allowed=true){
  if(!allowed||state.paused)return;
  // Only time actually animated by the open page is counted; no offscreen catch-up.
  state.elapsed=Math.min(BUILD_DURATION,state.elapsed+Math.max(0,Math.min(dt,.1))*state.speed);
}
export function projectProgress(id,elapsed){const p=PROJECTS.find(p=>p.id===id);return p?Math.max(0,Math.min(1,(elapsed-p.start)/p.duration)):1;}
