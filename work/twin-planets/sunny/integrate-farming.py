from pathlib import Path
p=Path(__file__).parent
def edit(name,old,new):
    f=p/name;s=f.read_text(encoding='utf-8');assert old in s,(name,old[:90]);f.write_text(s.replace(old,new),encoding='utf-8')
edit('world.js',"import * as THREE from 'three';","import * as THREE from 'three';\nimport {HOUSE_SITES,MILL_SITE,pathLat,farmReserved} from './layout.js';\nimport {createFarmScene} from './farm-scene.js';")
edit('world.js','const houseSites = [{ lat: .59, lon: .48 }, { lat: .15, lon: -.62 }, { lat: .58, lon: 1.58 }, { lat: -.5, lon: -1.1 }, { lat: .48, lon: 2.83 }];\n  const pathLat = lon => .29 + .095 * Math.sin(lon * 3);','const houseSites = HOUSE_SITES;')
edit('world.js','direction(.59, -.11)','direction(MILL_SITE.lat,MILL_SITE.lon)')
edit('world.js','direction(.59,-.11)','direction(MILL_SITE.lat,MILL_SITE.lon)')
edit('world.js','const garden = anchor(direction(.03, -.02));','const garden = anchor(direction(-.20, -.34));')
edit('world.js','if (terrainHeight(nn) < R + .04) continue;','if (terrainHeight(nn) < R + .04 || farmReserved(nn,.02)) continue;')
edit('world.js','const dynamic=new Set([','const farm=createFarmScene({planet,direction,height:terrainHeight,gradientMap:vegetationRamp,uniforms:natureUniforms});\n  const dynamic=new Set([farm.root,')
edit('world.js','marine.update(dt,t,natureUniforms.uWind.value);','marine.update(dt,t,natureUniforms.uWind.value);farm.update(t);')
edit('world.js',"const builder=construction.workerPose(p.i,env.buildPaused||sheltered),leisure=islandLife.pose(p.i,t,env);","const helper=env.farmJobs?.get(p.i),builder=helper?null:construction.workerPose(p.i,env.buildPaused||sheltered),leisure=islandLife.pose(p.i,t,env);")
edit('world.js','const target=builder?builder.normal:','const target=helper?helper.normal:builder?builder.normal:')
edit('world.js','const settled=!builder&&!encounter','const settled=!helper&&!builder&&!encounter')
edit('world.js','p.working=!!builder;','''p.watering.visible=!!helper&&helper.kind==='water';p.basket.visible=!!helper&&helper.kind==='harvest';
      if(helper&&distance<.04){const face=helper.lookAt.clone().sub(p.normal).applyQuaternion(p.root.quaternion.clone().invert());p.heading=Math.atan2(face.x,face.z);p.body.rotation.y=p.heading;p.limbs[3].rotation.x=-.8+Math.sin(t*4)*.12;p.head.rotation.x=.18;p.watering.rotation.z=-.3+Math.sin(t*3)*.08;p.waterDrops.visible=helper.kind==='water';}else p.waterDrops.visible=false;
      p.working=!!builder||!!helper;''')
edit('world.js',"p.activity=builder?", "p.activity=helper?(distance>.04?'走向菜园':helper.kind==='water'?'给菜苗浇水':'摘下成熟果实'):builder?")
edit('world.js','return {planet,construction,','return {planet,farm,construction,')
edit('world.js','dispose(){canopyDetail.dispose();','dispose(){farm.dispose();canopyDetail.dispose();')
for name in ['nature.js','landscape.js']:
    edit(name,"import * as THREE from 'three';","import * as THREE from 'three';\nimport {pathLat,farmReserved} from './layout.js';")
edit('nature.js','terrainHeight(n)>radius+.111&&Math.abs(lat-(.29+.095*Math.sin(lon*3)))','!farmReserved(n,.016)&&terrainHeight(n)>radius+.111&&Math.abs(lat-pathLat(lon))')
edit('landscape.js','  const pathLat=lon=>.29+.095*Math.sin(lon*3);\n','')
edit('landscape.js','return height(n)>R+.105&&','return !farmReserved(n,.035)&&height(n)>R+.105&&')
edit('villagers.js','  return{...identity,body,head,tail,limbs,carry,hammer,umbrella};','''  const watering=new THREE.Group();limbs[3].add(watering);watering.position.set(0,-.12,.06);
  mesh(watering,cyl,'#8ebbb2',[0,0,0],[.033,.046,.032]);stem(watering,[.02,0,0],[.078,.016,.01],.011,'#8ebbb2');mesh(watering,sphere,'#d4ddbd',[.08,.016,.01],[.019,.008,.017]);watering.visible=false;
  const waterDrops=new THREE.Group();watering.add(waterDrops);for(let j=0;j<5;j++)mesh(waterDrops,sphere,'#b9e6e4',[.082+j*.004,-.015-j*.018,.01+(j%2)*.01],[.003,.008,.003]);waterDrops.visible=false;
  const basket=new THREE.Group();body.add(basket);basket.position.set(0,.14,.13);mesh(basket,cyl,'#d1ac72',[0,0,0],[.066,.055,.052]);for(let j=0;j<3;j++)mesh(basket,sphere,'#e6866e',[(j-1)*.032,.033,0],[.023,.025,.025]);basket.visible=false;
  return{...identity,body,head,tail,limbs,carry,hammer,umbrella,watering,waterDrops,basket};''')
