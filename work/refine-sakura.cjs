const fs=require('node:fs'),path=require('node:path');const dir=path.join(__dirname,'sakura-planet');
let app=fs.readFileSync(path.join(dir,'app.js'),'utf8');
const handler="$('sakura-wish').onclick=()=>{world.sakuraGarden.wish();toast('愿你想念的人，也正遇见一场温柔的花开。');};";
const first=app.indexOf(handler),last=app.lastIndexOf(handler);if(last!==first)app=app.slice(0,last)+app.slice(last+handler.length);
app=app.replace("controls.target.set(0,0,0);camera.position.set(.45,3.28,2.15).normalize().multiplyScalar(9.6);","controls.target.set(window.innerWidth>760?-.76:0,0,0);camera.position.set(.45,3.28,2.15).normalize().multiplyScalar(9.6).add(controls.target);");
fs.writeFileSync(path.join(dir,'app.js'),app);
let world=fs.readFileSync(path.join(dir,'world.js'),'utf8').replace('const dynamic=new Set([fishing.root,','const dynamic=new Set([sakuraGarden.root,fishing.root,');fs.writeFileSync(path.join(dir,'world.js'),world);
console.log('Sakura composition and handlers refined');
