const fs=require('fs');const raw=fs.readFileSync('outputs/little-bloom.html','utf8'),h=raw.replace(/\\u([a-fA-F0-9]{4})/g,(_,n)=>String.fromCharCode(parseInt(n,16)));
for(const t of ['id="farm-panel"','id="farm-save"','风车未完工','Farm crop leaves'])if(!h.includes(t))throw Error('Missing '+t);
if(h.includes('/*__SCRIPT__*/')||h.includes('/*__STYLE__*/'))throw Error('Unbundled placeholder');
console.log('Final artifact readback passed: garden UI, save feedback, workshop recipes and instanced crops are bundled.');
