const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../outputs');
http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 const relative=pathname==='/'?'sakura-season.html':decodeURIComponent(pathname).replace(/^\/+/,''),file=path.resolve(root,relative);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}const type=file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.png')?'image/png':file.endsWith('.webmanifest')?'application/manifest+json':'application/octet-stream';res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'}).end(data);});
}).listen(4187,'127.0.0.1',()=>console.log('Cute park preview :4187'));
