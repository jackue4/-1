import {createStorybookSky} from './storybook-sky.js';
import {createPlanetTransitions} from './planet-transitions.js';

const planets = {
  sunny: {
    number: '01', name: '晴日小岛', english: 'THE SUNLIT ISLAND',
    invitation: '把日子，种成喜欢的样子。',
    description: '在柔软的草地上种下一颗种子，给小动物留一个位置。看屋檐染上晚霞，等第一颗星星亮起。',
    mood: '草木的清香 · 慢慢生长的日常',
    features: [['sprout', '种下花与愿望'], ['home', '搭建自己的小家'], ['animal', '遇见动物邻居'], ['moon', '从晨光待到星夜']],
    note: '适合想把生活放慢一点的你',
    button: '出发，去晴日小岛',
  },
  coast: {
    number: '02', name: '海风来信', english: 'LETTERS FROM THE SEA',
    invitation: '下一站，是海风和樱花。',
    description: '沿着海岸等一班慢慢驶来的电车，听浪花经过木桥。花瓣漂向透明的海湾，远处的灯塔为你亮着。',
    mood: '咸咸的海风 · 一场没有时刻表的旅行',
    features: [['train', '搭上海岸电车'], ['wave', '走近透明海湾'], ['flower', '淋一场花瓣雨'], ['beacon', '等灯塔为你亮起']],
    note: '适合想暂时躲进海风里的你',
    button: '出发，去海风来信',
  },
  festival: {
    number: '03', name: '星愿游乐园', english: 'THE STARWISH PARK',
    invitation: '把今天，过成一个小小的节日。',
    description: '乘着小火车环游一整颗星球，穿过山洞，掠过蓝色泻湖。旋转木马等在城堡旁，入夜以后，让心愿开成漫天烟花。',
    mood: '奶油色的童话 · 一场为你亮起的庆典',
    features: [['castle', '走进原创星愿城堡'], ['carousel', '坐上温柔旋转木马'], ['train', '搭乘环球小列车'], ['fireworks', '等一场星愿烟花秀']],
    note: '适合想给自己一点小小惊喜的你',
    button: '出发，去星愿游乐园',
  },
};

