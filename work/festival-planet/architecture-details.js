import {THREE} from './core.js';

// Small, clean pieces of painted joinery. These remain opaque and static so
// the park's normal scenery pass can merge them into the shared toon palette.
export function createArchitectureDetails({palette}){
  const {m,glow}=palette;
  const colors={cream:'#fff0d0',ivory:'#fff9e8',wood:'#af826d',woodLight:'#ceb096',ink:'#405f6b',gold:'#e9bc69',rose:'#d66f8c',pink:'#f4a4b2',mint:'#98d7c7',blue:'#719dbc',purple:'#ac9bcf',green:'#438e83',leaf:'#79b99a'};
  const stats={shops:0,castles:0,observatories:0,bridges:0,windows:0,roseClusters:0,roofTiles:0,triangles:0};
  const cube=new THREE.BoxGeometry(1,1,1),sphere=new THREE.SphereGeometry(1,8,5);
  // Tiny leaves and petals are shallow, smoothly shaded painted lenses. They
  // need only 16 triangles instead of an entire hidden sphere per petal.
  const lensVertices=[0,0,1,0,0,-1],lensIndices=[];
  for(let i=0;i<8;i++){const a=i*Math.PI/4;lensVertices.push(Math.cos(a),Math.sin(a),0);lensIndices.push(0,2+i,2+(i+1)%8,1,2+(i+1)%8,2+i);}
  const lens=new THREE.BufferGeometry();lens.setAttribute('position',new THREE.Float32BufferAttribute(lensVertices,3));lens.setIndex(lensIndices);lens.computeVertexNormals();
  const c=(key)=>m(colors[key]||key);
  function group(parent,name,pos=[0,0,0],rotation=0){const g=new THREE.Group();g.name=name;g.position.set(...pos);g.rotation.y=rotation;parent.add(g);return g;}
  function add(parent,geometry,material,pos=[0,0,0],scale=[1,1,1]){const o=new THREE.Mesh(geometry,material);o.position.set(...pos);o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;parent.add(o);stats.triangles+=(geometry.index?.count??geometry.attributes.position.count)/3;return o;}
  const box=(g,w,h,d,mat,p)=>add(g,cube,mat,p,[w,h,d]);
  const ball=(g,s,mat,p)=>add(g,sphere,mat,p,s);
  const cylinder=(g,top,bottom,height,mat,p,segments=8)=>add(g,new THREE.CylinderGeometry(top,bottom,height,segments),mat,p);
  function bar(g,a,b,r,mat,segments=5){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start),o=cylinder(g,r,r,delta.length(),mat,start.clone().add(end).multiplyScalar(.5).toArray(),segments);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o;}
  function ring(g,r,t,mat,p=[0,0,0],vertical=false,segments=24){const o=add(g,new THREE.TorusGeometry(r,t,4,segments),mat,p);o.rotation.x=vertical?0:Math.PI/2;return o;}
  function leaf(g,x,y,z,angle=0,size=.018){const o=add(g,lens,c('leaf'),[x,y,z],[size*.48,size,size*.24]);o.rotation.z=angle;return o;}
  function rose(g,x,y,z,size=.019,color='pink'){
    // A five-petal silhouette with a painted centre, rather than noisy texture.
    for(let k=0;k<5;k++){const a=k*Math.PI*2/5;add(g,lens,c(color),[x+Math.sin(a)*size*.50,y+Math.cos(a)*size*.50,z],[size*.54,size*.51,size*.27]);}
    add(g,lens,c('ivory'),[x,y,z+size*.19],[size*.31,size*.29,size*.34]);stats.roseClusters++;
  }
  function window(g,x,y,z,w=.105,h=.132,shutters=true){
    const pane=group(g,'Framed honey glass',[x,y,z]);
    box(pane,w,h,.007,glow('#ffe7a9'),[0,0,0]);
    for(const side of [-1,1])box(pane,.012,h+.017,.017,c('ivory'),[side*(w*.5+.006),0,.008]);
    for(const side of [-1,1])box(pane,w+.035,.012,.021,c('ivory'),[0,side*(h*.5+.006),.012]);
    box(pane,.006,h,.014,c('wood'),[0,0,.010]);box(pane,w,.006,.014,c('wood'),[0,h*.07,.010]);
    // One restrained blue reflection keeps the glass readable in daylight.
    const glint=box(pane,.007,h*.32,.001,c('#f2fff0'),[-w*.24,h*.21,.005]);glint.rotation.z=-.24;
    if(shutters)for(const side of [-1,1]){
      const s=group(pane,'Mint painted shutter',[side*(w*.5+.030),0,.012],side*.14);
      box(s,.031,h+.010,.009,c('mint'),[0,0,0]);
      for(let i=0;i<4;i++)box(s,.026,.007,.010,c('green'),[0,-h*.32+i*h*.21,.006]);
      box(s,.006,h+.012,.011,c('ivory'),[side*.019,0,.004]);
    }
    stats.windows++;return pane;
  }
  function planter(g,x,y,z,width=.124){
    box(g,width,.029,.045,c('wood'),[x,y,z]);box(g,width+.008,.006,.050,c('woodLight'),[x,y+.017,z]);
    box(g,width*.88,.004,.036,c('green'),[x,y+.020,z]);
    for(const side of [-1,1])box(g,.006,.027,.048,c('gold'),[x+side*width*.34,y,z]);
    for(let i=0;i<3;i++){const xx=x+(i-1)*width*.27;leaf(g,xx-.007,y+.034,z+.004,-.5,.019);leaf(g,xx+.008,y+.039,z+.004,.7,.020);rose(g,xx,y+.043,z+.021,.012,i%2?'ivory':'pink');}
  }
  function roofTiles(g,type){
    const tones=[['#e3a0b5','#f5b9c8'],['#87bcb0','#b6dcd0'],['#a090bc','#c5b6de'],['#7299b3','#a4c7d5']][type%4];
    // Tile pieces follow the actual pyramid slope (base half-width .2015,
    // base y .415, peak .645), without enlarging its silhouette.
    for(let face=0;face<4;face++){
      const panel=group(g,'Scalloped painted roof',[0,0,0],face*Math.PI/2);
      for(let row=0;row<4;row++){
        const low=.421+row*.048,high=low+.046,count=5-row;
        const half=.2015*(.645-high)/.23,step=half*2/count;
        for(let i=0;i<count;i++){
          const x=-half+(i+.5)*step,w=step*.91,h=high-low;
          const outline=[[-w*.5,h],[w*.5,h],[w*.5,h*.16],[w*.34,h*.04],[0,0],[-w*.34,h*.04],[-w*.5,h*.16]];
          const verts=[x,low+h*.52,.2015*(.645-(low+h*.52))/.23+.0027],indices=[];
          for(const [xx,yy]of outline){const y=low+yy;verts.push(x+xx,y,.2015*(.645-y)/.23+.0027);}
          for(let k=0;k<outline.length;k++)indices.push(0,(k+1)%outline.length+1,k+1);
          const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();
          add(panel,geo,m(tones[(row+i)%2]));stats.roofTiles++;
        }
      }
    }
    for(const sx of [-1,1])for(const sz of [-1,1])bar(g,[sx*.204,.418,sz*.204],[0,.65,0],.004,c('gold'));
  }
  function shop(parent,{type=0}={}){
    const g=group(parent,'Handcrafted cottage details');
    const tone=['pink','mint','purple','blue'][type%4];
    // Corner joinery and a shallow cream plinth clarify the cottage's scale.
    for(const x of [-.164,.164])for(const z of [-.122,.122])box(g,.018,.29,.018,c('woodLight'),[x,.201,z]);
    box(g,.339,.023,.256,c('woodLight'),[0,.067,0]);
    for(const side of [-1,1]){
      const wall=group(g,'Cottage side joinery',[side*.162,0,0],side*Math.PI/2);
      for(let j=0;j<4;j++)box(wall,.222,.003,.003,c('woodLight'),[0,.108+j*.057,.003]);
      window(wall,0,.226,.005,.090,.118,true);planter(wall,0,.139,.025,.122);
      // Eave brackets carry the oversailing roof rather than float under it.
      for(const x of [-.083,.083])bar(wall,[x,.344,.010],[x,.387,.053],.008,c('wood'));
    }
    const rear=group(g,'Painted service door',[0,0,-.125],Math.PI);
    box(rear,.084,.19,.011,c(tone),[0,.169,.001]);
    for(const x of [-.047,.047])box(rear,.009,.205,.016,c('woodLight'),[x,.172,.009]);
    box(rear,.1,.009,.018,c('ivory'),[0,.276,.010]);
    box(rear,.051,.038,.003,glow('#ffe7a9'),[0,.225,.008]);box(rear,.005,.038,.006,c('wood'),[0,.225,.011]);
    ball(rear,[.005,.005,.004],c('gold'),[.028,.159,.009]);
    for(let i=0;i<4;i++)box(rear,.216,.003,.003,c('woodLight'),[0,.091+i*.060,-.003]);
    // Brass counter trim, inset cabinet panels and a tiny apron beneath it.
    box(g,.270,.008,.079,c('gold'),[0,.205,.171]);
    for(const x of [-.083,0,.083]){box(g,.072,.069,.009,c(tone),[x,.120,.132]);box(g,.056,.053,.003,c('cream'),[x,.120,.138]);}
    for(const x of [-.103,.102])bar(g,[x,.108,.133],[x,.170,.195],.007,c('wood'));
    roofTiles(g,type);
    // A little chimney emerges from a rear roof quadrant; the cap is clear
    // of the cone apex and existing shop signs and awnings.
    box(g,.060,.154,.055,c('cream'),[.118,.556,-.090]);
    for(let i=0;i<3;i++){box(g,.064,.006,.059,c('woodLight'),[.118,.513+i*.046,-.090]);}
    box(g,.078,.022,.072,c('wood'),[.118,.641,-.090]);box(g,.040,.002,.034,c('ink'),[.118,.654,-.090]);
    cylinder(g,.005,.008,.046,c('gold'),[0,.665,0]);ball(g,[.017,.022,.017],c('gold'),[0,.700,0]);
    // A pair of simple hanging glass charms catches the warm evening light.
    for(const side of [-1,1]){bar(g,[side*.150,.310,.265],[side*.150,.276,.265],.002,c('gold'),4);ball(g,[.010,.015,.009],glow('#ffe4a7'),[side*.150,.266,.265]);}
    stats.shops++;return g;
  }
  function castle(parent){
    const g=group(parent,'Castle porcelain and rose details');
    // Fine horizontal masonry joints and alternating corner quoins break up
    // the broad walls without introducing noisy, realistic stone textures.
    for(const side of [-1,1]){
      for(let row=0;row<7;row++)box(g,row%2?.035:.047,.023,.014,c('cream'),[side*.280,.304+row*.071,.187]);
      for(let row=0;row<5;row++)box(g,.19,.004,.004,c('#e8cfb4'),[side*.192,.32+row*.096,.184]);
      box(g,.012,.54,.018,c('gold'),[side*.304,.53,.175]);
      const sidePanel=group(g,'Castle side window',[side*.305,.540,-.06],side*Math.PI/2);
      window(sidePanel,0,0,0,.101,.205,false);
      box(sidePanel,.150,.015,.065,c('cream'),[0,-.12,.02]);
      for(let j=0;j<3;j++)box(sidePanel,.026,.053,.034,c('cream'),[(j-1)*.047,-.146,.019]);
      // Trellises stay alongside the entrance instead of crossing its arch.
      const roseX=side*.237;
      for(let i=0;i<5;i++){
        const y=.306+i*.076,x=roseX+Math.sin(i*1.8)*.021;
        if(i>0)bar(g,[roseX+Math.sin((i-1)*1.8)*.021,y-.076,.204],[x,y,.204],.004,c('green'));
        leaf(g,x+side*.019,y+.010,.208,side*.9,.026);
        if(i%2===0)rose(g,x,y+.012,.212,.023,i===2?'rose':'pink');
      }
      for(let j=0;j<5;j++){
        const z=.495+j*.05;
        box(g,.04,.011,.039,c(j%2?'pink':'gold'),[side*.385,.166,z]);
      }
      // Wing cornice, blue inset panes, and a tiny stone sill.
      box(g,.250,.009,.035,c('ivory'),[side*.37,.548,.201]);
      box(g,.079,.012,.063,c('cream'),[side*.365,.343,.212]);
      box(g,.005,.089,.009,c('gold'),[side*.365,.409,.231]);
      box(g,.050,.005,.009,c('gold'),[side*.365,.400,.231]);
    }
    // Glazing and carved panels on the two doors are visible through the
    // warm entrance lighting; the doorway and all existing steps stay clear.
    for(const side of [-1,1]){
      box(g,.050,.040,.006,c('rose'),[side*.044,.309,.250]);
      box(g,.043,.027,.003,c('pink'),[side*.044,.311,.254]);
      ball(g,[.007,.009,.005],c('gold'),[side*.014,.364,.261]);
      box(g,.005,.110,.006,c('gold'),[side*.040,.438,.251]);
    }
    box(g,.154,.006,.011,c('gold'),[0,.432,.250]);
    for(let j=0;j<6;j++)box(g,.382+j*.035,.005,.012,c('ivory'),[0,.127-j*.019,.736+j*.056]);
    for(const x of [-.117,0,.117]){
      box(g,.026,.036,.043,c('cream'),[x,.606,.226]);
      bar(g,[x,.585,.189],[x,.623,.275],.009,c('gold'));
    }
    const towers=[[0,-.07,.88,.125],[-.43,-.26,.66,.108],[.43,-.26,.69,.108],[-.47,.30,.40,.114],[.47,.30,.40,.114],[-.20,-.20,.75,.065],[.21,-.19,.77,.065]];
    for(const [x,z,h,r]of towers){
      ring(g,r*1.044,.005,c('gold'),[x,.24+h*.14,z],false,20);
      ring(g,r*1.017,.004,c('cream'),[x,.24+h*.69,z],false,20);
      for(const angle of [0,Math.PI/2,-Math.PI/2]){
        const win=group(g,'Turret stained-glass mullions',[x+Math.sin(angle)*(r+.023),.24+h*.45,z+Math.cos(angle)*(r+.023)],angle);
        box(win,.005,h*.20,.007,c('gold'),[0,.012+h*.10,.012]);
        box(win,r*.45,.005,.007,c('gold'),[0,.014+h*.10,.012]);
        box(win,r*.66,.011,.023,c('cream'),[0,-.005,.003]);stats.windows++;
      }
    }
    // Eight little gold spokes make the existing rose window feel crafted.
    for(let i=0;i<8;i++){const a=i*Math.PI/4;bar(g,[Math.sin(a)*.034,.87+Math.cos(a)*.034,.166],[Math.sin(a)*.059,.87+Math.cos(a)*.059,.166],.0025,c('gold'),4);}
    stats.castles++;return g;
  }
  function observatory(parent){
    const g=group(parent,'Observatory copper and glass details');
    ring(g,.151,.006,c('gold'),[0,.300,0]);ring(g,.138,.007,c('ivory'),[0,.258,0]);
    for(let k=0;k<6;k++){
      const angle=k*Math.PI/3+.28;
      for(let j=0;j<5;j++){
        const a=j*Math.PI/12,b=(j+1)*Math.PI/12;
        bar(g,[Math.sin(angle)*.155*Math.cos(a),.301+.118*Math.sin(a),Math.cos(angle)*.155*Math.cos(a)],[Math.sin(angle)*.155*Math.cos(b),.301+.118*Math.sin(b),Math.cos(angle)*.155*Math.cos(b)],.003,c('gold'),4);
      }
      const w=group(g,'Observatory round window',[Math.sin(angle)*.130,.174,Math.cos(angle)*.130],angle);
      if(Math.cos(angle)<.8){ball(w,[.028,.034,.006],glow('#ffe7a9'),[0,0,0]);const r=ring(w,.031,.005,c('ivory'),[0,0,.007],true,16);r.scale.y=1.13;box(w,.004,.059,.005,c('gold'),[0,0,.011]);stats.windows++;}
    }
    for(let i=0;i<10;i++){const a=i*Math.PI/5;box(g,.026,.028,.020,c('woodLight'),[Math.sin(a)*.199,.045,Math.cos(a)*.199]);}
    cylinder(g,.010,.014,.040,c('gold'),[0,.432,0]);ball(g,[.015,.021,.015],c('gold'),[0,.461,0]);
    stats.observatories++;return g;
  }
  function bridge(parent,{length=.58,width=.24}={}){
    const g=group(parent,'Rosebridge joinery');
    for(const side of [-1,1]){
      const x=side*width*.52;
      for(let i=0;i<5;i++){
        const z=(i/4-.5)*length,y=.11*Math.sin(i/4*Math.PI);
        cylinder(g,.016,.012,.016,c('gold'),[x,y+.163,z],6);
        ball(g,[.012,.017,.012],c('pink'),[x,y+.181,z]);
        box(g,.025,.027,.024,c('woodLight'),[x,y+.020,z]);
        if(i<4){const nextZ=((i+1)/4-.5)*length,nextY=.11*Math.sin((i+1)/4*Math.PI);
          bar(g,[x,y+.044,z],[x,nextY+.128,nextZ],.004,c('ivory'),4);
          bar(g,[x,y+.128,z],[x,nextY+.044,nextZ],.004,c('ivory'),4);
        }
      }
    }
    for(let i=0;i<11;i++){
      const z=(i/10-.5)*length,y=.11*Math.sin(i/10*Math.PI)+.0135;
      for(const side of [-1,1]){const rivet=add(g,new THREE.CircleGeometry(.003,6),c('gold'),[side*width*.37,y,z]);rivet.rotation.x=-Math.PI/2;}
    }
    stats.bridges++;return g;
  }
  return {shop,castle,observatory,bridge,stats};
}
