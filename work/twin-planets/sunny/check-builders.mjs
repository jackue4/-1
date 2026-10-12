var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// work/planet-v2/villagers.js
import * as THREE from "three";
function createVillager(i, { mesh, sphere, cyl, cone, box, stem }) {
  const identity = VILLAGERS[i], body = new THREE.Group(), head = new THREE.Group(), tail = new THREE.Group();
  mesh(body, sphere, identity.shirt, [0, 0.19, 0], [0.083, 0.102, 0.065]);
  mesh(body, box, "#f2e7c7", [0, 0.177, 0.062], [0.09, 0.095, 9e-3]);
  mesh(body, box, "#b9b28a", [0, 0.166, 0.071], [0.052, 0.032, 6e-3]);
  for (const x of [-0.033, 0.033]) mesh(body, sphere, "#fff0bd", [x, 0.22, 0.062], [6e-3, 6e-3, 4e-3]);
  head.position.y = 0.325;
  body.add(head);
  mesh(head, sphere, identity.fur, [0, 0, 0], [0.105, 0.091, 0.087]);
  if (i === 4) for (const x of [-0.041, 0.041]) mesh(head, sphere, "#666e68", [x, 8e-3, 0.071], [0.034, 0.026, 0.015]);
  mesh(head, sphere, "#fff0d6", [0, -0.031, 0.072], [i === 2 ? 0.058 : 0.047, 0.029, 0.029]);
  for (const x of [-0.036, 0.036]) {
    mesh(head, sphere, "#3f4b45", [x, 6e-3, 0.077], [0.012, 0.016, 9e-3]);
    mesh(head, sphere, "#fffdf3", [x - 3e-3, 0.012, 0.085], [35e-4, 4e-3, 2e-3], false);
    mesh(head, sphere, "#edb4a0", [x * 1.62, -0.024, 0.068], [0.016, 0.01, 7e-3], false);
  }
  mesh(head, sphere, i === 0 ? "#d3a2a1" : "#5c6051", [0, -0.024, 0.098], [0.01, 7e-3, 7e-3]);
  for (const side of [-1, 1]) {
    if (i === 0) {
      const ear = mesh(head, sphere, identity.fur, [side * 0.052, 0.105, -9e-3], [0.027, 0.084, 0.025]);
      ear.rotation.z = side * -0.15;
      mesh(head, sphere, "#ddb6b0", [side * 0.055, 0.119, 0.012], [0.013, 0.049, 4e-3]);
    } else if (i === 2 || i === 3) {
      mesh(head, cone, identity.fur, [side * 0.068, 0.083, -5e-3], [0.042, 0.086, 0.037]);
      mesh(head, cone, "#e6b9a3", [side * 0.068, 0.09, 0.017], [0.022, 0.047, 0.01]);
    } else {
      mesh(head, sphere, identity.fur, [side * 0.091, 0.058, -8e-3], [0.033, i === 5 ? 0.025 : 0.036, 0.025]);
      mesh(head, sphere, "#e4c3a5", [side * 0.094, 0.058, 0.014], [0.018, 0.02, 6e-3]);
    }
    if (i === 5) {
      stem(head, [side * 0.045, 0.067, -0.02], [side * 0.05, 0.145, -0.03], 7e-3, "#a18d6f");
      stem(head, [side * 0.049, 0.11, -0.025], [side * 0.076, 0.137, -0.018], 6e-3, "#a18d6f");
    }
  }
  tail.position.set(0, 0.155, -0.07);
  body.add(tail);
  if (i === 0 || i === 1) mesh(tail, sphere, identity.fur, [0, 0, -0.025], [0.035, 0.035, 0.035]);
  else if (i === 2) {
    mesh(tail, sphere, identity.fur, [0.028, 0.012, -0.05], [0.05, 0.055, 0.095]);
    mesh(tail, sphere, "#f9ebd3", [0.025, 0.017, -0.119], [0.035, 0.038, 0.04]);
  } else {
    mesh(tail, sphere, identity.fur, [0.02, -5e-3, -0.052], [0.026, 0.025, 0.095]);
    if (i === 4) for (let j = 0; j < 3; j++) mesh(tail, sphere, "#6c786c", [0.02, -5e-3, -0.023 - j * 0.043], [0.028, 0.027, 0.012]);
  }
  const limbs = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.037, 0.118, 0);
    body.add(leg);
    mesh(leg, cyl, "#7b8c7b", [0, -0.037, 0], [0.022, 0.074, 0.022]);
    mesh(leg, sphere, "#eddfbe", [0, -0.078, 0.018], [0.03, 0.024, 0.043]);
    limbs.push(leg);
    const arm = new THREE.Group();
    arm.position.set(side * 0.079, 0.235, 0);
    body.add(arm);
    mesh(arm, cyl, identity.shirt, [0, -0.04, 0], [0.024, 0.084, 0.025]);
    mesh(arm, sphere, identity.fur, [0, -0.088, 0], [0.028, 0.029, 0.025]);
    limbs.push(arm);
  }
  const carry = new THREE.Group();
  carry.position.set(0, 0.175, 0.12);
  body.add(carry);
  for (let j = 0; j < 3; j++) mesh(carry, box, j % 2 ? "#d2b887" : "#bd9d6b", [0, j * 0.025, 0], [0.23, 0.022, 0.066]);
  carry.visible = false;
  const hammer = new THREE.Group();
  limbs[3].add(hammer);
  mesh(hammer, cyl, "#b8a278", [0, -0.12, 0.015], [9e-3, 0.1, 9e-3]);
  mesh(hammer, box, "#8da7a0", [0, -0.174, 0.015], [0.078, 0.034, 0.038]);
  hammer.visible = false;
  const umbrella = new THREE.Group();
  umbrella.position.set(0.105, 0, 0);
  body.add(umbrella);
  mesh(umbrella, cyl, "#c5b791", [0, 0.4, 0], [7e-3, 0.42, 7e-3]);
  mesh(umbrella, new THREE.SphereGeometry(0.205, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), i % 2 ? "#b1c6b5" : "#d8b2a4", [0, 0.61, 0], [1, 0.4, 1]);
  umbrella.visible = false;
  return { ...identity, body, head, tail, limbs, carry, hammer, umbrella };
}
var VILLAGERS;
var init_villagers = __esm({
  "work/planet-v2/villagers.js"() {
    VILLAGERS = [
      { name: "\u68C9\u68C9", species: "\u5154\u5154", fur: "#eee4cd", shirt: "#8bbdb2", job: "\u56ED\u827A\u5E08" },
      { name: "\u9EA6\u9EA6", species: "\u5C0F\u718A", fur: "#bb9167", shirt: "#e2b66a", job: "\u6728\u5320" },
      { name: "\u963F\u6817", species: "\u72D0\u72F8", fur: "#d99b66", shirt: "#8baac0", job: "\u642C\u8FD0\u5458" },
      { name: "\u6843\u6843", species: "\u732B\u54AA", fur: "#b9beb4", shirt: "#d5a0a6", job: "\u82B1\u827A\u5E08" },
      { name: "\u56E2\u56E2", species: "\u6D63\u718A", fur: "#a6a395", shirt: "#a2b580", job: "\u5EFA\u7B51\u5E08" },
      { name: "\u5C0F\u679D", species: "\u5C0F\u9E7F", fur: "#c8a27b", shirt: "#b5a8c6", job: "\u6CB9\u6F06\u5320" }
    ];
  }
});

// work/planet-v2/construction.js
function constructionAt(seconds) {
  const elapsed = Math.max(0, Math.min(BUILD_DURATION, Number(seconds) || 0));
  const index = PROJECTS.findIndex((p) => elapsed < p.start + p.duration), complete = index < 0;
  const project = PROJECTS[complete ? PROJECTS.length - 1 : index];
  const progress = complete ? 1 : (elapsed - project.start) / project.duration;
  const phase = progress < 0.18 ? "\u6574\u7406\u5730\u57FA" : progress < 0.42 ? "\u642D\u8D77\u6728\u67B6" : progress < 0.72 ? "\u88C5\u597D\u5899\u9762" : progress < 0.94 ? "\u76D6\u4E0A\u5C4B\u9876" : "\u6536\u62FE\u82B1\u56ED";
  return { elapsed, index: complete ? PROJECTS.length : index, project, progress, complete, phase: complete ? "\u5C0F\u5C9B\u5EFA\u597D\u5566" : project.id === "path" ? "\u94FA\u8DEF\u4E0E\u7ACB\u8DEF\u6807" : project.id === "dock" ? "\u94FA\u6728\u677F\u3001\u6253\u6728\u6869" : phase, total: elapsed / BUILD_DURATION };
}
function projectProgress(id, elapsed) {
  const p = PROJECTS.find((p2) => p2.id === id);
  return p ? Math.max(0, Math.min(1, (elapsed - p.start) / p.duration)) : 1;
}
var PROJECTS, cursor, BUILD_DURATION;
var init_construction = __esm({
  "work/planet-v2/construction.js"() {
    PROJECTS = [
      { id: "path", name: "\u94FA\u4E00\u6761\u901A\u5F80\u5BB6\u7684\u5C0F\u8DEF", duration: 22 },
      { id: "house0", name: "\u5154\u5154\u7684\u7B2C\u4E00\u95F4\u5C0F\u5C4B", duration: 54 },
      { id: "mill", name: "\u4F1A\u8F6C\u52A8\u7684\u98CE\u8F66\u5DE5\u574A", duration: 60 },
      { id: "house1", name: "\u5C0F\u718A\u7684\u9762\u5305\u5C4B", duration: 40 },
      { id: "dock", name: "\u6D77\u8FB9\u7684\u6728\u5934\u7801\u5934", duration: 36 },
      { id: "house2", name: "\u72D0\u72F8\u7684\u90AE\u5DEE\u5C0F\u5C4B", duration: 40 },
      { id: "house3", name: "\u732B\u54AA\u7684\u82B1\u5E97", duration: 40 },
      { id: "house4", name: "\u5927\u5BB6\u7684\u665A\u5B89\u5C0F\u5C4B", duration: 40 }
    ];
    cursor = 0;
    for (const project of PROJECTS) {
      project.start = cursor;
      cursor += project.duration;
    }
    BUILD_DURATION = cursor;
  }
});

