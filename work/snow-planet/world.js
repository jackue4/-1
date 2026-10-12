import {THREE,R,normal,point,anchor,mesh,seeded} from './core.js';
import {createJiangnanArchitecture} from './architecture.js';
import {createWinterNature} from './nature.js';
import {batchScenery} from '../festival-planet/optimize.js';
import {landField,groundHeight,createSnowTerrain} from './terrain.js';
import {createJiangnanWater} from './water.js';
export {landField,groundHeight} from './terrain.js';

export function createSnowWorld({planet,palette,mobile=false}){
 const rnd=seeded(8719),m=palette.m,arch=createJiangnanArchitecture({THREE}),nature=createWinterNature(THREE),staticRoot=new THREE.Group();planet.add(staticRoot);
 const stats={houses:0,pavilions:0,bridges:0,corridors:0,trees:0,boats:0,fish:0,landmarks:['临水雪廊','水巷人家','湖心亭','疏影梅园','长堤听雪']};
 const terrain=createSnowTerrain({parent:staticRoot,mobile}),waterSurface=createJiangnanWater({THREE,parent:planet,radius:R+.006,groundHeight,landField,mobile}),water=waterSurface.mesh;
 function put(object,lat,lon,turn=0,h=null){const g=anchor(staticRoot,lat,lon,h===null?Math.max(.018,groundHeight(lat,lon)):h,turn);g.add(object);return g;}
 function route(points,width=.055,color='#afb4aa',h=.011){const pts=points.map(([a,b])=>new THREE.Vector2(b,a)),curve=new THREE.SplineCurve(pts),positions=[],indices=[],count=100;for(let i=0;i<=count;i++){const t=i/count,v=curve.getPoint(t),d=curve.getTangent(t),side=new THREE.Vector2(-d.y,d.x).multiplyScalar(width/R/2);for(const sign of [-1,1]){const lon=v.x+side.x*sign,lat=v.y+side.y*sign,q=point(lat,lon,Math.max(groundHeight(lat,lon),.024)+h);positions.push(...q.toArray());}if(i<count){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();mesh(staticRoot,geo,m(color));return curve;}
 route([[.68,-1.02],[.87,-.64],[.77,-.25],[.61,.13],[.57,.56]],.105);
 route([[-.63,.57],[-.24,.56],[.17,.57],[.59,.58],[.82,.45]],.10);
 route([[-.57,1.02],[-.20,.99],[.20,1.01],[.58,.97]],.09);
 route([[-.75,-1.10],[-.53,-.82],[-.43,-.52],[-.45,-.26]],.075);
 route([[.52,1.7],[.69,2.05],[.7,2.5],[.45,2.95],[.12,2.97]],.09);
 // Garden: a courtyard behind the waterside hall, a zigzag gallery over the pond.
 put(arch.house({width:.95,depth:.59,height:.45,variant:2}),.76,-.37,.08);stats.houses++;
 put(arch.house({width:.58,depth:.43,height:.34,variant:1}),.90,-.88,-.23);stats.houses++;
 const galleryParts=[[.51,-.43,-.15,.82],[.48,-.20,.72,.56],[.51,-.01,-.27,.56]];
 for(const [lat,lon,turn,length] of galleryParts){put(arch.corridor({length,width:.23,height:.38,sections:4}),lat,lon,turn,.022);stats.corridors++;}
 put(arch.pavilion({size:.66,height:.68}),.5,-.63,0,.025);stats.pavilions++;
 put(arch.pavilion({size:.46,height:.5}),.70,.18,.2);stats.pavilions++;
 put(arch.moonGate({width:.61,height:.51}),.86,-.61,.13);
 put(arch.moonGate({width:.47,height:.42}),-.43,-.70,-.14);
 // A white-walled canal street. Front doors look across water, with gaps for stairs.
 for(let i=0;i<7;i++){const lat=-.50+i*.157;for(const bank of [0,1]){const lon=bank?.976:.603;const house=arch.house({width:.39+(i%2)*.075,depth:.32,height:.29+(i%3)*.045,variant:(i+bank)%3});put(house,lat,lon,bank?-Math.PI/2:Math.PI/2);stats.houses++;}}
 for(const lat of [-.33,.17,.57]){put(arch.bridge({length:.71,width:.21,rise:.27}),lat,.78,0,.038);stats.bridges++;}
 // Low arched causeway and lake pavilion: intentionally airy, not crowded with props.
 put(arch.bridge({length:.94,width:.27,rise:.22}),.11,-.57,-.20,.004);stats.bridges++;
 put(arch.pavilion({size:.54,height:.66}),.14,-.75,.25,.005);stats.pavilions++;
 put(arch.corridor({length:.44,width:.22,height:.32,sections:2}),.125,-.93,-.02,.008);stats.corridors++;
 // A snow-lined waterside walk joins the bridge landing back to the garden bank.
 const lakeWalk=new THREE.SplineCurve([new THREE.Vector2(-.427,.08),new THREE.Vector2(-.38,.13),new THREE.Vector2(-.41,.22)]);
 for(let i=0;i<24;i++){const v=lakeWalk.getPoint((i+.5)/24),a=lakeWalk.getPoint(i/24),b=lakeWalk.getPoint((i+1)/24),d=b.clone().sub(a),length=point(a.y,a.x).distanceTo(point(b.y,b.x)),g=anchor(staticRoot,v.y,v.x,.089,Math.atan2(d.x*Math.cos(v.y),-d.y));mesh(g,new THREE.BoxGeometry(.17,.033,length*1.03),m('#aab9b4'));mesh(g,new THREE.BoxGeometry(.166,.008,length*.88),m('#e9eae1'),[0,.02,0]);for(const sign of [-1,1]){mesh(g,new THREE.BoxGeometry(.008,.012,length*1.08),m('#98aaa7'),[sign*.079,.125,0]);if(i%3===0){mesh(g,new THREE.BoxGeometry(.014,.128,.014),m('#839b96'),[sign*.079,.062,0]);mesh(g,new THREE.SphereGeometry(.011,8,5),m('#efeee6'),[sign*.079,.129,0]);}}}
 put(arch.house({width:.67,depth:.42,height:.37,variant:1}),-.59,-.70,-.35);stats.houses++;
 put(arch.pavilion({size:.47,height:.53}),-.55,-1.13,.5);stats.pavilions++;
 // Far-side garden continues the same identity, so orbiting reveals a complete world.
 put(arch.house({width:.83,depth:.55,height:.42,variant:2}),.62,2.3,.2);stats.houses++;
 put(arch.pagoda({size:.33,levels:4}),.62,2.72); 
 put(arch.pavilion({size:.53,height:.61}),.24,2.93,.5);stats.pavilions++;
 put(arch.bridge({length:.76,width:.25,rise:.18}),-.26,2.54,.4,.016);stats.bridges++;
 for(let i=0;i<5;i++){put(arch.house({width:.4,depth:.35,height:.28,variant:i%3}),-.52+i*.16,-2.05,.2);stats.houses++;}
 // Raised quay edges and short stair landings follow the globe, not floating planes.
 for(const lon of [.695,.867])for(let i=0;i<39;i++){const lat=-.63+i*.033;if(Math.abs(Math.abs(lat)-.50)<.16)continue;const g=anchor(staticRoot,lat,lon,.02);mesh(g,new THREE.BoxGeometry(.043,.046,.12),m('#8e9e9b'),[0,0,0]);mesh(g,new THREE.BoxGeometry(.047,.012,.121),m('#e7e7df'),[0,.025,0]);}
 for(const lat of [-.15,.04,.27])for(const lon of [.69,.87]){const g=anchor(staticRoot,lat,lon,.006);for(let s=0;s<3;s++)mesh(g,new THREE.BoxGeometry(.04,.014,.13),m('#aab4ad'),[(s-1)*.033,s*.013,0]);}
 // Backdrop groves and red-plum foreground frame the architecture without covering it.
 const treeLocations=[[.86,-1.05],[1.04,-.36],[1.02,.20],[.77,.34],[.51,-1.04],[.65,-.86],[-.45,-.96],[-.69,-1.03],[-.78,-.52],[-.55,-.35],[.67,1.04],[-.65,1.05],[.34,1.14],[.6,2.0],[.89,2.6],[.36,2.88],[-.35,-2.4],[-.8,-2.33]];
 treeLocations.forEach(([lat,lon],i)=>{put(nature.winterTree({height:.55+(i%4)*.09,seed:i+31,blossom:i%3===0,snow:.65}),lat,lon,rnd()*6);stats.trees++;});
 for(const [lat,lon,seed] of [[-.38,-.78,50],[-.71,-.44,51],[-.72,-.85,52]]){put(nature.winterTree({height:.55,seed,blossom:true,snow:.5}),lat,lon,rnd()*6);stats.trees++;}
 for(let i=0;i<26;i++){const lat=(rnd()-.5)*2.4,lon=(rnd()-.5)*Math.PI*2;if(landField(lat,lon)<.18||Math.abs(lon)<1.3&&lat>-.9&&lat<.9)continue;put(nature.pine({height:.45+rnd()*.38,seed:100+i}),lat,lon,rnd()*6);stats.trees++;}
 for(const [lat,lon] of [[.92,-.67],[.78,-1.1],[.7,.26],[-.74,-.89],[-.51,-.4],[.57,2.14],[-.55,-2.51]]){put(nature.bamboo({height:.42+rnd()*.19,seed:Math.floor(rnd()*999),count:4}),lat,lon);}
 for(let i=0;i<20;i++){const a=i/20*Math.PI*2,lat=.52+Math.sin(a)*.173,lon=-.32+Math.cos(a)*.56;if(i%3===0)put(nature.reeds({height:.12,seed:200+i}),lat,lon,0,.003);else put(nature.rock({size:.045+rnd()*.065,seed:200+i}),lat,lon,rnd()*6,Math.max(.0,groundHeight(lat,lon)));}
 for(const [lat,lon] of [[.83,-.13],[.75,-.75],[.7,-.98],[.73,.12],[-.6,-.53],[-.4,-.73]])put(nature.shrub({size:.09+rnd()*.05,seed:Math.floor(rnd()*100)}),lat,lon);
 for(const [lat,lon,height,seed] of [[.64,-.69,.31,1],[.42,-.74,.29,3],[.42,.05,.36,5],[.82,-.61,.25,6],[-.4,-.68,.39,9],[.56,2.13,.33,10]])put(arch.scholarRock({height,width:height*.56,seed}),lat,lon,-.15);
 for(let i=0;i<135;i++){const lat=(rnd()-.5)*2.7,lon=(rnd()-.5)*Math.PI*2,f=landField(lat,lon);if(f>-.045&&f<.055){put(nature.rock({size:.07+rnd()*.13,seed:i,snow:f>0}),lat,lon,rnd()*6,Math.max(.002,groundHeight(lat,lon)));if(i%3===0)put(nature.reeds({height:.11+rnd()*.09,seed:i}),lat+.02,lon,0,.004);}}
 for(let i=0;i<17;i++){const lat=-.48+rnd()*.30,lon=-.36+rnd()*.36;put(nature.lotus({size:.07+rnd()*.035,seed:i}),lat,lon,0,.009);}
 // Small garden props: stepping stones, tea table, two cups and empty stools.
 const tea=anchor(staticRoot,.64,-.35,groundHeight(.64,-.35));mesh(tea,new THREE.CylinderGeometry(.105,.10,.028,20),m('#786f60'),[0,.10,0]);mesh(tea,new THREE.CylinderGeometry(.025,.03,.10,12),m('#7e7b6c'),[0,.04,0]);for(const x of [-.15,.15])mesh(tea,new THREE.CylinderGeometry(.038,.045,.065,12),m('#a1a294'),[x,.032,0]);for(const x of [-.037,.037])mesh(tea,new THREE.CylinderGeometry(.012,.008,.024,10),m('#e8e5cd'),[x,.126,.014]);
 for(let i=0;i<14;i++){const lat=.69+i*.008,lon=-.72+i*.017;const g=anchor(staticRoot,lat,lon,Math.max(.025,groundHeight(lat,lon))+.012);const slab=mesh(g,new THREE.CylinderGeometry(.038,.043,.012,7),m('#a8aea3'));slab.rotation.y=rnd()*5;}
 // Boats slide through the water, accompanied by subtle ripples and lantern glints.
 const boats=[];for(let i=0;i<3;i++){const g=new THREE.Group();g.userData.dynamic=true;planet.add(g);const model=arch.boat({length:i===0?.38:.39,width:.15,canopy:true});g.add(model);batchScenery(model);model.rotation.y=Math.PI/2;boats.push({g,model,index:i});stats.boats++;}
 const koi=[];const fishGeo=new THREE.SphereGeometry(1,8,6);for(let i=0;i<14;i++){const g=new THREE.Group();g.userData.dynamic=true;planet.add(g);mesh(g,fishGeo,m(i%3===0?'#c38066':'#597b76'),[0,0,0],[.018,.01,.05]);const tail=mesh(g,new THREE.ConeGeometry(.022,.04,3),m('#718c80'),[0,0,-.055]);tail.rotation.x=-Math.PI/2;koi.push({g,index:i});stats.fish++;}
 waterSurface.setBoats(boats);
 const lampMaterials=Object.values(arch.materials||{}).filter(x=>x?.isMaterial&&x.emissive);
 function placeMoving(g,lat,lon,h,heading){const up=normal(lat,lon),east=new THREE.Vector3(Math.cos(lon),0,-Math.sin(lon)),south=new THREE.Vector3().crossVectors(east,up);g.position.copy(point(lat,lon,h));g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(east,up,south));g.rotateY(heading);}
 function update(time,env){terrain.update(time,env);waterSurface.update(time,env);for(const mat of lampMaterials)if(mat.emissive.getHex()!==0)mat.emissiveIntensity=.28+env.night*1.9;
  boats.forEach(({g,model,index:i})=>{let lat,lon,heading;if(i===0){const a=time*.065;lat=Math.sin(a)*.47;lon=.78+Math.cos(a)*.014;heading=Math.atan2(-Math.sin(a)*.014*Math.cos(lat),-Math.cos(a)*.47);}else{const a=time*(.038+i*.007)+i*2.1,centerLat=i===1?-.10:.015,centerLon=i===1?-.05:-.20,latRadius=i===1?.075:.055,lonRadius=i===1?.13:.10;lat=centerLat+Math.sin(a)*latRadius;lon=centerLon+Math.cos(a)*lonRadius;heading=Math.atan2(-Math.sin(a)*lonRadius*Math.cos(lat),-Math.cos(a)*latRadius);}placeMoving(g,lat,lon,.014,heading);model.rotation.z=Math.sin(time*1.1+i)*.015;});
  koi.forEach(({g,index:i})=>{const a=time*.11+i*2.1;placeMoving(g,-.13+Math.sin(a)*.09+(i%3)*.033,-.27+Math.cos(a)*.12,.0-.035-i%3*.014,a+Math.PI/2);});
 }
 update(0,{night:0});return{stats,water,waterSurface,terrain,staticRoot,boats,update,dispose(){nature.dispose?.();arch.dispose?.();terrain.dispose();waterSurface.dispose();}};
}
