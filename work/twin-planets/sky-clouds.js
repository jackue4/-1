// Six small, pre-painted cloud plates. The live sky only composites drawImage;
// no pixel noise, filters, gradients or extra canvases are needed per frame.
const WIDTH=640,HEIGHT=300;
const NIGHT={base:['#8395bd','#6576a2','#45567e','#283e62'],light:'#b1c2d5',mid:'#768eb4',shadow:'#354d79',deep:'#263c63',rim:'#ffe2a8',rimSoft:'#ebba82',glaze:'#8eacce'};
const DUSK={base:['#fff0cf','#f1acb6','#c883ab','#776b9b'],light:'#ffe4cf',mid:'#f5b5bd',shadow:'#ba87b0',deep:'#806b9c',rim:'#fff2cc',rimSoft:'#ffcaab',glaze:'#ffe5ce'};

// The top line of each bank is intentionally asymmetric. Tall towers, smaller
// shoulders and flattened trailing wisps distinguish these from a circle ring.
const FORMS=[
 {name:'tall-cumulus',top:[['M',26,224],['C',8,205,23,175,60,175],['C',52,148,77,124,106,137],['C',116,111,137,100,161,109],['C',155,83,174,62,202,66],['C',219,32,277,32,298,69],['C',322,49,353,58,365,90],['C',387,85,414,98,420,124],['C',453,97,493,119,495,149],['C',526,133,560,151,556,177],['C',591,170,620,190,611,214]],bottom:[['C',604,245,565,242,547,240],['C',518,260,474,251,451,249],['C',413,270,362,258,335,257],['C',295,274,253,256,230,258],['C',181,274,145,255,120,253],['C',85,267,46,250,26,224]],billows:[[78,187,65,47,-.08,.22],[123,153,57,47,.08,.16],[195,109,53,51,-.1,.06],[255,100,80,64,-.1,0],[325,108,54,46,.2,.18],[364,148,76,59,.15,.34],[459,165,60,48,.12,.26],[528,195,53,34,.12,.45],[174,194,80,56,-.17,.38],[278,177,75,60,.12,.21],[399,207,89,43,.1,.55],[286,232,105,28,.01,.71]]},
 {name:'layered-cloud-sea',top:[['M',15,228],['C',8,212,31,195,59,198],['C',64,173,87,167,112,179],['C',121,147,155,136,181,155],['C',178,122,207,98,239,111],['C',254,73,311,65,337,104],['C',368,85,400,102,407,128],['C',432,113,461,125,465,150],['C',497,135,528,154,524,179],['C',554,169,574,185,575,202],['C',603,195,633,215,624,231]],bottom:[['C',611,250,579,245,561,249],['C',525,268,488,254,462,258],['C',421,271,371,259,345,262],['C',300,272,253,259,217,263],['C',174,270,131,258,107,260],['C',69,270,28,250,15,228]],billows:[[94,205,60,32,.04,.43],[150,185,57,39,-.2,.25],[224,149,63,46,-.1,.15],[291,127,74,58,-.11,0],[363,152,57,46,.14,.21],[428,175,66,42,.16,.31],[492,205,55,34,.11,.44],[556,225,58,25,.04,.58],[220,211,90,40,-.03,.35],[332,207,80,43,.02,.35],[418,240,99,24,.02,.64],[172,246,108,19,.03,.71]]},
 {name:'windward-towers',top:[['M',25,222],['C',13,199,33,178,62,181],['C',52,153,79,131,108,143],['C',102,113,124,91,154,102],['C',155,69,198,47,226,74],['C',246,45,292,57,302,85],['C',331,72,352,95,353,118],['C',380,103,411,114,416,139],['C',449,117,483,132,484,158],['C',507,143,535,157,538,182],['C',572,171,603,193,595,213],['C',617,213,627,229,608,242]],bottom:[['C',583,262,541,247,519,253],['C',481,269,433,253,404,256],['C',362,267,321,254,291,258],['C',251,269,207,252,183,255],['C',150,269,111,249,91,251],['C',61,256,34,243,25,222]],billows:[[73,190,56,38,-.05,.2],[129,154,59,51,-.21,.1],[196,108,69,56,-.18,0],[264,105,51,43,.1,.1],[315,143,57,48,.2,.25],[387,166,58,44,.03,.31],[455,190,72,39,.12,.34],[532,215,61,28,.07,.49],[209,183,84,63,-.04,.32],[310,207,79,42,.03,.49],[400,236,89,28,.07,.61],[135,228,78,27,-.05,.65]]}
];