// work/planet-v2/build-scene.js
import * as THREE2 from "three";
function createBuildScene({ planet, targets, landscape, mesh, box, cyl, anchor, direction: direction2, height, R: R2 }) {
  const up = new THREE2.Vector3(0, 1, 0), dynamicRoots = [], structures = [];
  for (const target of Object.values(targets)) {
    if (target.kind === "path") continue;
    dynamicRoots.push(target.root || target.object);
    const groups = Array.from({ length: 3 }, () => new THREE2.Group()), frame = new THREE2.Group();
    for (const o of [...target.object.children]) {
      let y = o.position.y;
      if (o.geometry) {
        o.geometry.computeBoundingBox();
        y += (o.geometry.boundingBox.min.y + o.geometry.boundingBox.max.y) * 0.5 * o.scale.y;
      }
      groups[target.kind === "dock" ? Math.min(2, Math.floor(groups.reduce((n, g) => n + g.children.length, 0) / 3)) : y < 0.075 ? 0 : y < 0.4 ? 1 : 2].add(o);
    }
    groups.forEach((g) => target.object.add(g));
    target.object.add(frame);
    if (target.kind !== "dock") {
      const w = target.kind === "mill" ? 0.18 : 0.22, d = 0.18, h = target.kind === "mill" ? 0.62 : 0.41;
      for (const x of [-w, w]) for (const z of [-d, d]) mesh(frame, cyl, "#c9b287", [x, h / 2, z], [0.011, h, 0.011]);
      for (const z of [-d, d]) mesh(frame, box, "#d9c69d", [0, h, z], [w * 2, 0.02, 0.019]);
      for (const x of [-w, w]) mesh(frame, box, "#c6ab82", [x, h, 0], [0.019, 0.02, d * 2]);
    }
    structures.push({ ...target, groups, frame });
  }
  const site = anchor(direction2(0.29, 0.08)), supplies = new THREE2.Group(), dustRoot = new THREE2.Group();
  planet.add(supplies);
  site.add(dustRoot);
  dynamicRoots.push(site, supplies, landscape.path);
  for (let j = 0; j < 5; j++) mesh(supplies, box, j % 2 ? "#d7c092" : "#bfa277", [0, 0.02 + j * 0.027, 0], [0.27, 0.024, 0.085]);
  mesh(supplies, box, "#91aaa0", [0.17, 0.054, 0.03], [0.105, 0.105, 0.1]);
  const dustPositions = new Float32Array(18 * 3), dustGeometry = new THREE2.BufferGeometry();
  dustGeometry.setAttribute("position", new THREE2.BufferAttribute(dustPositions, 3));
  const dust = new THREE2.Points(dustGeometry, new THREE2.PointsMaterial({ color: "#ffe8bd", size: 0.018, transparent: true, opacity: 0.55, depthWrite: false }));
  dustRoot.add(dust);
  const fenceMeshes = landscape.meshes.filter((m) => m.name.startsWith("fence ")).map((mesh2) => ({ mesh: mesh2, count: mesh2.count }));
  let state = constructionAt(BUILD_DURATION);
  function safeNormal(n, center) {
    for (let j = 0; j < 10 && height(n) < R2 + 0.055; j++) n.lerp(center, 0.4).normalize();
    return n;
  }
  function supplyNormal(target) {
    const n = target.normal, lat = Math.asin(n.y), lon = Math.atan2(n.x, n.z);
    return safeNormal(direction2(lat - 0.16, lon - 0.17), n);
  }
  function setProgress(elapsed) {
    state = constructionAt(elapsed);
    const road = projectProgress("path", state.elapsed);
    landscape.path.geometry.setDrawRange(0, Math.floor(landscape.path.geometry.index.count * road / 6) * 6);
    fenceMeshes.forEach((f) => f.mesh.count = Math.floor(f.count * road));
    for (const s of structures) {
      const p = projectProgress(s.id, state.elapsed);
      s.object.visible = p > 0;
      const spans = s.kind === "dock" ? [[0, 0.3], [0.3, 0.65], [0.65, 1]] : [[0, 0.18], [0.42, 0.72], [0.72, 0.96]];
      s.groups.forEach((g, i) => {
        const f = THREE2.MathUtils.smoothstep(p, ...spans[i]);
        g.visible = f > 0;
        g.scale.y = Math.max(1e-3, f);
      });
      s.frame.visible = p >= 0.18 && p < 0.72;
    }
    const current = targets[state.project.id];
    site.visible = supplies.visible = !state.complete;
    if (current) {
      site.position.copy(current.normal).multiplyScalar(height(current.normal));
      site.quaternion.setFromUnitVectors(up, current.normal);
      const n = supplyNormal(current);
      supplies.position.copy(n).multiplyScalar(height(n));
      supplies.quaternion.setFromUnitVectors(up, n);
    }
    return state;
  }
  function workerPose(i, paused) {
    if (state.complete) return null;
    const target = targets[state.project.id], n = target.normal, lat = Math.asin(n.y), lon = Math.atan2(n.x, n.z), a = i * 2.399;
    const work = safeNormal(direction2(lat + Math.sin(a) * 0.125, lon + Math.cos(a) * 0.125), n), base = supplyNormal(target);
    const supply = safeNormal(direction2(Math.asin(base.y) + Math.sin(a) * 0.07, Math.atan2(base.x, base.z) + Math.cos(a) * 0.07), n);
    const phase = (state.elapsed - state.project.start + i * 1.7) % 11 / 11;
    let mode = paused ? "rest" : phase < 0.35 ? "carry" : phase < 0.78 ? "build" : "walk";
    const f = paused ? 0 : phase < 0.35 ? phase / 0.35 : phase < 0.78 ? 1 : 1 - (phase - 0.78) / 0.22;
    const destination = supply.clone().lerp(work, f).normalize();
    return { normal: safeNormal(destination, n), mode, lookAt: n };
  }
  function update(t, paused) {
    dust.visible = !state.complete && !paused;
    for (let i = 0; i < 18; i++) {
      const f = (t * 0.7 + i / 18) % 1, a = i * 2.399;
      dustPositions.set([Math.sin(a) * (0.12 + f * 0.2), 0.025 + f * 0.24, Math.cos(a) * (0.12 + f * 0.2)], i * 3);
    }
    dustGeometry.attributes.position.needsUpdate = true;
  }
  setProgress(BUILD_DURATION);
  return { dynamicRoots, structures, supplies, site, targets, setProgress, workerPose, update, getState: () => state, getFocus: () => targets[state.project.id].normal.clone(), dispose() {
    dustGeometry.dispose();
    dust.material.dispose();
  } };
}
var init_build_scene = __esm({
  "work/planet-v2/build-scene.js"() {
    init_construction();
  }
});

// work/planet-v2/ecology.js
function hash(text) {
  let h = 2166136261;
  for (const c of text) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function random(seed) {
  let a = seed >>> 0;
  return () => {
    a += 1831565813;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var init_ecology = __esm({
  "work/planet-v2/ecology.js"() {
    init_construction();
  }
});

// work/planet-v2/nature.js
import * as THREE3 from "three";
function windAt(p, time, strength) {
  return (0.56 + 0.24 * Math.sin(p.x * 1.6 + p.y * 0.8 + p.z * 1.15 - time * 0.85) + 0.14 * Math.sin(p.x * 3.1 - p.y * 1.2 + p.z * 2.8 - time * 1.7)) * strength;
}
function sampleWater(p, depth, time, strength) {
  let sum = 0;
  for (const [x, y, z, k, speed, a] of WAVES) sum += Math.sin((p.x * x + p.y * y + p.z * z) * k - time * speed) * a;
  return sum * THREE3.MathUtils.smoothstep(depth, 0, 0.08) * (0.6 + strength * 0.9);
}
function createNatureUniforms() {
  return { uNatureTime: { value: 0 }, uWind: { value: 0.6 }, uDaylight: { value: 1 }, uSnow: { value: 0 }, uActors: { value: Array.from({ length: 6 }, () => new THREE3.Vector3(100, 100, 100)) } };
}
function enhanceWater(material, uniforms) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = WATER_GLSL + "\nattribute float seaDepth;varying vec3 vOceanPos;varying float vDepth;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
      vDepth=seaDepth;vOceanPos=position;transformed+=normalize(position)*oceanHeight(position,seaDepth);
    `);
    shader.fragmentShader = "uniform float uNatureTime;uniform float uDaylight;varying vec3 vOceanPos;varying float vDepth;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
      float flow=sin(vOceanPos.x*18.+vOceanPos.z*13.-uNatureTime*.65+sin(vOceanPos.y*12.+uNatureTime*.3));
      float line=smoothstep(.88,.98,flow);
      float shallow=1.-smoothstep(.02,.20,vDepth);
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.62,.89,.84),line*(.13+shallow*.19));
      float edge=(1.-smoothstep(.008,.055,vDepth))*smoothstep(.25,.85,sin(vDepth*140.-uNatureTime*1.5));
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.92,.98,.87),edge*.62);
    `);
  };
  material.customProgramCacheKey = () => "painted-water-v6";
}
function enhanceFoliage(material, uniforms) {
  function deform(shader) {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = WIND_GLSL + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
      vec3 root=instanceMatrix[3].xyz;
      vec3 outward=normalize(root),wind=vec3(.8,.1,.45);wind-=outward*dot(wind,outward);
      vec3 delta=wind*windField(root)*.018;
      transformed+=vec3(dot(instanceMatrix[0].xyz,delta)/dot(instanceMatrix[0].xyz,instanceMatrix[0].xyz),dot(instanceMatrix[1].xyz,delta)/dot(instanceMatrix[1].xyz,instanceMatrix[1].xyz),dot(instanceMatrix[2].xyz,delta)/dot(instanceMatrix[2].xyz,instanceMatrix[2].xyz));
    `);
  }
  material.onBeforeCompile = (shader) => {
    deform(shader);
    shader.vertexShader = "varying vec3 vPaintPoint;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvPaintPoint=position;");
    shader.fragmentShader = "uniform float uSnow;varying vec3 vPaintPoint;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
      float brush=sin(vPaintPoint.x*5.+sin(vPaintPoint.z*4.))*cos(vPaintPoint.y*6.);
      diffuseColor.rgb*=.98+brush*.035;
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.9,.95,.85),uSnow*smoothstep(.3,.9,vPaintPoint.y)*.65);
    `);
  };
  material.customProgramCacheKey = () => "painted-foliage-v6";
  const depth = new THREE3.MeshDepthMaterial({ depthPacking: THREE3.RGBADepthPacking });
  depth.onBeforeCompile = deform;
  depth.customProgramCacheKey = () => "painted-foliage-depth-v6";
  return depth;
}
function enhanceFoam(material, uniforms) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = "varying vec2 vFoamUV;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvFoamUV=uv;");
    shader.fragmentShader = "uniform float uNatureTime;varying vec2 vFoamUV;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
      float edge=sin(clamp(vFoamUV.y,0.,1.)*3.14159265);
      float lace=.52+.25*sin(vFoamUV.x*91.+uNatureTime*.8)+.22*sin(vFoamUV.x*187.-uNatureTime*.5+vFoamUV.y*8.);
      diffuseColor.a*=pow(max(edge,0.),.6)*smoothstep(.06,.6,lace);
    `);
  };
  material.customProgramCacheKey = () => "bloom-foam-v4";
}
function createMeadow(planet, terrainHeight2, radius, houseSites, uniforms, gradientMap) {
  const rng = random(hash("bloom-meadow-v4")), up = new THREE3.Vector3(0, 1, 0), positions = [], uv = [], indices = [];
  for (let row = 0; row <= 3; row++) {
    const h = row / 3, width = 0.32 * Math.pow(1 - h, 0.85) + 1e-3;
    positions.push(-width, h, 0.16 * h * h, width, h, 0.16 * h * h);
    uv.push(0, h, 1, h);
    if (row < 3) {
      const a = row * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new THREE3.BufferGeometry();
  geometry.setAttribute("position", new THREE3.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE3.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const transforms = [], shades = [], roots = [], dummy = new THREE3.Object3D(), normal = new THREE3.Vector3();
  const houseNormals = houseSites.map((h) => new THREE3.Vector3(Math.cos(h.lat) * Math.sin(h.lon), Math.sin(h.lat), Math.cos(h.lat) * Math.cos(h.lon)));
  function valid(n) {
    const lat = Math.asin(n.y), lon = Math.atan2(n.x, n.z);
    return terrainHeight2(n) > radius + 0.111 && Math.abs(lat - (0.29 + 0.095 * Math.sin(lon * 3))) > 0.046 && !houseNormals.some((h) => n.distanceTo(h) < 0.115) && n.distanceTo(new THREE3.Vector3(0, 0.03, 1).normalize()) > 0.092;
  }
  const rootShade = new THREE3.Color("#79a854"), sunShade = new THREE3.Color("#b6ce74");
  for (let attempt = 0, clusters = 0; attempt < 12e3 && clusters < 3700; attempt++) {
    const y = rng() * 2 - 1, a = rng() * Math.PI * 2;
    normal.set(Math.sqrt(1 - y * y) * Math.sin(a), y, Math.sqrt(1 - y * y) * Math.cos(a));
    if (!valid(normal)) continue;
    clusters++;
    const x = new THREE3.Vector3().crossVectors(Math.abs(y) > 0.95 ? new THREE3.Vector3(1, 0, 0) : up, normal).normalize(), z = new THREE3.Vector3().crossVectors(normal, x);
    for (let j = 0; j < 5; j++) {
      const bladeN = normal.clone().addScaledVector(x, (rng() - 0.5) * 0.072).addScaledVector(z, (rng() - 0.5) * 0.072).normalize();
      if (!valid(bladeN)) continue;
      dummy.position.copy(bladeN).multiplyScalar(terrainHeight2(bladeN) - 2e-3);
      dummy.quaternion.setFromUnitVectors(up, bladeN);
      dummy.rotateY(rng() * 6.283);
      const patch = 0.5 + 0.5 * Math.sin(bladeN.x * 14 + Math.sin(bladeN.z * 11)) * Math.cos(bladeN.y * 17);
      const h = 0.046 + rng() * 0.07 + patch * 0.055 + (attempt % 9 === 0 ? 0.06 : 0);
      dummy.scale.set(h * (0.75 + rng() * 0.7), h, h);
      dummy.updateMatrix();
      transforms.push(dummy.matrix.clone());
      roots.push(dummy.position.clone());
      shades.push(rootShade.clone().lerp(sunShade, patch * 0.64 + rng() * 0.3));
    }
  }
  const material = new THREE3.MeshToonMaterial({ color: "#ffffff", gradientMap, side: THREE3.DoubleSide });
  const blades = new THREE3.InstancedMesh(geometry, material, transforms.length);
  blades.name = "Wind meadow";
  transforms.forEach((matrix, i) => {
    blades.setMatrixAt(i, matrix);
    blades.setColorAt(i, shades[i]);
  });
  blades.instanceMatrix.needsUpdate = true;
  blades.instanceColor.needsUpdate = true;
  blades.castShadow = false;
  blades.receiveShadow = true;
  blades.frustumCulled = false;
  planet.add(blades);
  function deform(shader) {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = GRASS_GLSL + "\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\ntransformed=grassBend(position);");
  }
  material.onBeforeCompile = (shader) => {
    deform(shader);
    shader.vertexShader = "varying float vBladeHeight;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvBladeHeight=position.y;");
    shader.fragmentShader = "uniform float uSnow;varying float vBladeHeight;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
    diffuseColor.rgb*=mix(vec3(.80,.87,.68),vec3(1.07,1.06,.92),smoothstep(0.,1.,vBladeHeight));
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.86,.93,.83),uSnow*smoothstep(.4,1.,vBladeHeight)*.85);
  `);
    shader.fragmentShader = shader.fragmentShader.replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance+=diffuseColor.rgb*.035*vBladeHeight;");
  };
  material.customProgramCacheKey = () => "bloom-grass-v4";
  const count = transforms.length;
  return { blades, roots, count, setLowQuality(low) {
    blades.count = low ? Math.floor(count * 0.42) : count;
    blades.castShadow = false;
  }, dispose() {
  } };
}
var WIND_GLSL, WAVES, WATER_GLSL, GRASS_GLSL;
var init_nature = __esm({
  "work/planet-v2/nature.js"() {
    init_ecology();
    WIND_GLSL = `
uniform float uNatureTime;
uniform float uWind;
float windField(vec3 p){
  return (.56+.24*sin(dot(p,vec3(1.6,.8,1.15))-uNatureTime*.85)
    +.14*sin(dot(p,vec3(3.1,-1.2,2.8))-uNatureTime*1.7))*uWind;
}
`;
    WAVES = [[1.7, 0.5, 1.2, 4.7, 1.15, 0.02], [-0.8, 1.3, 1.7, 8.2, 1.65, 0.01], [1.2, -0.7, 1.4, 14.3, 2.25, 45e-4]];
    WATER_GLSL = WIND_GLSL + `
float oceanHeight(vec3 p,float depth){
  float shore=smoothstep(0.,.08,depth);
  float swell=sin(dot(p,vec3(1.7,.5,1.2))*4.7-uNatureTime*1.15)*.020
    +sin(dot(p,vec3(-.8,1.3,1.7))*8.2-uNatureTime*1.65)*.010
    +sin(dot(p,vec3(1.2,-.7,1.4))*14.3-uNatureTime*2.25)*.0045;
  return swell*shore*(.6+uWind*.9);
}
`;
    GRASS_GLSL = WIND_GLSL + `
uniform vec3 uActors[6];
vec3 grassBend(vec3 p){
  vec3 root=instanceMatrix[3].xyz;
  vec3 outward=normalize(root);
  vec3 windDir=normalize(vec3(.8,.12,.5)-outward*dot(vec3(.8,.12,.5),outward)+vec3(.00001));
  vec3 localWind=vec3(dot(windDir,normalize(instanceMatrix[0].xyz)),0.,dot(windDir,normalize(instanceMatrix[2].xyz)));
  float bend=windField(root)*.57+.06*sin(dot(root,vec3(23.,7.,11.))+uNatureTime*4.)*uWind;
  float tip=p.y*p.y;
  vec3 push=vec3(0.);
  for(int i=0;i<6;i++){
    vec3 delta=root-uActors[i];float distanceTo=length(delta);
    vec3 away=delta/max(distanceTo,.01);float weight=1.-smoothstep(.035,.23,distanceTo);
    push+=vec3(dot(away,normalize(instanceMatrix[0].xyz)),0.,dot(away,normalize(instanceMatrix[2].xyz)))*weight*.75;
  }
  p+=localWind*bend*tip+push*tip;
  p.y-=tip*min(.27,bend*.13+length(push)*.12);
  return p;
}
`;
  }
});

