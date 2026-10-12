/** Jiangnan winter: slender silhouettes, a dusting of snow, muted evergreen life. */
export function createWinterNature(THREE){
 const geometryCache=new Map(),materialCache=new Map(),ownedGeometries=new Set();
 const gradient=new THREE.DataTexture(new Uint8Array([125,170,213,250]),4,1,THREE.RedFormat);
 gradient.minFilter=gradient.magFilter=THREE.NearestFilter;gradient.needsUpdate=true;
 const stats={trees:0,pines:0,bamboo:0,rocks:0,reeds:0,shrubs:0,lotus:0};
 const colors={bark:'#655955',twig:'#766d67',snow:'#f3f3e9',snowShadow:'#dce7e4',leaf:'#a08761',pine:'#426961',pineLight:'#658078',bamboo:'#69856c',node:'#a0aa88',rock:'#879692',rockShade:'#647671',moss:'#607970',reed:'#b0aa87',flower:'#c66776',petal:'#eeabb2',gold:'#d3af77'};
 const seeded=seed=>{let state=seed>>>0;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};};
 const mat=(color,double=false)=>{const key=color+double;if(!materialCache.has(key))materialCache.set(key,new THREE.MeshToonMaterial({color,gradientMap:gradient,side:double?THREE.DoubleSide:THREE.FrontSide}));return materialCache.get(key);};
 const sphere=(()=>{const g=new THREE.SphereGeometry(1,10,7);geometryCache.set('sphere',g);return g;})();
 function mesh(parent,g,m,p=[0,0,0],scale=[1,1,1]){const o=new THREE.Mesh(g,m);o.position.set(...p);o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function oval(parent,p,scale,color){return mesh(parent,sphere,mat(color),p,scale);}
 function curve(parent,points,width,color,segments=10){const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),g=new THREE.TubeGeometry(path,segments,width,5,false);ownedGeometries.add(g);return mesh(parent,g,mat(color));}
 function branch(parent,points,width,snow=0){curve(parent,points,width,colors.bark,Math.max(5,points.length*3));if(snow>0){const top=points.slice(1).map(p=>[p[0],p[1]+width*.83,p[2]]);if(top.length>1)curve(parent,top,width*.46*snow,colors.snow,Math.max(4,top.length*3));}}
 function blade(parent,p,length,width,angle,color,lean=.15){const key=`leaf:${length.toFixed(3)}:${width.toFixed(3)}:${lean.toFixed(2)}`;let g=geometryCache.get(key);if(!g){const vertices=[],indices=[];for(let i=0;i<=5;i++){const t=i/5,w=Math.sin(Math.PI*t)*width;vertices.push(-w+lean*t*t,length*t,Math.sin(t*Math.PI)*width*.35,w+lean*t*t,length*t,Math.sin(t*Math.PI)*width*.35);if(i<5){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}}g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();geometryCache.set(key,g);}const o=mesh(parent,g,mat(color,true),p);o.rotation.set(angle[0]||0,angle[1]||0,angle[2]||0);return o;}
 function flower(parent,p,size,rng){const f=new THREE.Group();f.position.set(...p);f.rotation.set(rng()*2,rng()*6.28,rng()*6.28);parent.add(f);for(let i=0;i<5;i++){const a=i*Math.PI*.4;oval(f,[Math.cos(a)*size*.55,Math.sin(a)*size*.55,0],[size*.6,size*.51,size*.24],i%2?colors.petal:colors.flower);}oval(f,[0,0,size*.17],[size*.22,size*.22,size*.17],colors.gold);return f;}
 function winterTree({height=.9,seed=1,blossom=false,snow=.7}={}){
  const group=new THREE.Group(),rng=seeded(seed);group.name=blossom?'雪里疏梅':'江南冬枝';stats.trees++;
  const h=height,bend=(rng()-.5)*h*.15,z=(rng()-.5)*h*.07;
  branch(group,[[0,0,0],[bend*.25,h*.23,z*.4],[bend,h*.51,z],[bend*.65,h*.8,z*.6],[bend+h*.07,h*.99,z+h*.03]],h*.023,snow*.6);
  for(let i=0;i<7;i++){
   const a=i*2.38+rng()*.7,level=.27+i*.082,reach=h*(.33-i*.017)*( .85+rng()*.3),start=[bend*level,level*h,z*level],end=[start[0]+Math.cos(a)*reach,h*(level+.17+rng()*.07),start[2]+Math.sin(a)*reach];
   const elbow=[start[0]+Math.cos(a)*reach*.52,h*(level+.055),start[2]+Math.sin(a)*reach*.48];
   branch(group,[start,elbow,[end[0]*.94,end[1]-.025*h,end[2]*.9],end],h*(.012-i*.00075),snow);
   for(let j=0;j<3;j++){
    const t=.43+j*.23,at=[start[0]+(end[0]-start[0])*t,start[1]+(end[1]-start[1])*t,start[2]+(end[2]-start[2])*t],ta=a+(j%2?-.7:.7),length=h*(.12+rng()*.06),tip=[at[0]+Math.cos(ta)*length,at[1]+h*(.12+rng()*.055),at[2]+Math.sin(ta)*length];
    branch(group,[at,[at[0]+Math.cos(ta)*length*.8,at[1]+h*.09,at[2]+Math.sin(ta)*length*.6],tip],h*.0038,snow*.65);
    if(blossom){flower(group,tip,h*.025,rng);if(j===1)flower(group,[tip[0]-.02*h,tip[1]-.05*h,tip[2]],h*.024,rng);}
    else if(rng()<.26){blade(group,tip,h*.047,h*.017,[.8,rng()*6,.7],colors.leaf,.014*h);}
   }
   if(blossom&&i%2===0)flower(group,end,h*.021,rng);
  }
  for(let i=0;i<4;i++){const a=i*1.58+rng()*.6;curve(group,[[0,h*.08,0],[Math.cos(a)*h*.08,h*.015,Math.sin(a)*h*.08],[Math.cos(a)*h*.12,0,Math.sin(a)*h*.12]],h*.012,colors.bark,5);}
  oval(group,[0,h*.012,0],[h*.091,h*.015,h*.066],colors.snowShadow);group.userData.winterNature=true;return group;
 }
 function pine({height=.85,seed=1}={}){
  const group=new THREE.Group(),rng=seeded(seed),h=height,bend=(rng()-.5)*h*.22;stats.pines++;group.name='雪松青影';
  branch(group,[[0,0,0],[bend*.5,h*.28,0],[bend,h*.62,-h*.04],[bend*.8,h*.92,0]],h*.022,.45);
  for(let i=0;i<7;i++){
   const a=i*2.4+rng(),level=.35+i*.076,r=h*(.25-i*.015),end=[bend*level+Math.cos(a)*r,h*level,Math.sin(a)*r];
   branch(group,[[bend*level,h*(level-.055),0],[end[0]*.55,h*(level-.035),end[2]*.55],end],h*.008,.6);
   for(let j=0;j<3;j++){const p=[end[0]+(rng()-.5)*h*.11,end[1]+rng()*h*.05,end[2]+(rng()-.5)*h*.1],scale=[h*(.115+rng()*.05),h*.045,h*(.10+rng()*.04)];oval(group,p,scale,j===1?colors.pineLight:colors.pine);oval(group,[p[0]-.008*h,p[1]+h*.028,p[2]],[scale[0]*.8,h*.011,scale[2]*.82],colors.snow);}
  }
  oval(group,[bend*.8,h*.96,0],[h*.11,h*.05,h*.10],colors.pineLight);oval(group,[bend*.8,h*.988,0],[h*.086,h*.011,h*.08],colors.snow);group.userData.winterNature=true;return group;
 }
 function bamboo({height=.75,seed=1,count=5}={}){
  const group=new THREE.Group(),rng=seeded(seed);stats.bamboo++;group.name='听雪竹丛';
  for(let i=0;i<count;i++){
   const h=height*(.7+rng()*.3),x=(rng()-.5)*height*.22,z=(rng()-.5)*height*.22,lean=(rng()-.5)*height*.16;
   curve(group,[[x,0,z],[x+lean*.3,h*.52,z],[x+lean,h,z+.025]],height*.007,colors.bamboo,8);
   for(let j=1;j<=5;j++){const t=j/6;oval(group,[x+lean*t*t,h*t,z+.025*t],[height*.009,height*.003,height*.009],colors.node);if(j<3)continue;for(let k=0;k<3;k++){const a=(i*1.7+j*1.9+k*.7),side=k%2?-1:1,p=[x+lean*t*t+Math.cos(a)*height*.013,h*t,z+Math.sin(a)*height*.013];blade(group,p,height*(.13+rng()*.06),height*.013,[.5,a,side*1.15],k%2?colors.pineLight:colors.bamboo,side*height*.04);}}
  }
  oval(group,[0,.007,0],[height*.13,.009,height*.10],colors.snowShadow);group.userData.winterNature=true;return group;
 }
 function rock({size=.2,seed=1,snow=true}={}){
  const group=new THREE.Group(),rng=seeded(seed);stats.rocks++;group.name='水岸苔石';
  const sx=size*(.82+rng()*.4),sy=size*(.54+rng()*.28),sz=size*(.72+rng()*.4),g=new THREE.SphereGeometry(1,12,9),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),noise=1+.11*Math.sin(x*4.3+seed)*Math.cos(z*3.9-seed)+.05*Math.cos(y*5+x*3);p.setXYZ(i,x*noise,y*(.92+.07*Math.sin(z*4)),z*noise);}g.computeVertexNormals();ownedGeometries.add(g);mesh(group,g,mat(seed%2?colors.rock:colors.rockShade),[0,sy*.50,0],[sx,sy,sz]);
  if(snow){const cap=new THREE.SphereGeometry(1,12,5,0,Math.PI*2,0,Math.PI*.29);ownedGeometries.add(cap);mesh(group,cap,mat(colors.snow),[0,sy*.52,0],[sx*1.025,sy*1.045,sz*1.025]);}
  for(let i=0;i<2;i++)oval(group,[(rng()-.5)*sx,sy*.23,(i?1:-1)*sz*.62],[sx*.43,sy*.14,sz*.38],colors.moss);
  group.userData.winterNature=true;return group;
 }
 function reeds({height=.22,seed=1,count=7}={}){
  const group=new THREE.Group(),rng=seeded(seed);stats.reeds++;group.name='岸边寒苇';
  for(let i=0;i<count;i++){const h=height*(.55+rng()*.5),x=(rng()-.5)*height*.5,z=(rng()-.5)*height*.4,lean=(rng()-.5)*height*.35;curve(group,[[x,0,z],[x+lean*.4,h*.65,z],[x+lean,h,z+.03]],height*.006,colors.reed,5);const head=oval(group,[x+lean,h,z+.03],[height*.017,height*.075,height*.014],i%3===0?colors.snowShadow:colors.reed);head.rotation.z=-lean;blade(group,[x,h*.25,z],height*.57,height*.012,[.3,rng()*6,(i%2?1:-1)*.8],colors.reed,lean*.5);}
  group.userData.winterNature=true;return group;
 }
 function shrub({size=.18,seed=1}={}){
  const group=new THREE.Group(),rng=seeded(seed);stats.shrubs++;group.name='冬青覆薄雪';
  for(let i=0;i<5;i++){const a=i*2.4,p=[Math.cos(a)*size*.48,size*(.35+rng()*.22),Math.sin(a)*size*.4],s=size*(.48+rng()*.13);oval(group,p,[s,s*.59,s*.86],i%2?colors.pineLight:colors.pine);oval(group,[p[0],p[1]+s*.42,p[2]],[s*.75,s*.10,s*.68],colors.snow);if(seed%3===0)for(let b=0;b<3;b++)oval(group,[p[0]+(rng()-.5)*s,p[1]+s*.38,p[2]+s*.78],[size*.035,size*.035,size*.035],'#ac5c5d');}
  group.userData.winterNature=true;return group;
 }
 function lotus({size=.12,seed=1}={}){
  const group=new THREE.Group(),rng=seeded(seed);stats.lotus++;group.name='留得残荷听雪声';
  for(let i=0;i<3;i++){const x=(rng()-.5)*size*1.7,z=(rng()-.5)*size*1.7,h=size*(.4+rng()*.7),lean=(rng()-.5)*size*.6;curve(group,[[x,0,z],[x,h*.6,z],[x+lean,h,z]],size*.018,colors.reed,5);const head=oval(group,[x+lean,h,z],[size*.17,size*.045,size*.14],colors.leaf);head.rotation.z=.35;for(let k=0;k<3;k++)oval(group,[x+lean+(k-1)*size*.057,h+size*.045,z],[size*.018,size*.014,size*.018],colors.bark);}
  group.userData.winterNature=true;return group;
 }
 let disposed=false;
 return {winterTree,pine,bamboo,rock,reeds,shrub,lotus,stats,dispose(){if(disposed)return;disposed=true;for(const g of [...geometryCache.values(),...ownedGeometries])g.dispose();for(const m of materialCache.values())m.dispose();gradient.dispose();}};
}

