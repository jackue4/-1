import {createParkAnimal} from './animal-model.js';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// An enamel-green snack van and a little ice-cream cart. All coordinates are
// local to the plaza: +Y is up and both serving counters face +Z.
export function createFoodStalls({THREE,palette,parent}){
  const root=new THREE.Group();root.name='Picnic lane · hot dogs and ice cream';parent.add(root);
  const ownedGeometry=new Set(),ownedMaterial=new Set(),ownedTexture=new Set();
  const stats={hotdogTrucks:1,icecreamCarts:1,picnicTables:1,menus:3,chefs:1,meshes:0,triangles:0};
  const c={green:'#209d78',greenDark:'#267c67',mint:'#98d6bd',cream:'#fff1d1',white:'#fff9e9',ink:'#36504d',red:'#e66362',yellow:'#f5ce56',brown:'#a45b39',bun:'#e6b36b',sausage:'#d87955',wood:'#ba8660',glass:'#719eaa',blue:'#7eadd1',pink:'#f1a7bb'};
  const mat=k=>palette.m(c[k]||k),glow=k=>palette.glow(c[k]||k);
  const geo=g=>(ownedGeometry.add(g),g);
  const cube=geo(new THREE.BoxGeometry(1,1,1)),sphere=geo(new THREE.SphereGeometry(1,12,8)),up=new THREE.Vector3(0,1,0);
  function group(name,p=[0,0,0],target=root){const g=new THREE.Group();g.name=name;g.position.set(...p);target.add(g);return g;}
  function add(g,geometry,material,p=[0,0,0],s=[1,1,1],r=[0,0,0]){const o=new THREE.Mesh(geometry,material);o.position.set(...p);o.scale.set(...s);o.rotation.set(...r);o.castShadow=true;o.receiveShadow=true;g.add(o);stats.meshes++;stats.triangles+=(geometry.index?.count||geometry.attributes.position.count)/3;return o;}
  const box=(g,w,h,d,m,p,r)=>add(g,cube,m,p,[w,h,d],r);
  const ball=(g,s,m,p)=>add(g,sphere,m,p,s);
  const cylinder=(g,a,b,h,m,p,r=[0,0,0],n=12)=>{if(typeof r==='number'){n=r;r=[0,0,0];}return add(g,geo(new THREE.CylinderGeometry(a,b,h,n)),m,p,[1,1,1],r);};
  function bar(g,a,b,r,m){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),delta=q.clone().sub(p);const o=cylinder(g,r,r,delta.length(),m,p.add(q).multiplyScalar(.5).toArray(),[0,0,0],6);o.quaternion.setFromUnitVectors(up,delta.normalize());return o;}
  function curve(g,points,r,m,steps=24){const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return add(g,geo(new THREE.TubeGeometry(path,steps,r,5,false)),m);}
  function capsule(g,length,r,m,p,rotation=[0,0,Math.PI/2]){return add(g,geo(new THREE.CapsuleGeometry(r,length-r*2,5,12)),m,p,[1,1,1],rotation);}
  // The hat follows the head while the apron follows the torso. Bake only
  // their rigid pieces, keeping the character's coloured rig entirely intact.
  let accessoryMaterial;
  function mergeAccessory(g){
    if(!accessoryMaterial){accessoryMaterial=palette.m('#ffffff').clone();accessoryMaterial.vertexColors=true;ownedMaterial.add(accessoryMaterial);}
    g.updateWorldMatrix(true,true);const inverse=g.matrixWorld.clone().invert(),parts=[],originals=[];
    g.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();p.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));
      for(const key of Object.keys(p.attributes))if(!['position','normal'].includes(key))p.deleteAttribute(key);
      const color=o.material.color,data=new Float32Array(p.attributes.position.count*3);
      for(let i=0;i<data.length;i+=3){data[i]=color.r;data[i+1]=color.g;data[i+2]=color.b;}
      p.setAttribute('color',new THREE.BufferAttribute(data,3));p.clearGroups();parts.push(p);originals.push(o);
    });
    const geometry=geo(mergeGeometries(parts,false));parts.forEach(p=>p.dispose());originals.forEach(o=>o.removeFromParent());
    const merged=new THREE.Mesh(geometry,accessoryMaterial);merged.name=g.name+' · painted batch';merged.castShadow=merged.receiveShadow=true;g.add(merged);stats.meshes-=originals.length-1;
  }
  function panel(g,label,w,h,p,{bg=c.cream,ink=c.ink,small='',rotation=0}={}){
    const canvas=document.createElement('canvas');canvas.width=640;canvas.height=240;const ctx=canvas.getContext('2d');
    ctx.fillStyle=bg;ctx.fillRect(0,0,640,240);ctx.strokeStyle=ink;ctx.lineWidth=7;ctx.strokeRect(13,13,614,214);
    ctx.fillStyle=ink;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='italic 900 107px "Trebuchet MS", "Microsoft YaHei", sans-serif';ctx.fillText(label,320,small?99:128,585);
    if(small){ctx.font='700 36px "Trebuchet MS", "Microsoft YaHei", sans-serif';ctx.fillText(small,320,190,560);}
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;ownedTexture.add(texture);
    const material=new THREE.MeshBasicMaterial({map:texture,toneMapped:false});ownedMaterial.add(material);
    const plane=add(g,geo(new THREE.PlaneGeometry(w,h)),material,p);plane.rotation.y=rotation;plane.castShadow=false;
    return plane;
  }
  function wheel(g,x,z,r=.06){
    cylinder(g,r,r,.029,mat('ink'),[x,r,z],[Math.PI/2,0,0],20);
    cylinder(g,r*.75,r*.75,.033,mat('red'),[x,r,z],[Math.PI/2,0,0],16);
    const side=Math.sign(z)||1;for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ball(g,[r*.10,r*.17,.0028],mat('ink'),[x+Math.sin(a)*r*.47,r+Math.cos(a)*r*.47,z+side*.018]);}
    cylinder(g,r*.21,r*.21,.038,mat('cream'),[x,r,z],[Math.PI/2,0,0],12);
  }
  function hotdog(g,p,size=1){const h=group('Toasted bun and mustard ribbon',p,g);h.scale.setScalar(size);
    for(const z of [-.041,.041])capsule(h,.36,.043,mat('bun'),[0,0,z]);
    capsule(h,.384,.034,mat('sausage'),[0,.025,0]);
    curve(h,Array.from({length:33},(_,i)=>{const x=-.162+i*.324/32;return[x,.056+Math.sin(i/32*Math.PI)*.003,Math.sin(i/32*Math.PI*5)*.022];}),.008,mat('yellow'),42);
    for(let i=0;i<9;i++){const o=ball(h,[.006,.003,.002],mat('cream'),[-.145+i*.036,.035,i%2?.062:-.062]);o.rotation.y=i*.76;}
    return h;
  }
  function bottle(g,x,y,z,color){cylinder(g,.009,.011,.033,mat(color),[x,y+.0165,z],[0,0,0],8);cylinder(g,.004,.006,.015,mat(color),[x,y+.040,z],[0,0,0],8);box(g,.014,.012,.014,mat('cream'),[x,y+.020,z]);}
  function stripedAwning(g,x,y,z,w,depth,colors=['red','white'],count=8){
    for(let i=0;i<count;i++){const xx=x-w*.5+w/count*(i+.5),paint=mat(colors[i%colors.length]);
      box(g,w/count+.0004,.009,depth,paint,[xx,y,z],[-.23,0,0]);
      capsule(g,w/count,.012,paint,[xx,y-.025,z+depth*.48]);
      box(g,w/count,.024,.007,paint,[xx,y-.018,z+depth*.48]);
    }
    bar(g,[x-w*.5,y+.020,z-depth*.48],[x+w*.5,y+.020,z-depth*.48],.004,mat('ink'));
    for(const side of [-1,1])bar(g,[x+side*w*.47,y-.077,z-depth*.4],[x+side*w*.47,y-.025,z+depth*.42],.004,mat('cream'));
  }

  const truck=group('Reference green hot-dog truck',[-.22,0,-.10]);
  // A low friendly van silhouette, with contrasting tyres and a sloped cab.
  box(truck,.85,.11,.34,mat('green'),[0,.135,0]);box(truck,.75,.014,.354,mat('ink'),[.025,.083,0]);
  box(truck,.53,.24,.018,mat('cream'),[.147,.29,-.158]);
  for(const x of [-.112,.407])box(truck,.018,.24,.334,mat('cream'),[x,.29,0]);
  box(truck,.53,.018,.334,mat('cream'),[.147,.181,0]);
  box(truck,.27,.15,.334,mat('cream'),[-.252,.270,0]);
  box(truck,.073,.11,.322,mat('green'),[-.389,.176,0]);
  const glassFront=box(truck,.010,.130,.292,mat('glass'),[-.393,.282,0],[0,0,-.19]);
  box(truck,.007,.132,.008,mat('cream'),[-.401,.284,0],[0,0,-.19]);
  for(const side of [-1,1]){
    box(truck,.186,.105,.006,mat('ink'),[-.258,.285,side*.171]);
    box(truck,.159,.087,.007,mat('glass'),[-.264,.288,side*.175]);
    box(truck,.010,.112,.012,mat('cream'),[-.170,.284,side*.178]);
    box(truck,.196,.065,.007,mat('green'),[-.263,.208,side*.175]);
    box(truck,.029,.009,.010,mat('cream'),[-.183,.214,side*.185]);
    bar(truck,[-.354,.250,side*.180],[-.391,.252,side*.220],.005,mat('ink'));
    box(truck,.020,.036,.019,mat('cream'),[-.393,.258,side*.225]);
    box(truck,.024,.005,.063,mat('cream'),[-.413,.311,side*.080],[0,0,-.19]);
  }
  for(const x of [-.275,.284])for(const z of [-.171,.171])wheel(truck,x,z,.061);
  box(truck,.025,.032,.368,mat('cream'),[-.431,.104,0]);
  box(truck,.028,.029,.122,mat('ink'),[-.448,.136,0]);
  for(const z of [-.113,.113])box(truck,.014,.036,.071,glow('cream'),[-.436,.162,z],[0,0,-.12]);
  for(const z of [-.11,.11])box(truck,.012,.022,.038,mat('red'),[.430,.131,z]);
  box(truck,.025,.040,.369,mat('cream'),[.420,.105,0]);
  // Rear walls frame a genuinely open serving hatch, rather than a flat sign.
  box(truck,.49,.125,.012,mat('green'),[.15,.162,.177]);
  box(truck,.48,.113,.013,mat('wood'),[.15,.286,-.179]);
  box(truck,.49,.124,.007,mat('ink'),[.147,.290,-.144]);
  box(truck,.462,.105,.007,mat('wood'),[.147,.290,-.137]);
  box(truck,.452,.009,.069,mat('cream'),[.147,.301,-.104]);
  for(let i=0;i<4;i++)capsule(truck,.048,.014,mat('bun'),[.024+i*.067,.317,-.103]);
  // Dark recess, griddle and shelves read clearly through the front opening.
  box(truck,.46,.062,.10,mat('brown'),[.145,.229,.103]);
  box(truck,.458,.010,.120,mat('ink'),[.145,.261,.12]);
  for(let i=0;i<5;i++)capsule(truck,.045,.006,mat('sausage'),[.014+i*.033,.271,.143]);
  for(const x of [-.103,.402])box(truck,.014,.159,.028,mat('cream'),[x,.280,.185]);
  box(truck,.540,.013,.12,mat('cream'),[.148,.185,.218]);
  box(truck,.540,.010,.123,mat('wood'),[.148,.174,.218]);
  box(truck,.555,.030,.358,mat('cream'),[.143,.421,0]);
  box(truck,.555,.009,.363,mat('ink'),[.143,.405,0]);
  stripedAwning(truck,.149,.393,.235,.563,.169,['red','white'],8);
  // Window opening remains above .185 counter, fitting the little customers.
  panel(truck,'HOT DOG',.502,.103,[.148,.446,.189],{small:'HAPPY LITTLE BITES'});
  box(truck,.525,.116,.021,mat('ink'),[.148,.446,.175]);
  for(const x of [-.045,.319])bar(truck,[x,.431,0],[x,.511,0],.007,mat('cream'));
  const giantDog=hotdog(truck,[.134,.556,0],1.22);giantDog.rotation.y=-.03;
  for(const side of [-1,1]){
    const horn=group('Cream roof loudspeaker',[.143+side*.250,.477,-.098],truck);horn.rotation.z=side*Math.PI/2;
    cylinder(horn,.032,.012,.052,mat('cream'),[0,.008,0]);cylinder(horn,.025,.025,.004,mat('red'),[0,.035,0]);cylinder(horn,.016,.016,.005,mat('ink'),[0,.038,0]);
  }
  bottle(truck,.319,.191,.231,'yellow');bottle(truck,.362,.191,.231,'red');
  box(truck,.047,.025,.038,mat('cream'),[.272,.204,.229]);box(truck,.028,.003,.027,mat('white'),[.272,.218,.229]);
  box(truck,.074,.004,.045,mat('white'),[.043,.193,.24]);hotdog(truck,[.043,.202,.24],.16);
  box(truck,.069,.042,.034,mat('mint'),[.178,.211,.194]);box(truck,.05,.017,.003,mat('ink'),[.178,.219,.213]);
  // Low sign on the painted body; use a plane so lettering faces the queue.
  panel(truck,'GOOD DOG',.238,.051,[.070,.144,.188],{bg:c.green,ink:c.cream});
  for(let i=0;i<5;i++)ball(truck,[.009,.009,.005],glow('yellow'),[-.064+i*.104,.365,.184]);

  // The chef stands on the van floor behind the griddle. Its face stays below
  // the awning, and the toque stays inside the roof even while greeting.
  const chefActor=createParkAnimal({palette,species:'bear',outfit:c.greenDark,pose:'walk',size:.20});
  const chef=chefActor.root;chef.name='Honey · little bear hot-dog chef';chef.position.set(.218,.182,.018);chef.userData.dynamic=true;truck.add(chef);
  const apron=group('Cream apron and little pocket',[0,0,0],chef);
  box(apron,.239,.199,.014,mat('cream'),[0,.288,.159]);
  ball(apron,[.109,.040,.012],mat('cream'),[0,.202,.163]);
  for(const side of [-1,1])bar(apron,[side*.071,.392,.153],[side*.057,.492,.113],.012,mat('cream'));
  box(apron,.099,.047,.012,mat('white'),[0,.286,.171]);
  ball(apron,[.015,.015,.006],mat('red'),[.028,.293,.180]);
  const chefHead=chef.getObjectByName('Face and ears'),toque=group('Soft cream chefs toque',[0,.185,-.020],chefHead);
  cylinder(toque,.155,.153,.037,mat('cream'),[0,0,0],16);
  cylinder(toque,.133,.135,.110,mat('white'),[0,.067,0],16);
  for(const [x,z]of [[-.065,0],[.065,0],[0,-.054],[0,.054]])ball(toque,[.089,.070,.086],mat('white'),[x,.118,z]);
  for(const x of [-.067,0,.067])bar(toque,[x,.042,.126],[x,.104,.119],.003,mat('cream'));
  mergeAccessory(apron);mergeAccessory(toque);
  chef.traverse(o=>{if(o.isMesh&&!ownedGeometry.has(o.geometry)){stats.meshes++;stats.triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});

  const cart=group('Mint and strawberry ice-cream cart',[.47,0,-.02]);
  box(cart,.235,.139,.170,mat('pink'),[0,.128,0]);box(cart,.25,.016,.187,mat('cream'),[0,.204,0]);
  box(cart,.232,.046,.176,mat('mint'),[0,.069,0]);
  for(const x of [-.120,.120]){
    cylinder(cart,.046,.046,.016,mat('ink'),[x,.046,.042],[0,0,Math.PI/2],16);
    cylinder(cart,.034,.034,.020,mat('cream'),[x,.046,.042],[0,0,Math.PI/2],12);
    cylinder(cart,.008,.008,.022,mat('pink'),[x,.046,.042],[0,0,Math.PI/2],8);
  }
  for(const x of [-.098,.098])bar(cart,[x,.025,-.067],[x,.12,-.067],.009,mat('wood'));
  curve(cart,[[-.16,.105,-.055],[-.184,.154,-.055],[-.178,.188,-.055],[-.128,.186,-.055]],.006,mat('cream'),14);
  for(const x of [-.112,.112])bar(cart,[x,.198,-.065],[x,.400,-.065],.007,mat('wood'));
  stripedAwning(cart,0,.408,.018,.282,.227,['pink','white'],7);
  box(cart,.277,.065,.020,mat('mint'),[0,.465,-.07]);panel(cart,'ICE CREAM',.264,.058,[0,.465,-.058],{bg:c.mint});
  for(let i=0;i<3;i++){
    const x=-.073+i*.073;box(cart,.060,.017,.066,mat('cream'),[x,.218,-.011]);
    ball(cart,[.024,.010,.025],mat(['pink','mint','yellow'][i]),[x,.229,-.011]);
    for(let j=0;j<3;j++)ball(cart,[.010,.005,.010],mat(['pink','mint','yellow'][i]),[x+(j-1)*.013,.233,-.01]);
  }
  panel(cart,'SCOOP OF JOY',.191,.062,[0,.136,.089],{bg:c.cream,ink:c.greenDark});
  function cone(g,p,s=1){const ice=group('Three-scoop waffle cone',p,g);ice.scale.setScalar(s);cylinder(ice,.035,0,.095,mat('bun'),[0,.046,0]);
    for(let i=0;i<4;i++){const yy=.031+i*.016,rr=.035*(yy+.002)/.095;cylinder(ice,rr+.001,rr+.001,.003,mat('cream'),[0,yy,0]);}
    ball(ice,[.040,.033,.040],mat('pink'),[-.020,.110,0]);ball(ice,[.039,.034,.039],mat('mint'),[.022,.113,.002]);ball(ice,[.036,.033,.036],mat('white'),[0,.150,0]);
    ball(ice,[.011,.011,.011],mat('red'),[.008,.182,0]);bar(ice,[.009,.189,0],[.004,.202,0],.002,mat('greenDark'));return ice;
  }
  cone(cart,[0,.430,-.076],.7);
  cone(cart,[.090,.212,.063],.28);box(cart,.038,.020,.027,mat('cream'),[.090,.219,.064]);
  for(const x of [-.083,.083])ball(cart,[.010,.010,.009],glow('yellow'),[x,.361,-.063]);

  // The reference's striped picnic parasol is a second visual landmark.
  const picnic=group('Red mint cream parasol picnic',[-.73,0,.61]);
  cylinder(picnic,.067,.071,.010,mat('wood'),[0,.130,0],20);cylinder(picnic,.009,.012,.135,mat('cream'),[0,.063,0],8);
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3;bar(picnic,[0,.043,0],[Math.sin(a)*.058,.012,Math.cos(a)*.058],.007,mat('cream'));}
  const parasol=group('Striped eight-panel parasol',[0,0,0],picnic);
  cylinder(parasol,.005,.006,.399,mat('cream'),[0,.200,0],8);ball(parasol,[.012,.018,.012],mat('cream'),[0,.417,0]);
  for(let k=0;k<8;k++){
    const positions=[],indices=[],segments=5,rings=5;
    for(let j=0;j<=rings;j++)for(let i=0;i<=segments;i++){
      const f=j/rings,a=(k+i/segments)*Math.PI/4,r=.174*f;
      positions.push(Math.cos(a)*r,.399-.065*f*f-.015*f,Math.sin(a)*r);
    }
    for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+1,d=a+segments+1;indices.push(a,b,d,b,d+1,d);}
    const g=geo(new THREE.BufferGeometry());g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();
    const paint=mat(['red','white','green','white'][k%4]);add(parasol,g,paint);
    const angle=k*Math.PI/4;curve(parasol,[[0,.397,0],[Math.cos(angle)*.087,.375,Math.sin(angle)*.087],[Math.cos(angle)*.173,.318,Math.sin(angle)*.173]],.0025,mat('cream'),10);
    for(let i=0;i<4;i++){const a=(k+(i+.5)/4)*Math.PI/4;ball(parasol,[.018,.009,.008],paint,[Math.cos(a)*.171,.315,Math.sin(a)*.171]);}
  }
  for(const [x,z,angle]of [[-.058,.093,.3],[.105,.014,-1.1]]){
    const chair=group('Sky-blue folding picnic chair',[x,0,z],picnic);chair.rotation.y=angle;
    box(chair,.060,.012,.055,mat('blue'),[0,.065,0]);box(chair,.063,.065,.011,mat('blue'),[0,.112,-.023]);
    for(const side of [-1,1]){bar(chair,[side*.025,.013,-.020],[side*.025,.077,.023],.005,mat('cream'));bar(chair,[side*.025,.013,.023],[side*.025,.079,-.023],.005,mat('cream'));}
    box(chair,.053,.009,.013,mat('cream'),[0,.148,-.023]);
  }
  box(picnic,.052,.004,.033,mat('white'),[-.022,.138,0]);hotdog(picnic,[-.022,.146,0],.105);
  cylinder(picnic,.013,.010,.028,mat('red'),[.026,.150,.014], [0,0,0],10);bar(picnic,[.026,.16,.014],[.029,.190,.014],.0017,mat('cream'));

  const menu=group('Little chalk menu',[.233,0,.264]);menu.rotation.y=-.10;
  for(const x of [-.047,.047])bar(menu,[x,0,-.027],[x,.19,.002],.006,mat('wood'));
  for(const x of [-.047,.047])bar(menu,[x,0,.045],[x,.19,.002],.006,mat('wood'));
  box(menu,.116,.144,.013,mat('wood'),[0,.112,.010]);panel(menu,'MENU',.102,.128,[0,.112,.018],{bg:c.ink,ink:c.cream,small:'DOG + SCOOP'});
  // A tiny pennant and bell are the only moving pieces and must survive the
  // park's static geometry batching unchanged.
  const bell=group('Counter bell and ribbon',[.410,.353,.123],truck);bell.userData.dynamic=true;
  bar(bell,[0,0,0],[0,-.026,0],.002,mat('yellow'));cylinder(bell,.009,.014,.016,glow('yellow'),[0,-.032,0], [0,0,0],10);
  box(bell,.011,.036,.003,mat('red'),[0,-.060,0]);
  let disposed=false;
  return{root,hotdogCounter:[-.12,0,.23],icecreamCounter:[.47,0,.19],stats,
    update(time,env={}){bell.rotation.z=Math.sin(time*1.3)*.11;bell.rotation.x=Math.sin(time*.9+.8)*.06;chefActor.animate(time,{walk:0,wave:.55+.20*Math.sin(time*.7)});},
    dispose(){if(disposed)return;disposed=true;root.removeFromParent();apron.removeFromParent();toque.removeFromParent();chefActor.dispose();for(const g of ownedGeometry)g.dispose();for(const m of ownedMaterial)m.dispose();for(const t of ownedTexture)t.dispose();}
  };
}