// work/planet-v2/landscape.js
import * as THREE4 from "three";
function createLandscape(planet, height, R2, houses, uniforms, gradientMap) {
  const rng = random(hash("woodland-garden-06")), up = new THREE4.Vector3(0, 1, 0), batches = /* @__PURE__ */ new Map();
  const dir = (lat, lon) => new THREE4.Vector3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon));
  const pathLat = (lon) => 0.29 + 0.095 * Math.sin(lon * 3);
  const roundBush = new THREE4.SphereGeometry(1, 8, 6), petal = new THREE4.CircleGeometry(1, 6).rotateX(-Math.PI / 2);
  const sphere = new THREE4.IcosahedronGeometry(1, 1), leaf = new THREE4.IcosahedronGeometry(1, 0), stem = new THREE4.CylinderGeometry(1, 1, 1, 6), box = new THREE4.BoxGeometry(1, 1, 1);
  const base = new THREE4.Object3D(), local = new THREE4.Object3D();
  const counts = { flowers: 0, shrubs: 0, fencePosts: 0, rocks: 0 };
  function add(kind, geo, n, p, s, color, turn = 0, moving = false) {
    if (!batches.has(kind)) batches.set(kind, { geo, moving, matrices: [], colors: [] });
    base.position.copy(n).multiplyScalar(height(n));
    base.quaternion.setFromUnitVectors(up, n);
    base.updateMatrix();
    local.position.set(...p);
    local.rotation.set(0, turn, 0);
    local.scale.set(...s);
    local.updateMatrix();
    const b = batches.get(kind);
    b.matrices.push(new THREE4.Matrix4().multiplyMatrices(base.matrix, local.matrix));
    b.colors.push(new THREE4.Color(color));
  }
  const houseNormals = houses.map((h) => dir(h.lat, h.lon));
  function dry(n, clearance = 0.12) {
    return height(n) > R2 + 0.105 && !houseNormals.some((h) => h.distanceTo(n) < clearance);
  }
  const greens = ["#658f63", "#7da267", "#99b971", "#b2c984", "#a5c57b"];
  const positions = [], colors = [], indices = [];
  for (let i = 0; i <= 720; i++) {
    const lon = i / 720 * Math.PI * 2, width = 0.043 + 6e-3 * Math.sin(lon * 21) + 3e-3 * Math.sin(lon * 57);
    for (let j = 0; j < 5; j++) {
      const n = dir(pathLat(lon) + (j / 4 - 0.5) * width * 2, lon), p = n.clone().multiplyScalar(height(n) + 35e-4);
      positions.push(...p.toArray());
      const edge = j === 0 || j === 4;
      const c = new THREE4.Color(edge ? "#abc475" : "#ddc699");
      c.multiplyScalar(0.94 + 0.06 * Math.sin(lon * 17 + j));
      colors.push(c.r, c.g, c.b);
      if (i < 720 && j < 4) {
        const a = i * 5 + j;
        indices.push(a, a + 5, a + 1, a + 1, a + 5, a + 6);
      }
    }
  }
  const pathGeo = new THREE4.BufferGeometry();
  pathGeo.setAttribute("position", new THREE4.Float32BufferAttribute(positions, 3));
  pathGeo.setAttribute("color", new THREE4.Float32BufferAttribute(colors, 3));
  pathGeo.setIndex(indices);
  pathGeo.computeVertexNormals();
  const path = new THREE4.Mesh(pathGeo, new THREE4.MeshToonMaterial({ vertexColors: true, gradientMap, side: THREE4.DoubleSide }));
  path.name = "Winding earthen footpath";
  path.receiveShadow = true;
  planet.add(path);
  function shrub(n, size) {
    counts.shrubs++;
    for (let k = 0; k < 7; k++) {
      const a = k * 2.399, r = k < 5 ? size * 0.52 : size * 0.16, y = k < 5 ? size * 0.25 : size * 0.47;
      add("shrub leaves", roundBush, n, [Math.sin(a) * r, y, Math.cos(a) * r], [size * 0.66, size * 0.31, size * 0.6], greens[k < 5 ? k % 3 : 3], a, true);
    }
  }
  for (let i = 0; i < 145; i++) {
    const lon = i * 2.399, side = i % 2 ? 1 : -1, n = dir(pathLat(lon) + side * (0.105 + rng() * 0.07), lon);
    if (dry(n, 0.18)) shrub(n, 0.105 + rng() * 0.095);
  }
  for (let i = 0; i < 96; i++) {
    if (i % 8 > 2) continue;
    const lon = i / 96 * Math.PI * 2, lat = pathLat(lon) + 0.087, n = dir(lat, lon);
    if (!dry(n, 0.2)) continue;
    counts.fencePosts++;
    add("fence timber", box, n, [0, 0.117, 0], [0.031, 0.255, 0.032], "#a57b50", 0.12);
    add("fence caps", box, n, [0, 0.251, 0], [0.039, 0.014, 0.038], "#e1b87d");
    if (i % 8 === 2) continue;
    const next = dir(pathLat(lon + Math.PI * 2 / 96) + 0.087, lon + Math.PI * 2 / 96);
    if (!dry(next, 0.2)) continue;
    for (const lift of [0.1, 0.2]) {
      const a = n.clone().multiplyScalar(height(n) + lift), b = next.clone().multiplyScalar(height(next) + lift), delta = b.clone().sub(a);
      if (!batches.has("fence rails")) batches.set("fence rails", { geo: box, moving: false, matrices: [], colors: [] });
      const mat = new THREE4.Matrix4().compose(a.add(b).multiplyScalar(0.5), new THREE4.Quaternion().setFromUnitVectors(up, delta.clone().normalize()), new THREE4.Vector3(0.019, delta.length() + 0.018, 0.025));
      batches.get("fence rails").matrices.push(mat);
      batches.get("fence rails").colors.push(new THREE4.Color("#d3a471"));
    }
  }
  const petalColors = ["#ffecae", "#e9f3da", "#a6c9ff", "#f0a4b4", "#eeb27e"];
  for (let patch = 0; patch < 230; patch++) {
    const lon = rng() * 6.283, lat = patch < 145 ? pathLat(lon) + (patch % 2 ? 1 : -1) * (0.055 + rng() * 0.13) : Math.asin(rng() * 2 - 1);
    const c = dir(lat, lon);
    if (!dry(c, 0.14)) continue;
    const q = new THREE4.Quaternion().setFromUnitVectors(up, c);
    for (let k = 0; k < 9; k++) {
      const n = c.clone().add(new THREE4.Vector3((rng() - 0.5) * 0.095, 0, (rng() - 0.5) * 0.095).applyQuaternion(q)).normalize();
      if (!dry(n) || Math.abs(Math.asin(n.y) - pathLat(Math.atan2(n.x, n.z))) < 0.047) continue;
      const h = 0.07 + rng() * 0.095, palette = petalColors[patch % 5];
      counts.flowers++;
      add("flower stems", stem, n, [0, h * 0.5, 0], [25e-4, h, 25e-4], "#4e7950");
      for (let j = 0; j < 2; j++) add("flower leaves", leaf, n, [Math.sin(j * 3) * 0.014, h * (0.3 + j * 0.2), Math.cos(j * 3) * 0.014], [0.011, 6e-3, 0.029], "#62975a", j * 3, true);
      for (let j = 0; j < 5; j++) {
        const a = j * 6.283 / 5;
        add("wildflower petals", petal, n, [Math.sin(a) * 0.013, h, Math.cos(a) * 0.013], [0.012, 4e-3, 0.018], palette, a);
      }
      add("pollen", leaf, n, [0, h + 5e-3, 0], [6e-3, 5e-3, 6e-3], "#dfa84a");
    }
  }
  for (let i = 0; i < 420; i++) {
    const n = dir(Math.asin(rng() * 2 - 1), rng() * 6.283), h = height(n);
    if (h < R2 + 0.025 || h > R2 + 0.112 || !dry(n, 0) && h > R2 + 0.105) continue;
    if (houseNormals.some((p) => p.distanceTo(n) < 0.16)) continue;
    const s = 0.06 + rng() * 0.09;
    counts.rocks++;
    add("shore boulders", sphere, n, [0, s * 0.32, 0], [s, s * 0.65, s * 0.82], i % 2 ? "#799389" : "#9caa98", rng() * 6.28);
    add("rock moss", sphere, n, [0, s * 0.77, 0], [s * 0.82, s * 0.16, s * 0.68], "#79a05b", rng() * 6.28);
  }
  const meshes = [], depths = [];
  for (const [name, b] of batches) {
    const material = new THREE4.MeshToonMaterial({ color: "white", gradientMap, side: name === "wildflower petals" ? THREE4.DoubleSide : THREE4.FrontSide });
    const im = new THREE4.InstancedMesh(b.geo, material, b.matrices.length);
    im.name = name;
    b.matrices.forEach((m, i) => {
      im.setMatrixAt(i, m);
      im.setColorAt(i, b.colors[i]);
    });
    im.castShadow = ["fence timber", "fence rails", "shore boulders"].includes(name);
    im.receiveShadow = true;
    im.frustumCulled = false;
    if (b.moving) {
      const depth = enhanceFoliage(material, uniforms);
      im.customDepthMaterial = depth;
      depths.push(depth);
    }
    planet.add(im);
    meshes.push(im);
  }
  return { counts, path, meshes, dispose() {
    depths.forEach((d) => d.dispose());
  } };
}
var init_landscape = __esm({
  "work/planet-v2/landscape.js"() {
    init_ecology();
    init_nature();
  }
});