const iconPaths = {
  sprout: '<path d="M12 21V10m0 5C4 16 3 9 4 5c6 0 10 3 8 10Zm0-4c0-6 4-9 9-8 1 6-3 10-9 8Z"/>',
  home: '<path d="m3 11 9-8 9 8M5 10v11h14V10M10 21v-7h4v7M16 6V3h3v6"/>',
  animal: '<path d="M7 11 4 5l6 2m7 4 3-6-6 2M4 15c0-5 3-8 8-8s8 3 8 8-3 6-8 6-8-1-8-6Z"/><path d="M8 14h.01M16 14h.01m-6 3 2 1 2-1"/>',
  moon: '<path d="M19 15A8 8 0 0 1 9 5 8.3 8.3 0 1 0 19 15ZM17 3v4m-2-2h4m1 4v3m-1.5-1.5h3"/>',
  train: '<rect x="5" y="3" width="14" height="16" rx="4"/><path d="M5 12h14M12 3v9M8 16h.01M16 16h.01M8 19l-2 3m10-3 2 3"/>',
  wave: '<path d="M2 10c3-4 6 4 9 0s6 4 11 0M2 16c3-4 6 4 9 0s6 4 11 0M5 5h4m-2-2v4"/>',
  flower: '<path d="M12 10C3 2 3 13 9 13 1 18 11 23 12 16c1 7 11 2 3-3 6 0 6-11-3-3Zm0 0c-5-11 5-11 0 0Z"/><circle cx="12" cy="13" r="1.5"/>',
  beacon: '<path d="m7 22 2-14h6l2 14M8 17h8M8 8h8M8 5l4-3 4 3v3H8ZM10 5h4m-9 1L2 4m17 2 3-2M4 10H1m19 0h3"/>',
  castle: '<path d="M3 21V10h5v11m8 0V10h5v11M2 10l3.5-5L9 10m6 0 3.5-5 3.5 5M8 21V8h8v13M7 8l5-6 5 6M10 21v-5a2 2 0 0 1 4 0v5M11 11h2M2 21h20"/>',
  carousel: '<path d="M3 8h18L12 2 3 8ZM5 8v12m14-12v12M3 21h18M12 8v11M8 13h7l2 3h-3l-1-2-3 2-2-3Zm7 0 1-3 2 1-1 3M8 15l-2 3m7-2 1 3"/>',
  fireworks: '<path d="M12 9V2m-4 9L3 6m13 5 5-5M6 15H1m17 0h5M8 18l-4 4m12-4 4 4m-8-5v5M3 2h.01M21 2h.01M12 13h.01"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || ''}</svg>`;
const sparkle = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 0 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z"/></svg>';

export function createPlanetSelector({ onSelect, onEnter }) {
  const root = document.createElement('section');
  root.id = 'planet-selector';
  root.dataset.planet = 'sunny';
  root.setAttribute('aria-label', '选择你的星球');
  root.innerHTML = `
    <div class="ps-stars" aria-hidden="true"></div>
    <div class="ps-grain" aria-hidden="true"></div>
    <header class="ps-header">
      <a class="ps-brand" href="#home" aria-label="Little Bloom 小小宇宙首页"><span class="ps-brand-mark">${sparkle}</span><span>little bloom<small>小 小 宇 宙</small></span></a>
      <span class="ps-header-note"><i></i> 随时出发，慢慢抵达</span>
    </header>
    <div class="ps-layout">
      <div class="ps-story">
        <p class="ps-eyebrow"><span class="ps-tiny-star">✦</span> 选择一颗星球 <span class="ps-rule"></span></p>
        <p class="ps-world-index"><span data-planet-number>01</span> <span>/</span> <span data-planet-english>THE SUNLIT ISLAND</span></p>
        <h1 id="ps-planet-name" tabindex="-1">晴日小岛</h1>
        <p class="ps-invitation" data-planet-invitation></p>
        <p class="ps-description" data-planet-description></p>
        <div class="ps-features" aria-label="这颗星球里的小小日常"></div>
        <p class="ps-mood"><span aria-hidden="true">⌁</span> <span data-planet-mood></span></p>
      </div>
      <div class="ps-stage">
        <div class="ps-halo" aria-hidden="true"></div>
        <div class="ps-orbit ps-orbit-one" aria-hidden="true"><span></span></div>
        <div class="ps-orbit ps-orbit-two" aria-hidden="true"></div>
        <span class="ps-stage-star ps-stage-star-one" aria-hidden="true">✧</span>
        <span class="ps-stage-star ps-stage-star-two" aria-hidden="true">✦</span>
        <div id="planet-preview" class="ps-preview" aria-label="所选星球的动态全景"></div>
        <div class="ps-preview-status" role="status"><span></span> 正在唤醒这颗星球…</div>
        <div class="ps-coordinate" aria-hidden="true"><span>YOUR LITTLE UNIVERSE</span><i></i><span>一颗小小的星球，一段自己的时光</span></div>
        <div class="ps-choices" role="group" aria-label="星球选择">
          <button class="ps-choice" type="button" data-planet-choice="sunny" aria-pressed="true" aria-controls="ps-planet-name planet-preview" aria-label="选择晴日小岛">
            <span class="ps-choice-orbit"><span class="ps-mini-planet ps-mini-sunny"><i></i><b></b><em></em></span><span class="ps-choice-dot"></span></span>
            <span class="ps-choice-caption"><small>01 / SUNNY</small><strong>晴日小岛</strong></span>
            <span class="ps-choice-check" aria-hidden="true">✓</span>
          </button>
          <span class="ps-choice-path" aria-hidden="true"></span>
          <button class="ps-choice" type="button" data-planet-choice="coast" aria-pressed="false" aria-controls="ps-planet-name planet-preview" aria-label="选择海风来信">
            <span class="ps-choice-orbit"><span class="ps-mini-planet ps-mini-coast"><i></i><b></b><em></em></span><span class="ps-choice-dot"></span></span>
            <span class="ps-choice-caption"><small>02 / COAST</small><strong>海风来信</strong></span>
            <span class="ps-choice-check" aria-hidden="true">✓</span>
          </button>
          <span class="ps-choice-path" aria-hidden="true"></span>
          <button class="ps-choice" type="button" data-planet-choice="festival" aria-pressed="false" aria-controls="ps-planet-name planet-preview" aria-label="选择星愿游乐园">
            <span class="ps-choice-orbit"><span class="ps-mini-planet ps-mini-festival"><i></i><b></b><em></em></span><span class="ps-choice-dot"></span></span>
            <span class="ps-choice-caption"><small>03 / STARWISH</small><strong>星愿游乐园</strong></span>
            <span class="ps-choice-check" aria-hidden="true">✓</span>
          </button>
        </div>
      </div>
    </div>
    <footer class="ps-footer">
      <div class="ps-footer-note"><span aria-hidden="true">${sparkle}</span><div><p data-planet-note></p><small>这里没有必须完成的事，只有你喜欢的风景。</small></div></div>
      <button id="enter-planet" class="ps-enter" type="button"><span data-enter-label>出发，去晴日小岛</span><span class="ps-enter-arrow" aria-hidden="true">↗</span></button>
    </footer>`;
  document.body.append(root);
  const preview = root.querySelector('#planet-preview');
  const choices = [...root.querySelectorAll('[data-planet-choice]')];
  const enter = root.querySelector('#enter-planet');
  const transition=createPlanetTransitions({root,preview,story:root.querySelector('.ps-story')});
  const sky=createStorybookSky({container:root,variant:'lobby',seed:83721});
  let skyFrame=0,skyLast=0,visible=true;
  function skyTick(now){skyFrame=0;if(!visible||document.hidden)return;const dt=skyLast?Math.min((now-skyLast)/1000,.05):0;skyLast=now;sky.update(dt,{night:1});skyFrame=requestAnimationFrame(skyTick);}
  function skyActive(){cancelAnimationFrame(skyFrame);skyLast=0;sky.setActive(visible&&!document.hidden);if(visible&&!document.hidden)skyFrame=requestAnimationFrame(skyTick);}
  document.addEventListener('visibilitychange',skyActive);
  skyActive();
  let selected = 'sunny';
  let busy = false;

  function select(id) {
    const planet = planets[id];
    if (!planet) return;
    selected = id;
    root.dataset.planet = id;
    root.querySelector('[data-planet-number]').textContent = planet.number;
    root.querySelector('[data-planet-english]').textContent = planet.english;
    root.querySelector('#ps-planet-name').textContent = planet.name;
    for (const key of ['invitation', 'description', 'mood', 'note']) root.querySelector(`[data-planet-${key}]`).textContent = planet[key];
    root.querySelector('[data-enter-label]').textContent = busy ? '星球准备中…' : planet.button;
    root.querySelector('.ps-features').innerHTML = planet.features.map(([name, label]) => `<span class="ps-feature">${icon(name)}<span>${label}</span></span>`).join('');
    for (const choice of choices) choice.setAttribute('aria-pressed', String(choice.dataset.planetChoice === id));
    preview.setAttribute('aria-label', `${planet.name}的动态全景`);
    enter.setAttribute('aria-label', `进入${planet.name}游戏`);
  }
  function setBusy(value) {
    busy = !!value;
    root.dataset.busy = String(busy);
    root.setAttribute('aria-busy', String(busy));
    enter.disabled = busy;
    root.querySelector('[data-enter-label]').textContent = busy ? '星球准备中…' : planets[selected].button;
  }
  for (const choice of choices) {
    choice.addEventListener('click', () => onSelect(choice.dataset.planetChoice));
    choice.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const step = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
      const target = choices[(choices.indexOf(choice) + step + choices.length) % choices.length];
      target.focus();
      onSelect(target.dataset.planetChoice);
    });
  }
  enter.addEventListener('click', () => { if (!busy) onEnter(); });
  select('sunny');
  setBusy(false);
  return {
    root, preview, select, setBusy,
    leave:transition.leave, enter:transition.enter, cancelTransition:transition.cancel,
    getState:()=>({selected,busy,transition:transition.getState(),sky:sky.getState()}),
    show() { root.hidden = false;visible=true;skyActive(); },
    hide() { root.hidden = true;visible=false;skyActive();transition.cancel(); },
  };
}
