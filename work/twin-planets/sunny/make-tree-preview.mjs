import fs from 'node:fs';
let s=fs.readFileSync('work/planet-v2/check-cottage-depth.js','utf8');
s=s.replace("import {createWorld} from './world.js';","import {createPainterlyTree} from './tree-asset.js';");
s=s.replace(/const world=createWorld\(\),asset=world\.cottages\[0\]\.root;[^\n]+/,`const tree=createPainterlyTree({seed:1004}),asset=tree.group;
for(const im of [tree.canopy,tree.sprays]){const matrix=new THREE.Matrix4(),color=new THREE.Color();for(let i=0;i<im.count;i++){im.getMatrixAt(i,matrix);im.getColorAt(i,color);const material=im.material.clone();material.color.multiply(color);const m=new THREE.Mesh(im.geometry,material);matrix.decompose(m.position,m.quaternion,m.scale);asset.add(m);}im.visible=false;}
asset.updateMatrixWorld(true);`);
s=s.replace('camera.position.set(1.0,1.06,1.65);camera.lookAt(0,.35,.04)','camera.position.set(1.25,1.07,2.04);camera.lookAt(0,.45,0)');
s=s.replace('normalMatrix=new THREE.Matrix3()', 'ua=geo.attributes.uv,normalMatrix=new THREE.Matrix3()');
s=s.replace('verts.push({x:',`const uv=ua?{u:ua.getX(j),v:ua.getY(j)}:{u:0,v:0};const clip=new THREE.Vector4(pa.getX(j),pa.getY(j),pa.getZ(j),1).applyMatrix4(o.matrixWorld).applyMatrix4(vp);
    verts.push({...uv,q:1/clip.w,x:`);
s=s.replace('continue;depth[i]=z;',`continue;
      let tint=[1,1,1];if(o.material.map){const d=u*a.q+v*b.q+w*c.q,tu=(u*a.u*a.q+v*b.u*b.q+w*c.u*c.q)/d,tv=(u*a.v*a.q+v*b.v*b.q+w*c.v*c.q)/d,tex=o.material.map,img=tex.image;
        const wrap=n=>tex.wrapS===THREE.RepeatWrapping?((n%1)+1)%1:Math.max(0,Math.min(.99999,n)),tx=Math.min(img.width-1,Math.floor(wrap(tu)*img.width)),ty=Math.min(img.height-1,Math.floor(wrap(tv)*img.height)),ti=(ty*img.width+tx)*4;
        if(img.data[ti+3]/255<o.material.alphaTest)continue;tint=[img.data[ti]/255,img.data[ti+1]/255,img.data[ti+2]/255];
      }depth[i]=z;`);
s=s.replace('u*a.r+v*b.r+w*c.r','(u*a.r+v*b.r+w*c.r)*tint[0]').replace('u*a.g+v*b.g+w*c.g','(u*a.g+v*b.g+w*c.g)*tint[1]').replace('u*a.b+v*b.b+w*c.b','(u*a.b+v*b.b+w*c.b)*tint[2]');
s=s.replace('cottage-depth-check.png','tree-painted-check.png').replace('world.dispose();','tree.dispose();');
fs.writeFileSync('work/planet-v2/check-tree-depth.js',s);
