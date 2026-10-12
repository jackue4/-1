import {THREE,seeded} from './core.js';

// Soft toy-shaped balloons. Each animal is a single vertex-coloured draw;
// geometry and material are shared between the little groups around the park.
export function createAnimalBalloons({palette}){
  const rng=seeded(624198),groups=[],floaters=[],geometries=new Set();let heroGroup;
  const stats={animals:0,ordinary:0,skyGroups:0,groundGroups:0,bySpecies:{rabbit:0,bear:0,corgi:0},drawCalls:0,triangles:0};
  const material=palette.m('#fff8e9').clone();material.color.set('#ffffff');material.vertexColors=true;
  const smooth=new THREE.SphereGeometry(1,24,16),medium=new THREE.SphereGeometry(1,18,12),small=new THREE.SphereGeometry(1,12,8);
  const c={cream:'#fff3de',white:'#fffaf0',gold:'#e9b477',honey:'#d99556',milk:'#ffe0a9',pink:'#f4a7b9',rose:'#dd769c',mint:'#97d7c9',blue:'#91badc',violet:'#b5a9dc',ink:'#544652',string:'#e1cdb7'};
  function shapeBuilder(){
    const vertices=[],normals=[],colours=[],transform=new THREE.Matrix4(),q=new THREE.Quaternion(),colour=new THREE.Color();
    function add(source,p,s,tint,rotation=[0,0,0]){
      q.setFromEuler(new THREE.Euler(...rotation));transform.compose(new THREE.Vector3(...p),q,new THREE.Vector3(...s));
      const geo=source.index?source.toNonIndexed():source.clone();geo.applyMatrix4(transform);colour.set(tint);
      vertices.push(...geo.attributes.position.array);normals.push(...geo.attributes.normal.array);
      for(let i=0;i<geo.attributes.position.count;i++)colours.push(colour.r,colour.g,colour.b);
      geo.dispose();
    }
    const ball=(p,s,tint,rotation=[0,0,0],detail=true)=>add(!detail||Math.max(...s)<.16?small:Math.max(...s)>.30?smooth:medium,p,s,tint,rotation);
    function line(points,r,tint){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),geo=new THREE.TubeGeometry(curve,Math.max(7,points.length*3),r,5,false);add(geo,[0,0,0],[1,1,1],tint);geo.dispose();}
    function star(p,r,tint,rotation=0){
      const s=new THREE.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,rr=i%2?r*.47:r;i?s.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):s.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}s.closePath();
      const geo=new THREE.ExtrudeGeometry(s,{depth:r*.13,bevelEnabled:true,bevelSize:r*.08,bevelThickness:r*.06,bevelSegments:1,steps:1});add(geo,p,[1,1,1],tint,[0,0,rotation]);geo.dispose();
    }
    function finish(){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));geo.computeBoundingBox();geo.computeBoundingSphere();geometries.add(geo);return geo;}
    return{ball,line,star,finish};
  }
  function makeAnimal(species){
    const b=shapeBuilder(),fur=species==='rabbit'?c.cream:species==='bear'?c.gold:c.honey;
    // A pear belly, a very large cheeky head, and small cuddly paws.
    b.ball([0,-.245,-.015],[.245,.255,.205],fur);
    b.ball([0,-.25,.174],[.167,.184,.035],species==='bear'?c.milk:c.white);
    b.ball([0,.18,0],[.365,.338,.29],fur);
    b.ball([-.34,-.145,.035],[.115,.15,.107],fur,[0,0,-.59]);
    b.ball([.34,-.13,.035],[.115,.153,.107],fur,[0,0,.62]);
    for(const side of [-1,1]){
      b.ball([side*.147,-.446,.052],[.119,.105,.13],fur,[.08,0,side*.16]);
      b.ball([side*.153,-.46,.165],[.054,.043,.015],c.pink,[0,0,side*.15],false);
    }
    if(species==='rabbit'){
      for(const side of [-1,1]){b.ball([side*.177,.623,-.025],[.105,.29,.089],fur,[0,0,-side*.18]);b.ball([side*.187,.654,.046],[.047,.201,.018],c.pink,[0,0,-side*.18]);}
      b.ball([.035,-.314,-.217],[.115,.114,.105],c.white);
    }else if(species==='bear'){
      for(const side of [-1,1]){b.ball([side*.274,.443,-.018],[.146,.145,.108],fur);b.ball([side*.276,.448,.075],[.078,.076,.020],c.pink);}
      b.ball([0,.092,.265],[.177,.129,.053],c.milk);
    }else{
      // Upright, tapered ears give the little corgi a recognisable silhouette.
      for(const side of [-1,1]){b.ball([side*.245,.466,-.02],[.125,.225,.084],fur,[0,0,-side*.30]);b.ball([side*.247,.501,.049],[.061,.136,.020],c.pink,[0,0,-side*.30]);}
      b.ball([0,.275,.257],[.083,.204,.04],c.white);
      b.ball([-.125,.07,.259],[.161,.132,.052],c.white);b.ball([.125,.07,.259],[.161,.132,.052],c.white);
      b.ball([0,-.272,-.223],[.105,.087,.09],c.white);
    }
    // Glazed button eyes, tiny highlights, peach blush and an understated smile.
    for(const side of [-1,1]){
      b.ball([side*.144,.20,.272],[.041,.054,.019],c.ink,[0,side*.15,0],false);
      b.ball([side*.144-.009,.218,.291],[.014,.018,.007],c.white,[0,0,0],false);
      b.ball([side*.237,.086,.236],[.059,.032,.014],c.pink,[0,side*.35,side*.1],false);
    }
    b.ball([0,.093,.321],[.027,.021,.014],species==='rabbit'?c.rose:c.ink,[0,0,0],false);
    b.line([[0,.079,.319],[0,.056,.321],[-.026,.04,.317],[-.046,.052,.309]],.007,c.ink);
    b.line([[0,.056,.321],[.026,.04,.317],[.046,.052,.309]],.007,c.ink);
    // A small silk bow at the throat and a warm sparkle on one cheek.
    const ribbon=species==='rabbit'?c.rose:species==='bear'?c.mint:c.blue;
    b.ball([-.076,-.133,.244],[.086,.05,.027],ribbon,[0,0,.32],false);
    b.ball([.076,-.133,.244],[.086,.05,.027],ribbon,[0,0,-.32],false);
    b.ball([0,-.129,.268],[.035,.035,.029],ribbon,[0,0,0],false);
    b.star([species==='rabbit'?-.283:.276,.292,.189],.037,c.white,-.17);
    // Two soft painted glints, rather than plastic specular highlights.
    b.ball([-.229,.318,.172],[.025,.072,.008],c.white,[0,-.60,-.52],false);
    b.ball([-.269,.263,.184],[.012,.023,.005],c.white,[0,-.70,-.52],false);
    return b.finish();
  }
  const models={rabbit:makeAnimal('rabbit'),bear:makeAnimal('bear'),corgi:makeAnimal('corgi')};
  const balloonModels={};
  for(const colour of ['pink','mint','violet','blue','milk']){
    const b=shapeBuilder();b.ball([0,0,0],[.71,.92,.71],c[colour]);b.ball([-.28,.35,.57],[.096,.23,.018],c.white,[0,-.3,-.37],false);b.ball([0,-.95,0],[.07,.07,.06],c[colour],[0,0,0],false);balloonModels[colour]=b.finish();
  }
  function addMesh(parent,geometry,name){const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.userData.noShadow=true;mesh.castShadow=false;mesh.receiveShadow=true;parent.add(mesh);stats.drawCalls++;stats.triangles+=geometry.attributes.position.count/3;return mesh;}
  function addFloater(parent,{kind,position,scale,rotation=0,sky=false,phase}){
    const g=new THREE.Group();g.name=kind in models?`${kind} cloud balloon`:`${kind} companion balloon`;g.position.set(...position);g.scale.setScalar(scale);g.rotation.set(sky?-.04:0,rotation,sky?(rng()-.5)*.23:0);parent.add(g);
    const animal=kind in models;addMesh(g,animal?models[kind]:balloonModels[kind],g.name+' painted silhouette');
    const b=shapeBuilder(),bottom=animal?-.54:-.97,len=sky?(animal?.82:1.34):Math.max(.55,position[1]/scale+bottom);
    b.line([[0,bottom,0],[.035,bottom-len*.32,-.015],[-.027,bottom-len*.70,.014],[.036,bottom-len,0]],sky?.006:.009,c.string);
    if(sky){b.star([.03,bottom-len*.54,.002],animal?.066:.13,c.milk,.20);b.ball([0,bottom-.095,.015],[.062,.036,.02],c.pink,[0,0,.34],false);b.ball([.08,bottom-.099,.015],[.062,.036,.02],c.pink,[0,0,-.34],false);}
    addMesh(g,b.finish(),'Fine ribbon and star tassel');
    const basePosition=g.position.clone(),baseRotation=g.rotation.clone();floaters.push({g,basePosition,baseRotation,phase:phase??rng()*Math.PI*2,sky});
    if(animal){stats.animals++;stats.bySpecies[kind]++;}else stats.ordinary++;
    return g;
  }
  function addBunch(parent,{position=[0,0,0],count=5,sky=false,hero=false,phase=0}={}){
    const g=new THREE.Group();g.name=hero?'Cloud animal friends hero':sky?'Drifting cloud animal friends':'Animal balloon bouquet';g.position.set(...position);g.userData.dynamic=true;parent.add(g);groups.push(g);if(hero)heroGroup=g;
    if(sky){
      const types=hero?['rabbit','bear','corgi']:stats.skyGroups%2?['corgi','rabbit']:['bear','rabbit'];
      types.forEach((kind,i)=>addFloater(g,{kind,position:[hero?[-.315,.025,.343][i]:[-.18,.20][i],hero?[.56,.73,.49][i]:[.48,.64][i],hero?[-.035,.018,-.024][i]:0],scale:hero?[.34,.38,.34][i]:[.29,.31][i],rotation:hero?[-.15,.03,.16][i]:(i-.5)*.28,sky:true,phase:phase+i*1.85}));
      const companions=hero?[[-.52,.36,.07,'mint'],[.53,.49,.04,'pink']]:[[.37,.33,.09,'violet']];
      for(const [x,y,z,kind]of companions)addFloater(g,{kind,position:[x,y,z],scale:.095,sky:true,phase:phase+x*5});
      stats.skyGroups++;
    }else{
      for(let i=0;i<count;i++){const a=i*2.4,kind=i%2===0?['rabbit','bear','corgi'][Math.floor(i/2)%3]:['mint','pink','blue','violet'][i%4];addFloater(g,{kind,position:[Math.sin(a)*.124,.35+rng()*.18,Math.cos(a)*.092],scale:i%2===0?.143:.083,rotation:Math.sin(a)*.23,phase:phase+i*1.6});}
      stats.groundGroups++;
    }
    return g;
  }
  function update(time){for(const f of floaters){const {g,basePosition:p,baseRotation:r,phase,sky}=f;g.position.set(p.x+Math.sin(time*.31+phase)*(sky?.024:.006),p.y+Math.sin(time*.68+phase)*(sky?.035:.017),p.z+Math.cos(time*.37+phase)*(sky?.014:.003));g.rotation.set(r.x+Math.sin(time*.39+phase)*.026,r.y+Math.sin(time*.27+phase)*(sky?.16:.06),r.z+Math.sin(time*.51+phase)*(sky?.075:.04));}}
  let disposed=false;
  return{addBunch,update,stats,get hero(){return heroGroup;},heroCenter:new THREE.Vector3(0,.63,0),getState:()=>({disposed,total:floaters.length,...stats,poses:floaters.map(({g})=>({name:g.name,position:g.position.toArray(),rotation:g.rotation.toArray()}))}),dispose(){if(disposed)return;disposed=true;for(const g of groups)g.removeFromParent();for(const geo of geometries)geo.dispose();smooth.dispose();medium.dispose();small.dispose();material.dispose();groups.length=0;floaters.length=0;geometries.clear();}};
}
