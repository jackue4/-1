from pathlib import Path
p=Path('work/planet-v2/world.js')
s=p.read_text(encoding='utf-8')
s=s.replace("import { random, hash }", "import { createLandscape } from './landscape.js';\nimport { random, hash }")
s=s.replace('[150,150,150,255, 192,192,192,255, 226,226,226,255, 255,255,255,255]','[65,87,78,255, 128,156,135,255, 207,221,182,255, 255,255,244,255]')
s=s.replace("new THREE.Color('#b6df85'), high = new THREE.Color('#88c96b')","new THREE.Color('#89b35b'), high = new THREE.Color('#5e9e51')")
s=s.replace("const landMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap });","const landMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness:1 });")
a=s.index('  landMat.onBeforeCompile =');b=s.index('\n  const land =',a)
s=s[:a]+'''  landMat.onBeforeCompile = shader => {
    shader.uniforms.uSnow=snowUniform;
    shader.vertexShader='varying vec3 vGround;\\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\\nvGround=position;');
    shader.fragmentShader='uniform float uSnow;varying vec3 vGround;\\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float patch=.5+.25*sin(vGround.x*14.+sin(vGround.z*11.))*cos(vGround.y*17.)+.14*sin(vGround.z*42.+vGround.x*24.);
      float grain=sin(vGround.x*260.+vGround.z*170.)*sin(vGround.y*210.-vGround.z*130.);
      diffuseColor.rgb*=.86+patch*.32+grain*.035;
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.82,.86,.79),uSnow*.65);
    `);
  };
  landMat.customProgramCacheKey=()=> 'meadow-ground-v5';''' + s[b:]
a=s.index('  function tree(');b=s.index('  const houseSites',a)
s=s[:a]+'''  function tree(normal,size,pink=false){
    const root=anchor(normal),g=new THREE.Group();root.add(g);g.scale.setScalar(size);stats.trees++;
    const birch=stats.trees%3!==0;
    stem(g,[0,0,0],[.028,.64,.015],.029,birch?'#eee3c5':'#806950');
    if(birch)for(let j=0;j<7;j++)mesh(g,box,'#797969',[(j%2?.016:-.008),.07+j*.077,.026],[.026,.01,.009]);
    const crown=new THREE.Group();g.add(crown);crown.position.y=.44;
    const palette=pink?['#c68e94','#e7b4aa','#f2c9b2']:['#23674e','#327c50','#559454','#77ac59','#a3bf69'];
    const transforms=[],shades=[],d=new THREE.Object3D();
    for(let l=0;l<14;l++){
      const a=l*2.399,r=l<10?.20:.095,cy=l<10?.06+(l%3)*.06:.28;
      const cx=Math.sin(a)*r,cz=Math.cos(a)*r;
      if(l<6)stem(g,[0,.27,0],[cx,.44+cy,cz],.012,birch?'#c3b596':'#806950');
      for(let j=0;j<17;j++){
        const t=rng()*6.283,y=rng()*2-1,rr=Math.sqrt(1-y*y);
        d.position.set(cx+Math.sin(t)*rr*.135,cy+y*.10,cz+Math.cos(t)*rr*.135);
        d.rotation.set(rng()*.4,rng()*6.28,rng()*.5);d.scale.set(.047+rng()*.026,.027+rng()*.018,.054+rng()*.025);d.updateMatrix();transforms.push(d.matrix.clone());
        shades.push(new THREE.Color(palette[Math.min(palette.length-1,Math.floor((y+1)*.8+rng()*2+(l>=10?1:0)))]));
      }
    }
    const leaves=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshStandardMaterial({color:'white',roughness:.85}),transforms.length);
    transforms.forEach((mat,i)=>{leaves.setMatrixAt(i,mat);leaves.setColorAt(i,shades[i]);});leaves.castShadow=true;leaves.receiveShadow=true;leaves.frustumCulled=false;crown.add(leaves);
    const cap=mesh(crown,sphere,'#eff1e4',[0,.37,0],[.18,.04,.17],false);cap.visible=false;snowCaps.push(cap);
    foliage.push({g:crown,phase:rng()*6,amount:.026});return root;
  }
''' + s[b:]
s=s.replace('made < 39','made < 72').replace('made % 6 === 0','made % 19 === 0')
s=s.replace("[[.2, -.28], [.04, -.4], [.22, 1.12], [.48, -.3], [.83, .05]]", "[[.18,-.29],[.04,-.4],[.12,-.17],[.22,1.12],[.57,-.3],[.83,.05],[.72,.27],[.65,.82],[.05,.0],[.69,-.52]]")
s=s.replace('i === 3','i === 9')
s=s.replace('for (let i = 0; i < 150; i++)','for (let i = 0; i < 0; i++)')
s=s.replace('  function house(site, index) {', '''  const landscape=createLandscape(planet,terrainHeight,R,houseSites,natureUniforms);
  stats.flowers+=landscape.counts.flowers;stats.shrubs+=landscape.counts.shrubs;

  function house(site, index) {''')
s=s.replace('c.g.visible=i<3+Math.round(env.cloud*8)','c.g.visible=!planet.userData.closeView&&i<3+Math.round(env.cloud*8)')
s=s.replace('return {planet,land,ocean,boat,surf,meadow,','return {planet,land,ocean,boat,surf,meadow,landscape,')
s=s.replace('dispose(){meadow.dispose();','dispose(){meadow.dispose();landscape.dispose();')
p.write_text(s,encoding='utf-8')
p=Path('work/planet-v2/nature.js');s=p.read_text(encoding='utf-8')
s=s.replace('width=.12*Math.pow','width=.18*Math.pow').replace('>.026','>.046')
s=s.replace("new THREE.Color('#559c63'),sunShade=new THREE.Color('#9edb7d')","new THREE.Color('#488346'),sunShade=new THREE.Color('#a4c66a')")
s=s.replace('attempt<12000&&clusters<3300','attempt<26000&&clusters<11200')
s=s.replace("(rng()-.5)*.024","(rng()-.5)*.072")
s=s.replace('const h=.072+rng()*.095+(attempt%11===0?.035:0);','const patch=.5+.5*Math.sin(bladeN.x*14+Math.sin(bladeN.z*11))*Math.cos(bladeN.y*17);const h=.046+rng()*.07+patch*.055+(attempt%9===0?.06:0);')
s=s.replace('lerp(sunShade,rng()*.9)','lerp(sunShade,patch*.64+rng()*.3)')
s=s.replace('vec3(.48,.65,.45),vec3(1.18,1.09,.88)','vec3(.58,.71,.49),vec3(1.13,1.10,.86)')
p.write_text(s,encoding='utf-8')
