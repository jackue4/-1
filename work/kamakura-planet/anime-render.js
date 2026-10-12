import * as THREE from 'three';

// One scene pass and one light screen pass: outline geometry discontinuities,
// retaining transparent water, flat painted colors, and the DOM sky backdrop.
export function createAnimeRenderer(renderer,camera,{samples=4}={}){
 const target=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,depthBuffer:true});
 target.depthTexture=new THREE.DepthTexture(1,1,THREE.UnsignedIntType);target.texture.colorSpace=THREE.LinearSRGBColorSpace;target.samples=renderer.capabilities.isWebGL2?samples:0;
 const uniforms={tColor:{value:target.texture},tDepth:{value:target.depthTexture},uPixel:{value:new THREE.Vector2(1,1)},uNear:{value:camera.near},uFar:{value:camera.far},uNight:{value:0},uStrength:{value:.70}};
 const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthTest:false,depthWrite:false,
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:`uniform sampler2D tColor;uniform sampler2D tDepth;uniform vec2 uPixel;uniform float uNear;uniform float uFar;uniform float uNight;uniform float uStrength;varying vec2 vUv;
  float linearDepth(vec2 uv){float z=texture2D(tDepth,uv).r*2.-1.;return 2.*uNear*uFar/(uFar+uNear-z*(uFar-uNear));}
  void main(){vec4 base=texture2D(tColor,vUv);vec2 x=vec2(uPixel.x,0.),y=vec2(0.,uPixel.y);float d=linearDepth(vUv),a=linearDepth(vUv-x),b=linearDepth(vUv+x),c=linearDepth(vUv-y),e=linearDepth(vUv+y);
   float bend=max(abs(a+b-2.*d),abs(c+e-2.*d))/max(d,.25);float edge=smoothstep(.007,.035,bend);
   vec4 left=texture2D(tColor,vUv-x),right=texture2D(tColor,vUv+x),down=texture2D(tColor,vUv-y),up=texture2D(tColor,vUv+y);
   float boundary=max(max(abs(base.a-left.a),abs(base.a-right.a)),max(abs(base.a-down.a),abs(base.a-up.a)));
   float crease=length(left.rgb+right.rgb+down.rgb+up.rgb-base.rgb*4.);float fine=smoothstep(.36,.9,crease)*.22;
   float ink=max(edge, max(boundary*.55,fine))*uStrength;ink*=smoothstep(.02,.40,base.a);
   vec3 outline=mix(vec3(.030,.083,.060),vec3(.026,.045,.065),uNight);vec3 color=mix(base.rgb,outline,ink*.73);
   gl_FragColor=vec4(color,base.a);
   #include <tonemapping_fragment>
   #include <colorspace_fragment>
  }`});
 const scene=new THREE.Scene(),quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material),ortho=new THREE.Camera(),size=new THREE.Vector2();quad.frustumCulled=false;scene.add(quad);let w=0,h=0;const lastInfo={calls:0,triangles:0,width:0,height:0,samples:target.samples};
 return{render(world,cam,env){renderer.getDrawingBufferSize(size);if(size.x!==w||size.y!==h){w=size.x;h=size.y;target.setSize(w,h);uniforms.uPixel.value.set(1.15/w,1.15/h);}uniforms.uNight.value=env.night;uniforms.uNear.value=cam.near;uniforms.uFar.value=cam.far;renderer.setRenderTarget(target);renderer.render(world,cam);lastInfo.calls=renderer.info.render.calls;lastInfo.triangles=renderer.info.render.triangles;lastInfo.width=w;lastInfo.height=h;renderer.setRenderTarget(null);renderer.render(scene,ortho);},getInfo:()=>({...lastInfo}),dispose(){target.dispose();material.dispose();quad.geometry.dispose();}};
}
