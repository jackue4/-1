const fs=require('fs'),p='work/planet-v2/';let s=fs.readFileSync(p+'world.js','utf8');
s="import {createOrganicCluster,createClusterLayout,createPaintedTrunk,createTreeCrownMaterial} from './tree-asset.js';\n"+s;
s=s.replace('const crownMatrices=[],crownColors=[];',"const crownMatrices=[],crownColors=[],treeTrunkGeo=createPaintedTrunk();\n  const barkMaterials=[new THREE.MeshToonMaterial({color:'#c3b18d',vertexColors:true,gradientMap:vegetationRamp}),new THREE.MeshToonMaterial({color:'#a28b67',vertexColors:true,gradientMap:vegetationRamp})];");
const start=s.indexOf('    const birch=stats.trees%3!==0;'),end=s.indexOf('    const cap=mesh(g,sphere',start);
s=s.slice(0,start)+`    mesh(g,treeTrunkGeo,barkMaterials[stats.trees%3?0:1]);
    root.updateMatrix();g.updateMatrix();const base=new THREE.Matrix4().multiplyMatrices(root.matrix,g.matrix);
    for(const cluster of createClusterLayout(730+stats.trees*137,pink)){crownMatrices.push(new THREE.Matrix4().multiplyMatrices(base,cluster.matrix));crownColors.push(cluster.color);}
    // Preserve the landscape random sequence while the asset uses its own seed.
    for(let j=0;j<7;j++)rng();
`+s.slice(end);
const a=s.indexOf("  const crownMaterial=new THREE.MeshToonMaterial"),b=s.indexOf('  const canopy=new THREE.InstancedMesh',a);
s=s.slice(0,a)+`  const crownAsset=createTreeCrownMaterial(vegetationRamp,natureUniforms),crownMaterial=crownAsset.material,crownDepth=crownAsset.depth;
  const crownGeo=createOrganicCluster();
`+s.slice(b);
s=s.replace('dispose(){farm.dispose();','dispose(){crownAsset.texture.dispose();farm.dispose();');fs.writeFileSync(p+'world.js',s);
s=fs.readFileSync(p+'vegetation.js','utf8');s="import {TREE_SPRAYS_PER_CLUSTER,createTreeLeafGeometry,createTreeLeafMaterial,populateTreeLeaves} from './tree-asset.js';\n"+s;
const k=s.indexOf('export function createCanopyLeaves(');
s=s.slice(0,k)+`export function createCanopyLeaves(planet,canopy,uniforms,gradientMap){
  const asset=createTreeLeafMaterial(gradientMap,uniforms),leaves=new THREE.InstancedMesh(createTreeLeafGeometry(),asset.material,canopy.count*TREE_SPRAYS_PER_CLUSTER);
  populateTreeLeaves(leaves,canopy);leaves.name='Soft canopy leaf sprays';leaves.castShadow=true;leaves.receiveShadow=true;leaves.customDepthMaterial=asset.depth;leaves.frustumCulled=false;planet.add(leaves);
  return{leaves,perClump:TREE_SPRAYS_PER_CLUSTER,dispose(){asset.depth.dispose();asset.texture.dispose();}};
}
`;fs.writeFileSync(p+'vegetation.js',s);
s=fs.readFileSync(p+'test.js','utf8').replace('world.canopy.count*15','world.canopy.count*world.canopyDetail.perClump').replace('Math.floor(i/15)','Math.floor(i/world.canopyDetail.perClump)');fs.writeFileSync(p+'test.js',s);
s=fs.readFileSync(p+'test-shaders.mjs','utf8').replace("['canopy',world.canopy.material,'toon',instanced]","['canopy',world.canopy.material,'toon',instanced+'#define USE_COLOR\\n#define USE_MAP\\n#define MAP_UV uv\\n']");
s=s.replace("['canopy-leaves',world.canopyDetail.leaves.material,'toon',instanced+'#define DOUBLE_SIDED\\n']","['canopy-leaves',world.canopyDetail.leaves.material,'toon',instanced+'#define DOUBLE_SIDED\\n#define USE_MAP\\n#define MAP_UV uv\\n#define USE_ALPHATEST\\n']");
s=s.replace("['canopy-leaves-depth',world.canopyDetail.leaves.customDepthMaterial,'depth','#define USE_INSTANCING\\n#define DOUBLE_SIDED\\n#define DEPTH_PACKING 3201\\n']","['canopy-leaves-depth',world.canopyDetail.leaves.customDepthMaterial,'depth','#define USE_INSTANCING\\n#define DOUBLE_SIDED\\n#define DEPTH_PACKING 3201\\n#define USE_MAP\\n#define MAP_UV uv\\n#define USE_ALPHATEST\\n']");fs.writeFileSync(p+'test-shaders.mjs',s);