function trace(c,commands,close=false){c.beginPath();for(const [op,...a]of commands){if(op==='M')c.moveTo(...a);else if(op==='L')c.lineTo(...a);else c.bezierCurveTo(...a);}if(close)c.closePath();}
function gradient(c,x1,y1,x2,y2,stops){const g=c.createLinearGradient(x1,y1,x2,y2);for(const [at,color]of stops)g.addColorStop(at,color);return g;}
function random(seed){let n=seed>>>0;return()=>{n=Math.imul(n,1664525)+1013904223>>>0;return n/4294967296;};}
function lobe(c){
 c.beginPath();c.moveTo(-1,.27);c.bezierCurveTo(-1.07,-.13,-.83,-.51,-.48,-.59);c.bezierCurveTo(-.48,-.93,.04,-1.02,.27,-.71);c.bezierCurveTo(.65,-.78,.98,-.41,.88,-.06);c.bezierCurveTo(1.12,.28,.65,.73,.22,.64);c.bezierCurveTo(-.13,.91,-.82,.8,-1,.27);c.closePath();
}
function paintBillow(c,data,palette,index){
 const [x,y,rx,ry,rotation,shade]=data;c.save();c.translate(x,y);c.rotate(rotation);c.scale(rx,ry);lobe(c);c.clip();
 // The broad, deliberately simple colour bands give each billow an anime
 // volume; a small gradient softens their join instead of photographic noise.
 c.fillStyle=gradient(c,-.4,-1,.25,1,[[0,palette.light],[.28,palette.mid],[.68,palette.shadow],[1,palette.deep]]);c.globalAlpha=.72-shade*.19;c.fillRect(-1.2,-1.2,2.4,2.4);
 c.globalAlpha=.23+shade*.09;c.fillStyle=palette.deep;c.beginPath();c.moveTo(-1.14,.18);c.bezierCurveTo(-.72,.11,-.81,.55,-.28,.53);c.bezierCurveTo(.1,.42,.24,.68,.58,.42);c.bezierCurveTo(.77,.33,.93,.29,1.12,.1);c.lineTo(1.2,1.1);c.lineTo(-1.2,1.1);c.closePath();c.fill();
 const bloom=c.createRadialGradient(-.33,-.58,.02,-.21,-.41,.97);bloom.addColorStop(0,palette.glaze+'a0');bloom.addColorStop(.47,palette.glaze+'25');bloom.addColorStop(1,palette.glaze+'00');c.globalAlpha=.38-shade*.17;c.fillStyle=bloom;c.fillRect(-1.2,-1.2,2.4,2.4);
 // Broken top-left accents keep the eye reading connected rolling cloud.
 c.globalAlpha=(.40-shade*.27)*(index%3===0?.8:1);c.strokeStyle=gradient(c,-.7,-.9,.6,-.1,[[0,palette.rim+'00'],[.3,palette.rim],[.68,palette.rimSoft+'94'],[1,palette.rimSoft+'00']]);c.lineWidth=.019;c.lineCap='round';c.beginPath();c.moveTo(-.92,-.08);c.bezierCurveTo(-.90,-.34,-.73,-.52,-.46,-.55);c.bezierCurveTo(-.42,-.87,.01,-.90,.24,-.68);c.stroke();c.restore();
}

