import {build} from 'file:///C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules/esbuild/lib/main.js';
import {pathToFileURL} from 'node:url';
const outfile=new URL('./trail-inspect-bundle.mjs',import.meta.url).pathname.replace(/^\/(\w:)/,'$1');
await build({stdin:{contents:`import * as T from 'three';import {createSurface} from './surface.js';import {createTown} from './town.js';import {createLandmarks} from './landmarks.js';import fs from 'node:fs';
const surface=createSurface(),planet=new T.Group(),town=createTown({planet,surface}),landmarks=createLandmarks({planet,surface,town});const occupied=[...town.root.userData.placements,...landmarks.root.userData.sites.map(s=>({...s,type:'landmark'})),...landmarks.root.userData.plants.map(p=>({...p,radius:.12}))];
const candidates=[];for(let lat=.32;lat<1.10;lat+=.025)for(let lon=-1.3;lon<.52;lon+=.025){const n=surface.direction(lat,lon),elevation=surface.height(n)-surface.R,coast=surface.coast(n),nearest=occupied.reduce((a,p)=>Math.min(a,n.distanceTo(surface.direction(p.lat,p.lon))*surface.R-p.radius),Infinity);if(elevation>.035&&coast<.21&&nearest>.20&&Math.abs(lat-surface.trackLat(lon))>.13)candidates.push({lat,lon,elevation,coast,nearest});}
console.log(JSON.stringify({candidates:candidates.sort((a,b)=>b.nearest-a.nearest).slice(0,30),sites:landmarks.root.userData.sites.map(({name,lat,lon,radius})=>({name,lat,lon,radius})),types:[...new Set(occupied.map(p=>p.type))]},null,2));
fs.writeFileSync('../trail-occupancy.json',JSON.stringify({town:town.root.userData.placements,sites:landmarks.root.userData.sites,plants:landmarks.root.userData.plants}));`,resolveDir:new URL('./kamakura-planet/',import.meta.url).pathname.replace(/^\/(\w:)/,'$1')},outfile,nodePaths:['C:/Users/chenyahan/Documents/Codex/2026-09-15/neng/work/node_modules'],bundle:true,platform:'node',format:'esm'});
await import(pathToFileURL(outfile).href);

