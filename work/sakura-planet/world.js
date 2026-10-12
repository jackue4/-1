import {createSakuraGarden} from './sakura-garden.js';
import {createFishingBay} from './fishing.js';
import {createOrganicCluster,createClusterLayout,createPaintedTrunk,createTreeCrownMaterial} from './tree-asset.js';
import * as THREE from 'three';
import {createSurfaceNavigation,circleObstacle,boxObstacle} from './surface-navigation.js';
import {createPaintedLightRamp} from './painted-style.js';
import {paintGround,createMeadowPollen} from './painterly-environment.js';
import {createCozyYard} from './cozy-yard.js';
import {createPathLights} from './path-lights.js';
import {createResidentHomes} from './resident-homes.js';
import {HOUSE_SITES,MILL_SITE,POND_SITE,pathLat,farmReserved,pondReserved} from './layout.js';
import {createFarmScene} from './farm-scene.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createVillager, VILLAGERS } from './villagers.js';
import { createBuildScene } from './build-scene.js';
import { createCottage } from './cottages.js';
import {createVegetationRamp,createCanopyLeaves,createSoftLeaf} from './vegetation.js';
import { createMarine } from './marine.js';
import { createIslandLife,palmFronds } from './island-life.js';
import { BUILD_DURATION } from './construction.js';
import { createLandscape } from './landscape.js';
import { random, hash } from './ecology.js';
import { createNatureUniforms, enhanceWater, enhanceFoam, createMeadow, windAt, sampleWater, enhanceFoliage,enhanceCaustics } from './nature.js';

