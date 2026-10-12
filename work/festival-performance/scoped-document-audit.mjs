import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url)),checks=[];
class Surface extends EventTarget{
 constructor(){super();this.handlers=new Map();this.hidden=false;this.inert=false;this.attributes={};}
 addEventListener(type,fn,options){super.addEventListener(type,fn,options);if(!this.handlers.has(type))this.handlers.set(type,new Set());this.handlers.get(type).add(fn);}
 removeEventListener(type,fn,options){super.removeEventListener(type,fn,options);this.handlers.get(type)?.delete(fn);}
 setAttribute(name,value){this.attributes[name]=value;}
 attachShadow(){this.shadowRoot=new Surface();return this.shadowRoot;}
 createElement(){return new Surface();}createTextNode(){return{};}
 getElementById(){return null;}querySelector(){return null;}querySelectorAll(){return[];}
}
const actual=new Surface();globalThis.document=actual;
const {createWorldDocument}=await import('../twin-planets/scoped-document.js');
const docs=[],hosts=[],calls=[0,0,0,0];
for(let i=0;i<4;i++){const host=new Surface(),doc=createWorldDocument(host,'','');hosts.push(host);docs.push(doc);doc.addEventListener('visibilitychange',()=>calls[i]++);}
let isolation=true;
for(let i=0;i<100;i++){const active=i%4;docs.forEach(d=>d.setActive(false));docs[active].setActive(true);isolation&&=docs.every((d,j)=>d.hidden===(j!==active)&&hosts[j].hidden===(j!==active));}
checks.push({name:'Exactly one scoped world is visible across 100 world switches',passed:isolation});
checks.push({name:'Switching cached worlds does not duplicate document or host listeners',passed:actual.handlers.get('visibilitychange').size===4&&hosts.every(h=>h.handlers.get('worldvisibility').size===1),documentListeners:actual.handlers.get('visibilitychange').size,perHostListeners:hosts.map(h=>h.handlers.get('worldvisibility').size)});
actual.hidden=true;actual.dispatchEvent(new Event('visibilitychange'));checks.push({name:'Native hidden state suppresses every world even if selected',passed:docs.every(d=>d.hidden)});actual.hidden=false;actual.dispatchEvent(new Event('visibilitychange'));checks.push({name:'Native foreground restores only the selected world',passed:docs.filter(d=>!d.hidden).length===1});
docs.forEach(d=>d.dispose());checks.push({name:'Scoped cleanup removes both sides of visibility listeners',passed:actual.handlers.get('visibilitychange').size===0&&hosts.every(h=>h.handlers.get('worldvisibility').size===0)});
const report={checkedAt:new Date().toISOString(),passed:checks.every(c=>c.passed),method:'Real scoped-document.js with EventTarget-backed minimal DOM surfaces; does not test browser WebGL.',checks};await fs.writeFile(path.join(dir,'scoped-document-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
