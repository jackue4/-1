import {THREE,anchor,mesh,tube} from './core.js';
import {createCoaster,bakeModel} from './coaster.js';

const TAU=Math.PI*2;
function starGeometry(radius=.06,depth=.014){
  const shape=new THREE.Shape();
  for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?radius*.45:radius,x=Math.cos(a)*r,y=Math.sin(a)*r;i?shape.lineTo(x,y):shape.moveTo(x,y);}
  shape.closePath();return new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:1});
}
function sphere(parent,material,position,scale){const result=mesh(parent,new THREE.SphereGeometry(1,10,7),material,position);result.scale.set(...scale);return result;}
function ring(parent,radius,thickness,material,height){return mesh(parent,new THREE.TorusGeometry(radius,thickness,6,48),material,[0,height,0],[Math.PI/2,0,0]);}
function bulbRing(parent,radius,height,count,material){
  const bulbs=new THREE.InstancedMesh(new THREE.SphereGeometry(.016,6,5),material,count),matrix=new THREE.Matrix4();
  for(let i=0;i<count;i++){const a=i/count*TAU;bulbs.setMatrixAt(i,matrix.makeTranslation(Math.sin(a)*radius,height,Math.cos(a)*radius));}
  parent.add(bulbs);return bulbs;
}
function stripedRoof(parent,{radius=.5,height=.25,y=.8,colors,gold}){
  const count=16;
  for(let i=0;i<count;i++){
    mesh(parent,new THREE.CylinderGeometry(.022,radius,height,3,1,false,i/count*TAU,TAU/count),colors[i%colors.length],[0,y,0]);
    mesh(parent,new THREE.CylinderGeometry(radius,radius,.066,3,1,true,i/count*TAU,TAU/count),colors[(i+1)%colors.length],[0,y-height*.5-.026,0]);
    const a=(i+.5)/count*TAU;
    sphere(parent,gold,[Math.sin(a)*radius,y-height*.5-.062,Math.cos(a)*radius],[.023,.022,.023]);
  }
  ring(parent,radius,.012,gold,y-height*.5+.001);
}

function makeHorse(parent,{ivory,gold,saddle,mane},index){
  const horse=new THREE.Group();horse.name='会升降的旋转木马';horse.userData.dynamic=true;parent.add(horse);
  sphere(horse,ivory,[0,.05,0],[.052,.056,.105]);
  sphere(horse,ivory,[0,.078,.087],[.035,.073,.038]);
  sphere(horse,ivory,[0,.129,.116],[.032,.04,.067]);
  sphere(horse,ivory,[0,.122,.158],[.028,.025,.031]);
  sphere(horse,saddle,[0,.093,-.019],[.052,.018,.055]);
  for(const x of [-.02,.02]){
    mesh(horse,new THREE.ConeGeometry(.013,.040,6),ivory,[x,.179,.092],[.15,0,x*5]);
    sphere(horse,mane,[x*1.49,.145,.134],[.005,.006,.006]);
  }
  for(let i=0;i<6;i++)sphere(horse,mane,[0,.169-i*.015,.07-i*.004],[.024,.012,.022]);
  for(const x of [-.035,.035])for(const z of [-.060,.068]){
    const bend=z>0?.02:-.022;
    tube(horse,[[x,.035,z],[x,-.018,z+bend],[x,-.052,z+bend*.25]],.011,ivory,8);
    sphere(horse,gold,[x,-.052,z+bend*.25],[.014,.011,.021]);
  }
  tube(horse,[[0,.070,-.087],[.022,.068,-.139],[.018,.012,-.153]],.017,mane,12);
  tube(horse,[[-.030,.136,.151],[-.035,.11,.08],[-.034,.097,.016]],.004,gold,12);
  tube(horse,[[.030,.136,.151],[.035,.11,.08],[.034,.097,.016]],.004,gold,12);
  mesh(horse,starGeometry(.023,.006),gold,[0,.079,-.075],[0,Math.PI,0]);
  bakeModel(horse);return horse;
}

