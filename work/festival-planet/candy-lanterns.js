// Pocket-sized sweet gardens beside the park's paths. Indexed batches preserve
// painted colours and smooth curves without processing each vertex six times.
export function createCandyLanterns({THREE,parent,palette,surface,locations=[]}){
 const root=new THREE.Group();root.name='Sugar gardens and little pumpkin lanterns';root.userData.dynamic=true;parent.add(root);
 const ownGeometries=new Set(),clusters=[],contacts=[];
 const bodyMaterial=palette.m('#fff8eb').clone();bodyMaterial.color.set('#ffffff');bodyMaterial.vertexColors=true;
 const faceMaterial=new THREE.MeshStandardMaterial({color:'#6a493d',emissive:'#ffbb61',emissiveIntensity:0,roughness:.73});
 const haloMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:{uStrength:{value:0},uColor:{value:new THREE.Color('#ffc579')}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv; uniform float uStrength; uniform vec3 uColor; void main(){float d=length(vUv-.5)*2.;float a=pow(max(0.,1.-d*d),2.4)*uStrength;gl_FragColor=vec4(uColor,a);}' });
 const dayFace=new THREE.Color('#674737'),nightFace=new THREE.Color('#ffe4a2');
 const sphere=new THREE.SphereGeometry(1,18,12),smallSphere=new THREE.SphereGeometry(1,12,8),up=new THREE.Vector3(0,1,0);
 const C={cream:'#fff0d7',pink:'#ed98b0',berry:'#d76794',mint:'#99d5ba',teal:'#55988d',orange:'#eaa061',coral:'#e28754',gold:'#f4c777',leaf:'#77985a',stem:'#97745c',ink:'#694f4c',white:'#fff9e8'};
 const stats={clusters:locations.length,lollipops:0,pumpkinLanterns:0,pointLights:0,drawCalls:0,triangles:0};
 let disposed=false,lastTime=0,night=0,brightness=0;
 function builder(){
  const p=[],n=[],c=[],indices=[],matrix=new THREE.Matrix4(),color=new THREE.Color(),quat=new THREE.Quaternion();
  function add(source,position=[0,0,0],scale=[1,1,1],tint=C.cream,rotation=[0,0,0],frame=null){
   quat.setFromEuler(new THREE.Euler(...rotation));matrix.compose(new THREE.Vector3(...position),quat,new THREE.Vector3(...scale));if(frame)matrix.premultiply(frame);
   const offset=p.length/3,g=source.clone();g.applyMatrix4(matrix);color.set(tint);
   const gp=g.attributes.position.array,gn=g.attributes.normal.array;for(let i=0;i<gp.length;i++)p.push(gp[i]);for(let i=0;i<gn.length;i++)n.push(gn[i]);
   for(let i=0;i<g.attributes.position.count;i++)c.push(color.r,color.g,color.b);
   if(g.index)for(const i of g.index.array)indices.push(offset+i);else for(let i=0;i<g.attributes.position.count;i++)indices.push(offset+i);g.dispose();
  }
  function ball(position,scale,tint,rotation,frame){add(Math.max(...scale)<.028?smallSphere:sphere,position,scale,tint,rotation,frame);}
  function line(points,radius,tint,frame,segments=24){const curve=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v))),g=new THREE.TubeGeometry(curve,segments,radius,5,false);add(g,[0,0,0],[1,1,1],tint,[0,0,0],frame);g.dispose();}
  function finish(material,name,holder){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));if(material.vertexColors)g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.setIndex(indices);g.computeBoundingBox();g.computeBoundingSphere();ownGeometries.add(g);const mesh=new THREE.Mesh(g,material);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;mesh.matrixAutoUpdate=false;holder.add(mesh);stats.drawCalls++;stats.triangles+=indices.length/3;return mesh;}
  return{add,ball,line,finish};
 }
 function circleShape(rx,ry){const s=new THREE.Shape();s.absellipse(0,0,rx,ry,0,Math.PI*2,false);return new THREE.ShapeGeometry(s,18);}
 function smileShape(size){const s=new THREE.Shape();s.moveTo(-size,.001);s.quadraticCurveTo(0,-size*.67,size,.001);s.quadraticCurveTo(size*.73,-size*.69,0,-size*.77);s.quadraticCurveTo(-size*.73,-size*.69,-size,.001);return new THREE.ShapeGeometry(s,16);}
 const pumpkin=new THREE.SphereGeometry(1,28,18),pp=pumpkin.attributes.position;
 for(let i=0;i<pp.count;i++){const x=pp.getX(i),y=pp.getY(i),z=pp.getZ(i),a=Math.atan2(z,x),lobes=1+.052*Math.cos(a*9);pp.setXYZ(i,x*lobes,y*(.98-.07*Math.pow(Math.abs(y),4)),z*lobes);}pumpkin.computeVertexNormals();
 function anchoredFrame(cluster,x,z,lean=0,turn=0){
  const localQ=cluster.quaternion,inv=localQ.clone().invert(),d=new THREE.Vector3(x,0,z).multiplyScalar(cluster.userData.scale).applyQuaternion(localQ).add(cluster.position).normalize();
  const height=surface.height(d),p=d.clone().multiplyScalar(height+.001).sub(cluster.position).applyQuaternion(inv).divideScalar(cluster.userData.scale);
  const q=new THREE.Quaternion().setFromUnitVectors(up,d.clone().applyQuaternion(inv));q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0,turn,lean)));
  contacts.push({direction:d.clone(),radius:height+.001});return new THREE.Matrix4().compose(p,q,new THREE.Vector3(1,1,1));
 }
 function candy(b,frame,h,r,color){
  const pole=new THREE.CylinderGeometry(.006,.007,h,10);b.add(pole,[0,h/2,0],[1,1,1],C.cream,[0,0,0],frame);pole.dispose();
  const disk=new THREE.CylinderGeometry(r,r,.019,40);b.add(disk,[0,h,0],[1,1,1],C.cream,[Math.PI/2,0,0],frame);disk.dispose();
  // Real raised candy spirals on both faces remain legible from the globe's rear.
  for(const side of [-1,1]){const points=[];for(let i=0;i<=90;i++){const t=i/90,a=t*Math.PI*4.85,rr=.001+t*r*.90;points.push([Math.cos(a)*rr,h+Math.sin(a)*rr,side*.011]);}b.line(points,r*.088,color,frame,72);}
  const rim=new THREE.TorusGeometry(r*.965,.0022,5,40);b.add(rim,[0,h,.009],[1,1,1],C.white,[0,0,0],frame);rim.dispose();
  b.ball([-.026,h-r-.022,0],[.020,.011,.007],color,[0,0,.34],frame);b.ball([.026,h-r-.022,0],[.020,.011,.007],color,[0,0,-.34],frame);b.ball([0,h-r-.022,.003],[.009,.009,.009],C.gold,[0,0,0],frame);
  b.line([[-.012,h-r-.03,0],[-.02,h-r-.05,.003],[-.018,h-r-.064,0]],.003,color,frame,9);stats.lollipops++;
 }
 function lantern(b,face,frame,r,color,expression){
  const sy=r*.82,cy=sy*.93;
  b.add(pumpkin,[0,cy,0],[r,sy,r*.84],color,[0,0,0],frame);
  // Soft painted highlights follow individual ribs without making hard outlines.
  for(const side of [-1,1])b.ball([side*r*.56,cy+r*.30,r*.45],[r*.12,r*.28,r*.038],expression===1?C.cream:C.gold,[0,side*.5,side*.18],frame);
  b.line([[0,cy+sy*.85,0],[r*.015,cy+sy*1.14,0],[r*.22,cy+sy*1.23,-r*.04]],r*.075,C.stem,frame,9);
  b.ball([r*.23,cy+sy*1.11,-r*.015],[r*.25,r*.060,r*.12],C.leaf,[0,.15,-.45],frame);
  const vine=[];for(let i=0;i<=24;i++){const t=i/24,a=t*Math.PI*2.4,rad=r*.16*(1-t*.55);vine.push([r*.08+Math.sin(a)*rad,cy+sy*1.07+Math.cos(a)*rad,-r*.01]);}b.line(vine,r*.023,C.leaf,frame,28);
  const eye=circleShape(r*.088,r*.117),smile=smileShape(r*.27);
  for(const side of [-1,1]){
   const ex=side*r*.31,ey=cy+r*.11,ez=r*.84*Math.sqrt(Math.max(.1,1-(ex/r)**2-((ey-cy)/sy)**2))+.0014;
   if(expression===2)face.line([[ex-r*.080,ey-.001,ez],[ex,ey+r*.037,ez+.001],[ex+r*.080,ey-.001,ez]],r*.026,C.white,frame,10);
   else face.add(eye,[ex,ey,ez],[1,1,1],C.white,[0,side*.22,0],frame);
   b.ball([side*r*.51,cy-r*.075,r*.705],[r*.11,r*.06,r*.025],C.pink,[0,side*.3,0],frame);
  }
  face.add(smile,[0,cy-r*.075,r*.847+.001],[1,1,1],C.white,[0,0,0],frame);eye.dispose();smile.dispose();
  // Tiny round feet make the pumpkins read as friendly park mascots.
  for(const side of [-1,1])b.ball([side*r*.41,r*.055,r*.37],[r*.24,r*.115,r*.28],color,[0,0,0],frame);
  stats.pumpkinLanterns++;
 }
 function haloGeometry(cluster){
  const positions=[],uv=[],indices=[],rings=7,seg=40,radius=.245;
  for(let j=0;j<=rings;j++)for(let i=0;i<=seg;i++){
   const a=i/seg*Math.PI*2,r=j/rings*radius,x=Math.cos(a)*r,z=Math.sin(a)*r+.035;
   const d=new THREE.Vector3(x,0,z).multiplyScalar(cluster.userData.scale).applyQuaternion(cluster.quaternion).add(cluster.position).normalize();
   const v=d.multiplyScalar(surface.height(d)+.005).sub(cluster.position).applyQuaternion(cluster.quaternion.clone().invert()).divideScalar(cluster.userData.scale);positions.push(...v.toArray());uv.push(.5+Math.cos(a)*j/rings*.5,.5+Math.sin(a)*j/rings*.5);
   if(j<rings&&i<seg){const k=j*(seg+1)+i;indices.push(k,k+seg+1,k+1,k+1,k+seg+1,k+seg+2);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();ownGeometries.add(g);return g;
 }
 locations.forEach((location,i)=>{
  const {lat,lon,scale=1,turn=0}=location,n=new THREE.Vector3(Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon)),g=new THREE.Group();g.name=`Sweet lantern garden ${i+1}`;g.position.copy(n).multiplyScalar(surface.height(n));g.quaternion.setFromUnitVectors(up,n);g.rotateY(turn);g.scale.setScalar(scale);g.userData.scale=scale;root.add(g);clusters.push({group:g,lat,lon,scale,turn});
  const b=builder(),faces=builder();
  candy(b,anchoredFrame(g,-.112,-.055,.10,-.12),.295,.048,C.pink);
  candy(b,anchoredFrame(g,.018,-.073,-.07,.06),.363,.058,i%2?C.mint:C.berry);
  candy(b,anchoredFrame(g,.13,-.015,-.12,.16),.246,.045,i%2?C.berry:C.mint);
  lantern(b,faces,anchoredFrame(g,-.096,.063,0,-.14),.063,i%2?C.gold:C.coral,0);
  lantern(b,faces,anchoredFrame(g,.043,.085,0,.1),.072,i%2?C.coral:C.orange,1);
  lantern(b,faces,anchoredFrame(g,.139,.058,0,.24),.039,C.cream,2);
  b.finish(bodyMaterial,'Painted candy spirals and pumpkin shells',g);const f=faces.finish(faceMaterial,'Warm smiling lantern faces',g);f.castShadow=false;f.receiveShadow=false;
  const glow=new THREE.Mesh(haloGeometry(g),haloMaterial);glow.name='Soft golden pool following the lawn';glow.renderOrder=7;glow.visible=false;glow.matrixAutoUpdate=false;g.add(glow);clusters[i].halo=glow;stats.drawCalls++;stats.triangles+=glow.geometry.index.count/3;
  g.updateMatrix();g.matrixAutoUpdate=false;
 });
 sphere.dispose();smallSphere.dispose();pumpkin.dispose();
 function update(time,env={}){
  if(disposed)return;lastTime=time;night=THREE.MathUtils.clamp(env.night||0,0,1);const blend=THREE.MathUtils.smoothstep(night,.13,.77);
  brightness=blend*(.95+.05*Math.sin(time*.86));faceMaterial.color.copy(dayFace).lerp(nightFace,blend);faceMaterial.emissiveIntensity=brightness*1.65;haloMaterial.uniforms.uStrength.value=brightness*.26;
  for(const cluster of clusters)cluster.halo.visible=brightness>.003;
 }
 function getPose(index=0,aspect=1){
  const cluster=clusters[((index%clusters.length)+clusters.length)%clusters.length];if(!cluster)return null;
  root.updateMatrixWorld(true);const g=cluster.group,q=g.getWorldQuaternion(new THREE.Quaternion()),s=cluster.scale,target=g.localToWorld(new THREE.Vector3(0,.15,0));
  const fit=Math.max(1,.87/Math.max(.25,aspect)),offset=new THREE.Vector3(.18,.26,1.05).multiplyScalar(s*fit).applyQuaternion(q),worldUp=up.clone().applyQuaternion(q);
  return{target,position:target.clone().add(offset),up:worldUp};
 }
 function getState(){return{...stats,disposed,time:lastTime,night,brightness,faceEmissiveIntensity:faceMaterial.emissiveIntensity,haloOpacity:haloMaterial.uniforms.uStrength.value,locations:clusters.map(({lat,lon,scale,turn})=>({lat,lon,scale,turn})),minGroundClearance:contacts.length?Math.min(...contacts.map(c=>c.radius-surface.height(c.direction))):0};}
 function dispose(){if(disposed)return;disposed=true;root.removeFromParent();for(const geometry of ownGeometries)geometry.dispose();ownGeometries.clear();bodyMaterial.dispose();faceMaterial.dispose();haloMaterial.dispose();clusters.length=0;contacts.length=0;}
 update(0,{night:0});return{root,update,getState,getPose,stats,dispose};
}
