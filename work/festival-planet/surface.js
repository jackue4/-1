import {THREE,R,normal} from './core.js';

export const LAGOON={lat:-.20,lon:.37,rx:.372,rz:.56,level:R+.046};
export const promenades=[
 // Ease around the fountain's west shoulder before opening onto the lake.
 // The broad turn gives the offset ribbon room without a pinched inner edge.
 [[.75,.05],[.52,-.09],[.31,0],[.225,.22],[.225,.52],[.27,.88],[.48,1.08]],
 [[.3,-.3],[.13,-.4],[-.09,-.44],[-.36,-.25],[-.615,.12],[-.635,.67],[-.37,1.04],[-.1,1.06]],
 [[.51,1.06],[.61,1.6],[.43,2.19],[.09,2.27],[-.26,2.26],[-.46,2.9]],
 [[.35,-.31],[.50,-.72],[.45,-1.05],[.05,-1.19],[-.35,-1.32],[-.53,-2.02],[-.42,-2.86]],
 [[.65,2.07],[.97,2.46],[1.12,-2.8],[.92,-1.75],[.76,-.62],[.75,.05]],
 [[.03,2.33],[-.37,1.76],[-.65,1.40],[-.86,.46],[-.8,-.69],[-.51,-1.30]]
];
export const stream=[[.71,.34],[.58,.37],[.48,.50],[.39,.48],[.31,.64],[.18,.61],[.10,.57]];
export const gardenPath=[[.40,.30],[.44,.39],[.49,.57],[.57,.66],[.58,.81]];
export const makeSurfaceCurve=coords=>new THREE.CatmullRomCurve3(coords.map(([a,b])=>normal(a,b)),false,'catmullrom',.3);
export const curves=promenades.map(makeSurfaceCurve);
const allPathCurves=[...curves,makeSurfaceCurve(gardenPath)];
const pathSamples=allPathCurves.flatMap(c=>c.getPoints(130).map(v=>v.normalize()));
const streamSamples=makeSurfaceCurve(stream).getPoints(120).map(v=>v.normalize());
export const smoothstep=(a,b,x)=>{const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
export function lagoonMask(n){const lat=Math.asin(THREE.MathUtils.clamp(n.y,-1,1)),lon=Math.atan2(n.x,n.z),dlo=Math.atan2(Math.sin(lon-LAGOON.lon),Math.cos(lon-LAGOON.lon));return Math.hypot((lat-LAGOON.lat)/LAGOON.rx,dlo/LAGOON.rz);}
export function terrainHeight(n){
 const q=lagoonMask(n),base=.014+.005*Math.sin(n.x*13+n.z*6)*Math.sin(n.y*16)+.003*Math.sin(n.z*21+n.x*8);
 // The lagoon is excavated into the globe, so the transparent surface has
 // physical room for fish and pondweed instead of exposing solid green land.
 const bed=.046-.27*(1-smoothstep(.55,1.10,q));
 return R+(q<1.10?Math.min(base,bed):base);
}
function distanceTo(n,samples){let d=Infinity;for(const p of samples){const v=n.distanceToSquared(p);if(v<d)d=v;}return Math.sqrt(d)*R;}
export const pathDistance=n=>distanceTo(n,pathSamples);
export const streamDistance=n=>distanceTo(n,streamSamples);
export const pathHeight=n=>terrainHeight(n)+.012;
export const surface={height:terrainHeight,pathHeight,pathDistance,lagoonMask,streamDistance,curves};

export function createPaintedGround({root,palette}){
 const group=new THREE.Group();group.name='Painted meadow and soft earth trails';group.userData.dynamic=true;root.add(group);
 const geo=new THREE.SphereGeometry(R,176,128),p=geo.attributes.position,colors=new Float32Array(p.count*3),n=new THREE.Vector3();
 const dark=new THREE.Color('#477d43'),light=new THREE.Color('#90b84f'),sand=new THREE.Color('#d8c897'),under=new THREE.Color('#7dae9c'),color=new THREE.Color();
 for(let i=0;i<p.count;i++){
  n.fromBufferAttribute(p,i).normalize();const q=lagoonMask(n),height=terrainHeight(n),wash=.5+.26*Math.sin(n.x*8+n.z*7)*Math.sin(n.y*11-n.z*4)+.13*Math.sin(n.x*24+n.y*19+n.z*11);
  p.setXYZ(i,n.x*height,n.y*height,n.z*height);color.copy(dark).lerp(light,THREE.MathUtils.clamp(wash,.08,.94));
  if(q<1.12)color.copy(sand).lerp(under,1-smoothstep(.62,1.09,q));
  colors.set([color.r,color.g,color.b],i*3);
 }
 geo.setAttribute('color',new THREE.BufferAttribute(colors,3));geo.computeVertexNormals();
 const groundMaterial=palette.m('#ffffff').clone();groundMaterial.vertexColors=true;
 groundMaterial.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 vPaintPosition;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPaintPosition=position;');
  shader.fragmentShader='varying vec3 vPaintPosition;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float brush=sin(vPaintPosition.x*35.+sin(vPaintPosition.y*23.))*sin(vPaintPosition.z*39.+vPaintPosition.x*11.);
   float wash=sin(vPaintPosition.x*8.+vPaintPosition.z*7.)*sin(vPaintPosition.y*12.-vPaintPosition.z*3.);
   diffuseColor.rgb*=.97+brush*.022+wash*.028;`);
 };groundMaterial.customProgramCacheKey=()=> 'festival-meadow-wash-v1';
 const globe=new THREE.Mesh(geo,groundMaterial);globe.name='Excavated painted meadow globe';globe.receiveShadow=true;group.add(globe);
 const roadMaterial=palette.m('#ffffff').clone();roadMaterial.vertexColors=true;
 roadMaterial.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec2 vEarthUV;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvEarthUV=uv;');
  shader.fragmentShader='varying vec2 vEarthUV;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float soil=sin(vEarthUV.x*29.+sin(vEarthUV.y*11.))*sin(vEarthUV.y*26.+vEarthUV.x*7.);
   float softWash=sin(vEarthUV.x*8.+vEarthUV.y*4.);
   diffuseColor.rgb*=.94+soil*.026+softWash*.032;`);
 };roadMaterial.customProgramCacheKey=()=> 'festival-soft-earth-wash-v1';
 const paths=[];
 function ribbon(coords,width=.11,{height=.012,stream=false}={}){
  const curve=typeof coords.getPoint==='function'?coords:makeSurfaceCurve(coords),segments=Math.max(100,coords.length?coords.length*28:160),across=[-1.23,-1,-.76,0,.76,1,1.23],verts=[],rgb=[],indices=[],uv=[];
  const direction=new THREE.Vector3(),tan=new THREE.Vector3(),side=new THREE.Vector3(),position=new THREE.Vector3(),shade=new THREE.Color(),before=new THREE.Vector3(),after=new THREE.Vector3(),beforeT=new THREE.Vector3(),afterT=new THREE.Vector3();
  const earth=new THREE.Color(stream?'#8abbaf':'#d7cba5'),edge=new THREE.Color(stream?'#b4cfab':'#7d9f52'),worn=new THREE.Color(stream?'#c0d6b7':'#c9b68c');
  for(let i=0;i<=segments;i++){
   const t=i/segments;curve.getPoint(t,direction).normalize();curve.getTangent(t,tan);tan.addScaledVector(direction,-tan.dot(direction)).normalize();side.crossVectors(direction,tan).normalize();
   // Tight bends taper naturally: an offset wider than its local turning
   // radius would fold through itself and turn pieces of the footpath inside out.
   const t0=Math.max(0,t-.002),t1=Math.min(1,t+.002);
   curve.getPoint(t0,before).normalize();curve.getPoint(t1,after).normalize();curve.getTangent(t0,beforeT).normalize();curve.getTangent(t1,afterT).normalize();
   const turn=Math.acos(THREE.MathUtils.clamp(beforeT.dot(afterT),-1,1)),radius=turn>.00001?before.distanceTo(after)*R/turn:100;
   const breadth=Math.min(width*(1+.055*Math.sin(t*39)+.035*Math.sin(t*87+.4)),radius*.57);
   for(let k=0;k<across.length;k++){
    const s=across[k];position.copy(direction).multiplyScalar(R).addScaledVector(side,breadth*s).normalize();
    const h=terrainHeight(position)+height-(Math.abs(s)>1?.006:0);position.multiplyScalar(h);verts.push(...position.toArray());uv.push(t*10,(s+1.23)/2.46);
    shade.copy(earth).lerp(worn,.12+.1*Math.sin(t*91+k*.7));if(Math.abs(s)>1)shade.copy(edge);else if(Math.abs(s)>.9)shade.lerp(edge,.30);
    rgb.push(shade.r,shade.g,shade.b);
   }
  }
  for(let i=0;i<segments;i++)for(let k=0;k<across.length-1;k++){const a=i*across.length+k,b=a+1,c=a+across.length,d=c+1;indices.push(a,c,b,b,c,d);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(rgb,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  // Outward orientation is invariant even where longitude crosses the seam.
  const pa=new THREE.Vector3(),pb=new THREE.Vector3(),pc=new THREE.Vector3();pa.fromBufferAttribute(geometry.attributes.position,indices[0]);pb.fromBufferAttribute(geometry.attributes.position,indices[1]);pc.fromBufferAttribute(geometry.attributes.position,indices[2]);
  if(pb.sub(pa).cross(pc.sub(pa)).dot(pa)<0){for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];geometry.setIndex(indices);geometry.computeVertexNormals();}
  const road=new THREE.Mesh(geometry,roadMaterial);road.name=stream?'Painted stream bed':'Walkable painted earth ribbon';road.receiveShadow=true;road.userData.noShadow=true;group.add(road);if(!stream)paths.push(road);return road;
 }
 for(const curve of curves)ribbon(curve,.11);
 ribbon(gardenPath,.058);ribbon(stream,.046,{height:.006,stream:true});
 return{root:group,globe,paths,ribbon,stats:{paths:paths.length,groundTriangles:geo.index.count/3,pathStyle:'ground-conforming earth ribbon',lagoonDepression:.27}};
}
