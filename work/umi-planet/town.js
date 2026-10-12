import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// A fresh, compact coastal town. Every prop is built in metres of the small
// planet, then baked into a material batch; there is no imported world state.
const UP=new THREE.Vector3(0,1,0),TAU=Math.PI*2;
function random(seed){let n=seed|0;return()=>{n=(Math.imul(n,1664525)+1013904223)|0;return(n>>>0)/4294967296;};}

export function createTown({planet,surface,palette={}}){
  const root=new THREE.Group();root.name='Hanami coastal town';planet.add(root);
  const batches=new Map(),materials=[],textures=[],occupied=[],placements=[],blossomSources=[];
  const rng=random(27421),stats={houses:0,mainIslandHouses:0,secondIslandHouses:0,shops:0,cherryTrees:0,gardenPatches:0,gardenFences:0,seawallBlocks:0,docks:0,boats:0,powerPoles:0,stations:0,drawCalls:0,triangles:0};
  const mat=(name,color,extra={})=>{const {roughness,metalness,...appearance}=extra,m=new THREE.MeshToonMaterial({color,gradientMap:palette.ramp??null,...appearance});m.name=name;materials.push(m);return m;};
  const walls=[mat('Warm plaster','#eee6cf'),mat('Rice-paper plaster','#faf0dc'),mat('Blue-grey timber','#769096'),mat('Muted apricot plaster','#d7b9a2')];
  const roofBlue=mat('Deep indigo ceramic roofs','#334d66'),roofRust=mat('Sun-faded vermilion roofs','#ad665c');
  const trim=mat('Ivory window casings','#e6d6b6'),wood=mat('Chestnut timber','#71564b'),darkWood=mat('Soot-grey shutters','#444f58');
  const metal=mat('Painted iron and rain gutters','#6e7c7b'),stone=mat('Warm concrete','#c9c6b6'),paving=mat('Soft grey-blue paving','#a7b4b1');
  const glazing=mat('Blue reflective windows','#607f8b',{roughness:.32,metalness:.08,emissive:'#f8c783',emissiveIntensity:.025});
  const litGlass=mat('Warm shop windows','#daac77',{roughness:.55,emissive:'#ffd898',emissiveIntensity:.18});
  const red=mat('Muted red shop details','#bc6f69'),sage=mat('Green canvas awnings','#7b9b85'),ivory=mat('Cream shop details','#f6e5c3');
  const bark=mat('Cherry bark','#78646a'),leaves=mat('Small town greenery','#86a885');
  const leafDark=mat('Garden leaf shadow','#648c75',{side:THREE.DoubleSide}),leafLight=mat('Sunlit grass tips','#b2be81',{side:THREE.DoubleSide});
  const flowers=[mat('Cherry blossom shadow','#d993b0'),mat('Cherry blossom midtone','#f1b6ca'),mat('Cherry blossom light','#ffdfdf'),mat('Cherry blossom ivory','#fff0e4')];
  const blossomEdge=mat('Fine five-petal cherry sprays','#ffe8ec',{map:createBlossomMap(),alphaTest:.45,side:THREE.DoubleSide});
  const labelMaterials=new Map();

  function createBlossomMap(){
    const size=128,rgba=new Uint8Array(size*size*4),centres=[[.29,.29,.19,.2],[.71,.42,.205,.7],[.43,.73,.20,-.5]];
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const u=(x+.5)/size,v=(y+.5)/size;let alpha=0,heart=0;
      for(const [cx,cy,r,turn] of centres){
        const dx=(u-cx)/r,dy=(v-cy)/r,d=Math.hypot(dx,dy),a=Math.atan2(dy,dx)-turn,lobe=Math.cos(5*a),edge=.79+.21*lobe-.06*Math.pow(Math.max(0,(lobe-.8)/.2),2);
        const coverage=1-THREE.MathUtils.smoothstep(d,edge-.045,edge+.025);if(coverage>alpha){alpha=coverage;heart=1-THREE.MathUtils.smoothstep(d,.05,.22);}
      }
      const i=(y*size+x)*4;rgba.set([255,Math.round(249-heart*74),Math.round(242-heart*37),Math.round(alpha*255)],i);
    }
    const texture=new THREE.DataTexture(rgba,size,size,THREE.RGBAFormat);texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;textures.push(texture);return texture;
  }

  function labelMaterial(text,color='#344c59',background='#fff2dc'){
    const key=text+color+background;if(labelMaterials.has(key))return labelMaterials.get(key);
    let texture;
    if(typeof document!=='undefined'){
      const canvas=document.createElement('canvas');canvas.width=512;canvas.height=160;
      const ctx=canvas.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,512,160);
      ctx.strokeStyle=color;ctx.lineWidth=7;ctx.strokeRect(7,7,498,146);
      ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 86px "Yu Gothic", "Microsoft YaHei", sans-serif';ctx.fillText(text,256,81,464);
      texture=new THREE.CanvasTexture(canvas);
    }else texture=new THREE.DataTexture(new Uint8Array([248,234,209,255]),1,1,THREE.RGBAFormat);
    texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;textures.push(texture);
    const m=mat(`Sign: ${text}`,'#ffffff',{map:texture,roughness:.94,side:THREE.DoubleSide});labelMaterials.set(key,m);return m;
  }

  function anchor(lat,lon,offset=.003,yaw=0){
    const normal=surface.direction(lat,lon),east=new THREE.Vector3(Math.cos(lon),0,-Math.sin(lon)),south=new THREE.Vector3().crossVectors(east,normal).normalize();
    return new THREE.Matrix4().makeBasis(east,normal,south).setPosition(normal.clone().multiplyScalar(surface.height(normal)+offset)).multiply(new THREE.Matrix4().makeRotationY(yaw));
  }
  function add(geometry,material,base,position=[0,0,0],rotation=[0,0,0],scale=[1,1,1]){
    if(geometry.index){const expanded=geometry.toNonIndexed();geometry.dispose();geometry=expanded;}
    const local=new THREE.Matrix4().compose(new THREE.Vector3(...position),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),new THREE.Vector3(...scale));
    geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(base,local));
    if(!batches.has(material))batches.set(material,[]);batches.get(material).push(geometry);
  }
  function box(m,base,p,s,r=[0,0,0]){add(new THREE.BoxGeometry(...s),m,base,p,r);}
  function cylinder(m,base,p,radius,height,sides=7,rotation=[0,0,0],top=radius){add(new THREE.CylinderGeometry(top,radius,height,sides),m,base,p,rotation);}
  function rod(m,base,a,b,radius,sides=6){
    const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),delta=to.clone().sub(from),g=new THREE.CylinderGeometry(radius*.72,radius,delta.length(),sides);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP,delta.normalize()));g.translate(...from.add(to).multiplyScalar(.5).toArray());add(g,m,base);
  }
  function globe(m,base,p,s,segments=8,rings=6){add(new THREE.SphereGeometry(1,segments,rings),m,base,p,[0,0,0],s);}
  function flowerCloud(m,base,p,s,phase){
    const geometry=new THREE.SphereGeometry(1,10,6),a=geometry.attributes.position;
    for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i),lobe=1+.115*Math.sin(x*5.5+phase)*Math.cos(z*5.3-y*2)+.052*Math.sin(z*10.1+y*4.4);a.setXYZ(i,x*lobe,y*lobe,z*lobe);}
    geometry.computeVertexNormals();add(geometry,m,base,p,[0,phase*.23,0],s);
  }
  function sign(text,base,p,w,h,color){
    box(wood,base,[p[0],p[1],p[2]-.003],[w+.008,h+.007,.009]);
    add(new THREE.PlaneGeometry(w,h),labelMaterial(text,color),base,[p[0],p[1],p[2]+.002]);
  }
  function trackYaw(lon){const d=.24*Math.cos(2*lon-.6)+.225*Math.cos(3*lon+1.4);return Math.atan2(d,Math.cos(surface.trackLat(lon)));}
  function validSite(lat,lon,radius,clearance=.091){
    const n=surface.direction(lat,lon);
    if(surface.height(n)<surface.R+.05||surface.land(n)<.6||Math.abs(lat-surface.trackLat(lon))<clearance+radius/surface.R)return false;
    for(let i=0;i<6;i++){const a=i*TAU/6,nn=surface.direction(lat+Math.sin(a)*radius/surface.R,lon+Math.cos(a)*radius/(surface.R*Math.max(.4,Math.cos(lat))));if(surface.height(nn)<surface.R+.025||surface.land(nn)<.52)return false;}
    return !occupied.some(p=>n.distanceTo(p.n)*surface.R<radius+p.radius+.025);
  }
  function reserve(lat,lon,radius,type){occupied.push({n:surface.direction(lat,lon),radius,type});placements.push({lat,lon,radius,type,groundHeight:surface.height(surface.direction(lat,lon)),trackDistance:Math.abs(lat-surface.trackLat(lon))});}

  function pitchedRoof(base,y,w,d,pitch,material){
    const shape=new THREE.Shape();shape.moveTo(-w/2,-.009);shape.lineTo(w/2,-.009);shape.lineTo(w/2,0);shape.lineTo(0,pitch);shape.lineTo(-w/2,0);shape.closePath();
    const geo=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false,steps:1,curveSegments:1});geo.translate(0,0,-d/2);add(geo,material,base,[0,y,0]);
    box(material,base,[0,y+pitch+.001,0],[.011,.009,d+.009]);
    const angle=Math.atan2(pitch,w/2),length=Math.hypot(pitch,w/2);
    for(const z of [-d/2-.001,d/2+.001])for(const side of [-1,1])box(trim,base,[side*w/4,y+pitch/2,z],[length+.009,.009,.008],[0,0,-side*angle]);
    for(const side of [-1,1])box(metal,base,[side*w/2,y-.005,0],[.006,.007,d+.012]);
    // Quiet parallel ceramic tile courses, readable only when moving closer.
    for(let j=1;j<4;j++)for(const side of [-1,1])box(material,base,[side*w*j/8,y+pitch*(1-j/4)+.003,0],[.004,.004,d]);
  }

  function windowFront(base,x,y,z,w,h,warm=false){
    box(wood,base,[x,y,z],[w+.009,h+.009,.009]);box(warm?litGlass:glazing,base,[x,y,z+.005],[w,h,.005]);
    box(trim,base,[x,y,z+.008],[.003,h+.003,.003]);box(trim,base,[x,y,z+.008],[w+.003,.003,.003]);
    box(trim,base,[x,y-h/2-.004,z+.008],[w+.019,.006,.015]);
  }

  function house(lat,lon,index,isSecond=false){
    const w=.147+rng()*.043,d=.122+rng()*.046,wallH=.157+rng()*.056,pitch=.048+rng()*.020,radius=Math.hypot(w,d)/2+.018;
    if(!validSite(lat,lon,radius))return false;
    const base=anchor(lat,lon,.003,(lat<surface.trackLat(lon)?Math.PI:0)+(index%5===1?.16:index%5===3?-.10:0)),roofMaterial=index%4===0?roofRust:roofBlue,shop=index%4===1||index===0;
    reserve(lat,lon,radius,'house');stats.houses++;if(isSecond)stats.secondIslandHouses++;else stats.mainIslandHouses++;
    box(stone,base,[0,.008,0],[w+.019,.016,d+.024]);
    box(walls[index%walls.length],base,[0,.016+wallH/2,0],[w,wallH,d]);
    box(wood,base,[0,.027,d/2+.002],[w,.008,.009]);box(trim,base,[0,.016+wallH*.52,d/2+.002],[w+.005,.009,.009]);
    for(const x of [-w/2+.006,w/2-.006])box(index%3?trim:darkWood,base,[x,.016+wallH/2,d/2+.004],[.007,wallH,.010]);
    pitchedRoof(base,.016+wallH,w+.032,d+.035,pitch,roofMaterial);
    const secondY=.016+wallH*.76;
    windowFront(base,-w*.235,secondY,d/2+.006,w*.29,.048);windowFront(base,w*.235,secondY,d/2+.006,w*.29,.048);
    // One side window and an exposed downpipe stop side elevations being blank.
    box(wood,base,[w/2+.003,secondY,-d*.07],[.008,.055,.048]);box(glazing,base,[w/2+.008,secondY,-d*.07],[.004,.044,.040]);
    box(trim,base,[w/2+.011,secondY,-d*.07],[.003,.047,.003]);
    const rear=base.clone().multiply(new THREE.Matrix4().makeRotationY(Math.PI));
    windowFront(rear,-w*.23,secondY,d/2+.006,w*.28,.045);windowFront(rear,w*.23,secondY,d/2+.006,w*.28,.045);
    windowFront(rear,w*.19,.069,d/2+.006,w*.28,.041);box(trim,rear,[0,.016+wallH*.52,d/2+.005],[w+.007,.008,.009]);
    box(wood,base,[-w/2-.003,secondY,-d*.07],[.008,.055,.044]);box(glazing,base,[-w/2-.008,secondY,-d*.07],[.004,.044,.036]);
    cylinder(metal,base,[-w/2-.006,wallH/2+.016,-d*.35],.003,wallH,5);
    if(shop){
      stats.shops++;windowFront(base,-w*.16,.068,d/2+.007,w*.48,.061,true);
      box(wood,base,[w*.32,.061,d/2+.01],[w*.24,.089,.010]);box(glazing,base,[w*.32,.072,d/2+.016],[w*.17,.05,.004]);
      const awning=index%2?red:sage;
      box(awning,base,[0,.112,d/2+.029],[w+.014,.009,.052],[-.20,0,0]);
      box(awning,base,[0,.102,d/2+.054],[w+.014,.019,.004]);
      for(let j=0;j<6;j++)box(ivory,base,[-w/2+w*(j+.5)/6,.102,d/2+.057],[w/13,.018,.002]);
      sign(index%3===0?'珈琲':'こはる',base,[0,.135,d/2+.008],w*.77,.032,index%2?'#7e4b45':'#455d59');
      // Small noren curtain, outside stool and a potted plant.
      for(let j=0;j<3;j++)box(sage,base,[w*.235+j*w*.056,.094,d/2+.022],[w*.050,.024,.004]);
      cylinder(wood,base,[-w*.39,.025,d/2+.054],.014,.005,8);for(const x of [-w*.39-.009,-w*.39+.009])box(wood,base,[x,.012,d/2+.054],[.003,.024,.003]);
    }else{
      box(wood,base,[-w*.25,.061,d/2+.007],[.039,.089,.011]);box(glazing,base,[-w*.25,.077,d/2+.014],[.022,.044,.004]);
      cylinder(metal,base,[-w*.236,.049,d/2+.016],.0022,.009,5,[Math.PI/2,0,0]);windowFront(base,w*.20,.073,d/2+.007,.052,.048);
      box(roofMaterial,base,[-w*.24,.112,d/2+.018],[.063,.008,.040],[-.13,0,0]);
    }
    if(index%3===2){
      box(stone,base,[0,secondY-.032,d/2+.027],[w*.82,.009,.046]);
      box(metal,base,[0,secondY-.003,d/2+.049],[w*.82,.004,.004]);
      for(let j=0;j<6;j++)box(metal,base,[-w*.39+j*w*.156,secondY-.018,d/2+.049],[.0025,.029,.0025]);
    }
    // A rain-darkened entry slab and two compact ceramic planters.
    box(paving,base,[0,.004,d/2+.028],[w+.025,.009,.055]);
    for(const side of [-1,1]){cylinder(index%2?red:stone,base,[side*(w/2+.015),.012,d/2+.015],.009,.023,7,undefined,.011);globe(leaves,base,[side*(w/2+.015),.031,d/2+.015],[.016,.017,.015],6,4);}
    if(index%4===2&&lat>.20&&lon<.15){
      const x=-w/2-.039;for(let j=0;j<6;j++)box(wood,base,[x,.024,-d/2+j*d/5],[.006,.048,.009]);
      for(const y of [.015,.037])box(trim,base,[x,y,0],[.005,.005,d+.016]);stats.gardenFences++;
    }
    return true;
  }

  function station(){
    const lon=-.30,lat=surface.trackLat(lon)+.11,base=anchor(lat,lon,.006,trackYaw(lon));
    reserve(lat,lon,.34,'station');stats.stations=1;
    box(stone,base,[0,.016,.083],[.67,.032,.255]);box(paving,base,[0,.034,.083],[.67,.005,.255]);
    // A continuous pale safety edge, with subdued yellow tactile paving.
    box(ivory,base,[0,.039,.205],[.67,.006,.012]);box(roofRust,base,[0,.039,.182],[.62,.004,.006]);
    for(const x of [-.23,-.075,.075,.23]){
      box(wood,base,[x,.114,.012],[.008,.151,.009]);box(wood,base,[x,.114,.153],[.008,.151,.009]);
      box(wood,base,[x,.184,.08],[.009,.009,.19]);
    }
    box(wood,base,[0,.176,.012],[.55,.01,.012]);box(wood,base,[0,.176,.153],[.55,.01,.012]);
    box(roofBlue,base,[0,.197,.039],[.585,.015,.147],[.17,0,0]);box(roofBlue,base,[0,.197,.139],[.585,.015,.065],[-.17,0,0]);
    box(trim,base,[0,.196,.184],[.593,.009,.011]);
    sign('花海駅',base,[0,.153,.034],.181,.049,'#416475');
    // Bench, timetable, vending cabinet and an understated station lamp.
    box(wood,base,[-.12,.071,.064],[.112,.008,.034]);box(wood,base,[-.12,.089,.048],[.112,.032,.006]);
    for(const x of [-.16,-.08])box(metal,base,[x,.052,.064],[.006,.033,.023]);
    box(ivory,base,[.245,.086,.055],[.033,.10,.034]);box(glazing,base,[.245,.099,.074],[.027,.064,.003]);
    for(let j=0;j<3;j++)box(red,base,[.238+j*.007,.106,.076],[.003,.025,.002]);
    box(metal,base,[-.30,.10,.103],[.004,.136,.004]);sign('花海',base,[-.30,.17,.106],.061,.025,'#416475');
    for(const x of [-.31,.31]){
      box(stone,base,[x,.051,-.022],[.040,.024,.075]);
      for(let j=0;j<5;j++)globe(flowers[(j+1)%flowers.length],base,[x+(j%2-.5)*.015,.078,-.054+j*.015],[.016,.016,.017],6,4);
    }
  }

  function cherry(lat,lon,index){
    const size=.80+rng()*.25,radius=.13*size;if(!validSite(lat,lon,radius,.068))return false;
    reserve(lat,lon,radius,'cherry tree');stats.cherryTrees++;
    const base=anchor(lat,lon,.005,index*.91),scaled=base.clone().multiply(new THREE.Matrix4().makeScale(size,size,size));
    // Three forked stems are genuinely modelled; clouds grow at their ends.
    rod(bark,scaled,[0,0,0],[-.012,.085,.004],.015,7);rod(bark,scaled,[-.012,.085,.004],[.007,.172,-.011],.010,6);
    const crowns=[];
    for(let j=0;j<3;j++){
      const a=j*2.13+.24,tip=[Math.sin(a)*.073,.170+j*.019,Math.cos(a)*.065],fork=[Math.sin(a)*.036,.125+j*.012,Math.cos(a)*.032];
      rod(bark,scaled,[-.009,.072,.003],fork,.008,6);rod(bark,scaled,fork,tip,.005,5);
      const outer=[tip[0]*1.36,tip[1]+.017,tip[2]*1.22];rod(bark,scaled,tip,outer,.003,5);crowns.push(tip,outer);
    }
    crowns.push([.008,.239,-.018],[-.051,.230,.024],[.046,.239,-.051]);
    crowns.forEach((p,j)=>{
      const sx=.082+(j%3)*.009,sy=.034+(j%2)*.007,sz=.076+(j%3)*.006,phase=j*1.3+index;
      flowerCloud(flowers[(j+index)%3],scaled,p,[sx,sy,sz],phase);
      flowerCloud(flowers[2+(j%2)],scaled,[p[0]-.021,p[1]+.025,p[2]+.012],[sx*.73,.023,sz*.75],phase+1.7);
      for(let k=0;k<11;k++){
        const a=k*2.399+phase,ny=.80-1.40*(k+.5)/11,r=Math.sqrt(1-ny*ny),n=new THREE.Vector3(Math.sin(a)*r,ny,Math.cos(a)*r),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),n),e=new THREE.Euler().setFromQuaternion(q);
        add(new THREE.PlaneGeometry(.046+(k%3)*.009,.048),blossomEdge,scaled,[p[0]+n.x*sx*.97,p[1]+n.y*sy*1.06,p[2]+n.z*sz*.97],[e.x,e.y,e.z]);
      }
      if(j<3)blossomSources.push(new THREE.Vector3(p[0],p[1]+.03,p[2]).applyMatrix4(scaled));
    });
    // A few fallen petal dashes keep the trunk rooted in its season.
    for(let j=0;j<11;j++){const a=rng()*TAU,r=.025+rng()*.07;globe(flowers[j%4],scaled,[Math.cos(a)*r,.002,Math.sin(a)*r],[.006,.0016,.003],5,3);}
    return true;
  }

  function powerPole(lat,lon,index){
    const n=surface.direction(lat,lon);if(surface.height(n)<surface.R+.05||Math.abs(lat-surface.trackLat(lon))<.070||occupied.some(p=>n.distanceTo(p.n)*surface.R<p.radius+.026))return;
    const base=anchor(lat,lon,.006),h=.295;
    cylinder(wood,base,[0,h/2,0],.0035,h,7);box(darkWood,base,[0,h-.038,0],[.072,.005,.006]);
    for(const x of [-.03,0,.03])cylinder(ivory,base,[x,h-.029,0],.003,.010,6);
    box(metal,base,[.006,.11,.006],[.014,.028,.012]);stats.powerPoles++;
    // Short drooping service leads are local to each block, never over rails.
    if(index%2===0){const points=[];for(let j=0;j<=10;j++){const t=j/10;points.push(new THREE.Vector3(-.03+t*.16,h-.025-Math.sin(t*Math.PI)*.026,.008));}add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),10,.0011,3,false),darkWood,base);}
  }

  function garden(lat,lon,index){
    if(!validSite(lat,lon,.053,.066))return false;
    reserve(lat,lon,.053,'garden patch');stats.gardenPatches++;const base=anchor(lat,lon,.004,index*.81);
    // An irregular low hedge, airy grass strokes and a handful of small blooms.
    for(let j=0;j<4;j++){const a=j*2.399;globe(j%2?leaves:leafDark,base,[Math.sin(a)*.028,.016+j%2*.008,Math.cos(a)*.027],[.033,.024,.030],7,5);}
    for(let j=0;j<9;j++){
      const a=j*2.399+index,x=Math.sin(a)*(.042+(j%3)*.006),z=Math.cos(a)*(.042+(j%3)*.005);
      for(let k=0;k<3;k++){
        const h=.024+(j%4)*.006,geometry=new THREE.BufferGeometry(),points=[-.002,0,0,.002,0,0,.004,h*.6,.006,.007,h,.011];
        geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,0,.6,.5,1],2));geometry.setIndex([0,1,2,1,3,2]);geometry.computeVertexNormals();add(geometry,k%2?leafLight:leafDark,base,[x,0,z],[0,a+k*1.65,0]);
      }
      if(j%3===0){rod(leaves,base,[x,0,z],[x,.037,z],.0013,4);for(let k=0;k<5;k++){const a=k*TAU/5;globe(flowers[(index+j)%4],base,[x+Math.cos(a)*.006,.039,z+Math.sin(a)*.006],[.0045,.002,.004],5,3);}}
    }
    return true;
  }

  function shoreline(lon){
    let low=-.43,high=.13;
    // Southern main-island coast, deliberately far from the railway corridor.
    for(let i=0;i<24;i++){const lat=(low+high)/2,n=surface.direction(lat,lon);if(surface.height(n)>surface.R+.016)high=lat;else low=lat;}return high;
  }
  function seaside(){
    for(let i=0;i<22;i++){
      const lon=-.65+i*.024,lat=shoreline(lon)+.010,n=surface.direction(lat,lon);if(surface.land(n)<.45||Math.abs(lat-surface.trackLat(lon))<.11)continue;
      const next=shoreline(lon+.008),yaw=Math.atan2((next-shoreline(lon))/.008,Math.cos(lat)),base=anchor(lat,lon,.002,yaw);
      for(let j=0;j<2;j++){box(j?stone:paving,base,[(j-.5)*.013,.012+j*.025,0],[.077,.023,.047],[0,.035*Math.sin(i*2.1),0]);stats.seawallBlocks++;}
      box(stone,base,[0,.048,0],[.082,.007,.054]);
    }
    const lon=-.45,lat=shoreline(lon),n=surface.direction(lat,lon),base=anchor(lat,lon,surface.R+.045-surface.height(n));stats.docks=1;
    for(let j=0;j<12;j++)box(wood,base,[0,0,.014+j*.024],[.143,.011,.021]);
    for(const x of [-.057,.057])for(const z of [.008,.14,.278])cylinder(darkWood,base,[x,-.010,z],.006,.103,7);
    box(wood,base,[0,-.014,.14],[.109,.013,.305]);
    for(const x of [-.06,.06])cylinder(wood,base,[x,.036,.277],.006,.076,7);
    rod(trim,base,[-.06,.065,.277],[.06,.065,.277],.002,5);
    const boatLat=lat-.061,boatLon=lon+.047,bn=surface.direction(boatLat,boatLon),boatBase=anchor(boatLat,boatLon,surface.R+.017-surface.height(bn),-.20),outline=[[-.034,-.086],[.034,-.086],[.043,.032],[0,.109],[-.043,.032]],p=[],uv=[],idx=[];
    for(const y of [-.020,.014])for(const [x,z]of outline){const s=y<0?.61:1;p.push(x*s,y,z*s);uv.push(x/.09+.5,z/.2+.5);}
    for(let j=0;j<5;j++){const k=(j+1)%5;idx.push(j,j+5,k,k,j+5,k+5);}
    idx.push(0,1,2,0,2,3,0,3,4);const hull=new THREE.BufferGeometry();hull.setAttribute('position',new THREE.Float32BufferAttribute(p,3));hull.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));hull.setIndex(idx);hull.computeVertexNormals();add(hull,roofBlue,boatBase);
    for(let j=0;j<5;j++){const a=outline[j],b=outline[(j+1)%5];rod(ivory,boatBase,[a[0],.016,a[1]],[b[0],.016,b[1]],.0032,5);}
    box(wood,boatBase,[0,-.003,-.010],[.047,.008,.11]);for(const z of [-.04,.026])box(trim,boatBase,[0,.011,z],[.064,.006,.019]);rod(wood,boatBase,[-.045,.024,-.065],[.043,.022,.059],.002,5);stats.boats=1;
  }

  function lane(lonStart,lonEnd,latitude){
    const positions=[],uv=[],indices=[],segments=44,halfWidth=.012;
    for(let i=0;i<=segments;i++){
      const lon=THREE.MathUtils.lerp(lonStart,lonEnd,i/segments),lat=latitude(lon);
      for(const side of [-1,1]){const n=surface.direction(lat+side*halfWidth,lon);positions.push(...n.multiplyScalar(surface.height(n)+.004).toArray());uv.push(i/segments,side*.5+.5);}
      if(i<segments){const nextLon=THREE.MathUtils.lerp(lonStart,lonEnd,(i+.5)/segments),n=surface.direction(latitude(nextLon),nextLon);
        if(surface.height(n)>surface.R+.055&&!occupied.some(p=>p.type==='house'&&n.distanceTo(p.n)*surface.R<p.radius*.80)){const j=i*2;indices.push(j,j+2,j+1,j+1,j+2,j+3);}
      }
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();add(geometry,paving,new THREE.Matrix4());
  }

  station();
  const main=[];
  for(const lon of [-.82,-.65,-.48,-.08,.09,.26])main.push([surface.trackLat(lon)+.153,lon]);
  for(const lon of [-.78,-.61,-.44,-.27,-.10,.07,.24])main.push([surface.trackLat(lon)+.267,lon]);
  for(const lon of [-.66,-.47,-.28,-.09,.10])main.push([.598,lon]);
  for(const [lat,lon] of main)if(stats.mainIslandHouses<18)house(lat,lon,stats.houses);
  // Alternative upper-block sites cover low coastal sections without placing a
  // building on a beach or moving anything into the reserved train corridor.
  for(const [lat,lon] of [[.42,-.89],[.48,.17],[.68,-.45],[.68,-.19],[.51,-.79],[.36,-.23]])if(stats.mainIslandHouses<17)house(lat,lon,stats.houses);
  for(const lon of [-.50,-.32,-.14,.045])if(stats.mainIslandHouses<19)house(surface.trackLat(lon)-.171,lon,stats.houses);
  for(const [lat,lon] of [[-.16,1.65],[-.16,1.85],[-.015,1.67],[-.015,1.88],[-.27,1.76]])if(stats.secondIslandHouses<4)house(lat,lon,stats.houses,true);
  for(const [lat,lon] of [[.43,-.70],[.435,-.50],[.435,-.32],[.49,-.16],[-.18,-.33],[.54,-.78],[.69,-.59],[.69,-.32],[.59,.24],[.28,-.92],[-.09,-.46],[-.12,-.13],[.12,.28],[-.29,1.63],[-.29,1.91],[.09,1.77],[.48,3.10],[.28,3.38],[.42,3.03]])if(stats.cherryTrees<11)cherry(lat,lon,stats.cherryTrees);
  lane(-.70,.13,lon=>surface.trackLat(lon)+.22);lane(-.68,.13,()=>.54);lane(1.61,1.94,()=>-.093);
  for(let i=0;i<6;i++){const lon=-.75+i*.18;powerPole(surface.trackLat(lon)+.105,lon,i);}
  for(let row=0;row<7&&stats.gardenPatches<23;row++)for(let col=0;col<9&&stats.gardenPatches<23;col++)garden(-.12+row*.107,-.72+col*.105+(row%2)*.028,stats.gardenPatches);
  seaside();

  for(const [material,pieces] of batches){
    const geometry=mergeGeometries(pieces,false);pieces.forEach(g=>g.dispose());geometry.computeBoundingSphere();
    const mesh=new THREE.Mesh(geometry,material);mesh.name=material.name;mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);stats.triangles+=(geometry.index?geometry.index.count:geometry.attributes.position.count)/3;
  }
  stats.drawCalls=root.children.length;root.userData.blossomSources=blossomSources;root.userData.placements=placements;
  root.userData.station={lat:surface.trackLat(-.3)+.11,lon:-.3,label:'花海駅'};
  return{root,stats,update(time,env={}){const daylight=THREE.MathUtils.clamp(env.daylight??1,0,1),night=1-daylight;glazing.emissiveIntensity=.025+night*.48;litGlass.emissiveIntensity=.18+night*.80;},dispose(){root.traverse(o=>o.geometry?.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());root.removeFromParent();}};
}
