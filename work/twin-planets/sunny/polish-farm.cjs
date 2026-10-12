const fs=require('fs'),p='work/planet-v2/';function e(n,a,b){let s=fs.readFileSync(p+n,'utf8');if(!s.includes(a))throw Error(a);fs.writeFileSync(p+n,s.replace(a,b));}
e('layout.js','.30*Math.exp(-((d/.55)**2))','.36*Math.exp(-((d/.68)**2))');
e('world.js','if (terrainHeight(nn) < R + .05) continue;','if (terrainHeight(nn) < R + .05 || farmReserved(nn,.07)) continue;');
e('world.js','house.rotation.y = index * .75;',"const facing=direction(.32,.08).sub(direction(site.lat,site.lon)).applyQuaternion(g.quaternion.clone().invert()); house.rotation.y = Math.atan2(facing.x,facing.z);");
e('farm-scene.js',"const leafMat=new THREE.MeshToonMaterial({color:'white',gradientMap})","const leafMat=new THREE.MeshToonMaterial({color:'white',gradientMap,side:THREE.DoubleSide})");
e('farm-scene.js',"const shed=anchor(.55,-.23)","const shed=anchor(.54,-.31)");
e('farm-scene.js',"const ring=new THREE.Mesh",`// Keep each plot independently pickable while batching its tiny border details.
  function batchLocal(group,exclude=[]){const pieces=[];for(const m of [...group.children]){if(!m.isMesh||exclude.includes(m))continue;m.updateMatrix();const g=m.geometry.clone().applyMatrix4(m.matrix),c=m.material.color,a=new Float32Array(g.attributes.position.count*3);for(let i=0;i<a.length;i+=3){a[i]=c.r;a[i+1]=c.g;a[i+2]=c.b;}g.setAttribute('color',new THREE.BufferAttribute(a,3));pieces.push(g);m.removeFromParent();}const mesh=new THREE.Mesh(mergeGeometries(pieces),new THREE.MeshToonMaterial({vertexColors:true,gradientMap}));mesh.receiveShadow=true;group.add(mesh);pieces.forEach(g=>g.dispose());}
  plotRoots.forEach((g,i)=>batchLocal(g,[soils[i]]));
  const ring=new THREE.Mesh`);
e('farm-scene.js','picks.push(orchard);','batchLocal(orchard);picks.push(orchard);');
e('page.html','❧ 草原漫游','❧ 晴日菜园');
e('page.html','这里的天气不代表现实天气。','这里的天气不代表现实天气。农田始终按自然天气生长，预览只影响观景。');
e('page.html','页面关闭后不在后台运行，也不会补演错过的事件。','页面关闭后不在后台运行，也不会补演错过的事件；重新打开会结算最多 24 小时的作物生长，成熟作物不会腐烂。');
e('page.html','<p>这是一个幻想生态：','<p>在「菜园」选中一块田，选择种子、播种、浇水，等果实成熟后收获。在「丰收厨房」出售收成、补充种子或做便当；「邻居心愿」可以换取叶币、扩建和邀请助手。萝卜种子可以免费领取。棉棉会到田边浇水，其他伙伴也有自己的闲暇时光。</p><p>这是一个幻想生态：');