/** Absolute-time snowfall is reversible for preview/play state restoration. */
export function createSnowfall({THREE,parent,radius=3.2,mobile=false}){
 const count=mobile?580:920,positions=new Float32Array(count*3),sizes=new Float32Array(count),fades=new Float32Array(count),flakes=[];
 let state=81137;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 for(let i=0;i<count;i++){
  const y=1-2*(i+.5)/count,a=i*2.399963229728653+random()*.13,r=Math.sqrt(1-y*y),normal=new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r),axis=Math.abs(y)>.9?new THREE.Vector3(1,0,0):new THREE.Vector3(0,1,0),east=new THREE.Vector3().crossVectors(axis,normal).normalize(),north=new THREE.Vector3().crossVectors(normal,east);
  flakes.push({normal,east,north,phase:random(),life:14+random()*16,span:.8+random()*.91,drift:random()*Math.PI*2,flutter:.025+random()*.07});sizes[i]=.044+random()*.038;
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));geometry.setAttribute('aSize',new THREE.BufferAttribute(sizes,1));geometry.setAttribute('aFade',new THREE.BufferAttribute(fades,1).setUsage(THREE.DynamicDrawUsage));geometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(),radius+1.8);
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,uniforms:{uNight:{value:0},uOpacity:{value:.82}},
  vertexShader:`attribute float aSize;attribute float aFade;varying float vFade;void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(aSize*470.0/max(0.5,-p.z),1.2,6.0);vFade=aFade;}`,
  fragmentShader:`uniform float uNight;uniform float uOpacity;varying float vFade;void main(){vec2 p=(gl_PointCoord-.5)*2.;float r=length(p);float a=atan(p.y,p.x);float arms=pow(abs(cos(a*3.)),12.);float radius=.35+arms*.35;float soft=1.-smoothstep(radius*.45,radius,r);float halo=(1.-smoothstep(.15,1.,r))*.23;float opacity=(soft*.72+halo)*vFade*uOpacity;if(opacity<.018)discard;vec3 color=mix(vec3(.94,.975,1.),vec3(.78,.875,1.),uNight*.4);gl_FragColor=vec4(color,opacity);}`
 });
 const points=new THREE.Points(geometry,material);points.name='江南四面轻雪';points.renderOrder=7;points.frustumCulled=false;points.userData.dynamic=true;parent.add(points);
 const temp=new THREE.Vector3(),stats={count,radius,distribution:'radial',clock:'absolute',time:0,intensity:1};let disposed=false;
 function update(dt,time,{night=0,intensity=1}={}){
  if(disposed)return;const clock=Number.isFinite(time)?time:stats.time,level=THREE.MathUtils.clamp(intensity,0,1.5);stats.time=clock;stats.intensity=level;material.uniforms.uNight.value=THREE.MathUtils.clamp(night,0,1);material.uniforms.uOpacity.value=.8*Math.min(1,level);points.visible=level>0;
  for(let i=0;i<count;i++){
   const f=flakes[i],phase=((clock/f.life+f.phase)%1+1)%1,altitude=.04+(1-phase)*f.span,wind=Math.sin(clock*.21+f.drift)*.04+Math.sin(clock*.75+f.drift)*f.flutter;
   temp.copy(f.normal).multiplyScalar(radius+altitude).addScaledVector(f.east,wind+(phase-.5)*.10).addScaledVector(f.north,Math.sin(clock*.43+f.drift)*f.flutter*.7);temp.toArray(positions,i*3);fades[i]=Math.min(1,phase*8,(1-phase)*10)*(i<count*Math.min(1,level)?1:0);
  }
  geometry.attributes.position.needsUpdate=true;geometry.attributes.aFade.needsUpdate=true;
 }
 update(0,0);
 return {update,stats,points,dispose(){if(disposed)return;disposed=true;points.removeFromParent();geometry.dispose();material.dispose();}};
}
