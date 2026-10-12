const W=1080,H=1920,canvas=document.createElement('canvas');canvas.id='film';canvas.width=W;canvas.height=H;document.body.append(canvas);
const ctx=canvas.getContext('2d',{alpha:false});let shot,index;
const clamp=n=>Math.max(0,Math.min(1,n));
function text(value,x,y,size,color,weight=400,font='"Microsoft YaHei"'){ctx.font=`${weight} ${size}px ${font},sans-serif`;ctx.fillStyle=color;ctx.fillText(value,x,y);}
function draw(i){
 const rig=window.captureRig,n=rig.env.night,dusk=rig.env.dusk;
 const colors=n>.8?['#102745','#416e88']:dusk>.6?['#8e81a3','#ffe4c1']:shot.world==='festival'?['#e6ecdb','#b8dad5']:['#e1efde','#aed7d9'];
 const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,colors[0]);bg.addColorStop(1,colors[1]);ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 const sky=document.querySelector('.storybook-sky');if(sky?.width)ctx.drawImage(sky,0,0,W,H);
 ctx.drawImage(rig.renderer.domElement,0,0,W,H);
 const ink=n>.5||dusk>.6?'#fff4de':'#345c59',muted=n>.5||dusk>.6?'#d9e6e4':'#64817a';
 const top=ctx.createLinearGradient(0,0,0,410);top.addColorStop(0,n>.5?'#081b3033':'#f1f5ea55');top.addColorStop(1,'#f1f5ea00');ctx.fillStyle=top;ctx.fillRect(0,0,W,410);
 ctx.textAlign='left';text('L I T T L E   B L O O M',72,112,25,ink,500);text(shot.world==='festival'?'01 / 星愿游乐园':'02 / 沙海拾光',72,165,25,muted);
 ctx.fillStyle=ink;ctx.globalAlpha=.5;ctx.fillRect(73,196,43,2);ctx.globalAlpha=1;
 if(shot.headline){const ending=index===13;fontHeadline(shot.headline[0],72,ending?285:302,ending?58:66,ink,ending?'Georgia':'"Microsoft YaHei"');fontHeadline(shot.headline[1],72,ending?353:389,ending?38:57,ink);}
 const shade=ctx.createLinearGradient(0,1290,0,1810);shade.addColorStop(0,'#14383e00');shade.addColorStop(.6,'#14383e65');shade.addColorStop(1,'#102d3994');ctx.fillStyle=shade;ctx.fillRect(0,1290,W,630);
 ctx.textAlign='center';text(shot.label,520,1495,40,'#fff6e4',500);text(shot.sub,520,1570,27,'#e8eddf');
 ctx.fillStyle='#ffffff66';ctx.fillRect(446,1630,148,1);text('可交互 3D 场景 · 实际画面',520,1690,20,'#e4ebe0');
 ctx.textAlign='right';text(String(index+1).padStart(2,'0')+' / 14',996,112,21,muted);ctx.textAlign='left';
}
function fontHeadline(value,x,y,size,color,font='"Microsoft YaHei"'){text(value,x,y,size,color,400,font);}
window.film={
 configure(value,number){shot=value;index=number;window.captureRig.configure(shot);},
 frame(i){const state=window.captureRig.step(i);draw(i);return{image:canvas.toDataURL('image/jpeg',.98).split(',')[1],state};},
 preview(i=0){const state=window.captureRig.step(i);draw(i);return{image:canvas.toDataURL('image/png').split(',')[1],state};}
};
