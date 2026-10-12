const fs=require('fs');const raw=fs.readFileSync('outputs/little-bloom.html','utf8'),h=raw.replace(/\\u([a-fA-F0-9]{4})/g,(_,n)=>String.fromCharCode(parseInt(n,16)));
for(const s of ['id="animal-view"','focusedAnimal','plush-fur-v1','柯基','building supplies','little-bloom.ecosystem.v2'])if(!h.includes(s))throw Error('Missing '+s);
console.log('Cozy yard artifact readback passed: animal tour, plush material, corgi, solid navigation and persistent save key.');