export const R = 2.45;
export const UP = new THREE.Vector3(0, 1, 0);
export function direction(lat, lon) { return new THREE.Vector3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)); }
const lakes = [direction(-.32, .72), direction(-.45, -2.1), direction(-.8, 2.7)];
export function terrainHeight(n) {
  const hills = .023 * Math.sin(n.x * 9 + n.z * 3) * Math.cos(n.y * 11 - n.z * 4) + .014 * Math.sin(n.z * 17 + n.x * 8);
  let h = R + .145 + hills;
  for (let i = 0; i < lakes.length; i++) { const d = n.distanceTo(lakes[i]); h -= .37 * Math.exp(-Math.pow(d / [ .57, .43, .47 ][i], 4)); }
  // A gently raised garden shelf keeps the expanded eastern beds above the tide.
  const edge=Math.max(Math.abs(Math.asin(n.y)-.31)-.22,Math.abs(Math.atan2(n.x,n.z)-.08)-.36);
  const gardenBlend=1-THREE.MathUtils.smoothstep(edge,0,.11);
  h=THREE.MathUtils.lerp(h,Math.max(h,R+.125),gardenBlend);
  const pondDistance=Math.hypot((Math.asin(n.y)-POND_SITE.lat)/.105,(Math.atan2(n.x,n.z)-POND_SITE.lon)/.125);
  h-=.13*Math.exp(-Math.pow(pondDistance,4));
  return h;
}
export function createWorld(savedGrowth = 0, initialConstruction = BUILD_DURATION) {
  const natureUniforms=createNatureUniforms();
  const rng = random(hash('little-bloom-landscape-v2')), planet = new THREE.Group();
  const materials = new Map(), sphere = new THREE.SphereGeometry(1, 12, 8), ico = new THREE.IcosahedronGeometry(1, 2), box = new THREE.BoxGeometry(1, 1, 1), cyl = new THREE.CylinderGeometry(1, 1, 1, 12), cone = new THREE.ConeGeometry(1, 1, 9);
  const gradientMap = createPaintedLightRamp();
  const vegetationRamp=createVegetationRamp();
  const foliage = [], clouds = [], residents = [], birds = [], butterflies = [], glowMaterials = [], lakeRipples = [], growthPlants = [], snowCaps = [];
  const stats = { trees: 0, flowers: 0, residents: VILLAGERS.length, shrubs: 0 };
  const m = color => { if (!materials.has(color)) materials.set(color, new THREE.MeshToonMaterial({ color, gradientMap })); return materials.get(color); };
  function mesh(parent, geo, color, position = [0, 0, 0], scale = [1, 1, 1], shadow = true) { const o = new THREE.Mesh(geo, typeof color === 'object' ? color : m(color)); o.position.set(...position); o.scale.set(...scale); o.castShadow = shadow; o.receiveShadow = true; parent.add(o); return o; }
  function anchor(n, elevation = 0) { const g = new THREE.Group(); g.position.copy(n).multiplyScalar(terrainHeight(n) + elevation); g.quaternion.setFromUnitVectors(UP, n); planet.add(g); return g; }
  function moveOnSurface(g, n, lift = 0) { g.position.copy(n).multiplyScalar(terrainHeight(n) + lift); g.quaternion.setFromUnitVectors(UP, n); }
  function stem(parent, a, b, width, color) { const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), o = mesh(parent, cyl, color); o.position.copy(start).add(end).multiplyScalar(.5); o.scale.set(width, start.distanceTo(end), width); o.quaternion.setFromUnitVectors(UP, end.sub(start).normalize()); return o; }

  // One continuous globe with shallow basins. Vertex colors mark sand, meadows and hills.
  const geo = new THREE.SphereGeometry(1, 128, 80), pos = geo.attributes.position, colors = [], n = new THREE.Vector3();
  const sand = new THREE.Color('#e7d1bc'), low = new THREE.Color('#a7b786'), high = new THREE.Color('#819e75');
  for (let i = 0; i < pos.count; i++) { n.fromBufferAttribute(pos, i).normalize(); const h = terrainHeight(n); pos.setXYZ(i, n.x * h, n.y * h, n.z * h); const c = h < R + .108 ? sand.clone().lerp(low,THREE.MathUtils.smoothstep(h,R+.063,R+.108)) : low.clone().lerp(high,THREE.MathUtils.smoothstep(h,R+.115,R+.18)); colors.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); geo.computeVertexNormals();
  const snowUniform = { value: 0 };
  const landMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap });
  paintGround(landMat,snowUniform,R);
  enhanceCaustics(landMat,natureUniforms,R);
  const land = mesh(planet, geo, landMat);
  const waterMat = new THREE.MeshToonMaterial({ color:'#ffffff',vertexColors:true,gradientMap });
  enhanceWater(waterMat,natureUniforms);
  const waterGeo=new THREE.SphereGeometry(R,128,80),waterPos=waterGeo.attributes.position,waterColors=[],depths=[];
  const shallow=new THREE.Color('#92c9c6'),deep=new THREE.Color('#648fac');
  for(let i=0;i<waterPos.count;i++){n.fromBufferAttribute(waterPos,i).normalize();const depth=Math.max(0,R-terrainHeight(n));depths.push(depth);const c=shallow.clone().lerp(deep,THREE.MathUtils.smoothstep(depth,.01,.24));waterColors.push(c.r,c.g,c.b);}
  waterGeo.setAttribute('color',new THREE.Float32BufferAttribute(waterColors,3));waterGeo.setAttribute('seaDepth',new THREE.Float32BufferAttribute(depths,1));
  const ocean=mesh(planet,waterGeo,waterMat,[0,0,0],[1,1,1],false);
  ocean.renderOrder=1;
  // Shorelines are sampled from the actual terrain, so the surf follows every bay.
  const surf=[],shoreFrames=[];
  lakes.forEach((center,index)=>{const x=new THREE.Vector3().crossVectors(UP,center).normalize(),z=new THREE.Vector3().crossVectors(center,x).normalize();const samples=[];
    for(let j=0;j<=160;j++){const angle=j/160*Math.PI*2,tangent=x.clone().multiplyScalar(Math.cos(angle)).addScaledVector(z,Math.sin(angle));let lo=0,hi=1.05;for(let k=0;k<18;k++){const r=(lo+hi)/2,nn=center.clone().multiplyScalar(Math.cos(r)).addScaledVector(tangent,Math.sin(r));if(terrainHeight(nn)<R)lo=r;else hi=r;}samples.push({tangent,r:(lo+hi)/2});}
    samples.forEach(sample=>{const nn=center.clone().multiplyScalar(Math.cos(sample.r-.025)).addScaledVector(sample.tangent,Math.sin(sample.r-.025));sample.depthSlope=Math.max(0,R-terrainHeight(nn))/.025;});
    shoreFrames.push({center,x,z,samples});
    for(let band=0;band<3;band++){const g=new THREE.BufferGeometry(),positions=new Float32Array(161*2*3),uv=[],indices=[];for(let j=0;j<=160;j++)uv.push(j/160,0,j/160,1);for(let j=0;j<160;j++){const a=j*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}g.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);const material=new THREE.MeshBasicMaterial({color:'#f3ffff',transparent:true,opacity:.5,side:THREE.DoubleSide,depthWrite:false});enhanceFoam(material,natureUniforms);const wave=mesh(planet,g,material,[0,0,0],[1,1,1],false);wave.frustumCulled=false;surf.push({wave,positions,center,samples,band});}
  });

  // Fine atmosphere rim, visible only at grazing angles.
  const airMat = new THREE.ShaderMaterial({ uniforms: { tint: { value: new THREE.Color('#b9daba') }, strength: { value: .12 } }, vertexShader: 'varying vec3 N; varying vec3 V; void main(){vec4 p=modelViewMatrix*vec4(position,1.);N=normalize(normalMatrix*normal);V=normalize(-p.xyz);gl_Position=projectionMatrix*p;}', fragmentShader: 'varying vec3 N; varying vec3 V; uniform vec3 tint; uniform float strength; void main(){float a=pow(1.-abs(dot(normalize(N),normalize(V))),3.)*strength;gl_FragColor=vec4(tint,a);}', transparent: true, depthWrite: false, side: THREE.BackSide });
  mesh(planet, new THREE.SphereGeometry(R + .14, 64, 48), airMat, [0, 0, 0], [1, 1, 1], false);

  const solidObstacles=[];
  const crownMatrices=[],crownColors=[],treeTrunkGeo=createPaintedTrunk();
  const barkMaterials=[new THREE.MeshToonMaterial({color:'#907880',vertexColors:true,gradientMap:vegetationRamp}),new THREE.MeshToonMaterial({color:'#715e69',vertexColors:true,gradientMap:vegetationRamp})];
  function tree(normal,size,pink=true){
    const root=anchor(normal),g=new THREE.Group();root.add(g);g.scale.set(size,size*.98,size);stats.trees++;solidObstacles.push(circleObstacle(normal,.070,'tree'));
    mesh(g,treeTrunkGeo,barkMaterials[stats.trees%3?0:1]);
    root.updateMatrix();g.updateMatrix();const base=new THREE.Matrix4().multiplyMatrices(root.matrix,g.matrix);
    for(const cluster of createClusterLayout(730+stats.trees*137,true)){crownMatrices.push(new THREE.Matrix4().multiplyMatrices(base,cluster.matrix));crownColors.push(cluster.color);}
    // Preserve the landscape random sequence while the asset uses its own seed.
    for(let j=0;j<7;j++)rng();
    const cap=mesh(g,sphere,'#f4f1df',[0,.895,0],[.17,.028,.16],false);cap.visible=false;snowCaps.push(cap);return root;
  }
  const houseSites = HOUSE_SITES;
  // A composed spring grove frames the open center; trunks stay clear of paths.
  const springSites=[[.04,-.37],[-.14,-.24],[-.28,-.52],[.09,-.85],[.48,-.86],[.99,-.15],[.86,.24],[.54,.51],[-.65,-.36],[-.99,.20]];
  for(let i=0;i<springSites.length;i++){const [lat,lon]=springSites[i],nn=direction(lat,lon);if(terrainHeight(nn)>R+.04&&!farmReserved(nn,.014)&&!pondReserved(nn,.18)&&Math.abs(lat-pathLat(lon))>.066&&!houseSites.some(h=>nn.distanceTo(direction(h.lat,h.lon))<.22))tree(nn,.68+(i%3)*.08);}
  for(let i=0;i<500&&stats.trees<10;i++){const nn=direction(Math.asin(rng()*1.84-.92),rng()*Math.PI*2),lon=Math.atan2(nn.x,nn.z);if(terrainHeight(nn)<R+.04||farmReserved(nn,.06)||pondReserved(nn,.6)||Math.abs(Math.asin(nn.y)-pathLat(lon))<.11||houseSites.some(h=>nn.distanceTo(direction(h.lat,h.lon))<.25))continue;tree(nn,.62+rng()*.14);}
  // A few small trees frame distant edges; the central meadow stays open.
  [[.96,-.73],[1.03,.87],[-.25,-.68]].forEach(([lat,lon],i)=>tree(direction(lat,lon),.60+i*.04,i===2));
  [.25,3.05,4.35].forEach((angle,i)=>tree(shoreNormal(0,angle,.13),.47+(i%3)*.03));[2.4].forEach(angle=>tree(shoreNormal(1,angle,.13),.52));
  const crownAsset=createTreeCrownMaterial(vegetationRamp,natureUniforms),crownMaterial=crownAsset.material,crownDepth=crownAsset.depth;
  const crownGeo=createOrganicCluster();
  const canopy=new THREE.InstancedMesh(crownGeo,crownMaterial,crownMatrices.length);canopy.name='Painted tree crowns';
  crownMatrices.forEach((matrix,i)=>{canopy.setMatrixAt(i,matrix);canopy.setColorAt(i,crownColors[i]);});
  canopy.customDepthMaterial=crownDepth;canopy.castShadow=true;canopy.receiveShadow=true;canopy.frustumCulled=false;planet.add(canopy);
  const canopyDetail=createCanopyLeaves(planet,canopy,natureUniforms,vegetationRamp);
  // Painted blossom masses use broad light values; hundreds of tiny self-shadow
  // edges would make the pale flowers dirty. The grove still shadows the ground.
  canopy.receiveShadow=false;canopyDetail.leaves.receiveShadow=false;
  function shoreNormal(index,angle,offset=0){const f=shoreFrames[index],sample=f.samples[Math.round(((angle%(Math.PI*2)+Math.PI*2)%(Math.PI*2))/(Math.PI*2)*160)],r=sample.r+offset;return f.center.clone().multiplyScalar(Math.cos(r)).addScaledVector(sample.tangent,Math.sin(r)).normalize();}
  const palmFrondMat=new THREE.MeshToonMaterial({color:'white',vertexColors:true,gradientMap:vegetationRamp,side:THREE.DoubleSide}),palmFrondGeo=palmFronds();
  function palm(nn,size){const g=anchor(nn);g.scale.setScalar(size);stats.trees++;const bend=new THREE.QuadraticBezierCurve3(new THREE.Vector3(),new THREE.Vector3(.04,.38,0),new THREE.Vector3(.14,.7,.02));mesh(g,new THREE.TubeGeometry(bend,12,.032,7,false),'#dab189');for(let i=1;i<6;i++){const ring=mesh(g,new THREE.TorusGeometry(.034,.005,4,10),'#edc799',bend.getPoint(i/6).toArray());ring.rotation.x=Math.PI/2;}
    const crown=new THREE.Group();crown.position.set(.14,.69,.02);g.add(crown);
    mesh(crown,palmFrondGeo,palmFrondMat);
    for(let j=0;j<3;j++)mesh(crown,sphere,'#bc956d',[Math.sin(j*2)*.05,-.02,Math.cos(j*2)*.05],[.052,.062,.05]);foliage.push({g:crown,phase:rng()*6,amount:.065});
  }
  
  // Striped parasols and tiny loungers sit on dry sand, just above the tide line.
  [1.62,2.64,5.75].forEach((angle,index)=>{const g=anchor(shoreNormal(0,angle,.033));g.rotation.y+=angle;mesh(g,cyl,'#f8e6c6',[0,.19,0],[.012,.38,.012]);for(let j=0;j<8;j++)mesh(g,new THREE.SphereGeometry(.185,4,4,j*Math.PI/4,Math.PI/4,0,Math.PI/2),j%2?'#fff9e4':index%2?'#91d8d0':'#ffc4a5',[0,.37,0],[1,.4,1]);const towel=mesh(g,box,index%2?'#b6e4e8':'#ffd2b6',[.17,.006,.1],[.13,.013,.23]);towel.rotation.y=.2;for(let j=0;j<3;j++)mesh(g,box,'#fffbef',[.17,.014,.04+j*.07],[.125,.004,.014]);});
  // Shells and little sun-bleached pebbles make the beach readable at close zoom.
  for(let i=0;i<32;i++){const nn=shoreNormal(0,i*2.399,.018+(i%4)*.012),g=anchor(nn);const shell=mesh(g,sphere,i%3?'#fff9e6':'#f6c7bd',[0,.011,0],[.021,.012,.027],false);shell.rotation.y=i*2.4;}
  const lighthouse=anchor(shoreNormal(0,.64,.13));
  mesh(lighthouse,new THREE.CylinderGeometry(.10,.15,.66,16),'#fff9e7',[0,.33,0]);for(const y of [.2,.45])mesh(lighthouse,new THREE.CylinderGeometry(.125-(y-.2)*.075,.138-(y-.2)*.075,.09,16),'#efad9d',[0,y,0]);mesh(lighthouse,cyl,'#f7edd7',[0,.69,0],[.17,.035,.17]);mesh(lighthouse,cyl,'#88c7d4',[0,.76,0],[.088,.14,.088]);mesh(lighthouse,cone,'#ed9c89',[0,.91,0],[.17,.17,.17]);
  const beaconMat=new THREE.MeshStandardMaterial({color:'#fff4bf',emissive:'#ffdb8a',emissiveIntensity:.2});glowMaterials.push(beaconMat);mesh(lighthouse,sphere,beaconMat,[0,.765,.079],[.043,.054,.017],false);mesh(lighthouse,box,'#8bc8d4',[0,.09,.142],[.065,.15,.016]);
  const marine=createMarine({planet,R,height:terrainHeight,lakes,uniforms:natureUniforms,gradientMap,mesh,box,cyl,sphere,stem}),boat=marine.boat;

  // Instanced pebbles, grass and flower petals keep the richer world inexpensive.
  function instances(geometry, color, transforms) { const im = new THREE.InstancedMesh(geometry, m(color), transforms.length); transforms.forEach((matrix, i) => im.setMatrixAt(i, matrix)); im.instanceMatrix.needsUpdate = true; im.receiveShadow = true; im.castShadow = false; im.computeBoundingSphere(); planet.add(im); return im; }
  const dummy = new THREE.Object3D(), tempRoot = new THREE.Object3D();
  function matrix(normal, local, scale, twist = 0) { tempRoot.position.copy(normal).multiplyScalar(terrainHeight(normal)); tempRoot.quaternion.setFromUnitVectors(UP, normal); tempRoot.updateMatrix(); dummy.position.set(...local); dummy.rotation.set(0, twist, 0); dummy.scale.set(...scale); dummy.updateMatrix(); return new THREE.Matrix4().multiplyMatrices(tempRoot.matrix, dummy.matrix); }
  const grasses = [], stems = [], flowerCenters = [], petals = [[], [], []];
  for (let i = 0; i < 460; i++) { const nn = direction(Math.asin(rng() * 2 - 1), rng() * Math.PI * 2); if (terrainHeight(nn) < R + .04 || farmReserved(nn,.02)||pondReserved(nn,.5)) continue; const lon = Math.atan2(nn.x, nn.z); if (Math.abs(Math.asin(nn.y) - pathLat(lon)) < .03 || houseSites.some(h => nn.distanceTo(direction(h.lat, h.lon)) < .12)) continue;
    if (i % 3) { grasses.push(matrix(nn, [0, .027, 0], [.012, .065, .012], rng() * 6)); }
    else { const h = .08 + rng() * .04; stems.push(matrix(nn, [0, h / 2, 0], [.007, h, .007])); flowerCenters.push(matrix(nn, [0, h, 0], [.017, .014, .017])); for (let j = 0; j < 5; j++) petals[i % 9 / 3 | 0].push(matrix(nn, [Math.sin(j * 1.256) * .024, h, Math.cos(j * 1.256) * .024], [.024, .009, .019], j * 1.256)); stats.flowers++; }
  }
  const smallBlossom=new THREE.SphereGeometry(1,8,5),softPetal=createSoftLeaf(10,.15);
  instances(cyl, '#708b51', stems); instances(smallBlossom, '#e9b85f', flowerCenters); ['#eedad0', '#e9b8b6', '#f3dea1'].forEach((c, i) => {const flowers=instances(softPetal,c,petals[i]);flowers.material.gradientMap=vegetationRamp;flowers.material.side=THREE.DoubleSide;});
  const meadow=createMeadow(planet,terrainHeight,R,houseSites,natureUniforms,vegetationRamp);
  const shrubMat=new THREE.MeshToonMaterial({color:'#85ac6e',gradientMap:vegetationRamp}),smallShrubGeo=new THREE.SphereGeometry(1,12,8);
  for (let i = 0; i < 22; i++) { const nn = direction(Math.asin(rng() * 2 - 1), rng() * 6.28); if (terrainHeight(nn) < R + .05 || farmReserved(nn,.07)||pondReserved(nn,.5)) continue; const g = anchor(nn);mesh(g,smallShrubGeo,shrubMat,[0,.04,0],[.12,.075,.11]);stats.shrubs++; }

  const landscape=createLandscape(planet,terrainHeight,R,houseSites,natureUniforms,vegetationRamp);
  const meadowPollen=createMeadowPollen(planet,terrainHeight,R);
  const sakuraGarden=createSakuraGarden({planet,height:terrainHeight,R,canopy,uniforms:natureUniforms,gradientMap:vegetationRamp});
  stats.flowers+=landscape.counts.flowers;stats.shrubs+=landscape.counts.shrubs;

  const buildTargets={path:{id:'path',kind:'path',normal:direction(pathLat(.08),.08),object:landscape.path}};
  const cottages=[];
  function house(site, index) {
    const g = anchor(direction(site.lat, site.lon)), house = new THREE.Group(); const facing=direction(.32,.08).sub(direction(site.lat,site.lon)).applyQuaternion(g.quaternion.clone().invert()); house.rotation.y = Math.atan2(facing.x,facing.z);house.scale.setScalar(site.scale||1); g.add(house);solidObstacles.push(boxObstacle(g,house,site.scale||1,'house'+index));
    cottages.push(createCottage({index,root:g,house,mesh,box,cyl,gradientMap,glowMaterials,snowCaps}));
    buildTargets['house'+index]={id:'house'+index,kind:'house',normal:direction(site.lat,site.lon),object:house,root:g};
    return g;
  }
  houseSites.forEach(house);
  const millRoot = anchor(direction(MILL_SITE.lat,MILL_SITE.lon)), mill = new THREE.Group(); millRoot.add(mill); mill.rotation.y = .3;
  mesh(mill, new THREE.CylinderGeometry(.12,.17,.58,10), '#ede1bf', [0,.29,0]); mesh(mill, cone, '#ad8a71',[0,.65,0],[.23,.25,.23]);
  mesh(mill, box, '#92795c',[0,.105,.155],[.075,.18,.025]);
  const rotor = new THREE.Group(); rotor.position.set(0,.46,.2); mill.add(rotor);
  for(let i=0;i<4;i++){ const blade=new THREE.Group(); blade.rotation.z=i*Math.PI/2; rotor.add(blade);mesh(blade,box,'#e9d9b7',[0,.19,0],[.037,.42,.027]);mesh(blade,box,'#d8c39e',[.055,.24,0],[.12,.22,.024]);for(let j=0;j<3;j++)mesh(blade,box,'#f2e8d1',[.055,.17+j*.065,.016],[.125,.012,.01]); }
  mesh(rotor,sphere,'#9d8061',[0,0,.027],[.055,.055,.034]);

  mesh(mill,cyl,'#c7b792',[0,.023,0],[.19,.046,.19]);
  buildTargets.mill={id:'mill',kind:'mill',normal:direction(MILL_SITE.lat,MILL_SITE.lon),object:mill,root:millRoot};

  // Jetty on the main pond, lily pads and moving concentric ripples.
  const jettyNormal=shoreNormal(0,2.05,-.025);
  const lakeFrame = new THREE.Group(); lakeFrame.quaternion.setFromUnitVectors(UP, jettyNormal); lakeFrame.position.copy(jettyNormal).multiplyScalar(R+.018); planet.add(lakeFrame);
  for(let i=0;i<5;i++) mesh(lakeFrame,box,'#b39777',[-.36+i*.065,.02,-.45],[.055,.036,.25]);
  for(const x of [-.39,-.09]) for(const z of [-.53,-.36]) mesh(lakeFrame,cyl,'#9c8068',[x,-.035,z],[.013,.17,.013]);
  const dock=new THREE.Group();for(const o of [...lakeFrame.children])dock.add(o);lakeFrame.add(dock);buildTargets.dock={id:'dock',kind:'dock',normal:shoreNormal(0,2.05,.08),object:dock,root:dock};
  const rippleMat = new THREE.MeshBasicMaterial({color:'#e7f5cf',transparent:true,opacity:.3,depthWrite:false,side:THREE.DoubleSide});
  for(let i=0;i<8;i++){const angle=i*2.4, rr=.12+i*.039;const ring=mesh(lakeFrame,new THREE.RingGeometry(.06,.064,28),rippleMat.clone(),[Math.sin(angle)*rr,.016,Math.cos(angle)*rr],[1,1,1],false);ring.rotation.x=-Math.PI/2;lakeRipples.push(ring);}

  const garden = anchor(direction(-.20, -.34));
  for(let i=0;i<12;i++){const g=new THREE.Group();garden.add(g);g.position.set((i%4-1.5)*.066,.015,(Math.floor(i/4)-1)*.066);mesh(g,cyl,'#779661',[0,.025,0],[.008,.055,.008]);const l=mesh(g,sphere,'#9fbc76',[-.021,.047,0],[.028,.009,.013]);l.rotation.z=-.4;mesh(g,sphere,'#789e60',[.02,.032,0],[.026,.009,.013]);g.scale.setScalar(i<savedGrowth?1:.015);growthPlants.push(g);}
  for(let i=0;i<3;i++)mesh(garden,box,'#b5a583',[0,-.004,(i-1)*.075],[.28,.018,.045],false);

  // Original animal villagers share a small rig for walking, carrying and building.
  for(let i=0;i<VILLAGERS.length;i++){
    const root=new THREE.Group();planet.add(root);
    const villager=createVillager(i,{mesh,sphere,cyl,cone,box,stem});root.add(villager.body);
    const lon=.04+i*1.04,nn=direction(pathLat(lon),lon);moveOnSurface(root,nn);
    residents.push({...villager,root,i,lon,normal:nn.clone(),phase:rng()*6,heading:0,activity:'散步'});
  }
  const animals=[];
  for(let i=0;i<1;i++){const nn=direction(-.31+i*.13,-.36-i*.11),g=anchor(nn),body=new THREE.Group();g.add(body);mesh(body,sphere,i===0?'#f4c79c':'#eee8d4',[0,.09,0],[.085,.065,.115]);mesh(body,sphere,i===0?'#fff0d2':'#e8e3d1',[0,.14,.085],[.053,.052,.053]);for(const x of [-.025,.025])mesh(body,sphere,'#e6ddc6',[x,i===0?.184:.218,.078],[.015,i===0?.019:.071,.018]);mesh(body,sphere,'#f4f0e4',[0,.1,-.1],[.04,.04,.04]);for(const x of [-.026,.026])mesh(body,sphere,'#696453',[x,.15,.127],[.006,.007,.005]);if(i===0){mesh(body,sphere,'#e3a476',[-.055,.16,.045],[.025,.025,.018]);mesh(body,sphere,'#e3a476',[.055,.16,.045],[.025,.025,.018]);mesh(body,sphere,'#fff3d7',[0,.14,.132],[.03,.022,.012]);}animals.push({g,body,nn,phase:i*1.7});}
  const travelPet=animals[0];

  // Soft orbital clouds; opacity, number and tint respond to weather.
  const cloudRoot=new THREE.Group();planet.add(cloudRoot);
  for(let i=0;i<11;i++){ const nn=direction(.5+Math.sin(i*2.7)*.6,i*2.399),g=new THREE.Group();g.position.copy(nn).multiplyScalar(R+.64+(i%3)*.06);g.quaternion.setFromUnitVectors(UP,nn);cloudRoot.add(g);const material=new THREE.MeshStandardMaterial({color:'#faf3df',roughness:1,transparent:true,opacity:.86,depthWrite:false});for(let j=0;j<4;j++)mesh(g,sphere,material,[(j-1.5)*.16,Math.sin(j*2)*.035,0],[.2,.09+(j%2)*.046,.115],false);g.scale.setScalar(.8+(i%3)*.1);clouds.push({g,material,phase:i*2}); }

  for(let i=0;i<8;i++){
    const root=new THREE.Group();planet.add(root);const material=m(i%2?'#e2b177':'#adbacb');const left=mesh(root,sphere,material,[-.03,0,0],[.04,.007,.03],false),right=mesh(root,sphere,material,[.03,0,0],[.04,.007,.03],false);mesh(root,cyl,'#756950',[0,0,0],[.006,.044,.006],false).rotation.x=Math.PI/2;butterflies.push({root,left,right,phase:i*1.67});
  }
  for(let i=0;i<7;i++){const root=new THREE.Group();planet.add(root);mesh(root,sphere,'#fffdf1',[0,0,0],[.025,.023,.07],false);const left=mesh(root,cone,'#e2f0f1',[-.075,0,0],[.037,.15,.012],false),right=mesh(root,cone,'#e2f0f1',[.075,0,0],[.037,.15,.012],false);mesh(root,cone,'#eebd71',[0,0,.086],[.013,.035,.012],false).rotation.x=Math.PI/2;left.rotation.z=Math.PI/2;right.rotation.z=-Math.PI/2;birds.push({root,left,right,phase:i*.45});}

  const particleCount=480, particlePos=new Float32Array(particleCount*6), particleDirs=[], particlePhase=[];
  for(let i=0;i<particleCount;i++){particleDirs.push(direction(Math.asin(rng()*2-1),rng()*6.28));particlePhase.push(rng());}
  const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(particlePos,3));
  const rainMat=new THREE.LineBasicMaterial({color:'#b4d7db',transparent:true,opacity:.5,depthWrite:false});const rain=new THREE.LineSegments(rainGeo,rainMat);rain.frustumCulled=false;planet.add(rain);
  const snowPos=new Float32Array(particleCount*3),snowGeo=new THREE.BufferGeometry();snowGeo.setAttribute('position',new THREE.BufferAttribute(snowPos,3));
  // A shader draws circular soft particles without loading texture files.
  function particleMaterial(color,size){return new THREE.ShaderMaterial({uniforms:{color:{value:new THREE.Color(color)},size:{value:size},opacity:{value:.8}},vertexShader:'uniform float size;void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(size*220./-p.z,1.,12.);gl_Position=projectionMatrix*p;}',fragmentShader:'uniform vec3 color;uniform float opacity;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(color,opacity*(1.-smoothstep(.4,1.,r)));}',transparent:true,depthWrite:false});}
  const snow=new THREE.Points(snowGeo,particleMaterial('#ffffff',.17));snow.frustumCulled=false;planet.add(snow);
  const fireflyCount=60,fireflyGeo=new THREE.BufferGeometry(),fireflyPos=new Float32Array(fireflyCount*3);fireflyGeo.setAttribute('position',new THREE.BufferAttribute(fireflyPos,3));const fireflies=new THREE.Points(fireflyGeo,particleMaterial('#ffdc83',.15));fireflies.material.blending=THREE.AdditiveBlending;fireflies.frustumCulled=false;planet.add(fireflies);
  const petalGeo=new THREE.BufferGeometry(),petalPos=new Float32Array(100*3);petalGeo.setAttribute('position',new THREE.BufferAttribute(petalPos,3));const petalFX=new THREE.Points(petalGeo,particleMaterial('#f1c3b9',.12));petalFX.frustumCulled=false;planet.add(petalFX);

  // Event props use real scene objects, not only message changes.
  const rainbow=new THREE.Group();lakeFrame.add(rainbow);rainbow.position.set(0,.04,0);rainbow.rotation.y=.2;
  for(let i=0;i<5;i++){const material=new THREE.MeshBasicMaterial({color:['#dfa2a0','#e8c494','#e6d99e','#a8c4a5','#a6bac8'][i],transparent:true,opacity:.55,depthWrite:false,side:THREE.DoubleSide});const arc=new THREE.Mesh(new THREE.RingGeometry(.48+i*.019,.496+i*.019,48,1,0,Math.PI),material);rainbow.add(arc);}rainbow.visible=false;
  const appleGroup=anchor(direction(.35,-.32));const apple=mesh(appleGroup,sphere,'#cf8269',[0,.6,0],[.07,.075,.07]);mesh(apple,cyl,'#8c7154',[0,1.06,0],[.1,.5,.1]);appleGroup.visible=false;
  const pathLights=createPathLights({planet,direction,height:terrainHeight,R,anchor,mesh,cyl,box,cone,houses:houseSites});
  for(const n of pathLights.normals)solidObstacles.push(circleObstacle(n,.049,'path lantern'));
  const yard=createCozyYard({planet,direction,height:terrainHeight,R,mesh,box,cyl,sphere,anchor,buildTargets,glowMaterials});
  solidObstacles.push(circleObstacle(direction(POND_SITE.lat,POND_SITE.lon),.170,'pond'),circleObstacle(direction(MILL_SITE.lat,MILL_SITE.lon),.135,'mill'),circleObstacle(direction(.11,-.34),.108,'well'),circleObstacle(direction(.54,-.31),.120,'shed'),circleObstacle(direction(.16,.55),.140,'market'),circleObstacle(direction(.48,-.44),.120,'bench'),circleObstacle(direction(.61,.30),.120,'planter'));
  const instanceMatrix=new THREE.Matrix4(),obPos=new THREE.Vector3(),obScale=new THREE.Vector3(),obQuat=new THREE.Quaternion();
  for(const object of landscape.meshes.filter(m=>['shore boulders','fence timber','fence rails'].includes(m.name))){for(let i=0;i<object.count;i++){object.getMatrixAt(i,instanceMatrix);instanceMatrix.decompose(obPos,obQuat,obScale);const radius=(Math.max(obScale.x,obScale.y,obScale.z)*(object.name==='shore boulders'?1:.52)+.14)/R;solidObstacles.push(circleObstacle(obPos.clone().normalize(),radius,object.name));}}
  const navigation=createSurfaceNavigation({height:terrainHeight,R,obstacles:solidObstacles});
  residents.forEach(p=>{p.normal.copy(navigation.safeGoal(p.normal));moveOnSurface(p.root,p.normal);});
  const construction=createBuildScene({planet,targets:buildTargets,landscape,mesh,box,cyl,anchor,direction,height:terrainHeight,R,residentCount:residents.length});construction.setProgress(initialConstruction);
  const supplyObstacle=circleObstacle(construction.supplies.position.clone().normalize(),0,'building supplies');supplyObstacle.dynamic=true;solidObstacles.push(supplyObstacle);
  const islandLife=createIslandLife({direction,height:terrainHeight,R,construction,houseSites});
  const fishing=createFishingBay({planet,lake:lakes[1],shoreNormal,navigation,height:terrainHeight,R,mesh,cyl,box,sphere,stem});
  residents[2].normal.copy(fishing.normal);moveOnSurface(residents[2].root,residents[2].normal);
  const homes=createResidentHomes({residents,cottages,navigation});
  surf.forEach(s=>s.wave.renderOrder=2);
  // Merge rigid pieces inside moving groups, retaining every animated joint.
  planet.updateMatrixWorld(true);
  const cottagePaint=new THREE.MeshToonMaterial({color:'white',vertexColors:true,gradientMap,side:THREE.DoubleSide});
  const cottagePlantPaint=new THREE.MeshToonMaterial({color:'white',vertexColors:true,gradientMap:vegetationRamp,side:THREE.DoubleSide});
  function batchRigid(parent,objects,painted=false){
    const inverse=parent.matrixWorld.clone().invert(),buckets=new Map();
    for(const o of objects){if(!o.isMesh||o.isInstancedMesh)continue;const paint=painted&&o.material.isMeshToonMaterial&&o.material.emissive.getHex()===0,key=(paint?(o.userData.softFoliage?'plant-paint':'paint'):o.material.uuid)+'/'+o.castShadow;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o);}
    for(const group of buckets.values()){
      if(group.length<2)continue;
      const paint=painted&&group[0].material.isMeshToonMaterial&&group[0].material.emissive.getHex()===0;
      const parts=group.map(o=>{let g=o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}g.deleteAttribute('uv');if(paint){const rgb=new Float32Array(g.attributes.position.count*3),c=o.material.color;for(let i=0;i<rgb.length;i+=3){rgb[i]=c.r;rgb[i+1]=c.g;rgb[i+2]=c.b;}g.setAttribute('color',new THREE.BufferAttribute(rgb,3));}return g;});
      const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());if(!geometry)continue;
      const merged=new THREE.Mesh(geometry,paint?(group[0].userData.softFoliage?cottagePlantPaint:cottagePaint):group[0].material);merged.castShadow=group[0].castShadow;merged.receiveShadow=true;parent.add(merged);group.forEach(o=>o.removeFromParent());
    }
  }
  for(const f of foliage){const objects=[];f.g.traverse(o=>{if(o.isMesh)objects.push(o);});batchRigid(f.g,objects);}
  for(const c of clouds)batchRigid(c.g,[...c.g.children]);
  for(const p of residents){batchRigid(p.body,[...p.body.children]);batchRigid(p.head,[...p.head.children]);batchRigid(p.tail,[...p.tail.children]);}
  for(const s of construction.structures){s.groups.forEach(g=>batchRigid(g,g.children.filter(o=>!snowCaps.includes(o)),s.kind==='house'));batchRigid(s.frame,[...s.frame.children]);}
  for(const c of cottages)for(const group of [c.door,c.chime,c.plaque])batchRigid(group,[...group.children],true);
  for(const a of animals)batchRigid(a.body,[...a.body.children]);
  batchRigid(marine.body,marine.body.children.filter(o=>o!==marine.sails&&o!==marine.flag));
  batchRigid(marine.sails,[...marine.sails.children]);
  // Bake stationary meshes by material. Moving crowns, residents, weather and
  // event props retain their own transforms. Shadows stay on the baked geometry.
  const farm=createFarmScene({planet,direction,height:terrainHeight,gradientMap:vegetationRamp,uniforms:natureUniforms});
  const dynamic=new Set([sakuraGarden.root,fishing.root,pathLights.pools,pathLights.halos,yard.root,farm.root,...construction.dynamicRoots,marine.root,land,rotor,cloudRoot,appleGroup,rainbow,boat,...surf.map(s=>s.wave),...foliage.map(f=>f.g),...snowCaps,...residents.map(p=>p.root),...animals.map(a=>a.g),...butterflies.map(b=>b.root),...birds.map(b=>b.root),...lakeRipples,...growthPlants]);
  planet.updateMatrixWorld(true);const buckets=new Map();
  planet.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.material===waterMat||o.material===airMat)return;let p=o;while(p&&p!==planet){if(dynamic.has(p))return;p=p.parent;}const key=`${o.material.uuid}/${o.castShadow}/${o.receiveShadow}`;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o);});
  for(const objects of buckets.values()){if(objects.length<2)continue;const parts=objects.map(o=>{let g=o.geometry.clone().applyMatrix4(o.matrixWorld);if(g.index){const next=g.toNonIndexed();g.dispose();g=next;}g.deleteAttribute('uv');return g;});const merged=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());if(!merged)continue;const baked=new THREE.Mesh(merged,objects[0].material);baked.castShadow=objects[0].castShadow;baked.receiveShadow=objects[0].receiveShadow;planet.add(baked);objects.forEach(o=>o.removeFromParent());}
  const surfPoint=new THREE.Vector3();
  let env={rain:0,snow:0,cloud:.25,wind:.3,night:0,mist:0}, effect='',effectUntil=0,elapsed=0,growth=savedGrowth;
  function trigger(id, newGrowth=growth){if(id==='petals')sakuraGarden.wish();effect=id;effectUntil=elapsed+(id==='rainbow'?32:19);growth=newGrowth;appleGroup.visible=id==='apple';rainbow.visible=id==='rainbow';if(id==='apple'){appleGroup.position.copy(residents[0].normal).multiplyScalar(terrainHeight(residents[0].normal));appleGroup.quaternion.setFromUnitVectors(UP,residents[0].normal);} }
  function update(dt,t,nextEnv){
    elapsed=t;env=nextEnv;const active=t<effectUntil?effect:'',fade=Math.min(1,Math.max(0,effectUntil-t)/3),wind=env.wind+(active==='petals'?.8:0);
    meadowPollen.update(t,env);
    natureUniforms.uNatureTime.value=t;natureUniforms.uWind.value=.25+wind*1.3;natureUniforms.uDaylight.value=1-env.night*.8;natureUniforms.uSnow.value=env.snow;natureUniforms.uActors.value.forEach(v=>v.set(100,100,100));residents.forEach((p,i)=>{if(p.root.visible)natureUniforms.uActors.value[i].copy(p.root.position);});waterMat.color.set('#ffffff').lerp(new THREE.Color('#adcdeb'),env.night);sakuraGarden.update(t,env);
    surf.forEach(s=>{const phase=(t*.12+s.band/3)%1,advance=-.074+phase*.07;for(let j=0;j<s.samples.length;j++){const sample=s.samples[j],ripple=Math.sin(j/160*Math.PI*18-t*.9)*.002;for(let side=0;side<2;side++){const r=sample.r+advance+ripple+side*(.009+Math.sin(j*.31+t)*.0015),a=Math.cos(r),b=Math.sin(r),nx=s.center.x*a+sample.tangent.x*b,ny=s.center.y*a+sample.tangent.y*b,nz=s.center.z*a+sample.tangent.z*b,depth=Math.max(0,(sample.r-r)*sample.depthSlope),height=R+.010+sampleWater(surfPoint.set(nx*R,ny*R,nz*R),depth,t,natureUniforms.uWind.value),offset=(j*2+side)*3;s.positions[offset]=nx*height;s.positions[offset+1]=ny*height;s.positions[offset+2]=nz*height;}}s.wave.geometry.attributes.position.needsUpdate=true;s.wave.material.opacity=Math.sin(phase*Math.PI)*(.74-env.night*.22);});
    marine.update(dt,t,natureUniforms.uWind.value);farm.update(t);yard.update(t);pathLights.update(dt,env);
    airMat.uniforms.strength.value=.08+env.mist*.18; airMat.uniforms.tint.value.set(env.night>.5?'#b4cdef':'#d5f5f7');
    foliage.forEach(f=>{const gust=windAt(f.g.parent.position,t,natureUniforms.uWind.value);f.g.rotation.z=(.45+Math.sin(t*.8+f.phase))*f.amount*gust;f.g.rotation.x=Math.cos(t*.65+f.phase)*f.amount*.7*gust;});
    snowUniform.value=env.snow;
    snowCaps.forEach(c=>{c.visible=env.snow>.2;});
    glowMaterials.forEach(g=>g.emissiveIntensity=.15+env.night*2.1+env.rain*.6+env.snow*.4);
    rotor.rotation.z-=dt*(.35+wind*.8);cloudRoot.rotation.y=t*.016;clouds.forEach((c,i)=>{c.g.visible=!planet.userData.closeView&&i<3+Math.round(env.cloud*8);c.material.opacity=.66+env.cloud*.21;c.material.color.set(env.rain>.5?'#becbc7':env.night>.5?'#8a9aab':'#f8f1df');c.g.scale.y=.8+Math.sin(t*.5+c.phase)*.04;});
    construction.update(t,env.buildPaused);
    supplyObstacle.normal.copy(construction.supplies.position).normalize();supplyObstacle.radius=construction.getState().complete?0:.105;
    homes.update(dt,t,env);
    residents.forEach(p=>{
      if(p.homeState==='inside'){p.working=false;p.activity='在'+p.homeName+'睡觉';if(p.i===2)fishing.update(t,p,false);return;}
      let lon=p.lon+Math.sin(t*.055+p.phase)*.45,lat=pathLat(lon),speed=.006;
      if(env.rain>.35||env.snow>.35||env.night>.65){const h=houseSites[p.i%houseSites.length];lon=h.lon-.035-(p.i===5?.055:0);lat=h.lat-.13;}
      if(active==='gathering'){lon=-.18+(p.i-2.5)*.037;lat=.06+Math.sin(p.i)*.025;}
      if(active==='harvest'&&p.i<2){lon=-.34+(p.i?-.05:.05);lat=-.15;}
      if(active==='apple'&&p.i===0){lon=Math.atan2(appleGroup.position.x,appleGroup.position.z);lat=Math.asin(appleGroup.position.clone().normalize().y)-.02;}
      const home=homes.pose(p.i),sheltered=env.rain>.35||env.snow>.35||env.night>.65||!!home;
      const helper=sheltered?null:env.farmJobs?.get(p.i),fishingPose=fishing.pose(sheltered?-1:p.i,env,t),builder=helper||home||fishingPose?null:construction.workerPose(p.i,env.buildPaused||sheltered),leisure=home||fishingPose||islandLife.pose(p.i,t,env,p.normal);
      const encounter=!fishingPose&&['gathering','harvest','apple'].includes(active)&&!sheltered;
      const target=helper?helper.normal:builder?builder.normal:encounter?direction(lat,lon):leisure.normal,previous=p.normal.clone();
      // Limit walking velocity when a job or leisure spot changes, avoiding teleport-like rushes.
      const navMove=navigation.move(p,target,dt,t,residents.filter(q=>q.root.visible).concat(p.i===2?[]:fishing.normals.map(normal=>({normal})))),distance=p.normal.distanceTo(navMove.goal);
      if(terrainHeight(p.normal)<R+.03)p.normal.copy(previous);
      speed=previous.distanceTo(p.normal)/Math.max(dt,.001);
      moveOnSurface(p.root,p.normal);const tangent=p.normal.clone().sub(previous).applyQuaternion(p.root.quaternion.clone().invert());if(tangent.lengthSq()>1e-10){const desired=Math.atan2(tangent.x,tangent.z);p.heading+=Math.atan2(Math.sin(desired-p.heading),Math.cos(desired-p.heading))*Math.min(1,dt*8);}if(builder&&builder.mode==='build'){const face=builder.lookAt.clone().sub(p.normal).applyQuaternion(p.root.quaternion.clone().invert());p.heading=Math.atan2(face.x,face.z);}p.body.rotation.y=p.heading;
      const walk=Math.min(1,speed*95),swing=Math.sin(t*9+p.phase)*.35*walk;p.limbs[0].rotation.x=swing;p.limbs[2].rotation.x=-swing;p.limbs[1].rotation.x=-swing*.6;p.limbs[3].rotation.x=swing*.6;p.body.position.y=Math.abs(Math.sin(t*9+p.phase))*.006*walk;p.body.rotation.z=Math.sin(t*4.5+p.phase)*.035*walk;p.umbrella.visible=env.rain>.35;
      p.carry.visible=builder?.mode==='carry';p.hammer.visible=builder?.mode==='build'&&distance<.055;
      if(p.carry.visible){p.limbs[1].rotation.x=p.limbs[3].rotation.x=-1.18;}
      if(p.hammer.visible){p.limbs[3].rotation.x=-.8+Math.sin(t*7+p.phase)*.7;p.body.position.y=Math.max(0,Math.sin(t*7+p.phase))*.006;}
      p.head.rotation.z=Math.sin(t*1.7+p.phase)*.035;p.tail.rotation.y=Math.sin(t*2.1+p.phase)*.14;
      p.head.rotation.x=0;p.limbs[1].rotation.z=0;p.limbs[3].rotation.z=0;
      const settled=!helper&&!builder&&!encounter&&distance<(fishingPose?.006:.045);
      if(settled){
        const face=leisure.lookAt.clone().sub(p.normal).applyQuaternion(p.root.quaternion.clone().invert()),desired=Math.atan2(face.x,face.z);
        p.heading+=Math.atan2(Math.sin(desired-p.heading),Math.cos(desired-p.heading))*Math.min(1,dt*2);p.body.rotation.y=p.heading;
        if(leisure.mode==='rest'){p.body.position.y=-.035;p.limbs[0].rotation.x=p.limbs[2].rotation.x=-1.1;p.head.rotation.z=Math.sin(t*.8+p.phase)*.065;}
        if(leisure.mode==='flowers'){p.head.rotation.x=.26+Math.sin(t*1.4)*.06;p.limbs[1].rotation.x=-.62;p.body.position.y=-.012;}
        if(leisure.mode==='wave'){p.limbs[3].rotation.z=-1.55+Math.sin(t*3+p.phase)*.23;p.head.rotation.z=.10;}
        if(leisure.mode==='watch'){p.head.rotation.x=-.13;p.head.rotation.z=Math.sin(t*.55+p.phase)*.09;}
      }
      p.watering.visible=!!helper&&helper.kind==='water';p.basket.visible=!!helper&&helper.kind==='harvest';
      if(helper&&distance<.04){const face=helper.lookAt.clone().sub(p.normal).applyQuaternion(p.root.quaternion.clone().invert());p.heading=Math.atan2(face.x,face.z);p.body.rotation.y=p.heading;p.limbs[3].rotation.x=-.8+Math.sin(t*4)*.12;p.head.rotation.x=.18;p.watering.rotation.z=-.3+Math.sin(t*3)*.08;p.waterDrops.visible=helper.kind==='water';}else p.waterDrops.visible=false;
      p.working=!!builder||!!helper;
      p.activity=helper?(distance>.04?'走向菜园':helper.kind==='water'?'给菜苗浇水':'摘下成熟果实'):builder?({carry:'正在搬木料',build:'正在敲敲打打',walk:'去取下一份材料',rest:'休息一会儿'})[builder.mode]:!settled?'在岛上慢慢散步':({wander:'在草地上散步',rest:sheltered?'在屋边休息':'坐着晒太阳',flowers:'低头闻闻小花',wave:'向朋友挥挥手',watch:'听海风，看云朵'})[leisure.mode];
      if(p.i===2){fishing.update(t,p,!!fishingPose&&settled,natureUniforms.uWind.value);if(fishingPose)p.activity=settled?fishing.getState().activity:'提着心情，沿岸边换个钓点';}
      if(home)p.activity=p.homeState==='leaving'?'出门伸伸懒腰':p.homeState==='entering'?'推开家门，准备睡觉':'沿着小路回'+p.homeName;
      else if(leisure.mode==='stroll'&&!helper&&!builder)p.activity='沿着小路悠闲散步';
    });
    cottages.forEach(c=>c.update(dt,t,env,construction.getState().elapsed,residents));
    animals.forEach(a=>{a.body.position.y=Math.max(0,Math.sin(t*1.5+a.phase))*.024;a.body.rotation.y=Math.sin(t*.18+a.phase)*.5;a.g.visible=false /* travel companion stays in its postcard story; three island residents */;});
    butterflies.forEach((b,i)=>{b.root.visible=env.rain<.4&&env.snow<.4&&env.night<.65&&(i<3||active==='butterflies');const nn=direction(.02+Math.sin(t*.6+i)*.045,-.1+Math.cos(t*.32+i)*.14+i*.027);moveOnSurface(b.root,nn,.18+Math.sin(t*2+i)*.04);b.root.rotateY(t*.4+i);b.left.rotation.z=Math.sin(t*15+i)*.95;b.right.rotation.z=-Math.sin(t*15+i)*.95;});
    birds.forEach((b,i)=>{b.root.visible=env.rain<.4&&env.snow<.4&&env.night<.7&&(i<2||active==='birds');const nn=direction(.7+Math.sin(t*.3+i)*.06,t*.12+i*.08);b.root.position.copy(nn).multiplyScalar(R+1+i*.045);b.root.quaternion.setFromUnitVectors(UP,nn);b.root.rotateY(Math.PI/2);b.left.rotation.x=Math.sin(t*6+i)*.6;b.right.rotation.x=-Math.sin(t*6+i)*.6;});
    rain.visible=env.rain>.02;snow.visible=env.snow>.02;rainMat.opacity=env.rain*.48;snow.material.uniforms.opacity.value=env.snow*.9;
    if(rain.visible||snow.visible)for(let i=0;i<particleCount;i++){const nn=particleDirs[i],fall=(particlePhase[i]+t*(rain.visible?.83:.065))%1,h=terrainHeight(nn)+.035+(1-fall)*1.1;for(let j=0;j<3;j++){const v=nn.getComponent(j);particlePos[i*6+j]=v*h;particlePos[i*6+3+j]=v*(h+.075);snowPos[i*3+j]=v*h+Math.sin(t*.8+i+j)*.023;}}
    if(rain.visible)rainGeo.attributes.position.needsUpdate=true;if(snow.visible)snowGeo.attributes.position.needsUpdate=true;
    fireflies.visible=env.night>.25||active==='fireflies';if(fireflies.visible){fireflies.material.uniforms.opacity.value=(.5+Math.sin(t*1.8)*.2)*Math.max(env.night,active==='fireflies'?fade:0);for(let i=0;i<fireflyCount;i++){const nn=direction(Math.sin(i*7.3)*.8+Math.sin(t*.25+i)*.02,i*2.4+t*.016);const h=terrainHeight(nn)+.12+Math.sin(t+i)*.05;fireflyPos.set(nn.multiplyScalar(h).toArray(),i*3);}fireflyGeo.attributes.position.needsUpdate=true;}
    petalFX.visible=false;if(petalFX.visible){petalFX.material.uniforms.opacity.value=fade*.9;for(let i=0;i<100;i++){const nn=direction(.1+Math.sin(i*3.1+t*.19)*.8,i*2.4+t*.07);petalPos.set(nn.multiplyScalar(terrainHeight(nn)+.12+(i%7)*.035).toArray(),i*3);}petalGeo.attributes.position.needsUpdate=true;}
    lakeRipples.forEach((r,i)=>{const phase=(t*(.24+env.rain*.3)+i*.23)%1;r.scale.setScalar(.4+phase*(env.rain>.3||active==='ripples'?3:1.7));r.material.opacity=(1-phase)*(.22+env.rain*.3);});
    growthPlants.forEach((g,i)=>g.scale.lerp(new THREE.Vector3().setScalar(i<growth?1:.015),Math.min(1,dt*.8)));
    if(appleGroup.visible){apple.position.y=.07+Math.abs(Math.cos(Math.min(3,t-(effectUntil-19))*3.2))*Math.exp(-Math.min(5,t-(effectUntil-19))*1.5)*.6;if(!active)appleGroup.visible=false;}
    rainbow.visible=active==='rainbow';rainbow.children.forEach(c=>c.material.opacity=.4*fade);
  }
  return {planet,sakuraGarden,fishing,farm,yard,pathLights,homes,navigation,construction,cottages,marine,islandLife,land,ocean,boat,surf,meadow,landscape,canopy,canopyDetail,vegetationRamp,natureUniforms,shoreFrames,residents,travelPet,stats,update,trigger,terrainHeight,houseSites,lakes,growthPlants,clouds,rain,snow,waterMat,glowMaterials,dispose(){sakuraGarden.dispose?.();pathLights.dispose();crownAsset.texture.dispose();farm.dispose();canopyDetail.dispose();vegetationRamp.dispose();marine.dispose();construction.dispose();meadow.dispose();landscape.dispose();crownDepth.dispose();const gs=new Set(),ms=new Set();planet.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)ms.add(o.material);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());gradientMap.dispose();}};
}
