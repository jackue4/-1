/** State-oriented renderer boundary: it deliberately never compiles or draws. */
export function createRendererMock(THREE,{domElement={},onRender=()=>{},onDispose=()=>{}}={}){
 const state={target:{name:'original-target'},viewport:new THREE.Vector4(7,11,640,480),scissor:new THREE.Vector4(13,17,600,430),scissorTest:true,color:new THREE.Color('#274b6c'),alpha:.63};
 const setVector=(target,args)=>args[0]?.isVector4?target.copy(args[0]):target.set(...args);
 return{domElement,state,shadowMap:{enabled:true,autoUpdate:true,needsUpdate:true},xr:{enabled:true},clippingPlanes:[],autoClear:false,
  setPixelRatio(value){this.pixelRatio=value;},setSize(width,height){this.width=width;this.height=height;},
  getRenderTarget(){return state.target;},setRenderTarget(value){state.target=value;},
  getViewport(out){return out.copy(state.viewport);},setViewport(...args){setVector(state.viewport,args);},
  getScissor(out){return out.copy(state.scissor);},setScissor(...args){setVector(state.scissor,args);},
  getScissorTest(){return state.scissorTest;},setScissorTest(value){state.scissorTest=value;},
  getClearColor(out){return out.copy(state.color);},getClearAlpha(){return state.alpha;},setClearColor(value,alpha=1){state.color.set(value);state.alpha=alpha;},
  clear(){},render(scene,camera){onRender(scene,camera,this);},dispose(){onDispose();}
 };
}

export function snapshotRenderer(renderer,scene){
 return{target:renderer.getRenderTarget(),clipping:renderer.clippingPlanes,autoClear:renderer.autoClear,background:scene.background,
  viewport:renderer.state.viewport.toArray(),scissor:renderer.state.scissor.toArray(),scissorTest:renderer.getScissorTest(),
  color:renderer.state.color.toArray(),alpha:renderer.getClearAlpha(),xr:renderer.xr.enabled,
  shadowAuto:renderer.shadowMap.autoUpdate,shadowNeeds:renderer.shadowMap.needsUpdate,
  visibility:scene.children.flatMap(root=>{const values=[];root.traverse(o=>values.push([o.uuid,o.visible]));return values;})};
}
