import {THREE,R,mesh,tube,seeded} from './core.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {batchScenery} from './optimize.js';
import {createCampCamper} from './camp-camper.js';
import {createCampGathering} from './camp-gathering.js';
import {CAMP,CAMP_NAME,campFrame} from './camp-layout.js';

export function createFestivalCamp({planet,palette,surface}){
 const root=new THREE.Group();root.name=CAMP_NAME;root.userData.campsite=true;planet.add(root);campFrame(surface).decompose(root.position,root.quaternion,root.scale);root.updateMatrix();
 const rng=seeded(21684),m=palette.m,ownMaterials=[],sourceGeometries=new Set(),up=new THREE.Vector3(0,1,0),inverse=root.matrix.clone().invert();
 const rounded=new RoundedBoxGeometry(1,1,1,1,.10),stoneGeo=new THREE.SphereGeometry(1,8,6),sphereGeo=new THREE.SphereGeometry(1,10,7);
 const box=(w,h,d,color,p,turn=0)=>{const o=mesh(root,rounded,m(color),p,[0,turn,0]);o.scale.set(w,h,d);return o;};
 const ball=(s,color,p,geo=sphereGeo)=>{const o=mesh(root,geo,m(color),p);o.scale.set(...s);return o;};
 const pipe=(a,b,r,color)=>tube(root,[a,b],r,m(color),1);
 function groundY(x,z){const n=new THREE.Vector3(x,0,z).applyMatrix4(root.matrix).normalize();return n.multiplyScalar(surface.height(n)+.003).applyMatrix4(inverse).y;}
 const stats={terrace:true,stoneSteps:7,retainingStones:0,grassTufts:0,wildflowers:0,fireflies:14,embers:18,lanterns:5,trees:6};
 // A softly irregular, grass-topped earth terrace joins the spherical terrain.
 const verts=[],colors=[],indices=[],segments=72,rings=15,grassDark=new THREE.Color('#52794a'),grassLight=new THREE.Color('#a4b966'),soil=new THREE.Color('#647d60');
 const outline=a=>{const c=Math.cos(a),s=Math.sin(a),rough=1+.017*Math.sin(a*5)+.014*Math.sin(a*9+.2);return[Math.sign(c)*Math.pow(Math.abs(c),.68)*CAMP.rx*rough,Math.sign(s)*Math.pow(Math.abs(s),.68)*CAMP.rz*rough];};
 for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){
  const f=j/rings,a=i/segments*Math.PI*2,[ex,ez]=outline(a),x=ex*f,z=ez*f,edge=THREE.MathUtils.smoothstep(f,.91,1),y=THREE.MathUtils.lerp(.0,groundY(x,z)-.024,edge),wash=.48+.24*Math.sin(x*7+z*4)*Math.cos(z*6-x*2)+.09*Math.sin(x*23+z*11);
  verts.push(x,y,z);const c=grassDark.clone().lerp(grassLight,wash).lerp(soil,edge*.4);colors.push(c.r,c.g,c.b);
  if(j<rings&&i<segments){const k=j*(segments+1)+i;indices.push(k,k+segments+1,k+1,k+1,k+segments+1,k+segments+2);}
 }
 const groundGeo=new THREE.BufferGeometry();groundGeo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));groundGeo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));groundGeo.setIndex(indices);groundGeo.computeVertexNormals();
 const grassMat=m('#ffffff').clone();grassMat.vertexColors=true;grassMat.side=THREE.DoubleSide;ownMaterials.push(grassMat);
 grassMat.onBeforeCompile=s=>{s.vertexShader='varying vec3 vCampPaint;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCampPaint=position;');s.fragmentShader='varying vec3 vCampPaint;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat brush=sin(vCampPaint.x*73.+sin(vCampPaint.z*57.))*sin(vCampPaint.z*67.); diffuseColor.rgb*=.97+.035*brush;');};grassMat.customProgramCacheKey=()=> 'camp-meadow-paint';
 const ground=mesh(root,groundGeo,grassMat);ground.name='苔石围合的手绘草台';ground.castShadow=false;ground.userData.dynamic=true;
 // Three staggered courses are actual stones, with moss on the top edges.
 for(let row=0;row<3;row++)for(let i=0;i<43;i++){
  const a=(i+(row%2)*.5)/43*Math.PI*2,[x,z]=outline(a),bottom=groundY(x,z),height=-bottom/3+.018,y=bottom+height*(row+.5);
  if(z>.73&&x>-.66&&x<-.12)continue;
  const rock=box(.18+rng()*.032,height,.095,['#7f938b','#94a18d','#758981','#acb39a'][i%4],[x*.96,y,z*.96],-a+Math.PI/2);rock.rotation.z=(rng()-.5)*.08;stats.retainingStones++;
  if(row===2&&i%2===0)ball([.095,.018,.065],i%3?'#617d47':'#819749',[x*.95,-.012,z*.95],stoneGeo);
 }
 for(let i=0;i<7;i++){const z=.75+i*.083,y=-.015-i*.046;box(.43,.073,.13,i%2?'#a8b29f':'#bec3aa',[-.43,y-.038,z]);box(.36,.003,.011,'#77876e',[-.43,y+.001,z-.045]);}
 // An old stepping-stone trail links the entrance, van and meal area.
 const stepping=[[-.44,.55],[-.33,.36],[-.21,.18],[-.20,-.08],[-.19,-.32],[.1,-.51],[.34,-.58],[.62,-.63]];
 for(const [i,[x,z]]of stepping.entries()){const stone=ball([.091,.013,.066],i%3?'#b9bea3':'#cfceb0',[x,.006,z],stoneGeo);stone.rotation.y=i*.9;}
 const camper=createCampCamper({palette});root.add(camper.root);camper.root.position.set(-.53,.008,-.15);camper.root.rotation.y=-.16;
 const gathering=createCampGathering({palette});root.add(gathering.root);gathering.root.position.set(.33,.009,.12);
 // Fence encloses the rear garden, leaving the view and steps unobstructed.
 const fence=[[-1.04,.24],[-1.08,-.08],[-1.07,-.43],[-.96,-.75],[-.60,-.86],[-.23,-.89],[.15,-.89],[.52,-.87],[.86,-.74],[1.07,-.48],[1.12,-.17]];
 for(let i=0;i<fence.length;i++){const[x,z]=fence[i];box(.043,.24,.048,'#917757',[x,.114,z]);box(.055,.023,.06,'#d3ba84',[x,.241,z]);if(i)for(const y of [.09,.18])pipe([fence[i-1][0],y,fence[i-1][1]],[x,y,z],.013,'#b6a275');}
 // A relaxed string of small lanterns follows the back of the clearing.
 const lampMat=new THREE.MeshStandardMaterial({color:'#ffdf92',emissive:'#ffb842',emissiveIntensity:.1,roughness:.6});ownMaterials.push(lampMat);
 for(const[x,z,h]of [[-1.0,.55,.36],[1.04,.42,.40],[-.78,-.72,.87],[.83,-.68,.89],[-.20,1.26,.26]]){
  const y=z>1?groundY(x,z):0;pipe([x,y,z],[x,h+y,z],.008,'#596953');
  const bulb=mesh(root,sphereGeo,lampMat,[x,h+y-.024,z]);bulb.scale.set(.027,.037,.027);
  box(.07,.015,.062,'#615f48',[x,h+y+.009,z]);box(.061,.016,.057,'#806e4a',[x,h+y-.06,z]);
 }
 const cable=[];for(let i=0;i<=18;i++){const u=i/18;cable.push([-.78+1.61*u,.87-.15*Math.sin(Math.PI*u),-.72+.04*u]);}tube(root,cable,.0035,m('#4a5a47'),24);
 for(let i=1;i<12;i++){const u=i/12,x=-.78+1.61*u,y=.87-.15*Math.sin(Math.PI*u),z=-.72+.04*u;pipe([x,y,z],[x,y-.035,z],.0025,'#5b664d');const bulb=mesh(root,sphereGeo,lampMat,[x,y-.045,z]);bulb.scale.set(.014,.020,.014);}
 // Roof luggage is mirrored by small travel cases near the steps.
 for(const [x,z,w,h,d,color]of [[-.16,.66,.22,.16,.14,'#cd7656'],[.075,.72,.16,.11,.13,'#729f9d'],[.31,.72,.20,.14,.15,'#b9a258']]){
  box(w,h,d,color,[x,h/2+.01,z]);for(const side of [-1,1])box(.010,h+.007,d+.008,'#6e6c4b',[x+side*w*.29,h/2+.01,z]);box(w*.30,.013,.02,'#676655',[x,h+.027,z]);
 }
 for(let i=0;i<6;i++){const o=box(.11,.022,.032,'#947454',[-.91+(i%2)*.019,.024+Math.floor(i/2)*.026,.58+(i%2)*.039],.35);}
 // Soft grass strokes and little flowers, with a clear floor under furniture.
 const blades=[],bladeColors=['#718f46','#91a84c','#adbd68','#527641'],tuftGeo=new THREE.BufferGeometry();tuftGeo.setAttribute('position',new THREE.Float32BufferAttribute([-.004,0,0,.004,0,0,.003,.025,.003,0,.052,.012],3));tuftGeo.setIndex([0,2,1,0,3,2]);tuftGeo.computeVertexNormals();
 const tuftMatrix=new THREE.Matrix4(),q=new THREE.Quaternion(),scale=new THREE.Vector3(),p=new THREE.Vector3();
 function openGrass(x,z){return !(x>-.82&&x<-.22&&z>-.73&&z<.46)&&!(Math.hypot(x-.33,z-.12)<.63)&&!(x>.7&&z>-.18&&z<.8)&&!(z>.61&&x>-.3&&x<.47)&&!stepping.some(([a,b])=>Math.hypot(x-a,z-b)<.10);}
 for(let i=0;i<850;i++){const x=(rng()-.5)*2.22,z=(rng()-.5)*1.77;if(!openGrass(x,z))continue;const f=(Math.abs(x)/CAMP.rx)**3+(Math.abs(z)/CAMP.rz)**3;if(f>.83)continue;
  for(let j=0;j<3;j++){q.setFromAxisAngle(up,rng()*Math.PI*2);scale.setScalar(.55+rng()*.58);p.set(x+(rng()-.5)*.025,.004,z+(rng()-.5)*.025);tuftMatrix.compose(p,q,scale);const geo=tuftGeo.clone().applyMatrix4(tuftMatrix),color=new THREE.Color(bladeColors[i%4]),rgb=new Float32Array(12);for(let k=0;k<4;k++){const c=color.clone().multiplyScalar(.82+k*.10);rgb.set([c.r,c.g,c.b],k*3);}geo.setAttribute('color',new THREE.BufferAttribute(rgb,3));blades.push(geo);}stats.grassTufts++;
  if(i%23===0){const flowerColor=i%2?'#f3d3a1':'#bca9d2';for(let j=0;j<5;j++){const a=j*Math.PI*2/5;ball([.009,.004,.007],flowerColor,[x+Math.sin(a)*.011,.047,z+Math.cos(a)*.011]);}ball([.005,.004,.005],'#dbb663',[x,.05,z]);stats.wildflowers++;}
 }
 const bladesMat=m('#ffffff').clone();bladesMat.vertexColors=true;bladesMat.side=THREE.DoubleSide;ownMaterials.push(bladesMat);const grasses=mesh(root,mergeGeometries(blades,false),bladesMat);grasses.name='营地细叶草与野花';grasses.userData.dynamic=true;grasses.castShadow=false;blades.forEach(g=>g.dispose());tuftGeo.dispose();
 // Low stones, a canvas roll, a trail sign and a hanging camp pennant.
 for(const[x,z,s]of [[-1.0,.70,.15],[.92,.72,.12],[1.05,-.59,.11],[-.85,-.74,.13]]){ball([s,s*.54,s*.7],'#95a28e',[x,s*.28,z],stoneGeo);ball([s*.7,.021,s*.52],'#6f8b4b',[x,s*.53,z],stoneGeo);}
 const roll=mesh(root,new THREE.CylinderGeometry(.027,.027,.14,12),m('#7e9a81'),[-.88,.047,.42],[0,0,Math.PI/2]);for(const x of [-.92,-.84])box(.011,.064,.064,'#c5b67d',[x,.047,.42]);
 box(.026,.29,.027,'#957453',[-1.0,.01,1.10]);box(.22,.088,.022,'#ceb688',[-1.0,.15,1.10],-.2);pipe([-1.05,.132,1.115],[-.96,.169,1.098],.005,'#637552');pipe([-1.06,.143,1.115],[-.96,.134,1.096],.005,'#637552');
 // A stone ring and crossed firewood remain visible during the daytime.
 const fireRoot=new THREE.Group();fireRoot.name='晚安篝火';fireRoot.position.set(.33,.016,.12);root.add(fireRoot);
 for(let i=0;i<11;i++){const a=i/11*Math.PI*2;const stone=mesh(fireRoot,stoneGeo,m(i%2?'#8c988a':'#b8baa0'),[Math.sin(a)*.137,.017,Math.cos(a)*.137]);stone.scale.set(.044,.033,.029);stone.rotation.y=a;}
 for(let i=0;i<4;i++){const a=i*Math.PI/2+.2,o=mesh(fireRoot,new THREE.CylinderGeometry(.018,.022,.21,8),m(i%2?'#685144':'#8d6651'),[0,.031+(i%2)*.025,0],[Math.PI/2,0,a]);}
 const coalsMat=new THREE.MeshStandardMaterial({color:'#594031',emissive:'#ff771b',emissiveIntensity:0,roughness:1});ownMaterials.push(coalsMat);
 for(let i=0;i<7;i++){const a=i*2.4,o=mesh(fireRoot,stoneGeo,coalsMat,[Math.sin(a)*.064,.041,Math.cos(a)*.064]);o.scale.set(.028,.01,.023);}
 const flameGroup=new THREE.Group();flameGroup.userData.dynamic=true;flameGroup.name='呼吸的暖金火焰';fireRoot.add(flameGroup);
 const flameMaterials=['#fa8a31','#ffbe47','#fff1a0'].map(color=>{const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.88,depthWrite:false});ownMaterials.push(mat);return mat;});
 const flameProfile=[new THREE.Vector2(0,0),new THREE.Vector2(.042,.028),new THREE.Vector2(.048,.067),new THREE.Vector2(.033,.13),new THREE.Vector2(.020,.205),new THREE.Vector2(0,.30)],flameGeo=new THREE.LatheGeometry(flameProfile,12),flames=[];
 const flameVertices=flameGeo.attributes.position;for(let i=0;i<flameVertices.count;i++){const h=flameVertices.getY(i)/.30;flameVertices.setX(i,flameVertices.getX(i)+Math.sin(h*4.2)*h*.033);flameVertices.setZ(i,flameVertices.getZ(i)+h*h*.017);}flameGeo.computeVertexNormals();
 for(let i=0;i<7;i++){const o=mesh(flameGroup,flameGeo,flameMaterials[i%3],[(i?Math.sin(i*2.4):0)*.045,.045,(i?Math.cos(i*2.4):0)*.038]);o.castShadow=false;const s=i===0?1.12:.57+(i%3)*.17;o.scale.set(s,s,s);flames.push({o,s,phase:i*1.7});}
 const fireLight=new THREE.PointLight('#ffb05c',0,2.45,1.35);fireLight.position.set(.33,.25,.12);root.add(fireLight);
 // A very soft, local sky bounce keeps this southern clearing legible even
 // when the planet's main sun is on the other hemisphere. Neither casts a map.
 const skyBounce=new THREE.PointLight('#b8dedc',.85,3.6,.7);skyBounce.position.set(-.15,1.75,.20);root.add(skyBounce);
 const glowMat=new THREE.ShaderMaterial({uniforms:{strength:{value:0}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float strength; varying vec2 vUv; void main(){float d=length((vUv-.5)*2.);float a=pow(max(0.,1.-d),2.)*.32*strength;gl_FragColor=vec4(1.,.60,.17,a);}',transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,side:THREE.DoubleSide});ownMaterials.push(glowMat);
 const glow=mesh(root,new THREE.PlaneGeometry(2,1.74),glowMat,[.29,.007,.12],[-Math.PI/2,0,0]);glow.userData.dynamic=true;glow.castShadow=false;glow.renderOrder=2;
 const particleGeo=new THREE.BufferGeometry(),particlePositions=new Float32Array((stats.embers+stats.fireflies)*3),particleColors=new Float32Array(particlePositions.length);particleGeo.setAttribute('position',new THREE.BufferAttribute(particlePositions,3).setUsage(THREE.DynamicDrawUsage));particleGeo.setAttribute('color',new THREE.BufferAttribute(particleColors,3).setUsage(THREE.DynamicDrawUsage));
 const particleMat=new THREE.PointsMaterial({size:.016,vertexColors:true,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});ownMaterials.push(particleMat);const particles=new THREE.Points(particleGeo,particleMat);particles.name='篝火余烬与草间萤火';particles.userData.dynamic=true;particles.frustumCulled=false;root.add(particles);
 root.traverse(o=>{if(o.geometry)sourceGeometries.add(o.geometry);});
 // All opaque camp furniture and wall colours share one indexed paint batch.
 // Animals, owned luminous materials, and hand-painted grass keep their owners.
 const sceneryMat=m('#ffffff').clone();sceneryMat.vertexColors=true;ownMaterials.push(sceneryMat);
 root.traverse(o=>{if(!o.isMesh||!o.material?.isMeshToonMaterial||o.material.vertexColors)return;for(let p=o;p&&p!==root;p=p.parent)if(p.userData.dynamic)return;const g=o.geometry.clone(),rgb=new Float32Array(g.attributes.position.count*3),c=o.material.color;for(let i=0;i<rgb.length;i+=3)rgb.set([c.r,c.g,c.b],i);g.setAttribute('color',new THREE.BufferAttribute(rgb,3));o.geometry=g;o.material=sceneryMat;sourceGeometries.add(g);});
 const batching=batchScenery(root);const retained=new Set();root.traverse(o=>{if(o.geometry)retained.add(o.geometry);});for(const g of sourceGeometries)if(!retained.has(g))g.dispose();sourceGeometries.clear();root.userData.dynamic=true;let disposed=false,lastTime=0,night=0;
 function update(time,env={}){
  lastTime=time;night=THREE.MathUtils.smoothstep(Math.max(env.night||0,(env.dusk||0)*.65),.12,.78);camper.update?.(time,env);gathering.update(time,env);
  const pulse=.91+.05*Math.sin(time*5.9)+.03*Math.sin(time*9.7);flameGroup.visible=night>.004;flameGroup.scale.setScalar(.75+night*.25);
  for(const {o,s,phase}of flames){o.scale.set(s*(.91+Math.sin(time*4.3+phase)*.12),s*(.92+Math.sin(time*5.7+phase)*.16),s);o.rotation.z=Math.sin(time*3.7+phase)*.12;o.rotation.x=Math.cos(time*3.1+phase)*.08;}
  fireLight.intensity=1.05*night*pulse;skyBounce.intensity=.85-.53*night;coalsMat.emissiveIntensity=night*2.2;lampMat.emissiveIntensity=.08+night*1.6;glowMat.uniforms.strength.value=night*pulse*.72;glow.visible=night>.004;particleMat.opacity=night*.83;particles.visible=night>.004;
  for(let i=0;i<stats.embers+stats.fireflies;i++){let x,y,z,f;if(i<stats.embers){const u=(time*(.21+(i%3)*.019)+i*.073)%1,a=i*2.399;x=.33+Math.sin(a)*.075+Math.sin(time*.9+i)*u*.08;y=.10+u*.43;z=.12+Math.cos(a)*.055+u*.048;f=(1-u)*.85;}else{const j=i-stats.embers,a=j*2.399;x=Math.sin(a)*.94+Math.sin(time*.36+j)*.045;y=.11+(j%4)*.07+Math.sin(time*.7+j)*.027;z=Math.cos(a)*.72;f=.18+.68*Math.pow(.5+.5*Math.sin(time*1.3+j*1.7),3);}particlePositions.set([x,y,z],i*3);particleColors.set([f,f*.72,f*.25],i*3);}
  particleGeo.attributes.position.needsUpdate=true;particleGeo.attributes.color.needsUpdate=true;
 }
 function getPose(aspect=1){root.updateWorldMatrix(true,false);const fit=Math.max(1,.83/aspect),target=root.localToWorld(new THREE.Vector3(0,.30,.02)),position=root.localToWorld(new THREE.Vector3(1.70*fit,.30+2.36*fit,.02+3.95*fit));return{target,position,up:new THREE.Vector3(0,1,0).transformDirection(root.matrixWorld)};}
 update(0,{night:0});
 return{root,stats,getPose,update,getState:()=>({location:CAMP,stats,batching,time:lastTime,night,fireLit:night>.004,fireIntensity:fireLight.intensity,camper:camper.stats,guests:gathering.getState()}),dispose(){if(disposed)return;disposed=true;camper.dispose();camper.root.removeFromParent();gathering.dispose();gathering.root.removeFromParent();const live=new Set();root.traverse(o=>{if(o.geometry)live.add(o.geometry);});for(const g of live)g.dispose();ownMaterials.forEach(mat=>mat.dispose());root.removeFromParent();}};
}
