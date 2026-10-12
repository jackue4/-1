import {THREE,R,normal,seeded} from './core.js';

// Geometry carries the colour of a painted brush stroke. The scene therefore
// stays crisp at close range without a noisy photographic foliage texture.
const UP=new THREE.Vector3(0,1,0),TAU=Math.PI*2;
const clamp=THREE.MathUtils.clamp;
const green=['#225e4b','#347c46','#4b9444','#6da737','#91b948'];
const spring=['#d987a7','#eda6ba','#f5bfd0','#ffdae1'];

class BrushBatch{
 constructor(){this.positions=[];this.normals=[];this.colors=[];this.weights=[];this.phases=[];}
 triangle(a,b,c,ca,cb,cc,normalA,normalB,normalC,weights=[0,0,0],phase=0){
  const face=new THREE.Vector3().subVectors(b,a).cross(new THREE.Vector3().subVectors(c,a)).normalize();
  for(const [i,p] of [a,b,c].entries()){
   this.positions.push(p.x,p.y,p.z);const n=[normalA,normalB,normalC][i]||face;this.normals.push(n.x,n.y,n.z);
   const col=[ca,cb,cc][i];this.colors.push(col.r,col.g,col.b);this.weights.push(weights[i]);this.phases.push(phase);
  }
 }
 geometry(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(this.positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(this.normals,3));g.setAttribute('color',new THREE.Float32BufferAttribute(this.colors,3));g.setAttribute('windWeight',new THREE.Float32BufferAttribute(this.weights,1));g.setAttribute('windPhase',new THREE.Float32BufferAttribute(this.phases,1));g.computeBoundingSphere();return g;}
 append(geometry,matrix,color,paint=null,weight=null,phase=0){
  const pos=geometry.attributes.position,norm=geometry.attributes.normal,index=geometry.index,normalMatrix=new THREE.Matrix3().getNormalMatrix(matrix),length=index?index.count:pos.count;
  const ps=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()],ns=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];
  for(let i=0;i<length;i+=3){const cs=[],ws=[];
   for(let j=0;j<3;j++){const k=index?index.getX(i+j):i+j,local=new THREE.Vector3().fromBufferAttribute(pos,k);ps[j].copy(local).applyMatrix4(matrix);ns[j].fromBufferAttribute(norm,k).applyMatrix3(normalMatrix).normalize();cs.push(paint?paint(local,k):color);ws.push(weight?weight(local):0);}
   this.triangle(ps[0],ps[1],ps[2],...cs,...ns,ws,phase);
  }
 }
}

