const fs=require('node:fs'),path=require('node:path');const dir=path.join(__dirname,'sakura-planet');
function edit(name,changes){let s=fs.readFileSync(path.join(dir,name),'utf8');for(const [from,to]of changes){if(!s.includes(from))throw Error(name+': missing '+from.slice(0,80));s=s.replaceAll(from,to);}fs.writeFileSync(path.join(dir,name),s);}
const coastTrees='[.25,3.05,4.35].forEach((angle,i)=>tree(shoreNormal(0,angle,.13),.47+(i%3)*.03));[2.4].forEach(angle=>tree(shoreNormal(1,angle,.13),.52));';
edit('world.js',[[coastTrees,''],['const crownAsset=createTreeCrownMaterial',coastTrees+'\n  const crownAsset=createTreeCrownMaterial']]);
edit('app.js',[
 ["viewMode = 'meadow'","viewMode = 'globe'"],
 ["world.planet.rotation.z=-.09;","world.planet.quaternion.setFromUnitVectors(direction(.57,.04),new THREE.Vector3(0,1,0));"],
 ["new THREE.Color('#fff0cf'),sunsetColor=new THREE.Color('#f9bf87')","new THREE.Color('#ffe9e0'),sunsetColor=new THREE.Color('#f7b3ac')"],
 ["bgNight=new THREE.Color('#192b50')","bgNight=new THREE.Color('#29283f')"],
 ["'#385d4b'","'#6b5162'"],["'#6a8673'","'#987e8c'"],["'#82b7bd35'","'#b89bad38'"],["'#243953eb'","'#363047eb'"],
 ["scene.fog.color.set('#d5e6d8')","scene.fog.color.set('#e6dce5')"],
 ["new THREE.Color('#eac9b0')","new THREE.Color('#ebc4c5')"],
 ["new THREE.Color('#ffe8d6')","new THREE.Color('#f3d1d1')"],
 ["hemi.color.set('#cfdfeb')","hemi.color.set('#d9d9ec')"],
 ["setView('meadow');updateUi(new Date(),true);","setView('globe');updateUi(new Date(),true);"],
 ["style:'painted-animation'","style:'sakura-painted-animation',planetName:'花信星',sakura:world.sakuraGarden.stats"],
 ['草原漫游 · 向任意方向拖动，探索星球每一面。','樱林漫游 · 沿着落花的小路，慢慢走一会儿。'],
 ['珊瑚海湾 · 看看水下的小花园，等等乘风而来的帆船。','花影水湾 · 等风经过，看一片花瓣落在水面。'],
 ['晴日草原 · 阳光落在草尖上。','樱花早晨 · 阳光穿过花枝，落在你身旁。'],
 ["$('plant-count').textContent=String(world.stats", "$('sakura-wish').onclick=()=>{world.sakuraGarden.wish();toast('愿你想念的人，也正遇见一场温柔的花开。');};\n  $('plant-count').textContent=String(world.stats"]
]);
edit('page.html',[
 ['data-experience="scenic"','data-experience="scenic" data-planet="sakura"'],
 ['#d9f1f8','#e9e5ed'],['Little Bloom · 晴日小岛','花信星 · 樱花季'],
 ['<a class="brand" href="#" aria-label="Little Bloom 首页"><span class="brand-mark">☀</span><span>little bloom<span class="brand-sub">晴日小岛 · 海风慢慢</span></span></a>','<a class="brand" href="#" aria-label="花信星首页"><span class="brand-mark">✿</span><span>花信星<span class="brand-sub">HANA NO HOSHI · SAKURA SEASON</span></span></a>'],
 ['<div class="live"><i>','<div class="live"><i>'],
 ['</header>','</header>\n    <nav class="planet-switch" aria-label="选择星球"><a href="little-bloom.html">晴日星球</a><a href="sakura-season.html" aria-current="page">樱花季</a></nav>\n    <section class="sakura-letter" aria-label="春日寄语"><span class="letter-kicker">A LITTLE LETTER FROM SPRING</span><h1>风起时，<br>花会替我想你。</h1><p>把日子放慢，等一场温柔的花开。</p><button id="sakura-wish" class="sakura-wish"><span aria-hidden="true">✿</span> 寄一阵花信 <span aria-hidden="true">↗</span></button></section>'],
 ['❧ 草原','✿ 樱林'],['≈ 帆船','≈ 花影湾'],['◉ 全景','◉ 小星球'],
 ['☀ 早晨','☀ 花朝'],['◒ 黄昏','◒ 晚霞'],['☾ 夜晚','☾ 月下樱'],
 ['正在唤醒这颗小星球…','风正在把春天送来…'],
 ['底部选择草原、帆船、垂钓、伙伴或全景。','底部选择樱林、花影湾、垂钓、伙伴或小星球。点「寄一阵花信」，让一阵樱花雨替你传递心意。'],
 ['现在是清爽的观景模式，菜园、旅行和建造面板暂时收起，原有进度仍保存在当前浏览器。公网地址与本地页面的存档分别保存。','花信星拥有独立的春日生活与存档。左上方可返回晴日星球，两颗星球分别保存各自的进度。'],
 ['<div class="planet-caption"><span>✧</span> 拖动探索 <b>·</b> 双指缩放</div>','<div class="planet-caption"><span>✧</span> 拖动星球，收藏每一面的春天 <b>·</b> 滚轮 / 双指缩放</div>']
]);
console.log('Sakura app, camera and interface wired.');
