import {createWorld} from './world.js';
const w=createWorld();let navMs=0,navCalls=0;const move=w.navigation.move;w.navigation.move=(...args)=>{const start=performance.now();const result=move(...args);navMs+=performance.now()-start;navCalls++;return result;};
const env={rain:0,snow:0,night:0,wind:.3,mist:0,cloud:.2};const started=performance.now();for(let i=0;i<240;i++)w.update(1/30,i/30,env);console.log(JSON.stringify({updateMsPerFrame:(performance.now()-started)/240,navigationMsPerFrame:navMs/240,navCalls,note:'Node CPU scene update only; excludes rendering'},null,2));w.dispose();
