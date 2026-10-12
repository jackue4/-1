const fs=require('node:fs'),path=require('node:path');const p=path.join(__dirname,'sakura-planet/app.js');let s=fs.readFileSync(p,'utf8');
s=s.replace('if(!rect.width||!rect.height)return;camera.aspect=rect.width/rect.height;',"if(!rect.width||!rect.height)return;if(viewMode==='globe'){const x=rect.width>760?-.76:0,delta=x-controls.target.x;controls.target.x=x;camera.position.x+=delta;controls.update();}camera.aspect=rect.width/rect.height;");
s=s.replace('multiplyScalar(12.1)','multiplyScalar(window.innerWidth<=760?13:12.1)');
fs.writeFileSync(p,s);
console.log('Responsive globe recenters when viewport changes');