export function createFestivalRides({planet,palette}){
  const root=new THREE.Group();root.name='星愿游乐园 · 四季游乐设施';planet.add(root);
  const m=palette.m,cream=m('#fff0d7'),gold=m('#e9bd69'),rose=m('#e993ac'),pink=m('#f4bdd0'),
    lavender=m('#a99ed3'),mint=m('#85c9b6'),teal=m('#55988d'),ink=m('#536560');
  const carouselLamp=palette.glow('#fff0bd').clone(),ferrisLamp=palette.glow('#ffe3ba').clone(),swingLamp=palette.glow('#fff6d1').clone();
  const carousel=anchor(root,.28,-.28,.055);carousel.name='流光旋转木马';
  mesh(carousel,new THREE.CylinderGeometry(.56,.58,.047,48),cream,[0,.018,0]);
  mesh(carousel,new THREE.CylinderGeometry(.49,.53,.064,48),pink,[0,.073,0]);
  ring(carousel,.50,.018,gold,.11);ring(carousel,.53,.009,gold,.06);
  mesh(carousel,new THREE.CylinderGeometry(.065,.080,.74,12),cream,[0,.46,0]);
  for(let i=0;i<6;i++){
    const a=i/6*TAU;
    const jewel=mesh(carousel,starGeometry(.049,.016),gold,[Math.sin(a)*.081,.50,Math.cos(a)*.081],[0,a,0]);jewel.scale.y=1.2;
  }
  stripedRoof(carousel,{radius:.515,height:.235,y:.93,colors:[cream,rose,cream,mint],gold});
  mesh(carousel,new THREE.ConeGeometry(.068,.18,10),lavender,[0,1.132,0]);
  mesh(carousel,starGeometry(.065,.018),gold,[0,1.26,0]);
  bulbRing(carousel,.503,.782,40,carouselLamp);
  const merry=new THREE.Group();merry.userData.dynamic=true;carousel.add(merry);
  const horses=[];
  for(let i=0;i<6;i++){
    const a=i/6*TAU,r=.337;
    mesh(merry,new THREE.CylinderGeometry(.0065,.0065,.65,7),gold,[Math.sin(a)*r,.465,Math.cos(a)*r]);
    const horse=makeHorse(merry,{ivory:i%3===1?m('#bee0d5'):cream,gold,saddle:i%2?rose:lavender,mane:i%2?m('#d598bd'):gold},i);
    horse.position.set(Math.sin(a)*r,.39,Math.cos(a)*r);horse.rotation.y=a+Math.PI/2;horses.push({group:horse,phase:i*1.5});
  }
  for(let i=0;i<12;i++){
    const a=i/12*TAU;mesh(carousel,new THREE.SphereGeometry(.018,7,5),gold,[Math.sin(a)*.53,.145,Math.cos(a)*.53]);
  }

  const ferris=anchor(root,.50,1.10,.04);ferris.name='星环摩天轮';ferris.rotateY(-.60);
  mesh(ferris,new THREE.CylinderGeometry(.41,.47,.075,32),cream,[0,.018,0]);
  const ferrisRadius=.565,wheelHeight=.85;
  for(const z of [-.102,.102]){
    tube(ferris,[[-.29,.06,z],[0,wheelHeight,z],[.29,.06,z]],.025,cream,2);
    tube(ferris,[[-.255,.085,z],[.255,.085,z]],.017,gold,1);
    mesh(ferris,new THREE.SphereGeometry(.04,10,7),gold,[0,wheelHeight,z]);
  }
  const wheel=new THREE.Group();wheel.position.y=wheelHeight;wheel.userData.dynamic=true;ferris.add(wheel);
  for(const z of [-.040,.040])mesh(wheel,new THREE.TorusGeometry(ferrisRadius,.014,6,64),rose,[0,0,z]);
  const wheelDecor=new THREE.Group();wheel.add(wheelDecor);
  for(let i=0;i<10;i++){
    const a=i/10*TAU; tube(wheelDecor,[[0,0,0],[Math.cos(a)*ferrisRadius,Math.sin(a)*ferrisRadius,0]],.010,gold,1);
    tube(wheelDecor,[[Math.cos(a)*ferrisRadius,Math.sin(a)*ferrisRadius,0],[Math.cos(a+TAU/10)*ferrisRadius,Math.sin(a+TAU/10)*ferrisRadius,0]],.007,cream,1);
  }
  mesh(wheelDecor,starGeometry(.105,.045),gold,[0,0,-.023]);bakeModel(wheelDecor);
  const wheelBulbs=new THREE.InstancedMesh(new THREE.SphereGeometry(.013,6,5),ferrisLamp,50),bulbMatrix=new THREE.Matrix4();
  for(let i=0;i<50;i++){const a=i/50*TAU;wheelBulbs.setMatrixAt(i,bulbMatrix.makeTranslation(Math.cos(a)*ferrisRadius,Math.sin(a)*ferrisRadius,.055));}wheel.add(wheelBulbs);
  const cabins=[];
  for(let i=0;i<10;i++){
    const a=i/10*TAU,cabin=new THREE.Group();cabin.position.set(Math.cos(a)*ferrisRadius,Math.sin(a)*ferrisRadius,0);cabin.userData.dynamic=true;wheel.add(cabin);
    const color=[rose,mint,lavender,m('#eec77f'),m('#aacddd')][i%5];
    // An open basket gives passengers a real seat and a window under the roof.
    // Keep the roof below its original suspension pivot; lift the axle enough
    // for the deeper baskets to clear the platform at the bottom of the wheel.
    const basketProfile=[[0,-.191],[.050,-.191],[.067,-.171],[.078,-.122],[.069,-.122],[.059,-.179],[0,-.179]].map(([r,y])=>new THREE.Vector2(r,y));
    mesh(cabin,new THREE.LatheGeometry(basketProfile,12),color);
    mesh(cabin,new THREE.CylinderGeometry(.080,.080,.019,6),cream,[0,-.200,0]);
    mesh(cabin,new THREE.BoxGeometry(.091,.018,.057),cream,[0,-.179,-.013]);
    mesh(cabin,new THREE.ConeGeometry(.085,.068,6),color,[0,-.036,0]);
    for(const x of [-.050,.050])for(const z of [-.040,.040])tube(cabin,[[x,-.070,z],[x,-.164,z]],.004,gold,1);
    tube(cabin,[[0,.008,0],[0,-.022,0]],.009,gold,1);
    mesh(cabin,starGeometry(.022,.008),gold,[0,-.162,.065]);
    sphere(cabin,cream,[0,-.205,0],[.024,.020,.024]);bakeModel(cabin);cabins.push(cabin);
  }

  const teacup=anchor(root,-.13,1.02,.06);teacup.name='云朵下午茶';
  mesh(teacup,new THREE.CylinderGeometry(.405,.445,.067,40),mint,[0,.02,0]);
  mesh(teacup,new THREE.CylinderGeometry(.38,.40,.025,40),cream,[0,.063,0]);
  ring(teacup,.407,.014,gold,.06);bulbRing(teacup,.413,.046,24,swingLamp);
  const teaSpin=new THREE.Group();teaSpin.position.y=.078;teaSpin.userData.dynamic=true;teacup.add(teaSpin);
  const teapot=new THREE.Group();teaSpin.add(teapot);
  sphere(teapot,pink,[0,.117,0],[.085,.086,.085]);
  mesh(teapot,new THREE.CylinderGeometry(.047,.064,.022,20),cream,[0,.19,0]);
  sphere(teapot,gold,[0,.216,0],[.020,.019,.020]);
  tube(teapot,[[.06,.08,0],[.12,.11,0],[.14,.166,0]],.020,pink,12);
  mesh(teapot,new THREE.TorusGeometry(.055,.011,6,18),gold,[-.084,.12,0]);bakeModel(teapot);
  const cups=[];
  const cupProfile=[new THREE.Vector2(.034,0),new THREE.Vector2(.066,.005),new THREE.Vector2(.082,.075),new THREE.Vector2(.090,.106),new THREE.Vector2(.079,.106),new THREE.Vector2(.071,.030),new THREE.Vector2(.031,.025)];
  for(let i=0;i<3;i++){
    const a=i/3*TAU,cup=new THREE.Group();cup.position.set(Math.sin(a)*.237,0,Math.cos(a)*.237);cup.userData.dynamic=true;teaSpin.add(cup);
    const color=[rose,lavender,mint][i];
    mesh(cup,new THREE.CylinderGeometry(.118,.111,.014,24),color,[0,.007,0]);
    mesh(cup,new THREE.CylinderGeometry(.095,.095,.011,24),cream,[0,.019,0]);
    mesh(cup,new THREE.LatheGeometry(cupProfile,28),color,[0,.023,0]);
    ring(cup,.085,.005,gold,.13);
    mesh(cup,new THREE.TorusGeometry(.035,.009,6,18),gold,[.104,.079,0]);
    mesh(cup,new THREE.CylinderGeometry(.017,.020,.085,10),gold,[0,.063,0]);
    ring(cup,.038,.005,cream,.105);
    for(let j=0;j<5;j++){
      const q=j/5*TAU;mesh(cup,starGeometry(.020,.006),cream,[Math.sin(q)*.079,.085,Math.cos(q)*.079],[0,q,0]);
    }
    bakeModel(cup);cups.push(cup);
  }

  const swings=anchor(root,.15,2.2,.055);swings.name='追风星星飞椅';
  mesh(swings,new THREE.CylinderGeometry(.34,.38,.06,32),lavender,[0,.025,0]);
  ring(swings,.353,.013,gold,.061);
  mesh(swings,new THREE.CylinderGeometry(.039,.070,.67,10),cream,[0,.40,0]);
  mesh(swings,new THREE.CylinderGeometry(.071,.078,.12,12),mint,[0,.23,0]);
  const swingSpin=new THREE.Group();swingSpin.userData.dynamic=true;swings.add(swingSpin);
  const swingCanopy=new THREE.Group();swingSpin.add(swingCanopy);
  stripedRoof(swingCanopy,{radius:.39,height:.16,y:.84,colors:[cream,lavender,cream,mint],gold});
  mesh(swingCanopy,starGeometry(.073,.023),gold,[0,.996,0]);bakeModel(swingCanopy);
  bulbRing(swingSpin,.38,.73,28,swingLamp);
  const chairs=[];
  for(let i=0;i<6;i++){
    const a=i/6*TAU,chair=new THREE.Group();chair.rotation.y=a;chair.userData.dynamic=true;swingSpin.add(chair);
    const chain=new THREE.Group();chair.add(chain);
    for(const x of [-.034,.034])tube(chain,[[x,.733,.29],[x,.28,.428]],.0035,gold,1);
    mesh(chain,new THREE.BoxGeometry(.09,.023,.082),i%2?rose:mint,[0,.263,.428]);
    mesh(chain,new THREE.BoxGeometry(.09,.077,.017),i%2?rose:mint,[0,.31,.465]);
    tube(chain,[[-.040,.309,.400],[.040,.309,.400]],.005,cream,1);
    bakeModel(chain);chairs.push(chair);
  }

  const coaster=createCoaster({planet:root,palette});
  // Passenger roots are attached after the ride models have been baked. Their
  // seat-contact origin and +Z facing direction are shared with animal models.
  const animalSeats=[
    ...[0,2,4].map((index,i)=>({id:`carousel-${index}`,ride:'carousel',parent:horses[index].group,position:[0,.108,-.047],rotationY:0,size:.135,species:['rabbit','bear','corgi'][i],pose:'sit',outfit:['#b3a4db','#82cbbd','#f3b1c3'][i]})),
    ...[1,4,7].map((index,i)=>({id:`ferris-${index}`,ride:'ferris',parent:cabins[index],position:[0,-.170,-.012],rotationY:0,size:i===1?.096:.116,species:['bear','rabbit','corgi'][i],pose:'sit',outfit:['#f3b1c3','#82cbbd','#f1c477'][i]})),
    ...cups.map((cup,i)=>({id:`teacups-${i}`,ride:'teacups',parent:cup,position:[0,.088,-.052],rotationY:0,size:i===0?.102:.118,species:['rabbit','corgi','bear'][i],pose:'sit',outfit:['#82cbbd','#f1c477','#b3a4db'][i]})),
    ...[1,4].map((index,i)=>({id:`swings-${index}`,ride:'swings',parent:chairs[index],position:[0,.276,.428],rotationY:Math.PI,size:.128,species:['rabbit','bear'][i],pose:'sit',outfit:['#f3b1c3','#82cbbd'][i]})),
    ...coaster.getAnimalSeats()
  ];
  const landmarks={
    carousel:{lat:.28,lon:-.28,height:.52,label:'流光旋转木马'},
    ferris:{lat:.50,lon:1.10,height:.82,label:'星环摩天轮'},
    teacups:{lat:-.13,lon:1.02,height:.20,label:'云朵下午茶'},
    swings:{lat:.15,lon:2.20,height:.51,label:'追风星星飞椅'},
    ...coaster.landmarks
  };
  let previousTime=NaN;const coasterState={};
  function update(dt,time,env={}){
    const animate=time!==previousTime;previousTime=time;coaster.update(dt,time,env);
    const state=coaster.getState(coasterState),night=Number(env.night??env.nightness??0);
    if(animate){
    merry.rotation.y=time*.22;
    for(const horse of horses)horse.group.position.y=.38+Math.sin(time*1.55+horse.phase)*.041;
    wheel.rotation.z=time*.072;
    for(const cabin of cabins)cabin.rotation.z=-wheel.rotation.z+Math.sin(time*.65)*.018;
    teaSpin.rotation.y=-time*.28;for(let i=0;i<cups.length;i++)cups[i].rotation.y=time*(.72+i*.11);
    swingSpin.rotation.y=time*.53;
    for(let i=0;i<chairs.length;i++)chairs[i].rotation.x=Math.sin(time*1.4+i)*.012;
    }
    carouselLamp.emissiveIntensity=.13+night*1.8+state.carouselPulse*(.25+night*.95);
    ferrisLamp.emissiveIntensity=.17+night*2+state.ferrisPulse*(.20+night);
    swingLamp.emissiveIntensity=.15+night*1.75;
  }
  update(0,0);
  return{
    root,update,landmarks,
    getAnimalSeats:()=>animalSeats,
    captureState(){return{version:1,time:previousTime,coaster:coaster.captureState()};},
    restoreState(snapshot){
      if(!snapshot||snapshot.version!==1||!Number.isFinite(snapshot.time)||!coaster.restoreState(snapshot.coaster))return false;
      update(0,snapshot.time);return true;
    },
    getState(out={}){coaster.getState(out);out.carouselAngle=merry.rotation.y;out.ferrisAngle=wheel.rotation.z;out.elapsed=previousTime;out.rides=4;out.horseCount=6;out.gondolaCount=10;return out;},
    getRidePose:out=>coaster.getRidePose(out),
    setSpeed:value=>coaster.setSpeed(value),
    dispose(){carouselLamp.dispose();ferrisLamp.dispose();swingLamp.dispose();}
  };
}
