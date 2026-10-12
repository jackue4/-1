// Software SVG projection: verifies placement and silhouettes, not WebGL shading.
import * as THREE from 'three';
import {SVGRenderer} from 'three/examples/jsm/renderers/SVGRenderer.js';
import {parseHTML} from 'linkedom';
import {Resvg} from '@resvg/resvg-js';
import fs from 'node:fs';
import {createWorld,direction} from './world.js';
const {document}=parseHTML('<html><body></body></html>');globalThis.document=document;
const world=createWorld(3);world.update(1/60,14,{rain:0,snow:0,cloud:.2,wind:.35,night:0,mist:0});world.planet.quaternion.setFromUnitVectors(direction(-.18,.69),new THREE.Vector3(0,1,0));world.planet.userData.closeView=true;world.update(1/60,14,{rain:0,snow:0,cloud:.2,wind:.35,night:0,mist:0});
for(let i=0;i<180;i++)world.update(1/30,14+i/30,{rain:0,snow:0,cloud:.2,wind:.35,night:0,mist:0});
const scene=new THREE.Scene();scene.background=new THREE.Color('#d9f1f8');scene.add(world.planet);
scene.add(new THREE.AmbientLight('#dae5e7',1));const sun=new THREE.DirectionalLight('#fff9e5',.55);sun.position.set(-3.5,6,7);scene.add(sun);
world.waterMat.opacity=.38;const replacements=new Map();world.planet.traverse(o=>{if(o.material?.isMeshToonMaterial||o.material?.isMeshStandardMaterial){const original=o.material;if(!replacements.has(original))replacements.set(original,new THREE.MeshLambertMaterial({color:original.color,vertexColors:original.vertexColors,side:original.side,transparent:original.transparent,opacity:original.opacity}));o.material=replacements.get(original);}});
const expansions=[];world.planet.traverse(o=>{if(o.material?.isShaderMaterial)o.visible=false;if(o.isInstancedMesh)expansions.push(o);});
for(const im of expansions){for(let i=0;i<im.count;i+=im.name==='Wind meadow'?12:im.count>2000?4:1){const color=new THREE.Color();if(im.instanceColor)im.getColorAt(i,color);const material=im.material.clone();material.color.multiply(color);const mesh=new THREE.Mesh(im.geometry,material),mat=new THREE.Matrix4();im.getMatrixAt(i,mat);mat.decompose(mesh.position,mesh.quaternion,mesh.scale);im.parent.add(mesh);}im.removeFromParent();}
const camera=new THREE.PerspectiveCamera(38,1000/740,.1,60);camera.position.set(.7,5.5,1.6);camera.lookAt(0,2.43,0);
const renderer=new SVGRenderer();renderer.setSize(1000,740);renderer.setPrecision(2);renderer.render(scene,camera);
renderer.domElement.setAttribute('xmlns','http://www.w3.org/2000/svg');const svg=renderer.domElement.outerHTML;fs.writeFileSync('work/planet-v2/composition-coast.svg',svg);fs.writeFileSync('work/planet-v2/composition-coast.png',new Resvg(svg,{background:'#d9f1f8'}).render().asPng());console.log('Saved software composition check (WebGL materials and shadows are not represented).');



