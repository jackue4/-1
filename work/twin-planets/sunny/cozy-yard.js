import * as THREE from 'three';
import {POND_SITE} from './layout.js';
export function createCozyYard({planet,direction,height,R,mesh,box,cyl,sphere,anchor,buildTargets,glowMaterials}){
 const root=new THREE.Group();root.name='Quiet pond garden';planet.add(root);const level=R+.081,center=direction(POND_SITE.lat,POND_SITE.lon),up=new THREE.Vector3(0,1,0),positions=[],uv=[],indices=[],shore=[];
 function point(a,r){return direction(POND_SITE.lat+Math.sin(a)*.105*r,POND_SITE.lon+Math.cos(a)*.125*r);}
 for(let j=0;j<=80;j++){const a=j/80*Math.PI*2;let lo=0,hi=1.6;for(let k=0;k<16;k++){const r=(lo+hi)/2;if(height(point(a,r))<level)lo=r;else hi=r;}shore.push((lo+hi)/2);}
 for(let ring=0;ring<=6;ring++)for(let j=0;j<=80;j++){const n=point(j/80*Math.PI*2,shore[j]*ring/6);positions.push(...n.multiplyScalar(level).toArray());uv.push(j/80,ring/6);if(ring<6&&j<80){const a=ring*81+j;indices.push(a,a+1,a+81,a+1,a+82,a+81);}}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
 const water=new THREE.Mesh(geometry,new THREE.MeshToonMaterial({color:'#94c8b2',transparent:true,opacity:.83,depthWrite:false,side:THREE.DoubleSide}));water.renderOrder=1;root.add(water);
 const rings=[];for(let i=0;i<3;i++){const n=point(i*2.3,.24+i*.13),g=new THREE.Group();g.position.copy(n).multiplyScalar(level+.002);g.quaternion.setFromUnitVectors(up,n);root.add(g);const ripple=mesh(g,new THREE.RingGeometry(.018,.020,40),'#deedcb',[0,0,0],[1,1,1],false);ripple.rotation.x=-Math.PI/2;ripple.material=new THREE.MeshBasicMaterial({color:'#e0edca',transparent:true,opacity:.35,side:THREE.DoubleSide,depthWrite:false});rings.push(ripple);}
 for(let i=0;i<7;i++){const n=point(i*2.399,.21+(i%3)*.16),g=new THREE.Group();g.position.copy(n).multiplyScalar(level+.004);g.quaternion.setFromUnitVectors(up,n);root.add(g);const pad=mesh(g,new THREE.CircleGeometry(.030+(i%2)*.007,20,0,Math.PI*1.83),'#82ad70',[0,0,0],[1,1,1],false);pad.rotation.x=-Math.PI/2;pad.rotation.z=i*2;if(i%3===0){for(let j=0;j<5;j++){const a=j*1.256;mesh(g,sphere,'#f1d3c0',[Math.sin(a)*.009,.009,Math.cos(a)*.009],[.013,.007,.012],false);}mesh(g,sphere,'#e4c16c',[0,.012,0],[.006,.005,.006],false);}}
 for(let i=0;i<23;i++){const a=i/23*Math.PI*2,n=point(a,shore[Math.round(i/23*80)]*1.075),g=anchor(n);root.attach(g);mesh(g,sphere,i%3?'#c3c4a0':'#abb798',[0,.015,0],[.035+(i%2)*.012,.025,.027],false);}
 for(let i=0;i<9;i++){const a=2.8+i*.13,n=point(a,1.1),g=anchor(n);root.attach(g);for(let j=0;j<3;j++){const stem=mesh(g,cyl,'#96ac71',[(j-1)*.014,.06+(j%2)*.015,0],[.003,.12+(j%2)*.03,.003],false);stem.rotation.z=(j-1)*.12;}}
 // Later construction stages become shared outdoor places, keeping saved stage IDs.
 function project(id,lat,lon){const g=anchor(direction(lat,lon)),object=new THREE.Group();g.add(object);buildTargets[id]={id,kind:'garden',normal:direction(lat,lon),root:g,object};return object;}
 const bench=project('house2',.48,-.44);bench.rotation.y=-.35;
 for(const x of [-.095,.095])for(const z of [-.045,.045])mesh(bench,box,'#9e8e68',[x,.039,z],[.018,.079,.018]);for(let j=0;j<3;j++)mesh(bench,box,'#d9b87c',[0,.086,(j-1)*.041],[.25,.020,.035]);for(let j=0;j<2;j++)mesh(bench,box,'#e0c38b',[0,.139+j*.041,-.056],[.26,.033,.016]);
 const flowers=project('house3',.61,.30);
 mesh(flowers,box,'#c7a777',[0,.031,0],[.28,.06,.11]);for(let i=0;i<9;i++){mesh(flowers,cyl,'#8ba870',[(i%5-2)*.046,.078,Math.floor(i/5)*.039],[.002,.10,.002],false);mesh(flowers,sphere,i%2?'#efd6bd':'#e6b8b6',[(i%5-2)*.046,.134,Math.floor(i/5)*.039],[.021,.024,.022],false);}
 const picnic=project('house4',.05,-.06);mesh(picnic,box,'#e2c7a2',[0,.006,0],[.27,.010,.23],false);for(let i=0;i<5;i++)mesh(picnic,box,'#f4e7cf',[(i-2)*.052,.012,0],[.019,.003,.23],false);mesh(picnic,cyl,'#b89563',[.065,.039,0],[.047,.058,.042]);mesh(picnic,sphere,'#d8a18c',[-.058,.026,.02],[.031,.022,.031],false);
 const lanternMat=new THREE.MeshToonMaterial({color:'#ffe5aa',emissive:'#ffc276',emissiveIntensity:.2});glowMaterials.push(lanternMat);mesh(picnic,cyl,'#9b9270',[-.12,.063,-.09],[.025,.12,.025]);mesh(picnic,sphere,lanternMat,[-.12,.15,-.09],[.031,.042,.031],false);
 return{root,water,center,update(t){rings.forEach((r,i)=>{const f=(t*.18+i*.33)%1;r.scale.setScalar(.8+f*2.4);r.material.opacity=Math.sin(f*Math.PI)*.28;});}};
}
