const fs=require('node:fs'),path=require('node:path');
const dir=path.join(__dirname,'sakura-planet');
function edit(name,changes){let s=fs.readFileSync(path.join(dir,name),'utf8');for(const [from,to]of changes){if(!s.includes(from))throw Error(name+': missing '+from.slice(0,70));s=s.replaceAll(from,to);}fs.writeFileSync(path.join(dir,name),s);}
edit('ecology.js',[
 ["import {restoreConstruction}","import {BUILD_DURATION,restoreConstruction}"],
 ["'little-bloom.ecosystem.v2'","'little-bloom.sakura.ecosystem.v1'"],
 ['restoreConstruction(valid?saved.construction:null)','restoreConstruction(valid?saved.construction:{elapsed:BUILD_DURATION})'],
 ["color: '#d9f1f8'","color: '#e9e5ed'"],["color: '#e1f0f5'","color: '#e9e6e9'"],
 ["color: '#cce5ed'","color: '#d6dce5'"],["color: '#e2f0ed'","color: '#e9e4e6'"],
 ['阳光晒暖了沙滩，海风捎来一点咸甜。','花开得正好。风经过时，会替你捎走一片温柔。'],
 ['树冠轻轻摇晃，花瓣沿着小路旅行。','樱花轻轻落下，把没说完的话交给春风。']
]);
edit('world.js',[
 ["import {createFishingBay}","import {createSakuraGarden} from './sakura-garden.js';\nimport {createFishingBay}"],
 ["'#ebd9aa'","'#e7d1bc'"],["'#9fb967'","'#a7b786'"],["'#799e56'","'#819e75'"],
 ["'#77bfac'","'#92c9c6'"],["'#328eaa'","'#648fac'"],
 ["color:'#c3b18d'","color:'#907880'"],["color:'#a28b67'","color:'#715e69'"],
 ['function tree(normal,size,pink=false){','function tree(normal,size,pink=true){'],
 ['createClusterLayout(730+stats.trees*137,pink)','createClusterLayout(730+stats.trees*137,true)'],
 ['[.25,3.05,4.35].forEach((angle,i)=>palm(shoreNormal(0,angle,.095),.56+(i%3)*.04));[2.4].forEach(angle=>palm(shoreNormal(1,angle,.09),.6));','[.25,3.05,4.35].forEach((angle,i)=>tree(shoreNormal(0,angle,.13),.47+(i%3)*.03));[2.4].forEach(angle=>tree(shoreNormal(1,angle,.13),.52));'],
 ['const meadowPollen=createMeadowPollen(planet,terrainHeight,R);','const meadowPollen=createMeadowPollen(planet,terrainHeight,R);\n  const sakuraGarden=createSakuraGarden({planet,height:terrainHeight,R,canopy,uniforms:natureUniforms,gradientMap:vegetationRamp});'],
 ['meadowPollen.update(t,env);','meadowPollen.update(t,env);sakuraGarden.update(t,env);'],
 ['return {planet,fishing,farm,','return {planet,sakuraGarden,fishing,farm,'],
 ['dispose(){pathLights.dispose();','dispose(){sakuraGarden.dispose?.();pathLights.dispose();']
]);
edit('landscape.js',[
 ["'#abc475':'#ddc699'","'#b4bf93':'#e2c8bd'"],
 ["['#eee3a8','#ecebd4','#bebcdf','#e7b2bc','#ebca9c']","['#fff0e7','#f3f0da','#d2c4e9','#edb5cb','#eecfd3']"]
]);
edit('cottages.js',[
 ["['海风小屋','薄荷邮局','花间茶屋','贝壳工坊','星光书屋']","['春风茶屋','花信邮局','樱下小屋','花瓣工坊','星光书屋']"],
 ["const wood='#bf965c',trim='#e4c18a',dark='#765f43'","const wood='#b59583',trim='#e8cdbc',dark='#76666c'"],
 ["['#69aaa0','#87afa0','#93ad81','#80b8b5','#aaa1b5']","['#b58b9f','#a997b8','#93ad81','#acb3bb','#b99bb0']"],
 ["['#cc9a57','#d7aa66','#e4b877','#cfa263']","['#9f8093','#b093a4','#bda0b0','#a78a9e']"]
]);
console.log('Sakura palette, world integration and independent storage applied.');
