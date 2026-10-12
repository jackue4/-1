from pathlib import Path
p=Path('work/planet-v2/world.js');s=p.read_text(encoding='utf-8')
s=s.replace('sphere = new THREE.SphereGeometry(1, 16, 12)','sphere = new THREE.SphereGeometry(1, 12, 8)')
s=s.replace("  instances(cyl, '#708b51', stems); instances(sphere, '#e9b85f', flowerCenters); ['#eedad0', '#e9b8b6', '#f3dea1'].forEach((c, i) => instances(sphere, c, petals[i]));", "  const smallBlossom=new THREE.SphereGeometry(1,6,4);\n  instances(cyl, '#708b51', stems); instances(smallBlossom, '#e9b85f', flowerCenters); ['#eedad0', '#e9b8b6', '#f3dea1'].forEach((c, i) => instances(smallBlossom, c, petals[i]));")
needle='  // Bake stationary meshes by material.'
a=s.index(needle)
s=s[:a]+'''  // Merge rigid pieces inside moving groups, retaining every animated joint.
  planet.updateMatrixWorld(true);
  function batchRigid(parent,objects){
    const inverse=parent.matrixWorld.clone().invert(),buckets=new Map();
    for(const o of objects){if(!o.isMesh||o.isInstancedMesh)continue;const key=o.material.uuid+'/'+o.castShadow;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o);}
    for(const group of buckets.values()){
      if(group.length<2)continue;
      const parts=group.map(o=>{let g=o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));if(g.index){const old=g;g=g.toNonIndexed();old.dispose();}g.deleteAttribute('uv');return g;});
      const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());if(!geometry)continue;
      const merged=new THREE.Mesh(geometry,group[0].material);merged.castShadow=group[0].castShadow;merged.receiveShadow=true;parent.add(merged);group.forEach(o=>o.removeFromParent());
    }
  }
  for(const f of foliage){const objects=[];f.g.traverse(o=>{if(o.isMesh)objects.push(o);});batchRigid(f.g,objects);}
  for(const c of clouds)batchRigid(c.g,[...c.g.children]);
  for(const p of residents)batchRigid(p.body,[...p.body.children]);
  for(const a of animals)batchRigid(a.body,[...a.body.children]);
''' +s[a:]
p.write_text(s,encoding='utf-8')
