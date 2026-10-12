const fs=require('fs'),p='work/planet-v2/';let s=fs.readFileSync(p+'villagers.js','utf8');
s=s.replace("fur(head,identity.fur,[0,0,0],[.127,.112,.105],280);",`const face=fur(head,identity.fur,[0,0,0],[.127,.112,.105],280);
 if(i===2){
   const orange=new THREE.Color(identity.fur),white=new THREE.Color(cream),tint=new THREE.Color();
   for(const object of [face,...head.children.filter(o=>o.userData.fur)]){object.geometry=object.geometry.clone();object.material=plushMaterial('#ffffff');const p=object.geometry.attributes.position,c=object.geometry.attributes.color;
     for(let j=0;j<p.count;j++){const x=p.getX(j)/(object===face?1:.127),y=p.getY(j)/(object===face?1:.112),z=p.getZ(j)/(object===face?1:.105),stripe=(1-THREE.MathUtils.smoothstep(Math.abs(x),.12,.24))*THREE.MathUtils.smoothstep(z,.55,.75)*THREE.MathUtils.smoothstep(y,-.18,.05);tint.copy(orange).lerp(white,stripe);c.setXYZ(j,tint.r,tint.g,tint.b);}
   }
 }
`);
s=s.replace("if(i===2){fur(head,cream,[0,.037,.095],[.029,.076,.016],30);}","");
s=s.replace("[side*.046,.025,.105]","[side*.046,.025,.098]").replace("[side*.046-.004,.032,.116]","[side*.046-.004,.032,.109]");
s=s.replace("[0,.04,0],[.041,.075,.031],60","[0,.037,0],[.049,i===2?.062:.051,.032],60").replace("[0,.044,.026],[.025,.049,.008]","[0,.040,.028],[.029,i===2?.040:.032,.006]");fs.writeFileSync(p+'villagers.js',s);
s=fs.readFileSync(p+'world.js','utf8').replace('for(let i=0;i<4;i++){const nn=direction(-.31','for(let i=0;i<1;i++){const nn=direction(-.31');fs.writeFileSync(p+'world.js',s);
