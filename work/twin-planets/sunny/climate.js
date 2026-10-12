// A visual journey clock. This module never reads or writes the farm clock,
// localStorage, Date.now(), or the browser's animation clock.
export const SEASONS = Object.freeze({
  spring: Object.freeze({ label: '春日花信', icon: '✿', note: '嫩叶醒来，花瓣把风染成粉色。' }),
  summer: Object.freeze({ label: '盛夏海风', icon: '☀', note: '树荫变深，海湾收藏着长长的晴天。' }),
  autumn: Object.freeze({ label: '秋日来信', icon: '❧', note: '金叶沿小路打着旋，屋檐下亮起暖光。' }),
  winter: Object.freeze({ label: '冬日绒雪', icon: '❄', note: '白雪轻轻盖住树梢，小岛慢慢安静下来。' }),
});

export const CLIMATE_WEATHER = Object.freeze({
  clear: Object.freeze({ label: '晴日', icon: '☀', note: '阳光把海面晒成透亮的蓝。' }),
  cloudy: Object.freeze({ label: '流云', icon: '☁', note: '云影慢慢越过山坡与小屋。' }),
  rain: Object.freeze({ label: '细雨', icon: '☂', note: '听雨落进海湾，等一场雨后的彩虹。' }),
  mist: Object.freeze({ label: '海雾', icon: '≋', note: '海面披上薄纱，灯塔在雾里守候。' }),
  snow: Object.freeze({ label: '落雪', icon: '❄', note: '雪花在风里漫游，树梢穿上绒白新衣。' }),
  storm: Object.freeze({ label: '暴雨', icon: 'ϟ', note: '乌云与阵雨经过海岛，雨后会有好消息。' }),
  tornado: Object.freeze({ label: '龙卷风', icon: '〰', note: '风在小岛边缘打了一个旋，树叶跟着轻轻起舞。' }),
  rainbow: Object.freeze({ label: '雨后彩虹', icon: '🌈', note: '雨停以后，一道七彩的桥落在海湾上。' }),
  meteor: Object.freeze({ label: '流星雨', icon: '✧', note: '星光划过小岛，把心愿交给夜空。' }),
});

const ORDER = Object.keys(SEASONS);
const BASE_ENV = Object.freeze({ rain: 0, snow: 0, cloud: .2, wind: .25, mist: 0, light: 1, storm: 0, tornado: 0, rainbow: 0, meteorShower: 0, wetness: 0 });
const WEATHER_ENV = {
  clear: {},
  cloudy: { cloud: .82, wind: .42, light: .8 },
  rain: { rain: .78, cloud: .94, wind: .55, light: .7, wetness: 1 },
  mist: { mist: .9, cloud: .48, wind: .12, light: .78, wetness: .25 },
  snow: { snow: 1, cloud: .74, wind: .28, light: .87 },
  storm: { rain: 1, cloud: 1, wind: 1, light: .43, storm: 1, wetness: 1 },
  tornado: { cloud: .9, wind: 1, light: .57, tornado: 1, mist: .14 },
  rainbow: { cloud: .24, wind: .2, light: 1, rainbow: 1, wetness: .65 },
  meteor: { cloud: .08, wind: .17, light: 1, meteorShower: 1 },
};
const POOLS = {
  spring: { clear: 4, cloudy: 2, rain: 3, mist: 2, storm: .8, tornado: .5, rainbow: .6, meteor: .8 },
  summer: { clear: 4, cloudy: 2, rain: 1.6, mist: .6, storm: 2.2, tornado: .65, rainbow: .8, meteor: 1.5 },
  autumn: { clear: 4, cloudy: 2, rain: 2, mist: 2, storm: 1, tornado: .7, rainbow: .6, meteor: 1.25 },
  winter: { clear: 3, cloudy: 2, rain: .6, mist: 1.2, snow: 5, storm: .5, tornado: .25, rainbow: .4, meteor: 1 },
};
const FORCED_HOURS = { meteor: 22, rainbow: 12.5, tornado: 16 };
const mod = (value, span) => ((value % span) + span) % span;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const validDate = date => date instanceof Date && Number.isFinite(date.getTime());
function hash(value) { let n = 2166136261; for (const c of String(value)) n = Math.imul(n ^ c.charCodeAt(0), 16777619); return n >>> 0; }
function dateSeason(date) { return Math.floor(mod(date.getMonth() - 2, 12) / 3); }
function weightsAt(position) {
  const index = Math.floor(position), fraction = mod(position, 1);
  const x = clamp((fraction - .8) / .2, 0, 1), blend = x * x * (3 - 2 * x);
  const weights = { spring: 0, summer: 0, autumn: 0, winter: 0 };
  weights[ORDER[mod(index, 4)]] = 1 - blend;
  weights[ORDER[mod(index + 1, 4)]] += blend;
  return weights;
}
function dominant(weights) { return ORDER.reduce((a, b) => weights[b] > weights[a] ? b : a, ORDER[0]); }

