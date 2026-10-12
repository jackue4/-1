import {THREE,normal,seeded} from './core.js';
import {LAGOON as LAKE} from './surface.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// A small, genuinely transparent pond: the water and its planted bed are
// separate surfaces. All heights are sampled from the same terrain as paths.
const TAU=Math.PI*2,UP=new THREE.Vector3(0,1,0);
const clamp=THREE.MathUtils.clamp;

function diskGeometry(surface,{bed=false,extent=1,rings=24,segments=112}={}){
 const p=[],uv=[],depth=[],idx=[];
 function vertex(x,y){const n=normal(LAKE.lat+y*LAKE.rx,LAKE.lon+x*LAKE.rz),bottom=surface.height(n);p.push(...n.multiplyScalar(bed?bottom+.0025:LAKE.level).toArray());uv.push(x,y);depth.push(LAKE.level-bottom);}
 vertex(0,0);
 for(let j=1;j<=rings;j++)for(let i=0;i<segments;i++){const a=i/segments*TAU,r=j/rings*extent;vertex(Math.cos(a)*r,Math.sin(a)*r);}
 for(let i=0;i<segments;i++)idx.push(0,1+i,1+(i+1)%segments);
 for(let j=0;j<rings-1;j++)for(let i=0;i<segments;i++){const a=1+j*segments+i,b=1+j*segments+(i+1)%segments,d=a+segments,e=b+segments;idx.push(a,d,b,b,d,e);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setAttribute('aDepth',new THREE.Float32BufferAttribute(depth,1));geo.setIndex(idx);geo.computeVertexNormals();geo.computeBoundingSphere();return geo;
}

function gradient(geometry,low,high){
 const a=new THREE.Color(low),b=new THREE.Color(high),c=new THREE.Color(),colors=[],p=geometry.attributes.position;
 geometry.computeBoundingBox();const min=geometry.boundingBox.min.y,range=Math.max(.001,geometry.boundingBox.max.y-min);
 for(let i=0;i<p.count;i++){c.copy(a).lerp(b,clamp((p.getY(i)-min)/range,0,1));colors.push(c.r,c.g,c.b);}
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));return geometry;
}
function paintedGeometry(p,idx,col){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();return g;}

function plantGeometry(broad=false){
 const p=[],idx=[],col=[],rng=seeded(broad?825:619),base=new THREE.Color(broad?'#397d75':'#427966'),tip=new THREE.Color(broad?'#a3cda1':'#b5d99b'),c=new THREE.Color();
 for(let blade=0;blade<(broad?4:7);blade++){
  const a=blade*2.399,h=.57+rng()*.43,w=broad?.076+rng()*.019:.020+rng()*.018,bend=.14+rng()*.17,off=p.length/3;
  for(let j=0;j<=7;j++){const t=j/7,width=w*Math.sin(Math.PI*Math.pow(t,.78))+.001*(1-t),sweep=bend*t*t;
   for(const side of[-1,1]){const x=side*width,z=sweep+.019*Math.sin(t*7+a)*t;p.push(Math.cos(a)*x+Math.sin(a)*z,t*h,-Math.sin(a)*x+Math.cos(a)*z);c.copy(base).lerp(tip,t*.9);col.push(c.r,c.g,c.b);}
   if(j<7){const k=off+j*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}
  }
 }
 return paintedGeometry(p,idx,col);
}

function coralGeometry(){
 const p=[],idx=[],col=[],base=new THREE.Color('#8e85ad'),tip=new THREE.Color('#e7b9d2'),c=new THREE.Color();
 for(let level=0;level<3;level++){
  const off=p.length/3,rad=.43-level*.08;
  for(let ring=0;ring<=3;ring++)for(let j=0;j<18;j++){const a=j/18*TAU,r=rad*ring/3*(1+.07*Math.sin(a*6+level));p.push(Math.cos(a)*r+level*.033,level*.15+.02+Math.pow(r/rad,2)*.075,Math.sin(a)*r);c.copy(base).lerp(tip,ring*.17+level*.19);col.push(c.r,c.g,c.b);}
  for(let ring=0;ring<3;ring++)for(let j=0;j<18;j++){const k=off+ring*18+j,n=off+ring*18+(j+1)%18;idx.push(k,n,k+18,n,n+18,k+18);}
 }
 return paintedGeometry(p,idx,col);
}