export function createPainterlyNature({root,palette,surface={}}){
 const rng=seeded(903217),paintRoot=new THREE.Group();paintRoot.name='Painted leaves and wind-combed meadows';paintRoot.userData.dynamic=true;root.add(paintRoot);
 const batches={wood:new BrushBatch(),canopy:new BrushBatch(),leaves:new BrushBatch(),grass:new BrushBatch(),flowers:new BrushBatch(),ground:new BrushBatch()};
 const stats={trees:0,canopyLobes:0,grassClumps:0,grassBlades:0,wildflowers:0,meadowPatches:0,drawCalls:0};
 const timeUniform={value:0},windUniform={value:1},materials=[],geometries=[],renderMeshes=[],treeFootprints=[];
 // A nature-only painted ramp softens the hard two-tone bands on round leaves.
 // Buildings keep their existing crisp cel-shading and their original palette.
 const gradient=new THREE.DataTexture(new Uint8Array([137,163,188,211,233,251]),6,1,THREE.RedFormat);gradient.minFilter=gradient.magFilter=THREE.LinearFilter;gradient.needsUpdate=true;
 const height=n=>surface.height?surface.height(n):R+.012;
 const warmWood=new THREE.Color('#8e7160'),woodLight=new THREE.Color('#b29171');
 const grassColors=green.map(c=>new THREE.Color(c)),flowerColors=['#ffb1cc','#f692b7','#f9d6d9','#fff1c9','#bdafd6'].map(c=>new THREE.Color(c));
 function material({side=THREE.FrontSide,wind=false}={}){
  const mat=new THREE.MeshToonMaterial({color:0xffffff,vertexColors:true,gradientMap:gradient,side});
  if(wind){mat.onBeforeCompile=shader=>{
   shader.uniforms.paintTime=timeUniform;shader.uniforms.paintWind=windUniform;
   shader.vertexShader='uniform float paintTime; uniform float paintWind; attribute float windWeight; attribute float windPhase;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    vec3 planetNormal=normalize(position);
    vec3 breezeDirection=normalize(cross(planetNormal,vec3(0.31,0.92,0.19)) + vec3(0.0001));
    float breeze=sin(paintTime*1.48+windPhase+position.x*3.2+position.z*2.1)*0.66+sin(paintTime*2.1+position.y*9.0+windPhase)*0.23;
    transformed += breezeDirection * breeze * windWeight * paintWind;
   `);
  };mat.customProgramCacheKey=()=> 'festival-painted-foliage-v3';}
  materials.push(mat);return mat;
 }
 const treeMaterial=material({wind:true}),woodMaterial=material(),leafMaterial=material({wind:true,side:THREE.DoubleSide}),grassMaterial=material({wind:true,side:THREE.DoubleSide}),flowerMaterial=material({wind:true,side:THREE.DoubleSide}),groundMaterial=material({side:THREE.DoubleSide});
 // Wash edges use the ground's lighting ramp so they dissolve into its paint.
 groundMaterial.gradientMap=palette.m('#ffffff').gradientMap;
 const tempMatrix=new THREE.Matrix4();
 function matrixAt(base,position,scale=[1,1,1],rotation=new THREE.Quaternion()){
  tempMatrix.compose(new THREE.Vector3(...position),rotation,new THREE.Vector3(...scale));return new THREE.Matrix4().multiplyMatrices(base,tempMatrix);
 }
 function tubePaint(points,radius,color,base){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),g=new THREE.TubeGeometry(curve,points.length>3?4:points.length>2?2:1,radius,5,false);
  batches.wood.append(g,base,color,p=>color.clone().lerp(woodLight,clamp(p.x*2+.15,0,.3)));g.dispose();
 }
 function leafBlade(batch,base,start,angle,length,width,color,tipColor,lean,phase,weight=.02){
  const direction=new THREE.Vector3(Math.sin(angle),0,Math.cos(angle)),across=new THREE.Vector3(Math.cos(angle),0,-Math.sin(angle));
  const p=new THREE.Vector3(...start),a=p.clone(),middle=p.clone().add(new THREE.Vector3(0,length*.44,0)).addScaledVector(direction,lean*.15),upper=p.clone().add(new THREE.Vector3(0,length*.79,0)).addScaledVector(direction,lean*.63);
  const c=middle.clone().addScaledVector(across,-width*.56),d=middle.clone().addScaledVector(across,width*.56),e=upper.clone().addScaledVector(across,-width*.28),f=upper.clone().addScaledVector(across,width*.28),tip=p.clone().add(new THREE.Vector3(0,length*.87,0)).addScaledVector(direction,lean);
  [a,c,d,e,f,tip].forEach(v=>v.applyMatrix4(base));
  const n=p.clone().applyMatrix4(base).normalize(),midColor=color.clone().lerp(tipColor,.46);
  batch.triangle(a,d,c,color,midColor,midColor,n,n,n,[0,weight*.36,weight*.36],phase);
  batch.triangle(c,d,e,midColor,midColor,tipColor,n,n,n,[weight*.36,weight*.36,weight*.75],phase);
  batch.triangle(d,f,e,midColor,tipColor,tipColor,n,n,n,[weight*.36,weight*.75,weight*.75],phase);
  batch.triangle(e,f,tip,tipColor,tipColor,tipColor,n,n,n,[weight*.75,weight*.75,weight],phase);
 }
 function canopyFleck(base,length,width,color,phase,weight){
  const center=new THREE.Vector3(0,.002,0).applyMatrix4(base),n=new THREE.Vector3(0,1,0).transformDirection(base),count=6;
  for(let i=0;i<count;i++){
   const a=i/count*TAU,b=(i+1)/count*TAU,pa=new THREE.Vector3(Math.sin(a)*width,0,Math.cos(a)*length).applyMatrix4(base),pb=new THREE.Vector3(Math.sin(b)*width,0,Math.cos(b)*length).applyMatrix4(base);
   batches.leaves.triangle(center,pa,pb,color,color,color,n,n,n,[weight,weight,weight],phase);
  }
 }
 function tree(lat,lon,size=1,type=0,forest=false){
  const n=normal(lat,lon),g=new THREE.Group();g.name=type===2?'Hand-painted flowering tree':'Hand-painted broadleaf tree';g.position.copy(n).multiplyScalar(height(n)+.009);g.quaternion.setFromUnitVectors(UP,n);g.rotateY(rng()*TAU);root.add(g);g.updateMatrix();
  const base=g.matrix.clone().scale(new THREE.Vector3(size,size,size));treeFootprints.push({n:n.clone(),radius:.10*size});
  tubePaint([[0,0,0],[.009,.13,.006],[-.006,.28,0],[.035,.36,-.013]],.022,warmWood,base);
  for(let i=0;i<4;i++){const a=i*TAU/4+.4;tubePaint([[0,.20,0],[Math.sin(a)*.057,.29,Math.cos(a)*.057],[Math.sin(a)*.106,.35,Math.cos(a)*.106]],.011,warmWood,base);tubePaint([[0,.012,0],[Math.sin(a)*.037,.012,Math.cos(a)*.037],[Math.sin(a)*.075,.003,Math.cos(a)*.075]],.009,warmWood,base);}
  const blossom=type===2,colors=forest?['#244e4b','#3b7160','#5b9171','#83aa7c','#adc193'].map(c=>new THREE.Color(c)):blossom?spring.map(c=>new THREE.Color(c)):grassColors;
  const lobes=type===1?[[0,.33,0,.165,.13,.16],[-.071,.40,.009,.137,.15,.12],[.067,.46,-.015,.126,.137,.12],[0,.54,0,.094,.10,.095]]:[[0,.375,.02,.195,.148,.192],[-.111,.343,.016,.131,.113,.14],[.115,.352,-.005,.137,.115,.141],[-.022,.472,-.029,.139,.119,.139]];
  for(let j=0;j<lobes.length;j++){
   const [x,y,z,sx,sy,sz]=lobes[j],geo=new THREE.SphereGeometry(1,24,16),positions=geo.attributes.position;
   for(let k=0;k<positions.count;k++){const v=new THREE.Vector3().fromBufferAttribute(positions,k);const distortion=1+(forest?.064:.024)*Math.sin(v.x*6+j)*Math.cos(v.y*6+v.z*4)+(forest?.027:.009)*Math.sin(v.z*11-j);v.multiplyScalar(distortion);positions.setXYZ(k,v.x,v.y,v.z);}geo.computeVertexNormals();
   const lobeMatrix=matrixAt(base,[x,y,z],[sx,sy,sz]);
   batches.canopy.append(geo,lobeMatrix,colors[2],v=>{
    const brush=Math.sin(v.x*9+v.y*4+j)*Math.sin(v.z*7+v.y*6)*(forest?.15:.065),light=clamp(.51+v.y*.24-v.x*.10+v.z*.08+brush,.12,.96),part=light*(colors.length-1),lower=Math.min(colors.length-2,Math.floor(part));return colors[lower].clone().lerp(colors[lower+1],part-lower);
   },v=>(.45+v.y*.4)*.012*size,j+lat*7+lon*3);
   geo.dispose();stats.canopyLobes++;
   // Flat almond flecks lie along the skin of the crown like short brush
   // strokes. Nothing points radially outwards like a cactus spine.
   for(let k=0;k<6;k++){
    const a=k*2.399+j,yy=.12+rng()*.77,rr=Math.sqrt(1-yy*yy),lv=new THREE.Vector3(Math.cos(a)*rr,yy,Math.sin(a)*rr),distortion=1+(forest?.064:.024)*Math.sin(lv.x*6+j)*Math.cos(lv.y*6+lv.z*4)+(forest?.027:.009)*Math.sin(lv.z*11-j),p=lv.clone().multiplyScalar(distortion+ .010).multiply(new THREE.Vector3(sx,sy,sz)).add(new THREE.Vector3(x,y,z));
    const q=new THREE.Quaternion().setFromUnitVectors(UP,lv).multiply(new THREE.Quaternion().setFromAxisAngle(UP,a)),lm=matrixAt(base,p.toArray(),[1,1,1],q),col=colors[Math.min(colors.length-1,2+k%2)].clone().lerp(colors[2],.4);
    canopyFleck(lm,.015+rng()*.009,.006+rng()*.005,col,j+k*.73,.004*size);
   }
  }
  stats.trees++;return g;
 }
 const curvePoints=[];
 function compileCurve(curve){
  if(typeof curve?.getSpacedPoints==='function')return curve.getSpacedPoints(220).map(p=>p.clone().normalize());
  if(Array.isArray(curve)&&curve.length>1)return new THREE.CatmullRomCurve3(curve.map(p=>p.isVector3?p.clone().normalize():normal(...p)),false,'catmullrom',.3).getSpacedPoints(220).map(p=>p.normalize());
  return [];
 }
 function frame(n,offset=.005){const q=new THREE.Quaternion().setFromUnitVectors(UP,n);return new THREE.Matrix4().compose(n.clone().multiplyScalar(height(n)+offset),q,new THREE.Vector3(1,1,1));}
 function fallbackPathDistance(n){let nearest=Infinity;for(const p of curvePoints)nearest=Math.min(nearest,n.distanceTo(p)*R);return nearest;}
 function createMeadows({curves=surface.curves||[],reservations=[],coasterCurve}={}){
  if(renderMeshes.length)return stats;
  const pathCurves=curves.map(compileCurve);curvePoints.push(...pathCurves.flat());
  // Low verge grass can enter the outer tree clearances, but never the actual
  // floors of attractions or the castle steps.
  const reserved=reservations.map(([lat,lon,r])=>({n:normal(lat,lon),threshold:Math.cos(r*(r>1?.91:.79)/R)}));
  const coasterPoints=coasterCurve?.getSpacedPoints?coasterCurve.getSpacedPoints(240).filter(p=>p.length()<R+.20).map(p=>p.clone().normalize()):[];
  const pathDistance=n=>surface.pathDistance?surface.pathDistance(n):fallbackPathDistance(n);
  const coastMask=n=>surface.lagoonMask?surface.lagoonMask(n):Math.hypot((Math.asin(n.y)+.20)/.39,Math.atan2(Math.sin(Math.atan2(n.x,n.z)-.37),Math.cos(Math.atan2(n.x,n.z)-.37))/.575);
  function allowed(n,border=false){
   if(coastMask(n)<1.115)return false;
   if(surface.streamDistance&&surface.streamDistance(n)<.073)return false;
   if(pathDistance(n)<(border?.127:.145))return false;
   if(reserved.some(r=>n.dot(r.n)>r.threshold))return false;
   if(coasterPoints.some(p=>n.distanceTo(p)*R<.16))return false;
   return true;
  }
  function addFlower(base,x,z,h,phase,color){
   const p=new THREE.Vector3(x,h,z),middle=new THREE.Color('#ffd98a'),q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),phase),fm=matrixAt(base,p.toArray(),[1,1,1],q);
   // Petal shapes are broad flat paint flecks, raised above the tips of grass.
   for(let j=0;j<5;j++){
    const a=j*TAU/5,center=new THREE.Vector3(Math.cos(a)*.010,0,Math.sin(a)*.010),side=new THREE.Vector3(-Math.sin(a)*.006,0,Math.cos(a)*.006),tip=new THREE.Vector3(Math.cos(a)*.020,.0025,Math.sin(a)*.020),inner=new THREE.Vector3(0,.003,0);
    const pa=center.clone().add(side).applyMatrix4(fm),pb=tip.applyMatrix4(fm),pc=center.clone().sub(side).applyMatrix4(fm),pd=inner.applyMatrix4(fm),n=pd.clone().normalize();
    batches.flowers.triangle(pa,pb,pc,color,color,color,n,n,n,[.013,.014,.013],phase);batches.flowers.triangle(pa,pc,pd,color,color,middle,n,n,n,[.013,.013,.012],phase);
   }
   leafBlade(batches.grass,base,[x,0,z],phase,h,.009,grassColors[0],grassColors[2],.005,phase,.012);stats.wildflowers++;
  }
  function clump(n,large=false,flowers=false){
   const base=frame(n),phase=rng()*TAU,scale=(large?1.13:.78)+rng()*.45;
   const patch=Math.sin(n.x*9+n.z*3)*Math.cos(n.y*12-n.x*5),colorIndex=patch>.24?2:patch<-.12?0:1,baseColor=grassColors[colorIndex].clone().lerp(grassColors[2],.22),tipColor=grassColors[Math.min(4,colorIndex+2)],count=large?6:5;
   for(let j=0;j<count;j++){
    const slender=(stats.grassBlades%4)!==0,angle=phase+j*2.399,x=Math.cos(angle)*rng()*.037*scale,z=Math.sin(angle)*rng()*.037*scale,h=(.025+rng()*.036)*scale*(slender?1.15:1),width=(slender?.007+rng()*.006:.015+rng()*.013)*scale;
    leafBlade(batches.grass,base,[x,0,z],angle,h,width,baseColor,tipColor,(.026+rng()*.028)*scale,phase+j*.24,.012*scale);stats.grassBlades++;
   }
   if(flowers)for(let j=0;j<2+(large?1:0);j++)addFlower(base,(rng()-.5)*.09,(rng()-.5)*.09,.044+rng()*.022,phase+j,flowerColors[rng()<.88?Math.floor(rng()*3):3+Math.floor(rng()*2)]);
   stats.grassClumps++;
  }
  const meadowDark=new THREE.Color('#477d43'),meadowLight=new THREE.Color('#90b84f');
  function terrainColor(n){const wash=.5+.26*Math.sin(n.x*8+n.z*7)*Math.sin(n.y*11-n.z*4)+.13*Math.sin(n.x*24+n.y*19+n.z*11);return meadowDark.clone().lerp(meadowLight,clamp(wash,.08,.94)).multiplyScalar(.97);}
  function groundPatch(n,radius){
   const base=frame(n,.0018),color=terrainColor(n).lerp(rng()<.52?grassColors[1]:grassColors[3],.20),centre=new THREE.Vector3(0,0,0).applyMatrix4(base),segments=20;
   for(let j=0;j<segments;j++){
    const a=j/segments*TAU,b=(j+1)/segments*TAU,ra=radius*(.89+.09*Math.sin(j*.9)),rb=radius*(.89+.09*Math.sin((j+1)*.9)),na=new THREE.Vector3(Math.cos(a)*ra,0,Math.sin(a)*ra).applyMatrix4(base).normalize(),nb=new THREE.Vector3(Math.cos(b)*rb,0,Math.sin(b)*rb).applyMatrix4(base).normalize();
    // Each edge samples the real terrain; a flat disk would sink into a sphere.
    const pa=na.clone().multiplyScalar(height(na)+.0023),pb=nb.clone().multiplyScalar(height(nb)+.0023);
    if(allowed(na)&&allowed(nb))batches.ground.triangle(centre,pa,pb,color,terrainColor(na),terrainColor(nb),n,na,nb);
   }stats.meadowPatches++;
  }
  // A distributed base carpet uses connected colour patches and six-stroke
  // tufts. Shorter grass retains the park's open sightlines at globe scale.
  for(let i=0,accepted=0;i<11500&&accepted<1800;i++){
   const n=normal(Math.asin(rng()*2-1),(rng()-.5)*TAU);if(!allowed(n))continue;
   const patch=Math.sin(n.x*10+n.z*6)*Math.sin(n.y*11-n.z*4),flowerPatch=patch>.43;
   clump(n,false,flowerPatch&&rng()<.20);if(accepted%9===0)groundPatch(n,.13+rng()*.12);accepted++;
  }
  // Closely-spaced paired verges make the paths legible. Three irregular rows
  // replace the old uniform hedge outline with a soft, hand-painted edge.
  for(const points of pathCurves)for(let i=1;i<points.length-1;i+=3){
   const n=points[i],tangent=points[i+1].clone().sub(points[i-1]).normalize(),side=new THREE.Vector3().crossVectors(n,tangent).normalize();
   for(const sign of [-1,1])for(let row=0;row<3;row++){
    const lateral=sign*(.156+row*.043+(rng()-.5)*.038),candidate=n.clone().multiplyScalar(R).addScaledVector(side,lateral).addScaledVector(tangent,(rng()-.5)*.054).normalize();
    if(!allowed(candidate,true))continue;
    clump(candidate,true,row===2&&i%7===0);if(row===2&&i%9===1)groundPatch(candidate,.14+rng()*.07);
   }
  }
  // The close-up flower lane gets a continuous low meadow behind the verge,
  // not a few evenly spaced spikes on otherwise bare painted ground.
  const flowerLane=normal(.46,-.71),laneRotation=new THREE.Quaternion().setFromUnitVectors(UP,flowerLane),laneCenter=flowerLane.clone().multiplyScalar(R);
  for(let i=0,accepted=0;i<1800&&accepted<310;i++){
   const a=rng()*TAU,r=Math.sqrt(rng())*.70,p=new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r*.68).applyQuaternion(laneRotation).add(laneCenter).normalize();
   if(!allowed(p))continue;clump(p,true,i%5===0);if(accepted%5===0)groundPatch(p,.13+rng()*.09);accepted++;
  }
  // Ground the trunks with tufts instead of isolated sticks on a bare sphere.
  for(const {n,radius} of treeFootprints){
   const mat=frame(n),position=n.clone().multiplyScalar(R);
   for(let j=0;j<6;j++){const a=j*TAU/6,p=new THREE.Vector3(Math.sin(a)*radius,0,Math.cos(a)*radius).transformDirection(mat).multiplyScalar(radius).add(position).normalize();if(allowed(p))clump(p,false,j===2);}
  }
  for(const [key,mat] of [['wood',woodMaterial],['canopy',treeMaterial],['leaves',leafMaterial],['grass',grassMaterial],['flowers',flowerMaterial],['ground',groundMaterial]]){
   const batch=batches[key];if(!batch.positions.length)continue;const geo=batch.geometry(),object=new THREE.Mesh(geo,mat);object.name=`Painted park ${key}`;object.castShadow=key==='wood'||key==='canopy';object.receiveShadow=true;object.userData.dynamic=true;object.userData.noShadow=!object.castShadow;object.userData.painterlyNature=key;paintRoot.add(object);geometries.push(geo);renderMeshes.push(object);stats.drawCalls++;
   // Retain only GPU-ready typed arrays once authoring is complete.
   for(const attribute of ['positions','normals','colors','weights','phases'])batch[attribute].length=0;
  }
  return stats;
 }
 return{root:paintRoot,stats,tree,createMeadows,update(time,env={}){timeUniform.value=time;windUniform.value=env.preview ? .65 : 1;},dispose(){for(const g of geometries)g.dispose();for(const m of materials)m.dispose();gradient.dispose();paintRoot.removeFromParent();}};
}
