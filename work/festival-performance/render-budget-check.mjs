import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRenderBudget} from '../festival-planet/render-budget.js';
const dir=path.dirname(fileURLToPath(import.meta.url)),checks=[];
const check=(name,passed,details={})=>checks.push({name,passed:!!passed,...details});
function feed(budget,ms,duration){const changes=[];for(let t=ms;t<=duration+.001;t+=ms){const ratio=budget.sample(ms);if(ratio!==null)changes.push({atMs:Math.round(t),ratio});}return changes;}
let budget=createRenderBudget();
const stable=feed(budget,1000/60,30000);check('Stable 60 Hz keeps the original resolution',stable.length===0&&budget.getState().pixelRatio===1.5);
budget=createRenderBudget();const spike=[...feed(budget,50,500),...feed(budget,1000/60,9000)];check('A brief 500 ms frame spike cannot downgrade the scene',spike.length===0&&budget.getState().pixelRatio===1.5,{changes:spike});
budget=createRenderBudget();const slow=feed(budget,33,40000);check('Sustained slow frames gradually reduce resolution without crossing the minimum',slow.length>0&&slow[0].atMs>=2500&&slow.every((v,i)=>v.ratio>=.8&&v.ratio<=1.5&&(!i||v.atMs-slow[i-1].atMs>=5000))&&budget.getState().pixelRatio===.8,{changes:slow});
const beforeRecovery=budget.getState().pixelRatio,early=feed(budget,1000/60,12000);check('Recovery waits through short bursts of fast frames',early.length===0&&budget.getState().pixelRatio===beforeRecovery,{changes:early});
const recovery=feed(budget,1000/60,115000);check('Sustained fast frames recover in bounded steps and stop at the original maximum',recovery.length>0&&recovery.every((v,i)=>v.ratio<=1.5&&(!i||v.atMs-recovery[i-1].atMs>=8000))&&budget.getState().pixelRatio===1.5,{changes:recovery});
budget=createRenderBudget();feed(budget,33,1500);const snapshot=JSON.stringify(budget.getState());const ignored=[0,1,3.99,251,1000,60000,Infinity,-Infinity].map(ms=>budget.sample(ms));check('Background gaps and impossible short intervals do not alter the budget',ignored.every(v=>v===null)&&JSON.stringify(budget.getState())===snapshot);
const reset=budget.reset(1.35),afterReset=feed(budget,1000/60,15000);check('Reset applies the new viewport maximum and clears pressure history',reset===1.35&&afterReset.length===0&&budget.getState().pixelRatio===1.35&&budget.getState().maxPixelRatio===1.35);
budget=createRenderBudget();feed(budget,33,1600);feed(budget,19.5,1500);const interrupted=feed(budget,33,1300);check('Neutral frame windows interrupt the sustained slow threshold',interrupted.length===0,{changes:interrupted});
const report={checkedAt:new Date().toISOString(),passed:checks.every(c=>c.passed),method:'Deterministic direct samples of the production adaptive resolution controller; these are threshold tests, not GPU benchmarks.',checks};await fs.writeFile(path.join(dir,'render-budget-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
