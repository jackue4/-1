var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// work/planet-v2/check-composition.js
var THREE2 = __toESM(require("three"));
var import_SVGRenderer = require("three/examples/jsm/renderers/SVGRenderer.js");
var import_linkedom = require("linkedom");
var import_resvg_js = require("@resvg/resvg-js");
var import_node_fs = __toESM(require("node:fs"));

// work/planet-v2/world.js
var THREE = __toESM(require("three"));
var import_BufferGeometryUtils = require("three/examples/jsm/utils/BufferGeometryUtils.js");

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

// work/planet-v2/world.js
var R = 2.45;
var UP = new THREE.Vector3(0, 1, 0);
function direction(lat, lon) {
  return new THREE.Vector3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon));
}
var lakes = [direction(-0.12, 0.62), direction(0.2, -2.1), direction(-0.8, 2.7)];
function terrainHeight(n) {
  const hills = 0.037 * Math.sin(n.x * 9 + n.z * 3) * Math.cos(n.y * 11 - n.z * 4) + 0.022 * Math.sin(n.z * 17 + n.x * 8);
  let h = R + 0.072 + hills;
  for (let i = 0; i < lakes.length; i++) {
    const d = n.distanceTo(lakes[i]);
    h -= 0.23 * Math.exp(-Math.pow(d / (0.32 + i * 0.035), 4));
  }
  return h;
}
function createWorld(savedGrowth = 0) {
  const rng = random(hash("little-bloom-landscape-v2")), planet = new THREE.Group();
  const materials = /* @__PURE__ */ new Map(), sphere = new THREE.SphereGeometry(1, 10, 8), ico = new THREE.IcosahedronGeometry(1, 1), box = new THREE.BoxGeometry(1, 1, 1), cyl = new THREE.CylinderGeometry(1, 1, 1, 8), cone = new THREE.ConeGeometry(1, 1, 7);
  const foliage = [], clouds = [], residents = [], birds = [], butterflies = [], glowMaterials = [], lakeRipples = [], growthPlants = [], snowCaps = [];
  const stats = { trees: 0, flowers: 0, residents: 6, shrubs: 0 };
  const m = (color, roughness = 0.86) => {
    const key = `${color}/${roughness}`;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness }));
    return materials.get(key);
  };
  function mesh(parent, geo2, color, position = [0, 0, 0], scale = [1, 1, 1], shadow = true) {
    const o = new THREE.Mesh(geo2, typeof color === "object" ? color : m(color));
    o.position.set(...position);
    o.scale.set(...scale);
    o.castShadow = shadow;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  function anchor(n2, elevation = 0) {
    const g = new THREE.Group();
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
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), o = mesh(parent, cyl, color);
    o.position.copy(start).add(end).multiplyScalar(0.5);
    o.scale.set(width, start.distanceTo(end), width);
    o.quaternion.setFromUnitVectors(UP, end.sub(start).normalize());
    return o;
  }
  const geo = new THREE.SphereGeometry(1, 160, 100), pos = geo.attributes.position, colors = [], n = new THREE.Vector3();
  const sand = new THREE.Color("#dfcb9a"), low = new THREE.Color("#a5c984"), high = new THREE.Color("#88b67b");
  for (let i = 0; i < pos.count; i++) {
    n.fromBufferAttribute(pos, i).normalize();
    const h = terrainHeight(n);
    pos.setXYZ(i, n.x * h, n.y * h, n.z * h);
    const c = h < R + 0.027 ? sand.clone().lerp(low, Math.max(0, (h - R - 6e-3) / 0.021)) : low.clone().lerp(high, Math.max(0, Math.min(1, (h - R - 0.05) * 12)));
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const snowUniform = { value: 0 };
  const landMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.94 });
  landMat.onBeforeCompile = (shader) => {
    shader.uniforms.uSnow = snowUniform;
    shader.fragmentShader = "uniform float uSnow;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(.82,.86,.79), uSnow*.65);");
  };
  const land = mesh(planet, geo, landMat);
  const waterMat = new THREE.MeshStandardMaterial({ color: "#70bcba", roughness: 0.26, metalness: 0.08 });
  const waterUniforms = { time: { value: 0 } };
  waterMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = waterUniforms.time;
    shader.vertexShader = "uniform float uTime;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\ntransformed += normal * (sin(position.x*20.0+uTime)*sin(position.z*17.0+uTime*.7)*.003);");
  };
  mesh(planet, new THREE.SphereGeometry(R, 128, 80), waterMat, [0, 0, 0], [1, 1, 1], false);
  const airMat = new THREE.ShaderMaterial({ uniforms: { tint: { value: new THREE.Color("#b9daba") }, strength: { value: 0.12 } }, vertexShader: "varying vec3 N; varying vec3 V; void main(){vec4 p=modelViewMatrix*vec4(position,1.);N=normalize(normalMatrix*normal);V=normalize(-p.xyz);gl_Position=projectionMatrix*p;}", fragmentShader: "varying vec3 N; varying vec3 V; uniform vec3 tint; uniform float strength; void main(){float a=pow(1.-abs(dot(normalize(N),normalize(V))),3.)*strength;gl_FragColor=vec4(tint,a);}", transparent: true, depthWrite: false, side: THREE.BackSide });
  mesh(planet, new THREE.SphereGeometry(R + 0.14, 64, 48), airMat, [0, 0, 0], [1, 1, 1], false);
  function tree(normal, size, pink = false) {
    const root = anchor(normal), g = new THREE.Group();
    root.add(g);
    g.scale.setScalar(size);
    stats.trees++;
    mesh(g, cyl, "#92705a", [0, 0.24, 0], [0.045, 0.48, 0.047]);
    stem(g, [0, 0.22, 0], [-0.15, 0.43, 0.04], 0.025, "#92705a");
    stem(g, [0, 0.28, 0], [0.12, 0.48, -0.04], 0.025, "#92705a");
    const crown = new THREE.Group();
    g.add(crown);
    crown.position.y = 0.43;
    const palette = pink ? ["#e9b6b8", "#f0c5c1", "#dfaaa9"] : ["#648f63", "#7fa870", "#94b780"];
    for (let j = 0; j < 4; j++) {
      const angle = j * 2.4;
      const leaf = mesh(crown, ico, palette[j % 3], [Math.sin(angle) * 0.12, j === 3 ? 0.19 : 0.02, Math.cos(angle) * 0.12], [0.23, 0.24, 0.22]);
      leaf.rotation.y = rng() * 3;
    }
    const cap = mesh(crown, sphere, "#eff1e4", [0, 0.29, 0], [0.17, 0.04, 0.16], false);
    cap.visible = false;
    snowCaps.push(cap);
    foliage.push({ g: crown, phase: rng() * 6, amount: 0.035 });
    if (!pink && stats.trees % 4 === 0) for (let j = 0; j < 3; j++) mesh(crown, sphere, "#d48662", [Math.sin(j * 2) * 0.22, -0.055 + j * 0.055, Math.cos(j * 2) * 0.21], [0.042, 0.044, 0.04]);
    return root;
  }
  const houseSites = [{ lat: 0.59, lon: 0.48 }, { lat: 0.15, lon: -0.62 }, { lat: 0.58, lon: 1.58 }, { lat: -0.5, lon: -1.1 }, { lat: 0.48, lon: 2.83 }];
  const pathLat = (lon) => 0.29 + 0.095 * Math.sin(lon * 3);
  for (let i = 0, made = 0; i < 800 && made < 39; i++) {
    const nn = direction(Math.asin(rng() * 1.84 - 0.92), rng() * Math.PI * 2);
    const lon = Math.atan2(nn.x, nn.z);
    if (terrainHeight(nn) < R + 0.035 || Math.abs(Math.asin(nn.y) - pathLat(lon)) < 0.105 || houseSites.some((h) => nn.distanceTo(direction(h.lat, h.lon)) < 0.25)) continue;
    tree(nn, 0.75 + rng() * 0.45, made % 6 === 0);
    made++;
  }
  [[0.2, -0.28], [0.04, -0.4], [0.05, 1], [0.48, -0.3], [0.83, 0.05]].forEach(([lat, lon], i) => tree(direction(lat, lon), 0.8 + i * 0.035, i === 3));
  function instances(geometry, color, transforms) {
    const im = new THREE.InstancedMesh(geometry, m(color), transforms.length);
    transforms.forEach((matrix2, i) => im.setMatrixAt(i, matrix2));
    im.instanceMatrix.needsUpdate = true;
    im.receiveShadow = true;
    im.castShadow = false;
    im.computeBoundingSphere();
    planet.add(im);
    return im;
  }
  const dummy = new THREE.Object3D(), tempRoot = new THREE.Object3D();
  function matrix(normal, local, scale, twist = 0) {
    tempRoot.position.copy(normal).multiplyScalar(terrainHeight(normal));
    tempRoot.quaternion.setFromUnitVectors(UP, normal);
    tempRoot.updateMatrix();
    dummy.position.set(...local);
    dummy.rotation.set(0, twist, 0);
    dummy.scale.set(...scale);
    dummy.updateMatrix();
    return new THREE.Matrix4().multiplyMatrices(tempRoot.matrix, dummy.matrix);
  }
  const stones = [], grasses = [], stems = [], flowerCenters = [], petals = [[], [], []];
  for (let i = 0; i < 150; i++) {
    const lon = i / 150 * Math.PI * 2, nn = direction(pathLat(lon), lon);
    if (terrainHeight(nn) > R + 0.025) stones.push(matrix(nn, [0, 9e-3, 0], [0.034 + rng() * 0.014, 0.012, 0.024 + rng() * 0.014], rng() * 6));
  }
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
  instances(ico, "#d0c8aa", stones);
  instances(cone, "#71976b", grasses);
  instances(cyl, "#708b51", stems);
  instances(sphere, "#e9b85f", flowerCenters);
  ["#eedad0", "#e9b8b6", "#f3dea1"].forEach((c, i) => instances(sphere, c, petals[i]));
  for (let i = 0; i < 22; i++) {
    const nn = direction(Math.asin(rng() * 2 - 1), rng() * 6.28);
    if (terrainHeight(nn) < R + 0.05) continue;
    const g = anchor(nn);
    mesh(g, ico, "#93b27b", [0, 0.07, 0], [0.15, 0.12, 0.13]);
    stats.shrubs++;
  }
  function house(site, index) {
    const g = anchor(direction(site.lat, site.lon)), house2 = new THREE.Group();
    house2.rotation.y = index * 0.75;
    g.add(house2);
    const walls = ["#f1e5c9", "#ecdfce", "#d4dfce", "#e6d4bc", "#e6dccb"];
    mesh(house2, box, "#c6b493", [0, 0.025, 0], [0.47, 0.06, 0.38]);
    mesh(house2, box, walls[index], [0, 0.21, 0], [0.39, 0.37, 0.32]);
    const roofGeo = new THREE.BufferGeometry();
    const w = 0.25, y = 0.4, top = 0.59, d = 0.21;
    roofGeo.setAttribute("position", new THREE.Float32BufferAttribute([-w, y, d, w, y, d, 0, top, d, -w, y, -d, 0, top, -d, w, y, -d, -w, y, d, 0, top, d, 0, top, -d, -w, y, d, 0, top, -d, -w, y, -d, w, y, d, w, y, -d, 0, top, -d, w, y, d, 0, top, -d, 0, top, d], 3));
    roofGeo.computeVertexNormals();
    const roofMat = m(index % 2 ? "#9aaea0" : "#c08d76");
    roofMat.side = THREE.DoubleSide;
    mesh(house2, roofGeo, roofMat);
    mesh(house2, box, "#a18970", [-0.06, 0.13, 0.169], [0.08, 0.22, 0.024]);
    mesh(house2, sphere, "#dfc384", [-0.035, 0.13, 0.185], [0.011, 0.011, 9e-3]);
    const windowMat = new THREE.MeshStandardMaterial({ color: "#f1d894", emissive: "#ffd88a", emissiveIntensity: 0.12, roughness: 0.5 });
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
    return g;
  }
  houseSites.forEach(house);
  const millRoot = anchor(direction(0.59, -0.11)), mill = new THREE.Group();
  millRoot.add(mill);
  mill.rotation.y = 0.3;
  mesh(mill, new THREE.CylinderGeometry(0.12, 0.17, 0.58, 10), "#ede1bf", [0, 0.29, 0]);
  mesh(mill, cone, "#ad8a71", [0, 0.65, 0], [0.23, 0.25, 0.23]);
  mesh(mill, box, "#92795c", [0, 0.105, 0.155], [0.075, 0.18, 0.025]);
  const rotor = new THREE.Group();
  rotor.position.set(0, 0.46, 0.2);
  mill.add(rotor);
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Group();
    blade.rotation.z = i * Math.PI / 2;
    rotor.add(blade);
    mesh(blade, box, "#e9d9b7", [0, 0.19, 0], [0.037, 0.42, 0.027]);
    mesh(blade, box, "#d8c39e", [0.055, 0.24, 0], [0.12, 0.22, 0.024]);
    for (let j = 0; j < 3; j++) mesh(blade, box, "#f2e8d1", [0.055, 0.17 + j * 0.065, 0.016], [0.125, 0.012, 0.01]);
  }
  mesh(rotor, sphere, "#9d8061", [0, 0, 0.027], [0.055, 0.055, 0.034]);
  const lakeFrame = new THREE.Group();
  lakeFrame.quaternion.setFromUnitVectors(UP, lakes[0]);
  lakeFrame.position.copy(lakes[0]).multiplyScalar(R + 9e-3);
  planet.add(lakeFrame);
  for (let i = 0; i < 5; i++) mesh(lakeFrame, box, "#b39777", [-0.36 + i * 0.065, 0.02, -0.45], [0.055, 0.036, 0.25]);
  for (const x of [-0.39, -0.09]) for (const z of [-0.53, -0.36]) mesh(lakeFrame, cyl, "#9c8068", [x, -0.035, z], [0.013, 0.17, 0.013]);
  const rippleMat = new THREE.MeshBasicMaterial({ color: "#e7f5cf", transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide });
  for (let i = 0; i < 8; i++) {
    const angle = i * 2.4, rr = 0.12 + i * 0.039;
    const ring = mesh(lakeFrame, new THREE.RingGeometry(0.06, 0.064, 28), rippleMat.clone(), [Math.sin(angle) * rr, 0.016, Math.cos(angle) * rr], [1, 1, 1], false);
    ring.rotation.x = -Math.PI / 2;
    lakeRipples.push(ring);
  }
  for (let i = 0; i < 5; i++) {
    const nn = lakes[0].clone().add(new THREE.Vector3(Math.sin(i * 2) * 0.085, Math.cos(i * 2) * 0.025, 0)).normalize(), g = new THREE.Group();
    g.quaternion.setFromUnitVectors(UP, nn);
    g.position.copy(nn).multiplyScalar(R + 9e-3);
    planet.add(g);
    mesh(g, new THREE.CylinderGeometry(0.047, 0.05, 8e-3, 12, 1, false, 0.2, 5.7), "#689b78");
    if (i % 2 === 0) mesh(g, sphere, "#f0c5bd", [0, 0.014, 0], [0.016, 0.014, 0.016]);
  }
  const garden = anchor(direction(0.03, -0.02));
  for (let i = 0; i < 12; i++) {
    const g = new THREE.Group();
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
  const names = ["\u963F\u79BE", "\u5C0F\u6817", "\u60A0\u60A0", "\u6728\u6728", "\u6843\u5B50", "\u5C0F\u6EE1"], coats = ["#dcaa89", "#8dada9", "#baacc6", "#dbbf76", "#c99798", "#98ad7e"];
  for (let i = 0; i < 6; i++) {
    const root = new THREE.Group();
    planet.add(root);
    const body = new THREE.Group();
    root.add(body);
    mesh(body, new THREE.CapsuleGeometry(0.059, 0.09, 3, 8), coats[i], [0, 0.18, 0]);
    mesh(body, sphere, "#edc5a4", [0, 0.315, 0], [0.08, 0.079, 0.074]);
    mesh(body, sphere, "#91715b", [0, 0.343, -0.012], [0.082, 0.06, 0.073]);
    mesh(body, cyl, i % 2 ? "#cfbc88" : "#e0cb96", [0, 0.371, 0], [0.078, 0.028, 0.078]);
    mesh(body, cyl, "#e6d2a6", [0, 0.36, 0], [0.105, 0.012, 0.093]);
    for (const x of [-0.025, 0.025]) mesh(body, sphere, "#4c5144", [x, 0.319, 0.068], [8e-3, 9e-3, 6e-3]);
    const limbs = [];
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      leg.position.set(side * 0.034, 0.119, 0);
      body.add(leg);
      mesh(leg, cyl, "#756e61", [0, -0.04, 0], [0.019, 0.09, 0.02]);
      mesh(leg, sphere, "#eee1c5", [0, -0.085, 0.012], [0.025, 0.019, 0.036]);
      limbs.push(leg);
      const arm = new THREE.Group();
      arm.position.set(side * 0.068, 0.23, 0);
      body.add(arm);
      mesh(arm, cyl, coats[i], [0, -0.047, 0], [0.02, 0.087, 0.02]);
      mesh(arm, sphere, "#edc5a4", [0, -0.092, 0], [0.02, 0.02, 0.02]);
      limbs.push(arm);
    }
    const pack = mesh(body, box, "#a78366", [0, 0.194, -0.06], [0.08, 0.1, 0.045]);
    pack.rotation.x = 0.1;
    const umbrella = new THREE.Group();
    body.add(umbrella);
    umbrella.position.set(0.09, 0, 0);
    mesh(umbrella, cyl, "#c5b791", [0, 0.38, 0], [8e-3, 0.4, 8e-3]);
    mesh(umbrella, new THREE.SphereGeometry(0.19, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), i % 2 ? "#b1c6b5" : "#d8b2a4", [0, 0.51, 0], [1, 0.4, 1]);
    umbrella.visible = false;
    const lon = 0.04 + i * 1.04, nn = direction(pathLat(lon), lon);
    moveOnSurface(root, nn);
    residents.push({ root, body, limbs, umbrella, name: names[i], i, lon, normal: nn.clone(), phase: rng() * 6, heading: 0 });
  }
  const animals = [];
  for (let i = 0; i < 4; i++) {
    const nn = direction(-0.31 + i * 0.13, -0.36 - i * 0.11), g = anchor(nn), body = new THREE.Group();
    g.add(body);
    mesh(body, sphere, "#eee8d4", [0, 0.09, 0], [0.085, 0.065, 0.115]);
    mesh(body, sphere, "#e8e3d1", [0, 0.14, 0.085], [0.053, 0.052, 0.053]);
    for (const x of [-0.025, 0.025]) mesh(body, sphere, "#e6ddc6", [x, 0.218, 0.078], [0.015, 0.071, 0.018]);
    mesh(body, sphere, "#f4f0e4", [0, 0.1, -0.1], [0.04, 0.04, 0.04]);
    for (const x of [-0.026, 0.026]) mesh(body, sphere, "#696453", [x, 0.15, 0.127], [6e-3, 7e-3, 5e-3]);
    animals.push({ g, body, nn, phase: i * 1.7 });
  }
  const cloudRoot = new THREE.Group();
  planet.add(cloudRoot);
  for (let i = 0; i < 11; i++) {
    const nn = direction(0.5 + Math.sin(i * 2.7) * 0.6, i * 2.399), g = new THREE.Group();
    g.position.copy(nn).multiplyScalar(R + 0.64 + i % 3 * 0.06);
    g.quaternion.setFromUnitVectors(UP, nn);
    cloudRoot.add(g);
    const material = new THREE.MeshStandardMaterial({ color: "#faf3df", roughness: 1, transparent: true, opacity: 0.86, depthWrite: false });
    for (let j = 0; j < 4; j++) mesh(g, sphere, material, [(j - 1.5) * 0.16, Math.sin(j * 2) * 0.035, 0], [0.2, 0.09 + j % 2 * 0.046, 0.115], false);
    g.scale.setScalar(0.8 + i % 3 * 0.1);
    clouds.push({ g, material, phase: i * 2 });
  }
  for (let i = 0; i < 8; i++) {
    const root = new THREE.Group();
    planet.add(root);
    const material = m(i % 2 ? "#e2b177" : "#adbacb");
    const left = mesh(root, sphere, material, [-0.03, 0, 0], [0.04, 7e-3, 0.03], false), right = mesh(root, sphere, material, [0.03, 0, 0], [0.04, 7e-3, 0.03], false);
    mesh(root, cyl, "#756950", [0, 0, 0], [6e-3, 0.044, 6e-3], false).rotation.x = Math.PI / 2;
    butterflies.push({ root, left, right, phase: i * 1.67 });
  }
  for (let i = 0; i < 7; i++) {
    const root = new THREE.Group();
    planet.add(root);
    mesh(root, sphere, "#778982", [0, 0, 0], [0.025, 0.023, 0.07], false);
    const left = mesh(root, cone, "#71847b", [-0.075, 0, 0], [0.037, 0.15, 0.012], false), right = mesh(root, cone, "#71847b", [0.075, 0, 0], [0.037, 0.15, 0.012], false);
    left.rotation.z = Math.PI / 2;
    right.rotation.z = -Math.PI / 2;
    birds.push({ root, left, right, phase: i * 0.45 });
  }
  const particleCount = 480, particlePos = new Float32Array(particleCount * 6), particleDirs = [], particlePhase = [];
  for (let i = 0; i < particleCount; i++) {
    particleDirs.push(direction(Math.asin(rng() * 2 - 1), rng() * 6.28));
    particlePhase.push(rng());
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));
  const rainMat = new THREE.LineBasicMaterial({ color: "#b4d7db", transparent: true, opacity: 0.5, depthWrite: false });
  const rain = new THREE.LineSegments(rainGeo, rainMat);
  rain.frustumCulled = false;
  planet.add(rain);
  const snowPos = new Float32Array(particleCount * 3), snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute("position", new THREE.BufferAttribute(snowPos, 3));
  function particleMaterial(color, size) {
    return new THREE.ShaderMaterial({ uniforms: { color: { value: new THREE.Color(color) }, size: { value: size }, opacity: { value: 0.8 } }, vertexShader: "uniform float size;void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(size*220./-p.z,1.,12.);gl_Position=projectionMatrix*p;}", fragmentShader: "uniform vec3 color;uniform float opacity;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(color,opacity*(1.-smoothstep(.4,1.,r)));}", transparent: true, depthWrite: false });
  }
  const snow = new THREE.Points(snowGeo, particleMaterial("#ffffff", 0.17));
  snow.frustumCulled = false;
  planet.add(snow);
  const fireflyCount = 60, fireflyGeo = new THREE.BufferGeometry(), fireflyPos = new Float32Array(fireflyCount * 3);
  fireflyGeo.setAttribute("position", new THREE.BufferAttribute(fireflyPos, 3));
  const fireflies = new THREE.Points(fireflyGeo, particleMaterial("#ffdc83", 0.15));
  fireflies.material.blending = THREE.AdditiveBlending;
  fireflies.frustumCulled = false;
  planet.add(fireflies);
  const petalGeo = new THREE.BufferGeometry(), petalPos = new Float32Array(100 * 3);
  petalGeo.setAttribute("position", new THREE.BufferAttribute(petalPos, 3));
  const petalFX = new THREE.Points(petalGeo, particleMaterial("#f1c3b9", 0.12));
  petalFX.frustumCulled = false;
  planet.add(petalFX);
  const rainbow = new THREE.Group();
  lakeFrame.add(rainbow);
  rainbow.position.set(0, 0.04, 0);
  rainbow.rotation.y = 0.2;
  for (let i = 0; i < 5; i++) {
    const material = new THREE.MeshBasicMaterial({ color: ["#dfa2a0", "#e8c494", "#e6d99e", "#a8c4a5", "#a6bac8"][i], transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide });
    const arc = new THREE.Mesh(new THREE.RingGeometry(0.48 + i * 0.019, 0.496 + i * 0.019, 48, 1, 0, Math.PI), material);
    rainbow.add(arc);
  }
  rainbow.visible = false;
  const appleGroup = anchor(direction(0.35, -0.32));
  const apple = mesh(appleGroup, sphere, "#cf8269", [0, 0.6, 0], [0.07, 0.075, 0.07]);
  mesh(apple, cyl, "#8c7154", [0, 1.06, 0], [0.1, 0.5, 0.1]);
  appleGroup.visible = false;
  const dynamic = /* @__PURE__ */ new Set([land, rotor, cloudRoot, appleGroup, rainbow, ...foliage.map((f) => f.g), ...snowCaps, ...residents.map((p) => p.root), ...animals.map((a) => a.g), ...butterflies.map((b) => b.root), ...birds.map((b) => b.root), ...lakeRipples, ...growthPlants]);
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
    const merged = (0, import_BufferGeometryUtils.mergeGeometries)(parts, false);
    parts.forEach((g) => g.dispose());
    if (!merged) continue;
    const baked = new THREE.Mesh(merged, objects[0].material);
    baked.castShadow = objects[0].castShadow;
    baked.receiveShadow = objects[0].receiveShadow;
    planet.add(baked);
    objects.forEach((o) => o.removeFromParent());
  }
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
    waterUniforms.time.value = t;
    waterMat.color.set(env.night > 0.5 ? "#578d91" : "#70bcba");
    airMat.uniforms.strength.value = 0.1 + env.mist * 0.18;
    airMat.uniforms.tint.value.set(env.night > 0.5 ? "#94aebb" : "#b9daba");
    foliage.forEach((f) => {
      f.g.rotation.z = Math.sin(t * 1.1 + f.phase) * f.amount * wind;
      f.g.rotation.x = Math.cos(t * 0.85 + f.phase) * f.amount * 0.4 * wind;
    });
    snowUniform.value = env.snow;
    snowCaps.forEach((c) => {
      c.visible = env.snow > 0.2;
    });
    glowMaterials.forEach((g) => g.emissiveIntensity = 0.15 + env.night * 2.1 + env.rain * 0.6 + env.snow * 0.4);
    rotor.rotation.z -= dt * (0.35 + wind * 0.8);
    cloudRoot.rotation.y = t * 0.016;
    clouds.forEach((c, i) => {
      c.g.visible = i < 3 + Math.round(env.cloud * 8);
      c.material.opacity = 0.66 + env.cloud * 0.21;
      c.material.color.set(env.rain > 0.5 ? "#becbc7" : env.night > 0.5 ? "#8a9aab" : "#f8f1df");
      c.g.scale.y = 0.8 + Math.sin(t * 0.5 + c.phase) * 0.04;
    });
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
      if (active === "apple" && p.i === 0) {
        lon = Math.atan2(appleGroup.position.x, appleGroup.position.z);
        lat = Math.asin(appleGroup.position.clone().normalize().y) - 0.02;
      }
      const target = direction(lat, lon), previous = p.normal.clone();
      p.normal.lerp(target, 1 - Math.exp(-dt * 0.8)).normalize();
      speed = previous.distanceTo(p.normal) / Math.max(dt, 1e-3);
      moveOnSurface(p.root, p.normal);
      const tangent = p.normal.clone().sub(previous).applyQuaternion(p.root.quaternion.clone().invert());
      if (tangent.lengthSq() > 1e-10) {
        const desired = Math.atan2(tangent.x, tangent.z);
        p.heading += Math.atan2(Math.sin(desired - p.heading), Math.cos(desired - p.heading)) * Math.min(1, dt * 8);
      }
      p.body.rotation.y = p.heading;
      const walk = Math.min(1, speed * 95), swing = Math.sin(t * 9 + p.phase) * 0.48 * walk;
      p.limbs[0].rotation.x = swing;
      p.limbs[2].rotation.x = -swing;
      p.limbs[1].rotation.x = -swing * 0.6;
      p.limbs[3].rotation.x = swing * 0.6;
      p.body.position.y = Math.abs(Math.sin(t * 9 + p.phase)) * 6e-3 * walk;
      p.umbrella.visible = env.rain > 0.35;
    });
    animals.forEach((a) => {
      a.body.position.y = Math.max(0, Math.sin(t * 1.5 + a.phase)) * 0.024;
      a.body.rotation.y = Math.sin(t * 0.18 + a.phase) * 0.5;
      a.g.visible = env.rain < 0.5;
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
    growthPlants.forEach((g, i) => g.scale.lerp(new THREE.Vector3().setScalar(i < growth ? 1 : 0.015), Math.min(1, dt * 0.8)));
    if (appleGroup.visible) {
      apple.position.y = 0.07 + Math.abs(Math.cos(Math.min(3, t - (effectUntil - 19)) * 3.2)) * Math.exp(-Math.min(5, t - (effectUntil - 19)) * 1.5) * 0.6;
      if (!active) appleGroup.visible = false;
    }
    rainbow.visible = active === "rainbow";
    rainbow.children.forEach((c) => c.material.opacity = 0.4 * fade);
  }
  return { planet, land, residents, stats, update, trigger, terrainHeight, houseSites, lakes, growthPlants, clouds, rain, snow, waterMat, glowMaterials, dispose() {
    const gs = /* @__PURE__ */ new Set(), ms = /* @__PURE__ */ new Set();
    planet.traverse((o) => {
      if (o.geometry) gs.add(o.geometry);
      if (o.material) ms.add(o.material);
    });
    gs.forEach((g) => g.dispose());
    ms.forEach((m2) => m2.dispose());
  } };
}

