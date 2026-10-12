from pathlib import Path
p=Path('work/planet-v2/landscape.js');s=p.read_text(encoding='utf-8').replace("import {WIND_GLSL}","import {enhanceFoliage}")
s=s.replace('houses,uniforms){','houses,uniforms,gradientMap){')
s=s.replace("const sphere=new THREE.IcosahedronGeometry(1,1),leaf=", "const roundBush=new THREE.SphereGeometry(1,8,6),petal=new THREE.CircleGeometry(1,6).rotateX(-Math.PI/2);\n  const sphere=new THREE.IcosahedronGeometry(1,1),leaf=")
s=s.replace("['#246b52','#337e55','#55964e','#70ac57','#94b95f']","['#658f63','#7da267','#99b971','#b2c984','#a5c57b']")
s=s.replace("edge?'#8fac57':'#cfac76'","edge?'#abc475':'#ddc699'")
s=s.replace('new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide})','new THREE.MeshToonMaterial({vertexColors:true,gradientMap,side:THREE.DoubleSide})')
a=s.index('  function shrub(');b=s.index('  // Shrubs form banks',a)
s=s[:a]+'''  function shrub(n,size){
    counts.shrubs++;
    for(let k=0;k<7;k++){
      const a=k*2.399,r=k<5?size*.52:size*.16,y=k<5?size*.38:size*.73;
      add('shrub leaves',roundBush,n,[Math.sin(a)*r,y,Math.cos(a)*r],[size*.61,size*.48,size*.57],greens[k<5?k%3:3],a,true);
    }
  }
''' +s[b:]
s=s.replace("add('shrub leaves',leaf,n,[Math.sin(j*3)","add('flower leaves',leaf,n,[Math.sin(j*3)")
s=s.replace("add('wildflower petals',leaf,","add('wildflower petals',petal,")
a=s.index('  const bend=');b=s.index('  for(const [name,b]',a);s=s[:a]+s[b:]
s=s.replace("new THREE.MeshStandardMaterial({color:'white',roughness:.87})","new THREE.MeshToonMaterial({color:'white',gradientMap,side:name==='wildflower petals'?THREE.DoubleSide:THREE.FrontSide})")
s=s.replace('im.castShadow=true;','im.castShadow=[\'fence timber\',\'fence rails\',\'shore boulders\'].includes(name);')
a=s.index('    if(b.moving){');b=s.index('\n    planet.add(im)',a)
s=s[:a]+'''    if(b.moving){const depth=enhanceFoliage(material,uniforms);im.customDepthMaterial=depth;depths.push(depth);}
''' +s[b:]
p.write_text(s,encoding='utf-8')
p=Path('work/planet-v2/app.js');s=p.read_text(encoding='utf-8')
s=s.replace("import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';\n",'')
s=s.replace('Math.min(devicePixelRatio,1.65)','Math.min(devicePixelRatio,1.25)')
s=s.replace('sun.shadow.mapSize.set(3072,3072)','sun.shadow.mapSize.set(1024,1024)')
a=s.index('  const room=new RoomEnvironment()');b=s.index('  // A soft floating shadow',a);s=s[:a]+s[b:]
s=s.replace('envTarget.dispose();','')
s=s.replace('sun.intensity=(2.75*(1-env.night)+.65*env.night)','sun.intensity=(1.85*(1-env.night)+.55*env.night)')
s=s.replace('hemi.intensity=.9*(1-env.night)+.65*env.night','hemi.intensity=1.15*(1-env.night)+.65*env.night')
s=s.replace('renderer.toneMappingExposure=1.02+env.night*.19','renderer.toneMappingExposure=1.08+env.night*.13')
# Limit shadow work to 15 Hz; animation of characters, grass and water stays continuous.
s=s.replace('renderer.shadowMap.type=THREE.PCFSoftShadowMap;','renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;')
s=s.replace('frameId;','frameId, lastShadowAt=-Infinity;')
s=s.replace('world.update(dt,elapsed,env);controls.update();renderer.render(scene,camera);','world.update(dt,elapsed,env);controls.update();if(now-lastShadowAt>1000/15){renderer.shadowMap.needsUpdate=true;lastShadowAt=now;}renderer.render(scene,camera);')
# Avoid rebuilding postcard markup twice a second. Update only when travel state changes.
s=s.replace("  function renderTravel(now=Date.now()){", "  let travelSignature='';\n  function renderTravel(now=Date.now()){")
s=s.replace("    $('pet-name').textContent=t.name;", "    const signature=[t.name,t.clovers,t.snacks,t.charms,t.postcards.length,t.postcards[0]?.at,t.destination,away,Math.ceil(left/1000)].join('/');if(signature===travelSignature)return;travelSignature=signature;\n    $('pet-name').textContent=t.name;")
s=s.replace("cameraDistance:camera.position.distanceTo(controls.target),", "cameraDistance:camera.position.distanceTo(controls.target),style:'painted-animation',grassBlades:world.meadow.count,shadowResolution:sun.shadow.mapSize.x,")
p.write_text(s,encoding='utf-8')
