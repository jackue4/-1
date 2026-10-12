import {CROPS,RECIPES,advanceFarm,plotStatus,plant,water,harvest,sell,buySeed,cook,orderFor,canPay,fulfill,expand,hire,forage} from './farming.js';
import {weatherSegments} from './ecology.js';
import {PLOT_SITES} from './layout.js';
import {projectProgress} from './construction.js';

export function createFarmUI({getState,world,save,toast,focus,renderTravel,scenic=false,document=globalThis.document}){
  const $=id=>document.getElementById(id),panel=$('farm-panel'),farm=()=>getState().farm;
  let selected=0,seed='radish',time=0,lastTick=0;const jobs=new Map();
  const costText=cost=>Object.entries(cost).map(([k,n])=>`${CROPS[k].name} ×${n}`).join(' + ');
  const kitchenReady=r=>r.id==='picnic'||projectProgress('mill',getState().construction.elapsed)>=1;
  function button(parent,id,label,fn){const b=document.createElement('button');b.id=id;b.textContent=label;b.type='button';b.onclick=fn;parent.append(b);return b;}
  function act(fn,kind){advanceFarm(farm(),Date.now(),weatherSegments);const result=fn();if(result.ok){world.farm.sync(farm());world.farm.pulse(selected,kind,time);save();renderTravel();}toast(result.message);render();return result;}
  function showPane(name){if(scenic)name="none";document.documentElement.dataset.panel=name;document.querySelectorAll('[data-pane]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pane===name)));panel.hidden=name!=='farm';document.querySelector('.pet-card').hidden=name!=='travel';document.querySelector('.build-card').hidden=name!=='build';document.querySelector('.weather-card').hidden=name!=='weather';}
  document.querySelectorAll('[data-pane]').forEach(b=>b.onclick=()=>showPane(document.documentElement.dataset.panel===b.dataset.pane?'none':b.dataset.pane));
  for(const [k,c] of Object.entries(CROPS))button($('seed-options'),`seed-${k}`,c.name,()=>{seed=k;render();});
  const plotButtons=[];
  PLOT_SITES.map((s,i)=>({...s,i})).sort((a,b)=>b.row-a.row||a.col-b.col).forEach(({i})=>{plotButtons[i]=button($('plot-map'),`plot-${i}`,'',()=>select(i,true));});
  button($('plot-actions'),'farm-plant','播种',()=>act(()=>plant(farm(),selected,seed),'plant'));
  button($('plot-actions'),'farm-water','浇水',()=>act(()=>water(farm(),selected),'water'));
  button($('plot-actions'),'farm-harvest','收获',()=>act(()=>harvest(farm(),selected),'harvest'));
  for(const [k,c] of Object.entries(CROPS)){
    const row=document.createElement('div');row.className='pantry-row';const text=document.createElement('span');text.id=`stock-${k}`;row.append(text);
    button(row,`buy-${k}`,k==='radish'?'领种子':'种子 · 2 叶币',()=>act(()=>buySeed(farm(),k)));
    button(row,`sell-${k}`,`卖出 · ${c.price}`,()=>act(()=>sell(farm(),k)));$('pantry').append(row);
  }
  for(const r of RECIPES){const row=document.createElement('div');row.className='recipe-row';const text=document.createElement('span');text.textContent=`${r.icon} ${r.name}`;const small=document.createElement('small');small.textContent=costText(r.cost);text.append(small);row.append(text);button(row,`cook-${r.id}`,`做 ${r.snacks} 份`,()=>act(()=>kitchenReady(r)?cook(farm(),getState().travel,r.id):{ok:false,message:'等风车工坊建好，就能烤面包啦。'}));$('recipes').append(row);}
  $('farm-order').onclick=()=>act(()=>fulfill(farm()));$('farm-expand').onclick=()=>act(()=>expand(farm()));$('farm-hire').onclick=()=>act(()=>hire(farm()));
  $('farm-helpers').onclick=()=>{farm().helpers=!farm().helpers;jobs.clear();save();render();};
  $('farm-orchard').onclick=()=>{focus('orchard');act(()=>forage(farm(),Date.now()));};
  $('farm-focus').onclick=()=>{showPane('farm');focus('farm');};
  $('farm-diary').onclick=()=>$('diary-toggle').click();
  document.querySelectorAll('[data-farm-tab]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-farm-tab]').forEach(x=>x.setAttribute('aria-selected',String(x===b)));document.querySelectorAll('[data-farm-section]').forEach(x=>x.hidden=x.dataset.farmSection!==b.dataset.farmTab);});
  function select(i,move=false){showPane('farm');if(i>=farm().unlocked){toast('完成邻居心愿，攒叶币扩建这片菜园。');return;}selected=i;if(!scenic)world.farm.select(i);if(move)focus('farm');render();}
  function render(){const f=farm(),p=f.plots[selected],c=CROPS[p.crop],ready=f.plots.filter(p=>p.crop&&p.growth>=1).length;
    $('farm-coins').textContent=f.coins;$('farm-size').textContent=`${f.unlocked} / 18 块田`;
    $('farm-guide').textContent=f.harvests===0?'从一粒种子开始：选田 → 播种 → 浇水 → 收获':f.meals===0?'把萝卜和小麦做成便当，让海獭带种子回家。':!f.strawberry?'旅行中的伙伴，会带回新的草莓种子。':f.unlocked<18?'种子留下，收成分享；完成邻居心愿，扩建菜园。':'田园、村落与远方，都在慢慢生长。';
    $('farm-summary').textContent=ready?`${ready} 块田可以收获`:'风吹菜叶，慢慢长大';
    $('plot-title').textContent=`第 ${selected+1} 块田 · ${c?c.name:'等待一粒种子'}`;
    $('plot-state').textContent=p.crop?`${plotStatus(p)} · ${Math.floor(p.growth*100)}% · ${p.growth>=1?'果实会等你':p.water>0?'泥土湿润':'有点口渴，生长较慢'}`:'选一种喜欢的作物，再点击播种。';
    $('crop-progress').style.width=`${p.growth*100}%`;$('crop-progressbar').setAttribute('aria-valuenow',String(Math.floor(p.growth*100)));
    $('farm-plant').disabled=!!p.crop||f.seeds[seed]<1||(seed==='strawberry'&&!f.strawberry);$('farm-water').disabled=!p.crop||p.growth>=1||p.water>80;$('farm-harvest').disabled=!p.crop||p.growth<1;
    $('farm-plant').textContent=`播种 ${CROPS[seed].icon}`;
    for(const [k,crop] of Object.entries(CROPS)){const b=$(`seed-${k}`);b.textContent=`${crop.icon} ${crop.name} · ${f.seeds[k]}`;b.disabled=k==='strawberry'&&!f.strawberry;b.setAttribute('aria-pressed',String(seed===k));b.title=`浇水后约 ${crop.seconds} 秒成熟 · ${k==='strawberry'&&!f.strawberry?'旅行带回种子':'收获时留回一粒种子'}`;$(`stock-${k}`).textContent=`${crop.icon} ${crop.name} ×${f.produce[k]}`;$(`sell-${k}`).disabled=f.produce[k]<1;$(`buy-${k}`).disabled=(k==='strawberry'&&!f.strawberry)||(k!=='radish'&&f.coins<2);}
    for(let i=0;i<18;i++){const p=f.plots[i],b=plotButtons[i],locked=i>=f.unlocked;b.textContent=locked?'＋':p.crop?(p.growth>=1?CROPS[p.crop].icon:'🌱'):'·';b.className=locked?'locked':p.growth>=1?'ripe':p.water>0?'wet':'';b.setAttribute('aria-pressed',String(i===selected));b.setAttribute('aria-label',`第 ${i+1} 块田，${locked?'待扩建':plotStatus(p)}`);b.title=`第 ${i+1} 块田 · ${locked?'待扩建':plotStatus(p)}`;}
    for(const r of RECIPES){const b=$(`cook-${r.id}`);b.disabled=!kitchenReady(r)||!canPay(f,r.cost)||getState().travel.snacks+r.snacks>20;b.textContent=kitchenReady(r)?`做 ${r.snacks} 份`:'风车未完工';}
    const o=orderFor(f);$('order-name').textContent=o.name;$('order-cost').textContent=`${costText(o.cost)} → ${o.coins} 叶币`;$('farm-order').disabled=!canPay(f,o.cost);
    $('farm-expand').textContent=f.unlocked===18?'菜园已全部开放':`扩建 6 块田 · ${f.unlocked===6?24:60} 叶币`;$('farm-expand').disabled=f.unlocked===18||f.coins<(f.unlocked===6?24:60);
    $('farm-hire').textContent=f.harvester?'桃桃已加入收获小队':'邀请桃桃帮收获 · 18 叶币';$('farm-hire').disabled=f.harvester||f.coins<18;
    $('farm-helpers').textContent=f.helpers?'伙伴帮忙：开启':'伙伴帮忙：休息';$('farm-helpers').setAttribute('aria-pressed',String(f.helpers));
    $('farm-orchard').disabled=f.unlocked<18||Date.now()<f.orchardAt;$('farm-orchard').textContent=f.unlocked<18?'18 块田时开放后山莓果园':Date.now()<f.orchardAt?`莓果再等 ${Math.ceil((f.orchardAt-Date.now())/60000)} 分钟`:'去后山摘莓果 · 3 份';
  }
  function tick(now){advanceFarm(farm(),now,weatherSegments);world.farm.sync(farm());render();}
  function beforeFrame(dt,t,env){time=t;if(t-lastTick>.5){tick(Date.now());lastTick=t;}
    const f=farm(),rest=!f.helpers||env.rain>.35||env.snow>.35||env.night>.65;
    if(rest){jobs.clear();return jobs;}
    for(const [id,kind] of [[0,'water'],[1,'harvest']]){
      if(kind==='harvest'&&!f.harvester){jobs.delete(id);continue;}
      const valid=i=>i<f.unlocked&&f.plots[i].crop&&(kind==='water'?f.plots[i].water<18&&f.plots[i].growth<1:f.plots[i].growth>=1);
      let job=jobs.get(id);if(job&&!valid(job.index)){jobs.delete(id);job=null;}
      if(!job){const index=f.plots.findIndex((_,i)=>valid(i)&&![...jobs.values()].some(j=>j.index===i));if(index>=0){const n=world.farm.normals[index].clone(),normal=n.clone(); // stand in the lane, facing the crop
        const site=PLOT_SITES[index];normal.set(Math.cos(site.lat-.063)*Math.sin(site.lon),Math.sin(site.lat-.063),Math.cos(site.lat-.063)*Math.cos(site.lon));job={index,kind,normal,lookAt:n,dwell:0};jobs.set(id,job);}}
    }
    return jobs;
  }
  function afterFrame(dt){for(const [id,j] of jobs){const p=world.residents[id];if(!p){jobs.delete(id);continue;}if(p.normal.distanceTo(j.normal)<.025){j.dwell+=dt;if(j.dwell>2.2){const result=j.kind==='water'?water(farm(),j.index):harvest(farm(),j.index);if(result.ok){world.farm.pulse(j.index,j.kind,time);save();world.farm.sync(farm());render();}jobs.delete(id);}}else j.dwell=0;}}
  showPane('farm');select(0);tick(Date.now());
  return {tick,render,select,showPane,beforeFrame,afterFrame,activate(place){showPane('farm');if(place==='orchard')$('farm-orchard').click();else document.querySelector('[data-farm-tab="pantry"]').click();}};
}
