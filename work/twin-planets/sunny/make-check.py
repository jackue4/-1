from pathlib import Path
s=Path('work/planet-v2/check-composition.js').read_text(encoding='utf-8')
s=s.replace("import {createWorld}","import {createWorld,direction}")
s=s.replace('world.planet.rotation.z=-.09;',"world.planet.quaternion.setFromUnitVectors(direction(.30,.23),new THREE.Vector3(0,1,0));world.planet.userData.closeView=true;world.update(1/60,14,{rain:0,snow:0,cloud:.2,wind:.35,night:0,mist:0});")
s=s.replace("if(o.material?.isMeshToonMaterial)","if(o.material?.isMeshToonMaterial||o.material?.isMeshStandardMaterial)")
s=s.replace("for(let i=0;i<im.count;i++){const mesh=new THREE.Mesh(im.geometry,im.material),mat=new THREE.Matrix4();im.getMatrixAt(i,mat);mat.decompose(mesh.position,mesh.quaternion,mesh.scale);im.parent.add(mesh);}","for(let i=0;i<im.count;i+=im.name==='Wind meadow'?35:im.count>100?4:1){const color=new THREE.Color();im.getColorAt(i,color);const material=im.material.clone();material.color.multiply(color);const mesh=new THREE.Mesh(im.geometry,material),mat=new THREE.Matrix4();im.getMatrixAt(i,mat);mat.decompose(mesh.position,mesh.quaternion,mesh.scale);im.parent.add(mesh);}")
s=s.replace('camera.position.set(4.7,3.2,8.8).multiplyScalar(1.06);camera.lookAt(0,.12,0);','camera.position.set(1.85,5.45,3.25);camera.lookAt(0,2.67,0);')
s=s.replace('composition.svg','composition-meadow.svg').replace('composition.png','composition-meadow.png')
Path('work/planet-v2/check-meadow.js').write_text(s,encoding='utf-8')
