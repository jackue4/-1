import {THREE,R,COVE,SITES,normal,frame,seeded} from './core.js';
import {createPaintBatch} from './paint.js';

const clamp=THREE.MathUtils.clamp,smooth=THREE.MathUtils.smoothstep,coveUp=normal(COVE.lat,COVE.lon),coveEast=new THREE.Vector3(1,0,0),coveSouth=new THREE.Vector3().crossVectors(coveEast,coveUp);
const angular=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
export function landField(n){const lat=Math.asin(clamp(n.y,-1,1)),lon=Math.atan2(n.x,n.z),a=1-Math.hypot((lat-.46)/.87,angular(lon,.03)/1.88),b=1-Math.hypot((lat-.36)/.77,angular(lon,2.75)/1.12),c=1-Math.hypot((lat+.70)/.24,angular(lon,-1.62)/.46);return Math.max(a,b,c)+.035*Math.sin(n.x*14+n.y*8)*Math.cos(n.z*15-n.x*3);}
export function coveLocal(n){const d=n.dot(coveUp);return{x:n.dot(coveEast)*(R+COVE.raise)/Math.max(.01,d),z:n.dot(coveSouth)*(R+COVE.raise)/Math.max(.01,d),d};}
export const coveShore=x=>.57+.12*Math.cos(x*2.4);
export function height(n){
 const field=landField(n),land=smooth(field,-.075,.085),lat=Math.asin(clamp(n.y,-1,1)),lon=Math.atan2(n.x,n.z),ridge=Math.pow(.5+.5*Math.sin(lon*10+lat*6+Math.sin(lat*7)*.7),3),dune=(.025+ridge*.30)*smooth(field,.03,.55);
 let radius=R-.21+land*(.27+dune);
 const campDot=n.dot(normal(SITES.caravan.lat,SITES.caravan.lon)),campDist=Math.acos(clamp(campDot,-1,1))*R;
 if(campDist<.92)radius=THREE.MathUtils.lerp((R+.20)/Math.max(.1,campDot),radius,smooth(campDist,.64,.92));
 const c=coveLocal(n);if(c.d>.65&&Math.abs(c.x)<1.20&&c.z>-.98&&c.z<3.4){const blend=(1-smooth(Math.abs(c.x),.88,1.20))*smooth(c.z,-.98,-.76),shore=coveShore(c.x),wet=smooth(c.z,shore-.14,shore+.40),beach=(R+COVE.raise)/c.d;radius=THREE.MathUtils.lerp(radius,THREE.MathUtils.lerp(beach,R-.20,wet),blend);}
 // A small excavated oasis shares the globe water level, surrounded by sand.
 const oasis=Math.acos(clamp(n.dot(normal(SITES.oasis.lat,SITES.oasis.lon)),-1,1))*R;if(oasis<.60)radius=THREE.MathUtils.lerp(R-.15,radius,smooth(oasis,.29,.59));
 return radius;
}
export const surfacePoint=(lat,lon,raise=0)=>{const n=normal(lat,lon);return n.multiplyScalar(height(n)+raise);};