function shellGeometry(){
 const p=[0,.018,-.21],idx=[],col=[],a=new THREE.Color('#d9b897'),b=new THREE.Color('#fff3dc'),c=new THREE.Color();col.push(a.r,a.g,a.b);
 for(let j=0;j<=18;j++){const angle=-Math.PI*.66+j/18*Math.PI*1.32,r=.42*(1+.045*Math.cos(j*Math.PI));p.push(Math.sin(angle)*r,.075*(1-Math.abs(j-9)/10)+(j%2?.013:0),Math.cos(angle)*r-.21);c.copy(a).lerp(b,j%2?.82:.51);col.push(c.r,c.g,c.b);if(j<18)idx.push(0,j+1,j+2);}
 return paintedGeometry(p,idx,col);
}

function fishGeometry(){
 const pieces=[],body=gradient(new THREE.SphereGeometry(1,12,8),'#f2c87d','#fff5cf');body.scale(.91,.32,.28);pieces.push(body);
 for(const side of[-1,1]){const eye=gradient(new THREE.SphereGeometry(.061,8,5),'#284b50','#284b50');eye.translate(.58,.065,side*.236);pieces.push(eye);const highlight=gradient(new THREE.SphereGeometry(.019,5,3),'#fff8db','#fff8db');highlight.translate(.606,.087,side*.285);pieces.push(highlight);}
 const result=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());return result;
}
function finGeometry(){
 const p=[-.70,0,0,-1.33,.38,0,-1.11,0,.03,-1.33,-.38,0,-.30,.26,0,-.49,.53,0,.35,.27,0,.0,0,.19,-.30,-.19,.49,.34,-.025,.19,.0,0,-.19,-.30,-.19,-.49,.34,-.025,-.19],idx=[0,1,2,0,2,3,4,5,6,7,8,9,10,12,11],col=[];
 for(let i=0;i<p.length/3;i++){const c=new THREE.Color(i<4?'#f2d99b':'#e9eac0');col.push(c.r,c.g,c.b);}return paintedGeometry(p,idx,col);
}

