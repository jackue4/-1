from pathlib import Path
p=Path('work/planet-v2/world.js');s=p.read_text(encoding='utf-8')
s=s.replace("import { createLandscape }", "import { createVillager } from './villagers.js';\nimport { createBuildScene } from './build-scene.js';\nimport { BUILD_DURATION } from './construction.js';\nimport { createLandscape }")
s=s.replace('createWorld(savedGrowth = 0)','createWorld(savedGrowth = 0, initialConstruction = BUILD_DURATION)')
s=s.replace("new THREE.Color('#b4cc79'), high = new THREE.Color('#8aba66')","new THREE.Color('#8ab85e'), high = new THREE.Color('#7eae59')")
s=s.replace('diffuseColor.rgb*=.95+meadowPatch*.13;','diffuseColor.rgb*=.98+meadowPatch*.055;')
s=s.replace('  function house(site, index) {', "  const buildTargets={path:{id:'path',kind:'path',normal:direction(.29,.08),object:landscape.path}};\n  function house(site, index) {")
a=s.index('  function house(');b=s.index('  houseSites.forEach(house);',a)
chunk=s[a:b].replace('    return g;',"    buildTargets['house'+index]={id:'house'+index,kind:'house',normal:direction(site.lat,site.lon),object:house,root:g};\n    return g;")
s=s[:a]+chunk+s[b:]
s=s.replace("  // Jetty on the main pond", "  mesh(mill,cyl,'#c7b792',[0,.023,0],[.19,.046,.19]);\n  buildTargets.mill={id:'mill',kind:'mill',normal:direction(.59,-.11),object:mill,root:millRoot};\n\n  // Jetty on the main pond")
a=s.index('  const rippleMat =')
s=s[:a]+"  const dock=new THREE.Group();for(const o of [...lakeFrame.children])dock.add(o);lakeFrame.add(dock);buildTargets.dock={id:'dock',kind:'dock',normal:shoreNormal(0,2.05,.08),object:dock,root:dock};\n"+s[a:]
a=s.index('  // Residents move');b=s.index('  const animals=[];',a)
s=s[:a]+'''  // Original animal villagers share a small rig for walking, carrying and building.
  for(let i=0;i<6;i++){
    const root=new THREE.Group();planet.add(root);
    const villager=createVillager(i,{mesh,sphere,cyl,cone,box,stem});root.add(villager.body);
    const lon=.04+i*1.04,nn=direction(pathLat(lon),lon);moveOnSurface(root,nn);
    residents.push({...villager,root,i,lon,normal:nn.clone(),phase:rng()*6,heading:0,activity:'散步'});
  }
''' +s[b:]
s=s.replace("[x,.218,.078],[.015,.071,.018]","[x,i===0?.184:.218,.078],[.015,i===0?.019:.071,.018]")
a=s.index('  // Merge rigid pieces')
s=s[:a]+"  const construction=createBuildScene({planet,targets:buildTargets,landscape,mesh,box,cyl,anchor,direction,height:terrainHeight,R});construction.setProgress(initialConstruction);\n"+s[a:]
s=s.replace('  for(const p of residents)batchRigid(p.body,[...p.body.children]);', '  for(const p of residents){batchRigid(p.body,[...p.body.children]);batchRigid(p.head,[...p.head.children]);batchRigid(p.tail,[...p.tail.children]);}\n  for(const s of construction.structures){s.groups.forEach(g=>batchRigid(g,g.children.filter(o=>!snowCaps.includes(o))));batchRigid(s.frame,[...s.frame.children]);}')
s=s.replace('const dynamic=new Set([land,','const dynamic=new Set([...construction.dynamicRoots,land,')
s=s.replace("    residents.forEach(p=>{", "    construction.update(t,env.buildPaused);\n    residents.forEach(p=>{")
s=s.replace('      const target=direction(lat,lon),previous=p.normal.clone();', '      const builder=construction.workerPose(p.i,env.buildPaused);\n      const target=builder?builder.normal:direction(lat,lon),previous=p.normal.clone();')
s=s.replace('p.normal.lerp(target,1-Math.exp(-dt*.8))','p.normal.lerp(target,1-Math.exp(-dt*(builder?3:.8)))')
s=s.replace('p.body.rotation.y=p.heading;', "if(builder&&builder.mode==='build'){const face=builder.lookAt.clone().sub(p.normal).applyQuaternion(p.root.quaternion.clone().invert());p.heading=Math.atan2(face.x,face.z);}p.body.rotation.y=p.heading;")
s=s.replace('p.umbrella.visible=env.rain>.35;', '''p.umbrella.visible=env.rain>.35;
      p.carry.visible=builder?.mode==='carry';p.hammer.visible=builder?.mode==='build';
      if(p.carry.visible){p.limbs[1].rotation.x=p.limbs[3].rotation.x=-1.18;}
      if(p.hammer.visible){p.limbs[3].rotation.x=-.8+Math.sin(t*7+p.phase)*.7;p.body.position.y=Math.max(0,Math.sin(t*7+p.phase))*.006;}
      p.head.rotation.z=Math.sin(t*1.7+p.phase)*.035;p.tail.rotation.y=Math.sin(t*2.1+p.phase)*.14;
      p.activity=builder?({carry:'正在搬木料',build:'正在敲敲打打',walk:'去取下一份材料',rest:'休息一会儿'})[builder.mode]:'在岛上散步';''')
s=s.replace('return {planet,land,ocean,','return {planet,construction,land,ocean,')
s=s.replace('dispose(){meadow.dispose();','dispose(){construction.dispose();meadow.dispose();')
p.write_text(s,encoding='utf-8')
p=Path('work/planet-v2/ecology.js');s=p.read_text(encoding='utf-8');s="import {restoreConstruction} from './construction.js';\n"+s
s=s.replace("return { version: 2, day: today,", "return { version: 2, construction:restoreConstruction(valid?saved.construction:null), day: today,")
p.write_text(s,encoding='utf-8')
p=Path('work/planet-v2/app.js');s=p.read_text(encoding='utf-8')
s=s.replace("import { rotateSurface,", "import { BUILD_DURATION, constructionAt, advanceConstruction } from './construction.js';\nimport { rotateSurface,")
s=s.replace('frameId, lastShadowAt=-Infinity;','frameId;')
s=s.replace('renderer.shadowMap.autoUpdate=false','renderer.shadowMap.autoUpdate=true')
s=s.replace('createWorld(state.growth)','createWorld(state.growth,state.construction.elapsed)')
s=s.replace("if(now-lastShadowAt>1000/15){renderer.shadowMap.needsUpdate=true;lastShadowAt=now;}", '')
p.write_text(s,encoding='utf-8')
