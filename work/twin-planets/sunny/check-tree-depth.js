// Offline depth-buffer composition check. No browser, shader effects or FPS measurement.
import * as THREE from 'three';
import fs from 'node:fs';
import zlib from 'node:zlib';
import {createPainterlyTree} from './tree-asset.js';
const tree=createPainterlyTree({seed:1004}),asset=tree.group;
for(const im of [tree.canopy,tree.sprays]){const matrix=new THREE.Matrix4(),color=new THREE.Color();for(let i=0;i<im.count;i++){im.getMatrixAt(i,matrix);im.getColorAt(i,color);const material=im.material.clone();material.color.multiply(color);const m=new THREE.Mesh(im.geometry,material);matrix.decompose(m.position,m.quaternion,m.scale);asset.add(m);}im.visible=false;}
asset.updateMatrixWorld(true);
const W=720,H=720,pixels=new Uint8Array(W*H*4),depth=new Float32Array(W*H).fill(Infinity);
for(let i=0;i<W*H;i++)pixels.set([223,239,232,255],i*4);
const camera=new THREE.PerspectiveCamera(35,W/H,.1,20);camera.position.set(1.25,1.07,2.04);camera.lookAt(0,.45,0);camera.updateMatrixWorld();
const vp=new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),light=new THREE.Vector3(-.5,1,.8).normalize();
const color=new THREE.Color(),p=new THREE.Vector3(),n=new THREE.Vector3();
asset.traverseVisible(o=>{
  if(!o.isMesh)return;
  const geo=o.geometry,pa=geo.attributes.position,na=geo.attributes.normal,ca=geo.attributes.color,indices=geo.index?.array??Array.from({length:pa.count},(_,i)=>i),ua=geo.attributes.uv,normalMatrix=new THREE.Matrix3().getNormalMatrix(o.matrixWorld),verts=[];
  for(let j=0;j<pa.count;j++){
    p.fromBufferAttribute(pa,j).applyMatrix4(o.matrixWorld).applyMatrix4(vp);n.fromBufferAttribute(na,j).applyMatrix3(normalMatrix).normalize();
    color.copy(o.material.color);if(o.material.vertexColors&&ca)color.multiply(new THREE.Color().fromBufferAttribute(ca,j));
    const lighting=.60+Math.max(0,n.dot(light))*.47;color.multiplyScalar(lighting).convertLinearToSRGB();
    const uv=ua?{u:ua.getX(j),v:ua.getY(j)}:{u:0,v:0};const clip=new THREE.Vector4(pa.getX(j),pa.getY(j),pa.getZ(j),1).applyMatrix4(o.matrixWorld).applyMatrix4(vp);
    verts.push({...uv,q:1/clip.w,x:(p.x*.5+.5)*W,y:(.5-p.y*.5)*H,z:p.z,r:color.r*255,g:color.g*255,b:color.b*255});
  }
  for(let j=0;j<indices.length;j+=3){
    const a=verts[indices[j]],b=verts[indices[j+1]],c=verts[indices[j+2]],den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(den)<.001)continue;
    const minX=Math.max(0,Math.floor(Math.min(a.x,b.x,c.x))),maxX=Math.min(W-1,Math.ceil(Math.max(a.x,b.x,c.x))),minY=Math.max(0,Math.floor(Math.min(a.y,b.y,c.y))),maxY=Math.min(H-1,Math.ceil(Math.max(a.y,b.y,c.y)));
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
      const u=((b.y-c.y)*(x+.5-c.x)+(c.x-b.x)*(y+.5-c.y))/den,v=((c.y-a.y)*(x+.5-c.x)+(a.x-c.x)*(y+.5-c.y))/den,w=1-u-v;if(u<0||v<0||w<0)continue;
      const z=u*a.z+v*b.z+w*c.z,i=y*W+x;if(z>=depth[i]||z< -1||z>1)continue;
      let tint=[1,1,1];if(o.material.map){const d=u*a.q+v*b.q+w*c.q,tu=(u*a.u*a.q+v*b.u*b.q+w*c.u*c.q)/d,tv=(u*a.v*a.q+v*b.v*b.q+w*c.v*c.q)/d,tex=o.material.map,img=tex.image;
        const wrap=n=>tex.wrapS===THREE.RepeatWrapping?((n%1)+1)%1:Math.max(0,Math.min(.99999,n)),tx=Math.min(img.width-1,Math.floor(wrap(tu)*img.width)),ty=Math.min(img.height-1,Math.floor(wrap(tv)*img.height)),ti=(ty*img.width+tx)*4;
        if(img.data[ti+3]/255<o.material.alphaTest)continue;tint=[img.data[ti]/255,img.data[ti+1]/255,img.data[ti+2]/255];
      }depth[i]=z;
      pixels[i*4]=Math.min(255,(u*a.r+v*b.r+w*c.r)*tint[0]);pixels[i*4+1]=Math.min(255,(u*a.g+v*b.g+w*c.g)*tint[1]);pixels[i*4+2]=Math.min(255,(u*a.b+v*b.b+w*c.b)*tint[2]);
    }
  }
});
function crc(bytes){let n=0xffffffff;for(const b of bytes){n^=b;for(let k=0;k<8;k++)n=(n>>>1)^((n&1)?0xedb88320:0);}return(n^0xffffffff)>>>0;}
function chunk(type,data){const label=Buffer.from(type),body=Buffer.concat([label,data]),head=Buffer.alloc(4),tail=Buffer.alloc(4);head.writeUInt32BE(data.length);tail.writeUInt32BE(crc(body));return Buffer.concat([head,body,tail]);}
const header=Buffer.alloc(13);header.writeUInt32BE(W);header.writeUInt32BE(H,4);header[8]=8;header[9]=6;
const rows=Buffer.alloc((W*4+1)*H);for(let y=0;y<H;y++)rows.set(pixels.subarray(y*W*4,(y+1)*W*4),y*(W*4+1)+1);
fs.writeFileSync('work/planet-v2/tree-painted-check.png',Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]));
tree.dispose();console.log('Saved depth-tested geometry preview; not browser/WebGL validation.');
