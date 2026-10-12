const fs=require('node:fs'),path=require('node:path');const dir=path.join(__dirname,'sakura-planet');
let w=fs.readFileSync(path.join(dir,'world.js'),'utf8');
const a=w.indexOf('  for (let i = 0, made = 0; i < 800 && made < 10; i++)');const b=w.indexOf('  // A few small trees',a);if(a<0||b<0)throw Error('tree layout marker');
w=w.slice(0,a)+`  // A composed spring grove frames the open center; trunks stay clear of paths.
  const springSites=[[.04,-.37],[-.14,-.24],[-.28,-.52],[.09,-.85],[.48,-.86],[.99,-.15],[.86,.24],[.54,.51],[-.65,-.36],[-.99,.20]];
  for(let i=0;i<springSites.length;i++){const [lat,lon]=springSites[i],nn=direction(lat,lon);if(terrainHeight(nn)>R+.04&&!farmReserved(nn,.014)&&!pondReserved(nn,.18)&&Math.abs(lat-pathLat(lon))>.066&&!houseSites.some(h=>nn.distanceTo(direction(h.lat,h.lon))<.22))tree(nn,.68+(i%3)*.08);}
  for(let i=0;i<500&&stats.trees<10;i++){const nn=direction(Math.asin(rng()*1.84-.92),rng()*Math.PI*2),lon=Math.atan2(nn.x,nn.z);if(terrainHeight(nn)<R+.04||farmReserved(nn,.06)||pondReserved(nn,.6)||Math.abs(Math.asin(nn.y)-pathLat(lon))<.11||houseSites.some(h=>nn.distanceTo(direction(h.lat,h.lon))<.25))continue;tree(nn,.62+rng()*.14);}
`+w.slice(b);
w=w.replace("meadowPollen.update(t,env);sakuraGarden.update(t,env);","meadowPollen.update(t,env);")
.replace("waterMat.color.set('#ffffff').lerp(new THREE.Color('#adcdeb'),env.night);","waterMat.color.set('#ffffff').lerp(new THREE.Color('#adcdeb'),env.night);sakuraGarden.update(t,env);")
.replace("function trigger(id, newGrowth=growth){effect=id;","function trigger(id, newGrowth=growth){if(id==='petals')sakuraGarden.wish();effect=id;")
.replace("petalFX.visible=active==='petals';","petalFX.visible=false;");
fs.writeFileSync(path.join(dir,'world.js'),w);
let app=fs.readFileSync(path.join(dir,'app.js'),'utf8');
app=app.replace("direction(.38,.06)","direction(.05,-.32)")
.replace("controls.target.set(0,2.67,0);camera.position.set(.45,5.95,2.15);","controls.target.set(0,2.65,0);camera.position.set(.24,4.20,3.1);")
.replace("multiplyScalar(9.6)","multiplyScalar(12.1)")
.replace("viewMode==='meadow'?38:38","viewMode==='meadow'?46:38");
fs.writeFileSync(path.join(dir,'app.js'),app);
fs.appendFileSync(path.join(dir,'style.css'),'\nhtml[data-planet=sakura] .sakura-letter h1{white-space:nowrap;font-size:clamp(27px,2.4vw,37px);letter-spacing:3px}.sakura-letter{max-width:330px}\n@media(max-width:760px){html[data-planet=sakura] .sakura-letter h1{font-size:18px;letter-spacing:2px}}\n');
console.log('Spring grove and framing updated');
