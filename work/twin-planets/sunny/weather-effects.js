import * as THREE from 'three';

const TAU=Math.PI*2,UP=new THREE.Vector3(0,1,0);
const clamp=value=>THREE.MathUtils.clamp(Number(value)||0,0,1);
const direction=(lat,lon)=>new THREE.Vector3(Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon));
function random(seed=19623){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}

/** Bounded, original weather rigs. Terrain effects inherit the planet's actual rotation. */
export function createWeatherEffects({scene,planet,height,radius=2.45}){
  const rng=random(),media=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)'),mobile=globalThis.matchMedia?.('(max-width: 700px)')?.matches||false;
  let reducedMotion=!!media?.matches,disposed=false,suspended=false,clock=0,meteorsSeen=0;
  const onMotion=event=>{reducedMotion=event.matches;};media?.addEventListener?.('change',onMotion);
  const root=new THREE.Group();root.name='Seasonal weather over the little island';planet.add(root);
  const sky=new THREE.Group();sky.name='Camera sky meteor shower';scene.add(sky);root.visible=sky.visible=false;
  const level={tornado:0,storm:0,rainbow:0,meteorShower:0};
  const geometries=new Set(),materials=new Set(),textures=new Set();
  const ownGeometry=g=>(geometries.add(g),g),ownMaterial=m=>(materials.add(m),m);
  const gradient=new THREE.DataTexture(new Uint8Array([142,182,222,255]),4,1,THREE.RedFormat);gradient.needsUpdate=true;gradient.magFilter=gradient.minFilter=THREE.NearestFilter;textures.add(gradient);
  const dummy=new THREE.Object3D(),q=new THREE.Quaternion(),cameraLocal=new THREE.Vector3(),worldPosition=new THREE.Vector3();
  const toon=(color,opacity=1)=>ownMaterial(new THREE.MeshToonMaterial({color,gradientMap:gradient,transparent:true,opacity,depthWrite:false}));
  const basic=(color,opacity=1)=>ownMaterial(new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide}));
  const at=(normal,elevation)=>{const frame=new THREE.Group();frame.position.copy(normal).multiplyScalar(height(normal)+elevation);frame.quaternion.setFromUnitVectors(UP,normal);root.add(frame);return frame;};

  // A gentle cotton funnel dances in a western meadow rather than demolishing the village.
  const funnelNormal=direction(.44,-.51),funnel=at(funnelNormal,.012);funnel.name='Cotton tornado';
  const puffCount=mobile?76:112,puffGeometry=ownGeometry(new THREE.SphereGeometry(1,9,6)),puffMaterial=toon('#c7ddd4');
  const puffs=new THREE.InstancedMesh(puffGeometry,puffMaterial,puffCount);puffs.name='Spiralling cotton clouds';puffs.frustumCulled=false;funnel.add(puffs);
  const puffSeeds=[];
  for(let i=0;i<puffCount;i++){
    const fraction=i/(puffCount-1),angle=fraction*TAU*6.8;
    puffSeeds.push({fraction,angle,phase:rng()*TAU,size:.8+rng()*.4});
    puffs.setColorAt(i,new THREE.Color(i%5===0?'#fff0dc':i%3?'#d2e7df':'#91b9bc'));
  }
  const leafCount=mobile?24:38,leafMaterial=toon('#ffcf89'),leafGeometry=ownGeometry(new THREE.SphereGeometry(1,5,3));
  const leaves=new THREE.InstancedMesh(leafGeometry,leafMaterial,leafCount);leaves.name='Leaves riding the wind';leaves.frustumCulled=false;funnel.add(leaves);
  const leafSeeds=[];
  for(let i=0;i<leafCount;i++){leafSeeds.push({phase:rng()*TAU,y:rng(),radius:.08+rng()*.18});leaves.setColorAt(i,new THREE.Color(['#efa27d','#f8d389','#b9d299','#f8dfc4'][i%4]));}
  const funnelBands=new THREE.Group();funnel.add(funnelBands);
  const windMaterial=basic('#e6f7e3'),windGeometry=ownGeometry(new THREE.TorusGeometry(1,.018,5,48));
  const windRings=[];
  for(let i=0;i<3;i++){const ring=new THREE.Mesh(windGeometry,windMaterial);ring.rotation.x=Math.PI/2;funnelBands.add(ring);windRings.push(ring);}
  const spiralGeometry=ownGeometry(new THREE.BufferGeometry()),spiralVertices=new Float32Array(160*6);spiralGeometry.setAttribute('position',new THREE.BufferAttribute(spiralVertices,3));
  const spiralMaterial=ownMaterial(new THREE.LineBasicMaterial({color:'#f2fff2',transparent:true,opacity:.5,depthWrite:false}));
  const spiral=new THREE.LineSegments(spiralGeometry,spiralMaterial);spiral.frustumCulled=false;funnel.add(spiral);

  // A broad double rainbow rises behind the garden. Its vertical follows the local surface.
  const rainbowNormal=direction(.42,.05),rainbow=at(rainbowNormal,.035);rainbow.name='Seven colour garden rainbow';
  const rainbowTurn=new THREE.Group();rainbow.add(rainbowTurn);rainbowTurn.position.z=-.36;
  const rainbowColors=['#ed6c95','#f2a04e','#ebcf56','#68c78c','#53bed0','#7695df','#b47cd5'];
  const rainbowMaterials=[],arcSegments=mobile?56:80;
  for(let i=0;i<7;i++){
    // Broaden inward so the rainbow keeps the verified skyline height. Atmospheric
    // fog and the scene's filmic exposure must not wash these translucent bands white.
    const material=basic(rainbowColors[i]);material.toneMapped=false;material.fog=false;
    const arc=new THREE.Mesh(ownGeometry(new THREE.RingGeometry(.711+(6-i)*.042,.753+(6-i)*.042,arcSegments,1,0,Math.PI)),material);
    arc.name=`Rainbow band ${i+1}`;rainbowTurn.add(arc);rainbowMaterials.push(material);
  }
  const outerMaterial=basic('#f8efcc');const outerArc=new THREE.Mesh(ownGeometry(new THREE.RingGeometry(1.065,1.077,arcSegments,1,0,Math.PI)),outerMaterial);rainbowTurn.add(outerArc);
  const rainbowMistMaterial=toon('#f5f9e4'),rainbowMist=new THREE.InstancedMesh(puffGeometry,rainbowMistMaterial,10);rainbowTurn.add(rainbowMist);
  for(let i=0;i<10;i++){const side=i<5?-1:1;dummy.position.set(side*(.865+(i%5-2)*.045),.025+Math.sin(i*2.3)*.022,.025);dummy.rotation.set(0,0,0);dummy.scale.set(.14,.065,.10);dummy.updateMatrix();rainbowMist.setMatrixAt(i,dummy.matrix);}

  // Additional storm streaks fall radially; water impacts are sampled only inside real lakes.
  const rainCount=mobile?380:680,rainGeometry=ownGeometry(new THREE.BufferGeometry()),rainPositions=new Float32Array(rainCount*6),rainSeeds=[];
  rainGeometry.setAttribute('position',new THREE.BufferAttribute(rainPositions,3).setUsage(THREE.DynamicDrawUsage));
  const rainMaterial=ownMaterial(new THREE.LineBasicMaterial({color:'#c6e8ec',transparent:true,opacity:0,depthWrite:false}));
  const rain=new THREE.LineSegments(rainGeometry,rainMaterial);rain.name='Heavy radial rain curtain';rain.frustumCulled=false;root.add(rain);
  for(let i=0;i<rainCount;i++){const n=direction(Math.asin(rng()*2-1),rng()*TAU);rainSeeds.push({n,floor:Math.max(radius,height(n)),phase:rng(),speed:.72+rng()*.55});}
  const rippleCount=mobile?24:42,rippleGeometry=ownGeometry(new THREE.RingGeometry(.045,.052,20)),rippleAlpha=new Float32Array(rippleCount);
  rippleGeometry.setAttribute('aFade',new THREE.InstancedBufferAttribute(rippleAlpha,1).setUsage(THREE.DynamicDrawUsage));
  const rippleMaterial=ownMaterial(new THREE.ShaderMaterial({
    uniforms:{uOpacity:{value:0}},
    vertexShader:'attribute float aFade; varying float vFade; void main(){vFade=aFade; gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}',
    fragmentShader:'uniform float uOpacity; varying float vFade; void main(){gl_FragColor=vec4(.67,.91,.91,vFade*uOpacity); #include <colorspace_fragment>\n}',
    transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false
  }));
  // Shader chunks must start on their own line on WebGL1 and WebGL2 drivers.
  rippleMaterial.fragmentShader=rippleMaterial.fragmentShader.replace('; #include',';\n#include');
  const ripples=new THREE.InstancedMesh(rippleGeometry,rippleMaterial,rippleCount);ripples.name='Rain rings over the actual bays';ripples.frustumCulled=false;root.add(ripples);
  const rippleSeeds=[];
  for(let i=0;i<2400&&rippleSeeds.length<rippleCount;i++){const n=direction(Math.asin(rng()*2-1),rng()*TAU);if(height(n)<radius-.025)rippleSeeds.push({n,phase:rng(),rotation:new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),n)});}
  ripples.count=rippleSeeds.length;

  // Several simultaneous long, softly coloured ribbons form a shower instead of one rare star.
  const meteorCount=mobile?7:11,segments=12,meteorPositions=new Float32Array(meteorCount*(segments+1)*6),meteorUvs=[],meteorFades=new Float32Array(meteorCount*(segments+1)*2),meteorColors=[],meteorIndices=[],meteorSeeds=[];
  for(let i=0;i<meteorCount;i++){
    meteorSeeds.push({phase:i/meteorCount*5.7,x:-.98+rng()*.94,y:.54+rng()*.38,dx:.69+rng()*.38,dy:-.30-rng()*.25,duration:1.35+rng()*.65,period:4.9+rng()*1.4,cycle:-1});
    const color=new THREE.Color(['#ffe8b8','#c8e9ff','#ffd0db','#d7d4ff'][i%4]);
    for(let j=0;j<=segments;j++){meteorUvs.push(j/segments,0,j/segments,1);meteorColors.push(...color.toArray(),...color.toArray());if(j<segments){const k=i*(segments+1)*2+j*2;meteorIndices.push(k,k+1,k+2,k+1,k+3,k+2);}}
  }
  const meteorGeometry=ownGeometry(new THREE.BufferGeometry());meteorGeometry.setAttribute('position',new THREE.BufferAttribute(meteorPositions,3).setUsage(THREE.DynamicDrawUsage));meteorGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(meteorUvs,2));meteorGeometry.setAttribute('aFade',new THREE.BufferAttribute(meteorFades,1).setUsage(THREE.DynamicDrawUsage));meteorGeometry.setAttribute('color',new THREE.Float32BufferAttribute(meteorColors,3));meteorGeometry.setIndex(meteorIndices);
  const meteorMaterial=ownMaterial(new THREE.ShaderMaterial({
    uniforms:{uVisibility:{value:0}},
    vertexShader:'attribute float aFade; attribute vec3 color; varying vec2 vUv; varying float vFade; varying vec3 vColor; void main(){vUv=uv;vFade=aFade;vColor=color;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform float uVisibility; varying vec2 vUv; varying float vFade; varying vec3 vColor; void main(){float edge=pow(max(0.,1.-abs(vUv.y*2.-1.)),1.25);float tail=pow(1.-vUv.x,1.35);float core=pow(edge,8.);gl_FragColor=vec4(mix(vColor,vec3(1.),core*.48),edge*tail*vFade*uVisibility);\n#include <colorspace_fragment>\n}',
    transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,toneMapped:false,fog:false
  }));
  const meteors=new THREE.Mesh(meteorGeometry,meteorMaterial);meteors.name='Wishful multicolour meteor shower';meteors.frustumCulled=false;sky.add(meteors);
  let activeMeteors=0,lastMeteorNight=0;

  function drawTornado(){
    const strength=level.tornado;funnel.visible=strength>.002;if(!funnel.visible)return;
    const spin=clock*(reducedMotion?.9:1.7);funnel.scale.setScalar(.92+strength*.08);puffMaterial.opacity=strength*.77;leafMaterial.opacity=strength*.94;windMaterial.opacity=strength*.40;spiralMaterial.opacity=strength*.47;
    for(let i=0;i<puffSeeds.length;i++){
      const seed=puffSeeds[i],u=seed.fraction,y=.04+u*1.14,a=seed.angle-spin*(1.2-u*.42),r=.032+Math.pow(u,1.13)*.265,size=(.028+.053*u)*seed.size;
      dummy.position.set(Math.cos(a)*r+Math.sin(clock*.48+u*2.2)*u*.075,y,Math.sin(a)*r);dummy.rotation.set(u,spin*.28+seed.phase,u*.3);dummy.scale.set(size*1.8,size*.91,size*1.1);dummy.updateMatrix();puffs.setMatrixAt(i,dummy.matrix);
    }
    puffs.instanceMatrix.needsUpdate=true;
    for(let i=0;i<leafSeeds.length;i++){
      const seed=leafSeeds[i],y=(seed.y+clock*.13)%1,a=seed.phase-spin*1.8,r=.12+y*.29+seed.radius;
      dummy.position.set(Math.cos(a)*r,y*1.09+.025,Math.sin(a)*r);dummy.rotation.set(a*1.7,a,y*4+spin);dummy.scale.set(.022,.006,.014);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);
    }
    leaves.count=reducedMotion?Math.ceil(leafCount*.55):leafCount;leaves.instanceMatrix.needsUpdate=true;
    windRings.forEach((ring,i)=>{const cycle=(clock*.5+i/3)%1,s=.13+cycle*.38;ring.scale.set(s,s,s);ring.position.y=.018+i*.007;ring.rotation.z=spin*.15;});
    for(let i=0;i<160;i++)for(let end=0;end<2;end++){const u=(i+end)/160,a=u*TAU*4.8-spin*1.14,r=.055+u*.30,o=(i*2+end)*3;spiralVertices[o]=Math.cos(a)*r+Math.sin(clock*.48+u*2.2)*u*.075;spiralVertices[o+1]=u*1.14+.025;spiralVertices[o+2]=Math.sin(a)*r;}
    spiralGeometry.attributes.position.needsUpdate=true;
  }
  function drawRainbow(camera){
    const amount=level.rainbow;rainbow.visible=amount>.002;if(!rainbow.visible)return;
    planet.updateWorldMatrix(true,false);rainbow.updateWorldMatrix(true,false);camera.getWorldPosition(cameraLocal);rainbow.worldToLocal(cameraLocal);
    // Turn only around radial up; pitch and planet orbit remain physically correct.
    rainbowTurn.rotation.y=Math.atan2(cameraLocal.x,cameraLocal.z);rainbowTurn.position.set(-Math.sin(rainbowTurn.rotation.y)*.20,0,-Math.cos(rainbowTurn.rotation.y)*.20);
    rainbowMaterials.forEach((material,i)=>{material.opacity=amount*(.57+(i%2)*.025);});outerMaterial.opacity=amount*.10;rainbowMistMaterial.opacity=amount*.35;
  }
  function drawStorm(env){
    const amount=level.storm;rain.visible=amount>.002;ripples.visible=amount>.002;if(!rain.visible)return;
    rainMaterial.opacity=amount*.57;rippleMaterial.uniforms.uOpacity.value=amount*.62;
    for(let i=0;i<rainSeeds.length;i++){
      const seed=rainSeeds[i],n=seed.n,fraction=1-((clock*(reducedMotion?.54:.92)*seed.speed+seed.phase)%1),r=seed.floor+.015+fraction*1.55,length=.09+amount*.12,o=i*6,wind=.026+clamp(env.wind)*.056;
      rainPositions[o]=n.x*r;rainPositions[o+1]=n.y*r;rainPositions[o+2]=n.z*r;
      rainPositions[o+3]=n.x*(r+length)+wind;rainPositions[o+4]=n.y*(r+length);rainPositions[o+5]=n.z*(r+length)+wind*.36;
    }
    rainGeometry.setDrawRange(0,(reducedMotion?Math.ceil(rainCount*.62):rainCount)*2);rainGeometry.attributes.position.needsUpdate=true;
    for(let i=0;i<rippleSeeds.length;i++){
      const seed=rippleSeeds[i],age=(clock*(reducedMotion?.48:.82)+seed.phase)%1,scale=.24+age*1.55;
      dummy.position.copy(seed.n).multiplyScalar(radius+.012);dummy.quaternion.copy(seed.rotation);dummy.scale.setScalar(scale);dummy.updateMatrix();ripples.setMatrixAt(i,dummy.matrix);rippleAlpha[i]=Math.sin(age*Math.PI)*(1-age)*.95;
    }
    ripples.instanceMatrix.needsUpdate=true;rippleGeometry.attributes.aFade.needsUpdate=true;
  }
  function drawMeteors(env,camera){
    const night=THREE.MathUtils.smoothstep(clamp(env.night),.48,.88),visibility=level.meteorShower*night*(1-clamp(env.storm)*.86)*(1-clamp(env.snow)*.78);lastMeteorNight=visibility;
    meteors.visible=visibility>.002;meteorMaterial.uniforms.uVisibility.value=visibility;activeMeteors=0;if(!meteors.visible)return;
    camera.getWorldPosition(worldPosition);sky.position.copy(worldPosition);camera.getWorldQuaternion(q);sky.quaternion.copy(q);
    const distance=22,halfHeight=Math.tan(THREE.MathUtils.degToRad(camera.fov*.5))*distance,halfWidth=halfHeight*camera.aspect,limit=reducedMotion?Math.ceil(meteorCount*.55):meteorCount;
    for(let i=0;i<meteorSeeds.length;i++){
      const seed=meteorSeeds[i],t=clock+seed.phase,cycle=Math.floor(t/seed.period),age=t%seed.period,progress=age/seed.duration,active=i<limit&&progress<1;
      if(active){activeMeteors++;if(cycle!==seed.cycle){meteorsSeen++;seed.cycle=cycle;}}
      const fade=active?Math.min(1,age/.16,(seed.duration-age)/.28):0,length=Math.min(1,progress*4),hx=(seed.x+seed.dx*progress)*halfWidth,hy=(seed.y+seed.dy*progress)*halfHeight,dx=seed.dx*halfWidth,dy=seed.dy*halfHeight,normalizer=1/Math.max(.001,Math.hypot(dx,dy)),sx=-dy*normalizer,sy=dx*normalizer;
      for(let j=0;j<=segments;j++){
        const u=j/segments,w=(.019+.017*(1-u))*Math.min(1.7,halfHeight/7.5),x=hx-dx*u*.54*length,y=hy-dy*u*.54*length;
        for(let edge=0;edge<2;edge++){const vertex=i*(segments+1)*2+j*2+edge,index=vertex*3,sign=edge?1:-1;meteorPositions[index]=x+sx*w*sign;meteorPositions[index+1]=y+sy*w*sign;meteorPositions[index+2]=-distance;meteorFades[vertex]=fade;}
      }
    }
    meteorGeometry.attributes.position.needsUpdate=true;meteorGeometry.attributes.aFade.needsUpdate=true;
  }
  function update(dt,time,env={},camera,pixelRatio=1){
    if(disposed||!camera)return;
    suspended=!!env.preview;root.visible=!suspended;sky.visible=!suspended;if(suspended)return;
    const delta=THREE.MathUtils.clamp(Number(dt)||0,0,.1);clock+=delta;
    for(const name of Object.keys(level)){const target=clamp(env[name]);level[name]=THREE.MathUtils.damp(level[name],target,3.2,delta);}
    drawTornado();drawRainbow(camera);drawStorm(env);drawMeteors(env,camera);
  }
  function dispose(){if(disposed)return;disposed=true;root.visible=sky.visible=false;root.removeFromParent();sky.removeFromParent();media?.removeEventListener?.('change',onMotion);for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose();for(const texture of textures)texture.dispose();}
  return{root,sky,update,dispose,getState:()=>({disposed,suspended,reducedMotion,mobile,elapsed:clock,intensity:{...level},tornadoVisible:root.visible&&funnel.visible,tornadoAnchor:{lat:.44,lon:-.51},rainbowVisible:root.visible&&rainbow.visible,rainbowBands:7,rainbowAnchor:{lat:.42,lon:.05},stormVisible:root.visible&&rain.visible,stormStreaks:rainCount,waterRipples:rippleSeeds.length,meteorVisibility:sky.visible?lastMeteorNight:0,activeMeteors:sky.visible?activeMeteors:0,meteorsSeen,meteorBudget:meteorCount,puffBudget:puffCount,leafBudget:leafCount,drawCallBudget:18})};
}