// work/planet-v2/check-composition.js
var { document } = (0, import_linkedom.parseHTML)("<html><body></body></html>");
globalThis.document = document;
var world = createWorld(3);
world.update(1 / 60, 14, { rain: 0, snow: 0, cloud: 0.2, wind: 0.35, night: 0, mist: 0 });
world.planet.rotation.z = -0.09;
var scene = new THREE2.Scene();
scene.background = new THREE2.Color("#eff0e5");
scene.add(world.planet);
scene.add(new THREE2.AmbientLight("#c1c5b5", 1));
var sun = new THREE2.DirectionalLight("#fff4df", 0.7);
sun.position.set(-3.5, 6, 7);
scene.add(sun);
var expansions = [];
world.planet.traverse((o) => {
  if (o.material?.isShaderMaterial) o.visible = false;
  if (o.isInstancedMesh) expansions.push(o);
});
for (const im of expansions) {
  for (let i = 0; i < im.count; i++) {
    const mesh = new THREE2.Mesh(im.geometry, im.material), mat = new THREE2.Matrix4();
    im.getMatrixAt(i, mat);
    mat.decompose(mesh.position, mesh.quaternion, mesh.scale);
    im.parent.add(mesh);
  }
  im.removeFromParent();
}
var camera = new THREE2.PerspectiveCamera(38, 1e3 / 740, 0.1, 60);
camera.position.set(4.7, 3.2, 8.8);
camera.lookAt(0, 0.12, 0);
var renderer = new import_SVGRenderer.SVGRenderer();
renderer.setSize(1e3, 740);
renderer.setPrecision(2);
renderer.render(scene, camera);
var svg = renderer.domElement.outerHTML;
import_node_fs.default.writeFileSync("work/planet-v2/composition.svg", svg);
import_node_fs.default.writeFileSync("work/planet-v2/composition.png", new import_resvg_js.Resvg(svg, { background: "#eff0e5" }).render().asPng());
console.log("Saved software composition check (WebGL materials and shadows are not represented).");
