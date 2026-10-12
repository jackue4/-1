import {PLOT_SITES,pathLat,HOUSE_SITES} from './layout.js';
import {terrainHeight,direction,R} from './world.js';
for(const [i,s] of PLOT_SITES.entries())console.log(i,s.lat,s.lon,(terrainHeight(direction(s.lat,s.lon))-R).toFixed(3),(pathLat(s.lon)-s.lat).toFixed(3));
