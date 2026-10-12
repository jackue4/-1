import {THREE,R,TAU,COVE,SITES,normal,frame,seeded} from './core.js';
import {height,landField,coveLocal} from './terrain.js';
import {createPaintBatch} from './paint.js';

// Low, flower-crowned pincushions form small planted groups, leaving paths open.
export function createDesertCacti({palette,routeNormals=[]}){
 const root=new THREE.Group();root.name='沙坡上的花冠仙人球';
 const paint=createPaintBatch(palette),rng=seeded(92914),placements=[],stats={clusters:0,cacti:0,flowers:0,drawCalls:1,triangles:0};
 const globe=new THREE.SphereGeometry(1,24,10),dot=new THREE.SphereGeometry(1,4,3),petal=new THREE.SphereGeometry(1,8,5),p=globe.attributes.position;
 for(let i=0;i<p.count;i++){const y=p.getY(i),a=Math.atan2(p.getZ(i),p.getX(i)),rib=1+.080*Math.cos(a*8);p.setXYZ(i,p.getX(i)*rib,y,p.getZ(i)*rib);}globe.computeVertexNormals();
 const green=new THREE.Color('#527d57'),lit=new THREE.Color('#a4b77b'),tint=new THREE.Color();
 function cactus(base,x,z,size,index){
  const ground=new THREE.Vector3(x,0,z).applyMatrix4(base).normalize();ground.multiplyScalar(height(ground)).applyMatrix4(base.clone().invert());const h=size*(index%3===0?1.32:1.06),y=ground.y+h*.80;
  paint.add(globe,'#ffffff',[x,y,z],[size,h,size],[0,index*.41,-.035],base,(v)=>{const a=Math.atan2(v.z,v.x),k=(Math.cos(a*8)+1)*.5;return tint.copy(green).lerp(lit,.2+k*.43+Math.max(0,v.y)*.18);});stats.cacti++;
  for(let rib=0;rib<8;rib++)for(let row=0;row<2;row++){
   const a=rib*TAU/8+index*.41,yy=-.20+row*.58,rad=Math.sqrt(1-yy*yy)*size*1.082,xx=x+Math.cos(a)*rad,zz=z+Math.sin(a)*rad,cy=y+yy*h;
   paint.add(dot,'#e9d7a5',[xx,cy,zz],[size*.035,size*.038,size*.035],[0,a,0],base);
   const tip=[xx+Math.cos(a)*size*.095,cy+size*.015,zz+Math.sin(a)*size*.095];
   paint.line('#f1dfb1',[[xx,cy-size*.035,zz],tip,[xx,cy+size*.065,zz]],size*.006,base,2);
  }
  if(index%3!==1){
   const fy=y+h*.98,flower=index%2?'#e7a38b':'#e5a4bb';
   for(let j=0;j<6;j++){const a=j*TAU/6;paint.add(petal,flower,[x+Math.sin(a)*size*.13,fy,z+Math.cos(a)*size*.13],[size*.12,size*.034,size*.065],[.18,a,0],base);}
   paint.add(dot,'#f2cf77',[x,fy+size*.020,z],[size*.082,size*.040,size*.082],[0,0,0],base);stats.flowers++;
  }
 }
 function plant(n,size,index){
  const base=frame(Math.asin(n.y),Math.atan2(n.x,n.z),height(n)-.003);
  cactus(base,0,0,size,index);
  if(index%2===0)cactus(base,-size*.95,size*.60,size*.48,index+3);
  if(index%5===0)cactus(base,size*.83,-size*.45,size*.36,index+1);
  for(let j=0;j<4;j++){const a=j*2.399,rad=size*(1.2+rng()*.65);paint.add(dot,j%2?'#c4ad83':'#e8d2a0',[Math.sin(a)*rad,.003,Math.cos(a)*rad],[.012,.007,.010],[0,a,0],base);}
  placements.push({normal:n.toArray(),radius:size*1.85,ground:height(n)});stats.clusters++;
 }
 const cf=frame(COVE.lat,COVE.lon,R+COVE.raise);
 for(const[x,z,s]of [[-.62,.32,.052],[.68,.30,.045],[-.60,-.63,.040]])plant(new THREE.Vector3(x,0,z).applyMatrix4(cf).normalize(),s,stats.clusters);
 const reserved=Object.values(SITES).map(s=>normal(s.lat,s.lon));
 const mesas=[[.74,-1.15,.35],[.65,1.75,.29],[.70,2.20,.30],[.08,-2.4,.26],[-.6,-1.63,.25],[-.50,.85,.17],[.15,2.03,.23],[-.18,2.94,.23]].map(([a,b,r])=>({n:normal(a,b),r:r+.22}));
 for(let i=0;i<900&&stats.clusters<26;i++){
  const n=normal(-.14+rng()*1.41,(rng()-.5)*TAU),c=coveLocal(n),size=.040+rng()*.035;
  if(height(n)<R+.045||landField(n)<.10||reserved.some(s=>s.distanceTo(n)*R<1.05)||mesas.some(s=>s.n.distanceTo(n)*R<s.r)||(c.d>.70&&Math.abs(c.x)<1.7&&c.z>-.99&&c.z<1.4))continue;
  if(placements.some(p=>new THREE.Vector3(...p.normal).distanceTo(n)*R<.30)||routeNormals.some(p=>p.distanceTo(n)*R<size*1.85+.15))continue;
  // Avoid steep dune breaks so all offshoots can sit naturally in the sand.
  const test=frame(Math.asin(n.y),Math.atan2(n.x,n.z),height(n)),inv=test.clone().invert();let slope=0;
  for(const[x,z]of [[size,0],[-size,0],[0,size],[0,-size]]){const q=new THREE.Vector3(x,0,z).applyMatrix4(test).normalize();q.multiplyScalar(height(q)).applyMatrix4(inv);slope=Math.max(slope,Math.abs(q.y));}if(slope>size*.37)continue;
  plant(n,size,stats.clusters);
 }
 const mesh=paint.finish(root,'圆润棱线、奶油小刺与珊瑚花冠 · 合批');stats.triangles=(mesh.geometry.index?.count||mesh.geometry.attributes.position.count)/3;globe.dispose();dot.dispose();petal.dispose();let disposed=false;
 return{root,stats,placements,dispose(){if(disposed)return;disposed=true;paint.dispose();root.removeFromParent();}};
}
