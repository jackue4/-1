import {restoreConstruction} from './construction.js';
import {restoreFarm} from './farming.js';
// Local, deterministic weather. This is a fictional world, not a weather service.
export const WEATHER = {
  clear: { label: '晴日', icon: '☀', note: '阳光晒暖了沙滩，海风捎来一点咸甜。', temperature: 26, cloud: .24, rain: 0, snow: 0, wind: .35, light: 1, color: '#d9f1f8' },
  cloudy: { label: '多云', icon: '☁', note: '白云像棉花糖，慢慢经过蓝色的海。', temperature: 23, cloud: .8, rain: 0, snow: 0, wind: .55, light: .8, color: '#e1f0f5' },
  rain: { label: '细雨', icon: '☂', note: '听一会儿海边的雨，屋檐下也很温暖。', temperature: 21, cloud: 1, rain: 1, snow: 0, wind: .7, light: .65, color: '#cce5ed' },
  mist: { label: '薄雾', icon: '≋', note: '海面披上薄纱，灯塔守着小岛的早晨。', temperature: 20, cloud: .55, rain: 0, snow: 0, wind: .2, light: .75, color: '#e2f0ed' },
  snow: { label: '轻雪', icon: '❄', note: '偶尔飘来的小雪，是海岛的一封冬日来信。', temperature: 1, cloud: .75, rain: 0, snow: 1, wind: .35, light: .9, color: '#e9f4fb' },
};
export const EVENTS = {
  breeze: { icon: '🍃', title: '风寄来了一封信', text: '树冠轻轻摇晃，花瓣沿着小路旅行。', effect: 'petals' },
  butterflies: { icon: '🦋', title: '花田来了新朋友', text: '蝴蝶围着花丛跳舞，居民停下来打了个招呼。', effect: 'butterflies' },
  apple: { icon: '🍎', title: '一颗苹果的礼物', text: '果树落下一颗熟苹果，小居民正赶去拾起它。', effect: 'apple' },
  gathering: { icon: '🧺', title: '把好天气分给大家', text: '邻居们走向风车前的草地，分享今天的小点心。', effect: 'gathering' },
  sprouts: { icon: '🌱', title: '又一粒种子醒来了', text: '小花园里冒出新芽，慢慢长大就是最好的消息。', effect: 'growth' },
  harvest: { icon: '🌿', title: '小花园到了收获的日子', text: '大家收下长大的香草，留几株嫩苗，等待下一次春天。', effect: 'harvest' },
  rainDance: { icon: '💧', title: '海湾在写小圆圈', text: '雨点落入浅海，居民撑着伞，踏上回家的小路。', effect: 'ripples' },
  fireflies: { icon: '✨', title: '草地亮起了小星星', text: '萤火虫沿着林间小路飞舞，晚归的人放轻了脚步。', effect: 'fireflies' },
  snowfall: { icon: '❄️', title: '世界轻轻盖好被子', text: '雪花慢慢飘落，家家户户的窗户泛着暖光。', effect: 'snow' },
  birds: { icon: '🐦', title: '海风带来的问候', text: '白色海鸟掠过帆船，绕着小岛画了一个圆。', effect: 'birds' },
  rainbow: { icon: '🌈', title: '雨后有一座小桥', text: '雨停了，蓝色海湾上方升起一道淡淡的彩虹。', effect: 'rainbow' },
};
export function hash(text) { let h = 2166136261; for (const c of text) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
export function random(seed) { let a = seed >>> 0; return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function dateKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
export function makeDay(date) {
  const key = dateKey(date), rng = random(hash(key + '/bloom-weather-v2'));
  const ordinal = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  const order = ['clear', 'mist', 'cloudy', 'rain', 'clear', 'snow', 'cloudy'];
  const hours = [0, 6, 11, 16, 20];
  // Each day's weather sequence differs from its neighboring days. Changes are
  // scheduled at an irregular minute, stable across reloads on that date.
  return { key, slots: hours.map((h, i) => ({ minute: h * 60 + (i ? Math.floor(rng() * 45) : 0), type: order[(ordinal + i * 2) % order.length], temperature: Math.round(WEATHER[order[(ordinal + i * 2) % order.length]].temperature + rng() * 4 - 2) })) };
}
export function weatherAt(day, date) { const minute = date.getHours() * 60 + date.getMinutes(); return day.slots.filter(s => s.minute <= minute).at(-1) || day.slots[0]; }
export function lightAt(hour) {
  const daylight = Math.max(0, Math.min(1, Math.sin((hour - 6) / 12 * Math.PI) * 1.7));
  const sunset = Math.max(0, 1 - Math.min(Math.abs(hour - 6.5), Math.abs(hour - 17.5)) / 1.8);
  return { daylight, sunset, label: daylight < .08 ? '月光时刻' : sunset > .35 ? '温柔晨昏' : '白日漫游' };
}
export function chooseEvent(type, isNight, lastId, rng) {
  const pool = isNight ? ['fireflies', 'breeze', 'gathering'] : ['breeze', 'butterflies', 'apple', 'sprouts', 'birds', 'gathering'];
  if (type === 'rain') pool.splice(0, pool.length, 'rainDance', 'sprouts', 'breeze');
  if (type === 'snow') pool.splice(0, pool.length, 'snowfall', 'breeze', 'gathering');
  const choices = pool.filter(x => x !== lastId); return choices[Math.floor(rng() * choices.length)];
}
export function eventDelay(rng) { return Math.round(35000 + rng() * 40000); }
export const STORAGE_KEY = 'little-bloom.ecosystem.v2';
const TRAVEL_DEFAULTS = { name: '小海獭', clovers: 12, snacks: 3, charms: 1, postcards: [], souvenirs: [], trips: 0, awayUntil: 0, destination: '', startedAt: 0 };
export function restore(storage, now) {
  let saved; try { saved = JSON.parse(storage.getItem(STORAGE_KEY)); } catch { /* Private/file browser contexts may block storage. */ }
  const valid = saved && saved.version === 2 && typeof saved === 'object';
  const today = dateKey(now), same = valid && saved.day === today;
  const history = same && Array.isArray(saved.history) ? saved.history.filter(e => e && EVENTS[e.id] && Number.isFinite(e.at) && dateKey(new Date(e.at)) === today).slice(0, 24) : [];
  const rawTravel = valid && saved.travel && typeof saved.travel === 'object' ? saved.travel : {};
  const travel = { ...TRAVEL_DEFAULTS, ...rawTravel, clovers: Math.max(0, Math.min(999, Math.trunc(Number(rawTravel.clovers ?? TRAVEL_DEFAULTS.clovers)))), snacks: Math.max(0, Math.min(20, Math.trunc(Number(rawTravel.snacks ?? TRAVEL_DEFAULTS.snacks)))), charms: Math.max(0, Math.min(9, Math.trunc(Number(rawTravel.charms ?? TRAVEL_DEFAULTS.charms)))), postcards: Array.isArray(rawTravel.postcards) ? rawTravel.postcards.slice(0, 30) : [], souvenirs: Array.isArray(rawTravel.souvenirs) ? rawTravel.souvenirs.slice(0, 30) : [], trips: Math.max(0, Math.trunc(Number(rawTravel.trips) || 0)), awayUntil: Math.max(0, Number(rawTravel.awayUntil) || 0), startedAt: Math.max(0, Number(rawTravel.startedAt) || 0) };
  for(const k of ['clovers','snacks','charms'])if(!Number.isFinite(travel[k]))travel[k]=TRAVEL_DEFAULTS[k];
  travel.postcards=travel.postcards.filter(c=>c&&typeof c.place==='string'&&typeof c.text==='string'&&Number.isFinite(c.at));
  return { version: 2, farm:restoreFarm(valid?saved.farm:null,now.getTime()), construction:restoreConstruction(valid?saved.construction:null), day: today, growth: valid ? Math.max(0, Math.min(12, Math.trunc(Number(saved.growth) || 0))) : 0, visits: valid ? Math.max(1, Math.min(10000, Math.trunc(Number(saved.visits) || 1))) + (same ? 0 : 1) : 1, history, lastId: history[0]?.id || '', counter: same && Number.isSafeInteger(saved.counter) && saved.counter >= 0 ? saved.counter : 0, nextAt: same && Number.isFinite(saved.nextAt) && saved.nextAt > now.getTime() && saved.nextAt <= now.getTime() + 75000 ? saved.nextAt : now.getTime() + 18000, travel };
}
export function persist(storage, state) { try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; } }

// Split offline growth at actual daily weather boundaries, not at render frames.
export function weatherSegments(from,to){
  const result=[];let cursor=from;
  while(cursor<to){const date=new Date(cursor),day=makeDay(date),midnight=new Date(date);midnight.setHours(24,0,0,0);let end=Math.min(to,midnight.getTime());
    for(const slot of day.slots){const at=new Date(date);at.setHours(0,slot.minute,0,0);if(at.getTime()>cursor)end=Math.min(end,at.getTime());}
    result.push({seconds:(end-cursor)/1000,rain:weatherAt(day,date).type==='rain'});cursor=end;
  }return result;
}
