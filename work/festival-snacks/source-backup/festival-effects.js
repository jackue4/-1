import {THREE, R, normal, anchor, mesh, tube, seeded} from './core.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// All fireworks are real depth-tested geometry, in the same world as the park.
// A fixed particle pool keeps the finale bounded even on a phone.
const TAU = Math.PI * 2;
const SHOW_DURATION = 84;
const clamp = (v, lo=0, hi=1) => Math.max(lo, Math.min(hi, v));
const fireworksColors = {
  gold: '#ffbb36', rose: '#ff4f94', pink: '#ff66cb', mint: '#46ecac',
  blue: '#49aaff', lavender: '#a26bff', cream: '#fff0b8', coral: '#ff7c53'
};

export function createFestivalEffects({planet, palette}) {
  const root = new THREE.Group(); root.name = 'Festival kites, balloons and fireworks'; planet.add(root);
  const random = seeded(915732);
  const mobile = globalThis.matchMedia?.('(max-width: 760px)')?.matches ?? false;
  const motionQuery = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
  let reducedMotion = motionQuery?.matches ?? false;
  const motionChange = e => { reducedMotion = e.matches; };
  motionQuery?.addEventListener?.('change', motionChange);
  const ownedMaterials = new Set(), ownedGeometries = new Set();
  const ownMaterial = material => { ownedMaterials.add(material); return material; };
  const ownGeometry = geometry => { ownedGeometries.add(geometry); return geometry; };
  const inkMaterial = ownMaterial(new THREE.LineBasicMaterial({color:'#506761', transparent:true, opacity:.64}));
  const ropeMaterial = palette.m('#ccb99b');
  const colored = Object.fromEntries(Object.entries(fireworksColors).map(([key,value]) => [key, new THREE.Color(value)]));
  const doubleSide = color => {
    const material = palette.m(color).clone(); material.side = THREE.DoubleSide;
    return ownMaterial(material);
  };
  const ribbonMaterials = ['#ee95b3','#ffcf86','#9cdcc6','#b5a4df'].map(doubleSide);
  const kites = [], balloons = [], tethered = [];
  const rigidMaterial=ownMaterial(palette.m('#ffffff').clone());rigidMaterial.vertexColors=true;
  const clothMaterial=ownMaterial(rigidMaterial.clone());clothMaterial.side=THREE.DoubleSide;
  let rigidDrawCallsSaved=0;
  // Only combine children that move as one rigid body. Their parent remains
  // animated, and their per-face pastel colors survive as vertex colors.
  function bakeRigid(group,cloth=false){
    group.updateMatrixWorld(true);const inverse=group.matrixWorld.clone().invert(),parts=[];
    group.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&o.material.isMeshToonMaterial)parts.push(o);});
    if(parts.length<2)return;
    const geometries=parts.map(o=>{
      const geometry=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
      geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));
      if(!geometry.attributes.normal)geometry.computeVertexNormals();
      for(const name of Object.keys(geometry.attributes))if(name!=='position'&&name!=='normal')geometry.deleteAttribute(name);
      const vertexColors=new Float32Array(geometry.attributes.position.count*3);
      for(let i=0;i<geometry.attributes.position.count;i++)o.material.color.toArray(vertexColors,i*3);
      geometry.setAttribute('color',new THREE.BufferAttribute(vertexColors,3));geometry.clearGroups();return geometry;
    });
    const merged=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());
    if(!merged)return;
    const combined=mesh(group,ownGeometry(merged),cloth?clothMaterial:rigidMaterial);
    combined.name='Baked pastel balloon or kite';combined.castShadow=parts.some(p=>p.castShadow);combined.receiveShadow=true;
    parts.forEach(part=>part.removeFromParent());rigidDrawCallsSaved+=parts.length-1;
  }

  function makeLine(parent, count, material=inkMaterial) {
    const geometry = ownGeometry(new THREE.BufferGeometry());
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count*3),3).setUsage(THREE.DynamicDrawUsage));
    const line = new THREE.Line(geometry, material); line.frustumCulled = false; parent.add(line);
    return line;
  }

  // Cloth diamonds have four differently colored panels, a bowed string and a
  // ribbon of little bows. Their silhouettes stay readable at globe scale.
  const kiteSites = [[.18,-1.02,.98],[.37,1.12,1.35],[-.30,.65,1.12],[.22,2.15,1.38],[-.24,-2.10,1.24]];
  for (let i=0;i<kiteSites.length;i++) {
    const [lat,lon,height] = kiteSites[i];
    const rig = anchor(root,lat,lon,.08); rig.userData.dynamic = true; rig.name = 'Wind-dancing kite';
    const kite = new THREE.Group(); rig.add(kite); kite.position.set(.1,height,0);
    const tips = [[0,.245,0],[.175,0,0],[0,-.25,0],[-.175,0,0]];
    const materials = [ribbonMaterials[i%4], ribbonMaterials[(i+1)%4], doubleSide('#fff1d6'),ribbonMaterials[(i+2)%4]];
    for(let j=0;j<4;j++) {
      const geometry = ownGeometry(new THREE.BufferGeometry());
      geometry.setAttribute('position', new THREE.Float32BufferAttribute([0,0,.015,...tips[j],...tips[(j+1)%4]],3));
      geometry.computeVertexNormals(); mesh(kite,geometry,materials[j]);
    }
    const frame = ownGeometry(new THREE.BufferGeometry().setFromPoints([...tips,tips[0]].map(p => new THREE.Vector3(...p))));
    kite.add(new THREE.Line(frame,inkMaterial));
    bakeRigid(kite,true);
    const tail = makeLine(kite,25), string = makeLine(rig,22);
    const bowGeometry = ownGeometry(new THREE.BufferGeometry());
    bowGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-.047,.024,0,0,0,.008,-.047,-.024,0,.047,.024,0,.047,-.024,0,0,0,.008],3));
    bowGeometry.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(18).fill(1),3));
    bowGeometry.computeVertexNormals();
    const bows=new THREE.InstancedMesh(bowGeometry,clothMaterial,6);bows.frustumCulled=false;kite.add(bows);
    for(let j=0;j<6;j++)bows.setColorAt(j,ribbonMaterials[(i+j)%4].color);
    rigidDrawCallsSaved+=5;
    kites.push({rig,kite,height,phase:i*1.71,tail,string,bows});
  }

  // The envelope is built as colored cloth gores, with an open basket beneath.
  function makeBalloon(lat,lon,height,colors,index) {
    const rig = anchor(root,lat,lon,height); rig.userData.dynamic = true; rig.name = 'Pastel hot-air balloon';
    const body = new THREE.Group(); rig.add(body);
    const stripeCount = 10;
    for(let j=0;j<stripeCount;j++) {
      const geometry = ownGeometry(new THREE.SphereGeometry(.275,6,12,TAU*j/stripeCount,TAU/stripeCount,0,Math.PI*.86));
      const envelope = mesh(body,geometry,palette.m(colors[j%colors.length]),[0,.27,0]);
      envelope.scale.set(1,1.3,1); envelope.castShadow = false;
    }
    mesh(body,ownGeometry(new THREE.CylinderGeometry(.072,.06,.075,10)),palette.m(colors[0]),[0,-.048,0]);
    mesh(body,ownGeometry(new THREE.CylinderGeometry(.057,.049,.102,8,1,true)),palette.m('#b88c6c'),[0,-.30,0]);
    mesh(body,ownGeometry(new THREE.CylinderGeometry(.05,.046,.015,8)),palette.m('#8f6d55'),[0,-.35,0]);
    mesh(body,ownGeometry(new THREE.TorusGeometry(.058,.008,4,12)),palette.m('#e8c294'),[0,-.25,0],[Math.PI/2,0,0]);
    for(let j=0;j<4;j++) {
      const angle=TAU*j/4+Math.PI/4, x=Math.cos(angle)*.049, z=Math.sin(angle)*.049;
      const rope=tube(body,[[x,-.255,z],[x*1.35,-.06,z*1.35]],.003,ropeMaterial,2);
      ownGeometry(rope.geometry); rope.castShadow=false;
    }
    const lamp = mesh(body,ownGeometry(new THREE.SphereGeometry(.022,6,5)),palette.glow('#ffc47e'),[0,-.075,0]);
    lamp.castShadow=false;
    bakeRigid(body);
    balloons.push({rig,body,height,phase:index*2.16});
  }
  makeBalloon(.26,-1.40,1.27,['#ee9bb9','#fff0d6','#b0a0d5'],0);
  makeBalloon(.15,1.65,1.53,['#90cfc2','#fff0d6','#f1c982'],1);
  makeBalloon(-.16,2.80,1.20,['#b5a4dd','#fff0d6','#efaaa3'],2);

  const bunchSites = [[.10,-.63],[.37,.73],[-.29,1.55],[.25,-2.5]];
  for(let i=0;i<bunchSites.length;i++) {
    const rig=anchor(root,...bunchSites[i],.16); rig.userData.dynamic=true; rig.name='Ribbon-tied wishing balloons';
    for(let j=0;j<4;j++) {
      const holder=new THREE.Group(); rig.add(holder);
      const hue=['#f39bbc','#a7dace','#f4cc8b','#b8a4db'][(i+j)%4];
      const balloon=mesh(holder,ownGeometry(new THREE.SphereGeometry(.085,10,8)),palette.m(hue));
      balloon.scale.y=1.22;
      const knot=mesh(holder,ownGeometry(new THREE.ConeGeometry(.016,.032,5)),palette.m(hue),[0,-.115,0],[Math.PI,0,0]);
      knot.castShadow=false;
      bakeRigid(holder);
      const line=makeLine(rig,14);
      tethered.push({holder,line,x:(j-1.5)*.102,z:Math.sin(j*2.3)*.055,y:.59+j*.08,phase:(i*4+j)*.74});
    }
  }

  const capacity = mobile ? 2400 : 3600;
  const positions = new Float32Array(capacity*3), velocities = new Float32Array(capacity*3), colors = new Float32Array(capacity*3);
  const sizes = new Float32Array(capacity), opacity = new Float32Array(capacity), life = new Float32Array(capacity), age = new Float32Array(capacity);
  const drag = new Float32Array(capacity), gravity = new Float32Array(capacity), trailClock = new Float32Array(capacity), twinkle = new Float32Array(capacity);
  const trails = new Uint8Array(capacity);
  const particlesGeometry=ownGeometry(new THREE.BufferGeometry());
  particlesGeometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
  particlesGeometry.setAttribute('aColor',new THREE.BufferAttribute(colors,3).setUsage(THREE.DynamicDrawUsage));
  particlesGeometry.setAttribute('aSize',new THREE.BufferAttribute(sizes,1).setUsage(THREE.DynamicDrawUsage));
  particlesGeometry.setAttribute('aOpacity',new THREE.BufferAttribute(opacity,1).setUsage(THREE.DynamicDrawUsage));
  const particleMaterial=ownMaterial(new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,depthTest:true,toneMapped:false,
    // Add light in RGB, but preserve coverage in the offscreen alpha channel.
    // Plain AdditiveBlending squares alpha before the transparent anime pass.
    blending:THREE.CustomBlending,blendEquation:THREE.AddEquation,
    blendSrc:THREE.SrcAlphaFactor,blendDst:THREE.OneFactor,
    blendEquationAlpha:THREE.AddEquation,blendSrcAlpha:THREE.OneFactor,blendDstAlpha:THREE.OneMinusSrcAlphaFactor,
    uniforms:{uNight:{value:0},uPixelRatio:{value:Math.min(globalThis.devicePixelRatio||1,1.5)}},
    vertexShader:`
      attribute vec3 aColor; attribute float aSize; attribute float aOpacity;
      uniform float uPixelRatio; varying vec3 vColor; varying float vOpacity;
      void main(){
        vec4 mv=modelViewMatrix*vec4(position,1.0);
        gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp(aSize*3.6*uPixelRatio/max(1.0,-mv.z),1.2,32.0);
        vColor=aColor; vOpacity=aOpacity;
      }`,
    fragmentShader:`
      uniform float uNight; varying vec3 vColor; varying float vOpacity;
      void main(){
        vec2 p=(gl_PointCoord-.5)*2.0; float r=length(p);
        if(r>1.0 || vOpacity<.002)discard;
        float halo=exp(-r*r*3.8)*.58;
        float core=(1.0-smoothstep(.07,.42,r))*.80;
        float rays=(pow(1.0-abs(p.x),24.0)+pow(1.0-abs(p.y),24.0))*(1.0-r)*.13;
        float coverage=clamp((halo+core+rays)*vOpacity*uNight,0.0,1.0);
        gl_FragColor=vec4(vColor*(1.10+core*.15),coverage);
        #include <colorspace_fragment>
      }`
  }));
  const particles = new THREE.Points(particlesGeometry,particleMaterial); particles.name='Choreographed fireworks';
  particles.frustumCulled=false; particles.userData.dynamic=true; particles.renderOrder=8; particles.visible=false; root.add(particles);
  let cursor=0, activeParticles=0, activeRockets=[], showTime=0, showActive=false, showCycle=0, nextEvent=0;
  let disposed=false, lastNight=0, preview=false, chapter='等待夜幕', totalBursts=0;
  const castleUp=normal(.78,.05);
  // The castle's surface normal alone projects against the globe at the lower
  // show camera angle. A more northerly sky axis clears the silhouetted island.
  const up=normal(1.0,.05);
  const right=new THREE.Vector3(1,0,0).addScaledVector(up,-up.x).normalize();
  const depth=new THREE.Vector3().crossVectors(right,up).normalize();
  // Hearts and stars open toward the main castle viewpoint rather than lying
  // edge-on in the planet's tangent plane. They still occupy ordinary 3D space.
  const faceDepth=normal(.30,.20);
  const faceRight=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),faceDepth).normalize();
  const faceUp=new THREE.Vector3().crossVectors(faceDepth,faceRight).normalize();
  const scratch=new THREE.Vector3();
  const fireworkLight=new THREE.PointLight('#ffd9ac',0,6,2);
  fireworkLight.position.copy(castleUp).multiplyScalar(R+1.9);fireworkLight.userData.dynamic=true;fireworkLight.name='Soft firework reflection';root.add(fireworkLight);
  let lightPulse=0;

  function emit(x,y,z,vx,vy,vz,color,duration,size,gravityAmount=.3,dragAmount=.55,trailKind=0) {
    const i=cursor; cursor=(cursor+1)%capacity; const j=i*3;
    positions[j]=x; positions[j+1]=y; positions[j+2]=z;
    velocities[j]=vx; velocities[j+1]=vy; velocities[j+2]=vz;
    colors[j]=color.r; colors[j+1]=color.g; colors[j+2]=color.b;
    life[i]=duration; age[i]=0; sizes[i]=size; opacity[i]=1;
    gravity[i]=gravityAmount; drag[i]=dragAmount; trails[i]=trailKind; trailClock[i]=random()*.11; twinkle[i]=random()*TAU;
  }
  function emitLocal(center,x,y,z,color,duration,size,gravityAmount,dragAmount,trailKind,facing=false) {
    const bx=facing?faceRight:right,by=facing?faceUp:up,bz=facing?faceDepth:depth;
    emit(center.x,center.y,center.z,
      bx.x*x+by.x*y+bz.x*z,bx.y*x+by.y*y+bz.y*z,bx.z*x+by.z*y+bz.z*z,
      color,duration,size,gravityAmount,dragAmount,trailKind);
  }
  function createBurst(center,type,primary='gold',secondary='rose',scale=1) {
    const count=Math.round((type==='willow'?155:type==='heart'?130:type==='star'?120:type==='saturn'?176:160)*(mobile?.72:1)*(reducedMotion?.64:1));
    const colorA=colored[primary],colorB=colored[secondary]; totalBursts++;
    lightPulse=Math.max(lightPulse,reducedMotion?.12:.26);fireworkLight.color.copy(colorA).lerp(colored.cream,.45);
    for(let i=0;i<count;i++) {
      const t=(i/count)*TAU;
      let x,y,z,duration=2.6+random()*.65,gravityAmount=.28,dragAmount=.48,trailKind=(i%4===0?1:0);
      const hue=i%3===0?colorB:colorA;
      if(type==='heart') {
        x=Math.pow(Math.sin(t),3)*.94;
        y=(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))*.061;
        z=(random()-.5)*.055; gravityAmount=.12; dragAmount=.42;
      } else if(type==='star') {
        const segment=i/count*10, corner=Math.floor(segment), f=segment-corner;
        const a0=Math.PI/2+corner*Math.PI/5, a1=a0+Math.PI/5, r0=corner%2===0?1.03:.44, r1=corner%2===0?.44:1.03;
        x=Math.cos(a0)*r0*(1-f)+Math.cos(a1)*r1*f;
        y=Math.sin(a0)*r0*(1-f)+Math.sin(a1)*r1*f; z=(random()-.5)*.04; gravityAmount=.12;
      } else if(type==='saturn' && i<count*.63) {
        const a=(i/(count*.63))*TAU;
        x=Math.cos(a)*1.10; y=Math.sin(a)*.38; z=Math.sin(a)*.48;
        gravityAmount=.16; duration=3.1;
      } else if(type==='spiral') {
        const arm=i%3, along=Math.floor(i/3)/Math.ceil(count/3), a=along*TAU*1.33+arm*TAU/3;
        const radius=.18+along*.9; x=Math.cos(a)*radius; y=Math.sin(a)*radius; z=(along-.5)*.16;
        gravityAmount=.1; duration=3.2;
      } else {
        const vertical=1-2*(i+.5)/count, azimuth=i*2.39996323;
        const sphereRadius=Math.sqrt(Math.max(0,1-vertical*vertical));
        const speed=type==='willow'?(.72+random()*.42):(.70+random()*.28);
        const inner=type==='saturn'?.47:1;
        x=Math.cos(azimuth)*sphereRadius*speed*inner; y=vertical*speed*inner; z=Math.sin(azimuth)*sphereRadius*speed*inner;
        if(type==='willow'){duration=4.2+random()*.8; gravityAmount=.40; dragAmount=.38; trailKind=i%3!==0?2:0; y=y*.55+.32;}
      }
      const shapeJitter=(type==='heart'||type==='star'||type==='spiral') ? .018 : .04;
      x=(x+(random()-.5)*shapeJitter)*scale; y=(y+(random()-.5)*shapeJitter)*scale; z*=scale;
      emitLocal(center,x,y,z,hue,duration,(type==='willow'?26:29)+random()*12,gravityAmount,dragAmount,trailKind,type!=='willow');
    }
    // A small warm pearl at ignition, never a full-screen flash.
    emit(center.x,center.y,center.z,0,0,0,colored.cream,.20,56,0,1,0);
  }

  // Each chapter has breathing room; the same original score repeats after a
  // quiet final fade. Launch times, colors and shapes are intentionally authored.
  const score=[];
  function cue(at,x,height,type,a,b,scale=1,z=0) {score.push({at,x,height,type,a,b,scale,z});}
  cue(.6,0,2.45,'star','gold','cream',.78);
  cue(4.1,-1.10,2.20,'peony','rose','lavender',.84);
  cue(6.4,1.05,2.50,'peony','mint','gold',.84);
  cue(10.6,-.88,2.52,'heart','rose','pink',.85);
  cue(11.6,.94,2.65,'heart','coral','gold',.82);
  cue(15.5,0,3.0,'star','gold','cream',.91);
  cue(19.0,-1.44,2.16,'peony','blue','lavender',.96);
  cue(20.2,1.45,2.31,'peony','pink','mint',.96);
  cue(23.2,0,2.93,'saturn','lavender','gold',1.02);
  cue(27.6,-.75,2.57,'spiral','mint','blue',.9);
  cue(28.5,.86,2.75,'spiral','rose','cream',.9);
  cue(33.0,-1.65,2.28,'willow','gold','coral',.93);
  cue(34.2,1.62,2.51,'willow','gold','cream',.95);
  cue(38.0,0,3.02,'heart','pink','lavender',1.04);
  cue(41.5,-1.03,2.73,'star','cream','gold',.76);
  cue(42.4,1.09,2.89,'star','mint','blue',.76);
  cue(46.1,0,3.08,'spiral','lavender','rose',1.1);
  cue(50.3,-1.64,2.41,'saturn','blue','mint',.81);
  cue(51.2,1.59,2.43,'saturn','pink','gold',.81);
  cue(54.5,0,2.91,'willow','gold','cream',1.06);
  cue(58.4,-1.49,2.69,'heart','pink','coral',.80);
  cue(59.1,1.48,2.87,'heart','lavender','rose',.80);
  cue(62.4,0,3.1,'star','gold','cream',.92);
  cue(65.1,-1.88,2.32,'peony','rose','gold',.84);
  cue(65.8,1.84,2.55,'peony','mint','blue',.84);
  cue(67.1,-.63,2.92,'spiral','lavender','pink',.84);
  cue(67.9,.66,3.08,'saturn','gold','cream',.84);
  cue(70.1,-1.58,2.75,'willow','gold','coral',1.02);
  cue(70.7,1.55,2.89,'willow','gold','cream',1.02);
  cue(71.5,0,3.20,'heart','rose','cream',1.13);
  cue(73.0,-.67,2.85,'peony','mint','lavender',.83);
  cue(73.4,.73,3.1,'star','gold','cream',.88);

  function launch(event) {
    const target=up.clone().multiplyScalar(R+event.height).addScaledVector(right,event.x).addScaledVector(depth,event.z)
      .addScaledVector(faceDepth,-1.5);
    const start=castleUp.clone().multiplyScalar(R+.42).addScaledVector(right,event.x*.50).addScaledVector(depth,-.10);
    activeRockets.push({start,target,event,age:0,duration:1.15+random()*.23,trail:0,phase:random()*TAU});
  }
  function clearFireworks() {
    life.fill(0); opacity.fill(0); activeParticles=0; activeRockets.length=0;
    particlesGeometry.attributes.aOpacity.needsUpdate=true; particles.visible=false;lightPulse=0;fireworkLight.intensity=0;
  }
  function startShow() {
    if(disposed)return false;
    clearFireworks(); showTime=0; nextEvent=0; showCycle=0; totalBursts=0;
    showActive=!preview&&lastNight>.28; chapter=showActive?'第一幕 · 星愿初响':'等待夜幕';
    return true;
  }
  function updateRockets(dt) {
    for(let i=activeRockets.length-1;i>=0;i--) {
      const rocket=activeRockets[i]; rocket.age+=dt;
      const p=clamp(rocket.age/rocket.duration), ease=1-Math.pow(1-p,1.28);
      const position=scratch.copy(rocket.start).lerp(rocket.target,ease).addScaledVector(right,Math.sin(p*Math.PI)*.11*Math.sin(rocket.phase));
      rocket.trail+=dt*50;
      while(rocket.trail>=1){
        rocket.trail--;
        emit(position.x,position.y,position.z,(random()-.5)*.04,(random()-.5)*.04,(random()-.5)*.04,colored.gold,.55+random()*.38,15+random()*8,.12,.3);
      }
      emit(position.x,position.y,position.z,0,0,0,colored.cream,.12,32,0,.2);
      if(p>=1){createBurst(rocket.target,rocket.event.type,rocket.event.a,rocket.event.b,rocket.event.scale);activeRockets.splice(i,1);}
    }
  }
  function updateParticles(dt,time) {
    let active=0;
    const newTrails=[];
    for(let i=0;i<capacity;i++) {
      if(life[i]<=0)continue;
      age[i]+=dt;
      if(age[i]>=life[i]){life[i]=0;opacity[i]=0;continue;}
      const j=i*3, damp=Math.exp(-drag[i]*dt), grav=gravity[i]*dt;
      velocities[j]=(velocities[j]-up.x*grav)*damp;
      velocities[j+1]=(velocities[j+1]-up.y*grav)*damp;
      velocities[j+2]=(velocities[j+2]-up.z*grav)*damp;
      positions[j]+=velocities[j]*dt;positions[j+1]+=velocities[j+1]*dt;positions[j+2]+=velocities[j+2]*dt;
      const remaining=1-age[i]/life[i], fade=Math.min(1,remaining*3.8);
      opacity[i]=fade*(.80+.20*Math.sin(time*11+twinkle[i]));
      active++;
      if(trails[i] && remaining>.20) {
        trailClock[i]+=dt;
        const rate=trails[i]===2?.075:.11;
        if(trailClock[i]>rate){
          trailClock[i]-=rate;
          newTrails.push([positions[j],positions[j+1],positions[j+2],colors[j],colors[j+1],colors[j+2],trails[i]===2?.82:.45]);
        }
      }
    }
    for(const trail of newTrails){
      if(life[cursor]<=0)active++;
      emit(trail[0],trail[1],trail[2],0,0,0,{r:trail[3],g:trail[4],b:trail[5]},trail[6],15+random()*7,.08,.2);
    }
    activeParticles=Math.min(capacity,active);
    for(const attribute of Object.values(particlesGeometry.attributes))attribute.needsUpdate=true;
  }

  const moteCount=mobile?48:84;
  const motePositions=new Float32Array(moteCount*3),moteColors=new Float32Array(moteCount*3),moteSizes=new Float32Array(moteCount),moteOpacities=new Float32Array(moteCount);
  const moteSeeds=[];
  for(let i=0;i<moteCount;i++) {
    const lat=(random()-.35)*1.7,lon=random()*TAU;
    moteSeeds.push({lat,lon,height:.10+random()*.38,phase:random()*TAU,speed:.4+random()*.6});
    const color=i%3===0?colored.mint:colored.gold;color.toArray(moteColors,i*3);moteSizes[i]=(12+random()*7)/3.6;
  }
  const moteGeometry=ownGeometry(new THREE.BufferGeometry());
  moteGeometry.setAttribute('position',new THREE.BufferAttribute(motePositions,3).setUsage(THREE.DynamicDrawUsage));
  moteGeometry.setAttribute('aColor',new THREE.BufferAttribute(moteColors,3));
  moteGeometry.setAttribute('aSize',new THREE.BufferAttribute(moteSizes,1));
  moteGeometry.setAttribute('aOpacity',new THREE.BufferAttribute(moteOpacities,1).setUsage(THREE.DynamicDrawUsage));
  const motes=new THREE.Points(moteGeometry,particleMaterial);motes.frustumCulled=false;motes.userData.dynamic=true;motes.name='Golden evening fireflies';root.add(motes);
  const bowPose=new THREE.Object3D();

  function updateDecorations(time,night) {
    const t=reducedMotion?time*.24:time;
    for(const kite of kites) {
      const {phase,height}=kite;
      kite.kite.position.set(.16+Math.sin(t*.48+phase)*.15,height+Math.sin(t*.71+phase)*.055,Math.cos(t*.43+phase)*.07);
      kite.kite.rotation.set(Math.sin(t*.61+phase)*.09,Math.sin(phase)*.40+Math.sin(t*.33+phase)*.18,Math.sin(t*.54+phase)*.17);
      const tailPositions=kite.tail.geometry.attributes.position.array;
      for(let j=0;j<25;j++) {
        const p=j/24;
        tailPositions[j*3]=Math.sin(t*2.1+phase-p*7)*.075*p;
        tailPositions[j*3+1]=-.25-p*.69;
        tailPositions[j*3+2]=Math.sin(t*1.9+phase-p*5)*.04*p;
      }
      kite.tail.geometry.attributes.position.needsUpdate=true;
      for(let j=0;j<6;j++) {
        const index=3+j*4;bowPose.position.fromArray(tailPositions,index*3);bowPose.rotation.z=Math.sin(t*2.1+phase-index*.2)*.5;bowPose.updateMatrix();kite.bows.setMatrixAt(j,bowPose.matrix);
      }
      kite.bows.instanceMatrix.needsUpdate=true;
      const stringPositions=kite.string.geometry.attributes.position.array;
      const end=kite.kite.position;
      for(let j=0;j<22;j++) {
        const p=j/21;
        stringPositions[j*3]=end.x*p+Math.sin(p*Math.PI)*.07;
        stringPositions[j*3+1]=end.y*p-.03;
        stringPositions[j*3+2]=end.z*p+Math.sin(p*Math.PI)*.05;
      }
      kite.string.geometry.attributes.position.needsUpdate=true;
    }
    for(const balloon of balloons) {
      balloon.body.position.set(Math.sin(t*.13+balloon.phase)*.11,Math.sin(t*.35+balloon.phase)*.075,Math.cos(t*.19+balloon.phase)*.09);
      balloon.body.rotation.set(Math.sin(t*.22+balloon.phase)*.04,t*.025+balloon.phase*.14,Math.sin(t*.29+balloon.phase)*.055);
    }
    for(const balloon of tethered) {
      const x=balloon.x+Math.sin(t*.9+balloon.phase)*.045,y=balloon.y+Math.cos(t*.8+balloon.phase)*.035,z=balloon.z+Math.cos(t*.7+balloon.phase)*.035;
      balloon.holder.position.set(x,y,z);balloon.holder.rotation.z=-x*.18;
      const array=balloon.line.geometry.attributes.position.array;
      for(let j=0;j<14;j++){const p=j/13;array[j*3]=x*p+Math.sin(p*Math.PI)*.032;array[j*3+1]=(y-.10)*p;array[j*3+2]=z*p;}
      balloon.line.geometry.attributes.position.needsUpdate=true;
    }
    motes.visible=night>.03&&!preview;
    if(motes.visible){
      for(let i=0;i<moteCount;i++){
        const s=moteSeeds[i],p=normal(s.lat+Math.sin(t*.24+s.phase)*.025,s.lon+Math.sin(t*.19+s.phase)*.025).multiplyScalar(R+s.height+Math.sin(t*.55*s.speed+s.phase)*.065);
        p.toArray(motePositions,i*3);moteOpacities[i]=(.15+.55*Math.pow(.5+.5*Math.sin(t*1.6+s.phase),2))*night;
      }
      moteGeometry.attributes.position.needsUpdate=true;moteGeometry.attributes.aOpacity.needsUpdate=true;
    }
  }
  function update(dt,time,env={}) {
    if(disposed)return;
    const step=clamp(Number.isFinite(dt)?dt:0,0,.1);
    const elapsed=Number.isFinite(time)?time:0;
    const night=clamp(Number.isFinite(env.night)?env.night:0);preview=!!env.preview;if(!preview)lastNight=night;
    particleMaterial.uniforms.uNight.value=clamp((night-.12)/.6);
    updateDecorations(elapsed,night);
    // The selection preview borrows this world and forces daylight. Hide the
    // show there, preserving its exact timeline, rockets and frozen particles.
    if(preview){particles.visible=false;fireworkLight.intensity=0;return;}
    if(night<.20){
      if(showActive||activeParticles||activeRockets.length)clearFireworks();
      showActive=false;showTime=0;nextEvent=0;chapter='等待夜幕';return;
    }
    if(!showActive&&night>.40){showActive=true;showTime=0;nextEvent=0;}
    if(!showActive)return;
    const showStep=step*(reducedMotion?.66:1);showTime+=showStep;
    if(showTime>=SHOW_DURATION){showTime%=SHOW_DURATION;nextEvent=0;showCycle++;}
    chapter=showTime<9?'第一幕 · 星愿初响':showTime<19?'第二幕 · 写给你的心':showTime<33?'第三幕 · 银河花园':showTime<46?'第四幕 · 金色流年':showTime<62?'第五幕 · 梦的万花筒':showTime<77?'终章 · 今夜为你盛放':'余韵 · 把愿望留在星空';
    while(nextEvent<score.length&&score[nextEvent].at<=showTime){
      const event=score[nextEvent++];
      if(!reducedMotion||nextEvent%2===1||showTime>70)launch(event);
    }
    if(showStep>0){updateRockets(showStep);updateParticles(showStep,elapsed);}particles.visible=activeParticles>0;
    lightPulse*=Math.exp(-showStep*1.8);fireworkLight.intensity=lightPulse*4*night;
  }
  function getState(){return{
    active:showActive&&!preview,suspended:showActive&&preview,showTime:Number(showTime.toFixed(2)),duration:SHOW_DURATION,progress:showTime/SHOW_DURATION,
    chapter,cycle:showCycle,activeParticles,activeRockets:activeRockets.length,particleBudget:capacity,
    bursts:totalBursts,lightPulse,kites:kites.length,hotAirBalloons:balloons.length,tetheredBalloons:tethered.length,rigidDrawCallsSaved,
    preview,reducedMotion,disposed
  };}
  function dispose(){
    if(disposed)return;disposed=true;clearFireworks();showActive=false;
    motionQuery?.removeEventListener?.('change',motionChange);
    // Palette materials belong to the world. This module only frees its clones.
    root.traverse(object=>{if(object.geometry)ownedGeometries.add(object.geometry);});
    for(const geometry of ownedGeometries)geometry.dispose();
    for(const material of ownedMaterials)material.dispose();
    root.removeFromParent();
  }
  updateDecorations(0,0);
  return {root,update,startShow,getState,dispose};
}