/**
 * All time is supplied by the caller. dt is active simulation seconds; dt=0
 * freezes the journey and random sequence. Date is still observable in today
 * mode. A single update accepts at most one active hour to bound catch-up work.
 */
export function createSunnyClimate({ date = new Date(2000, 2, 1, 8, 30), seed, seasonDuration = 75, dayDuration = 180 } = {}) {
  let observedDate = validDate(date) ? new Date(date.getTime()) : new Date(2000, 2, 1, 8, 30);
  const initialSeason = dateSeason(observedDate);
  const seasonSeconds = clamp(finite(seasonDuration, 75), 10, 86400);
  const daySeconds = clamp(finite(dayDuration, 180), 30, 86400);
  const dateSeed = `${observedDate.getFullYear()}-${observedDate.getMonth() + 1}-${observedDate.getDate()}/bloom-climate-v1`;
  let randomState = typeof seed === 'number' && Number.isFinite(seed) ? seed >>> 0 : hash(seed ?? dateSeed);
  let mode = 'journey', seasonMode = 'auto', weatherMode = 'auto', hourOverride = null;
  let journeyTime = 0, automaticWeather = 'clear', naturalWeather = 'clear';
  let naturalHour = observedDate.getHours() + observedDate.getMinutes() / 60;
  function random() {
    randomState = (randomState + 0x6D2B79F5) >>> 0;
    let t = randomState;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  let weatherDuration = 30 + random() * 18, weatherRemaining = weatherDuration;

  function seasonWeights() {
    if (seasonMode !== 'auto') return Object.fromEntries(ORDER.map(id => [id, Number(id === seasonMode)]));
    if (mode === 'today') return weightsAt(dateSeason(observedDate));
    return weightsAt(initialSeason + journeyTime / seasonSeconds);
  }
  function nextWeather() {
    const previous = automaticWeather;
    if (previous === 'rain' || previous === 'storm') automaticWeather = 'rainbow';
    else {
      const pool = Object.entries(POOLS[dominant(seasonWeights())]).filter(([id]) => id !== previous);
      let choice = random() * pool.reduce((sum, [, weight]) => sum + weight, 0);
      automaticWeather = pool[pool.length - 1][0];
      for (const [id, weight] of pool) { choice -= weight; if (choice <= 0) { automaticWeather = id; break; } }
    }
    weatherDuration = 30 + random() * 18;
    weatherRemaining = weatherDuration;
  }
  function getState() {
    const weights = seasonWeights(), season = dominant(weights);
    let weather = weatherMode !== 'auto' ? weatherMode : mode === 'today' ? naturalWeather : automaticWeather;
    // The pre-existing calendar intentionally includes rare snow all year;
    // this visual director keeps automatic snow in winter, without changing it.
    if (weatherMode === 'auto' && weather === 'snow' && season !== 'winter') weather = 'cloudy';
    const baseHour = hourOverride ?? (mode === 'today' ? naturalHour : mod(8.5 + journeyTime / daySeconds * 24, 24));
    const hour = FORCED_HOURS[weather] ?? baseHour;
    const env = { ...weights, ...BASE_ENV, ...WEATHER_ENV[weather] };
    env.snowCover = clamp(weights.winter * .72 + env.snow * .38, 0, 1);
    return {
      season, seasonLabel: SEASONS[season].label,
      weather, weatherLabel: CLIMATE_WEATHER[weather].label,
      hour, mode, seasonMode, weatherMode, hourMode: hourOverride === null ? 'auto' : 'manual',
      phaseRemaining: mode === 'journey' && weatherMode === 'auto' ? weatherRemaining : 0,
      seasonRemaining: mode === 'journey' && seasonMode === 'auto' ? seasonSeconds - mod(journeyTime, seasonSeconds) : 0,
      journeyTime, env,
    };
  }
  function update(dt, date, natural = {}) {
    if (validDate(date)) observedDate = new Date(date.getTime());
    if (Object.hasOwn(CLIMATE_WEATHER, natural.weatherType)) naturalWeather = natural.weatherType;
    naturalHour = Number.isFinite(natural.hour) ? mod(natural.hour, 24) : observedDate.getHours() + observedDate.getMinutes() / 60;
    let remaining = clamp(finite(dt), 0, 3600);
    if (mode === 'journey') {
      if (weatherMode !== 'auto') journeyTime += remaining;
      else while (remaining > 0) {
        const step = Math.min(remaining, weatherRemaining);
        journeyTime += step;
        weatherRemaining -= step;
        remaining -= step;
        if (weatherRemaining <= 1e-9) nextWeather();
      }
    }
    return getState();
  }
  function selectSeason(id) {
    if (id === 'auto' || Object.hasOwn(SEASONS, id)) seasonMode = id;
    return getState();
  }
  function selectWeather(id) {
    if (id === 'auto' || Object.hasOwn(CLIMATE_WEATHER, id)) weatherMode = id;
    return getState();
  }
  function selectHour(value) {
    if (value === null) hourOverride = null;
    else if (Number.isFinite(value)) hourOverride = mod(value, 24);
    return getState();
  }
  function setMode(value) {
    if (value === 'journey' || value === 'today') mode = value;
    return getState();
  }
  function captureState() {
    return { version: 1, mode, seasonMode, weatherMode, hourOverride, journeyTime, automaticWeather, naturalWeather,
      naturalHour, weatherDuration, weatherRemaining, randomState, observedAt: observedDate.getTime() };
  }
  function restoreState(saved) {
    if (!saved || saved.version !== 1 || !['journey', 'today'].includes(saved.mode) ||
      !(saved.seasonMode === 'auto' || Object.hasOwn(SEASONS, saved.seasonMode)) ||
      !(saved.weatherMode === 'auto' || Object.hasOwn(CLIMATE_WEATHER, saved.weatherMode)) ||
      !(saved.hourOverride === null || Number.isFinite(saved.hourOverride)) ||
      !Object.hasOwn(CLIMATE_WEATHER, saved.automaticWeather) || !Object.hasOwn(CLIMATE_WEATHER, saved.naturalWeather) ||
      !Number.isFinite(saved.journeyTime) || saved.journeyTime < 0 || !Number.isFinite(saved.observedAt) ||
      !Number.isFinite(saved.naturalHour) || !Number.isInteger(saved.randomState) ||
      !Number.isFinite(saved.weatherDuration) || saved.weatherDuration < 30 || saved.weatherDuration > 48 ||
      !Number.isFinite(saved.weatherRemaining) || saved.weatherRemaining <= 0 || saved.weatherRemaining > saved.weatherDuration ||
      !validDate(new Date(saved.observedAt))) return false;
    mode = saved.mode; seasonMode = saved.seasonMode; weatherMode = saved.weatherMode;
    hourOverride = saved.hourOverride === null ? null : mod(saved.hourOverride, 24);
    journeyTime = saved.journeyTime; automaticWeather = saved.automaticWeather; naturalWeather = saved.naturalWeather;
    naturalHour = mod(saved.naturalHour, 24); weatherDuration = saved.weatherDuration;
    weatherRemaining = saved.weatherRemaining; randomState = saved.randomState >>> 0; observedDate = new Date(saved.observedAt);
    return true;
  }
  return { update, getState, selectSeason, selectWeather, selectHour, setMode, captureState, restoreState };
}
