import * as THREE from 'three';
import {projectProgress} from './construction.js';
import {createSoftLeaf} from './vegetation.js';

const UP=new THREE.Vector3(0,1,0);
export const COTTAGE_NAMES=['海风小屋','薄荷邮局','花间茶屋','贝壳工坊','星光书屋'];
const MESSAGES=['门廊上留了一杯果茶，坐一会儿再走吧。','海风捎来了远方的问候，今天也记得看看明信片。','花箱开得正好，一起听听风铃吧。','晒干的贝壳已经收好，慢慢挑一颗喜欢的。','暖灯亮起来了，今晚读一个关于海的故事。'];

// Low-poly architectural pieces are merged inside each construction stage.
// Explicit stage tags keep porch posts, vines and roof tiles out of the foundation.
export function createCottage({index,root,house,mesh,box,cyl,gradientMap,glowMaterials,snowCaps}){
  const id='house'+index,name=COTTAGE_NAMES[index],leafGeo=createSoftLeaf(10,.22).rotateX(-Math.PI/2),budGeo=new THREE.SphereGeometry(1,10,6);
  const wood='#bf965c',trim='#e4c18a',dark='#765f43',wall=['#fff2d7','#ecf2d8','#f9e9cd','#f3e7d9','#f1ecdc'][index],accent=['#69aaa0','#87afa0','#93ad81','#80b8b5','#aaa1b5'][index];
  let stage=1;
  function piece(geo,color,p,s,shadow=true,parent=house){const o=mesh(parent,geo,color,p,s,shadow);if(parent===house)o.userData.buildStage=stage;o.userData.softFoliage=geo===leafGeo||geo===budGeo;return o;}
  const block=(color,p,s,shadow=true,parent=house)=>piece(box,color,p,s,shadow,parent);
  function beam(a,b,width,color=wood){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),o=piece(cyl,color,p.clone().add(q).multiplyScalar(.5).toArray(),[width,p.distanceTo(q),width]);o.quaternion.setFromUnitVectors(UP,q.sub(p).normalize());return o;}
  function group(){const g=new THREE.Group();g.userData.buildStage=stage;house.add(g);return g;}
  // Raised plinth and individual warm floorboards; steps invite a visit.
  stage=0;
  block('#cbb994',[0,.023,.075],[.49,.068,.59]);
  block('#b28d61',[0,.060,.24],[.51,.047,.31]);
  for(let j=0;j<11;j++)block(j%3?'#e4ba78':'#efd09b',[(j-5)*.045,.09,.235],[.042,.017,.31]);
  for(let j=0;j<2;j++)block(j?'#e1bc86':'#caa56f',[0,.026+j*.021,.451-j*.045],[.23,.028,.085]);
  stage=1;
  block(wall,[0,.261,-.015],[.418,.348,.35]);
  block('#e7d7b7',[0,.116,-.015],[.434,.049,.369]);
  // Subtle horizontal siding reveals thickness without noisy textures.
  for(let j=0;j<5;j++){
    block('#edddbe',[0,.151+j*.052,.163],[.412,.006,.008],false);
    for(const side of [-1,1])block('#e7d9bb',[side*.211,.151+j*.052,-.015],[.006,.006,.347],false);
  }
  for(const x of [-.213,.213])for(const z of [-.191,.164])block(trim,[x,.269,z],[.021,.368,.021]);
  // Gable fill is separate from the shingled roof, with a small attic window.
  const gableGeo=new THREE.BufferGeometry();gableGeo.setAttribute('position',new THREE.Float32BufferAttribute([-.209,.433,.161,.209,.433,.161,0,.627,.161, -.209,.433,-.19,0,.627,-.19,.209,.433,-.19],3));gableGeo.computeVertexNormals();
  const gableMat=new THREE.MeshToonMaterial({color:wall,gradientMap,side:THREE.DoubleSide});piece(gableGeo,gableMat,[0,0,0],[1,1,1]);
  block(dark,[-.089,.221,.174],[.126,.256,.022]);
  block('#4b7167',[-.089,.220,.186],[.102,.230,.008],false);
  const door=group();door.name='Cottage hinged door';door.position.set(-.142,.102,.194);
  block(accent,[.05,.116,0],[.099,.232,.018],true,door);
  for(let j=0;j<4;j++)block('#7f9b80',[.014+j*.022,.096,.011],[.004,.183,.005],false,door);
  block('#b9ded0',[.05,.181,.013],[.06,.06,.008],false,door);
  block(trim,[.05,.181,.019],[.005,.066,.004],false,door);
  piece(budGeo,'#eec986',[.081,.113,.018],[.007,.007,.007],false,door);
  const lightMat=new THREE.MeshToonMaterial({color:'#aecac0',emissive:'#ffc375',emissiveIntensity:.12,gradientMap});glowMaterials.push(lightMat);
  function windowAt(x,y,z,side=false){
    const frame=group();frame.position.set(x,y,z);if(side)frame.rotation.y=Math.PI/2;
    block(wood,[0,0,0],[.115,.132,.021],true,frame);block(lightMat,[0,0,.012],[.087,.100,.008],false,frame);
    block(trim,[0,0,.02],[.007,.111,.01],false,frame);block(trim,[0,-.009,.02],[.096,.007,.01],false,frame);
    for(const s of [-1,1]){block(accent,[s*.075,0,0],[.031,.137,.015],true,frame);for(let j=0;j<5;j++)block('#cee0b1',[s*.075,-.048+j*.024,.01],[.025,.006,.004],false,frame);}
    block(trim,[0,-.077,.012],[.153,.018,.046],true,frame);
    // Flatten this rigid window assembly into the stage to share material batches.
    frame.updateMatrix();for(const o of [...frame.children]){o.applyMatrix4(frame.matrix);o.userData.buildStage=stage;house.add(o);}frame.removeFromParent();
  }
  windowAt(.109,.293,.181);windowAt(.223,.284,-.03,true);
  block(wood,[0,.514,.172],[.076,.081,.016]);block(accent,[0,.514,.183],[.055,.059,.007],false);
  block(trim,[0,.514,.19],[.006,.064,.005],false);block(trim,[0,.514,.19],[.059,.006,.005],false);
  // Porch pergola casts a readable striped shadow, unlike a solid slab awning.
  for(const x of [-.222,.222]){block(wood,[x,.269,.365],[.023,.358,.025]);block(trim,[x,.111,.365],[.034,.042,.036]);}
  block(wood,[0,.447,.365],[.506,.029,.028]);
  for(let j=0;j<8;j++)block(j%2?trim:wood,[-.247+j*.070,.463,.276],[.021,.024,.258]);
  for(const x of [-.222,.222])beam([x,.371,.365],[x,.45,.29],.008);
  // Small seating nook, welcome mat and a surfboard by the entrance.
  block('#a9bc8e',[-.081,.103,.249],[.143,.006,.085],false);
  for(const z of [.251,.322])block(wood,[.13,.123,z],[.022,.055,.022]);
  block('#e8c993',[.13,.16,.291],[.103,.023,.143]);block(accent,[.178,.218,.291],[.014,.11,.143]);
  const board=piece(budGeo,'#f3dda9',[-.267,.202,.23],[.038,.145,.016]);board.rotation.z=-.14;
  block('#61aba3',[-.267,.202,.249],[.012,.212,.006],false).rotation.z=-.14;
  // Staggered shingles: large color blocks rather than realistic high-frequency detail.
  stage=2;
  const slope=.79,angle=Math.atan(slope),roofPalette=index===4?['#bfa179','#caae89','#d1b693','#bc9871']:['#cc9a57','#d7aa66','#e4b877','#cfa263'];
  for(const sign of [-1,1]){
    const backing=block('#b38a52',[sign*.137,.532,-.019],[.356,.023,.461]);backing.rotation.z=-sign*angle;
    for(let row=0;row<5;row++)for(let col=0;col<7;col++){
      const x=(row+.52)*.054,z=-.226+(col+.5)*.059+(row%2?.007:0);
      const tile=block(roofPalette[(row*3+col+index)%4],[sign*x,.66-x*slope+(4-row)*.0015,z],[.075,.012,.057]);tile.rotation.z=-sign*angle;
    }
    for(const z of [-.256,.217])beam([0,.67,z],[sign*.294,.432,z],.013,trim);
    block(trim,[sign*.29,.433,-.019],[.026,.030,.499]);
  }
  for(let j=0;j<8;j++)piece(cyl,'#e4ba7a',[0,.665,-.23+j*.061],[.022,.064,.022]).rotation.x=Math.PI/2;
  block('#e6d6b1',[-.139,.639,-.124],[.069,.244,.072]);
  for(let j=0;j<7;j++){block('#c9b38b',[-.139+(j%2?-.014:.012),.55+j*.025,-.084],[.026,.010,.008],false);}
  block(trim,[-.139,.77,-.124],[.091,.026,.094]);block('#887c66',[-.139,.785,-.124],[.047,.005,.049],false);
  const snow=block('#f1f0e6',[0,.689,-.019],[.056,.014,.455],false);snow.visible=false;snowCaps.push(snow);
  // Lush but compact rosettes and small blossoms frame the deck without closing the path.
  function plant(x,z,size,flower=false,y=.025){
    for(let k=0;k<6;k++){
      const a=k*2.4,leaf=piece(leafGeo,k%3===0?'#b6ce75':k%2?'#6ba769':'#88b765',[x+Math.sin(a)*size*.38,y+size*.5,z+Math.cos(a)*size*.38],[size*.26,size*.65,size*.24],false);
      leaf.rotation.set(Math.cos(a)*.72,a,Math.sin(a)*.72);
    }
    if(flower)for(let k=0;k<3;k++){const a=k*2.4;piece(budGeo,index%2?'#f4c185':'#ec9da5',[x+Math.sin(a)*size*.29,y+size*(.99+k*.10),z+Math.cos(a)*size*.29],[size*.16,size*.25,size*.16],false);}
  }
  for(let j=0;j<7;j++){const x=j<4?-.30:.30,z=j<4?-.15+j*.13:.02+(j-4)*.15;plant(x,z,.055+(j%3)*.013,j%2===0);}
  block(wood,[.109,.204,.207],[.152,.044,.067]);block('#6d7e51',[.109,.229,.207],[.129,.006,.047],false);
  for(let j=0;j<3;j++)plant(.06+j*.049,.209,.035,true,.232);
  // Vines curl around the pergola and drip over the lintel.
  for(let j=0;j<17;j++){
    const x=j<9?-.225+Math.sin(j*.9)*.015:-.22+(j-9)*.058,y=j<9?.13+j*.039:.452+Math.sin(j)*.009,z=j<9?.372:.379;
    const l=piece(leafGeo,j%2?'#80b77e':'#a7c785',[x,y,z],[.023,.033,.012],false);l.rotation.z=Math.sin(j*2)*.7;
    if(j%4===0)piece(budGeo,'#efa7ad',[x+.012,y,.391],[.012,.018,.01],false);
  }
  // Wind chime and a hanging plaque keep a little life in the architecture.
  const chime=group();chime.name='Porch wind chime';chime.position.set(.13,.455,.344);
  for(let j=0;j<3;j++)piece(cyl,'#c6b684',[(j-1)*.016,-.036-(j%2)*.013,0],[.003,.055,.003],false,chime);
  piece(cyl,trim,[0,-.002,0],[.033,.009,.022],false,chime);
  const plaque=group();plaque.position.set(-.244,.416,.38);plaque.name='Welcome plaque';
  piece(cyl,accent,[0,-.033,0],[.029,.012,.029],false,plaque).rotation.x=Math.PI/2;
  block('#f2dec0',[0,-.033,.009],[.021,.006,.004],false,plaque);
  const lantern=piece(budGeo,lightMat,[.205,.375,.351],[.018,.032,.018],false);
  let welcomeUntil=0,homeUntil=0,doorAmount=0,now=0,complete=false;
  const normal=root.position.clone().normalize(),front=new THREE.Vector3(0,0,1).applyQuaternion(house.quaternion).applyQuaternion(root.quaternion);
  const entryNormal=normal.clone().addScaledVector(front,.28*house.scale.x).normalize();
  function update(dt,t,env,elapsed,residents){
    if(t<now)homeUntil=0;
    now=t;complete=projectProgress(id,elapsed)>=.96;
    const visitor=env.night<.65&&residents.some(p=>p.root?.visible!==false&&!p.working&&p.normal.distanceTo(entryNormal)<.075);
    const open=complete&&(t<welcomeUntil||t<homeUntil||visitor);
    doorAmount=THREE.MathUtils.lerp(doorAmount,open?1:0,1-Math.exp(-dt*4));door.rotation.y=-doorAmount*1.15;
    chime.rotation.z=Math.sin(t*1.4+index)*(.018+env.wind*.045);plaque.rotation.z=Math.sin(t*.9+index)*.045;
  }
  function visit(){if(!complete)return{ready:false,message:`${name}正在慢慢搭建，完工后再来坐坐。`};welcomeUntil=now+9;return{ready:true,message:`${name} · ${MESSAGES[index]}`};}
  house.name=name;
  return{id,name,root,house,door,chime,plaque,lantern,entryNormal,update,visit,welcomeHome(t){homeUntil=Math.max(homeUntil,t+1.2);},getState:()=>({complete,doorAmount,welcoming:now<welcomeUntil})};
}
