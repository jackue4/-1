const fs=require('fs');function edit(p,fn){fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));}
edit('work/planet-v2/world.js',s=>s.replace('residents: 6','residents: VILLAGERS.length'));
edit('work/planet-v2/test.js',s=>s.replace('world.residents.length,6','world.residents.length,4').replace('map(p=>p.species)).size,6','map(p=>p.species)).size,4').replaceAll('i<6;i++','i<4;i++').replace('two or three stable members','one or two stable members').replace('crew.length===2||crew.length===3','crew.length===1||crew.length===2'));
edit('work/planet-v2/test-app.mjs',s=>s.replace('map(p=>p.species)).size,6','map(p=>p.species)).size,4').replace('i<6;i++','i<4;i++').replace('animalNames.size,6','animalNames.size,4').replace('six-animal','four-animal'));
edit('work/planet-v2/test-cozy-yard.js',s=>s.replace('All six residents','All four residents').replace('map(p=>p.species)).size,6','map(p=>p.species)).size,4'));
edit('work/planet-v2/test-evening-life.js',s=>s.replaceAll('inside===6','inside===4').replaceAll('inside,6','inside,4').replaceAll('six','four'));
