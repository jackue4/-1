// One layout shared by planting, scenery exclusion and the walking ribbon.
export const HOUSE_SITES=[{lat:.67,lon:-.55,scale:1.22},{lat:.79,lon:.53,scale:1.16}];
export const POND_SITE={lat:.28,lon:-.47};
export function pondReserved(n,margin=0){const lat=Math.asin(n.y),lon=Math.atan2(n.x,n.z);return Math.hypot((lat-POND_SITE.lat)/.105,(lon-POND_SITE.lon)/.125)<1+margin;}
export const MILL_SITE={lat:.34,lon:.64};
export const FARM_CENTER={lat:.32,lon:.08};
export function pathLat(lon){const d=Math.atan2(Math.sin(lon-.08),Math.cos(lon-.08));return .29+.095*Math.sin(lon*3)+.36*Math.exp(-((d/.68)**2));}
// Initial six form the center garden; the two wings open with expansion.
export const PLOT_SITES=[2,3,0,1,4,5].flatMap(col=>[0,1,2].map(row=>({lat:.18+row*.13,lon:-.20+col*.112,row,col})));
export function farmReserved(n,margin=0){const lat=Math.asin(n.y),lon=Math.atan2(n.x,n.z);return lat>.105-margin&&lat<.515+margin&&lon>-.265-margin&&lon<.425+margin;}
