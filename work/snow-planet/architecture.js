// Jiangnan buildings after the snow: thin roof snow, dark exposed tile courses,
// open timber galleries and real voids beneath bridges and inside moon gates.
// Every factory uses local Y-up. Facades face +Z; bridges/galleries run along X.
export function createJiangnanArchitecture({THREE,materials:overrides={}}){
  const ownedMaterials=new Set(),ownedGeometries=new Set();let disposed=false;
  const ramp=new THREE.DataTexture(new Uint8Array([109,109,109,255,166,166,166,255,212,212,212,255,255,255,255,255]),4,1);
  ramp.minFilter=ramp.magFilter=THREE.NearestFilter;ramp.needsUpdate=true;
  const make=(name,color,extra={})=>{const m=new THREE.MeshToonMaterial({color,gradientMap:ramp,...extra});m.name=name;ownedMaterials.add(m);return m;};
  const materials={
    plaster:make('Jiangnan warm lime plaster','#edece0'),
    plasterShade:make('Cool plaster footings','#b3bcb8'),
    wood:make('Weathered chestnut gallery timber','#534843'),
    woodLight:make('Honey brown wooden decks','#8b7259'),
    dark:make('Ink black timber lattice','#363e42'),
    tile:make('Wet charcoal grey roof tiles','#394952',{side:THREE.DoubleSide}),
    tileEdge:make('Blue grey tile endcaps','#5d6e76'),
    snow:make('Fresh thin ivory roof snow','#f2f4ef',{side:THREE.DoubleSide}),
    stone:make('Pale garden bridge stone','#aebdb8'),
    stoneShade:make('Bridge joint shadow','#758e8d'),
    glass:make('Warm rice paper windows','#e2c596',{emissive:'#ffc979',emissiveIntensity:.22}),
    red:make('Faded cinnabar lantern silk','#c26352',{emissive:'#ee8c51',emissiveIntensity:.10}),
    gold:make('Antique brass details','#c99b5d'),
    canopy:make('Indigo woven boat awning','#617d87',{side:THREE.DoubleSide}),
    ...overrides,
  };
  const geos={box:new THREE.BoxGeometry(1,1,1),cyl:new THREE.CylinderGeometry(1,1,1,8),sphere:new THREE.SphereGeometry(1,12,8)};
  Object.values(geos).forEach(geometry=>ownedGeometries.add(geometry));
  const Y=new THREE.Vector3(0,1,0);
  function mesh(g,geo,m,p=[0,0,0],s=[1,1,1],r=[0,0,0]){if(disposed)throw new Error('Jiangnan architecture factory has been disposed');ownedGeometries.add(geo);const o=new THREE.Mesh(geo,m);o.position.set(...p);o.scale.set(...s);o.rotation.set(...r);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
  function box(g,m,p,s,r){return mesh(g,geos.box,m,p,s,r);}
  function ball(g,m,p,s){return mesh(g,geos.sphere,m,p,s);}
  function beam(g,m,a,b,r=.008){const d=new THREE.Vector3(...b).sub(new THREE.Vector3(...a));const o=mesh(g,geos.cyl,m,new THREE.Vector3(...a).add(new THREE.Vector3(...b)).multiplyScalar(.5).toArray(),[r,d.length(),r]);o.quaternion.setFromUnitVectors(Y,d.normalize());return o;}
  function curve(g,m,points,r=.005,segments=16){const c=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return mesh(g,new THREE.TubeGeometry(c,segments,r,5,false),m);}
  function group(name){const g=new THREE.Group();g.name=name;return g;}

  function lantern(g,x,y,z,scale=1){
    const s=scale;
    beam(g,materials.dark,[x,y+.06*s,z],[x,y+.013*s,z],.003*s);
    ball(g,materials.red,[x,y-.026*s,z],[.025*s,.038*s,.025*s]);
    mesh(g,geos.cyl,materials.gold,[x,y+.009*s,z],[.022*s,.006*s,.022*s]);
    mesh(g,geos.cyl,materials.gold,[x,y-.061*s,z],[.019*s,.006*s,.019*s]);
    beam(g,materials.gold,[x,y-.065*s,z],[x,y-.101*s,z],.003*s);
    for(let i=0;i<4;i++){const a=i*Math.PI/2;curve(g,materials.gold,[[x+Math.cos(a)*.012*s,y+.010*s,z+Math.sin(a)*.012*s],[x+Math.cos(a)*.026*s,y-.025*s,z+Math.sin(a)*.026*s],[x+Math.cos(a)*.010*s,y-.061*s,z+Math.sin(a)*.010*s]],.0014*s,8);}
  }

  // Curved gable roof. Each ridge is a tile course, with narrow, slightly
  // irregular white snow strips leaving its wet tile seams visible.
  function roof(g,{width=.8,depth=.6,eave=.45,rise=.18,snow=true}={}){
    const w=width/2,d=depth/2,N=14;
    const h=(x,t)=>eave+rise*Math.pow(1-t,1.6)+.027*Math.pow(t,7)+.012*Math.pow(Math.abs(x)/w,7)*Math.pow(t,4);
    function panel(x0,x1,side,m,lift=0,t0=0,t1=1){
      const pos=[],idx=[];
      for(let j=0;j<=N;j++){const t=t0+(t1-t0)*j/N;for(const x of [x0,x1])pos.push(x,h(x,t)+lift,side*d*t);}
      for(let j=0;j<N;j++){const a=j*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}
      if(side<0)for(let i=0;i<idx.length;i+=3)[idx[i+1],idx[i+2]]=[idx[i+2],idx[i+1]];
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();
      mesh(g,geo,m);
    }
    for(const side of [-1,1]){
      panel(-w,w,side,materials.tile);
      const rows=Math.max(9,Math.round(width/.041)),spacing=width/rows;
      for(let i=0;i<rows;i++){
        const x=-w+(i+.5)*spacing,fall=.91+.045*Math.sin(i*2.7);
        if(snow)panel(x-spacing*.44,x+spacing*.44,side,materials.snow,.007,.01,fall);
        if(i%2===0){const pts=[];for(let j=0;j<=5;j++){const t=j/5;pts.push([x,h(x,t)+.010,side*d*t]);}curve(g,materials.tileEdge,pts,.0022,10);}
        ball(g,materials.tileEdge,[x,h(x,1)-.005,side*d],[spacing*.40,.009,.012]);
      }
      curve(g,materials.tile,[[-w,h(-w,1),side*d],[0,h(0,1)-.004,side*d],[w,h(w,1),side*d]],.012,12);
      if(snow)curve(g,materials.snow,[[-w,h(-w,1)+.01,side*d],[0,h(0,1)+.003,side*d],[w,h(w,1)+.01,side*d]],.006,12);
    }
    beam(g,materials.tile,[-w-.02,eave+rise+.015,0],[w+.02,eave+rise+.015,0],.018);
    beam(g,materials.snow,[-w-.014,eave+rise+.030,0],[w+.014,eave+rise+.030,0],.009);
    for(const x of [-w,w])curve(g,materials.tile,[[x,eave+.025,-d],[x,eave+rise,0],[x,eave+.025,d]],.012,18);
  }

  function window(g,x,y,z,w=.14,h=.14,{door=false}={}){
    box(g,materials.dark,[x,y,z],[w+.018,h+.018,.014]);
    box(g,materials.glass,[x,y,z+.009],[w,h,.008]);
    for(const xx of [-.5,0,.5])box(g,materials.wood,[x+xx*w,y,z+.017],[.008,h+.008,.008]);
    const rows=door?[-.42,-.15,.15,.42]:[-.5,0,.5];
    for(const yy of rows)box(g,materials.wood,[x,y+yy*h,z+.018],[w+.008,.008,.008]);
    if(!door){
      for(const side of [-1,1]){const q=group('Lattice diamond');q.position.set(x+side*w*.25,y,z+.021);q.rotation.z=Math.PI/4;box(q,materials.dark,[0,0,0],[w*.19,.005,.006]);box(q,materials.dark,[0,0,0],[.005,w*.19,.006]);g.add(q);}
    }
    if(door){box(g,materials.woodLight,[x,y-h*.29,z+.018],[w-.018,h*.33,.013]);for(const s of [-1,1])ball(g,materials.gold,[x+s*.014,y-.01,z+.03],[.003,.004,.003]);}
  }

  function house({width=.72,depth=.52,height=.42,variant=0,lanterns=true}={}){
    const g=group('Snow covered Suzhou canal house');
    box(g,materials.stoneShade,[0,.025,0],[width+.035,.05,depth+.03]);
    box(g,materials.plaster,[0,height*.5+.03,0],[width,height,depth]);
    box(g,materials.plasterShade,[0,.076,0],[width+.008,.065,depth+.008]);
    const front=depth*.5+.007;
    for(const x of [-width*.46,width*.46])box(g,materials.wood,[x,height*.46+.05,front],[.025,height*.84,.024]);
    box(g,materials.wood,[0,height*.93+.018,front],[width,.022,.026]);
    const doorX=variant%2===0?-width*.17:width*.19;
    window(g,doorX,.164,front,.12,.245,{door:true});
    window(g,-doorX*1.45,height*.52+.045,front,.155,.157);
    box(g,materials.stone,[doorX,.053,front+.045],[.17,.034,.08]);
    box(g,materials.snow,[doorX,.072,front+.055],[.17,.006,.067]);
    // Recessed side lattice is useful when viewing the spherical town obliquely.
    for(const side of [-1,1]){
      const wing=group('Canal side window');wing.position.set(side*width*.501,height*.53,0);wing.rotation.y=side*Math.PI/2;window(wing,0,0,0,.16,.14);g.add(wing);
      box(g,materials.plaster,[side*width*.49,height+.050,0],[.024,.1,depth*.86]);
    }
    roof(g,{width:width+.11,depth:depth+.13,eave:height+.035,rise:depth*.31});
    // Modest gable plaster triangle behind the roof, distinctive white-walled
    // Jiangnan architecture rather than a red shrine silhouette.
    const triangle=new THREE.Shape();triangle.moveTo(-depth*.49,0);triangle.lineTo(0,depth*.30);triangle.lineTo(depth*.49,0);triangle.closePath();
    for(const side of [-1,1]){const face=mesh(g,new THREE.ShapeGeometry(triangle),materials.plaster,[side*width*.502,height+.038,0]);face.rotation.y=side*Math.PI/2;}
    if(variant%3===1){
      const porch=group('Quiet teahouse awning');porch.position.set(0,0,front+.048);roof(porch,{width:width*.82,depth:.23,eave:height*.71,rise:.062});
      for(const x of [-width*.36,width*.36])beam(porch,materials.wood,[x,.04,.1],[x,height*.73,.1],.010);g.add(porch);
      box(g,materials.wood,[0,height*.61,front+.03],[.175,.049,.018]);
      for(let i=0;i<3;i++)box(g,materials.gold,[(i-1)*.042,height*.61,front+.041],[.017,.026,.003]);
    }
    if(variant%3===2){
      const balcony=group('Waterside timber balcony');balcony.position.set(0,0,front+.08);box(balcony,materials.woodLight,[0,.055,0],[width*.8,.027,.17]);
      railing(balcony,[-width*.4,.07,.09],[width*.4,.07,.09],.115,5);g.add(balcony);
    }
    if(lanterns)for(const x of [-width*.37,width*.37])lantern(g,x,height*.84,front+.07,.78);
    g.userData={kind:'house',width,depth,height:height+depth*.31+.075};return g;
  }

  function railing(g,a,b,height=.11,count=5,m=materials.wood){
    const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b);
    for(let i=0;i<=count;i++){const p=A.clone().lerp(B,i/count);beam(g,m,p.toArray(),p.clone().add(new THREE.Vector3(0,height,0)).toArray(),.006);}
    for(const y of [height*.16,height])beam(g,m,A.clone().add(new THREE.Vector3(0,y,0)).toArray(),B.clone().add(new THREE.Vector3(0,y,0)).toArray(),.006);
    for(let i=0;i<count;i++){
      const p=A.clone().lerp(B,(i+.5)/count),v=B.clone().sub(A).multiplyScalar(.26/count),ym=height*.59;
      const top=p.clone().add(new THREE.Vector3(0,ym+.024,0)),bot=p.clone().add(new THREE.Vector3(0,ym-.024,0));
      for(const q of [p.clone().sub(v).add(new THREE.Vector3(0,ym,0)),p.clone().add(v).add(new THREE.Vector3(0,ym,0))]){beam(g,m,top.toArray(),q.toArray(),.003);beam(g,m,bot.toArray(),q.toArray(),.003);}
    }
  }

  function pavilion({size=.56,height=.58}={}){
    const g=group('Open snow pavilion');
    box(g,materials.stoneShade,[0,.024,0],[size*.88,.048,size*.88]);
    box(g,materials.stone,[0,.052,0],[size*.98,.022,size*.98]);
    box(g,materials.snow,[0,.066,0],[size*.97,.008,size*.97]);
    for(const x of [-1,1])for(const z of [-1,1]){
      beam(g,materials.wood,[x*size*.31,.07,z*size*.31],[x*size*.31,height*.80,z*size*.31],.013);
      box(g,materials.stone,[x*size*.31,.092,z*size*.31],[.041,.045,.041]);
    }
    for(const z of [-1,1]){
      beam(g,materials.wood,[-size*.37,height*.75,z*size*.31],[size*.37,height*.75,z*size*.31],.018);
      for(const x of [-1,1])beam(g,materials.wood,[x*size*.31,height*.57,z*size*.31],[x*size*.15,height*.75,z*size*.31],.009);
      railing(g,[-size*.31,.075,z*size*.31],[size*.31,.075,z*size*.31],.105,4);
    }
    // Four sweeping hipped roof faces converging to a low ridge. Curved lower
    // edges lift gently at the corners, not the steep pagoda profile.
    const eave=height*.78,rise=height*.23,half=size*.61;
    for(let face=0;face<4;face++){
      const turn=group('Hipped roof face');turn.rotation.y=face*Math.PI/2;
      const N=12,rows=12,positions=[],indices=[];
      function p(u,t,lift=0){const spread=half*(.11+.89*t);return [u*spread,eave+rise*Math.pow(1-t,1.7)+.05*Math.pow(t,6)*Math.pow(Math.abs(u),4)+lift,half*t];}
      for(let j=0;j<=N;j++)for(let i=0;i<=rows;i++)positions.push(...p(-1+2*i/rows,j/N));
      for(let j=0;j<N;j++)for(let i=0;i<rows;i++){const a=j*(rows+1)+i;indices.push(a,a+rows+1,a+1,a+1,a+rows+1,a+rows+2);}
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();mesh(turn,geo,materials.tile);
      for(let i=0;i<rows;i++){
        const u0=-1+2*(i+.12)/rows,u1=-1+2*(i+.88)/rows,pos=[],ix=[];
        for(let j=0;j<=N;j++){const t=.025+(.90+.025*Math.sin(i*3)-.025)*j/N;pos.push(...p(u0,t,.007),...p(u1,t,.007));}
        for(let j=0;j<N;j++){const a=j*2;ix.push(a,a+2,a+1,a+1,a+2,a+3);}
        const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));sg.setIndex(ix);sg.computeVertexNormals();mesh(turn,sg,materials.snow);
      }
      curve(turn,materials.tile,[p(-1,1),p(0,1),p(1,1)],.009,12);
      curve(turn,materials.snow,[p(-1,1,.008),p(0,1,.008),p(1,1,.008)],.005,12);
      g.add(turn);
    }
    ball(g,materials.tile,[0,eave+rise+.015,0],[.034,.022,.034]);ball(g,materials.snow,[0,eave+rise+.031,0],[.030,.011,.030]);
    lantern(g,0,height*.73,0,.9);
    g.userData={kind:'pavilion',width:size*1.22,height:height+.07};return g;
  }

  function bridge({length=.9,width=.3,rise=.25}={}){
    const g=group('Arched stone bridge with open water passage'),L=length/2,opening=length*.34;
    const deck=x=>.075+rise*Math.cos(x/L*Math.PI/2),arch=x=>.018+rise*.71*Math.sqrt(Math.max(0,1-(x/opening)**2));
    const outline=new THREE.Shape();outline.moveTo(-L,0);outline.lineTo(-L,deck(-L));
    for(let i=1;i<=24;i++){const x=-L+length*i/24;outline.lineTo(x,deck(x));}outline.lineTo(L,0);outline.lineTo(opening,0);
    for(let i=0;i<=24;i++){const x=opening-2*opening*i/24;outline.lineTo(x,arch(x));}outline.lineTo(-opening,0);outline.closePath();
    mesh(g,new THREE.ExtrudeGeometry(outline,{depth:width,bevelEnabled:false,curveSegments:16}),materials.stone,[0,0,-width/2]);
    for(const side of [-1,1]){
      const z=side*(width/2+.004);
      for(let i=0;i<16;i++){const x=-L+(i+.5)*length/16,angle=Math.atan(-rise*Math.PI/(2*L)*Math.sin(x/L*Math.PI/2));box(g,materials.snow,[x,deck(x)+.011,0],[length/16+.001,.014,width*.96],[0,0,angle]);}
      // Radial arch voussoirs visibly trace the true opening.
      for(let i=0;i<=16;i++){const a=i*Math.PI/16,x=opening*Math.cos(a),y=.018+rise*.71*Math.sin(a);beam(g,materials.stoneShade,[x,y,z],[x*1.07,y+.028,z],.0026);}
      for(let i=0;i<=8;i++){
        const x=-L+i*length/8,y=deck(x);box(g,materials.stoneShade,[x,y+.07,z],[.024,.13,.024]);ball(g,materials.snow,[x,y+.143,z],[.019,.012,.019]);
        if(i<8){const x2=-L+(i+1)*length/8;beam(g,materials.stone,[x,y+.129,z],[x2,deck(x2)+.129,z],.012);beam(g,materials.snow,[x,y+.14,z],[x2,deck(x2)+.14,z],.006);}
      }
    }
    g.userData={kind:'bridge',length,width,height:rise+.235,opening:opening*2};return g;
  }

  function corridor({length=1.1,width=.25,height=.42,sections=4}={}){
    const g=group('Snow lined waterside covered gallery');
    box(g,materials.stoneShade,[0,.022,0],[length+.04,.044,width+.025]);
    box(g,materials.woodLight,[0,.051,0],[length,.016,width]);
    for(let i=0;i<=sections;i++){
      const x=-length/2+i*length/sections;
      for(const s of [-1,1]){
        beam(g,materials.wood,[x,.04,s*width*.40],[x,height,s*width*.40],.010);
        box(g,materials.stone,[x,.066,s*width*.40],[.034,.04,.034]);
        if(i<sections&&s<0)railing(g,[x,.068,s*width*.40],[x+length/sections,.068,s*width*.40],.12,3);
      }
      beam(g,materials.wood,[x,height-.03,-width*.47],[x,height-.03,width*.47],.011);
      if(i>0&&i<sections&&i%2===1)lantern(g,x,height-.065,0,.67);
    }
    roof(g,{width:length+.10,depth:width+.16,eave:height,rise:.115});
    g.userData={kind:'corridor',length,width,height:height+.15};return g;
  }

  function moonGate({width=.62,height=.49}={}){
    const g=group('White garden wall with round moon gate'),r=Math.min(width*.25,height*.37),cy=r+.02;
    const shape=new THREE.Shape();shape.moveTo(-width/2,0);shape.lineTo(width/2,0);shape.lineTo(width/2,height);shape.lineTo(-width/2,height);shape.closePath();
    const hole=new THREE.Path();hole.moveTo(r,cy);for(let i=1;i<64;i++){const a=-i/64*Math.PI*2;hole.lineTo(Math.cos(a)*r,cy+Math.sin(a)*r);}hole.closePath();shape.holes.push(hole);
    mesh(g,new THREE.ExtrudeGeometry(shape,{depth:.05,bevelEnabled:false,curveSegments:32}),materials.plaster,[0,0,-.025]);
    mesh(g,new THREE.TorusGeometry(r+.008,.013,5,40),materials.stone,[0,cy,.032]);
    const top=group('Moon wall coping');roof(top,{width:width+.045,depth:.095,eave:height,rise:.022});g.add(top);
    for(const side of [-1,1])box(g,materials.plasterShade,[side*width*.385,.03,0],[width*.22,.06,.053]);
    g.userData={kind:'moon-gate',width,height:height+.055,opening:r*2};return g;
  }

  function boat({length=.52,width=.18,canopy=true}={}){
    const g=group('Quiet Jiangnan wooden sculling boat');
    const shape=new THREE.Shape();shape.moveTo(-length*.5,0);shape.bezierCurveTo(-length*.35,-width*.6,length*.35,-width*.6,length*.5,0);shape.bezierCurveTo(length*.35,width*.6,-length*.35,width*.6,-length*.5,0);
    const hull=new THREE.ExtrudeGeometry(shape,{depth:.032,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.015,bevelThickness:.024});
    const o=mesh(g,hull,materials.wood);o.rotation.x=-Math.PI/2;
    box(g,materials.woodLight,[0,.048,0],[length*.7,.02,width*.66]);
    for(const x of [-length*.27,length*.27])box(g,materials.wood,[x,.065,0],[.029,.013,width*.73]);
    if(canopy){
      const R=width*.51,coverLength=length*.44,points=[];
      for(let i=0;i<=12;i++){const a=i/12*Math.PI;points.push(new THREE.Vector2(Math.cos(a)*R,Math.sin(a)*R));}
      const pos=[],ix=[];
      for(const x of [-coverLength/2,coverLength/2])for(const p of points)pos.push(x,.079+p.y,p.x);
      for(let i=0;i<12;i++)ix.push(i,i+13,i+1,i+1,i+13,i+14);
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(ix);geo.computeVertexNormals();mesh(g,geo,materials.canopy);
      for(const x of [-coverLength/2,coverLength/2])curve(g,materials.wood,points.map(p=>[x,.079+p.y,p.x]),.006,12);
      for(let i=0;i<5;i++){const a=(i+.5)/5*Math.PI;beam(g,materials.wood,[-coverLength/2,.079+Math.sin(a)*R,Math.cos(a)*R],[coverLength/2,.079+Math.sin(a)*R,Math.cos(a)*R],.0015);}
    }
    beam(g,materials.woodLight,[length*.35,.055,0],[length*.66,.025,width*.66],.007);
    box(g,materials.woodLight,[length*.65,.025,width*.65],[.08,.009,.028],[0,-.4,-.1]);
    lantern(g,-length*.26,.175,0,.52);g.userData={kind:'boat',length,width,height:width*.52+.10};return g;
  }

  function pagoda({size=.33,levels=4}={}){
    const g=group('Eight sided Jiangnan timber and plaster pavilion pagoda');
    mesh(g,geos.cyl,materials.stoneShade,[0,.018,0],[size*.46,.036,size*.46]);
    mesh(g,geos.cyl,materials.stone,[0,.042,0],[size*.40,.016,size*.40]);
    let peak=.05;
    for(let floor=0;floor<levels;floor++){
      const scale=Math.pow(.90,floor),r=size*.36*scale,bodyHeight=size*.36*scale;
      const base=.055+floor*size*.43,eave=base+bodyHeight,rise=size*.18*scale;
      const outer=size*.58*scale,inner=size*.10*scale,ap= r*Math.cos(Math.PI/8);
      mesh(g,geos.cyl,materials.plaster,[0,base+bodyHeight*.5,0],[r,bodyHeight,r]);
      mesh(g,geos.cyl,materials.wood,[0,base+.006,0],[r*1.03,.012,r*1.03]);
      mesh(g,geos.cyl,materials.wood,[0,eave-.009,0],[r*1.07,.014,r*1.07]);
      for(let side=0;side<8;side++){
        const corner=side*Math.PI/4,angle=corner+Math.PI/8;
        const x=Math.sin(corner)*r,z=Math.cos(corner)*r;
        beam(g,materials.wood,[x,base,z],[x,eave,z],size*.012*scale);
        // Each wall has one narrow warm window; the small repeated bays keep
        // the eight-sided tower readable even when viewed against snowy roofs.
        const wall=group('Octagonal tower window bay');wall.rotation.y=angle;
        const w=size*.080*scale,h=bodyHeight*.47,y=base+bodyHeight*.52;
        box(wall,materials.dark,[0,y,ap+.001],[w+.009,h+.010,.006]);
        box(wall,materials.glass,[0,y,ap+.005],[w,h,.004]);
        box(wall,materials.wood,[0,y,ap+.009],[.003,h,.004]);
        box(wall,materials.wood,[0,y+h*.10,ap+.009],[w,.003,.004]);
        box(wall,materials.wood,[0,y-h*.50,ap+.011],[w+.014,.006,.009]);
        // Bracket arms support the roof overhang without thick solid walls.
        for(const dx of [-1,1])beam(wall,materials.wood,[dx*r*.20,eave-.034,ap],[dx*r*.20,eave-.008,outer*.86],size*.008*scale);
        g.add(wall);
      }
      const tilePos=[],tileIdx=[],snowPos=[],snowIdx=[];
      function point(side,u,t,lift=0){
        const a=side*Math.PI/4,b=(side+1)*Math.PI/4,rr=inner+(outer-inner)*t;
        const cornerLift=.013*scale*Math.pow(Math.abs(u*2-1),4)*Math.pow(t,6);
        return [(Math.sin(a)*(1-u)+Math.sin(b)*u)*rr,eave+rise*Math.pow(1-t,1.7)+cornerLift+lift,(Math.cos(a)*(1-u)+Math.cos(b)*u)*rr];
      }
      function strip(side,u0,u1,t0,t1,lift,positions,indices){
        const first=positions.length/3,N=9;
        for(let j=0;j<=N;j++){const t=t0+(t1-t0)*j/N;positions.push(...point(side,u0,t,lift),...point(side,u1,t,lift));}
        for(let j=0;j<N;j++){const a=first+j*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
      }
      for(let side=0;side<8;side++){
        strip(side,0,1,0,1,0,tilePos,tileIdx);
        // Narrow dark seams expose the individual radial grey tile courses.
        for(let row=0;row<6;row++)strip(side,(row+.055)/6,(row+.945)/6,.01,.925+.017*Math.sin(row*2.7+side),.0035,snowPos,snowIdx);
        curve(g,materials.tile,[point(side,0,1),point(side,.5,1),point(side,1,1)],size*.014*scale,10);
        curve(g,materials.snow,[point(side,0,1,.004),point(side,.5,1,.004),point(side,1,1,.004)],size*.007*scale,10);
        curve(g,materials.tileEdge,[point(side,0,0,.003),point(side,0,.5,.003),point(side,0,1,.003)],size*.006*scale,10);
      }
      for(const [positions,indices,material]of [[tilePos,tileIdx,materials.tile],[snowPos,snowIdx,materials.snow]]){
        const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();mesh(g,geo,material);
      }
      peak=eave+rise;
      mesh(g,geos.cyl,materials.tile,[0,peak,0],[inner,.008,inner]);
      mesh(g,geos.cyl,materials.snow,[0,peak+.005,0],[inner*.98,.005,inner*.98]);
    }
    // Restrained dark mast and brass finial keep the silhouette local and calm.
    const spireHeight=size*.25;
    mesh(g,new THREE.ConeGeometry(size*.042,spireHeight,8),materials.tile,[0,peak+spireHeight*.5,0]);
    for(let i=0;i<3;i++)mesh(g,geos.cyl,materials.gold,[0,peak+spireHeight*(.22+i*.21),0],[size*(.039-i*.008),.004,size*(.039-i*.008)]);
    ball(g,materials.gold,[0,peak+spireHeight+.003,0],[size*.018,size*.023,size*.018]);
    g.userData={kind:'pagoda',sides:8,levels,width:size*1.16,height:peak+spireHeight+.003+size*.023};return g;
  }

  function scholarRock({height=.35,width=.20,seed=1}={}){
    const g=group('Perforated Taihu scholar stone with three natural openings');
    const phase=seed*.731,thickness=width*.43;
    // The silhouette is narrow, folded and pierced like Taihu limestone.
    // The holes belong to the extrusion itself, not black painted circles.
    const contour=[[-.28,0],[-.41,.06],[-.32,.18],[-.43,.27],[-.46,.40],[-.31,.53],[-.43,.66],[-.33,.77],[-.16,.85],[-.075,.99],[.065,1],[.20,.90],[.14,.80],[.30,.72],[.38,.60],[.29,.49],[.43,.40],[.31,.29],[.37,.16],[.20,.075],[.26,0]];
    function closedShape(points,ShapeClass=THREE.Shape){
      const shape=new ShapeClass(),n=points.length;
      const midpoint=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
      const start=midpoint(points[n-1],points[0]);shape.moveTo(...start);
      for(let i=0;i<n;i++){const end=midpoint(points[i],points[(i+1)%n]);shape.quadraticCurveTo(points[i][0],points[i][1],end[0],end[1]);}
      shape.closePath();return shape;
    }
    const shape=closedShape(contour.map(([x,y],i)=>[width*(x+.018*Math.sin(phase+i*1.4)),height*y]));
    const holes=[[-.028,.235,.105,.072],[.030,.505,.123,.083],[-.045,.755,.081,.061]];
    for(let k=0;k<holes.length;k++){
      const [cx,cy,rx,ry]=holes[k],points=[];
      for(let i=0;i<20;i++){const a=-Math.PI*2*i/20,wrinkle=1+.11*Math.sin(a*3+phase+k)+.045*Math.sin(a*5-k);points.push([width*(cx+Math.cos(a)*rx*wrinkle),height*(cy+Math.sin(a)*ry*wrinkle)]);}
      shape.holes.push(closedShape(points,THREE.Path));
    }
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:true,bevelSize:width*.018,bevelThickness:width*.05,bevelSegments:3,steps:2,curveSegments:3});
    const pos=geometry.attributes.position;
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i)-thickness/2;
      const fold=Math.sin(y/height*13+phase)*.12+Math.sin(x/width*11-y/height*7)*.09;
      pos.setXYZ(i,x+width*.014*Math.sin(y/height*15+phase),y,z*(1+fold)+width*.055*Math.sin(y/height*11+x/width*4+phase));
    }
    geometry.computeVertexNormals();
    // Extrusion faces are initially separate. Share their averaged normals at
    // coincident vertices so the stone is sculpted and soft, not triangulated.
    const normals=geometry.attributes.normal,normalSums=new Map(),keys=[];
    for(let i=0;i<pos.count;i++){
      const key=[pos.getX(i),pos.getY(i),pos.getZ(i)].map(v=>Math.round(v*1e6)).join(',');keys.push(key);
      if(!normalSums.has(key))normalSums.set(key,new THREE.Vector3());normalSums.get(key).add(new THREE.Vector3(normals.getX(i),normals.getY(i),normals.getZ(i)));
    }
    for(const n of normalSums.values())n.normalize();
    for(let i=0;i<pos.count;i++){const n=normalSums.get(keys[i]);normals.setXYZ(i,n.x,n.y,n.z);}
    mesh(g,geometry,materials.stoneShade);
    // A few small caps settle on upward shoulders; most grey rock stays clear.
    for(const [x,y,sx,sy,sz] of [[-.02,.979,.115,.018,.25],[-.27,.766,.088,.011,.18],[.265,.710,.072,.012,.17],[-.355,.412,.057,.012,.17]]){
      ball(g,materials.snow,[x*width,y*height,width*.022*Math.sin(phase+y*11)],[sx*width,sy*height,sz*width]);
    }
    ball(g,materials.stone,[0,height*.021,0],[width*.34,height*.03,width*.27]);
    g.userData={kind:'scholar-rock',width,height,seed,openings:holes.map(([x,y])=>[x*width,y*height])};return g;
  }

  function dispose(){
    if(disposed)return;disposed=true;
    for(const geometry of ownedGeometries)geometry.dispose();
    for(const material of ownedMaterials)material.dispose();
    ramp.dispose();ownedGeometries.clear();ownedMaterials.clear();
  }
  return {materials,house,pavilion,bridge,corridor,moonGate,boat,pagoda,scholarRock,lantern,roof,dispose};
}
