import {THREE,R,TAU,COVE,SITES,normal,frame,seeded} from './core.js';
import {height,landField,coveLocal} from './terrain.js';
import {createPaintBatch} from './paint.js';

export function createDesertNature({parent,palette}){
 const root=new THREE.Group();root.name='绿洲椰影与海滩草木';parent.add(root);const paint=createPaintBatch(palette),leaves=createPaintBatch(palette),rng=seeded(44570),stats={palms:0,shrubs:0,grasses:0,shells:0,corals:0};leaves.material.side=THREE.DoubleSide;
 const wind={value:0};leaves.material.onBeforeCompile=s=>{s.uniforms.desertBreeze=wind;s.vertexShader='uniform float desertBreeze;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec3 breeze=cross(normalize(position),vec3(.2,.93,.37));transformed+=breeze*sin(desertBreeze*.9+position.x*7.+position.z*4.)*.009;');};leaves.material.customProgramCacheKey=()=> 'desert-leaf-breeze';
 function leaf(a,b,width,color,base){const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),v=vb.clone().sub(va),side=new THREE.Vector3(v.z,0,-v.x).normalize().multiplyScalar(width),middle=va.clone().lerp(vb,.45);middle.y+=width*.5;const vs=[...va.toArray(),...middle.clone().add(side).toArray(),...vb.toArray(),...middle.clone().sub(side).toArray()],g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vs,3));g.setIndex([0,2,1,0,3,2]);g.computeVertexNormals();leaves.add(g,color,[0,0,0],[1,1,1],[0,0,0],base);g.dispose();}
 function palm(base,size=1,turn=0){
  const h=.70*size,trunk=[[0,0,0],[.012*size,h*.33,0],[.055*size,h*.70,-.015*size],[.095*size,h,-.020*size]];paint.line('#99775a',trunk,.025*size,base,14);
  for(let i=1;i<12;i++){const t=i/12;paint.ball(i%2?'#ad8c62':'#ba9b6c',[.095*size*t*t,h*t,-.02*size*t],[.026*size,.006*size,.026*size],[0,turn,0],base);}
  for(let j=0;j<8;j++){const a=turn+j*TAU/8,len=(.34+rng()*.095)*size,pts=[];for(let k=0;k<=8;k++){const u=k/8;pts.push([.095*size+Math.sin(a)*len*u,h+Math.sin(u*Math.PI)*.15*size-u*u*.12*size,-.020*size+Math.cos(a)*len*u]);}paint.line('#6f8a44',pts,.004*size,base,10);
   for(let k=1;k<8;k++){const p=pts[k],u=k/8,breadth=Math.sin(u*Math.PI)*.10*size;for(const side of[-1,1])leaf(p,[p[0]+Math.cos(a)*breadth*side+Math.sin(a)*.054*size,p[1]-.020*size,p[2]-Math.sin(a)*breadth*side+Math.cos(a)*.054*size],.014*size,['#466b43','#6d8a4b','#93aa57'][j%3],base);}
  }
  for(let j=0;j<3;j++)paint.ball('#89774e',[.095*size+Math.sin(j*2.1)*.038*size,h-.023*size,Math.cos(j*2.1)*.035*size],[.029*size,.035*size,.028*size],[0,0,0],base);stats.palms++;
 }
 const cf=frame(COVE.lat,COVE.lon,R+COVE.raise);
 for(const[x,z,s]of [[-.45,-1.02,.80],[.76,-1.01,.87],[-1.45,-.36,.77],[1.56,-.28,.71]]){const local=new THREE.Matrix4().makeTranslation(x,-.015,z).premultiply(cf);palm(local,s,rng()*6);}
 for(let i=0;i<15;i++){const a=i/15*TAU;if(Math.cos(a-.7)>.62)continue;const rad=.63+(i%3)*.10,site=SITES.oasis,base=frame(site.lat,site.lon,R);const n=new THREE.Vector3(Math.sin(a)*rad,0,Math.cos(a)*rad).applyMatrix4(base).normalize(),lat=Math.asin(n.y),lon=Math.atan2(n.x,n.z);palm(frame(lat,lon,height(n)+.004),.72+rng()*.40,a);}
 const sites=Object.entries(SITES).filter(([id])=>id!=='oasis').map(([,s])=>normal(s.lat,s.lon));
 for(let i=0,accepted=0;i<220&&accepted<26;i++){const lat=-.25+rng()*1.25,lon=(rng()-.5)*TAU,n=normal(lat,lon),c=coveLocal(n);if(height(n)<R+.025||landField(n)>.53||sites.some(s=>n.distanceTo(s)*R<.9)||(c.d>.7&&Math.abs(c.x)<1.5&&c.z>-.9&&c.z<1.2))continue;palm(frame(lat,lon,height(n)),.65+rng()*.43,rng()*TAU);accepted++;}
 function shrub(base,size=.10){for(let j=0;j<5;j++){const a=j*2.4;leaves.ball(['#718650','#879852','#a1ac64'][j%3],[Math.sin(a)*size*.47,size*.29,Math.cos(a)*size*.40],[size*.7,size*.53,size*.60],[0,a,0],base);}stats.shrubs++;}
 for(const [x,y,z,s]of [[-.98,1.03,-.58,.16],[1.06,.98,-.48,.14],[-1.15,.79,.02,.12],[1.15,.68,.19,.13],[-.80,.0,-.81,.14],[.82,0,-.85,.12]])shrub(new THREE.Matrix4().makeTranslation(x,y,z).premultiply(cf),s);
 for(let i=0;i<240;i++){const lat=-.30+rng()*1.55,lon=(rng()-.5)*TAU,n=normal(lat,lon),c=coveLocal(n);if(height(n)<R+.02||sites.some(s=>n.distanceTo(s)*R<.8)||(c.d>.75&&Math.abs(c.x)<1.28&&c.z>-.94&&c.z<1.4))continue;const base=frame(lat,lon,height(n)+.008);
  if(i%5===0){shrub(base,.058+rng()*.058);continue;}
  for(let j=0;j<5;j++){const a=j*2.399+rng();leaf([0,0,0],[Math.sin(a)*.024,.038+rng()*.026,Math.cos(a)*.025],.007,i%3?'#9ba163':'#a8ae71',base);}stats.grasses++;
  if(i%13===0){for(let j=0;j<4;j++){const a=j*1.57;paint.ball('#eec5a2',[Math.sin(a)*.018,.058,Math.cos(a)*.018],[.014,.006,.009],[0,a,0],base);}paint.ball('#d99c52',[0,.06,0],[.008,.006,.008],[0,0,0],base);}
 }
 // Shells, salt-bleached branches and tiny shoreline pebbles provide scale.
 for(let i=0;i<34;i++){const x=(rng()-.5)*1.45,z=.40+rng()*.17;if(Math.abs(x-.29)<.19&&z<.53)continue;const local=new THREE.Matrix4().makeTranslation(x,.008,z).premultiply(cf),s=.009+rng()*.008;paint.ball(i%3?'#ffeacb':'#daaaa0',[0,0,0],[s,s*.42,s*.72],[0,i,0],local);for(let k=-1;k<=1;k++)paint.line('#c5aa86',[[k*s*.35,.003,-s*.40],[k*s*.42,s*.43,0],[k*s*.2,.003,s*.50]],.0007,local,2);stats.shells++;}
 paint.line('#c7ab88',[[-.72,.013,.35],[-.64,.021,.43],[-.53,.01,.46]],.013,cf,4);paint.line('#b99a78',[[-.64,.021,.43],[-.63,.028,.50]],.009,cf,2);
 for(let i=0;i<24;i++){const x=(rng()-.5)*1.56,z=(rng()-.5)*1.45;if(Math.abs(x)<.7&&z<.52&&z>-.72)continue;paint.ball(i%2?'#b4a289':'#d7c19a',[x,.008,z],[.015+rng()*.013,.011,.018],[0,i,0],cf);}
 const solid=paint.finish(root,'棕榈树干、椰果与海边贝壳'),foliage=leaves.finish(root,'风中的棕榈羽叶、低灌木和海滨草');
 let disposed=false;return{root,stats,update(time){wind.value=time;},dispose(){if(disposed)return;disposed=true;paint.dispose();leaves.dispose();root.removeFromParent();}};
}
