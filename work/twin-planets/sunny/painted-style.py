from pathlib import Path
p=Path('work/planet-v2/nature.js');s=p.read_text(encoding='utf-8');a=s.index('export function enhanceWater(');b=s.index('\nexport function enhanceFoam',a)
s=s[:a]+'''export function enhanceWater(material,uniforms){
  // Painted broad currents and simple foam, without reflective PBR microdetail.
  material.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,uniforms);
    shader.vertexShader=WATER_GLSL+'\\nattribute float seaDepth;varying vec3 vOceanPos;varying float vDepth;\\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vDepth=seaDepth;vOceanPos=position;transformed+=normalize(position)*oceanHeight(position,seaDepth);
    `);
    shader.fragmentShader='uniform float uNatureTime;uniform float uDaylight;varying vec3 vOceanPos;varying float vDepth;\\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float flow=sin(vOceanPos.x*18.+vOceanPos.z*13.-uNatureTime*.65+sin(vOceanPos.y*12.+uNatureTime*.3));
      float line=smoothstep(.88,.98,flow);
      float shallow=1.-smoothstep(.02,.20,vDepth);
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.62,.89,.84),line*(.13+shallow*.19));
      float edge=(1.-smoothstep(.008,.055,vDepth))*smoothstep(.25,.85,sin(vDepth*140.-uNatureTime*1.5));
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.92,.98,.87),edge*.62);
    `);
  };material.customProgramCacheKey=()=> 'painted-water-v6';
}

export function enhanceFoliage(material,uniforms){
  function deform(shader){
    Object.assign(shader.uniforms,uniforms);shader.vertexShader=WIND_GLSL+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      vec3 root=instanceMatrix[3].xyz;
      vec3 outward=normalize(root),wind=vec3(.8,.1,.45);wind-=outward*dot(wind,outward);
      vec3 delta=wind*windField(root)*.018;
      transformed+=vec3(dot(instanceMatrix[0].xyz,delta)/dot(instanceMatrix[0].xyz,instanceMatrix[0].xyz),dot(instanceMatrix[1].xyz,delta)/dot(instanceMatrix[1].xyz,instanceMatrix[1].xyz),dot(instanceMatrix[2].xyz,delta)/dot(instanceMatrix[2].xyz,instanceMatrix[2].xyz));
    `);
  }
  material.onBeforeCompile=shader=>{
    deform(shader);shader.vertexShader='varying vec3 vPaintPoint;\\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\\nvPaintPoint=position;');
    shader.fragmentShader='uniform float uSnow;varying vec3 vPaintPoint;\\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float brush=sin(vPaintPoint.x*5.+sin(vPaintPoint.z*4.))*cos(vPaintPoint.y*6.);
      diffuseColor.rgb*=.98+brush*.035;
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.9,.95,.85),uSnow*smoothstep(.3,.9,vPaintPoint.y)*.65);
    `);
  };material.customProgramCacheKey=()=> 'painted-foliage-v6';
  const depth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});depth.onBeforeCompile=deform;depth.customProgramCacheKey=()=> 'painted-foliage-depth-v6';return depth;
}
''' +s[b:]
s=s.replace('houseSites,uniforms){','houseSites,uniforms,gradientMap){')
s=s.replace('// Five segments per blade: an anchored root, curved body and a pointed tip.','// Three broad segments read as brush strokes. Ground color carries the distant meadow.')
s=s.replace('row<=5','row<=3').replace('h=row/5,width=.18','h=row/3,width=.32').replace('if(row<5)','if(row<3)')
s=s.replace('attempt<26000&&clusters<11200','attempt<12000&&clusters<3700').replace('for(let j=0;j<7;j++)','for(let j=0;j<5;j++)')
s=s.replace("new THREE.Color('#488346'),sunShade=new THREE.Color('#a4c66a')","new THREE.Color('#79a854'),sunShade=new THREE.Color('#b6ce74')")
s=s.replace("new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.94,side:THREE.DoubleSide})","new THREE.MeshToonMaterial({color:'#ffffff',gradientMap,side:THREE.DoubleSide})")
s=s.replace('blades.castShadow=true','blades.castShadow=false')
s=s.replace('vec3(.58,.71,.49),vec3(1.13,1.10,.86)','vec3(.80,.87,.68),vec3(1.07,1.06,.92)')
a=s.index("shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_begin>'",s.index('export function createMeadow'));b=s.index("shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>'",a)
s=s[:a]+s[b:]
a=s.index('  const depth=new THREE.MeshDepthMaterial',s.index('export function createMeadow'));b=s.index('\n  const count=',a);s=s[:a]+s[b:]
s=s.replace('blades.castShadow=!low;','blades.castShadow=false;').replace('dispose(){depth.dispose();}','dispose(){}')
p.write_text(s,encoding='utf-8')
p=Path('work/planet-v2/world.js');s=p.read_text(encoding='utf-8')
s=s.replace('windAt, sampleWater }','windAt, sampleWater, enhanceFoliage }')
s=s.replace("[65,87,78,255, 128,156,135,255, 207,221,182,255, 255,255,244,255]","[115,115,115,255, 182,182,182,255, 226,226,226,255, 255,255,255,255]")
s=s.replace("new THREE.Color('#89b35b'), high = new THREE.Color('#5e9e51')","new THREE.Color('#b4cc79'), high = new THREE.Color('#8aba66')")
s=s.replace('new THREE.SphereGeometry(1, 160, 100)','new THREE.SphereGeometry(1, 128, 80)')
s=s.replace('new THREE.MeshStandardMaterial({ vertexColors: true, roughness:1 })','new THREE.MeshToonMaterial({ vertexColors: true, gradientMap })')
s=s.replace('float grain=sin(vGround.x*260.+vGround.z*170.)*sin(vGround.y*210.-vGround.z*130.);','')
s=s.replace('diffuseColor.rgb*=.86+meadowPatch*.32+grain*.035;','diffuseColor.rgb*=.95+meadowPatch*.13;')
s=s.replace("new THREE.MeshStandardMaterial({ color:'#ffffff',vertexColors:true,roughness:.34,metalness:0 })","new THREE.MeshToonMaterial({ color:'#ffffff',vertexColors:true,gradientMap })")
s=s.replace('new THREE.SphereGeometry(R,256,160)','new THREE.SphereGeometry(R,128,80)')
s=s.replace("new THREE.Color('#84ebd9'),deep=new THREE.Color('#42bde6')","new THREE.Color('#8ed6c3'),deep=new THREE.Color('#66bccc')")
a=s.index('  function tree(');b=s.index('  const houseSites',a)
s=s[:a]+'''  const crownMatrices=[],crownColors=[];
  function tree(normal,size,pink=false){
    const root=anchor(normal),g=new THREE.Group();root.add(g);g.scale.setScalar(size);stats.trees++;
    const birch=stats.trees%3!==0;
    stem(g,[0,0,0],[.025,.60,.012],.035,birch?'#eee5c9':'#957c59');
    if(birch)for(let j=0;j<4;j++)mesh(g,box,'#9f9e80',[j%2?.014:-.006,.09+j*.11,.034],[.026,.012,.005]);
    for(let j=0;j<3;j++){const a=j*2.1;stem(g,[0,.25,0],[Math.sin(a)*.18,.58,Math.cos(a)*.18],.015,'#b4a681');}
    root.updateMatrix();g.updateMatrix();const base=new THREE.Matrix4().multiplyMatrices(root.matrix,g.matrix),d=new THREE.Object3D();
    const palette=pink?['#d9a7ac','#efc2b5','#f2d0b8']:['#538865','#689c67','#88b56d','#a3c67e'];
    for(let j=0;j<10;j++){
      const a=j*2.399,r=j<7?.19:.08;
      d.position.set(Math.sin(a)*r,.54+(j<7?(j%3)*.055:.20),Math.cos(a)*r);
      d.rotation.set(.1*Math.sin(j),a,.12*Math.cos(j));
      const s=j<7?.165+rng()*.045:.16;
      d.scale.set(s*1.16,s*.87,s);d.updateMatrix();
      crownMatrices.push(new THREE.Matrix4().multiplyMatrices(base,d.matrix));
      crownColors.push(new THREE.Color(palette[j<7?j%3:3]));
    }
    const cap=mesh(g,sphere,'#f4f1df',[0,.895,0],[.17,.028,.16],false);cap.visible=false;snowCaps.push(cap);return root;
  }
''' +s[b:]
s=s.replace('made < 72','made < 49')
needle='  function shoreNormal('
a=s.index(needle)
s=s[:a]+'''  const crownMaterial=new THREE.MeshToonMaterial({color:'white',gradientMap});
  const crownDepth=enhanceFoliage(crownMaterial,natureUniforms);
  const canopy=new THREE.InstancedMesh(new THREE.SphereGeometry(1,10,7),crownMaterial,crownMatrices.length);canopy.name='Painted tree crowns';
  crownMatrices.forEach((matrix,i)=>{canopy.setMatrixAt(i,matrix);canopy.setColorAt(i,crownColors[i]);});
  canopy.customDepthMaterial=crownDepth;canopy.castShadow=true;canopy.receiveShadow=true;canopy.frustumCulled=false;planet.add(canopy);
''' +s[a:]
s=s.replace('houseSites,natureUniforms);','houseSites,natureUniforms,gradientMap);')
s=s.replace('return {planet,land,ocean,boat,surf,meadow,landscape,','return {planet,land,ocean,boat,surf,meadow,landscape,canopy,')
s=s.replace('dispose(){meadow.dispose();landscape.dispose();','dispose(){meadow.dispose();landscape.dispose();crownDepth.dispose();')
p.write_text(s,encoding='utf-8')
