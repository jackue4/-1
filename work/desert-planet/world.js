import {THREE,R,TAU,COVE,SITES,normal,frame,seeded} from './core.js';
import {createDesertTerrain,height,landField} from './terrain.js';
import {createDesertNature} from './nature.js';
import {createDesertLandmarks} from './landmarks.js';
import {createDesertBeachLife} from './beach-life.js';
import {createDesertCaravan} from './caravan.js';
import {createDesertWater} from './water.js';
import {createDesertCacti} from './cacti.js';
import {createRoamingCamel} from './roaming-camel.js';
import {createNightMummies} from './night-mummies.js';
import {createPaintBatch} from './paint.js';

export function createDesertWorld({planet,palette,mobile=false}){
 const root=new THREE.Group();root.name='沙海拾光 · The Amber Coast';planet.add(root);
 const terrain=createDesertTerrain({parent:root,palette}),nature=createDesertNature({parent:root,palette}),water=createDesertWater({planet:root,palette,height,landField,mobile}),landmarks=createDesertLandmarks({palette}),beach=createDesertBeachLife({palette}),paint=createPaintBatch(palette),rng=seeded(2294);
 root.add(landmarks.root,beach.root);terrain.coveFrame.decompose(beach.root.position,beach.root.quaternion,beach.root.scale);
 const caravan=createDesertCaravan({palette});root.add(caravan.root);frame(SITES.caravan.lat,SITES.caravan.lon,R+.204).decompose(caravan.root.position,caravan.root.quaternion,caravan.root.scale);
 const roaming=createRoamingCamel({palette,height,landField}),mummies=createNightMummies({palette,height,landField,mobile});root.add(roaming.root,mummies.root);
 const reservedNormals=roaming.getRouteNormals();for(const spot of mummies.getState().spots)reservedNormals.push(new THREE.Vector3(...spot.position).normalize());
 const cacti=createDesertCacti({palette,routeNormals:reservedNormals});root.add(cacti.root);
 const anchors={cove:beach.root,caravan:caravan.root};for(const[id,group]of Object.entries(landmarks.sites)){const site=SITES[id],n=normal(site.lat,site.lon),base=frame(site.lat,site.lon,height(n)+.027);base.decompose(group.position,group.quaternion,group.scale);anchors[id]=group;paint.cylinder('#d5ae7d',[0,-.095,0],id==='kasbah'?.82:.78,id==='kasbah'?.88:.83,.20,[0,0,0],base,48);}
 // The reverse side has a shaded oasis courtyard, pool-side rugs and tea.
 const oasis=new THREE.Group();oasis.name='月泉绿洲';const os=SITES.oasis;frame(os.lat,os.lon,R+.025).decompose(oasis.position,oasis.quaternion,oasis.scale);root.add(oasis);anchors.oasis=oasis;const ob=frame(os.lat,os.lon,R+.025);
 const pavilionGround=new THREE.Vector3(0,0,-.69).applyMatrix4(ob).normalize();pavilionGround.multiplyScalar(height(pavilionGround)).applyMatrix4(ob.clone().invert());const pavilion=new THREE.Matrix4().makeTranslation(0,pavilionGround.y+.028,-.69).premultiply(ob);
 paint.cylinder('#f0d7ab',[0,.014,0],.29,.34,.061,[0,0,0],pavilion,32);
 for(const x of[-.19,.19])for(const z of[-.19,.19]){paint.cylinder('#e2bc8f',[x,.16,z],.021,.025,.28,[0,0,0],pavilion,12);paint.cylinder('#f7e6ba',[x,.29,z],.033,.028,.04,[0,0,0],pavilion,12);}
 paint.box('#d0a078',[0,.323,0],[.50,.041,.50],[0,0,0],pavilion);paint.box('#efc98e',[0,.35,0],[.53,.027,.53],[0,0,0],pavilion);
 const dome=new THREE.SphereGeometry(.25,24,12,0,TAU,0,Math.PI/2);paint.add(dome,'#73afa5',[0,.362,0],[1,.82,1],[0,0,0],pavilion);dome.dispose();paint.cylinder('#d9b263',[0,.60,0],.006,.009,.092,[0,0,0],pavilion,8);paint.ball('#f8d287',[0,.656,0],[.022,.024,.022],[0,0,0],pavilion);
 for(const[x,z]of [[-.53,-.24],[.62,.02]]){const b=new THREE.Matrix4().makeTranslation(x,.035,z).premultiply(ob);paint.box('#c88570',[0,0,0],[.22,.007,.29],[0,.2,0],b);for(let i=-2;i<=2;i++)paint.box('#edd2a2',[0,.005,i*.05],[.21,.002,.008],[0,.2,0],b);paint.cylinder('#a17451',[0,.062,.03],.075,.083,.016,[0,0,0],b,18);paint.cylinder('#8c7059',[0,.030,.03],.025,.041,.06,[0,0,0],b,10);paint.ball('#cba779',[.013,.095,.021],[.025,.029,.021],[0,0,0],b);for(const a of[-1,1])paint.cylinder('#ede3bb',[a*.037,.085,.044],.011,.009,.025,[0,0,0],b,8);}
 // Stone edging, a narrow footbridge, and warm patterned lanterns.
 for(let i=0;i<32;i++){const a=i/32*TAU,x=Math.sin(a)*.47,z=Math.cos(a)*.47;paint.ball(i%3?'#d0b384':'#e1c899',[x,-.004,z],[.047,.025,.027],[0,a,0],ob);}
 for(let i=0;i<9;i++)paint.box(i%2?'#a27e57':'#bb9466',[.36,.063,-.36+i*.065],[.18,.014,.054],[0,0,0],ob);
 const lamps=new THREE.Group();lamps.name='琥珀航灯';root.add(lamps);const lampMat=palette.glow('#ffcf89'),lampGeometry=new THREE.SphereGeometry(.025,10,7);
 for(const[id,site]of Object.entries(SITES)){const base=frame(site.lat,site.lon,height(normal(site.lat,site.lon))+.025);for(const x of[-.70,.70]){const ln=new THREE.Vector3(x,0,.43).applyMatrix4(base).normalize();ln.multiplyScalar(height(ln)).applyMatrix4(base.clone().invert());const ly=ln.y+.018;paint.cylinder('#876a4c',[x,ly+.11,.43],.011,.014,.23,[0,0,0],base,8);const lamp=new THREE.Mesh(lampGeometry,lampMat);lamp.position.set(x,ly+.255,.43).applyMatrix4(base);lamp.scale.set(1,1.35,1);lamps.add(lamp);paint.cylinder('#d6b47a',[x,ly+.291,.43],.037,.038,.021,[0,0,0],base,10);}}
 // A little weathered jetty and moored sailboat punctuate the distant coast.
 const jettyLat=-.30,jettyLon=.82,jb=frame(jettyLat,jettyLon,R+.026);for(let i=0;i<14;i++)paint.box(i%2?'#bd956b':'#caab7c',[0,-.022,i*.049],[.22,.022,.043],[0,0,0],jb);for(const x of[-.09,.09])for(const z of[.0,.29,.57])paint.cylinder('#977354',[x,-.061,z],.012,.017,.15,[0,0,0],jb,8);
 const boat=new THREE.Group();boat.name='缓缓随潮起伏的小帆船';root.add(boat);const boatPaint=createPaintBatch(palette);boatPaint.ball('#fff1d5',[0,.018,0],[.083,.043,.18]);boatPaint.ball('#ac8060',[0,.043,0],[.060,.020,.132]);boatPaint.cylinder('#a28363',[0,.18,-.013],.006,.007,.31,[0,0,0],null,8);const sail=new THREE.BufferGeometry();sail.setAttribute('position',new THREE.Float32BufferAttribute([.008,.08,0,.008,.33,0,.13,.087,0],3));sail.setIndex([0,1,2]);sail.computeVertexNormals();boatPaint.add(sail,'#f1b99e');sail.dispose();boatPaint.material.side=THREE.DoubleSide;boatPaint.finish(boat,'风中的奶油帆与木船');
 const gulls=new THREE.Group();gulls.name='海湾上空的燕鸥';root.add(gulls);const birdPaint=createPaintBatch(palette);for(let i=0;i<5;i++){const a=i/5*TAU;birdPaint.line('#f5edd9',[[-.054,0,0],[-.026,.02,0],[0,0,0],[.026,.02,0],[.054,.006,0]],.0035,new THREE.Matrix4().makeTranslation(Math.sin(a)*.85,.15+Math.cos(a)*.1,Math.cos(a)*.50),8);}birdPaint.finish(gulls,'掠海飞鸟');
 const staticMesh=paint.finish(root,'沙海生活与绿洲凉亭');const stats={terrain:terrain.stats,nature:nature.stats,water:water.stats,landmarks:landmarks.stats,beach:beach.stats,caravan:caravan.stats,cacti:cacti.stats,roaming:roaming.stats,mummies:mummies.stats,oasis:true,boats:1,gulls:5,worlds:5};let disposed=false,lastTime=0,lastNight=0;
 const boatBase=frame(-.39,.94,R+.026),gullBase=frame(.02,.10,R+1.45),rot=new THREE.Quaternion();boatBase.decompose(boat.position,boat.quaternion,boat.scale);gullBase.decompose(gulls.position,gulls.quaternion,gulls.scale);const bq=boat.quaternion.clone(),gp=gulls.position.clone();
 function update(time,env={}){if(disposed)return;lastTime=time;lastNight=env.night||0;nature.update(time,env);water.update(time,env);landmarks.update(time,env);beach.update(time,env);caravan.update(time,env);roaming.update(time,env);mummies.update(time,env);boat.position.set(0,Math.sin(time*.8)*.006,0).applyMatrix4(boatBase);rot.setFromEuler(new THREE.Euler(Math.sin(time*.7)*.025,.4,Math.sin(time*.5)*.035));boat.quaternion.copy(bq).multiply(rot);gulls.position.copy(gp);gulls.rotateY(0);gullBase.decompose(gulls.position,gulls.quaternion,gulls.scale);gulls.rotateY(time*.075);}
 const poseOffsets={caravan:{target:[0,.19,0],eye:[.95,1.30,2.05]},cove:{target:[0,.20,.12],eye:[1.17,2.53,3.72]},treasury:{target:[0,.62,.07],eye:[1.13,1.30,2.67]},kasbah:{target:[0,.31,0],eye:[1.80,1.72,2.68]},oasis:{target:[0,.20,0],eye:[1.5,1.66,2.7]},arch:{target:[0,.30,0],eye:[.98,1.16,2.22]}};
 function getPose(view,aspect=1){if(view==='camel')return roaming.getPose(aspect);if(view==='moon')return mummies.getPose(aspect);const anchor=anchors[view]||anchors.cove,config=poseOffsets[view]||poseOffsets.cove;anchor.updateWorldMatrix(true,false);const fit=Math.max(1,.84/aspect),target=anchor.localToWorld(new THREE.Vector3(...config.target)),eye=config.eye.map((v,i)=>config.target[i]+(v-config.target[i])*fit),position=anchor.localToWorld(new THREE.Vector3(...eye));return{position,target,up:new THREE.Vector3(0,1,0).transformDirection(anchor.matrixWorld)};}
 update(0,{night:0});
 return{root,stats,getPose,update,getState:()=>({time:lastTime,night:lastNight,water:water.getState?.(),roaming:roaming.getState(),mummies:mummies.getState(),stats}),dispose(){if(disposed)return;disposed=true;beach.dispose();caravan.dispose();cacti.dispose();roaming.dispose();mummies.dispose();landmarks.dispose();nature.dispose();water.dispose();terrain.dispose();paint.dispose();boatPaint.dispose();birdPaint.dispose();lampGeometry.dispose();root.removeFromParent();}};
}
