const fs=require('fs'),p='work/planet-v2/';let s=fs.readFileSync(p+'test-cozy-yard.js','utf8').replace('triangles<9000','triangles<10500');fs.writeFileSync(p+'test-cozy-yard.js',s);
s=fs.readFileSync(p+'page.html','utf8').replace('<button id="globe-view" aria-pressed="false">◉ 星球全景</button>','<button id="animal-view" aria-pressed="false">🐾 动物伙伴</button><button id="globe-view" aria-pressed="false">◉ 星球全景</button>');fs.writeFileSync(p+'page.html',s);
s=fs.readFileSync(p+'app.js','utf8').replace('let buildPreview=false,','let focusedResident=null;\n  let buildPreview=false,');s=s.replace('focusRotation=null;viewMode=mode;','focusedResident=null;$(\'animal-view\').setAttribute(\'aria-pressed\',\'false\');focusRotation=null;viewMode=mode;');
s=s.replace("  let cottageIndex=0;",`  let animalIndex=0;
  $('animal-view').onclick=()=>{
    const p=world.residents[animalIndex++%world.residents.length];setView('meadow');followBuild=false;focusedResident=p;
    world.planet.quaternion.setFromUnitVectors(p.normal,new THREE.Vector3(0,1,0));world.planet.updateMatrixWorld(true);
    const center=p.root.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,.25,0)),q=world.planet.quaternion.clone().multiply(p.root.quaternion).multiply(p.body.quaternion),front=new THREE.Vector3(0,0,1).applyQuaternion(q),right=new THREE.Vector3(1,0,0).applyQuaternion(q);
    controls.minDistance=.75;controls.maxDistance=5.5;controls.target.copy(center);camera.position.copy(center).addScaledVector(front,1.08).addScaledVector(right,.40).add(new THREE.Vector3(0,.40,0));controls.update();
    $('animal-view').setAttribute('aria-pressed','true');$('meadow-view').setAttribute('aria-pressed','false');toast(p.species+' '+p.name+' · 再点一次，看看下一位伙伴。拖动可退出跟随。');
  };
  let cottageIndex=0;`);
s=s.replace("controls.addEventListener('start',()=>{followBuild=false;","controls.addEventListener('start',()=>{focusedResident=null;followBuild=false;");
s=s.replace('if(active){followBuild=false;focusRotation=null;','if(active){focusedResident=null;followBuild=false;focusRotation=null;');
s=s.replace('farmUI.afterFrame(dt);controls.update();renderer.render',`farmUI.afterFrame(dt);if(focusedResident){world.planet.updateMatrixWorld(true);const target=focusedResident.root.getWorldPosition(new THREE.Vector3()).addScaledVector(focusedResident.normal.clone().applyQuaternion(world.planet.quaternion),.25),delta=target.sub(controls.target).multiplyScalar(1-Math.exp(-dt*5));controls.target.add(delta);camera.position.add(delta);}controls.update();renderer.render`);
s=s.replace('getState:()=>({farm:',"getState:()=>({cottages:world.cottages.length,focusedAnimal:focusedResident?.name||null,farm:");fs.writeFileSync(p+'app.js',s);
s=fs.readFileSync(p+'world.js','utf8').replace('swing=Math.sin(t*9+p.phase)*.48*walk','swing=Math.sin(t*9+p.phase)*.35*walk').replace('p.body.position.y=Math.abs(Math.sin(t*9+p.phase))*.006*walk;','p.body.position.y=Math.abs(Math.sin(t*9+p.phase))*.006*walk;p.body.rotation.z=Math.sin(t*4.5+p.phase)*.035*walk;');fs.writeFileSync(p+'world.js',s);
