import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {HOUSE_SITES,MILL_SITE,pathLat,farmReserved,pondReserved} from './layout.js';
import {windAt} from './nature.js';

const UP=new THREE.Vector3(0,1,0),TAU=Math.PI*2;
const direction=(lat,lon)=>new THREE.Vector3(Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon));
function seeded(seed){let a=seed|0;return()=>{a+=0x6D2B79F5;let v=Math.imul(a^a>>>15,1|a);v^=v+Math.imul(v^v>>>7,61|v);return((v^v>>>14)>>>0)/4294967296;};}

// A cupped cherry petal with a real V-shaped notch. Eleven triangles, no
// transparent billboard: the silhouette survives both close views and dusk.
function cherryPetal(){
  const edge=[[-.10,-.43],[-.36,-.15],[-.43,.12],[-.31,.36],[-.10,.47],[0,.31],[.13,.47],[.35,.29],[.41,.03],[.20,-.33],[0,-.52]];
  const positions=[0,.065,0],colors=[1,.88,.89],indices=[];
  edge.forEach(([x,z],i)=>{positions.push(x,.05+x*x*.29-z*.043,z);const fade=.91+.08*(z+.52);colors.push(1,fade,fade*.985);indices.push(0,i+1,(i+1)%edge.length+1);});
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}

