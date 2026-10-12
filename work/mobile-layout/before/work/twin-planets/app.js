import {mountCoast} from '../kamakura-planet/app.js';
import {mountSunny} from './sunny/app.js';
import {createWorldDocument} from './scoped-document.js';
import {coast,sunny} from './templates.generated.js';

const worlds={coast:{...coast,mount:mountCoast},sunny:{...sunny,mount:mountSunny}},instances=new Map();
let current=null,request=0;
const transit=document.getElementById('transit'),status=document.getElementById('journey-status');
async function visit(id){
 if(!worlds[id])return;
 const ticket=++request;if(id===current){transit.hidden=true;return;}
 transit.hidden=false;transit.querySelector('p').textContent=id==='sunny'?'把晴天，装进口袋。':'海风经过，灯塔等你。';
 await new Promise(resolve=>requestAnimationFrame(resolve));
 if(ticket!==request)return;
 try{
  let next=instances.get(id);
  if(!next){
   const data=worlds[id],host=document.getElementById(`world-${id}`),doc=createWorldDocument(host,data.markup,data.css,data.attributes);
   doc.setActive(true);
   try{const dispose=data.mount(doc);next={host,doc,dispose};instances.set(id,next);}catch(error){doc.setActive(false);doc.dispose();host.shadowRoot.innerHTML='';throw error;}
  }
  for(const [key,world] of instances)world.doc.setActive(key===id);
  current=id;document.documentElement.dataset.world=id;
  document.querySelectorAll('[data-world-button]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.worldButton===id)));
  history.replaceState(null,'',`#${id}`);
  status.textContent=id==='sunny'?'01 / 阳光落在草尖上':'02 / 海风写给春天';
  document.title=id==='sunny'?'Little Bloom · 晴日小岛':'Little Bloom · 海风来信';
  await new Promise(resolve=>requestAnimationFrame(resolve));
  if(ticket===request)transit.hidden=true;
 }catch(error){
  console.error(error);transit.querySelector('p').textContent='这段旅程暂时没有醒来，请刷新页面重试。';
  if(current){instances.get(current).doc.setActive(true);transit.hidden=true;status.textContent='暂时无法切换，请刷新重试';}
 }
}
document.querySelectorAll('[data-world-button]').forEach(button=>button.onclick=()=>visit(button.dataset.worldButton));
window.bloomUniverse={getState:()=>({active:current,loaded:[...instances.keys()],singleDocument:true,worlds:[...instances].map(([id,w])=>({id,visible:!w.host.hidden,ready:w.host.dataset.ready==='true'}))})};
visit(location.hash==='#sunny'?'sunny':'coast');