function paintPlate(doc,form,palette,scale,index){
 const canvas=doc.createElement('canvas');canvas.width=Math.round(WIDTH*scale);canvas.height=Math.round(HEIGHT*scale);
 const c=canvas.getContext('2d',{alpha:true});if(!c)throw new Error('Cloud atlas requires a 2D canvas context.');c.scale(canvas.width/WIDTH,canvas.height/HEIGHT);
 const outline=[...form.top,...form.bottom];
 // Only the light-facing cloud crown emits a fine warm rim. Both the dark
 // underside and the transparent exterior remain free of a uniform outline.
 c.save();trace(c,form.top);c.strokeStyle=palette.rimSoft;c.lineWidth=3.5;c.globalAlpha=.23;c.shadowColor=palette.rimSoft;c.shadowBlur=8*scale;c.stroke();c.restore();
 c.save();trace(c,outline,true);c.clip();c.fillStyle=gradient(c,180,48,390,277,[[0,palette.base[0]],[.32,palette.base[1]],[.68,palette.base[2]],[1,palette.base[3]]]);c.fillRect(0,0,WIDTH,HEIGHT);
 form.billows.forEach((b,i)=>paintBillow(c,b,palette,i));
 // Broad cool reflected-light ribbons under the cloud tie the small volumes
 // together as one mass. Their ends taper and overlap like hand-painted washes.
 const rng=random(6271+index*917);for(let i=0;i<5;i++){
  const y=232+i*5,x=48+i*13,r=490-i*39;c.globalAlpha=.065-i*.007;c.fillStyle=i%2?palette.glaze:palette.deep;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+r*.24,y-9-rng()*5,x+r*.61,y+8,x+r,y-2);c.bezierCurveTo(x+r*.84,y+9,x+r*.22,y+10,x,y+4);c.closePath();c.fill();
 }
 c.globalAlpha=1;
 // Small separated brush accents articulate the cloud sea without grain.
 for(let i=0;i<21;i++){
  const x=70+rng()*493,y=200+rng()*48,length=7+rng()*18;c.strokeStyle=i%4?palette.glaze:palette.rim;c.globalAlpha=.04+rng()*.05;c.lineWidth=.7+rng()*.65;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+length*.26,y-2,x+length*.72,y-2.4,x+length,y-.4);c.stroke();
 }
 c.restore();
 c.save();trace(c,form.top);c.strokeStyle=gradient(c,67,73,570,207,[[0,palette.rimSoft+'18'],[.18,palette.rim],[.4,palette.rimSoft+'c9'],[.76,palette.rimSoft+'63'],[1,palette.rimSoft+'00']]);c.lineWidth=2.15;c.lineCap='round';c.globalAlpha=.91;c.stroke();
 // A second very fine cream line runs inside the strongest backlit peaks.
 c.translate(.25,1.25);trace(c,form.top);c.strokeStyle=gradient(c,145,42,430,190,[[0,palette.rim+'00'],[.16,palette.rim+'cb'],[.6,palette.rim+'31'],[1,palette.rim+'00']]);c.lineWidth=.7;c.globalAlpha=.67;c.stroke();c.restore();
 return{canvas,width:WIDTH,height:HEIGHT};
}

export function createCloudAtlas({document,scale=1}={}){
 if(!document?.createElement)throw new TypeError('Cloud atlas requires a document.');
 // Six RGBA plates stay below 8 MB even on a high-DPI display. The returned
 // dimensions are CSS drawing units; the backing canvases contain extra detail.
 const resolution=Math.max(.5,Math.min(1.25,Number(scale)||1));
 const night=FORMS.map((form,i)=>paintPlate(document,form,NIGHT,resolution,i)),dusk=FORMS.map((form,i)=>paintPlate(document,form,DUSK,resolution,i));let disposed=false;
 return{night,dusk,dispose(){if(disposed)return;disposed=true;for(const plate of[...night,...dusk]){plate.canvas.width=1;plate.canvas.height=1;}night.length=0;dusk.length=0;}};
}
