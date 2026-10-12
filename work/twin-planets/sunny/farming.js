// Pure saved-state rules. All actions validate again here, not just in the UI.
export const CROPS={
  radish:{name:'樱桃萝卜',icon:'🥕',seconds:50,price:3,color:'#ec7183'},
  wheat:{name:'金色小麦',icon:'🌾',seconds:95,price:5,color:'#e4be65'},
  tomato:{name:'阳光番茄',icon:'🍅',seconds:150,price:8,color:'#ed7959'},
  strawberry:{name:'海岛草莓',icon:'🍓',seconds:210,price:12,color:'#d85b77'},
};
const keys=Object.keys(CROPS),finite=(v,d=0)=>Number.isFinite(v)?v:d;
const count=(v,d=0)=>Math.max(0,Math.min(99999,Math.floor(finite(v,d))));
const empty=()=>({crop:null,growth:0,water:0});
export function restoreFarm(raw,now){
  const r=raw&&raw.version===1?raw:{};
  const f={version:1,updatedAt:Math.max(now-86400000,Math.min(now,finite(r.updatedAt,now))),coins:count(r.coins,18),unlocked:[6,12,18].includes(r.unlocked)?r.unlocked:6,
    seeds:{},produce:{},plots:[],strawberry:!!r.strawberry,helpers:r.helpers!==false,harvester:!!r.harvester,harvests:count(r.harvests),orders:count(r.orders),meals:count(r.meals),orchardAt:Math.max(0,finite(r.orchardAt)),lastReward:Math.max(0,finite(r.lastReward))};
  for(const k of keys){f.seeds[k]=count(r.seeds?.[k],({radish:6,wheat:4,tomato:2,strawberry:0})[k]);f.produce[k]=count(r.produce?.[k]);}
  for(let i=0;i<18;i++){const p=r.plots?.[i];f.plots.push(i<f.unlocked&&p&&keys.includes(p.crop)?{crop:p.crop,growth:Math.max(0,Math.min(1,finite(p.growth))),water:Math.max(0,Math.min(100,finite(p.water)))}:empty());}
  return f;
}
export function advanceFarm(f,now,segments){
  if(!Number.isFinite(now)||now<=f.updatedAt)return;
  const from=Math.max(f.updatedAt,now-86400000);
  for(const {seconds,rain} of segments(from,now)){
    for(const p of f.plots.slice(0,f.unlocked)){
      if(!p.crop)continue;
      const wet=rain?seconds:Math.min(seconds,p.water);
      p.growth=Math.min(1,p.growth+(wet+(seconds-wet)*.3)/CROPS[p.crop].seconds);
      p.water=rain?100:Math.max(0,p.water-seconds);
    }
  }
  f.updatedAt=now;
}
export function plotStatus(p){return !p.crop?'空地':p.growth>=1?'可以收获':p.growth<.22?'刚刚发芽':p.growth<.65?'舒展叶子':'快成熟了';}
export function plant(f,index,crop){const p=f.plots[index];if(index>=f.unlocked||!p||p.crop||!CROPS[crop]||(!f.strawberry&&crop==='strawberry')||f.seeds[crop]<1)return {ok:false,message:'这块田或种子还没准备好。'};f.seeds[crop]--;Object.assign(p,{crop,growth:.01,water:0});return {ok:true,message:`种下${CROPS[crop].name}，给它浇点水吧。`};}
export function water(f,index){const p=f.plots[index];if(index>=f.unlocked||!p?.crop||p.growth>=1||p.water>80)return {ok:false,message:'这块田暂时不用浇水。'};p.water=100;return {ok:true,message:'泥土喝饱水了，种子会长得更快。'};}
export function harvest(f,index){const p=f.plots[index];if(index>=f.unlocked||!p?.crop||p.growth<1)return {ok:false,message:'再等一等，果实还在慢慢长大。'};const k=p.crop;f.produce[k]+=2;f.seeds[k]++;f.harvests++;Object.assign(p,empty());return {ok:true,message:`收下 2 份${CROPS[k].name}，留回 1 粒种子。`};}
export function sell(f,k){if(!CROPS[k]||f.produce[k]<1)return {ok:false,message:'先去田里收获一些作物。'};f.produce[k]--;f.coins+=CROPS[k].price;return {ok:true,message:`卖出一份${CROPS[k].name}，得到 ${CROPS[k].price} 枚叶币。`};}
export function buySeed(f,k){if(!CROPS[k]||(k==='strawberry'&&!f.strawberry))return {ok:false,message:'草莓种子会由旅行伙伴带回。'};const cost=k==='radish'?0:2;if(f.coins<cost)return {ok:false,message:'还差一点叶币。'};if(f.seeds[k]>=99)return {ok:false,message:'种子袋已经装满啦。'};f.coins-=cost;f.seeds[k]++;return {ok:true,message:cost?'买好一粒种子。':'邻居送来一粒萝卜种子，慢慢种就好。'};}
export const RECIPES=[{id:'picnic',name:'田园便当',icon:'🍱',cost:{radish:2,wheat:1},snacks:2},{id:'tomato',name:'番茄三明治',icon:'🥪',cost:{tomato:1,wheat:2},snacks:3},{id:'berry',name:'草莓野餐盒',icon:'🍓',cost:{strawberry:2,wheat:1},snacks:4}];
export function canPay(f,cost){return Object.entries(cost).every(([k,n])=>f.produce[k]>=n);}
export function cook(f,travel,id){const r=RECIPES.find(x=>x.id===id);if(!r||!canPay(f,r.cost))return {ok:false,message:'食材还没凑齐，再去菜园看看。'};if(travel.snacks+r.snacks>20)return {ok:false,message:'行囊已满，先出发旅行吧。'};for(const [k,n] of Object.entries(r.cost))f.produce[k]-=n;travel.snacks+=r.snacks;f.meals++;return {ok:true,message:`做好${r.name}，获得 ${r.snacks} 份旅行食物。`};}
export function orderFor(f){return [{name:'麦麦的早餐',cost:{radish:2},coins:10},{name:'棉棉的烤面包',cost:{wheat:2},coins:16},{name:'桃桃的野餐',cost:{tomato:2,radish:1},coins:25}][f.orders%3];}
export function fulfill(f){const o=orderFor(f);if(!canPay(f,o.cost))return {ok:false,message:'邻居会等你，收齐食材再来。'};for(const [k,n] of Object.entries(o.cost))f.produce[k]-=n;f.coins+=o.coins;f.orders++;return {ok:true,message:`${o.name}送到啦！收到 ${o.coins} 枚叶币。`};}
export function expand(f){const cost=f.unlocked===6?24:60;if(f.unlocked>=18||f.coins<cost)return {ok:false,message:'叶币还不够，卖出收成或完成邻居心愿就能积攒。'};f.coins-=cost;f.unlocked+=6;return {ok:true,message:f.unlocked===18?'18 块田准备好啦，后山的莓果园也开放了。':'新添了 6 块田，菜园更热闹了。'};}
export function hire(f){if(f.harvester||f.coins<18)return {ok:false,message:'邀请桃桃需要 18 枚叶币。'};f.coins-=18;f.harvester=true;return {ok:true,message:'桃桃会在白天帮忙摘成熟的果实。'};}
export function rewardSeeds(f,tripStamp){if(!tripStamp||f.lastReward===tripStamp)return false;f.lastReward=tripStamp;f.strawberry=true;f.seeds.strawberry+=2;return true;}
export function forage(f,now){if(f.unlocked<18||now<f.orchardAt)return {ok:false,message:'莓果还在生长，十分钟后再来。'};f.produce.strawberry+=3;f.strawberry=true;f.orchardAt=now+600000;return {ok:true,message:'从后山莓果园摘到 3 份草莓。'};}
