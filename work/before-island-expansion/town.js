import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Kamakura coast: a single downhill street opens onto the sea, with a railway
// at its foot, a tightly planted hillside town and a school above the roofs.
const UP=new THREE.Vector3(0,1,0),TAU=Math.PI*2;
function random(seed){let n=seed|0;return()=>{n=(Math.imul(n,1664525)+1013904223)|0;return(n>>>0)/4294967296;};}

export function createTown({planet,surface,palette={}}){
  const root=new THREE.Group();root.name='Kamakura hillside, seaside road and school';planet.add(root);
  const batches=new Map(),materials=[],textures=[],occupied=[],placements=[],blossomSources=[],houseFootprints=[];
  const rng=random(83051),stats={houses:0,mainIslandHouses:0,shops:0,cherryTrees:0,evergreenTrees:0,gardenPatches:0,courtyardPlantings:0,groundWashes:0,steppingStones:0,gardenFences:0,retainingWalls:0,schoolBuildings:0,powerPoles:0,stations:0,drawCalls:0,triangles:0};
  const mat=(name,color,extra={})=>{const {roughness,metalness,...appearance}=extra,m=new THREE.MeshToonMaterial({color,gradientMap:palette.ramp??null,...appearance});m.name=name;materials.push(m);return m;};
  const walls=[mat('Warm plaster','#eee5c9'),mat('Rice-paper plaster','#faf0dc'),mat('Blue-grey timber','#84989c'),mat('Muted apricot plaster','#dcbb99')];
  const roofBlue=mat('Deep indigo ceramic roofs','#334d66'),roofRust=mat('Sun-faded vermilion roofs','#ad665c');
  const trim=mat('Ivory window casings','#e6d6b6'),wood=mat('Chestnut timber','#71564b'),darkWood=mat('Soot-grey shutters','#444f58');
  const metal=mat('Painted iron and rain gutters','#6e7c7b'),stone=mat('Warm concrete','#c9c6b6'),paving=mat('Soft grey-blue paving','#a7b4b1');
  const asphalt=mat('Coastal asphalt','#78858c'),roadPaint=mat('Weathered road markings','#f4e9ca');
  const glazing=mat('Blue reflective windows','#607f8b',{roughness:.32,metalness:.08,emissive:'#f8c783',emissiveIntensity:.025});
  const litGlass=mat('Warm shop windows','#daac77',{roughness:.55,emissive:'#ffd898',emissiveIntensity:.18});
  const red=mat('Muted red shop details','#bc6f69'),sage=mat('Green canvas awnings','#7b9b85'),ivory=mat('Cream shop details','#f6e5c3');
  const bark=mat('Cherry bark','#78646a'),leaves=mat('Small town greenery','#72a05b');
  const leafDark=mat('Garden leaf shadow','#477b62',{side:THREE.DoubleSide}),leafLight=mat('Sunlit grass tips','#b4c77a',{side:THREE.DoubleSide});
  const flowers=[mat('Cherry blossom shadow','#d993b0'),mat('Cherry blossom midtone','#f1b6ca'),mat('Cherry blossom light','#ffdfdf'),mat('Cherry blossom ivory','#fff0e4')];
  const blossomEdge=mat('Fine five-petal cherry sprays','#ffe8ec',{map:createBlossomMap(),alphaTest:.45,side:THREE.DoubleSide});
  const greenEdge=mat('Fine woodland leaf silhouette','#9abc6b',{map:createLeafMap(),alphaTest:.42,side:THREE.DoubleSide});
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
  function createLeafMap(){
    const size=96,rgba=new Uint8Array(size*size*4),marks=[[.30,.26,.16,.23,-.55],[.62,.29,.14,.23,.55],[.27,.61,.16,.24,-.6],[.62,.67,.16,.22,.58],[.50,.48,.12,.25,.04]];
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      let alpha=0,value=.91;for(const [cx,cy,rx,ry,a]of marks){const dx=(x+.5)/size-cx,dy=(y+.5)/size-cy,c=Math.cos(a),s=Math.sin(a),lx=(dx*c-dy*s)/rx,ly=(dx*s+dy*c)/ry,width=Math.pow(Math.max(0,1-ly*ly),.7),coverage=(1-THREE.MathUtils.smoothstep(Math.abs(lx)/(width+.0001),.84,1.04))*(1-THREE.MathUtils.smoothstep(Math.abs(ly),.94,1.02));if(coverage>alpha){alpha=coverage;value=.88+.09*(1-Math.abs(lx))+.035*ly;}}
      const i=(y*size+x)*4,g=Math.round(value*255);rgba.set([g,g,Math.round(g*.92),Math.round(alpha*255)],i);
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
  function trackYaw(lon){const d=(surface.trackLat(lon+.0001)-surface.trackLat(lon-.0001))/.0002;return Math.atan2(d,Math.cos(surface.trackLat(lon)));}
  const CROSSING=-.20,STATION=-.52,sideStreet=lon=>.455+.022*Math.sin(lon*5+.2),upperStreet=lon=>.704+.018*Math.sin(lon*3);
  function inStreet(lat,lon,radius){
    const pad=radius/surface.R;
    if(lat<.67&&Math.abs(lon-CROSSING)<.055+pad)return true;
    if(Math.abs(lat-(surface.trackLat(lon)-.075))<.025+pad)return true;
    if(lon>-.85&&lon<.43&&Math.abs(lat-sideStreet(lon))<.011+pad)return true;
    return lon>-.85&&lon<.43&&Math.abs(lat-upperStreet(lon))<.011+pad;
  }
  function validSite(lat,lon,radius,clearance=.091){
    const n=surface.direction(lat,lon);
    if(surface.height(n)<surface.R+.045||surface.coast(n)<.095||Math.abs(lat-surface.trackLat(lon))<clearance+radius/surface.R||inStreet(lat,lon,radius))return false;
    for(let i=0;i<6;i++){const a=i*TAU/6,nn=surface.direction(lat+Math.sin(a)*radius/surface.R,lon+Math.cos(a)*radius/(surface.R*Math.max(.4,Math.cos(lat))));if(surface.height(nn)<surface.R+.025||surface.land(nn)<.52)return false;}
    return !occupied.some(p=>n.distanceTo(p.n)*surface.R<radius+p.radius+.025);
  }
  function reserve(lat,lon,radius,type){occupied.push({n:surface.direction(lat,lon),radius,type});placements.push({lat,lon,radius,type,groundHeight:surface.height(surface.direction(lat,lon)),trackDistance:Math.abs(lat-surface.trackLat(lon))});}
  function validTree(lat,lon,radius){
    const n=surface.direction(lat,lon);
    if(surface.height(n)<surface.R+.046||surface.coast(n)<.083||Math.abs(lat-surface.trackLat(lon))<.047+radius/surface.R)return false;
    if(lat<.67&&Math.abs(lon-CROSSING)<.055+radius/surface.R)return false;
    if(Math.abs(lat-(surface.trackLat(lon)-.075))<.028+radius/surface.R)return false;
    if(lon>-.88&&lon<.44&&(Math.abs(lat-sideStreet(lon))<.023||Math.abs(lat-upperStreet(lon))<.023))return false;
    return !occupied.some(p=>n.distanceTo(p.n)*surface.R<(p.type.includes('tree')?.105:p.radius+radius*.50+.01));
  }
  function levelBase(lat,lon,w,d,yaw=0){
    const initial=anchor(lat,lon,.003,yaw);let min=0,max=0;
    for(const x of [-w/2,0,w/2])for(const z of [-d/2,0,d/2]){const p=new THREE.Vector3(x,0,z).applyMatrix4(initial),delta=surface.height(p.clone().normalize())-p.length();min=Math.min(min,delta);max=Math.max(max,delta);}
    const lift=max+.003;return{base:anchor(lat,lon,.003+lift,yaw),depth:lift-min+.014};
  }

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
    const w=.172+rng()*.057,d=.141+rng()*.047,wallH=.181+rng()*.075,pitch=.051+rng()*.024,radius=Math.hypot(w,d)/2+.011;
    if(!validSite(lat,lon,radius))return false;
    const level=levelBase(lat,lon,w+.022,d+.026,(lat<surface.trackLat(lon)?Math.PI:0)+(index%5===1?.16:index%5===3?-.10:0)),base=level.base,roofMaterial=index%4===0?roofRust:roofBlue,shop=index%4===1||index===0;
    reserve(lat,lon,radius,'house');stats.houses++;stats.mainIslandHouses++;
    houseFootprints.push({base:base.clone(),inverse:base.clone().invert(),w,d,shop});
    box(stone,base,[0,.008-level.depth/2,0],[w+.019,level.depth+.016,d+.024]);
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
    if(index%3===2&&lat>.20){
      const x=-w/2-.039;for(let j=0;j<6;j++)box(wood,base,[x,.024,-d/2+j*d/5],[.006,.048,.009]);
      for(const y of [.015,.037])box(trim,base,[x,y,0],[.005,.005,d+.016]);stats.gardenFences++;
    }
    return true;
  }

  function station(){
    const lon=STATION,lat=surface.trackLat(lon)+.092,base=anchor(lat,lon,.006,trackYaw(lon));
    reserve(lat,lon,.28,'station');stats.stations=1;
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
    sign('鎌倉高校前',base,[0,.153,.034],.248,.046,'#315a54');
    // Bench, timetable, vending cabinet and an understated station lamp.
    box(wood,base,[-.12,.071,.064],[.112,.008,.034]);box(wood,base,[-.12,.089,.048],[.112,.032,.006]);
    for(const x of [-.16,-.08])box(metal,base,[x,.052,.064],[.006,.033,.023]);
    box(ivory,base,[.245,.086,.055],[.033,.10,.034]);box(glazing,base,[.245,.099,.074],[.027,.064,.003]);
    for(let j=0;j<3;j++)box(red,base,[.238+j*.007,.106,.076],[.003,.025,.002]);
    box(metal,base,[-.30,.10,.103],[.004,.136,.004]);sign('鎌高前',base,[-.30,.17,.106],.079,.025,'#315a54');
    for(const x of [-.31,.31]){
      box(stone,base,[x,.051,-.022],[.040,.024,.075]);
      for(let j=0;j<5;j++)globe(flowers[(j+1)%flowers.length],base,[x+(j%2-.5)*.015,.078,-.054+j*.015],[.016,.016,.017],6,4);
    }
  }

  function cherry(lat,lon,index){
    const size=.88+rng()*.27,radius=.13*size;if(!validTree(lat,lon,radius))return false;
    reserve(lat,lon,radius*.62,'cherry tree');stats.cherryTrees++;
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

  function evergreen(lat,lon,index){
    const size=.94+(index%4)*.085,radius=.139*size;if(!validTree(lat,lon,radius))return false;
    reserve(lat,lon,radius*.58,'evergreen tree');stats.evergreenTrees++;
    const base=anchor(lat,lon,.004,index*.74),scaled=base.clone().multiply(new THREE.Matrix4().makeScale(size,size,size));
    rod(wood,scaled,[0,0,0],[.008,.23,-.009],.013,7);
    const shade=[leafDark,leaves,leafLight];
    for(let tier=0;tier<3;tier++)for(let j=0;j<3;j++){
      const a=j*2.094+tier*.9+index*.27,r=.062-tier*.016,p=[Math.cos(a)*r,.16+tier*.066,Math.sin(a)*r],sx=.078-tier*.01,sz=.076-tier*.009;
      rod(wood,scaled,[.003,.12+tier*.032,-.005],p,.0045-tier*.0008,5);
      flowerCloud(shade[tier%2],scaled,p,[sx,.047,sz],index+j*1.8+tier);
      flowerCloud(tier===2?leafLight:leaves,scaled,[p[0]-.009,p[1]+.03,p[2]-.004],[sx*.72,.028,sz*.76],j+2.7);
      for(let k=0;k<7;k++){
        const a=k*2.399+tier,ny=.7-k*.20,r=Math.sqrt(Math.max(0,1-ny*ny)),n=new THREE.Vector3(Math.sin(a)*r,ny,Math.cos(a)*r),e=new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),n));
        add(new THREE.PlaneGeometry(.059,.055),greenEdge,scaled,[p[0]+n.x*sx,p[1]+n.y*.046,p[2]+n.z*sz],[e.x,e.y,e.z]);
      }
    }
    return true;
  }

  function road(points,width,material=asphalt,offset=.007,skipRail=false){
    const pos=[],uv=[],idx=[],N=points.length,half=width/(surface.R*2);
    for(let i=0;i<N;i++){
      const [lat,lon]=points[i],before=points[Math.max(0,i-1)],after=points[Math.min(N-1,i+1)],dx=(after[1]-before[1])*Math.cos(lat),dy=after[0]-before[0],length=Math.hypot(dx,dy)||1;
      for(const side of [-1,1]){const n=surface.direction(lat+dx/length*half*side,lon-dy/length*half*side/Math.max(.4,Math.cos(lat)));pos.push(...n.multiplyScalar(surface.height(n)+offset).toArray());uv.push(i/(N-1),side*.5+.5);}
      if(i<N-1){const n=surface.direction(lat,lon);if(surface.coast(n)>.012&&(!skipRail||Math.abs(lat-surface.trackLat(lon))>.029)){const j=i*2;idx.push(j,j+2,j+1,j+1,j+2,j+3);}}
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(idx);geometry.computeVertexNormals();add(geometry,material,new THREE.Matrix4());
  }
  function sampleLine(count,fn){return Array.from({length:count},(_,i)=>fn(i/(count-1)));}
  function streets(){
    const coastLine=sampleLine(100,t=>{const lon=THREE.MathUtils.lerp(-.89,.52,t);return[surface.trackLat(lon)-.075,lon];});
    road(coastLine,.188,asphalt,.008);road(coastLine.map(([lat,lon])=>[lat-.034,lon]),.032,paving,.011);road(coastLine.map(([lat,lon])=>[lat+.034,lon]),.028,paving,.011);
    const slope=sampleLine(100,t=>[THREE.MathUtils.lerp(-.017,.671,t),CROSSING]);
    road(slope,.223,asphalt,.009,true);for(const side of [-1,1])road(slope.map(([lat,lon])=>[lat,lon+side*.042]),.039,paving,.012,true);
    road(sampleLine(78,t=>{const lon=THREE.MathUtils.lerp(-.86,.43,t);return[sideStreet(lon),lon];}),.076,paving,.009);
    road(sampleLine(72,t=>{const lon=THREE.MathUtils.lerp(-.87,.40,t);return[upperStreet(lon),lon];}),.072,paving,.009);
    // Faded coastal centre dashes and a zebra crossing at the foot of the slope.
    for(let j=0;j<39;j++){const lon=-.85+j*.034;road([[surface.trackLat(lon)-.075,lon],[surface.trackLat(lon+.014)-.075,lon+.014]],.005,roadPaint,.012);}
    const crossingLat=surface.trackLat(CROSSING)-.075;
    for(let j=0;j<7;j++){const lat=crossingLat+(j-3)*.0083,base=anchor(lat,CROSSING,.014);box(roadPaint,base,[0,0,0],[.195,.002,.015]);}
    for(const side of [-1,1])for(let j=0;j<23;j++){
      const lat=.19+j*.019,lon=CROSSING+side*.052;if(Math.abs(lat-surface.trackLat(lon))<.073)continue;const base=anchor(lat,lon,.004);
      box(stone,base,[0,.030,0],[.022,.060,.059]);box(trim,base,[0,.061,0],[.026,.006,.063]);stats.retainingWalls++;
    }
    // Slender sea-side guard posts preserve the long open view across the water.
    for(let j=0;j<41;j++){
      const lon=-.87+j*.033,lat=surface.trackLat(lon)-.118,n=surface.direction(lat,lon);if(surface.coast(n)<.01)continue;
      const base=anchor(lat,lon,.01,trackYaw(lon));box(trim,base,[0,.03,0],[.006,.060,.006]);box(trim,base,[0,.041,0],[.108,.004,.004]);
    }
  }

  function campus(){
    const lat=.835,lon=-.55,level=levelBase(lat,lon,.64,.39,.06),base=level.base;reserve(lat,lon,.445,'school campus');
    box(stone,base,[0,.019-level.depth/2,0],[.64,.038+level.depth,.39]);box(paving,base,[0,.041,.055],[.60,.008,.25]);
    // White concrete classroom wings with repeated blue glazing and a flat roof.
    const wings=[[-.075,.038,-.070,.46,.263,.18],[.216,.038,-.007,.14,.222,.32]];
    wings.forEach(([x,y,z,w,h,d],i)=>{
      box(walls[1],base,[x,y+h/2,z],[w,h,d]);box(stone,base,[x,y+h+.006,z],[w+.023,.016,d+.023]);
      for(let floor=0;floor<3;floor++){
        const wy=y+.052+floor*.078;
        for(let j=0;j<(i?2:7);j++){const wx=x-w*.42+j*w*.84/((i?2:7)-1);windowFront(base,wx,wy,z+d/2+.003,i?.038:.047,.043);}
        box(trim,base,[x,wy-.027,z+d/2+.01],[w+.013,.009,.022]);
      }
      for(const side of [-1,1])box(metal,base,[x+side*w/2,y+h+.034,z],[.003,.044,d]);
      box(metal,base,[x,y+h+.052,z+d/2],[w,.003,.003]);stats.schoolBuildings++;
    });
    cylinder(metal,base,[-.22,.343,-.07],.030,.085,10);cylinder(stone,base,[-.22,.304,-.07],.043,.014,10);
    box(roofBlue,base,[-.017,.078,.048],[.13,.009,.092],[-.10,0,0]);
    sign('鎌倉高校',base,[-.048,.060,.239],.179,.036,'#465c55');
    for(const x of [-.177,.090])box(stone,base,[x,.037,.230],[.024,.074,.035]);
    for(const side of [-1,1])for(let j=0;j<8;j++){const x=side<0?-.309+j*.015:.11+j*.023;box(metal,base,[x,.054,.23],[.003,.055,.003]);}
    box(metal,base,[-.245,.076,.23],[.144,.003,.003]);box(metal,base,[.19,.076,.23],[.19,.003,.003]);
    // School approach joins the upper lane without obstructing the sea-view axis.
    road(sampleLine(28,t=>[THREE.MathUtils.lerp(upperStreet(-.52),.78,t),THREE.MathUtils.lerp(-.37,-.55,t)]),.086,paving,.012);
  }

  const poleTops=[];
  function streetPole(lat,lon,index){
    const n=surface.direction(lat,lon);if(surface.coast(n)<.11||Math.abs(lat-surface.trackLat(lon))<.066||occupied.some(p=>p.type==='house'&&n.distanceTo(p.n)*surface.R<p.radius+.018))return;
    const base=anchor(lat,lon,.005),h=.36+(index%3)*.018;cylinder(wood,base,[0,h/2,0],.004,h,8);box(darkWood,base,[0,h-.035,0],[.084,.005,.008]);
    for(const x of [-.036,0,.036])cylinder(ivory,base,[x,h-.026,0],.0033,.012,6);
    box(metal,base,[.008,.15,.006],[.017,.033,.015]);poleTops.push({base,h});stats.powerPoles++;
  }
  function wires(){
    for(let i=1;i<poleTops.length;i++){
      const a=poleTops[i-1],b=poleTops[i],start=new THREE.Vector3(0,a.h-.021,0).applyMatrix4(a.base),end=new THREE.Vector3(0,b.h-.021,0).applyMatrix4(b.base);
      if(start.distanceTo(end)>.8)continue;
      for(const offset of [-.027,.027]){const points=[];for(let j=0;j<=12;j++){const t=j/12,p=start.clone().lerp(end,t),normal=p.clone().normalize();p.addScaledVector(normal,-Math.sin(t*Math.PI)*.035);p.x+=offset;points.push(p);}add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),12,.0011,3,false),darkWood,new THREE.Matrix4());}
    }
  }

  function yardClear(lat,lon,radius){
    const n=surface.direction(lat,lon),point=n.clone().multiplyScalar(surface.height(n));
    if(surface.coast(n)<.095||surface.height(n)<surface.R+.045||Math.abs(lat-surface.trackLat(lon))<.063+radius/surface.R||inStreet(lat,lon,radius))return false;
    for(const h of houseFootprints){
      const p=point.clone().applyMatrix4(h.inverse),dx=Math.max(0,Math.abs(p.x)-h.w/2-.006),dz=Math.max(0,Math.abs(p.z)-h.d/2-.006);
      if(Math.hypot(dx,dz)<radius+.004)return false;
      // Keep the actual entry and shop awning access open. Low planting can
      // sit against the remaining wall lengths without crossing a house body.
      const doorX=h.shop?h.w*.32:-h.w*.25;
      if(Math.abs(p.x-doorX)<.027+radius&&p.z>h.d/2-.005&&p.z<h.d/2+.119)return false;
    }
    return !occupied.some(p=>!p.type.includes('tree')&&p.type!=='house'&&n.distanceTo(p.n)*surface.R<p.radius+radius+.008);
  }
  function groundWash(lat,lon,size,index){
    if(inStreet(lat,lon,size))return;
    const base=anchor(lat,lon,0,index*.71),positions=[],uv=[],indices=[],steps=12;
    for(let j=0;j<=steps;j++){
      const a=(j-1)*TAU/steps,r=j===0?0:size*(.88+.10*Math.sin(j*2.7+index)),p=new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r*.73).applyMatrix4(base).normalize();
      const h=surface.height(p);positions.push(...p.multiplyScalar(h+.0022).toArray());uv.push(.5+Math.cos(a)*.5,.5+Math.sin(a)*.5);
      if(j>1)indices.push(0,j,j-1);
    }
    indices.push(0,1,steps);const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();add(geometry,index%5===0?leafLight:leaves,new THREE.Matrix4());stats.groundWashes++;
  }
  function courtyard(lat,lon,index){
    const radius=.037;if(!yardClear(lat,lon,radius))return false;
    reserve(lat,lon,radius,'courtyard planting');stats.gardenPatches++;stats.courtyardPlantings++;const base=anchor(lat,lon,.004,index*1.17);
    groundWash(lat,lon,.070,index);
    // Low asymmetric leaf masses connect the house, its side garden and the
    // larger tree canopy. Pale tips stay sparse so the town remains readable.
    for(let j=0;j<4;j++){
      const a=j*2.399,cx=Math.sin(a)*.021,cz=Math.cos(a)*.018;
      globe(j===0?leafDark:j===3?leafLight:leaves,base,[cx,.014+(j%2)*.009,cz],[.023+(j%2)*.006,.018,.022],7,5);
      const n=new THREE.Vector3(Math.sin(a)*.55,.75,Math.cos(a)*.55).normalize(),e=new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),n));
      add(new THREE.PlaneGeometry(.035,.037),greenEdge,base,[cx,.036,cz],[e.x,e.y,e.z]);
    }
    for(let j=0;j<6;j++){
      const a=j*2.399,x=Math.sin(a)*.033,z=Math.cos(a)*.030;
      for(let k=0;k<2;k++){const h=.025+(j%3)*.004,g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-.002,0,0,.002,0,0,.002,h*.58,.003,.005,h,.009],3));g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,0,.58,.5,1],2));g.setIndex([0,1,2,1,3,2]);g.computeVertexNormals();add(g,j%4===0?leafLight:leafDark,base,[x,0,z],[0,a+k*1.8,0]);}
    }
    if(index%3===0)for(let j=0;j<2;j++){
      const x=(j-.5)*.033,z=.011-j*.025;rod(leaves,base,[x,0,z],[x,.044,z],.0012,4);
      for(let k=0;k<5;k++){const a=k*TAU/5;globe(index%9===0?red:ivory,base,[x+Math.cos(a)*.005,.046,z+Math.sin(a)*.005],[.0044,.002,.0038],5,3);}
    }
    return true;
  }
  function finishCourtyards(){
    // Site candidates follow each house's real orientation and measured width;
    // there is no change to the established building layout or random stream.
    for(let pass=0;pass<6&&stats.gardenPatches<58;pass++)for(let i=0;i<houseFootprints.length&&stats.gardenPatches<58;i++){
      const h=houseFootprints[i],side=(i+pass)%2?1:-1,candidates=[
        [side*(h.w/2+.053),-h.d*.17],[-side*(h.w/2+.056),h.d*.22],
        [h.w*.31,h.d/2+.084],[-h.w*.20,-h.d/2-.058],
        [side*(h.w/2+.082),-h.d*.46],[-side*(h.w/2+.070),h.d/2+.054],
      ],p=new THREE.Vector3(candidates[pass][0],0,candidates[pass][1]).applyMatrix4(h.base).normalize();
      courtyard(Math.asin(p.y),Math.atan2(p.x,p.z),stats.courtyardPlantings);
    }
    for(const h of houseFootprints)for(let j=0;j<3;j++){
      const p=new THREE.Vector3(h.shop?h.w*.32:-h.w*.25,0,h.d/2+.035+j*.024).applyMatrix4(h.base).normalize(),lat=Math.asin(p.y),lon=Math.atan2(p.x,p.z);
      if(surface.coast(p)<.095||inStreet(lat,lon,.021)||Math.abs(lat-surface.trackLat(lon))<.07)continue;
      globe(paving,anchor(lat,lon,.001),[0,.003,0],[.020,.004,.012],7,3);stats.steppingStones++;
    }
  }

  station();campus();streets();
  // Four compact neighbourhoods. Staggered lots, varied turns and courtyards
  // replace the previous widely spaced, uniform rows of isolated cottages.
  const lots=[
    [.278,-.80],[.318,-.674],[.320,-.379],[.380,-.80],[.398,-.552],[.402,-.384],
    [.283,-.047],[.280,.085],[.295,.221],[.324,.356],[.383,-.055],[.393,.080],[.401,.226],[.408,.365],
    [.536,-.82],[.526,-.666],[.548,-.519],[.543,-.371],[.630,-.750],[.624,-.580],[.636,-.428],
    [.558,-.055],[.567,.092],[.566,.242],[.575,.380],[.646,.010],[.644,.171],[.649,.323],
    [.784,-.055],[.795,.10],[.788,.255],[.801,.397],
  ];
  for(const [lat,lon]of lots)if(stats.houses<33)house(lat,lon,stats.houses);
  // Small interstitial lots complete the groups when a steep or coastal lot
  // was rejected; the central downhill axis remains fully open.
  for(const [lat,lon]of [[.36,-.52],[.314,.16],[.626,-.619],[.246,-.37],[.235,.11],[.251,.25],[.523,.08],[.624,.10],[.375,-.70],[.905,.06],[.914,.20],[.752,-.04],[.762,.38],[.325,-.92],[.547,-.94]])if(stats.houses<30)house(lat,lon,stats.houses);
  const cherrySites=[
    [.246,-.76],[.294,-.935],[.485,-.95],[.535,-.94],[.621,-.95],[.739,-.83],[.802,-.90],[.909,-.86],
    [.865,-.21],[.947,-.28],[.865,.01],[.888,.28],[.828,.52],[.733,.53],[.577,.53],[.437,.55],[.304,.49],
    [.344,-.29],[.594,-.29],[.635,-.1],[.214,-.052],[.489,-.11],
  ];
  for(const [lat,lon]of cherrySites)if(stats.cherryTrees<17)cherry(lat,lon,stats.cherryTrees);
  for(let row=0;row<6;row++)for(let col=0;col<13;col++){
    const lat=.475+row*.086+(col%2)*.029,lon=-1.08+col*.139+(row%2)*.044;
    if(stats.evergreenTrees<28)evergreen(lat,lon,stats.evergreenTrees);
  }
  for(let row=0;row<9&&stats.gardenPatches<49;row++)for(let col=0;col<15&&stats.gardenPatches<49;col++)garden(.215+row*.069,-.87+col*.09+(row%2)*.024,stats.gardenPatches);
  for(let i=0;i<7;i++)streetPole(.23+i*.064,CROSSING-.061,i);wires();finishCourtyards();

  for(const [material,pieces] of batches){
    const geometry=mergeGeometries(pieces,false);pieces.forEach(g=>g.dispose());geometry.computeBoundingSphere();
    const mesh=new THREE.Mesh(geometry,material);mesh.name=material.name;mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);stats.triangles+=(geometry.index?geometry.index.count:geometry.attributes.position.count)/3;
  }
  stats.drawCalls=root.children.length;root.userData.blossomSources=blossomSources;root.userData.placements=placements;
  root.userData.station={lat:surface.trackLat(STATION)+.092,lon:STATION,label:'鎌倉高校前'};root.userData.crossingLon=CROSSING;
  return{root,stats,update(time,env={}){const daylight=THREE.MathUtils.clamp(env.daylight??1,0,1),night=1-daylight;glazing.emissiveIntensity=.025+night*.48;litGlass.emissiveIntensity=.18+night*.80;},dispose(){root.traverse(o=>o.geometry?.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());root.removeFromParent();}};
}