/** A small, reversible spring overlay. It owns no gameplay or navigation state. */
export function createSakuraGarden({planet,height,R,canopy,uniforms,gradientMap}){
  const rng=seeded(0x4b534752),root=new THREE.Group();root.name='Sakura season · hanami and falling blossoms';planet.add(root);
  const ownedGeometry=new Set(),ownedMaterials=new Set(),opaqueParts=[],paperParts=[],poolParts=[];
  const mat=new THREE.MeshToonMaterial({color:'white',vertexColors:true,gradientMap,side:THREE.DoubleSide});
  const paperMat=new THREE.MeshToonMaterial({color:'#fff0d2',vertexColors:true,gradientMap,emissive:'#ffc278',emissiveIntensity:.12});
  const poolMat=new THREE.MeshBasicMaterial({color:'#f9bf81',vertexColors:true,transparent:true,opacity:.025,depthWrite:false,side:THREE.DoubleSide});
  [mat,paperMat,poolMat].forEach(m=>ownedMaterials.add(m));
  const box=new THREE.BoxGeometry(1,1,1),sphere=new THREE.SphereGeometry(1,12,8),cylinder=new THREE.CylinderGeometry(1,1,1,12),torus=new THREE.TorusGeometry(1,.055,4,20);
  const scratch=new THREE.Object3D(),frame=new THREE.Object3D(),matrix=new THREE.Matrix4(),point=new THREE.Vector3();
  const occupied=[...HOUSE_SITES.map(s=>({normal:direction(s.lat,s.lon),radius:.23})),{normal:direction(MILL_SITE.lat,MILL_SITE.lon),radius:.15},...[ [.11,-.34,.13],[.54,-.31,.13],[.16,.55,.15],[.48,-.44,.13],[.61,.30,.12],[.05,-.06,.09] ].map(([a,b,radius])=>({normal:direction(a,b),radius}))];
  function safe(n,margin=0){return height(n)>R+.035&&!farmReserved(n,.016+margin)&&!pondReserved(n,.55)&&!occupied.some(s=>n.distanceTo(s.normal)<s.radius+margin);}
  function surfaceFrame(n,turn=0,lift=0){const f=new THREE.Object3D();f.position.copy(n).multiplyScalar(height(n)+lift);f.quaternion.setFromUnitVectors(UP,n);f.rotateY(turn);f.updateMatrix();return f;}
  function coloredPart(geometry,color,base,position=[0,0,0],scale=[1,1,1],rotation=[0,0,0],bucket=opaqueParts){
    scratch.position.set(...position);scratch.rotation.set(...rotation);scratch.scale.set(...scale);scratch.updateMatrix();
    let g=geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(base.matrix,scratch.matrix));if(g.index){const indexed=g;g=g.toNonIndexed();indexed.dispose();}g.deleteAttribute('uv');
    const p=g.attributes.position,c=new THREE.Color(color),shades=new Float32Array(p.count*3);
    for(let i=0;i<p.count;i++){const wash=.97+.025*Math.sin(p.getX(i)*39+p.getZ(i)*21+p.getY(i)*11);shades[i*3]=c.r*wash;shades[i*3+1]=c.g*wash;shades[i*3+2]=c.b*wash;}
    g.setAttribute('color',new THREE.BufferAttribute(shades,3));bucket.push(g);
  }
  function disc(base,color,p,r,h=.003){coloredPart(cylinder,color,base,p,[r,h,r]);}
  function strand(base,a,b,r,color){const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b);scratch.position.copy(from).add(to).multiplyScalar(.5);scratch.quaternion.setFromUnitVectors(UP,to.sub(from).normalize());scratch.scale.set(r,new THREE.Vector3(...a).distanceTo(new THREE.Vector3(...b)),r);scratch.updateMatrix();const local=new THREE.Object3D();local.matrix.multiplyMatrices(base.matrix,scratch.matrix);coloredPart(cylinder,color,local);}
  function lantern(n,turn=0){
    if(!safe(n))return false;
    const f=surfaceFrame(n,turn,.003);
    coloredPart(box,'#a88472',f,[0,.013,0],[.070,.026,.063]);
    coloredPart(box,'#d7b697',f,[0,.030,0],[.059,.010,.055]);
    coloredPart(sphere,'#fff2d4',f,[0,.073,0],[.029,.040,.028],[0,0,0],paperParts);
    coloredPart(cylinder,'#cda287',f,[0,.114,0],[.024,.008,.024]);
    coloredPart(cylinder,'#9f7f69',f,[0,.122,0],[.012,.009,.012]);
    for(const y of [.049,.061,.074,.086,.098]){const radius=.029*Math.sqrt(Math.max(.1,1-((y-.073)/.04)**2));coloredPart(torus,'#ead3b3',f,[0,y,0],[radius,radius,radius],[-Math.PI/2,0,0]);}
    const pool=new THREE.CircleGeometry(.123,24);coloredPart(pool,'#ffffff',f,[0,.002,0],[1,1,1],[-Math.PI/2,0,0],poolParts);pool.dispose();return true;
  }

  // A hand-built, ground-hugging hanami deck in the strip between the farm and
  // walking ribbon. There are no rails, new tall barriers or path collisions.
  const deckNormal=direction(.562,.068),deck=surfaceFrame(deckNormal,-.035),deckPoints=[];
  for(const x of [-.17,.17])for(const z of [-.048,.048])deckPoints.push(new THREE.Vector3(x,0,z).applyMatrix4(deck.matrix).normalize());
  let decks=0,lanterns=0;
  if(deckPoints.every(n=>safe(n)&&Math.abs(Math.asin(n.y)-pathLat(Math.atan2(n.x,n.z)))>.039)){
    decks=1;
    for(let i=0;i<11;i++){
      const x=(i-5)*.030,n=new THREE.Vector3(x,0,0).applyMatrix4(deck.matrix).normalize(),f=surfaceFrame(n,-.035,.005);
      const bend=.007*Math.sin(i/10*Math.PI);
      coloredPart(box,i%4===0?'#cc9c7e':i%3===0?'#dbb194':'#e1bda0',f,[0,.007+bend,0],[.026,.014,.096]);
      for(let j=0;j<2;j++)coloredPart(box,'#bb9377',f,[(j-.5)*.011,.0145+bend,(i%3-1)*.009],[.0009,.0007,.083]);
    }
    coloredPart(box,'#eedbd3',deck,[-.044,.024,0],[.188,.003,.094]);
    for(let i=0;i<5;i++)coloredPart(box,'#dba6b4',deck,[-.12+i*.038,.026,0],[.006,.001,.094]);
    for(const z of [-.042,.042])coloredPart(box,'#fff2dc',deck,[-.044,.027,z],[.187,.001,.006]);
    coloredPart(sphere,'#dfa6ba',deck,[-.119,.037,.005],[.035,.012,.030]);
    coloredPart(sphere,'#f2ddb8',deck,[.014,.037,-.025],[.030,.010,.022]);
    disc(deck,'#c89876',[.068,.035,.015],.039,.012);disc(deck,'#edd6b4',[.068,.042,.015],.034);
    for(const [x,z] of [[.058,.008],[.083,.025]]){disc(deck,'#fbf1df',[x,.049,z],.010,.011);disc(deck,'#9aa780',[x,.055,z],.007,.001);}
    // Three dango colours and a folded napkin read as a quiet shared tea moment.
    for(let i=0;i<3;i++)coloredPart(sphere,['#c8d4a1','#fff0d5','#e7adc0'][i],deck,[-.049+i*.014,.035,.023],[.008,.007,.008]);
    strand(deck,[-.074,.032,.023],[-.011,.032,.023],.0012,'#b4946b');
    const left=direction(.571,-.052),right=direction(.574,.155);lanterns+=Number(lantern(left,-.2))+Number(lantern(right,.2));
  }
  // Main bay only: the separate fishing bay is on the other side of the globe.
  const shoreSites=[direction(-.095,.074),direction(-.011,.168)];
  shoreSites.forEach((n,i)=>{if(height(n)<R+.11)lanterns+=Number(lantern(n,i*.4));});

  const staticMesh=(parts,material,name,shadow)=>{if(!parts.length)return null;const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());ownedGeometry.add(g);const mesh=new THREE.Mesh(g,material);mesh.name=name;mesh.castShadow=shadow;mesh.receiveShadow=true;root.add(mesh);return mesh;};
  staticMesh(opaqueParts,mat,'Handmade hanami timber, linen and tea',true);
  staticMesh(paperParts,paperMat,'Warm ribbed paper lanterns',false);
  const glow=staticMesh(poolParts,poolMat,'Soft lantern pools',false);if(glow)glow.renderOrder=2;
  for(const g of [box,sphere,cylinder,torus])g.dispose();

  const petalGeometry=cherryPetal();ownedGeometry.add(petalGeometry);
  const petalMat=new THREE.MeshToonMaterial({color:'white',vertexColors:true,gradientMap,side:THREE.DoubleSide,emissive:'#f0c4d5',emissiveIntensity:.025});ownedMaterials.add(petalMat);
  const MAX_FLYING=660,BASE_FLYING=380,MAX_GROUND=570;
  const flying=new THREE.InstancedMesh(petalGeometry,petalMat,MAX_FLYING);flying.name='Cherry petals · continuous windfall';flying.instanceMatrix.setUsage(THREE.DynamicDrawUsage);flying.frustumCulled=false;flying.castShadow=false;flying.receiveShadow=false;root.add(flying);
  const fallen=new THREE.InstancedMesh(petalGeometry,petalMat,MAX_GROUND);fallen.name='Grounded cherry petal drifts';fallen.receiveShadow=true;fallen.castShadow=false;root.add(fallen);
  const palette=['#f4c2d3','#fbe3df','#e6a5bf','#ffe9de','#efb7cb'].map(c=>new THREE.Color(c));
  const sources=[],particles=[];
  if(canopy?.count){
    canopy.updateMatrix();
    for(let i=0;i<canopy.count;i++){canopy.getMatrixAt(i,matrix);matrix.premultiply(canopy.matrix);sources.push(matrix.clone());}
  }
  const tangent=new THREE.Vector3(),normal=new THREE.Vector3(),side=new THREE.Vector3(),windDirection=new THREE.Vector3(),position=new THREE.Vector3();
  // Sources are sampled from the actual crown instance transforms. No global
  // sphere emitter: every falling blossom begins in a tree's painted canopy.
  for(let i=0;i<MAX_FLYING;i++){
    const source=sources.length?sources[Math.floor(rng()*sources.length)]:surfaceFrame(direction(.96,-.73),0,.45).matrix;
    const a=rng()*TAU,r=.25+rng()*.62,y=.12+rng()*.56,start=new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r).applyMatrix4(source),n=start.clone().normalize();
    tangent.crossVectors(Math.abs(n.y)>.92?new THREE.Vector3(1,0,0):UP,n).normalize();side.crossVectors(n,tangent).normalize();
    particles.push({start,n,tangent:tangent.clone(),side:side.clone(),phase:rng(),period:11+rng()*12,size:.021+rng()*.013,turn:rng()*TAU,roll:.7+rng()*.8,drift:.035+rng()*.070});
    flying.setColorAt(i,palette[i%palette.length]);
  }

  let groundCount=0;
  for(let attempt=0;attempt<MAX_GROUND*12&&groundCount<MAX_GROUND;attempt++){
    if(attempt%5===0){const lon=-.30+rng()*.92,lat=pathLat(lon)+(rng()-.5)*.042;normal.copy(direction(lat,lon));}
    else if(sources.length){const source=sources[Math.floor(rng()*sources.length)];position.set((rng()-.5)*1.95,-.12,(rng()-.5)*1.95).applyMatrix4(source);normal.copy(position).normalize();}
    else break;
    if(!safe(normal,.005)||height(normal)<R+.055)continue;
    frame.position.copy(normal).multiplyScalar(height(normal)+.0024);frame.quaternion.setFromUnitVectors(UP,normal);frame.rotateY(rng()*TAU);const scale=.023+rng()*.016;frame.scale.set(scale,scale*.35,scale*(.88+rng()*.25));frame.updateMatrix();fallen.setMatrixAt(groundCount,frame.matrix);fallen.setColorAt(groundCount,palette[(groundCount+2)%palette.length]);groundCount++;
  }
  fallen.count=groundCount;fallen.instanceMatrix.needsUpdate=true;if(groundCount)fallen.instanceColor.needsUpdate=true;fallen.computeBoundingSphere();flying.instanceColor.needsUpdate=true;
  let lastTime=0,wishUntil=-1;
  function update(t,env={}){
    lastTime=t;const rain=THREE.MathUtils.clamp(env.rain||0,0,1),snow=THREE.MathUtils.clamp(env.snow||0,0,1),night=THREE.MathUtils.clamp(env.night||0,0,1);
    const flourish=THREE.MathUtils.smoothstep(wishUntil-t,0,3),weather=(1-rain*.74)*(1-snow*.91)*(1-night*.34),count=Math.round((BASE_FLYING+(MAX_FLYING-BASE_FLYING)*flourish)*weather);
    flying.count=count;fallen.visible=snow<.72;
    paperMat.emissiveIntensity=.10+night*1.25+rain*.25;poolMat.opacity=.018+night*.20+rain*.04;
    const wind=uniforms?.uWind?.value??(.25+(env.wind??.3)*1.3);
    for(let i=0;i<count;i++){
      const p=particles[i],f=(p.phase+t/p.period)%1,windForce=windAt(p.start,t,wind),fall=THREE.MathUtils.smoothstep(f,0,1);
      windDirection.set(.8,.1,.45).addScaledVector(p.n,-(.8*p.n.x+.1*p.n.y+.45*p.n.z)).normalize();
      normal.copy(p.n).addScaledVector(windDirection,f*p.drift*(.62+windForce)*1.7).addScaledVector(p.tangent,Math.sin(f*TAU*1.4+p.turn)*.014*fall).addScaledVector(p.side,Math.sin(t*.63+p.turn)*.008*fall).normalize();
      const ground=Math.max(height(normal),R+.012)+.004,spawn=Math.max(p.start.length(),ground+.07),radius=THREE.MathUtils.lerp(spawn,ground,fall);
      scratch.position.copy(normal).multiplyScalar(radius);scratch.quaternion.setFromUnitVectors(UP,normal);scratch.rotateY(p.turn+t*.72);scratch.rotateX(Math.sin(t*p.roll+p.turn)*.98);scratch.rotateZ(t*.36+p.turn);
      // Ease birth and landing at the tree/ground rather than visibly popping.
      const life=Math.min(THREE.MathUtils.smoothstep(f,0,.08),1-THREE.MathUtils.smoothstep(f,.89,1)),size=p.size*(.25+.75*life);
      scratch.scale.set(size,size,size*1.12);scratch.updateMatrix();flying.setMatrixAt(i,scratch.matrix);
    }
    flying.instanceMatrix.needsUpdate=true;
  }
  update(0,{});
  const stats={decks,lanterns,groundPetals:groundCount,baseFlying:BASE_FLYING,maxFlying:MAX_FLYING,sourceClusters:sources.length,drawCalls:root.children.length,triangles:root.children.reduce((sum,m)=>sum+(m.geometry.index?m.geometry.index.count:m.geometry.attributes.position.count)/3*(m.isInstancedMesh?(m===flying?MAX_FLYING:m.count):1),0)};
  root.userData.sakuraGarden=stats;
  return{root,stats,update,wish(){wishUntil=lastTime+11;},dispose(){root.removeFromParent();flying.dispose();fallen.dispose();ownedGeometry.forEach(g=>g.dispose());ownedMaterials.forEach(m=>m.dispose());}};
}