// work/planet-v2/world.js
import * as THREE5 from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
function direction(lat, lon) {
  return new THREE5.Vector3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon));
}
function terrainHeight(n) {
  const hills = 0.023 * Math.sin(n.x * 9 + n.z * 3) * Math.cos(n.y * 11 - n.z * 4) + 0.014 * Math.sin(n.z * 17 + n.x * 8);
  let h = R + 0.145 + hills;
  for (let i = 0; i < lakes.length; i++) {
    const d = n.distanceTo(lakes[i]);
    h -= 0.37 * Math.exp(-Math.pow(d / [0.57, 0.43, 0.47][i], 4));
  }
  return h;
}
function createWorld(savedGrowth = 0, initialConstruction = BUILD_DURATION) {
  const natureUniforms = createNatureUniforms();
  const rng = random(hash("little-bloom-landscape-v2")), planet = new THREE5.Group();
  const materials = /* @__PURE__ */ new Map(), sphere = new THREE5.SphereGeometry(1, 12, 8), ico = new THREE5.IcosahedronGeometry(1, 2), box = new THREE5.BoxGeometry(1, 1, 1), cyl = new THREE5.CylinderGeometry(1, 1, 1, 12), cone = new THREE5.ConeGeometry(1, 1, 9);
  const gradientMap = new THREE5.DataTexture(new Uint8Array([115, 115, 115, 255, 182, 182, 182, 255, 226, 226, 226, 255, 255, 255, 255, 255]), 4, 1, THREE5.RGBAFormat);
  gradientMap.minFilter = THREE5.NearestFilter;
  gradientMap.magFilter = THREE5.NearestFilter;
  gradientMap.needsUpdate = true;
  const foliage = [], clouds = [], residents = [], birds = [], butterflies = [], glowMaterials = [], lakeRipples = [], growthPlants = [], snowCaps = [];
  const stats = { trees: 0, flowers: 0, residents: 6, shrubs: 0 };
  const m = (color) => {
    if (!materials.has(color)) materials.set(color, new THREE5.MeshToonMaterial({ color, gradientMap }));
    return materials.get(color);
  };
  function mesh(parent, geo2, color, position = [0, 0, 0], scale = [1, 1, 1], shadow = true) {
    const o = new THREE5.Mesh(geo2, typeof color === "object" ? color : m(color));
    o.position.set(...position);
    o.scale.set(...scale);
    o.castShadow = shadow;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  function anchor(n2, elevation = 0) {
    const g = new THREE5.Group();
    g.position.copy(n2).multiplyScalar(terrainHeight(n2) + elevation);
    g.quaternion.setFromUnitVectors(UP, n2);
    planet.add(g);
    return g;
  }
  function moveOnSurface(g, n2, lift = 0) {
    g.position.copy(n2).multiplyScalar(terrainHeight(n2) + lift);
    g.quaternion.setFromUnitVectors(UP, n2);
  }
  function stem(parent, a, b, width, color) {
    const start = new THREE5.Vector3(...a), end = new THREE5.Vector3(...b), o = mesh(parent, cyl, color);
    o.position.copy(start).add(end).multiplyScalar(0.5);
    o.scale.set(width, start.distanceTo(end), width);
    o.quaternion.setFromUnitVectors(UP, end.sub(start).normalize());
    return o;
  }
  const geo = new THREE5.SphereGeometry(1, 128, 80), pos = geo.attributes.position, colors = [], n = new THREE5.Vector3();
  const sand = new THREE5.Color("#fff0be"), low = new THREE5.Color("#8ab85e"), high = new THREE5.Color("#7eae59");
  for (let i = 0; i < pos.count; i++) {
    n.fromBufferAttribute(pos, i).normalize();
    const h = terrainHeight(n);
    pos.setXYZ(i, n.x * h, n.y * h, n.z * h);
    const c = h < R + 0.108 ? sand.clone().lerp(low, THREE5.MathUtils.smoothstep(h, R + 0.063, R + 0.108)) : low.clone().lerp(high, THREE5.MathUtils.smoothstep(h, R + 0.115, R + 0.18));
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new THREE5.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const snowUniform = { value: 0 };
  const landMat = new THREE5.MeshToonMaterial({ vertexColors: true, gradientMap });
  landMat.onBeforeCompile = (shader) => {
    shader.uniforms.uSnow = snowUniform;
    shader.vertexShader = "varying vec3 vGround;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvGround=position;");
    shader.fragmentShader = "uniform float uSnow;varying vec3 vGround;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
      float meadowPatch=.5+.25*sin(vGround.x*14.+sin(vGround.z*11.))*cos(vGround.y*17.)+.14*sin(vGround.z*42.+vGround.x*24.);
      
      diffuseColor.rgb*=.98+meadowPatch*.055;
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.82,.86,.79),uSnow*.65);
    `);
  };
  landMat.customProgramCacheKey = () => "meadow-ground-v5";
  const land = mesh(planet, geo, landMat);
  const waterMat = new THREE5.MeshToonMaterial({ color: "#ffffff", vertexColors: true, gradientMap });
  enhanceWater(waterMat, natureUniforms);
  const waterGeo = new THREE5.SphereGeometry(R, 128, 80), waterPos = waterGeo.attributes.position, waterColors = [], depths = [];
  const shallow = new THREE5.Color("#8ed6c3"), deep = new THREE5.Color("#66bccc");
  for (let i = 0; i < waterPos.count; i++) {
    n.fromBufferAttribute(waterPos, i).normalize();
    const depth = Math.max(0, R - terrainHeight(n));
    depths.push(depth);
    const c = shallow.clone().lerp(deep, THREE5.MathUtils.smoothstep(depth, 0.01, 0.24));
    waterColors.push(c.r, c.g, c.b);
  }
  waterGeo.setAttribute("color", new THREE5.Float32BufferAttribute(waterColors, 3));
  waterGeo.setAttribute("seaDepth", new THREE5.Float32BufferAttribute(depths, 1));
  const ocean = mesh(planet, waterGeo, waterMat, [0, 0, 0], [1, 1, 1], false);
  const surf = [], shoreFrames = [];
  lakes.forEach((center, index) => {
    const x = new THREE5.Vector3().crossVectors(UP, center).normalize(), z = new THREE5.Vector3().crossVectors(center, x).normalize();
    const samples = [];
    for (let j = 0; j <= 160; j++) {
      const angle = j / 160 * Math.PI * 2, tangent = x.clone().multiplyScalar(Math.cos(angle)).addScaledVector(z, Math.sin(angle));
      let lo = 0, hi = 1.05;
      for (let k = 0; k < 18; k++) {
        const r = (lo + hi) / 2, nn = center.clone().multiplyScalar(Math.cos(r)).addScaledVector(tangent, Math.sin(r));
        if (terrainHeight(nn) < R) lo = r;
        else hi = r;
      }
      samples.push({ tangent, r: (lo + hi) / 2 });
    }
    samples.forEach((sample) => {
      const nn = center.clone().multiplyScalar(Math.cos(sample.r - 0.025)).addScaledVector(sample.tangent, Math.sin(sample.r - 0.025));
      sample.depthSlope = Math.max(0, R - terrainHeight(nn)) / 0.025;
    });
    shoreFrames.push({ center, x, z, samples });
    for (let band = 0; band < 3; band++) {
      const g = new THREE5.BufferGeometry(), positions = new Float32Array(161 * 2 * 3), uv = [], indices = [];
      for (let j = 0; j <= 160; j++) uv.push(j / 160, 0, j / 160, 1);
      for (let j = 0; j < 160; j++) {
        const a = j * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
      g.setAttribute("position", new THREE5.BufferAttribute(positions, 3).setUsage(THREE5.DynamicDrawUsage));
      g.setAttribute("uv", new THREE5.Float32BufferAttribute(uv, 2));
      g.setIndex(indices);
      const material = new THREE5.MeshBasicMaterial({ color: "#f3ffff", transparent: true, opacity: 0.5, side: THREE5.DoubleSide, depthWrite: false });
      enhanceFoam(material, natureUniforms);
      const wave = mesh(planet, g, material, [0, 0, 0], [1, 1, 1], false);
      wave.frustumCulled = false;
      surf.push({ wave, positions, center, samples, band });
    }
  });
  const airMat = new THREE5.ShaderMaterial({ uniforms: { tint: { value: new THREE5.Color("#b9daba") }, strength: { value: 0.12 } }, vertexShader: "varying vec3 N; varying vec3 V; void main(){vec4 p=modelViewMatrix*vec4(position,1.);N=normalize(normalMatrix*normal);V=normalize(-p.xyz);gl_Position=projectionMatrix*p;}", fragmentShader: "varying vec3 N; varying vec3 V; uniform vec3 tint; uniform float strength; void main(){float a=pow(1.-abs(dot(normalize(N),normalize(V))),3.)*strength;gl_FragColor=vec4(tint,a);}", transparent: true, depthWrite: false, side: THREE5.BackSide });
  mesh(planet, new THREE5.SphereGeometry(R + 0.14, 64, 48), airMat, [0, 0, 0], [1, 1, 1], false);
  const crownMatrices = [], crownColors = [];
  function tree(normal, size, pink = false) {
    const root = anchor(normal), g = new THREE5.Group();
    root.add(g);
    g.scale.set(size, size * 0.82, size);
    stats.trees++;
    const birch = stats.trees % 3 !== 0;
    stem(g, [0, 0, 0], [0.025, 0.6, 0.012], 0.035, birch ? "#eee5c9" : "#957c59");
    if (birch) for (let j = 0; j < 4; j++) mesh(g, box, "#9f9e80", [j % 2 ? 0.014 : -6e-3, 0.09 + j * 0.11, 0.034], [0.026, 0.012, 5e-3]);
    for (let j = 0; j < 3; j++) {
      const a = j * 2.1;
      stem(g, [0, 0.25, 0], [Math.sin(a) * 0.18, 0.58, Math.cos(a) * 0.18], 0.015, "#b4a681");
    }
    root.updateMatrix();
    g.updateMatrix();
    const base = new THREE5.Matrix4().multiplyMatrices(root.matrix, g.matrix), d = new THREE5.Object3D();
    const palette = pink ? ["#d9a7ac", "#efc2b5", "#f2d0b8"] : ["#538865", "#689c67", "#88b56d", "#a3c67e"];
    for (let j = 0; j < 10; j++) {
      const a = j * 2.399, r = j < 7 ? 0.19 : 0.08;
      d.position.set(Math.sin(a) * r, 0.54 + (j < 7 ? j % 3 * 0.055 : 0.2), Math.cos(a) * r);
      d.rotation.set(0.1 * Math.sin(j), a, 0.12 * Math.cos(j));
      const s = j < 7 ? 0.165 + rng() * 0.045 : 0.16;
      d.scale.set(s * 1.16, s * 0.87, s);
      d.updateMatrix();
      crownMatrices.push(new THREE5.Matrix4().multiplyMatrices(base, d.matrix));
      crownColors.push(new THREE5.Color(palette[j < 7 ? j % 3 : 3]));
    }
    const cap = mesh(g, sphere, "#f4f1df", [0, 0.895, 0], [0.17, 0.028, 0.16], false);
    cap.visible = false;
    snowCaps.push(cap);
    return root;
  }
  const houseSites = [{ lat: 0.59, lon: 0.48 }, { lat: 0.15, lon: -0.62 }, { lat: 0.58, lon: 1.58 }, { lat: -0.5, lon: -1.1 }, { lat: 0.48, lon: 2.83 }];
  const pathLat = (lon) => 0.29 + 0.095 * Math.sin(lon * 3);
  for (let i = 0, made = 0; i < 800 && made < 10; i++) {
    const nn = direction(Math.asin(rng() * 1.84 - 0.92), rng() * Math.PI * 2);
    const lon = Math.atan2(nn.x, nn.z);
    if (nn.distanceTo(direction(0.32, 0.08)) < 0.68 || terrainHeight(nn) < R + 0.035 || Math.abs(Math.asin(nn.y) - pathLat(lon)) < 0.105 || houseSites.some((h) => nn.distanceTo(direction(h.lat, h.lon)) < 0.25)) continue;
    tree(nn, 0.57 + rng() * 0.18, made % 9 === 0);
    made++;
  }
  [[0.79, -0.49], [0.82, 0.92], [-0.25, -0.68]].forEach(([lat, lon], i) => tree(direction(lat, lon), 0.6 + i * 0.04, i === 2));
  const crownMaterial = new THREE5.MeshToonMaterial({ color: "white", gradientMap });
  const crownDepth = enhanceFoliage(crownMaterial, natureUniforms);
  const canopy = new THREE5.InstancedMesh(new THREE5.SphereGeometry(1, 10, 7), crownMaterial, crownMatrices.length);
  canopy.name = "Painted tree crowns";
  crownMatrices.forEach((matrix2, i) => {
    canopy.setMatrixAt(i, matrix2);
    canopy.setColorAt(i, crownColors[i]);
  });
  canopy.customDepthMaterial = crownDepth;
  canopy.castShadow = true;
  canopy.receiveShadow = true;
  canopy.frustumCulled = false;
  planet.add(canopy);
  function shoreNormal(index, angle, offset = 0) {
    const f = shoreFrames[index], sample = f.samples[Math.round((angle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2) * 160)], r = sample.r + offset;
    return f.center.clone().multiplyScalar(Math.cos(r)).addScaledVector(sample.tangent, Math.sin(r)).normalize();
  }
  const palmFrondMat = m("#70c28b");
  palmFrondMat.side = THREE5.DoubleSide;
  function palm(nn, size) {
    const g = anchor(nn);
    g.scale.setScalar(size);
    stats.trees++;
    const bend = new THREE5.QuadraticBezierCurve3(new THREE5.Vector3(), new THREE5.Vector3(0.04, 0.38, 0), new THREE5.Vector3(0.14, 0.7, 0.02));
    mesh(g, new THREE5.TubeGeometry(bend, 12, 0.032, 7, false), "#dab189");
    for (let i = 1; i < 6; i++) {
      const ring = mesh(g, new THREE5.TorusGeometry(0.034, 5e-3, 4, 10), "#edc799", bend.getPoint(i / 6).toArray());
      ring.rotation.x = Math.PI / 2;
    }
    const crown = new THREE5.Group();
    crown.position.set(0.14, 0.69, 0.02);
    g.add(crown);
    for (let j = 0; j < 7; j++) {
      const leaf = new THREE5.Group();
      leaf.rotation.y = j * Math.PI * 2 / 7;
      crown.add(leaf);
      const p = [], ind = [];
      for (let k = 0; k <= 8; k++) {
        const u = k / 8, w = Math.sin(u * Math.PI) * 0.082;
        for (const side of [-1, 1]) p.push(side * w, 0.18 * Math.sin(u * Math.PI) - u * 0.15, u * 0.54);
        if (k < 8) {
          const a = k * 2;
          ind.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
      }
      const geo2 = new THREE5.BufferGeometry();
      geo2.setAttribute("position", new THREE5.Float32BufferAttribute(p, 3));
      geo2.setIndex(ind);
      geo2.computeVertexNormals();
      mesh(leaf, geo2, palmFrondMat);
    }
    for (let j = 0; j < 3; j++) mesh(crown, sphere, "#bc956d", [Math.sin(j * 2) * 0.05, -0.02, Math.cos(j * 2) * 0.05], [0.052, 0.062, 0.05]);
    foliage.push({ g: crown, phase: rng() * 6, amount: 0.065 });
  }
  [0.25, 3.05, 4.35].forEach((angle, i) => palm(shoreNormal(0, angle, 0.095), 0.56 + i % 3 * 0.04));
  [2.4].forEach((angle) => palm(shoreNormal(1, angle, 0.09), 0.6));
  [1.62, 2.64, 5.75].forEach((angle, index) => {
    const g = anchor(shoreNormal(0, angle, 0.033));
    g.rotation.y += angle;
    mesh(g, cyl, "#f8e6c6", [0, 0.19, 0], [0.012, 0.38, 0.012]);
    for (let j = 0; j < 8; j++) mesh(g, new THREE5.SphereGeometry(0.185, 4, 4, j * Math.PI / 4, Math.PI / 4, 0, Math.PI / 2), j % 2 ? "#fff9e4" : index % 2 ? "#91d8d0" : "#ffc4a5", [0, 0.37, 0], [1, 0.4, 1]);
    const towel = mesh(g, box, index % 2 ? "#b6e4e8" : "#ffd2b6", [0.17, 6e-3, 0.1], [0.13, 0.013, 0.23]);
    towel.rotation.y = 0.2;
    for (let j = 0; j < 3; j++) mesh(g, box, "#fffbef", [0.17, 0.014, 0.04 + j * 0.07], [0.125, 4e-3, 0.014]);
  });
  for (let i = 0; i < 32; i++) {
    const nn = shoreNormal(0, i * 2.399, 0.018 + i % 4 * 0.012), g = anchor(nn);
    const shell = mesh(g, sphere, i % 3 ? "#fff9e6" : "#f6c7bd", [0, 0.011, 0], [0.021, 0.012, 0.027], false);
    shell.rotation.y = i * 2.4;
  }
  const lighthouse = anchor(shoreNormal(0, 0.64, 0.13));
  mesh(lighthouse, new THREE5.CylinderGeometry(0.1, 0.15, 0.66, 16), "#fff9e7", [0, 0.33, 0]);
  for (const y of [0.2, 0.45]) mesh(lighthouse, new THREE5.CylinderGeometry(0.125 - (y - 0.2) * 0.075, 0.138 - (y - 0.2) * 0.075, 0.09, 16), "#efad9d", [0, y, 0]);
  mesh(lighthouse, cyl, "#f7edd7", [0, 0.69, 0], [0.17, 0.035, 0.17]);
  mesh(lighthouse, cyl, "#88c7d4", [0, 0.76, 0], [0.088, 0.14, 0.088]);
  mesh(lighthouse, cone, "#ed9c89", [0, 0.91, 0], [0.17, 0.17, 0.17]);
  const beaconMat = new THREE5.MeshStandardMaterial({ color: "#fff4bf", emissive: "#ffdb8a", emissiveIntensity: 0.2 });
  glowMaterials.push(beaconMat);
  mesh(lighthouse, sphere, beaconMat, [0, 0.765, 0.079], [0.043, 0.054, 0.017], false);
  mesh(lighthouse, box, "#8bc8d4", [0, 0.09, 0.142], [0.065, 0.15, 0.016]);
  const boat = new THREE5.Group();
  planet.add(boat);
  const boatBody = new THREE5.Group();
  boat.add(boatBody);
  mesh(boatBody, sphere, "#fff8df", [0, 0.015, 0], [0.115, 0.055, 0.25]);
  mesh(boatBody, box, "#d9a378", [0, 0.049, 0], [0.17, 0.013, 0.33]);
  mesh(boatBody, cyl, "#dab58c", [0, 0.26, 0], [9e-3, 0.45, 9e-3]);
  const sailGeo = new THREE5.BufferGeometry();
  sailGeo.setAttribute("position", new THREE5.Float32BufferAttribute([0.012, 0.47, 0, 0.012, 0.12, 0, 0.25, 0.12, 0, -0.012, 0.41, 0, -0.18, 0.13, 0, -0.012, 0.13, 0], 3));
  sailGeo.computeVertexNormals();
  const sailMat = m("#fff9e7");
  sailMat.side = THREE5.DoubleSide;
  mesh(boatBody, sailGeo, sailMat);
  mesh(boatBody, new THREE5.ConeGeometry(0.033, 0.1, 3), "#efa799", [0.04, 0.47, 0], [1, 1, 1]).rotation.z = -Math.PI / 2;
  function instances(geometry, color, transforms) {
    const im = new THREE5.InstancedMesh(geometry, m(color), transforms.length);
    transforms.forEach((matrix2, i) => im.setMatrixAt(i, matrix2));
    im.instanceMatrix.needsUpdate = true;
    im.receiveShadow = true;
    im.castShadow = false;
    im.computeBoundingSphere();
    planet.add(im);
    return im;
  }
  const dummy = new THREE5.Object3D(), tempRoot = new THREE5.Object3D();
  function matrix(normal, local, scale, twist = 0) {
    tempRoot.position.copy(normal).multiplyScalar(terrainHeight(normal));
    tempRoot.quaternion.setFromUnitVectors(UP, normal);
    tempRoot.updateMatrix();
    dummy.position.set(...local);
    dummy.rotation.set(0, twist, 0);
    dummy.scale.set(...scale);
    dummy.updateMatrix();
    return new THREE5.Matrix4().multiplyMatrices(tempRoot.matrix, dummy.matrix);
  }
  const grasses = [], stems = [], flowerCenters = [], petals = [[], [], []];
  for (let i = 0; i < 460; i++) {
    const nn = direction(Math.asin(rng() * 2 - 1), rng() * Math.PI * 2);
    if (terrainHeight(nn) < R + 0.04) continue;
    const lon = Math.atan2(nn.x, nn.z);
    if (Math.abs(Math.asin(nn.y) - pathLat(lon)) < 0.03 || houseSites.some((h) => nn.distanceTo(direction(h.lat, h.lon)) < 0.12)) continue;
    if (i % 3) {
      grasses.push(matrix(nn, [0, 0.027, 0], [0.012, 0.065, 0.012], rng() * 6));
    } else {
      const h = 0.08 + rng() * 0.04;
      stems.push(matrix(nn, [0, h / 2, 0], [7e-3, h, 7e-3]));
      flowerCenters.push(matrix(nn, [0, h, 0], [0.017, 0.014, 0.017]));
      for (let j = 0; j < 5; j++) petals[i % 9 / 3 | 0].push(matrix(nn, [Math.sin(j * 1.256) * 0.024, h, Math.cos(j * 1.256) * 0.024], [0.024, 9e-3, 0.019], j * 1.256));
      stats.flowers++;
    }
  }
  const smallBlossom = new THREE5.SphereGeometry(1, 6, 4);
  instances(cyl, "#708b51", stems);
  instances(smallBlossom, "#e9b85f", flowerCenters);
  ["#eedad0", "#e9b8b6", "#f3dea1"].forEach((c, i) => instances(smallBlossom, c, petals[i]));
  const meadow = createMeadow(planet, terrainHeight, R, houseSites, natureUniforms, gradientMap);
  for (let i = 0; i < 22; i++) {
    const nn = direction(Math.asin(rng() * 2 - 1), rng() * 6.28);
    if (terrainHeight(nn) < R + 0.05) continue;
    const g = anchor(nn);
    mesh(g, ico, "#93b27b", [0, 0.04, 0], [0.12, 0.065, 0.11]);
    stats.shrubs++;
  }
  const landscape = createLandscape(planet, terrainHeight, R, houseSites, natureUniforms, gradientMap);
  stats.flowers += landscape.counts.flowers;
  stats.shrubs += landscape.counts.shrubs;
  const buildTargets = { path: { id: "path", kind: "path", normal: direction(0.29, 0.08), object: landscape.path } };
  function house(site, index) {
    const g = anchor(direction(site.lat, site.lon)), house2 = new THREE5.Group();
    house2.rotation.y = index * 0.75;
    g.add(house2);
    const walls = ["#fff6df", "#ffeacf", "#eff8dc", "#ffedcd", "#f5ebfb"];
    mesh(house2, box, "#c6b493", [0, 0.025, 0], [0.47, 0.06, 0.38]);
    mesh(house2, box, walls[index], [0, 0.21, 0], [0.39, 0.37, 0.32]);
    const roofGeo = new THREE5.BufferGeometry();
    const w = 0.25, y = 0.4, top = 0.59, d = 0.21;
    roofGeo.setAttribute("position", new THREE5.Float32BufferAttribute([-w, y, d, w, y, d, 0, top, d, -w, y, -d, 0, top, -d, w, y, -d, -w, y, d, 0, top, d, 0, top, -d, -w, y, d, 0, top, -d, -w, y, -d, w, y, d, w, y, -d, 0, top, -d, w, y, d, 0, top, -d, 0, top, d], 3));
    roofGeo.computeVertexNormals();
    const roofMat = m(index % 2 ? "#74bac8" : "#ef9e87");
    roofMat.side = THREE5.DoubleSide;
    mesh(house2, roofGeo, roofMat);
    mesh(house2, box, "#a18970", [-0.06, 0.13, 0.169], [0.08, 0.22, 0.024]);
    mesh(house2, sphere, "#dfc384", [-0.035, 0.13, 0.185], [0.011, 0.011, 9e-3]);
    const windowMat = new THREE5.MeshStandardMaterial({ color: "#f1d894", emissive: "#ffd88a", emissiveIntensity: 0.12, roughness: 0.5 });
    glowMaterials.push(windowMat);
    for (const side of [-1, 1]) {
      mesh(house2, box, "#9d9277", [side * 0.124, 0.25, 0.168], [0.09, 0.105, 0.016]);
      mesh(house2, box, windowMat, [side * 0.124, 0.25, 0.18], [0.064, 0.078, 0.011], false);
      mesh(house2, box, "#f3e7c6", [side * 0.124, 0.25, 0.19], [8e-3, 0.082, 7e-3]);
    }
    mesh(house2, box, "#c1a896", [0.12, 0.49, -0.09], [0.055, 0.2, 0.06]);
    const snow2 = mesh(house2, box, "#f1f0e6", [0, 0.591, 0], [0.05, 0.018, 0.41], false);
    snowCaps.push(snow2);
    snow2.visible = false;
    for (let j = 0; j < 4; j++) mesh(house2, cyl, "#d6c4a0", [-0.28, 0.08, -0.21 + j * 0.12], [0.014, 0.17, 0.014]);
    stem(house2, [-0.28, 0.1, -0.23], [-0.28, 0.1, 0.19], 0.01, "#d6c4a0");
    mesh(house2, cyl, "#bf9077", [0.23, 0.05, 0.13], [0.039, 0.08, 0.04]);
    mesh(house2, ico, "#849e6b", [0.23, 0.115, 0.13], [0.055, 0.07, 0.05]);
    buildTargets["house" + index] = { id: "house" + index, kind: "house", normal: direction(site.lat, site.lon), object: house2, root: g };
    return g;
  }
  houseSites.forEach(house);
  const millRoot = anchor(direction(0.59, -0.11)), mill = new THREE5.Group();
  millRoot.add(mill);
  mill.rotation.y = 0.3;
  mesh(mill, new THREE5.CylinderGeometry(0.12, 0.17, 0.58, 10), "#ede1bf", [0, 0.29, 0]);
  mesh(mill, cone, "#ad8a71", [0, 0.65, 0], [0.23, 0.25, 0.23]);
  mesh(mill, box, "#92795c", [0, 0.105, 0.155], [0.075, 0.18, 0.025]);
  const rotor = new THREE5.Group();
  rotor.position.set(0, 0.46, 0.2);
  mill.add(rotor);
  for (let i = 0; i < 4; i++) {
    const blade = new THREE5.Group();
    blade.rotation.z = i * Math.PI / 2;
    rotor.add(blade);
    mesh(blade, box, "#e9d9b7", [0, 0.19, 0], [0.037, 0.42, 0.027]);
    mesh(blade, box, "#d8c39e", [0.055, 0.24, 0], [0.12, 0.22, 0.024]);
    for (let j = 0; j < 3; j++) mesh(blade, box, "#f2e8d1", [0.055, 0.17 + j * 0.065, 0.016], [0.125, 0.012, 0.01]);
  }
  mesh(rotor, sphere, "#9d8061", [0, 0, 0.027], [0.055, 0.055, 0.034]);
  mesh(mill, cyl, "#c7b792", [0, 0.023, 0], [0.19, 0.046, 0.19]);
  buildTargets.mill = { id: "mill", kind: "mill", normal: direction(0.59, -0.11), object: mill, root: millRoot };
  const jettyNormal = shoreNormal(0, 2.05, -0.025);
  const lakeFrame = new THREE5.Group();
  lakeFrame.quaternion.setFromUnitVectors(UP, jettyNormal);
  lakeFrame.position.copy(jettyNormal).multiplyScalar(R + 0.018);
  planet.add(lakeFrame);
  for (let i = 0; i < 5; i++) mesh(lakeFrame, box, "#b39777", [-0.36 + i * 0.065, 0.02, -0.45], [0.055, 0.036, 0.25]);
  for (const x of [-0.39, -0.09]) for (const z of [-0.53, -0.36]) mesh(lakeFrame, cyl, "#9c8068", [x, -0.035, z], [0.013, 0.17, 0.013]);
  const dock = new THREE5.Group();
  for (const o of [...lakeFrame.children]) dock.add(o);
  lakeFrame.add(dock);
  buildTargets.dock = { id: "dock", kind: "dock", normal: shoreNormal(0, 2.05, 0.08), object: dock, root: dock };
  const rippleMat = new THREE5.MeshBasicMaterial({ color: "#e7f5cf", transparent: true, opacity: 0.3, depthWrite: false, side: THREE5.DoubleSide });
  for (let i = 0; i < 8; i++) {
    const angle = i * 2.4, rr = 0.12 + i * 0.039;
    const ring = mesh(lakeFrame, new THREE5.RingGeometry(0.06, 0.064, 28), rippleMat.clone(), [Math.sin(angle) * rr, 0.016, Math.cos(angle) * rr], [1, 1, 1], false);
    ring.rotation.x = -Math.PI / 2;
    lakeRipples.push(ring);
  }
  const garden = anchor(direction(0.03, -0.02));
  for (let i = 0; i < 12; i++) {
    const g = new THREE5.Group();
    garden.add(g);
    g.position.set((i % 4 - 1.5) * 0.066, 0.015, (Math.floor(i / 4) - 1) * 0.066);
    mesh(g, cyl, "#779661", [0, 0.025, 0], [8e-3, 0.055, 8e-3]);
    const l = mesh(g, sphere, "#9fbc76", [-0.021, 0.047, 0], [0.028, 9e-3, 0.013]);
    l.rotation.z = -0.4;
    mesh(g, sphere, "#789e60", [0.02, 0.032, 0], [0.026, 9e-3, 0.013]);
    g.scale.setScalar(i < savedGrowth ? 1 : 0.015);
    growthPlants.push(g);
  }
  for (let i = 0; i < 3; i++) mesh(garden, box, "#b5a583", [0, -4e-3, (i - 1) * 0.075], [0.28, 0.018, 0.045], false);
  for (let i = 0; i < 6; i++) {
    const root = new THREE5.Group();
    planet.add(root);
    const villager = createVillager(i, { mesh, sphere, cyl, cone, box, stem });
    root.add(villager.body);
    const lon = 0.04 + i * 1.04, nn = direction(pathLat(lon), lon);
    moveOnSurface(root, nn);
    residents.push({ ...villager, root, i, lon, normal: nn.clone(), phase: rng() * 6, heading: 0, activity: "\u6563\u6B65" });
  }
  const animals = [];
  for (let i = 0; i < 4; i++) {
    const nn = direction(-0.31 + i * 0.13, -0.36 - i * 0.11), g = anchor(nn), body = new THREE5.Group();
    g.add(body);
    mesh(body, sphere, i === 0 ? "#f4c79c" : "#eee8d4", [0, 0.09, 0], [0.085, 0.065, 0.115]);
    mesh(body, sphere, i === 0 ? "#fff0d2" : "#e8e3d1", [0, 0.14, 0.085], [0.053, 0.052, 0.053]);
    for (const x of [-0.025, 0.025]) mesh(body, sphere, "#e6ddc6", [x, i === 0 ? 0.184 : 0.218, 0.078], [0.015, i === 0 ? 0.019 : 0.071, 0.018]);
    mesh(body, sphere, "#f4f0e4", [0, 0.1, -0.1], [0.04, 0.04, 0.04]);
    for (const x of [-0.026, 0.026]) mesh(body, sphere, "#696453", [x, 0.15, 0.127], [6e-3, 7e-3, 5e-3]);
    if (i === 0) {
      mesh(body, sphere, "#e3a476", [-0.055, 0.16, 0.045], [0.025, 0.025, 0.018]);
      mesh(body, sphere, "#e3a476", [0.055, 0.16, 0.045], [0.025, 0.025, 0.018]);
      mesh(body, sphere, "#fff3d7", [0, 0.14, 0.132], [0.03, 0.022, 0.012]);
    }
    animals.push({ g, body, nn, phase: i * 1.7 });
  }
  const travelPet = animals[0];
  const cloudRoot = new THREE5.Group();
  planet.add(cloudRoot);
  for (let i = 0; i < 11; i++) {
    const nn = direction(0.5 + Math.sin(i * 2.7) * 0.6, i * 2.399), g = new THREE5.Group();
    g.position.copy(nn).multiplyScalar(R + 0.64 + i % 3 * 0.06);
    g.quaternion.setFromUnitVectors(UP, nn);
    cloudRoot.add(g);
    const material = new THREE5.MeshStandardMaterial({ color: "#faf3df", roughness: 1, transparent: true, opacity: 0.86, depthWrite: false });
    for (let j = 0; j < 4; j++) mesh(g, sphere, material, [(j - 1.5) * 0.16, Math.sin(j * 2) * 0.035, 0], [0.2, 0.09 + j % 2 * 0.046, 0.115], false);
    g.scale.setScalar(0.8 + i % 3 * 0.1);
    clouds.push({ g, material, phase: i * 2 });
  }
  for (let i = 0; i < 8; i++) {
    const root = new THREE5.Group();
    planet.add(root);
    const material = m(i % 2 ? "#e2b177" : "#adbacb");
    const left = mesh(root, sphere, material, [-0.03, 0, 0], [0.04, 7e-3, 0.03], false), right = mesh(root, sphere, material, [0.03, 0, 0], [0.04, 7e-3, 0.03], false);
    mesh(root, cyl, "#756950", [0, 0, 0], [6e-3, 0.044, 6e-3], false).rotation.x = Math.PI / 2;
    butterflies.push({ root, left, right, phase: i * 1.67 });
  }
  for (let i = 0; i < 7; i++) {
    const root = new THREE5.Group();
    planet.add(root);
    mesh(root, sphere, "#fffdf1", [0, 0, 0], [0.025, 0.023, 0.07], false);
    const left = mesh(root, cone, "#e2f0f1", [-0.075, 0, 0], [0.037, 0.15, 0.012], false), right = mesh(root, cone, "#e2f0f1", [0.075, 0, 0], [0.037, 0.15, 0.012], false);
    mesh(root, cone, "#eebd71", [0, 0, 0.086], [0.013, 0.035, 0.012], false).rotation.x = Math.PI / 2;
    left.rotation.z = Math.PI / 2;
    right.rotation.z = -Math.PI / 2;
    birds.push({ root, left, right, phase: i * 0.45 });
  }
  const particleCount = 480, particlePos = new Float32Array(particleCount * 6), particleDirs = [], particlePhase = [];
  for (let i = 0; i < particleCount; i++) {
    particleDirs.push(direction(Math.asin(rng() * 2 - 1), rng() * 6.28));
    particlePhase.push(rng());
  }
  const rainGeo = new THREE5.BufferGeometry();
  rainGeo.setAttribute("position", new THREE5.BufferAttribute(particlePos, 3));
  const rainMat = new THREE5.LineBasicMaterial({ color: "#b4d7db", transparent: true, opacity: 0.5, depthWrite: false });
  const rain = new THREE5.LineSegments(rainGeo, rainMat);
  rain.frustumCulled = false;
  planet.add(rain);
  const snowPos = new Float32Array(particleCount * 3), snowGeo = new THREE5.BufferGeometry();
  snowGeo.setAttribute("position", new THREE5.BufferAttribute(snowPos, 3));
  function particleMaterial(color, size) {
    return new THREE5.ShaderMaterial({ uniforms: { color: { value: new THREE5.Color(color) }, size: { value: size }, opacity: { value: 0.8 } }, vertexShader: "uniform float size;void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(size*220./-p.z,1.,12.);gl_Position=projectionMatrix*p;}", fragmentShader: "uniform vec3 color;uniform float opacity;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(color,opacity*(1.-smoothstep(.4,1.,r)));}", transparent: true, depthWrite: false });
  }
  const snow = new THREE5.Points(snowGeo, particleMaterial("#ffffff", 0.17));
  snow.frustumCulled = false;
  planet.add(snow);
  const fireflyCount = 60, fireflyGeo = new THREE5.BufferGeometry(), fireflyPos = new Float32Array(fireflyCount * 3);
  fireflyGeo.setAttribute("position", new THREE5.BufferAttribute(fireflyPos, 3));
  const fireflies = new THREE5.Points(fireflyGeo, particleMaterial("#ffdc83", 0.15));
  fireflies.material.blending = THREE5.AdditiveBlending;
  fireflies.frustumCulled = false;
  planet.add(fireflies);
  const petalGeo = new THREE5.BufferGeometry(), petalPos = new Float32Array(100 * 3);
  petalGeo.setAttribute("position", new THREE5.BufferAttribute(petalPos, 3));
  const petalFX = new THREE5.Points(petalGeo, particleMaterial("#f1c3b9", 0.12));
  petalFX.frustumCulled = false;
  planet.add(petalFX);
  const rainbow = new THREE5.Group();
  lakeFrame.add(rainbow);
  rainbow.position.set(0, 0.04, 0);
  rainbow.rotation.y = 0.2;
  for (let i = 0; i < 5; i++) {
    const material = new THREE5.MeshBasicMaterial({ color: ["#dfa2a0", "#e8c494", "#e6d99e", "#a8c4a5", "#a6bac8"][i], transparent: true, opacity: 0.55, depthWrite: false, side: THREE5.DoubleSide });
    const arc = new THREE5.Mesh(new THREE5.RingGeometry(0.48 + i * 0.019, 0.496 + i * 0.019, 48, 1, 0, Math.PI), material);
    rainbow.add(arc);
  }
  rainbow.visible = false;
  const appleGroup = anchor(direction(0.35, -0.32));
  const apple = mesh(appleGroup, sphere, "#cf8269", [0, 0.6, 0], [0.07, 0.075, 0.07]);
  mesh(apple, cyl, "#8c7154", [0, 1.06, 0], [0.1, 0.5, 0.1]);
  appleGroup.visible = false;
  const lanternGlow = new THREE5.MeshToonMaterial({ color: "#ffe7a8", emissive: "#ffc577", emissiveIntensity: 0.12, gradientMap });
  glowMaterials.push(lanternGlow);
  for (let i = 0; i < 10; i++) {
    const lon = 0.12 + i * 0.628, n2 = direction(pathLat(lon) - 0.065, lon), g = anchor(n2);
    mesh(g, cyl, "#8d9579", [0, 0.062, 0], [0.013, 0.124, 0.013]);
    mesh(g, box, lanternGlow, [0, 0.138, 0], [0.047, 0.067, 0.047], false);
    mesh(g, cone, "#9aa483", [0, 0.183, 0], [0.044, 0.03, 0.044]);
  }
  const construction = createBuildScene({ planet, targets: buildTargets, landscape, mesh, box, cyl, anchor, direction, height: terrainHeight, R });
  construction.setProgress(initialConstruction);
  planet.updateMatrixWorld(true);
  function batchRigid(parent, objects) {
    const inverse = parent.matrixWorld.clone().invert(), buckets2 = /* @__PURE__ */ new Map();
    for (const o of objects) {
      if (!o.isMesh || o.isInstancedMesh) continue;
      const key = o.material.uuid + "/" + o.castShadow;
      if (!buckets2.has(key)) buckets2.set(key, []);
      buckets2.get(key).push(o);
    }
    for (const group of buckets2.values()) {
      if (group.length < 2) continue;
      const parts = group.map((o) => {
        let g = o.geometry.clone().applyMatrix4(new THREE5.Matrix4().multiplyMatrices(inverse, o.matrixWorld));
        if (g.index) {
          const old = g;
          g = g.toNonIndexed();
          old.dispose();
        }
        g.deleteAttribute("uv");
        return g;
      });
      const geometry = mergeGeometries(parts, false);
      parts.forEach((g) => g.dispose());
      if (!geometry) continue;
      const merged = new THREE5.Mesh(geometry, group[0].material);
      merged.castShadow = group[0].castShadow;
      merged.receiveShadow = true;
      parent.add(merged);
      group.forEach((o) => o.removeFromParent());
    }
  }
  for (const f of foliage) {
    const objects = [];
    f.g.traverse((o) => {
      if (o.isMesh) objects.push(o);
    });
    batchRigid(f.g, objects);
  }
  for (const c of clouds) batchRigid(c.g, [...c.g.children]);
  for (const p of residents) {
    batchRigid(p.body, [...p.body.children]);
    batchRigid(p.head, [...p.head.children]);
    batchRigid(p.tail, [...p.tail.children]);
  }
  for (const s of construction.structures) {
    s.groups.forEach((g) => batchRigid(g, g.children.filter((o) => !snowCaps.includes(o))));
    batchRigid(s.frame, [...s.frame.children]);
  }
  for (const a of animals) batchRigid(a.body, [...a.body.children]);
  const dynamic = /* @__PURE__ */ new Set([...construction.dynamicRoots, land, rotor, cloudRoot, appleGroup, rainbow, boat, ...surf.map((s) => s.wave), ...foliage.map((f) => f.g), ...snowCaps, ...residents.map((p) => p.root), ...animals.map((a) => a.g), ...butterflies.map((b) => b.root), ...birds.map((b) => b.root), ...lakeRipples, ...growthPlants]);
  planet.updateMatrixWorld(true);
  const buckets = /* @__PURE__ */ new Map();
  planet.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.material === waterMat || o.material === airMat) return;
    let p = o;
    while (p && p !== planet) {
      if (dynamic.has(p)) return;
      p = p.parent;
    }
    const key = `${o.material.uuid}/${o.castShadow}/${o.receiveShadow}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(o);
  });
  for (const objects of buckets.values()) {
    if (objects.length < 2) continue;
    const parts = objects.map((o) => {
      let g = o.geometry.clone().applyMatrix4(o.matrixWorld);
      if (g.index) {
        const next = g.toNonIndexed();
        g.dispose();
        g = next;
      }
      g.deleteAttribute("uv");
      return g;
    });
    const merged = mergeGeometries(parts, false);
    parts.forEach((g) => g.dispose());
    if (!merged) continue;
    const baked = new THREE5.Mesh(merged, objects[0].material);
    baked.castShadow = objects[0].castShadow;
    baked.receiveShadow = objects[0].receiveShadow;
    planet.add(baked);
    objects.forEach((o) => o.removeFromParent());
  }
  const surfPoint = new THREE5.Vector3();
  let env = { rain: 0, snow: 0, cloud: 0.25, wind: 0.3, night: 0, mist: 0 }, effect = "", effectUntil = 0, elapsed = 0, growth = savedGrowth;
  function trigger(id, newGrowth = growth) {
    effect = id;
    effectUntil = elapsed + (id === "rainbow" ? 32 : 19);
    growth = newGrowth;
    appleGroup.visible = id === "apple";
    rainbow.visible = id === "rainbow";
    if (id === "apple") {
      appleGroup.position.copy(residents[0].normal).multiplyScalar(terrainHeight(residents[0].normal));
      appleGroup.quaternion.setFromUnitVectors(UP, residents[0].normal);
    }
  }
  function update(dt, t, nextEnv) {
    elapsed = t;
    env = nextEnv;
    const active = t < effectUntil ? effect : "", fade = Math.min(1, Math.max(0, effectUntil - t) / 3), wind = env.wind + (active === "petals" ? 0.8 : 0);
    natureUniforms.uNatureTime.value = t;
    natureUniforms.uWind.value = 0.25 + wind * 1.3;
    natureUniforms.uDaylight.value = 1 - env.night * 0.8;
    natureUniforms.uSnow.value = env.snow;
    residents.forEach((p, i) => natureUniforms.uActors.value[i].copy(p.root.position));
    waterMat.color.set("#ffffff").lerp(new THREE5.Color("#adcdeb"), env.night);
    surf.forEach((s) => {
      const phase = (t * 0.12 + s.band / 3) % 1, advance = -0.074 + phase * 0.07;
      for (let j = 0; j < s.samples.length; j++) {
        const sample = s.samples[j], ripple = Math.sin(j / 160 * Math.PI * 18 - t * 0.9) * 2e-3;
        for (let side = 0; side < 2; side++) {
          const r = sample.r + advance + ripple + side * (9e-3 + Math.sin(j * 0.31 + t) * 15e-4), a = Math.cos(r), b = Math.sin(r), nx = s.center.x * a + sample.tangent.x * b, ny = s.center.y * a + sample.tangent.y * b, nz = s.center.z * a + sample.tangent.z * b, depth = Math.max(0, (sample.r - r) * sample.depthSlope), height = R + 0.01 + sampleWater(surfPoint.set(nx * R, ny * R, nz * R), depth, t, natureUniforms.uWind.value), offset = (j * 2 + side) * 3;
          s.positions[offset] = nx * height;
          s.positions[offset + 1] = ny * height;
          s.positions[offset + 2] = nz * height;
        }
      }
      s.wave.geometry.attributes.position.needsUpdate = true;
      s.wave.material.opacity = Math.sin(phase * Math.PI) * (0.74 - env.night * 0.22);
    });
    const boatNormal = direction(-0.32 + Math.sin(t * 0.045) * 0.06, 0.67 + Math.cos(t * 0.04) * 0.08), boatPoint = boatNormal.clone().multiplyScalar(R), boatDepth = Math.max(0, R - terrainHeight(boatNormal));
    const buoyancy = sampleWater(boatPoint, boatDepth, t, natureUniforms.uWind.value);
    boat.position.copy(boatNormal).multiplyScalar(R + 0.038 + buoyancy);
    boat.quaternion.setFromUnitVectors(UP, boatNormal);
    const bx = new THREE5.Vector3(1, 0, 0).applyQuaternion(boat.quaternion), bz = new THREE5.Vector3(0, 0, 1).applyQuaternion(boat.quaternion);
    const slopeX = (sampleWater(boatPoint.clone().addScaledVector(bx, 0.06), boatDepth, t, natureUniforms.uWind.value) - sampleWater(boatPoint.clone().addScaledVector(bx, -0.06), boatDepth, t, natureUniforms.uWind.value)) / 0.12;
    const slopeZ = (sampleWater(boatPoint.clone().addScaledVector(bz, 0.06), boatDepth, t, natureUniforms.uWind.value) - sampleWater(boatPoint.clone().addScaledVector(bz, -0.06), boatDepth, t, natureUniforms.uWind.value)) / 0.12;
    boatBody.rotation.set(Math.atan(slopeZ) * 0.7, 0.6 + Math.sin(t * 0.1) * 0.16, -Math.atan(slopeX) * 0.7);
    airMat.uniforms.strength.value = 0.08 + env.mist * 0.18;
    airMat.uniforms.tint.value.set(env.night > 0.5 ? "#b4cdef" : "#d5f5f7");
    foliage.forEach((f) => {
      const gust = windAt(f.g.parent.parent.position, t, natureUniforms.uWind.value);
      f.g.rotation.z = (0.45 + Math.sin(t * 1.1 + f.phase)) * f.amount * gust * 1.7;
      f.g.rotation.x = Math.cos(t * 0.85 + f.phase) * f.amount * 0.7 * gust;
    });
    snowUniform.value = env.snow;
    snowCaps.forEach((c) => {
      c.visible = env.snow > 0.2;
    });
    glowMaterials.forEach((g) => g.emissiveIntensity = 0.15 + env.night * 2.1 + env.rain * 0.6 + env.snow * 0.4);
    rotor.rotation.z -= dt * (0.35 + wind * 0.8);
    cloudRoot.rotation.y = t * 0.016;
    clouds.forEach((c, i) => {
      c.g.visible = !planet.userData.closeView && i < 3 + Math.round(env.cloud * 8);
      c.material.opacity = 0.66 + env.cloud * 0.21;
      c.material.color.set(env.rain > 0.5 ? "#becbc7" : env.night > 0.5 ? "#8a9aab" : "#f8f1df");
      c.g.scale.y = 0.8 + Math.sin(t * 0.5 + c.phase) * 0.04;
    });
    construction.update(t, env.buildPaused);
    residents.forEach((p) => {
      let lon = p.lon + Math.sin(t * 0.055 + p.phase) * 0.45, lat = pathLat(lon), speed = 6e-3;
      if (env.rain > 0.35 || env.snow > 0.35 || env.night > 0.65) {
        const h = houseSites[p.i % houseSites.length];
        lon = h.lon - 0.035 - (p.i === 5 ? 0.055 : 0);
        lat = h.lat - 0.13;
      }
      if (active === "gathering") {
        lon = 0.1 + (p.i - 2.5) * 0.037;
        lat = 0.36 + Math.sin(p.i) * 0.035;
      }
      if (active === "harvest" && p.i < 2) {
        lon = -0.02 + (p.i ? -0.05 : 0.05);
        lat = 0.08;
      }
      if (active === "apple" && p.i === 0) {
        lon = Math.atan2(appleGroup.position.x, appleGroup.position.z);
        lat = Math.asin(appleGroup.position.clone().normalize().y) - 0.02;
      }
      const builder = construction.workerPose(p.i, env.buildPaused);
      const target = builder ? builder.normal : direction(lat, lon), previous = p.normal.clone();
      p.normal.lerp(target, 1 - Math.exp(-dt * (builder ? 3 : 0.8))).normalize();
      speed = previous.distanceTo(p.normal) / Math.max(dt, 1e-3);
      moveOnSurface(p.root, p.normal);
      const tangent = p.normal.clone().sub(previous).applyQuaternion(p.root.quaternion.clone().invert());
      if (tangent.lengthSq() > 1e-10) {
        const desired = Math.atan2(tangent.x, tangent.z);
        p.heading += Math.atan2(Math.sin(desired - p.heading), Math.cos(desired - p.heading)) * Math.min(1, dt * 8);
      }
      if (builder && builder.mode === "build") {
        const face = builder.lookAt.clone().sub(p.normal).applyQuaternion(p.root.quaternion.clone().invert());
        p.heading = Math.atan2(face.x, face.z);
      }
      p.body.rotation.y = p.heading;
      const walk = Math.min(1, speed * 95), swing = Math.sin(t * 9 + p.phase) * 0.48 * walk;
      p.limbs[0].rotation.x = swing;
      p.limbs[2].rotation.x = -swing;
      p.limbs[1].rotation.x = -swing * 0.6;
      p.limbs[3].rotation.x = swing * 0.6;
      p.body.position.y = Math.abs(Math.sin(t * 9 + p.phase)) * 6e-3 * walk;
      p.umbrella.visible = env.rain > 0.35;
      p.carry.visible = builder?.mode === "carry";
      p.hammer.visible = builder?.mode === "build";
      if (p.carry.visible) {
        p.limbs[1].rotation.x = p.limbs[3].rotation.x = -1.18;
      }
      if (p.hammer.visible) {
        p.limbs[3].rotation.x = -0.8 + Math.sin(t * 7 + p.phase) * 0.7;
        p.body.position.y = Math.max(0, Math.sin(t * 7 + p.phase)) * 6e-3;
      }
      p.head.rotation.z = Math.sin(t * 1.7 + p.phase) * 0.035;
      p.tail.rotation.y = Math.sin(t * 2.1 + p.phase) * 0.14;
      p.activity = builder ? { carry: "\u6B63\u5728\u642C\u6728\u6599", build: "\u6B63\u5728\u6572\u6572\u6253\u6253", walk: "\u53BB\u53D6\u4E0B\u4E00\u4EFD\u6750\u6599", rest: "\u4F11\u606F\u4E00\u4F1A\u513F" }[builder.mode] : "\u5728\u5C9B\u4E0A\u6563\u6B65";
    });
    animals.forEach((a) => {
      a.body.position.y = Math.max(0, Math.sin(t * 1.5 + a.phase)) * 0.024;
      a.body.rotation.y = Math.sin(t * 0.18 + a.phase) * 0.5;
      a.g.visible = env.rain < 0.5 && !(env.petAway && a === travelPet);
    });
    butterflies.forEach((b, i) => {
      b.root.visible = env.rain < 0.4 && env.snow < 0.4 && env.night < 0.65 && (i < 3 || active === "butterflies");
      const nn = direction(0.02 + Math.sin(t * 0.6 + i) * 0.045, -0.1 + Math.cos(t * 0.32 + i) * 0.14 + i * 0.027);
      moveOnSurface(b.root, nn, 0.18 + Math.sin(t * 2 + i) * 0.04);
      b.root.rotateY(t * 0.4 + i);
      b.left.rotation.z = Math.sin(t * 15 + i) * 0.95;
      b.right.rotation.z = -Math.sin(t * 15 + i) * 0.95;
    });
    birds.forEach((b, i) => {
      b.root.visible = env.rain < 0.4 && env.snow < 0.4 && env.night < 0.7 && (i < 2 || active === "birds");
      const nn = direction(0.7 + Math.sin(t * 0.3 + i) * 0.06, t * 0.12 + i * 0.08);
      b.root.position.copy(nn).multiplyScalar(R + 1 + i * 0.045);
      b.root.quaternion.setFromUnitVectors(UP, nn);
      b.root.rotateY(Math.PI / 2);
      b.left.rotation.x = Math.sin(t * 6 + i) * 0.6;
      b.right.rotation.x = -Math.sin(t * 6 + i) * 0.6;
    });
    rain.visible = env.rain > 0.02;
    snow.visible = env.snow > 0.02;
    rainMat.opacity = env.rain * 0.48;
    snow.material.uniforms.opacity.value = env.snow * 0.9;
    if (rain.visible || snow.visible) for (let i = 0; i < particleCount; i++) {
      const nn = particleDirs[i], fall = (particlePhase[i] + t * (rain.visible ? 0.83 : 0.065)) % 1, h = terrainHeight(nn) + 0.035 + (1 - fall) * 1.1;
      for (let j = 0; j < 3; j++) {
        const v = nn.getComponent(j);
        particlePos[i * 6 + j] = v * h;
        particlePos[i * 6 + 3 + j] = v * (h + 0.075);
        snowPos[i * 3 + j] = v * h + Math.sin(t * 0.8 + i + j) * 0.023;
      }
    }
    if (rain.visible) rainGeo.attributes.position.needsUpdate = true;
    if (snow.visible) snowGeo.attributes.position.needsUpdate = true;
    fireflies.visible = env.night > 0.25 || active === "fireflies";
    if (fireflies.visible) {
      fireflies.material.uniforms.opacity.value = (0.5 + Math.sin(t * 1.8) * 0.2) * Math.max(env.night, active === "fireflies" ? fade : 0);
      for (let i = 0; i < fireflyCount; i++) {
        const nn = direction(Math.sin(i * 7.3) * 0.8 + Math.sin(t * 0.25 + i) * 0.02, i * 2.4 + t * 0.016);
        const h = terrainHeight(nn) + 0.12 + Math.sin(t + i) * 0.05;
        fireflyPos.set(nn.multiplyScalar(h).toArray(), i * 3);
      }
      fireflyGeo.attributes.position.needsUpdate = true;
    }
    petalFX.visible = active === "petals";
    if (petalFX.visible) {
      petalFX.material.uniforms.opacity.value = fade * 0.9;
      for (let i = 0; i < 100; i++) {
        const nn = direction(0.1 + Math.sin(i * 3.1 + t * 0.19) * 0.8, i * 2.4 + t * 0.07);
        petalPos.set(nn.multiplyScalar(terrainHeight(nn) + 0.12 + i % 7 * 0.035).toArray(), i * 3);
      }
      petalGeo.attributes.position.needsUpdate = true;
    }
    lakeRipples.forEach((r, i) => {
      const phase = (t * (0.24 + env.rain * 0.3) + i * 0.23) % 1;
      r.scale.setScalar(0.4 + phase * (env.rain > 0.3 || active === "ripples" ? 3 : 1.7));
      r.material.opacity = (1 - phase) * (0.22 + env.rain * 0.3);
    });
    growthPlants.forEach((g, i) => g.scale.lerp(new THREE5.Vector3().setScalar(i < growth ? 1 : 0.015), Math.min(1, dt * 0.8)));
    if (appleGroup.visible) {
      apple.position.y = 0.07 + Math.abs(Math.cos(Math.min(3, t - (effectUntil - 19)) * 3.2)) * Math.exp(-Math.min(5, t - (effectUntil - 19)) * 1.5) * 0.6;
      if (!active) appleGroup.visible = false;
    }
    rainbow.visible = active === "rainbow";
    rainbow.children.forEach((c) => c.material.opacity = 0.4 * fade);
  }
  return { planet, construction, land, ocean, boat, surf, meadow, landscape, canopy, natureUniforms, shoreFrames, residents, travelPet, stats, update, trigger, terrainHeight, houseSites, lakes, growthPlants, clouds, rain, snow, waterMat, glowMaterials, dispose() {
    construction.dispose();
    meadow.dispose();
    landscape.dispose();
    crownDepth.dispose();
    const gs = /* @__PURE__ */ new Set(), ms = /* @__PURE__ */ new Set();
    planet.traverse((o) => {
      if (o.geometry) gs.add(o.geometry);
      if (o.material) ms.add(o.material);
    });
    gs.forEach((g) => g.dispose());
    ms.forEach((m2) => m2.dispose());
    gradientMap.dispose();
  } };
}
var R, UP, lakes;
var init_world = __esm({
  "work/planet-v2/world.js"() {
    init_villagers();
    init_build_scene();
    init_construction();
    init_landscape();
    init_ecology();
    init_nature();
    R = 2.45;
    UP = new THREE5.Vector3(0, 1, 0);
    lakes = [direction(-0.32, 0.72), direction(-0.45, -2.1), direction(-0.8, 2.7)];
  }
});

