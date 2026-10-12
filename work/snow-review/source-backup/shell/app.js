import {mountCoast} from '../kamakura-planet/app.js';
import {mountSunny} from './sunny/app.js';
import {mountFestival} from '../festival-planet/app.js';
import {createWorldDocument} from './scoped-document.js';
import {coast,sunny,festival} from './templates.generated.js';
import {installViewport} from './viewport.js';
import {installDisplayControls} from './display-controls.js';
import {createPlanetSelector} from './planet-selector.js';

const viewport=installViewport(document,window),display=installDisplayControls({document,window});
const worlds={sunny:{...sunny,mount:mountSunny,name:'晴日小岛',invitation:'把晴天，装进口袋。',status:'01 / 阳光落在草尖上'},coast:{...coast,mount:mountCoast,name:'海风来信',invitation:'海风经过，灯塔等你。',status:'02 / 海风写给春天'},festival:{...festival,mount:mountFestival,name:'星愿游乐园',invitation:'把今天，过成一个小小的节日。',status:'03 / 让心愿开成烟花'}},worldOrder=Object.keys(worlds),instances=new Map();
const root=document.documentElement,transit=document.getElementById('transit'),status=document.getElementById('journey-status');
const home=document.getElementById('planet-home');
let current=null,selected='sunny',screen='select',request=0,navigating=false;
const selector=createPlanetSelector({onSelect:id=>navigate(id,'select','replace'),onEnter:()=>navigate(selected,'play','push')});
const previewCSS=`:host([data-preview="true"]){background:transparent!important;pointer-events:none}
:host([data-preview="true"]) #app{background:transparent!important}
:host([data-preview="true"]) #app>:not(#scene){display:none!important}
:host([data-preview="true"]) #scene{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;background:transparent!important}
:host([data-preview="true"]) canvas{pointer-events:none!important}`;
function updateRoute(id,mode,method){
 const hash=mode==='select'?`#select/${id}`:`#${id}`;
 if(method&&location.hash!==hash)history[method==='push'?'pushState':'replaceState']({screen:mode,world:id},'',hash);
}
async function navigate(id,mode='select',method='push'){
 if(!worlds[id])return;
 if(current===id&&selected===id&&screen===mode&&!navigating)return;
 const ticket=++request,changingPreview=mode==='select'&&screen==='select'&&current!==null;
 const direction=worldOrder.indexOf(id)>=worldOrder.indexOf(current||selected)?1:-1;
 navigating=true;selected=id;screen=mode;root.dataset.screen=mode;selector.setBusy(true);
 if(mode==='select'){selector.show();transit.hidden=true;}else{selector.hide();transit.hidden=false;transit.querySelector('p').textContent=worlds[id].invitation;}
 home.hidden=mode==='select';updateRoute(id,mode,method);
 if(changingPreview){await selector.leave?.(direction);if(ticket!==request)return;}
 else selector.cancelTransition?.();
 selector.select(id);
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 if(ticket!==request)return;
 try{
  for(const world of instances.values())world.doc.setActive(false);
  let next=instances.get(id);const host=document.getElementById(`world-${id}`);
  if(mode==='select')selector.preview.append(host);else document.body.insertBefore(host,transit);
  if(!next){
   const data=worlds[id],doc=createWorldDocument(host,data.markup,data.css+previewCSS,data.attributes);doc.setActive(true);
   try{const dispose=data.mount(doc,{preview:mode==='select'});if(typeof dispose!=='function')throw new Error('World could not start');next={host,doc,dispose};instances.set(id,next);}
   catch(error){doc.setActive(false);doc.dispose();host.shadowRoot.innerHTML='';throw error;}
  }
  next.doc.setActive(true);next.dispose.setPreview?.(mode==='select');host.dataset.preview=String(mode==='select');host.inert=mode==='select';
  current=id;root.dataset.world=id;
  document.querySelectorAll('[data-world-button]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.worldButton===id)));
  status.textContent=worlds[id].status;
  document.title=mode==='select'?'Little Bloom · 选择你的星球':`Little Bloom · ${worlds[id].name}`;
  await new Promise(resolve=>requestAnimationFrame(resolve));
  if(ticket!==request)return;
  transit.hidden=true;
  if(changingPreview)await selector.enter?.(direction);
  if(ticket===request){navigating=false;selector.setBusy(false);if(mode==='play')home.focus({preventScroll:true});}
 }catch(error){
  if(ticket!==request)return;
  console.error(error);navigating=false;selector.cancelTransition?.();selector.setBusy(false);transit.hidden=false;transit.querySelector('p').textContent='星球暂时没有醒来，请刷新重试。';
  if(mode==='select'){transit.hidden=true;status.textContent='星球暂时无法预览';const button=document.getElementById('enter-planet');button.disabled=true;button.querySelector('[data-enter-label]').textContent='加载未完成，请刷新重试';}
 }
}
home.onclick=()=>navigate(current||selected,'select','push');
document.querySelectorAll('[data-world-button]').forEach(button=>button.onclick=()=>navigate(button.dataset.worldButton,'select','push'));
function fromLocation(){
 const hash=location.hash.slice(1);if(worlds[hash])return navigate(hash,'play',null);
 const id=hash.startsWith('select/')?hash.slice(7):'sunny';return navigate(worlds[id]?id:'sunny','select','replace');
}
window.addEventListener('popstate',fromLocation);window.addEventListener('hashchange',fromLocation);
window.bloomUniverse={getState:()=>({active:current,selected,screen,navigating,selector:selector.getState?.(),loaded:[...instances.keys()],singleDocument:true,display:display.getState(),viewport:viewport.getState(),worlds:[...instances].map(([id,w])=>({id,visible:!w.host.hidden,preview:w.host.dataset.preview==='true',ready:w.host.dataset.ready==='true'}))})};
fromLocation();
