const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../outputs');
const allowed=new Set(['sakura-season.html','little-bloom.html']);
http.createServer((req,res)=>{
  let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'sakura-season.html';}catch{res.writeHead(400).end();return;}
  if(name==='favicon.ico'){res.writeHead(204).end();return;}
  if(!allowed.has(name)){res.writeHead(404).end('Not found');return;}
  fs.readFile(path.join(root,name),(err,data)=>{if(err){res.writeHead(404).end('Not built');return;}res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(data);});
}).listen(4178,'127.0.0.1',()=>console.log('Sakura preview http://127.0.0.1:4178/sakura-season.html'));