// work/planet-v2/check-builders.js
import * as THREE6 from "three";
import { SVGRenderer } from "three/examples/jsm/renderers/SVGRenderer.js";
import { parseHTML } from "linkedom";
import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs";
var require_check_builders = __commonJS({
  "work/planet-v2/check-builders.js"() {
    init_world();
    var { document } = parseHTML("<html><body></body></html>");
    globalThis.document = document;
    var world = createWorld(3, 48);
    world.update(1 / 60, 14, { rain: 0, snow: 0, cloud: 0.2, wind: 0.35, night: 0, mist: 0 });
    world.planet.quaternion.setFromUnitVectors(direction(0.59, 0.48), new THREE6.Vector3(0, 1, 0));
    world.planet.userData.closeView = true;
    world.update(1 / 60, 14, { rain: 0, snow: 0, cloud: 0.2, wind: 0.35, night: 0, mist: 0 });
    for (let i = 0; i < 180; i++) world.update(1 / 30, 14 + i / 30, { rain: 0, snow: 0, cloud: 0.2, wind: 0.35, night: 0, mist: 0 });
    var scene = new THREE6.Scene();
    scene.background = new THREE6.Color("#d9f1f8");
    scene.add(world.planet);
    scene.add(new THREE6.AmbientLight("#dae5e7", 1));
    var sun = new THREE6.DirectionalLight("#fff9e5", 0.55);
    sun.position.set(-3.5, 6, 7);
    scene.add(sun);
    var replacements = /* @__PURE__ */ new Map();
    world.planet.traverse((o) => {
      if (o.material?.isMeshToonMaterial || o.material?.isMeshStandardMaterial) {
        const original = o.material;
        if (!replacements.has(original)) replacements.set(original, new THREE6.MeshLambertMaterial({ color: original.color, vertexColors: original.vertexColors, side: original.side, transparent: original.transparent, opacity: original.opacity }));
        o.material = replacements.get(original);
      }
    });
    var expansions = [];
    world.planet.traverse((o) => {
      if (o.material?.isShaderMaterial) o.visible = false;
      if (o.isInstancedMesh) expansions.push(o);
    });
    for (const im of expansions) {
      for (let i = 0; i < im.count; i += im.name === "Wind meadow" ? 12 : im.count > 2e3 ? 4 : 1) {
        const color = new THREE6.Color();
        if (im.instanceColor) im.getColorAt(i, color);
        const material = im.material.clone();
        material.color.multiply(color);
        const mesh = new THREE6.Mesh(im.geometry, material), mat = new THREE6.Matrix4();
        im.getMatrixAt(i, mat);
        mat.decompose(mesh.position, mesh.quaternion, mesh.scale);
        im.parent.add(mesh);
      }
      im.removeFromParent();
    }
    var camera = new THREE6.PerspectiveCamera(38, 1e3 / 740, 0.1, 60);
    camera.position.set(1.2, 5.75, 1.65);
    camera.lookAt(0, 2.67, 0);
    var renderer = new SVGRenderer();
    renderer.setSize(1e3, 740);
    renderer.setPrecision(2);
    renderer.render(scene, camera);
    renderer.domElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    var svg = renderer.domElement.outerHTML;
    fs.writeFileSync("work/planet-v2/composition-builders.svg", svg);
    fs.writeFileSync("work/planet-v2/composition-builders.png", new Resvg(svg, { background: "#d9f1f8" }).render().asPng());
    console.log("Saved software composition check (WebGL materials and shadows are not represented).");
  }
});
export default require_check_builders();