export function createDesertTerrain({parent,palette}){
 const root=new THREE.Group();root.name='风与海雕刻的沙岩星球';parent.add(root);const paint=createPaintBatch(palette),rng=seeded(98031),owned=[],stats={cliffs:0,seaStacks:0,sandRipples:0,paths:0};
 const geo=new THREE.SphereGeometry(R,176,128),p=geo.attributes.position,rgb=new Float32Array(p.count*3),n=new THREE.Vector3(),sand=new THREE.Color('#f3d7a1'),warm=new THREE.Color('#d7a26e'),under=new THREE.Color('#a4c9b3');
 for(let i=0;i<p.count;i++){n.fromBufferAttribute(p,i).normalize();const h=height(n),c=coveLocal(n),wash=.47+.20*Math.sin(n.x*11+n.z*5)*Math.cos(n.y*9-n.z*3),col=sand.clone().lerp(warm,clamp(wash,0,1)*.53);if(h<R+.005)col.lerp(under,clamp((R+.02-h)/.23,0,.75));if(c.d>.9&&Math.abs(c.x)<.72&&c.z<.55&&c.z>-.75)col.lerp(new THREE.Color('#ffedb8'),.35);p.setXYZ(i,n.x*h,n.y*h,n.z*h);rgb.set([col.r,col.g,col.b],i*3);}
 geo.setAttribute('color',new THREE.BufferAttribute(rgb,3));geo.computeVertexNormals();const mat=palette.m('#ffffff').clone();mat.vertexColors=true;
 mat.onBeforeCompile=s=>{s.vertexShader='varying vec3 vDune;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvDune=position;');s.fragmentShader='varying vec3 vDune;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float grain=sin(vDune.x*142.+sin(vDune.z*49.))*sin(vDune.y*121.+vDune.z*63.);
 float duneLine=pow(.5+.5*sin(vDune.y*112.+vDune.x*14.+sin(vDune.z*16.)*2.5),12.);
 diffuseColor.rgb*=.98+grain*.012-duneLine*.036;`);};mat.customProgramCacheKey=()=> 'desert-sand-wash';owned.push(mat,geo);const earth=new THREE.Mesh(geo,mat);earth.name='细沙、风纹与真实下沉的海床';earth.receiveShadow=true;root.add(earth);
 const coveFrame=frame(COVE.lat,COVE.lon,R+COVE.raise);
 // Angular ledges with fine surface striations preserve the drawing's tall,
 // vertical coastal walls. Every profile ring has its own wind-eroded outline.
 function cliff(x,z,w,d,h,seed,base=coveFrame,grass=false){
  const sides=22,rows=15,positions=[],indices=[],colors=[],baseColor=new THREE.Color(seed%2?'#d5b082':'#bd9475'),topColor=new THREE.Color('#e8cb94');
  const probe=new THREE.Vector3(x,0,z).applyMatrix4(base).normalize();probe.multiplyScalar(height(probe)).applyMatrix4(base.clone().invert());const floor=Math.min(-.12,probe.y-.035),ceiling=h-.12;
  const radial=(a,v)=>1+.075*Math.sin(a*5+seed)+.033*Math.sin(a*9-v*4+seed)+.022*Math.sin(v*31+seed);
  for(let j=0;j<=rows;j++)for(let i=0;i<=sides;i++){const a=i/sides*Math.PI*2,v=j/rows,k=radial(a,v)*(1-v*.18)+.04*Math.sin(v*20),xx=Math.cos(a)*w*k,zz=Math.sin(a)*d*k,yy=THREE.MathUtils.lerp(floor,ceiling,v)+Math.sin(a*3+seed)*.018*v;positions.push(xx,yy,zz);const shade=(j%4===0?.73:j%4===1?.90:1)+.06*Math.sin(a*4),col=baseColor.clone().lerp(topColor,v*.4).multiplyScalar(shade);colors.push(col.r,col.g,col.b);if(j<rows&&i<sides){const k=j*(sides+1)+i;indices.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);}}
  positions.push(0,h-.12,0);colors.push(topColor.r,topColor.g,topColor.b);const cap=positions.length/3-1;for(let i=0;i<sides;i++)indices.push(cap,rows*(sides+1)+i+1,rows*(sides+1)+i);
  for(let i=0;i<rows*sides*6;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
  const rock=new THREE.BufferGeometry();rock.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));rock.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));rock.setIndex(indices);rock.computeVertexNormals();
  paint.add(rock,'#ffffff',[x,0,z],[1,1,1],[0,seed*.38,0],base,(v,c,i)=>new THREE.Color().fromArray(colors,i*3));rock.dispose();
  const local=new THREE.Matrix4().makeRotationY(seed*.38);local.setPosition(x,0,z);local.premultiply(base);
  for(let row=1;row<7;row++){const v=row/7,pts=[];for(let k=0;k<=32;k++){const a=k/32*Math.PI*2,r=radial(a,v)*(1-v*.18)+.04*Math.sin(v*20);pts.push([Math.cos(a)*w*(r+.004),THREE.MathUtils.lerp(floor,ceiling,v)+.003+Math.sin(a*3+seed)*.018*v,Math.sin(a)*d*(r+.004)]);}paint.line(row%2?'#a3866d':'#b89a78',pts,.0027,local,44);}
  for(let j=0;j<10;j++){const a=j/10*Math.PI*2,pts=[];for(let k=0;k<6;k++){const v=.09+k*.15,r=radial(a,v)*(1-v*.18)+.04*Math.sin(v*20);pts.push([Math.cos(a)*w*(r+.009),THREE.MathUtils.lerp(floor,ceiling,v)+.02,Math.sin(a)*d*(r+.009)]);}paint.line('#9b8068',pts,.0019,local,12);}
  if(grass){paint.ball('#9fa56a',[x,h-.124,z],[w*.82,.022,d*.82],[0,seed*.38,0],base);}stats.cliffs++;
 }
 // The two walls leave the centre open to the tent and the front open to sea.
 cliff(-1.00,-.49,.39,.63,1.16,1,coveFrame,true);cliff(-1.15,.10,.40,.44,.91,2,coveFrame,true);cliff(-.99,.70,.27,.32,.52,3);
  cliff(1.06,-.43,.42,.60,1.10,4,coveFrame,true);cliff(1.17,.16,.37,.39,.80,5,coveFrame,true);cliff(1.05,.80,.31,.31,.52,6);
 cliff(0,-1.21,.94,.41,.32,7,coveFrame,true);
 for(let i=0;i<7;i++)paint.box(i%2?'#c5b08b':'#d6c59d',[-.15,.014+i*.030,-.64-i*.08],[.24,.045,.102],[0,-.06,0],coveFrame);
 for(const[x,z,s,i]of [[-.93,1.11,.14,4],[-1.32,.74,.12,5],[.93,1.24,.16,3],[1.28,1.07,.11,6]]){cliff(x,z,s,s*.78,s*2.1,i);stats.seaStacks++;}
 const reservations=Object.values(SITES).map(s=>normal(s.lat,s.lon));
 // Smaller remote mesas and sea stacks make the reverse hemisphere rewarding.
 for(const [lat,lon,s]of [[.74,-1.15,.35],[.65,1.75,.29],[.70,2.20,.30],[.08,-2.4,.26],[-.6,-1.63,.25],[-.50,.85,.17],[.15,2.03,.23],[-.18,2.94,.23]]){const n=normal(lat,lon);if(reservations.some(q=>n.distanceTo(q)*R<.82))continue;cliff(0,0,s,s*.71,s*1.9,7+stats.cliffs,frame(lat,lon,height(n)+.015),true);}
 function path(coords,width=.05){const curve=new THREE.CatmullRomCurve3(coords.map(([a,b])=>normal(a,b))),vertices=[],inds=[],col=[],steps=100,v=new THREE.Vector3(),t=new THREE.Vector3(),side=new THREE.Vector3();for(let i=0;i<=steps;i++){curve.getPoint(i/steps,v).normalize();curve.getTangent(i/steps,t).normalize();side.crossVectors(v,t).normalize();for(const k of [-1,1]){const q=v.clone().multiplyScalar(R).addScaledVector(side,k*width).normalize(),c=new THREE.Color(i%7?'#e5c48c':'#d5b381');q.multiplyScalar(height(q)+.006);vertices.push(...q.toArray());col.push(c.r,c.g,c.b);}if(i<steps){const k=i*2;inds.push(k,k+2,k+1,k+1,k+2,k+3);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(inds);g.computeVertexNormals();paint.add(g,'#e4c490');g.dispose();stats.paths++;}
 path([[.35,0],[.50,-.19],[.55,-.50],[.66,-.60]],.055);path([[.47,-.12],[.56,.42],[.50,.84],[.47,1.18]],.053);path([[.67,-.60],[.59,-1.0],[.46,-1.4],[.3,-1.7]],.043);path([[.46,1.18],[.68,1.7],[.78,2.25],[.65,2.71]],.044);path([[.65,2.71],[.57,-2.77],[.44,-2.2],[.3,-1.7]],.039);
 path([[.56,.42],[.69,.48],[.81,.37],[.92,.24]],.038);
 // Broken ripple strokes follow the existing dune elevation, never straight
 // floating rings. Their sandy contrast is intentionally restrained.
 for(let i=0;i<145;i++){const lat=-.24+rng()*1.42,lon=(rng()-.5)*Math.PI*2,n=normal(lat,lon),c=coveLocal(n);if(height(n)<R+.075||reservations.some(q=>n.distanceTo(q)*R<.83)||(c.d>.8&&Math.abs(c.x)<1.5&&c.z<1.1&&c.z>-.9))continue;const pts=[];for(let j=0;j<8;j++){const q=normal(lat+(j/7-.5)*.04+Math.sin(j*.45)*.009,lon+(j/7-.5)*.14);pts.push(q.multiplyScalar(height(q)+.006).toArray());}paint.line(i%3?'#e5c08a':'#f6dda7',pts,.0028,null,12);stats.sandRipples++;}
 const scenery=paint.finish(root,'海蚀崖层理与沙漠小径');
 let disposed=false;return{root,stats,coveFrame,height,landField,dispose(){if(disposed)return;disposed=true;paint.dispose();owned.forEach(r=>r.dispose());root.removeFromParent();}};
}
