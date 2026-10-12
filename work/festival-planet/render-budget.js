// Change resolution only after sustained pressure, with a long recovery window.
// Scene contents and animation time are independent of this GPU budget.
export function createRenderBudget({maxRatio=1.5,minRatio=.8}={}){
 let ratio=maxRatio,elapsed=0,frames=0,slow=0,fast=0,cooldown=2500,meanMs=0;
 function reset(max=maxRatio){maxRatio=max;ratio=max;elapsed=frames=slow=fast=meanMs=0;cooldown=2500;return ratio;}
 return{reset,getState:()=>({pixelRatio:ratio,maxPixelRatio:maxRatio,meanFrameMs:meanMs}),sample(ms){
  if(!Number.isFinite(ms)||ms<4||ms>250)return null;
  elapsed+=ms;frames++;cooldown=Math.max(0,cooldown-ms);
  if(elapsed<1200)return null;
  meanMs=elapsed/frames;const span=elapsed;elapsed=frames=0;
  slow=meanMs>23?slow+span:0;fast=meanMs<18?fast+span:0;
  if(cooldown)return null;
  if(slow>=2400&&ratio>minRatio){ratio=Math.max(minRatio,Math.round((ratio-.15)*100)/100);slow=fast=0;cooldown=5000;return ratio;}
  if(fast>=14000&&ratio<maxRatio){ratio=Math.min(maxRatio,Math.round((ratio+.1)*100)/100);slow=fast=0;cooldown=8000;return ratio;}
  return null;
 }};
}
