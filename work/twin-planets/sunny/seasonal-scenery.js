import * as THREE from 'three';

const clamp=THREE.MathUtils.clamp,UP=new THREE.Vector3(0,1,0);
const rgb=hex=>'vec3('+new THREE.Color(hex).toArray().map(v=>v.toFixed(5)).join(',')+')';
const palettes={
  canopy:['#aaca78','#70a76e','#de9b47','#839d91'],
  grass:['#a6c974','#7fb574','#c5b175','#a3b6a5'],
  ground:['#aac878','#88b674','#c4ad70','#a1b1a3'],
  shrub:['#a6c674','#72a16b','#c9a15b','#8a9e92']
};

// Material-local shader additions: architecture and crops never share the tree
// recolouring path. Uniforms carry the season; no meshes are rebuilt each frame.
export function createSeasonalScenery({planet,height,radius,treeNormals=[]}){
  const uniforms={uSeasons:{value:new THREE.Vector4(0,1,0,0)},uSeasonSnow:{value:0},uSeasonWet:{value:0}};
  const applied=new Set(),flowerBatches=[],simpleFlowers=[];
  const state={spring:0,summer:1,autumn:0,winter:0,snowCover:0,wetness:0,flowerDensity:1,fallingLeaves:0,settledLeaves:0};
  function apply(material,kind='canopy'){
    if(!material||applied.has(material))return;
    applied.add(material);
    const before=material.onBeforeCompile.bind(material),cache=material.customProgramCacheKey.bind(material);
    material.onBeforeCompile=shader=>{
      before(shader);Object.assign(shader.uniforms,uniforms);
      shader.vertexShader='varying vec3 vSeasonPoint;varying float vSeasonUp;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        vSeasonPoint=position;vec3 seasonNormal=normal;
        #ifdef USE_INSTANCING
          vSeasonPoint=(instanceMatrix*vec4(position,1.)).xyz;
          seasonNormal=mat3(instanceMatrix)*normal;
        #endif
        vSeasonUp=${kind==='architecture'?'normalize(seasonNormal).y':'dot(normalize(seasonNormal),normalize(vSeasonPoint))'};
      `);
      shader.fragmentShader='uniform vec4 uSeasons;uniform float uSeasonSnow;uniform float uSeasonWet;varying vec3 vSeasonPoint;varying float vSeasonUp;\n'+shader.fragmentShader;
      let colour='';
      if(palettes[kind]){
        const p=palettes[kind];
        colour=`float seasonalWash=.5+.5*sin(dot(vSeasonPoint,vec3(1.23,.72,-.81))+sin(vSeasonPoint.z*1.8));
          float seasonalValue=clamp(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722))/.32,.58,1.35);
          vec3 springColour=${rgb(p[0])};vec3 autumnColour=${rgb(p[2])};
          ${kind==='canopy'?`springColour=mix(springColour,${rgb('#f5becd')},smoothstep(.62,.82,seasonalWash));
          autumnColour=mix(${rgb('#d97543')},${rgb('#eed07d')},smoothstep(.08,.93,seasonalWash));`:''}
          vec3 seasonColour=(springColour*uSeasons.x+${rgb(p[1])}*uSeasons.y+autumnColour*uSeasons.z+${rgb(p[3])}*uSeasons.w)*seasonalValue;
          float seasonalMask=${kind==='ground'?`smoothstep(${(radius+.050).toFixed(4)},${(radius+.108).toFixed(4)},length(vSeasonPoint))`:'1.'};
          diffuseColor.rgb=mix(diffuseColor.rgb,seasonColour,seasonalMask*.86);`;
      }
      const snowMask=kind==='architecture'?'smoothstep(.475,.53,vSeasonPoint.y)*smoothstep(.18,.66,vSeasonUp)':kind==='ground'?`smoothstep(${(radius+.028).toFixed(4)},${(radius+.11).toFixed(4)},length(vSeasonPoint))`:kind==='grass'?'.92':kind==='path'?'.65':'smoothstep(-.16,.68,vSeasonUp)';
      shader.fragmentShader=shader.fragmentShader.replace('#include <alphamap_fragment>',`${colour}
        float seasonalSnowMask=${snowMask};
        float snowPaint=.94+.04*sin(dot(vSeasonPoint,vec3(21.7,18.1,16.3)));
        diffuseColor.rgb*=mix(vec3(1.),vec3(.85,.93,.96),uSeasonWet*(1.-uSeasonSnow)*${kind==='architecture'?'.36':'.65'});
        diffuseColor.rgb=mix(diffuseColor.rgb,${rgb('#f0f6f4')}*snowPaint,uSeasonSnow*seasonalSnowMask*.94);
        #include <alphamap_fragment>`);
    };
    material.customProgramCacheKey=()=>cache()+'/four-seasons-'+kind+'-v1';
  }

  // Each landscape flower owns one stem, two leaves, five petals and a centre.
  // Draw-count changes keep those parts in step instead of leaving empty stems.
  function registerFlowers(meshes){
    for(const mesh of meshes){
      const per={'flower stems':1,'flower leaves':2,'wildflower petals':5,pollen:1}[mesh.name];
      if(per)flowerBatches.push({mesh,per,total:Math.floor(mesh.count/per)});
    }
  }
  function registerSimpleFlowers(meshes){simpleFlowers.push(...meshes);}

  // The same two small instance batches tell two stories: cherry petals in
  // spring, copper leaves that spiral down and gather below trees in autumn.
  const leafGeo=new THREE.BufferGeometry();
  leafGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,.06,0,-.55,0,.02,-.35,.09,.60,.12,.13,1,.42,.06,.53,.51,0,-.08,0,0,-.52],3));
  leafGeo.setIndex([0,1,2,0,2,3,0,3,4,0,4,5,0,5,6,0,6,1]);leafGeo.computeVertexNormals();
  const leafMaterial=new THREE.MeshToonMaterial({color:'#fff4dc',side:THREE.DoubleSide});
  const falling=new THREE.InstancedMesh(leafGeo,leafMaterial,168),litter=new THREE.InstancedMesh(leafGeo,leafMaterial,168);
  falling.name='Seasonal petals and falling leaves';litter.name='Autumn leaves gathered below trees';
  for(const mesh of [falling,litter]){mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=true;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);planet.add(mesh);mesh.visible=false;}
  const seeds=[],dummy=new THREE.Object3D(),tangent=new THREE.Vector3(),bitangent=new THREE.Vector3(),normal=new THREE.Vector3(),position=new THREE.Vector3();
  for(let i=0;i<168;i++){
    const n=treeNormals.length?treeNormals[i%treeNormals.length].clone():new THREE.Vector3(Math.sin(i*2.4),Math.sin(i*.43),Math.cos(i*2.4)).normalize();
    const side=new THREE.Vector3().crossVectors(Math.abs(n.y)>.92?new THREE.Vector3(1,0,0):UP,n).normalize();
    const forward=new THREE.Vector3().crossVectors(n,side);
    seeds.push({n,side,forward,phase:(i*.61803398875)%1,size:.018+(i%5)*.0025});
    normal.copy(n).addScaledVector(side,Math.sin(i*2.39)*.10).addScaledVector(forward,Math.cos(i*3.67)*.075).normalize();
    dummy.position.copy(normal).multiplyScalar(height(normal)+.008);dummy.quaternion.setFromUnitVectors(UP,normal);dummy.rotateY(i*2.4);dummy.scale.setScalar(.021+(i%4)*.004);dummy.updateMatrix();litter.setMatrixAt(i,dummy.matrix);
  }
  litter.instanceMatrix.needsUpdate=true;
  let lastColour=-10;
  const pink=new THREE.Color('#ffcbdc'),rose=new THREE.Color('#ec9eae'),amber=new THREE.Color('#d58b43'),gold=new THREE.Color('#efc974'),red=new THREE.Color('#c96e48'),colour=new THREE.Color();
  function update(time,env){
    let spring=clamp(env.spring??0,0,1),summer=clamp(env.summer??0,0,1),autumn=clamp(env.autumn??0,0,1),winter=clamp(env.winter??0,0,1),sum=spring+summer+autumn+winter;
    if(sum<.001){summer=1;sum=1;}
    spring/=sum;summer/=sum;autumn/=sum;winter/=sum;
    const snowCover=clamp(env.snowCover??Math.max(env.snow??0,winter*.82),0,1),wetness=clamp(env.wetness??env.rain??0,0,1);
    uniforms.uSeasons.value.set(spring,summer,autumn,winter);uniforms.uSeasonSnow.value=snowCover;uniforms.uSeasonWet.value=wetness;
    const flowerDensity=clamp(spring+summer*.82+autumn*.35+winter*.045,0,1);
    flowerBatches.forEach(({mesh,per,total})=>mesh.count=Math.floor(total*flowerDensity)*per);
    simpleFlowers.forEach(mesh=>mesh.visible=winter<.58);
    const strength=(spring*.70+autumn)*(1-clamp(env.rain??0,0,1)*.7)*(1-winter);
    falling.count=Math.round(168*strength);falling.visible=falling.count>0;
    litter.count=Math.round(168*autumn*(1-snowCover));litter.visible=litter.count>0;
    if(Math.abs(lastColour-autumn)>.01){
      for(let i=0;i<168;i++){colour.copy(i%3?pink:rose).lerp(i%3===0?red:i%2?amber:gold,autumn);falling.setColorAt(i,colour);litter.setColorAt(i,i%3===0?red:i%2?amber:gold);}
      falling.instanceColor.needsUpdate=true;litter.instanceColor.needsUpdate=true;lastColour=autumn;
    }
    if(falling.visible){
      const wind=clamp(env.wind??.3,0,2);
      for(let i=0;i<falling.count;i++){
        const s=seeds[i],fall=(s.phase+time*(.10+wind*.038))%1,angle=time*(.5+wind*.45)+i*2.4;
        tangent.copy(s.side).multiplyScalar(Math.sin(angle)*(.075+fall*.15)+fall*.10*wind);
        bitangent.copy(s.forward).multiplyScalar(Math.cos(angle*.71)*(.06+fall*.06));
        normal.copy(s.n).add(tangent).add(bitangent).normalize();
        position.copy(normal).multiplyScalar(height(normal)+.018+(1-fall)*(.46+(i%5)*.02));
        dummy.position.copy(position);dummy.quaternion.setFromUnitVectors(UP,normal);dummy.rotateY(angle*1.7);dummy.rotateX(Math.sin(angle*1.3)*.9);dummy.rotateZ(Math.cos(angle)*.7);dummy.scale.setScalar(s.size*Math.min(1,fall*12,(1-fall)*12));dummy.updateMatrix();falling.setMatrixAt(i,dummy.matrix);
      }
      falling.instanceMatrix.needsUpdate=true;
    }
    Object.assign(state,{spring,summer,autumn,winter,snowCover,wetness,flowerDensity,fallingLeaves:falling.count,settledLeaves:litter.count});
  }
  return{apply,registerFlowers,registerSimpleFlowers,update,uniforms,falling,litter,getState:()=>({...state,seasonalMaterials:applied.size,extraDrawCalls:Number(falling.visible)+Number(litter.visible)}),dispose(){falling.removeFromParent();litter.removeFromParent();falling.dispose();litter.dispose();leafGeo.dispose();leafMaterial.dispose();}};
}
