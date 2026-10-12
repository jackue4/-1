const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const workspace=path.resolve(__dirname,'../..'),out=path.join(__dirname,'raw');fs.mkdirSync(out,{recursive:true});
const files=new Map([['/capture.js',[path.join(__dirname,'capture.js'),'text/javascript; charset=utf-8']],['/shots.json',[path.join(__dirname,'shots.json'),'application/json']],['/capture-report.json',[path.join(out,'capture-report.json'),'application/json']]]);
http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(req.method==='POST'&&/^\/save\/(?:\d{2}\.webm|preview-\d{2}\.png|capture-report\.json)$/.test(pathname)){
  let length=0;const chunks=[];req.on('data',chunk=>{length+=chunk.length;if(length>160*1024*1024){req.destroy();return;}chunks.push(chunk);});
  req.on('end',()=>{fs.writeFileSync(path.join(out,path.basename(pathname)),Buffer.concat(chunks));res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify({saved:path.basename(pathname),bytes:length}));});return;
 }
 if(pathname==='/studio'){
  const html=fs.readFileSync(path.join(workspace,'outputs/sakura-season.html'),'utf8').replaceAll('antialias:!0,alpha:!0,powerPreference:','antialias:!0,alpha:!0,preserveDrawingBuffer:!0,powerPreference:').replace('</body>','<script type="module" src="/capture.js"></script></body>');
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}).end(html);return;
 }
 const file=files.get(pathname);if(!file){res.writeHead(404).end();return;}
 fs.readFile(file[0],(error,data)=>{if(error){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':file[1],'Cache-Control':'no-store'}).end(data);});
}).listen(4182,'127.0.0.1',()=>console.log('Extended promo studio: http://127.0.0.1:4182/studio'));