export function createFestivalLagoon({root:parent,palette,surface}){
 const root=new THREE.Group();root.name='Glasswater lagoon · living painted pond';root.userData.dynamic=true;parent.add(root);
 const rng=seeded(549028),clock={value:0},light={value:1},dusk={value:0},sun={value:new THREE.Vector3(-.4,.8,.6).normalize()};
 const batches=[],ownedMaterials=[],planted=[],positions=[],dummy=new THREE.Object3D(),matrix=new THREE.Matrix4();
 const uniforms={uTime:clock,uDay:light,uDusk:dusk,uSun:sun};

 const bedMaterial=new THREE.ShaderMaterial({uniforms,vertexShader:`
  attribute float aDepth;varying vec2 vUV;varying float vDepth;varying vec3 vN;
  void main(){vUV=uv;vDepth=aDepth;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
 `,fragmentShader:`
  uniform float uTime;uniform float uDay;uniform float uDusk;uniform vec3 uSun;varying vec2 vUV;varying float vDepth;varying vec3 vN;
  float ridge(float x){return pow(1.-abs(sin(x)),16.);}
  void main(){
   float pool=smoothstep(.035,.245,vDepth),wave=sin(vUV.x*17.+sin(vUV.y*12.))*sin(vUV.y*15.-vUV.x*3.);
   vec3 sand=mix(vec3(.42,.39,.23),vec3(.05,.20,.16),pool);
   sand*=.98+.026*wave;
   float contour=sin(vUV.y*113.+sin(vUV.x*23.)*1.4+sin(vUV.x*4.)*8.);
   sand+=vec3(.026,.019,.006)*smoothstep(.92,.998,contour)*(1.-pool*.72);
   float c1=ridge(vUV.x*28.+sin(vUV.y*22.+uTime*.34)*1.15+uTime*.21);
   float c2=ridge(vUV.y*25.+sin(vUV.x*19.-uTime*.27)*1.2-uTime*.18);
   float caustic=clamp(c1+c2,0.,1.)*smoothstep(.019,.07,vDepth);
   sand+=vec3(.060,.080,.045)*caustic*(.32+.68*uDay);
   float shade=smoothstep(-.4,.9,dot(normalize(vN),uSun));sand*=.73+shade*.27;
   sand=mix(sand*vec3(.26,.43,.57),sand,uDay);sand=mix(sand,sand*vec3(1.11,.96,.84),uDusk*.38);
   gl_FragColor=vec4(sand,1.);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }
 `});ownedMaterials.push(bedMaterial);
 const bed=new THREE.Mesh(diskGeometry(surface,{bed:true,extent:1.095,rings:32}),bedMaterial);bed.name='Visible sand bed with slow sunlight caustics';bed.userData.noShadow=true;root.add(bed);

 const waterMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.FrontSide,uniforms,vertexShader:`
  attribute float aDepth;uniform float uTime;varying vec2 vUV;varying float vDepth;varying vec3 vN;varying vec3 vWorld;
  void main(){
   vUV=uv;vDepth=aDepth;vec3 n=normalize(position);float q=length(uv);
   float ripple=(sin(uv.x*27.+uv.y*17.-uTime*.68)*.0014+sin(uv.y*39.-uv.x*9.+uTime*.49)*.0007)*(1.-smoothstep(.90,1.,q));
   vec4 world=modelMatrix*vec4(position+n*ripple,1.);vWorld=world.xyz;vN=normalize(mat3(modelMatrix)*n);gl_Position=projectionMatrix*viewMatrix*world;
  }
 `,fragmentShader:`
  uniform float uTime;uniform float uDay;uniform float uDusk;uniform vec3 uSun;varying vec2 vUV;varying float vDepth;varying vec3 vN;varying vec3 vWorld;
  void main(){
   float depth=max(0.,vDepth),q=length(vUV);vec3 N=normalize(vN),V=normalize(cameraPosition-vWorld);
   float fresnel=pow(1.-max(0.,dot(N,V)),3.5);
   vec3 color=mix(vec3(.05,.42,.33),vec3(.015,.22,.25),smoothstep(.02,.28,depth));
   float brush=sin(vUV.x*8.+sin(vUV.y*5.))*sin(vUV.y*9.);color*=.99+brush*.025;
   color=mix(color*vec3(.28,.44,.61),color,uDay);color=mix(color,color*vec3(1.13,.95,.84),uDusk*.4);
   color=mix(color,vec3(.28,.55,.48)*(.30+.70*uDay),fresnel*.26);
   float wave=sin(vUV.y*88.+sin(vUV.x*38.+uTime*.19)*1.35-uTime*.87);
   float broken=smoothstep(.57,.95,sin(vUV.x*63.+vUV.y*20.));
   float glimmer=smoothstep(.985,.999,wave)*broken;
   vec3 H=normalize(V+uSun);float shine=pow(max(0.,dot(N,H)),48.);
   color+=vec3(.31,.39,.30)*glimmer*(.32+.68*uDay)+vec3(.42,.32,.15)*shine*.14;
   float edge=q+.004*sin(vUV.x*49.+vUV.y*35.+uTime*.7);
   float shoreLine=smoothstep(.976,.986,edge)*(1.-smoothstep(.991,1.,edge));
   shoreLine*=.45+.55*smoothstep(-.5,.7,sin(vUV.x*32.+vUV.y*47.));
   float tinyRing=smoothstep(.91,.94,edge)*(1.-smoothstep(.944,.953,edge))*.13;
   color=mix(color,vec3(.86,.93,.79)*(.33+.67*uDay),shoreLine*.76+tinyRing);
   float alpha=.24+.12*smoothstep(.025,.27,depth)+fresnel*.21+shoreLine*.24+glimmer*.08;
   alpha*=smoothstep(-.005,.012,vDepth);gl_FragColor=vec4(color,clamp(alpha,0.,.70));
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }
 `});ownedMaterials.push(waterMaterial);
 const water=new THREE.Mesh(diskGeometry(surface),waterMaterial);water.name='Transparent turquoise water · delicate broken foam';water.renderOrder=10;water.userData.noShadow=true;root.add(water);

 function material(sway=false){
  const mat=palette.m('#ffffff').clone();mat.vertexColors=true;mat.side=THREE.DoubleSide;mat.emissive.set('#0e2724');mat.emissiveIntensity=.10;
  mat.onBeforeCompile=shader=>{shader.uniforms.uLagoonTime=clock;shader.vertexShader='uniform float uLagoonTime;\n'+shader.vertexShader;if(sway)shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   float bend=position.y*position.y;float phase=dot(instanceMatrix[3].xyz,vec3(5.1,2.3,7.8));
   transformed.x+=sin(uLagoonTime*.7+phase+position.y*2.)*.062*bend;transformed.z+=cos(uLagoonTime*.53+phase)*.035*bend;`);};
  mat.customProgramCacheKey=()=>sway?'festival-pondweed-v1':'festival-pond-paint-v1';ownedMaterials.push(mat);return mat;
 }
 function batch(name,geometry,items,sway=false){
  const mesh=new THREE.InstancedMesh(geometry,material(sway),Math.max(1,items.length));mesh.count=items.length;mesh.name=name;mesh.castShadow=false;mesh.receiveShadow=true;mesh.userData.noShadow=true;
  items.forEach((item,i)=>{mesh.setMatrixAt(i,item.matrix);mesh.setColorAt(i,item.color||new THREE.Color('white'));});mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();if(mesh.boundingSphere)mesh.boundingSphere.radius+=.05;root.add(mesh);batches.push(mesh);return mesh;
 }
 const groups={grass:[],pondweed:[],stones:[],coral:[],shells:[]};
 function plant(kind,x,y,requested,azimuth,tint='white'){
  const n=normal(LAKE.lat+y*LAKE.rx,LAKE.lon+x*LAKE.rz),bed=surface.height(n),depth=LAKE.level-bed,maxHeight={grass:1.075,pondweed:1.075,stones:.57,coral:.40,shells:.115}[kind];
  const scale=Math.min(requested,(depth-.028)/maxHeight);if(scale<.018)return;
  dummy.position.copy(n).multiplyScalar(bed+.005);dummy.quaternion.setFromUnitVectors(UP,n);dummy.rotateY(azimuth);dummy.scale.setScalar(scale);dummy.updateMatrix();groups[kind].push({matrix:dummy.matrix.clone(),color:new THREE.Color(tint)});planted.push({kind,bed,top:bed+.005+maxHeight*scale});
 }
 // Patches form submerged gardens around open, readable sand corridors. The
 // tallest plants sit in deep water; none can poke through the water skin.
 const gardens=[[-.57,-.20],[-.48,.37],[.48,.45],[.54,-.30],[.04,-.58],[-.1,.62],[.06,.12]];
 for(let i=0;i<gardens.length;i++){
  const [cx,cy]=gardens[i];
  for(let j=0;j<12;j++){const a=j*2.399,r=.04+Math.sqrt(rng())*.09,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;plant(j%3===0?'pondweed':'grass',x,y,.09+rng()*.115,rng()*TAU,['#f2f2d8','#ddedc8','#c8e2c5'][j%3]);}
  for(let j=0;j<4;j++){const a=j*1.61+i;plant('stones',cx+Math.cos(a)*.11,cy+Math.sin(a)*.09,.08+rng()*.045,rng()*TAU,j%2?'#f0dbc0':'#bdc7b9');}
  if(i%2===0){plant('coral',cx+.095,cy-.022,.18,rng()*TAU);plant('coral',cx+.074,cy+.055,.12,rng()*TAU,'#f1d9b6');}
 }
 for(let i=0;i<31;i++){const a=rng()*TAU,r=.34+Math.sqrt(rng())*.51;plant('shells',Math.cos(a)*r,Math.sin(a)*r,.034+rng()*.028,rng()*TAU,i%3===0?'#ead7ec':'white');}
 const stone=gradient(new THREE.SphereGeometry(1,10,7),'#718d86','#c4cfb3');stone.scale(.70,.36,.52);stone.translate(0,.19,0);
 batch('Swaying ribbon seagrass',plantGeometry(),groups.grass,true);batch('Broad painted pondweed',plantGeometry(true),groups.pondweed,true);batch('Rounded underwater stones',stone,groups.stones);batch('Little lavender coral shelves',coralGeometry(),groups.coral);batch('Pearl shells in the visible sand',shellGeometry(),groups.shells);

 const schoolSpecs=[[-.19,.24,.16,.15],[-.02,-.35,.25,.13],[.34,.05,.17,.20],[-.41,-.12,.12,.13]],fish=[];
 for(let school=0;school<schoolSpecs.length;school++)for(let j=0;j<12;j++)fish.push({school,phase:j*.39+school*1.7,spread:.4+rng()*.55,scale:.030+rng()*.014,speed:.11+school*.013,color:new THREE.Color(['#fff9da','#ffe0b9','#c7e6ee','#f6d0d4'][school])});
 const placeholders=fish.map(f=>({matrix:new THREE.Matrix4(),color:f.color}));
 const bodies=batch('Four schools of curious pastel fish',fishGeometry(),placeholders),fins=batch('Fish fluttering tails and fins',finGeometry(),placeholders);bodies.frustumCulled=fins.frustumCulled=false;bodies.receiveShadow=fins.receiveShadow=false;
 const n=new THREE.Vector3(),next=new THREE.Vector3(),forward=new THREE.Vector3(),up=new THREE.Vector3(),side=new THREE.Vector3();
 fish.forEach(()=>positions.push(new THREE.Vector3()));
 function sampleFish(f,time,out){
  const [cx,cy,rx,ry]=schoolSpecs[f.school],t=time*f.speed+f.phase,x=cx+Math.cos(t)*rx*f.spread,y=cy+Math.sin(t*.91)*ry*f.spread;
  n.copy(normal(LAKE.lat+y*LAKE.rx,LAKE.lon+x*LAKE.rz));const bed=surface.height(n),depth=LAKE.level-bed;
  const radius=bed+clamp(depth*.57+.017*Math.sin(t*.8+f.phase),.058,Math.max(.058,depth-.052));return out.copy(n).multiplyScalar(radius);
 }
 let minSeabedClearance=1,minSurfaceClearance=1;
 function update(time,env={}){
  clock.value=Number.isFinite(time)?time:0;light.value=env.daylight??1;dusk.value=env.dusk??0;minSeabedClearance=1;minSurfaceClearance=1;
  for(let i=0;i<fish.length;i++){
   const f=fish[i],p=sampleFish(f,clock.value,positions[i]);sampleFish(f,clock.value+.045,next);up.copy(p).normalize();forward.subVectors(next,p);forward.addScaledVector(up,-forward.dot(up)).normalize();side.crossVectors(forward,up).normalize();up.crossVectors(side,forward).normalize();matrix.makeBasis(forward,up,side);
   dummy.position.copy(p);dummy.quaternion.setFromRotationMatrix(matrix);dummy.scale.setScalar(f.scale);dummy.updateMatrix();bodies.setMatrixAt(i,dummy.matrix);dummy.rotateY(Math.sin(clock.value*6+f.phase)*.19);dummy.updateMatrix();fins.setMatrixAt(i,dummy.matrix);
   const radius=p.length();minSeabedClearance=Math.min(minSeabedClearance,radius-surface.height(n.copy(p).normalize())-f.scale*.55);minSurfaceClearance=Math.min(minSurfaceClearance,LAKE.level-radius-f.scale*.55);
  }
  bodies.instanceMatrix.needsUpdate=true;fins.instanceMatrix.needsUpdate=true;
 }
 update(0,{daylight:1});
 const stats={transparent:true,waterRadius:LAKE.level,shallowOpacity:.24,deepOpacity:.36,seagrass:groups.grass.length,pondweed:groups.pondweed.length,underwaterStones:groups.stones.length,coral:groups.coral.length,shells:groups.shells.length,fish:fish.length,schools:schoolSpecs.length,drawCalls:batches.length+2};
 root.userData.planting=planted;root.userData.fishPositions=positions;root.userData.sampleFish=(index,time)=>sampleFish(fish[index],time,new THREE.Vector3());
 return{root,stats,update,getState:()=>({...stats,time:clock.value,minSeabedClearance,minSurfaceClearance}),dispose(){root.removeFromParent();bed.geometry.dispose();water.geometry.dispose();for(const mesh of batches){mesh.dispose();mesh.geometry.dispose();}ownedMaterials.forEach(m=>m.dispose());}};
}
