import {THREE,R,normal,point,anchor,mesh,tube,seeded} from './core.js';
import {createCoasterCurve} from './coaster.js';
import {surface,createPaintedGround,promenades,stream} from './surface.js';
import {createPainterlyNature} from './painterly-nature.js';
import {createFestivalLagoon} from './lagoon.js';
import {createArchitectureDetails} from './architecture-details.js';
import {createAnimalBalloons} from './animal-balloons.js';
import {FOOD_COURT,CANDY_SPOTS} from './snack-layout.js';
import {CAMP,CAMP_TREES,campCoordinates} from './camp-layout.js';

// The park is a real, fully dressed little sphere. Local +Y always points away
// from its centre so the back of the world is as explorable as the front.
export function createFestivalWorld({planet,palette}){
  const root=new THREE.Group();root.name='Starwish gardens';planet.add(root);
  const rng=seeded(82371),m=palette.m,glow=palette.glow;
  const nature=createPainterlyNature({root,palette,surface}),details=createArchitectureDetails({palette});
  const animalBalloons=createAnimalBalloons({palette});
  const c={grass:'#6b9e48',grassLight:'#a2bc65',grassDark:'#477f4c',cream:'#fff0d0',sand:'#efd1ac',pink:'#f4a4b2',rose:'#d66f8c',mint:'#98d7c7',blue:'#719dbc',purple:'#ac9bcf',dark:'#405f6b',wood:'#af826d',gold:'#e9bc69',water:'#68c6cc',waterDark:'#439ea9',white:'#fff9e8'};
  const stats={trees:0,flowers:0,buildings:0,lanterns:0,benches:0,balloons:0};
  const flags=[],lamps=[],windLeaves=[];
  const sphereGeo=new THREE.SphereGeometry(1,12,8),smallGeo=new THREE.SphereGeometry(1,8,5),leafGeo=new THREE.SphereGeometry(1,16,10);
  const cylinder=(parent,r1,r2,h,mat,pos=[0,0,0],segments=16)=>mesh(parent,new THREE.CylinderGeometry(r1,r2,h,segments),mat,pos);
  const box=(parent,w,h,d,mat,pos=[0,0,0],rot=[0,0,0])=>mesh(parent,new THREE.BoxGeometry(w,h,d),mat,pos,rot);
  const ball=(parent,scale,mat,pos=[0,0,0],geometry=sphereGeo)=>{const geo=geometry===sphereGeo&&Math.max(...scale)<.075?smallGeo:geometry;const o=mesh(parent,geo,mat,pos);o.scale.set(...scale);return o;};
  const torus=(parent,r,thick,mat,pos=[0,0,0],rot=[Math.PI/2,0,0])=>mesh(parent,new THREE.TorusGeometry(r,thick,6,28),mat,pos,rot);
  const line=(parent,points,r,mat)=>tube(parent,points.map(p=>p.isVector3?p:new THREE.Vector3(...p)),r,mat,points.length===2?1:Math.min(36,points.length*4));
  const group=(parent,pos=[0,0,0],rot=[0,0,0])=>{const g=new THREE.Group();g.position.set(...pos);g.rotation.set(...rot);parent.add(g);return g;};
  const arch=(parent,w,h,depth,mat,pos=[0,0,0])=>{const s=new THREE.Shape(),a=w/2;s.moveTo(-a,0);s.lineTo(-a,h-a);s.absarc(0,h-a,a,Math.PI,0,true);s.lineTo(a,0);s.closePath();return mesh(parent,new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:10}),mat,pos);};
  const heart=(parent,size,mat,pos=[0,0,0])=>{const s=new THREE.Shape();s.moveTo(0,-.52);s.bezierCurveTo(-.9,.03,-.65,.65,-.24,.52);s.bezierCurveTo(-.1,.47,0,.30,0,.30);s.bezierCurveTo(.1,.52,.47,.70,.64,.36);s.bezierCurveTo(.9,-.05,0,-.52,0,-.52);const o=mesh(parent,new THREE.ShapeGeometry(s,12),mat,pos);o.scale.setScalar(size);return o;};
  const star=(parent,r,mat,pos=[0,0,0])=>{const s=new THREE.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,rr=i%2?r*.44:r;i?s.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):s.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}s.closePath();return mesh(parent,new THREE.ShapeGeometry(s),mat,pos);};
  function ellipse(lat,lon,rx,rz,height,mat,scallop=0){
    const seg=72,rings=9,vertices=[],indices=[];
    vertices.push(...point(lat,lon,height).toArray());
    for(let j=1;j<=rings;j++)for(let i=0;i<seg;i++){const a=i/seg*Math.PI*2,k=j/rings,edge=1+scallop*Math.sin(a*5+.7)+scallop*.5*Math.sin(a*9);vertices.push(...point(lat+Math.cos(a)*rx*k*edge,lon+Math.sin(a)*rz*k*edge,height).toArray());}
    for(let i=0;i<seg;i++)indices.push(0,1+i,1+(i+1)%seg);
    for(let j=0;j<rings-1;j++)for(let i=0;i<seg;i++){const a=1+j*seg+i,b=1+j*seg+(i+1)%seg,d=a+seg,e=b+seg;indices.push(a,d,b,b,d,e);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();
    // Latitude/longitude parameterization has the opposite front winding.
    const idx=geo.index.array;for(let i=0;i<idx.length;i+=3){const swap=idx[i+1];idx[i+1]=idx[i+2];idx[i+2]=swap;}geo.computeVertexNormals();
    return mesh(root,geo,mat);
  }
  function plaque(parent,text,w,h,pos,bg=c.cream,ink=c.dark){
    // Canvas lettering stays tiny and graphic, like a model's enamel signage.
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=160;
    const ctx=canvas.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,512,160);ctx.strokeStyle=ink;ctx.lineWidth=6;ctx.strokeRect(12,12,488,136);ctx.fillStyle=ink;ctx.font='600 62px "Microsoft YaHei", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,84,464);
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;const mat=new THREE.MeshBasicMaterial({map:tex,toneMapped:false});return box(parent,w,h,.018,mat,pos);
  }
  function flower(parent,x,z,s=.055,color=c.pink,y=.05){
    const p=group(parent,[x,y,z]);cylinder(p,.006,.008,s*.95,m(c.grassDark),[0,s*.36,0],5);
    for(let j=0;j<5;j++){const a=j*Math.PI*2/5;ball(p,[s*.34,s*.12,s*.24],m(color),[Math.cos(a)*s*.25,s*.86,Math.sin(a)*s*.25]);}
    ball(p,[s*.17,s*.12,s*.17],m(c.gold),[0,s*.92,0]);stats.flowers++;return p;
  }
  function flowerbed(parent,x,z,r,color=c.pink){
    cylinder(parent,r,r*.94,.035,m(c.sand),[x,.012,z],20);cylinder(parent,r*.88,r*.9,.025,m(c.grassDark),[x,.038,z],20);
    for(let i=0;i<11;i++){const a=i*2.399,k=Math.sqrt((i+.5)/11)*r*.75;flower(parent,x+Math.cos(a)*k,z+Math.sin(a)*k,.045+rng()*.025,color,.05);}
  }
  function lamp(parent,x,z,height=.32){
    const g=group(parent,[x,0,z]);cylinder(g,.014,.021,height,m(c.dark),[0,height/2,0],8);cylinder(g,.047,.055,.035,m(c.gold),[0,height-.015,0],8);
    const bulb=ball(g,[.044,.063,.044],glow('#ffe4a7'),[0,height+.045,0]);lamps.push(bulb);
    cylinder(g,0,.061,.053,m(c.dark),[0,height+.113,0],8);ball(g,[.012,.022,.012],m(c.gold),[0,height+.147,0]);stats.lanterns++;return g;
  }
  function bench(parent,x,z,rotation=0){
    const g=group(parent,[x,.015,z],[0,rotation,0]);for(let i=0;i<3;i++)box(g,.22,.02,.031,m(c.wood),[0,.083,-.035+i*.034]);for(let i=0;i<2;i++)box(g,.22,.027,.016,m(c.wood),[0,.135+i*.029,-.06]);
    for(const a of [-1,1]){box(g,.023,.09,.026,m(c.dark),[a*.077,.041,.01]);box(g,.016,.17,.017,m(c.dark),[a*.08,.09,-.065]);}stats.benches++;return g;
  }
  function flag(parent,x,y,z,color=c.pink,size=.15){
    const pole=cylinder(parent,.007,.007,size*1.8,m(c.gold),[x,y+size*.7,z],6);
    const holder=group(parent,[x,y+size*1.2,z]);holder.userData.dynamic=true;
    const s=new THREE.Shape();s.moveTo(0,0);s.lineTo(size,.026);s.lineTo(size*.72,-size*.4);s.lineTo(0,-size*.43);s.closePath();
    const material=m(color).clone();material.side=THREE.DoubleSide;const pennant=mesh(holder,new THREE.ShapeGeometry(s),material);flags.push({holder,pennant,phase:rng()*6});return pole;
  }
  function tree(lat,lon,size=1,type=0){stats.trees++;return nature.tree(lat,lon,size,type);}
  function shop(lat,lon,type,scale=1,rotation=0){
    const g=anchor(root,lat,lon,.045);g.rotateY(rotation);g.scale.setScalar(scale);const colors=[c.pink,c.mint,c.purple,c.blue],color=colors[type%4];
    cylinder(g,.27,.29,.075,m(c.cream),[0,.03,0],20);box(g,.32,.3,.24,m(c.cream),[0,.20,0]);
    box(g,.35,.065,.27,m(color),[0,.365,0]);box(g,.38,.033,.35,m(c.gold),[0,.405,.01]);
    const roof=mesh(g,new THREE.ConeGeometry(.285,.23,4),m(color),[0,.53,0],[0,Math.PI/4,0]);
    for(let k=0;k<5;k++){box(g,.067,.045,.16,m(k%2?c.white:color),[-.134+k*.067,.325,.2],[-.17,0,0]);ball(g,[.033,.025,.014],m(k%2?c.white:color),[-.134+k*.067,.31,.278]);}
    arch(g,.17,.2,.014,glow('#ffe7a9'),[-.02,.075,.126]);box(g,.255,.045,.075,m(c.wood),[0,.18,.169]);
    for(const x of [-.129,.128])box(g,.018,.16,.023,m(c.gold),[x,.25,.144]);
    plaque(g,['SWEET','BLOOM','POST','TEA'][type%4],.3,.077,[0,.388,.215],c.cream,c.dark);
    if(type%4===0){cylinder(g,.032,.018,.064,m(c.sand),[.026,.212,.195],8);ball(g,[.045,.044,.045],m(c.pink),[.026,.263,.195]);ball(g,[.032,.03,.032],m(c.white),[.026,.3,.195]);}
    else if(type%4===1){flowerbed(g,.2,.07,.085,c.rose);flowerbed(g,-.2,.04,.073,c.purple);}
    else if(type%4===2){box(g,.074,.108,.04,m(c.rose),[.19,.145,.16]);box(g,.049,.008,.009,m(c.dark),[.19,.163,.183]);}
    else{cylinder(g,.045,.04,.026,m(c.white),[.028,.218,.2],12);torus(g,.035,.008,m(c.gold),[.072,.228,.2],[Math.PI/2,0,Math.PI/2]);}
    lamp(g,-.26,.21,.29);details.shop(g,{type});stats.buildings++;return g;
  }
  function balloonBunch(parent,x,y,z,count=5,options={}){
    // Keep the original random budget, so the existing gardens never move
    // when this independently seeded collection of balloons is redesigned.
    for(let i=0;i<count;i++)rng();const phase=rng()*6;
    return animalBalloons.addBunch(parent,{position:[x,y,z],count,phase,...options});
  }
  function bridge(lat,lon,rotation=0,length=.58,width=.24){
    const g=anchor(root,lat,lon,.08);g.rotateY(rotation);
    for(let i=0;i<11;i++){const z=(i/10-.5)*length,y=.11*Math.sin(i/10*Math.PI);box(g,width,.025,length/10*.85,m(i%2?c.wood:c.sand),[0,y,z]);}
    for(const x of [-width*.52,width*.52]){
      for(let i=0;i<5;i++){const z=(i/4-.5)*length,y=.11*Math.sin(i/4*Math.PI);cylinder(g,.009,.011,.16,m(c.cream),[x,y+.085,z],6);}
      line(g,Array.from({length:13},(_,i)=>[x,.19+.11*Math.sin(i/12*Math.PI),(i/12-.5)*length]),.012,m(c.pink));
    }details.bridge(g,{length,width});return g;
  }

  const painted=createPaintedGround({root,palette});
  const lagoon=createFestivalLagoon({root,palette,surface});
  painted.ribbon([[.32,-1.17],[.245,-1.14],[.14,-1.08]],.105);
  // The forest spur skirts the clearing and arrives at the front stone steps.
  painted.ribbon([[-.48,-2.58],...[[ -1.39,-.90],[-1.43,-.32],[-1.34,.32],[-.94,.98],[-.43,1.32]].map(([x,z])=>campCoordinates(surface,x,z))],.068);
  // Small shore stones leave open windows through the turquoise surface.
  for(let i=0;i<24;i++){
    const a=i*Math.PI*2/24,lat=-.20+Math.cos(a)*.385,lon=.37+Math.sin(a)*.578,n=normal(lat,lon);
    const g=anchor(root,lat,lon,surface.height(n)-R+.006);
    ball(g,[.021+rng()*.022,.014,.028],m(i%3?c.cream:'#c0baa0'),[0,0,0],leafGeo);
  }
  // Six lily pads with tiny blush-coloured lotus flowers.
  [[-.37,.18],[-.32,.12],[-.33,.25],[-.1,.03],[-.07,.09],[-.42,.59]].forEach(([a,b],i)=>{const g=anchor(root,a,b,.058);cylinder(g,.052,.052,.008,m('#75b894'),[0,0,0],12);if(i%2===0)flower(g,.005,0,.06,c.pink,.002);});
  // A small sailboat and a swan boat are details to discover beside the cove.
  function boat(lat,lon,type){const g=anchor(root,lat,lon,.083);g.rotateY(.6);
    ball(g,[.082,.037,.18],m(c.cream),[0,0,0]);ball(g,[.055,.018,.12],m(c.wood),[0,.028,0]);
    if(type===0){cylinder(g,.005,.008,.29,m(c.wood),[0,.16,-.015],6);const sail=new THREE.Shape();sail.moveTo(.005,0);sail.lineTo(.005,.25);sail.lineTo(.13,.03);sail.closePath();mesh(g,new THREE.ShapeGeometry(sail),m(c.pink),[0,.075,0]);flag(g,0,.28,0,c.gold,.055);}
    else{line(g,[[0,.02,-.13],[0,.08,-.17],[0,.15,-.155],[0,.17,-.115]],.024,m(c.white));ball(g,[.037,.03,.046],m(c.white),[0,.166,-.11]);cylinder(g,0,.017,.052,m(c.gold),[0,.164,-.057],6).rotation.x=Math.PI/2;ball(g,[.004,.005,.005],m(c.dark),[.03,.17,-.11]);}
    return g;}
  boat(-.19,.72,0);boat(-.35,.53,1);bridge(.095,.58,-.82,.56,.23);
  // Winding pale-blue stream spills out of the castle garden into the lagoon.
  const creek=painted.ribbon(stream,.031,{height:.014,stream:true});creek.name='Transparent garden creek';creek.material=new THREE.MeshPhongMaterial({color:'#70c9ba',transparent:true,opacity:.43,depthWrite:false,shininess:75,specular:'#cee6cd'});creek.castShadow=false;creek.renderOrder=9;bridge(.39,.48,-.2,.38,.20);

  // The castle is layered like an enamel music box: a broad terrace, a warm
  // gate, tall lavender spires and gold jewellery-sized highlights.
  const castle=anchor(root,.78,.05,.073);castle.name='Castle of small wishes';
  cylinder(castle,.70,.78,.105,m(c.sand),[0,.028,0],48);cylinder(castle,.67,.70,.07,m(c.cream),[0,.115,0],48);
  for(let i=0;i<6;i++)box(castle,.39+i*.035,.033,.10,m(i%2?c.cream:c.sand),[0,.108-i*.019,.69+i*.056]);
  box(castle,1.12,.12,.79,m(c.cream),[0,.19,-.025]);box(castle,1.14,.024,.81,m(c.gold),[0,.253,-.025]);
  box(castle,.60,.60,.45,m('#fff3db'),[0,.52,-.045]);box(castle,.66,.039,.50,m(c.rose),[0,.805,-.045]);
  box(castle,.38,.19,.42,m(c.pink),[0,.877,-.07]);box(castle,.41,.025,.45,m(c.gold),[0,.974,-.07]);
  arch(castle,.245,.38,.025,m(c.gold),[0,.265,.19]);arch(castle,.201,.343,.018,m('#9c6c89'),[0,.265,.218]);arch(castle,.163,.294,.009,glow('#fbc88b'),[0,.267,.239]);
  box(castle,.013,.225,.012,m(c.gold),[0,.38,.253]);for(let j=0;j<6;j++)box(castle,.013,.033,.025,m(c.cream),[-.28+j*.111,.833,.22]);
  // Balcony above the entrance, tiny rose window, and scrolling side wings.
  box(castle,.315,.024,.128,m(c.gold),[0,.635,.225]);for(let i=0;i<7;i++)cylinder(castle,.006,.006,.096,m(c.cream),[-.145+i*.048,.694,.28],6);
  line(castle,[[-.16,.745,.28],[0,.745,.285],[.16,.745,.28]],.01,m(c.gold));
  torus(castle,.072,.012,m(c.gold),[0,.87,.148],[0,0,0]);ball(castle,[.058,.058,.006],glow('#ffe7bd'),[0,.87,.153]);
  star(castle,.052,m(c.rose),[0,.87,.162]);
  for(const side of [-1,1]){
    box(castle,.23,.29,.33,m(c.pink),[side*.37,.416,.03]);box(castle,.25,.03,.36,m(c.gold),[side*.37,.565,.03]);
    arch(castle,.082,.155,.014,m(c.gold),[side*.365,.339,.197]);arch(castle,.059,.125,.013,glow('#ffe2a7'),[side*.365,.352,.211]);
    box(castle,.058,.18,.036,m(c.cream),[side*.28,.368,.224]);
  }
  function turret(x,z,h,r,roofColor,central=false){
    const y=.24; cylinder(castle,r,r*1.04,h,m(central?c.cream:'#ffe5d8'),[x,y+h*.5,z],20);
    cylinder(castle,r*1.14,r*1.1,.043,m(c.rose),[x,y+h-.03,z],20);cylinder(castle,r*1.20,r*1.08,.024,m(c.gold),[x,y+h+.004,z],20);
    for(let k=0;k<8;k++){const a=k*Math.PI/4;box(castle,r*.24,.048,r*.2,m(c.cream),[x+Math.sin(a)*r*.97,y+h+.037,z+Math.cos(a)*r*.97],[0,a,0]);}
    const coneH=central?.37:.30; cylinder(castle,0,r*1.42,coneH,m(roofColor),[x,y+h+coneH/2+.05,z],20);
    cylinder(castle,r*1.42,r*1.43,.012,m(c.gold),[x,y+h+.055,z],20);
    for(let j=1;j<4;j++){const rr=r*1.42*(1-j/4);cylinder(castle,rr,rr+.009,.012,m(roofColor===c.blue?'#8cbbcc':'#c9b7df'),[x,y+h+.05+coneH*j/4,z],20);}
    ball(castle,[.022,.031,.022],m(c.gold),[x,y+h+coneH+.067,z]);
    if(central||r>.105)flag(castle,x,y+h+coneH+.08,z,central?c.rose:c.pink,central?.15:.11);
    for(const ang of [0,Math.PI/2,-Math.PI/2]){const win=group(castle,[x+Math.sin(ang)*(r+.004),y+h*.45,z+Math.cos(ang)*(r+.004)],[0,ang,0]);arch(win,r*.72,h*.30,.012,m(c.gold));arch(win,r*.49,h*.25,.016,glow('#ffdea1'),[0,.009,.012]);}
  }
  turret(0,-.07,.88,.125,c.purple,true);
  turret(-.43,-.26,.66,.108,c.blue);turret(.43,-.26,.69,.108,c.purple);
  turret(-.47,.30,.40,.114,c.purple);turret(.47,.30,.40,.114,c.blue);
  turret(-.20,-.20,.75,.065,c.rose);turret(.21,-.19,.77,.065,c.blue);
  // Shallow stone arches beneath the terrace and paired formal rose gardens.
  for(const s of [-1,1]){
    flowerbed(castle,s*.48,.50,.135,s<0?c.pink:c.purple);lamp(castle,s*.27,.64,.27);
    for(let i=0;i<3;i++){arch(castle,.10,.115,.014,m('#b6a28b'),[s*(.14+i*.13),.12,.407]);}
    const hedge=box(castle,.17,.11,.36,m(c.grassDark),[s*.66,.21,.10]);ball(castle,[.092,.062,.20],m(c.grassLight),[s*.66,.275,.1],leafGeo);
  }
  plaque(castle,'STARWISH',.38,.085,[0,.65,.296],c.cream,c.rose);details.castle(castle);stats.buildings++;

  // A tiny wishing fountain acts as the crossing point between the castle,
  // carousel and boardwalk. Rings and droplets stay legible at overview scale.
  const fountain=anchor(root,.405,.075,.06);
  cylinder(fountain,.16,.18,.05,m(c.cream),[0,.02,0],32);cylinder(fountain,.139,.139,.013,m(c.water),[0,.05,0],32);
  cylinder(fountain,.034,.044,.135,m(c.gold),[0,.11,0],12);ball(fountain,[.066,.026,.066],m(c.cream),[0,.189,0]);
  star(fountain,.081,m(c.gold),[0,.29,0]);
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;line(fountain,[[0,.195,0],[Math.sin(a)*.075,.25,Math.cos(a)*.075],[Math.sin(a)*.12,.08,Math.cos(a)*.12]],.004,m('#b4f0e6'));}
  for(const x of [-.25,.25]){flowerbed(fountain,x,.03,.082,c.pink);bench(fountain,x,.22,x<0?.5:-.5);}

  // A little formal garden fills the sunny shoulder between castle and wheel.
  // Its patterned ground, low roses and airy colonnade form three quiet layers
  // while keeping the castle spires and the moving rides easy to read.
  const roseGarden=anchor(root,.49,.57,.053);roseGarden.name='Heart of the wish garden';
  cylinder(roseGarden,.43,.46,.055,m(c.sand),[0,.018,0],40);
  cylinder(roseGarden,.40,.42,.025,m('#f7e5d0'),[0,.056,0],40);
  // Widen the garden's front apron so visiting friends have a real, flat
  // walking surface outside the rose beds, clear of both benches and lamps.
  const apronVertices=[],apronIndices=[];
  for(let i=0;i<=28;i++){const a=-.76+i/28*1.52;for(const r of [.35,.54])apronVertices.push(Math.sin(a)*r,.072,Math.cos(a)*r);if(i<28){const k=i*2;apronIndices.push(k,k+1,k+2,k+1,k+3,k+2);}}
  const apron=new THREE.BufferGeometry();apron.setAttribute('position',new THREE.Float32BufferAttribute(apronVertices,3));apron.setIndex(apronIndices);apron.computeVertexNormals();mesh(roseGarden,apron,m('#f7e5d0'));
  line(roseGarden,Array.from({length:29},(_,i)=>{const a=-.76+i/28*1.52;return[Math.sin(a)*.545,.070,Math.cos(a)*.545];}),.008,m(c.gold));
  cylinder(roseGarden,.33,.34,.023,m('#99c6a3'),[0,.08,0],32);
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5+.18,x=Math.sin(a)*.22,z=Math.cos(a)*.22;
    const bed=group(roseGarden,[x,.088,z],[0,a,0]);
    ball(bed,[.088,.036,.12],m(c.grassDark),[0,.025,0],leafGeo);
    for(let j=0;j<5;j++){const b=j*Math.PI*2/5;flower(bed,Math.cos(b)*.053,Math.sin(b)*.075,.05,i%2?c.pink:c.rose,.045);}
    box(roseGarden,.044,.012,.17,m(c.cream),[Math.sin(a)*.20,.115,Math.cos(a)*.20],[0,a,0]);
  }
  cylinder(roseGarden,.093,.117,.041,m(c.cream),[0,.121,0],24);
  cylinder(roseGarden,.077,.077,.01,m('#8bd2d0'),[0,.146,0],24);
  cylinder(roseGarden,.017,.027,.135,m(c.gold),[0,.216,0],12);
  const heartSculpture=heart(roseGarden,.16,m(c.pink),[0,.34,.012]);
  torus(roseGarden,.096,.008,m(c.gold),[0,.30,-.01],[0,0,-.25]);
  for(const s of [-1,1]){lamp(roseGarden,s*.34,.19,.24);bench(roseGarden,s*.34,-.12,s*.5);}

  const pergola=anchor(root,.66,.57,.062);pergola.name='Rose ribbon colonnade';pergola.rotateY(-.22);
  const arcade=[];
  for(let i=0;i<6;i++){
    const a=-1.12+i*.448,x=Math.sin(a)*.35,z=Math.cos(a)*.18-.12;arcade.push([x,.39,z]);
    cylinder(pergola,.025,.032,.32,m(c.cream),[x,.19,z],12);cylinder(pergola,.044,.036,.04,m(c.gold),[x,.367,z],12);
    cylinder(pergola,.035,.047,.033,m(c.sand),[x,.037,z],12);
    ball(pergola,[.088,.04,.068],m(i%2?c.grassDark:c.grassLight),[x,.413,z],leafGeo);
    for(let j=0;j<3;j++)flower(pergola,x+(j-1)*.038,z,.035,[c.pink,c.white,c.rose][j],.435);
    if(i%2===0)line(pergola,[[x,.39,z],[x+.018,.25,z+.015],[x-.004,.13,z+.022]],.008,m(c.grassDark));
  }
  line(pergola,arcade,.024,m(c.cream));line(pergola,arcade.map(([x,y,z])=>[x,y-.038,z+.027]),.004,m(c.gold));
  for(let i=0;i<5;i++){
    const a=arcade[i],b=arcade[i+1],mid=[(a[0]+b[0])/2,.32,(a[2]+b[2])/2+.025];
    line(pergola,[[a[0],.30,a[2]],mid,[b[0],.30,b[2]]],.013,m(c.cream));
    ball(pergola,[.014,.019,.014],glow('#ffe4a7'),[mid[0],.35,mid[2]]);
  }
  box(pergola,.61,.028,.26,m(c.cream),[0,.02,.005]);
  flowerbed(pergola,-.36,.07,.10,c.pink);flowerbed(pergola,.36,.07,.10,c.purple);bench(pergola,0,-.016,0);
  const ribbonGarden=anchor(root,.55,.28,.045);flowerbed(ribbonGarden,0,0,.14,c.purple);flowerbed(ribbonGarden,.19,.13,.105,c.pink);
  for(const [x,z] of [[-.17,.09],[.17,-.11]]){cylinder(ribbonGarden,.013,.02,.16,m(c.wood),[x,.09,z],7);ball(ribbonGarden,[.077,.083,.077],m(c.grassDark),[x,.225,z],leafGeo);ball(ribbonGarden,[.06,.063,.06],m(c.grassLight),[x,.29,z],leafGeo);}

  // Main street is staggered rather than regimented. Each little booth has a
  // different silhouette, sign and counter display.
  shop(.10,-.40,0,.96,-.2);shop(.02,-.63,1,.9,.14);shop(-.37,-.36,3,1,.38);
  shop(.47,1.67,0,.83,-.6);shop(-.26,1.76,2,.95,.2);shop(.15,2.72,3,1,-.3);
  shop(-.57,-1.83,1,.9,.1);shop(.51,-2.57,2,.92,-.15);shop(-.76,.21,0,.88,.3);
  const balloonCart=anchor(root,.32,.66,surface.height(normal(.32,.66))-R+.004);box(balloonCart,.15,.10,.10,m(c.pink),[0,.09,0]);box(balloonCart,.18,.023,.13,m(c.gold),[0,.153,0]);
  for(const x of [-.08,.08]){const wheel=torus(balloonCart,.037,.01,m(c.dark),[x,.047,0],[0,Math.PI/2,0]);}
  balloonBunch(balloonCart,0,.13,0,7);
  // Ticket arch, envelope-shaped post box and sweet striped awnings on the
  // reverse hemisphere reward actually orbiting around the globe.
  const gate=anchor(root,-.58,1.18,.058);gate.rotateY(-.6);
  for(const x of [-.22,.22]){cylinder(gate,.031,.043,.35,m(c.pink),[x,.18,0],12);ball(gate,[.05,.045,.05],m(c.gold),[x,.385,0]);}
  line(gate,[[-.22,.33,0],[-.13,.43,0],[0,.47,0],[.13,.43,0],[.22,.33,0]],.035,m(c.pink));
  plaque(gate,'WELCOME',.34,.085,[0,.34,.04]);flag(gate,-.22,.39,0,c.mint,.10);flag(gate,.22,.39,0,c.purple,.10);
  const picnic=anchor(root,-.41,2.84,.044);
  for(let i=0;i<3;i++){const g=group(picnic,[(i-1)*.29,0,Math.sin(i)*.16]);cylinder(g,.083,.083,.024,m(c.cream),[0,.13,0],16);cylinder(g,.013,.02,.13,m(c.wood),[0,.065,0],8);cylinder(g,0,.16,.09,m([c.pink,c.purple,c.mint][i]),[0,.32,0],12);cylinder(g,.007,.008,.29,m(c.wood),[0,.17,0],6);bench(g,0,.14,Math.PI);}
  balloonBunch(picnic,.43,.08,.1,4);
  // Back-left mountain forest is deliberately low at the track level. Its
  // higher crags sit behind the mountain portal built by the ride module.
  [[.46,-1.83,.36],[.50,-2.02,.32],[.47,-2.20,.26],[.54,-1.59,.22]].forEach(([lat,lon,s],i)=>{
    const g=anchor(root,lat,lon,.02);ball(g,[s*.72,s*.64,s],m(i%2?'#8aa5a1':'#93ada4'),[0,s*.24,0],leafGeo);ball(g,[s*.66,s*.13,s*.8],m(c.grassLight),[0,s*.66,0],leafGeo);
    for(let j=0;j<3;j++)ball(g,[.035,.045,.043],m(c.purple),[Math.sin(j*2)*s*.6,s*.4,Math.cos(j*2)*s*.7],leafGeo);
  });
  const observatory=anchor(root,.68,2.78,.045);cylinder(observatory,.19,.215,.09,m(c.cream),[0,.035,0],24);cylinder(observatory,.12,.14,.18,m(c.pink),[0,.18,0],16);ball(observatory,[.154,.116,.154],m(c.purple),[0,.30,0]);
  const telescope=group(observatory,[0,.39,0],[.5,.45,-.3]);cylinder(telescope,.035,.026,.20,m(c.gold),[0,.06,0],12);cylinder(telescope,.041,.039,.028,m(c.dark),[0,.174,0],12);star(observatory,.066,m(c.gold),[.15,.39,.04]);stats.buildings++;
  plaque(observatory,'WISH',.16,.058,[0,.23,.148]);details.observatory(observatory);

  // Groundskeeping across the entire sphere, with attraction-sized clearings.
  const reservations=[[CAMP.lat,CAMP.lon,CAMP.radius],[FOOD_COURT.lat,FOOD_COURT.lon,FOOD_COURT.radius],...CANDY_SPOTS.map(s=>[s.lat,s.lon,.24*s.scale]),[.28,-.28,.78],[.50,1.1,.78],[-.13,1.02,.78],[.15,2.2,.80],[.78,.05,1.02],[.405,.075,.32],[.49,.57,.53],[.66,.57,.44],[.55,.28,.30]];
  const coasterClearance=createCoasterCurve().getSpacedPoints(180).filter(p=>p.length()-R<.72).map(p=>p.normalize());
  function safe(lat,lon,ignorePath=false){
    const n=normal(lat,lon);if((!ignorePath&&surface.pathDistance(n)<.28)||surface.streamDistance(n)<.16)return false;if(reservations.some(([a,b,r])=>Math.acos(THREE.MathUtils.clamp(n.dot(normal(a,b)),-1,1))*R<r))return false;
    if(coasterClearance.some(rail=>Math.acos(THREE.MathUtils.clamp(n.dot(rail),-1,1))*R<.36))return false;
    const dlo=Math.atan2(Math.sin(lon-.37),Math.cos(lon-.37));if(((lat+.20)/.50)**2+(dlo/.72)**2<1)return false;
    if(lat>-.36&&lat<.33&&lon< -1.3&&lon> -2.15)return false;
    // Keep the train's low front promenade clear of crowns and flower clumps.
    if(lon> -1.2&&lon<1.6&&lat>-.34&&lat<-.045)return false;
    return true;
  }
  for(let i=0,accepted=0;i<1200&&accepted<106;i++){
    const lat=Math.asin(rng()*1.90-.95),lon=(rng()-.5)*Math.PI*2;if(!safe(lat,lon))continue;
    tree(lat,lon,.60+rng()*.50,i%7===0?2:i%5===0?1:0);accepted++;
  }
  // Lollipop topiaries, scattered daisies, mushrooms, soft mossy stones.
  for(let i=0,accepted=0;i<700&&accepted<105;i++){
    const lat=Math.asin(rng()*1.94-.97),lon=(rng()-.5)*Math.PI*2;if(!safe(lat,lon))continue;
    const g=anchor(root,lat,lon,.024),kind=i%6;
    if(kind<3){for(let j=0;j<3;j++)flower(g,(rng()-.5)*.15,(rng()-.5)*.15,.034+rng()*.025,[c.white,c.pink,c.purple][kind]);}
    else if(kind===3){for(let j=0;j<3;j++){const x=(rng()-.5)*.12,z=(rng()-.5)*.12;cylinder(g,.009,.012,.035,m(c.cream),[x,.025,z],6);ball(g,[.029,.016,.03],m(j%2?c.rose:c.gold),[x,.048,z]);ball(g,[.006,.003,.006],m(c.white),[x+.01,.064,z]);}}
    else if(kind===4){ball(g,[.062,.036,.048],m('#a4b9a9'),[0,.021,0],leafGeo);ball(g,[.045,.012,.031],m(c.grassDark),[0,.05,0],leafGeo);}
    else{for(let j=0;j<5;j++){const a=j*2.3;line(g,[[0,0,0],[Math.sin(a)*.025,.033,Math.cos(a)*.025],[Math.sin(a)*.05,.06,Math.cos(a)*.05]],.004,m(c.grassDark));}}
    accepted++;
  }
  // Warm lanterns sit beside paths instead of a uniform artificial light ring.
  for(const p of promenades)for(let i=0;i<p.length;i++){
    const [lat,lon]=p[i],sideLat=lat+.038,sideLon=lon+.048;if(!safe(sideLat,sideLon,true))continue;const g=anchor(root,sideLat,sideLon,surface.height(normal(sideLat,sideLon))-R+.006);lamp(g,0,0,.22+(i%2)*.035);if(i%3===0)bench(g,.11,.12,.4);
  }
  // Wish ribbons on a quiet tree at the back and loose drifting balloons above
  // the horizon add a little visual life without competing with the rides.
  const wishTree=tree(.87,1.7,1.25,2);for(let i=0;i<8;i++){const g=group(wishTree,[(rng()-.5)*.23,.31+rng()*.19,(rng()-.5)*.21]);g.userData.dynamic=true;box(g,.016,.072,.003,m([c.pink,c.gold,c.purple,c.white][i%4]),[0,-.027,0]);windLeaves.push({g,phase:i});}
  for(const [index,[lat,lon]] of [[.84,-.62],[.82,1.66],[.18,2.86],[-.18,-2.54]].entries()){const g=anchor(root,lat,lon,index===0?.64:.67);balloonBunch(g,0,0,0,3,{sky:true,hero:index===0});}

  for(const [x,z,size]of CAMP_TREES){const[lat,lon]=campCoordinates(surface,x,z);nature.tree(lat,lon,size,0,true);stats.trees++;}
  nature.createMeadows({curves:surface.curves,reservations,coasterCurve:createCoasterCurve()});
  Object.assign(stats,{nature:nature.stats,water:lagoon.stats,architecture:details.stats,terrain:painted.stats,balloons:animalBalloons.stats.animals+animalBalloons.stats.ordinary,animalBalloons:animalBalloons.stats});
  root.traverse(o=>{if(o.isMesh&&!o.material.transparent){o.castShadow=!o.userData.noShadow;o.receiveShadow=true;}});
  const landmarks={castle:{lat:.78,lon:.05,height:.8},lagoon:{lat:-.20,lon:.37,height:.1},village:{lat:.04,lon:-.45,height:.3},ridge:{lat:.17,lon:-1.73,height:.2},observatory:{lat:.68,lon:2.78,height:.3}};
  // Guests share the actual footpath spline and terrain height.
  const guestPaths={promenade:surface.curves[0],roseGarden};
  return {root,stats,landmarks,guestPaths,surface,painted,lagoon,nature,animalBalloons,dispose(){nature.dispose?.();lagoon.dispose?.();animalBalloons.dispose();},update(time,env={},events={}){
    nature.update(time,env);lagoon.update(time,env);details.update?.(time,env);animalBalloons.update(time);
    for(const {holder,phase} of flags){holder.rotation.y=Math.sin(time*1.4+phase)*.25;holder.rotation.z=Math.sin(time*2+phase)*.055;}
    for(const {g,phase} of windLeaves){g.rotation.z=Math.sin(time*1.6+phase)*.17;g.rotation.x=Math.sin(time+phase)*.14;}
  }};
}