edit('ecology.js',"import {restoreConstruction} from './construction.js';","import {restoreConstruction} from './construction.js';\nimport {restoreFarm} from './farming.js';")
edit('ecology.js','  if (travel.awayUntil && travel.awayUntil <= now.getTime()) travel.awayUntil = 0;','''  for(const k of ['clovers','snacks','charms'])if(!Number.isFinite(travel[k]))travel[k]=TRAVEL_DEFAULTS[k];
  travel.postcards=travel.postcards.filter(c=>c&&typeof c.place==='string'&&typeof c.text==='string'&&Number.isFinite(c.at));''')
edit('ecology.js','return { version: 2, construction:','return { version: 2, farm:restoreFarm(valid?saved.farm:null,now.getTime()), construction:')
with (p/'ecology.js').open('a',encoding='utf-8') as f:f.write('''
// Split offline growth at actual daily weather boundaries, not at render frames.
export function weatherSegments(from,to){
  const result=[];let cursor=from;
  while(cursor<to){const date=new Date(cursor),day=makeDay(date),midnight=new Date(date);midnight.setHours(24,0,0,0);let end=Math.min(to,midnight.getTime());
    for(const slot of day.slots){const at=new Date(date);at.setHours(0,slot.minute,0,0);if(at.getTime()>cursor)end=Math.min(end,at.getTime());}
    result.push({seconds:(end-cursor)/1000,rain:weatherAt(day,date).type==='rain'});cursor=end;
  }return result;
}
''')
edit('app.js',"import * as THREE from 'three';","import * as THREE from 'three';\nimport {createFarmUI} from './farm-ui.js';\nimport {rewardSeeds} from './farming.js';")
edit('app.js','buildPreview=false,followBuild=true','buildPreview=false,followBuild=false')
edit('app.js','t.trips++;t.clovers+=2;t.awayUntil=0;','rewardSeeds(state.farm,t.awayUntil);t.trips++;t.clovers+=2;t.awayUntil=0;')
edit('app.js','的明信片。`);','的明信片，还有 2 粒草莓种子。`);')
edit('app.js','controls.target.set(0,2.67,0);camera.position.set(1.2,5.75,1.65);','controls.target.set(0,2.67,0);camera.position.set(.45,5.95,2.15);')
edit('app.js','[world.land,...world.residents','[world.land,world.ocean,...world.farm.picks,...world.residents')
edit('app.js','if(!hit||hit.object===world.land)return;','''if(!hit||hit.object===world.land||hit.object===world.ocean)return;
    for(let o=hit.object;o;o=o.parent){if(Number.isInteger(o.userData.plotId)){farmUI.select(o.userData.plotId);return;}if(o.userData.farmPlace){farmUI.activate(o.userData.farmPlace);return;}}''')
edit('app.js',"  setView('meadow');updateUi(new Date(),true);",'''  const farmUI=createFarmUI({getState:()=>state,world,save,toast,renderTravel,focus(place){setView('meadow');followBuild=false;buildUiSignature='';if(place==='orchard'){world.planet.quaternion.setFromUnitVectors(direction(.92,.46),new THREE.Vector3(0,1,0));controls.update();}}});
  setView('meadow');updateUi(new Date(),true);''')
edit('app.js','world.update(dt,elapsed,{...env,buildPaused:','const farmJobs=farmUI.beforeFrame(dt,elapsed,env);world.update(dt,elapsed,{...env,farmJobs,buildPaused:')
edit('app.js','!!restReason()});controls.update();renderer.render','!!restReason()});farmUI.afterFrame(dt);controls.update();renderer.render')
edit('app.js','getState:()=>({viewMode,','getState:()=>({farm:JSON.parse(JSON.stringify(state.farm)),viewMode,')
# Avoid embedding saved text as HTML in the postcard list.
edit('app.js','item.innerHTML=`<span class="postcard-stamp">${card.icon}</span><div><strong>${card.place}</strong><small>${new Date(card.at).toLocaleDateString(\'zh-CN\',{month:\'numeric\',day:\'numeric\'})}</small><p>${card.text}</p></div>`;',"const stamp=document.createElement('span'),body=document.createElement('div'),title=document.createElement('strong'),date=document.createElement('small'),text=document.createElement('p');stamp.className='postcard-stamp';stamp.textContent=card.icon||'💌';title.textContent=card.place;date.textContent=new Date(card.at).toLocaleDateString('zh-CN',{month:'numeric',day:'numeric'});text.textContent=card.text;body.append(title,date,text);item.append(stamp,body);")
edit('test.js',"import assert from 'node:assert/strict';","import assert from 'node:assert/strict';\nimport {pathLat,PLOT_SITES,farmReserved} from './layout.js';")
edit('test.js','direction(.29+.095*Math.sin(lon*3),lon)','direction(pathLat(lon),lon)')
edit('test.js','(.29+.095*Math.sin(lon*3))','pathLat(lon)')
