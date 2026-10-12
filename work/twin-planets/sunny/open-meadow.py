from pathlib import Path
p=Path('work/planet-v2/world.js');s=p.read_text(encoding='utf-8')
s=s.replace('g.scale.setScalar(size);stats.trees++;','g.scale.set(size,size*.82,size);stats.trees++;',1)
s=s.replace('made < 49','made < 10').replace("if (terrainHeight(nn) < R + .035 ||", "if (nn.distanceTo(direction(.32,.08))<.68 || terrainHeight(nn) < R + .035 ||",1)
s=s.replace('tree(nn, .75 + rng() * .45, made % 19 === 0)','tree(nn, .57 + rng() * .18, made % 9 === 0)')
a=s.index('  // Deliberate groves');b=s.index('  const crownMaterial',a)
s=s[:a]+'''  // A few small trees frame distant edges; the central meadow stays open.
  [[.79,-.49],[.82,.92],[-.25,-.68]].forEach(([lat,lon],i)=>tree(direction(lat,lon),.60+i*.04,i===2));
''' +s[b:]
s=s.replace('[.25,1.08,2.2,3.05,4.35,5.1].forEach','[.25,3.05,4.35].forEach').replace('.82+(i%3)*.07','.56+(i%3)*.04')
s=s.replace('[.6,2.4,4.5].forEach(angle=>palm(shoreNormal(1,angle,.09),.85))','[2.4].forEach(angle=>palm(shoreNormal(1,angle,.09),.6))')
s=s.replace("[0, .07, 0], [.15, .12, .13]","[0, .04, 0], [.12, .065, .11]")
# Simple glowing path lanterns: no extra shadow-casting point lights.
a=s.index('  // Merge rigid pieces')
s=s[:a]+'''  const lanternGlow=new THREE.MeshToonMaterial({color:'#ffe7a8',emissive:'#ffc577',emissiveIntensity:.12,gradientMap});glowMaterials.push(lanternGlow);
  for(let i=0;i<10;i++){
    const lon=.12+i*.628,n=direction(pathLat(lon)-.065,lon),g=anchor(n);
    mesh(g,cyl,'#8d9579',[0,.062,0],[.013,.124,.013]);
    mesh(g,box,lanternGlow,[0,.138,0],[.047,.067,.047],false);
    mesh(g,cone,'#9aa483',[0,.183,0],[.044,.03,.044]);
  }
''' +s[a:]
p.write_text(s,encoding='utf-8')
p=Path('work/planet-v2/landscape.js');s=p.read_text(encoding='utf-8').replace('size*.38:size*.73','size*.25:size*.47').replace('size*.61,size*.48,size*.57','size*.66,size*.31,size*.60')
s=s.replace("if(i%8>4)continue;","if(i%8>2)continue;").replace("if(i%8===4)continue;","if(i%8===2)continue;")
p.write_text(s,encoding='utf-8')
p=Path('work/planet-v2/page.html');s=p.read_text(encoding='utf-8').replace('林间漫游','草原漫游').replace('晴日林间','晴日草原').replace('WOODLAND DAYS / 01','MEADOW DAYS / 02').replace('上午十点半','早上八点半')
s=s.replace('    <div class="sun-wash"', '''    <div class="sky-art" aria-hidden="true"><div class="sky-cloud cloud-a"></div><div class="sky-cloud cloud-b"></div><div class="sky-sun"></div><div class="sky-moon"></div></div>
    <div class="sun-wash"''')
s=s.replace('    <div id="scene"', '''    <div class="time-presets" role="group" aria-label="光照时段"><button data-time="8.5" aria-pressed="true">☀ 早晨</button><button data-time="17.5" aria-pressed="false">◒ 黄昏</button><button data-time="22" aria-pressed="false">☾ 夜晚</button><button id="natural-time" aria-pressed="false">◷ 随今日</button></div>
    <div id="scene"''')
s=s.replace('拖动环顾这片绿意','拖动探索星球每一面')
s=s.replace('拖拽星球旋转，滚轮或双指缩放。','草原漫游可向任意方向持续拖拽，探索整颗星球；滚轮或双指缩放。方向键也能转动星球，Home 回到初始视角。')
p.write_text(s,encoding='utf-8')
