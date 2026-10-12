import { Vector3, Group, Matrix4, Object3D, Color, BufferAttribute, BoxGeometry, CylinderGeometry, Quaternion, BufferGeometry, Float32BufferAttribute, CircleGeometry, SphereGeometry, PlaneGeometry, CanvasTexture, DataTexture, RGBAFormat, SRGBColorSpace, MeshToonMaterial, DoubleSide, Mesh, MathUtils } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

var TAU4 = Math.PI * 2;
var UP4 = new Vector3(0, 1, 0);
export function createIslandTrails({ planet, surface, palette = {}, town, landmarks, beacons }) {
  const { R: R2, direction: direction2, height: height2, trackLat: trackLat2 } = surface, root = new Group();
  root.name = "Island walking loop \xB7 slate, moss and old timber";
  planet.add(root);
  const parts = [[], [], []], meshes = [], geometries = [], materials = [], textures = [], routes = [], samples = [], props = [];
  let time = 0, seed = 843615;
  const rand = () => {
    seed = Math.imul(seed, 1664525) + 1013904223 | 0;
    return (seed >>> 0) / 4294967296;
  }, wrap2 = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const tower = beacons.stats.sites.find((s) => s.id === "west-cape") ?? { lat: 0.52, lon: -1.2, baseRadius: height2(direction2(0.52, -1.2)) + 8e-3 };
  const bridgeLat = 0.455 + 0.022 * Math.sin(-0.8), sites = landmarks?.root?.userData?.sites ?? [], plants = landmarks?.root?.userData?.plants ?? [];
  const obstacles = (town?.root?.userData?.placements ?? []).filter((p) => !["garden patch", "courtyard planting"].includes(p.type)).map((p) => ({ ...p, n: direction2(p.lat, p.lon), block: p.type.includes("tree") ? 0.025 : p.radius }));
  for (const p of plants) obstacles.push({ ...p, n: direction2(p.lat, p.lon), block: 0.021 });
  for (const p of [{ lat: -0.085, lon: -0.48 }, { lat: -5e-3, lon: 0.34 }, { lat: -0.04, lon: 5e-3 }]) obstacles.push({ ...p, type: "coastal tree", n: direction2(p.lat, p.lon), block: 0.031 });
  obstacles.push({ ...tower, type: "lighthouse", n: direction2(tower.lat, tower.lon), block: 0.078 });
  const siteFrames = sites.map((s) => ({ ...s, n: direction2(s.lat, s.lon), east: new Vector3(Math.cos(s.lon), 0, -Math.sin(s.lon)), south: new Vector3().crossVectors(new Vector3(Math.cos(s.lon), 0, -Math.sin(s.lon)), direction2(s.lat, s.lon)) }));
  function onShared(lat, lon) {
    const d = surface.streamDistance?.(lat, lon) ?? Infinity;
    return Math.abs(lat - bridgeLat) < 0.018 && d < 0.235 || Math.abs(lat - (trackLat2(lon) - 0.075)) < 0.019 && lon > -0.91 && lon < 0.56 || Math.abs(lat - trackLat2(lon)) < 0.052 && Math.abs(lon + 0.2) < 0.073 || lat > 0.16 && lat < 0.67 && Math.abs(Math.abs(lon + 0.2) - 0.047) < 9e-3 || lon > -0.85 && lon < 0.43 && Math.abs(lat - (0.455 + 0.022 * Math.sin(lon * 5 + 0.2))) < 0.012 || lon > -0.85 && lon < 0.43 && Math.abs(lat - (0.704 + 0.018 * Math.sin(lon * 3))) < 0.012;
  }
  function clear(lat, lon, pad = 0.028) {
    const n = direction2(lat, lon), h = height2(n);
    if (h < R2 + 6e-3 && !onShared(lat, lon)) return false;
    if (Math.abs(lat - trackLat2(lon)) * R2 < 0.102 + pad && !(Math.abs(lon + 0.2) < 0.065)) return false;
    if (surface.streamAt && lat < surface.streamStart + 6e-3 && lat > surface.streamEnd - 6e-3) {
      const s = surface.streamAt(lat), d = surface.streamDistance(lat, lon);
      if (d < s.halfWidth * 1.65 + pad && !(Math.abs(lat - bridgeLat) < 0.014 || Math.abs(lat - (trackLat2(lon) - 0.075)) < 0.014)) return false;
    }
    for (const p of obstacles) if (n.distanceTo(p.n) * R2 < p.block + pad) return false;
    for (const s of siteFrames) {
      const v = n.clone().multiplyScalar(R2).sub(s.n.clone().multiplyScalar(R2));
      if (Math.abs(v.dot(s.east)) < s.width / 2 + pad && Math.abs(v.dot(s.south)) < s.depth / 2 + pad) return false;
    }
    return true;
  }
  const step = 0.0125, latMin = -0.14, lonMin = -1.37, rows = 100, cols = 185, count = rows * cols, valid = new Uint8Array(count), elev = new Float32Array(count), normals = new Array(count);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const lat = latMin + r * step, lon = lonMin + c * step, id = r * cols + c, n = direction2(lat, lon);
    normals[id] = n;
    elev[id] = height2(n);
    valid[id] = clear(lat, lon) ? 1 : 0;
  }
  const coord = (id) => [latMin + Math.floor(id / cols) * step, lonMin + id % cols * step];
  function nearest(point) {
    let best = -1, d = Infinity;
    const n = direction2(...point);
    for (let id = 0; id < count; id++) if (valid[id]) {
      const x = n.distanceToSquared(normals[id]);
      if (x < d) {
        d = x;
        best = id;
      }
    }
    if (best < 0) throw Error("No clear trail cell");
    return best;
  }
  function search(a, b) {
    const start = nearest(a), end = nearest(b), goal = normals[end], cost = new Float64Array(count), parent = new Int32Array(count), closed = new Uint8Array(count), heap = [];
    cost.fill(Infinity);
    parent.fill(-1);
    cost[start] = 0;
    function push(id, score) {
      let k = heap.length;
      heap.push({ id, score });
      while (k) {
        const p = k - 1 >> 1;
        if (heap[p].score <= score) break;
        heap[k] = heap[p];
        k = p;
      }
      heap[k] = { id, score };
    }
    function pop() {
      const first = heap[0], last = heap.pop();
      if (heap.length) {
        let k = 0;
        while (k * 2 + 1 < heap.length) {
          let j = k * 2 + 1;
          if (j + 1 < heap.length && heap[j + 1].score < heap[j].score) j++;
          if (last.score <= heap[j].score) break;
          heap[k] = heap[j];
          k = j;
        }
        heap[k] = last;
      }
      return first.id;
    }
    push(start, 0);
    let found = false;
    while (heap.length) {
      const id = pop();
      if (closed[id]) continue;
      closed[id] = 1;
      if (id === end) {
        found = true;
        break;
      }
      const row = Math.floor(id / cols), col = id % cols;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nr = row + dr, nc = col + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        const next = nr * cols + nc;
        if (!valid[next] || closed[next] || dr && dc && (!valid[row * cols + nc] || !valid[nr * cols + col])) continue;
        const [la, lo] = coord(next), distance = normals[id].distanceTo(normals[next]) * R2, dh = Math.abs(elev[id] - elev[next]), shared = onShared(la, lo), candidate = cost[id] + distance * (shared ? 0.76 : 1) + Math.min(dh, 0.06) * 0.95;
        if (candidate >= cost[next]) continue;
        cost[next] = candidate;
        parent[next] = id;
        push(next, candidate + normals[next].distanceTo(goal) * R2 * 0.74);
      }
    }
    if (!found) throw Error("Island trail cannot join " + a + " to " + b);
    const ids = [];
    for (let id = end; id !== -1; id = parent[id]) ids.push(id);
    return ids.reverse().map(coord);
  }
  const anchors = [["lighthouse approach", [tower.lat - 0.04, tower.lon]], ["west hillside", [0.735, -1.01]], ["northwest ridge", [0.995, -0.69]], ["north ridge", [1.008, -0.16]], ["northeast overlook", [0.92, 0.43]], ["east headland", [0.63, 0.74]], ["tea-room junction", [0.405, 0.6]], ["east village lane", [bridgeLat, 0.12]], ["wooden bridge west", [bridgeLat, -0.4]], ["cottage junction", [0.26, -0.97]], ["lighthouse approach", [tower.lat - 0.04, tower.lon]]];
  for (let i = 0; i < anchors.length - 1; i++) routes.push({ name: anchors[i][0] + " \u2192 " + anchors[i + 1][0], kind: "loop", points: search(anchors[i][1], anchors[i + 1][1]) });
  routes.push({ name: "Cottage side gate", kind: "connector", points: search([0.26, -0.97], [0.26, -1.029]) });
  routes.push({ name: "Tea-room front steps", kind: "connector", points: search([0.405, 0.6], [0.218, 0.7]) });
  routes.push({ name: "Village to seaside jetty", kind: "connector", points: search([bridgeLat, -0.4], [0.072, -0.3]).concat(search([0.072, -0.3], [-0.073, -0.67]).slice(1)) });
  function frame(lat, lon, offset = 4e-3, face = 0) {
    const n = direction2(lat, lon), eps = 3e-4, e = direction2(lat, lon + eps).multiplyScalar(height2(direction2(lat, lon + eps))).sub(direction2(lat, lon - eps).multiplyScalar(height2(direction2(lat, lon - eps)))).normalize(), s = direction2(lat - eps, lon).multiplyScalar(height2(direction2(lat - eps, lon))).sub(direction2(lat + eps, lon).multiplyScalar(height2(direction2(lat + eps, lon)))).normalize(), up = new Vector3().crossVectors(s, e).normalize();
    if (up.dot(n) < 0) up.negate();
    s.crossVectors(e, up).normalize();
    return new Matrix4().makeBasis(e, up, s).setPosition(n.multiplyScalar(height2(n) + offset)).multiply(new Matrix4().makeRotationY(face));
  }
  const dummy = new Object3D(), matrix = new Matrix4();
  function add(g, color, base, p = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], batch = 0) {
    if (g.index) {
      const expanded = g.toNonIndexed();
      g.dispose();
      g = expanded;
    }
    g.deleteAttribute("uv");
    const c = new Color(color), v = g.attributes.position, colors = new Float32Array(v.count * 3);
    for (let i = 0; i < v.count; i++) colors.set([c.r, c.g, c.b], i * 3);
    g.setAttribute("color", new BufferAttribute(colors, 3));
    if (batch === 1 && !g.getAttribute("aFlex")) {
      const flex = new Float32Array(v.count);
      for (let i = 0; i < v.count; i++) flex[i] = Math.max(0, v.getY(i) + p[1]);
      g.setAttribute("aFlex", new BufferAttribute(flex, 1));
    }
    dummy.position.set(...p);
    dummy.rotation.set(...rotation);
    dummy.scale.set(...scale);
    dummy.updateMatrix();
    g.applyMatrix4(matrix.multiplyMatrices(base, dummy.matrix));
    parts[batch].push(g);
  }
  const box = (color, b, p, s, r = [0, 0, 0], batch = 0) => add(new BoxGeometry(...s), color, b, p, r, [1, 1, 1], batch);
  function rod(color, b, a, z, r = 2e-3, batch = 0) {
    const p = new Vector3(...a), q = new Vector3(...z), g = new CylinderGeometry(r * 0.8, r, p.distanceTo(q), 5);
    g.applyQuaternion(new Quaternion().setFromUnitVectors(UP4, q.clone().sub(p).normalize()));
    g.translate(...p.add(q).multiplyScalar(0.5).toArray());
    add(g, color, b, [0, 0, 0], [0, 0, 0], [1, 1, 1], batch);
  }
  function leaf(color, b, p, length, width, angle, batch = 1) {
    const g = new BufferGeometry(), points = [0, 0, 0, length * 0.4, length * 0.2, width, length, length * 0.09, 0, length * 0.43, length * 0.13, -width];
    g.setAttribute("position", new Float32BufferAttribute(points, 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    g.computeVertexNormals();
    add(g, color, b, p, [0, angle, 0], [1, 1, 1], batch);
  }
  function surfacePatch(lat, lon, length, width, yaw, color, wood = false) {
    const base = frame(lat, lon, 6e-3, yaw), sides = wood ? 4 : 6, points = [], indices = [], randomTurn = wood ? Math.PI / 4 : Math.PI / 6, rx = wood ? width * 0.707 : width * 0.56, rz = wood ? length * 0.707 : length * 0.6;
    for (let layer = 0; layer < 2; layer++) for (let j = 0; j < sides; j++) {
      const a = randomTurn + j * TAU4 / sides, x = Math.cos(a) * rx, z = Math.sin(a) * rz;
      const p = new Vector3(x, 0, z).applyMatrix4(base), n = p.clone().normalize();
      p.copy(n.multiplyScalar(height2(n) + (layer ? 9e-3 : 15e-4)));
      points.push(...p.toArray());
    }
    for (let j = 1; j < sides - 1; j++) indices.push(sides, sides + j, sides + j + 1);
    for (let j = 0; j < sides; j++) {
      const k = (j + 1) % sides;
      indices.push(j, k, sides + k, j, sides + k, sides + j);
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(points, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    add(g, color, new Matrix4());
  }
  const taken = /* @__PURE__ */ new Set();
  let stoneCount = 0, plankCount = 0, sharedCount = 0, mossCount = 0;
  for (let k = 0; k < routes.length; k++) {
    const route = routes[k];
    let carry = 0, ordinal = 0;
    route.length = 0;
    for (let j = 1; j < route.points.length; j++) {
      const a = route.points[j - 1], b = route.points[j], length = direction2(...a).distanceTo(direction2(...b)) * R2;
      route.length += length;
      for (let d = carry; d < length; d += 0.046) {
        const t = d / length, lat = MathUtils.lerp(a[0], b[0], t), lon = MathUtils.lerp(a[1], b[1], t), key = Math.round(lat * 230) + ":" + Math.round(lon * Math.cos(lat) * 230), yaw = Math.atan2(wrap2(b[1] - a[1]) * Math.cos(lat), -(b[0] - a[0]));
        ordinal++;
        if (taken.has(key)) continue;
        taken.add(key);
        if (onShared(lat, lon)) {
          sharedCount++;
          continue;
        }
        if (!clear(lat, lon, 0.024)) continue;
        // Keep old timber on the dry approach to the jetty and across the ridge saddle.
        const wood = route.name === "Village to seaside jetty" && lat < 0 || k === 2 && lon > -0.49 && lon < -0.34;
        surfacePatch(lat, lon, wood ? 0.041 : 0.043, wood ? 0.061 : 0.057, yaw + (rand() - 0.5) * 0.12, wood ? ordinal % 2 ? "#9a8765" : "#ac9974" : ["#c1c5b2", "#cbd0bd", "#aeb9aa", "#b6c0b0"][ordinal % 4], wood);
        samples.push({ route: route.name, lat, lon, kind: wood ? "wood" : "stone", radius: 0.034, shared: false });
        wood ? plankCount++ : stoneCount++;
        if (!wood && ordinal % 5 === 0) {
          const side = ordinal % 2 ? 1 : -1, bp = frame(lat, lon, 0.01, yaw);
          add(new CircleGeometry(8e-3, 5), "#719952", bp, [side * 0.027, 0, 0], [-Math.PI / 2, 0, 0.3], [1, 0.8, 1]);
          mossCount++;
        }
      }
      carry = (carry - length) % 0.046;
      if (carry < 0) carry += 0.046;
    }
  }
  const entrance = [tower.lat - 0.026, tower.lon];
  for (let i = 0; i < 6; i++) {
    const t = i / 5, lat = MathUtils.lerp(tower.lat - 0.041, entrance[0], t), lon = tower.lon + Math.sin(t * Math.PI) * 5e-3;
    surfacePatch(lat, lon, 0.022, 0.07, 0, i % 2 ? "#b8c4b1" : "#d0d4bf");
    stoneCount++;
  }
  function grass(lat, lon, number = 8) {
    if (!clear(lat, lon, 9e-3)) return;
    const base = frame(lat, lon, 4e-3);
    for (let j = 0; j < number; j++) {
      const a = rand() * TAU4, l = 0.026 + rand() * 0.043, w = 2e-3 + rand() * 12e-4, g = new BufferGeometry();
      g.setAttribute("position", new Float32BufferAttribute([-2e-3, 0, 0, w, l * 0.53, 7e-3, 0.013, l, 9e-3, -w, l * 0.5, 7e-3], 3));
      g.setIndex([0, 1, 2, 0, 2, 3]);
      g.computeVertexNormals();
      add(g, j % 3 ? "#92b465" : "#bacb7d", base, [(rand() - 0.5) * 0.018, 0, (rand() - 0.5) * 0.018], [0, a, 0], [1, 1, 1], 1);
    }
    props.push({ type: "windblown grass", lat, lon });
  }
  for (let i = 0; i < 32; i++) {
    const a = i * 2.39996, r = 0.135 + rand() * 0.115, lat = tower.lat + Math.sin(a) * r / R2, lon = tower.lon + Math.cos(a) * r / (R2 * Math.cos(tower.lat));
    grass(lat, lon, 6);
  }
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4, r = 0.15 + rand() * 0.055, lat = tower.lat + Math.sin(a) * r / R2, lon = tower.lon + Math.cos(a) * r / (R2 * Math.cos(tower.lat));
    if (!clear(lat, lon, 0.02)) continue;
    const base = frame(lat, lon);
    for (let j = 0; j < 7; j++) {
      const angle = j * TAU4 / 7, l = 0.029 + rand() * 0.013;
      rod("#628657", base, [0, 0, 0], [Math.cos(angle) * l, 0.018, Math.sin(angle) * l], 12e-4, 1);
      for (let q = 1; q < 4; q++) for (const side of [-1, 1]) leaf(j % 2 ? "#719952" : "#87ad5a", base, [Math.cos(angle) * l * q / 4, 0.015, Math.sin(angle) * l * q / 4], 0.013, 4e-3, angle + side * 0.8);
    }
    props.push({ type: "fern", lat, lon });
  }
  for (let i = 0; i < 6; i++) {
    const a = i * 1.3 + 0.4, lat = tower.lat - 0.04 + Math.sin(a) * 0.017, lon = tower.lon + Math.cos(a) * 0.036;
    if (!clear(lat, lon, 0.014)) continue;
    const base = frame(lat, lon);
    for (let j = 0; j < 3; j++) {
      const x = (j - 1) * 0.01, y = 0.011 + j * 3e-3;
      rod("#e8d9b4", base, [x, 0, 0], [x, y, 0], 18e-4);
      add(new SphereGeometry(7e-3 + j * 8e-4, 7, 4, 0, TAU4, 0, Math.PI / 2), j % 2 ? "#bd794f" : "#e5ba7d", base, [x, y, 0]);
    }
    props.push({ type: "mushrooms", lat, lon });
  }
  const flagLat = tower.lat + 0.013, flagLon = tower.lon + 0.033, flagBase = frame(flagLat, flagLon);
  rod("#91846b", flagBase, [0, 0, 0], [0, 0.165, 0], 25e-4);
  const flagGeometry = new PlaneGeometry(0.072, 0.043, 8, 4);
  const flagFlex = new Float32Array(flagGeometry.attributes.position.count);
  for (let i = 0; i < flagFlex.length; i++) {
    flagFlex[i] = Math.pow((flagGeometry.attributes.position.getX(i) + 0.036) / 0.072, 1.25) * 0.17;
  }
  flagGeometry.setAttribute("aFlex", new BufferAttribute(flagFlex, 1));
  flagGeometry.translate(0.038, 0.14, 0);
  add(flagGeometry, "#f0d090", flagBase, [0, 0, 0], [0, -0.18, 0], [1, 1, 1], 1);
  props.push({ type: "animated flag", lat: flagLat, lon: flagLon });
  const signLat = tower.lat - 0.047, signLon = tower.lon + 0.029, signBase = frame(signLat, signLon, 6e-3, -0.22);
  rod("#806a52", signBase, [0, 0, 0], [0, 0.066, 0], 33e-4);
  box("#897052", signBase, [0, 0.064, 0], [0.095, 0.037, 8e-3], [0, 0, -0.035]);
  box("#b5a082", signBase, [0, 0.047, 4e-3], [0.079, 3e-3, 1e-3]);
  let signTexture;
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 96;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#988064";
    ctx.fillRect(0, 0, 256, 96);
    ctx.strokeStyle = "#79634e";
    ctx.lineWidth = 2;
    for (let j = 0; j < 8; j++) {
      ctx.beginPath();
      ctx.moveTo(0, 11 + j * 11);
      ctx.lineTo(256, 8 + j * 11);
      ctx.stroke();
    }
    ctx.fillStyle = "#f0e3bd";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = '600 46px "Yu Mincho", "Microsoft YaHei", serif';
    ctx.fillText("\u706F\u53F0 \u2192", 128, 49);
    signTexture = new CanvasTexture(canvas);
  } else signTexture = new DataTexture(new Uint8Array([215, 196, 158, 255]), 1, 1, RGBAFormat);
  signTexture.colorSpace = SRGBColorSpace;
  signTexture.needsUpdate = true;
  textures.push(signTexture);
  const signMat = new MeshToonMaterial({ map: signTexture, gradientMap: palette.ramp ?? null, side: DoubleSide });
  materials.push(signMat);
  const signGeo = new PlaneGeometry(0.092, 0.034), signMesh = new Mesh(signGeo, signMat);
  signMesh.applyMatrix4(signBase.clone().multiply(new Matrix4().makeTranslation(0, 0.064, 45e-4)));
  signMesh.name = "Weathered Japanese lighthouse sign";
  root.add(signMesh);
  geometries.push(signGeo);
  meshes.push(signMesh);
  props.push({ type: "Japanese wooden sign", lat: signLat, lon: signLon });
  for (let i = 0; i < 2; i++) {
    if (!parts[i].length) continue;
    const g = mergeGeometries(parts[i], false);
    parts[i].forEach((p) => p.dispose());
    g.computeBoundingSphere();
    const m = new MeshToonMaterial({ vertexColors: true, gradientMap: palette.ramp ?? null, side: DoubleSide });
    if (i === 1) {
      m.onBeforeCompile = (shader) => {
        shader.uniforms.uTrailTime = { value: time };
        m.userData.shader = shader;
        shader.vertexShader = "uniform float uTrailTime;attribute float aFlex;\n" + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nfloat gust=sin(uTrailTime*1.8+position.x*24.+position.z*18.)+sin(uTrailTime*.63+position.y*31.)*.35;transformed.x+=gust*aFlex*.055;transformed.z+=gust*aFlex*.019;");
      };
      m.customProgramCacheKey = () => "cape-trail-wind-v1";
    }
    const mesh = new Mesh(g, m);
    mesh.name = i ? "Wind-cut grasses, ferns and lighthouse flag" : "Individual slate slabs, timber sections and moss";
    mesh.castShadow = mesh.receiveShadow = true;
    root.add(mesh);
    meshes.push(mesh);
    geometries.push(g);
    materials.push(m);
  }
  const stats = { loops: 1, connectors: 3, stoneSlabs: stoneCount, woodPlanks: plankCount, sharedSurfaceSamples: sharedCount, mossPatches: mossCount, drawCalls: meshes.length, triangles: meshes.reduce((sum, m) => sum + (m.geometry.index?.count ?? m.geometry.attributes.position.count) / 3, 0), routeLength: routes.reduce((n, r) => n + r.length, 0), lighthouse: { lat: tower.lat, lon: tower.lon }, routes: routes.map(({ name, kind, length }) => ({ name, kind, length })), props: props.length };
  root.userData.paths = routes;
  root.userData.samples = samples;
  root.userData.props = props;
  root.userData.trails = stats;
  return { root, stats, update(t) {
    time = Number.isFinite(t) ? t : 0;
    for (const m of materials) if (m.userData.shader) m.userData.shader.uniforms.uTrailTime.value = time;
  }, getState() {
    return { time, loops: 1, connectors: 3, slabs: stoneCount + plankCount, lighthouse: { lat: tower.lat, lon: tower.lon } };
  }, dispose() {
    root.removeFromParent();
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
  } };
}
