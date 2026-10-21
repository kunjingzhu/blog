// favicon 候选方案生成器 —— 品牌风：渐变/圆角/平滑描边（SDF 抗锯齿），告别死黑底
// 输出 D:\study\blog\favicon_candidates\：A|B|C|D 各自 .png(16/32/48/256) + .ico + sheet_preview.png
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ---------- PNG / ICO ----------
const crcTable = (() => { const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t; })();
function crc32(b){ let c=0xFFFFFFFF; for(let i=0;i<b.length;i++) c=crcTable[(c^b[i])&0xFF]^(c>>>8); return (c^0xFFFFFFFF)>>>0; }
function chunk(type,data){ const l=Buffer.alloc(4); l.writeUInt32BE(data.length,0); const t=Buffer.from(type,'ascii');
  const c=Buffer.alloc(4); c.writeUInt32BE(crc32(Buffer.concat([t,data])),0); return Buffer.concat([l,t,data,c]); }
function encodePng(w,h,rgba){ const sig=Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr=Buffer.alloc(13); ihdr.writeUInt32BE(w,0); ihdr.writeUInt32BE(h,4); ihdr[8]=8; ihdr[9]=6;
  const stride=1+w*4, raw=Buffer.alloc(h*stride);
  for(let y=0;y<h;y++){ raw[y*stride]=0; rgba.copy(raw,y*stride+1,y*w*4,(y+1)*w*4); }
  return Buffer.concat([sig,chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]); }
function encodeIco(parts){ const head=Buffer.alloc(6); head.writeUInt16LE(1,2); head.writeUInt16LE(parts.length,4);
  const dir=Buffer.alloc(16*parts.length); let off=6+16*parts.length;
  parts.forEach((e,i)=>{ const o=i*16; dir[o]=e.size>=256?0:e.size; dir[o+1]=e.size>=256?0:e.size;
    dir.writeUInt16LE(1,o+2); dir.writeUInt16LE(32,o+4); dir.writeUInt32LE(e.png.length,o+8); dir.writeUInt32LE(off,o+12); off+=e.png.length; });
  return Buffer.concat([head,dir,...parts.map(e=>e.png)]); }

// ---------- SDF ----------
function sdBox(px,py,bx,by,r){ const qx=Math.abs(px)-bx+r, qy=Math.abs(py)-by+r;
  return Math.min(Math.max(qx,qy),0)+Math.hypot(Math.max(qx,0),Math.max(qy,0))-r; }
function sdSeg(px,py,ax,ay,bx2,by2){ const pax=px-ax, pay=py-ay, bax=bx2-ax, bay=by2-ay;
  const dd=bax*bax+bay*bay; const t=dd>0?Math.max(0,Math.min(1,(pax*bax+pay*bay)/dd)):0;
  return Math.hypot(pax-bax*t, pay-bay*t); }
function polyD(pts,w){ let m=Infinity; for(let i=0;i<pts.length-1;i++)
  m=Math.min(m, sdSeg(0,0,pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1]) ); // placeholder not used
  return m; }
function segDist(px,py,a,b,w){ return sdSeg(px,py,a[0],a[1],b[0],b[1])-w; }
function polyDist(px,py,pts,w){ let m=Infinity;
  for(let i=0;i<pts.length-1;i++) m=Math.min(m, sdSeg(px,py,pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1]));
  return m-w; }
function clamp(v,lo,hi){ return v<lo?lo:(v>hi?hi:v); }
const lerp=(a,b,t)=>a+(b-a)*t;
function mix(c0,c1,t){ return [0,1,2].map(i=>Math.round(lerp(c0[i],c1[i],t))); }

// ---------- 设计 ----------
const WHITE=[255,255,255];
function chevR(cx,cy,s,dy){ return [[cx-s,cy-0.78*s+dy],[cx+0.55*s,cy+dy],[cx-s,cy+0.78*s+dy]]; }
function chevL(cx,cy,s,dy){ return [[cx+s,cy-0.78*s+dy],[cx-0.55*s,cy+dy],[cx+s,cy+0.78*s+dy]]; }

const designs=[
 { key:'A', name:'蓝青渐变·终端>_（琥珀光标）',
   bg:{type:'grad',p0:[0,-0.5],p1:[0,0.5],c0:[37,99,235],c1:[14,165,233]},
   glyph:[
     {type:'poly',pts:chevR(-0.11,-0.03,0.13,0),w:0.055,color:WHITE},
     {type:'poly',pts:[[-0.21,0.27],[0.01,0.27]],w:0.05,color:WHITE},
     {type:'box',cx:0.17,cy:0.27,hx:0.055,hy:0.08,color:[251,191,36]},
   ]},
 { key:'B', name:'落日橙红·代码</>',
   bg:{type:'grad',p0:[-0.5,-0.5],p1:[0.5,0.5],c0:[249,115,22],c1:[239,68,68]},
   glyph:[
     {type:'poly',pts:chevL(-0.20,-0.02,0.10,0),w:0.048,color:WHITE},
     {type:'poly',pts:[[-0.04,0.13],[0.04,-0.17]],w:0.048,color:WHITE},
     {type:'poly',pts:chevR(0.20,-0.02,0.10,0),w:0.048,color:WHITE},
   ]},
 { key:'C', name:'云雾白底·绿色>_（浅色模式最跳）',
   bg:{type:'solid',c:[246,249,252]},
   border:{color:[176,190,208]},
   glyph:[
     {type:'poly',pts:chevR(-0.11,-0.03,0.13,0),w:0.055,color:[16,163,74]},
     {type:'poly',pts:[[-0.21,0.27],[0.01,0.27]],w:0.05,color:[16,163,74]},
     {type:'box',cx:0.17,cy:0.27,hx:0.055,hy:0.08,color:[245,158,11]},
   ]},
 { key:'D', name:'翡翠渐变·大光标>▮',
   bg:{type:'grad',p0:[-0.5,-0.5],p1:[0.5,0.5],c0:[4,120,87],c1:[52,211,153]},
   glyph:[
     {type:'poly',pts:chevR(-0.13,0.0,0.15,0),w:0.065,color:WHITE},
     {type:'box',cx:0.16,cy:0.02,hx:0.06,hy:0.115,color:[253,224,71]},
   ]},
];
const RADIUS=0.12;

// ---------- 渲染（每像素 SDF 覆盖率 + alpha over 合成）----------
function render(design,size){
  const buf=Buffer.alloc(size*size*4);
  const px1=1/size;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const ux=(x+0.5)*px1-0.5, uy=(y+0.5)*px1-0.5;
    let col=[0,0,0], acc=0; // over-composite
    function blend(c,al){ if(al<=0)return; const na=al+acc*(1-al);
      for(let i=0;i<3;i++) col[i]=lerp(col[i],c[i],al/na);
      acc=na; }
    // 背景圆角方块
    const dBg=sdBox(ux,uy,0.5,0.5,RADIUS);
    const aBg=clamp(0.5-dBg/px1,0,1);
    let cBg;
    if(design.bg.type==='grad'){
      const dx=design.bg.p1[0]-design.bg.p0[0], dy=design.bg.p1[1]-design.bg.p0[1];
      const t=clamp(((ux-design.bg.p0[0])*dx+(uy-design.bg.p0[1])*dy)/(dx*dx+dy*dy),0,1);
      cBg=mix(design.bg.c0,design.bg.c1,t);
    } else cBg=design.bg.c;
    blend(cBg,aBg);
    // 描边环（白底款）
    if(design.border){
      const ring=Math.abs(sdBox(ux,uy,0.5-px1*0.75,0.5-px1*0.75,RADIUS))-px1*0.75;
      blend(design.border.color, clamp(0.5-ring/px1,0,1)*aBg);
    }
    // 图形
    for(const g of design.glyph){
      let gd;
      if(g.type==='poly') gd=polyDist(ux,uy,g.pts,g.w);
      else gd=sdBox(ux-g.cx,uy-g.cy,g.hx,g.hy,0.025);
      blend(g.color, clamp(0.5-gd/px1,0,1));
    }
    const o=(y*size+x)*4;
    buf[o]=clamp(Math.round(col[0]),0,255); buf[o+1]=clamp(Math.round(col[1]),0,255);
    buf[o+2]=clamp(Math.round(col[2]),0,255); buf[o+3]=clamp(Math.round(acc*255),0,255);
  }
  return buf;
}

// ---------- 5x7 像素字体（sheet 标签用）----------
const FONT={
  A:["01110","10001","10001","11111","10001","10001","10001"],
  B:["11110","10001","10001","11110","10001","10001","11110"],
  C:["01111","10000","10000","10000","10000","10000","01111"],
  D:["11110","10001","10001","10001","10001","10001","11110"],
};

// ---------- 输出 ----------
const outDir='D:\\study\\blog\\favicon_candidates';
fs.mkdirSync(outDir,{recursive:true});
const cache={};
for(const d of designs){
  cache[d.key]={};
  for(const s of [16,32,48,180,256]) cache[d.key][s]=render(d,s);
  fs.writeFileSync(path.join(outDir,d.key+'.ico'),
    encodeIco([16,32,48,256].map(s=>({size:s,png:encodePng(s,s,cache[d.key][s])}))));
  for(const s of [16,32,48,180,256]) fs.writeFileSync(path.join(outDir,`${d.key}_${s}.png`),encodePng(s,s,cache[d.key][s]));
  console.log(d.key,d.name);
}

// sheet：256 一排 + 标签 A-D + 浅色/深色标签栏模拟
const COLW=270, W=COLW*4, H=600;
const sheet=Buffer.alloc(W*H*4);
function setPx(x,y,c,a){ if(x<0||y<0||x>=W||y>=H)return; const o=(y*W+x)*4;
  if(a===undefined){ sheet[o]=c[0];sheet[o+1]=c[1];sheet[o+2]=c[2];sheet[o+3]=255; return; }
  const na=a+ (sheet[o+3]/255)*(1-a); if(na<=0)return;
  for(let i=0;i<3;i++) sheet[o+i]=Math.round((c[i]*a + sheet[o+i]*(sheet[o+3]/255)*(1-a))/na);
  sheet[o+3]=Math.round(na*255); }
function fillRect(x0,y0,w,h,c){ for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++)setPx(x,y,c); }
function blit(buf,size,x0,y0){ for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const o=(y*size+x)*4, a=buf[o+3]/255; if(a<=0)continue;
  setPx(x0+x,y0+y,[buf[o],buf[o+1],buf[o+2]],a); } }
function drawText(str,x0,y0,scale,color){ for(const ch of str){ const g=FONT[ch]; if(!g)continue;
  for(let r=0;r<7;r++)for(let c=0;c<5;c++) if(g[r][c]==='1') fillRect(x0+c*scale,y0+r*scale,scale,scale,color);
  x0+=6*scale; } return x0; }
fillRect(0,0,W,H,[238,241,245]);
designs.forEach((d,i)=>{ const x=6+i*COLW;
  blit(cache[d.key][256],256,x+7,14);
  const tx=x+7+256/2-((5*6+1)*5)/2; drawText(d.key,tx,282,5,[51,65,85]);
});
// 浅色标签栏模拟
fillRect(0,320,W,110,[222,225,230]);
designs.forEach((d,i)=>{ const x=6+i*COLW;
  fillRect(x+7,330,256,90,[248,250,252]);
  blit(cache[d.key][32],32,x+22,359);
  blit(cache[d.key][16],16,x+66,367); });
// 深色标签栏模拟
fillRect(0,444,W,110,[32,33,36]);
designs.forEach((d,i)=>{ const x=6+i*COLW;
  fillRect(x+7,454,256,90,[66,69,73]);
  blit(cache[d.key][32],32,x+22,483);
  blit(cache[d.key][16],16,x+66,491); });
fs.writeFileSync(path.join(outDir,'sheet_preview.png'),encodePng(W,H,sheet));
console.log('sheet_preview.png written');

// ---------- D 方案部署到 static/（含矢量 SVG）----------
const U2S=v=>Math.round(v*256*100)/100; // unit[-0.5,.5] -> 256画布坐标(含+0.5平移)
function svgFor(d){
  const parts=[];
  for(const g of d.glyph){
    if(g.type==='poly'){
      const pts=g.pts.map(p=>`${U2S(p[0]+0.5)},${U2S(p[1]+0.5)}`).join(' L');
      parts.push(`<path d="M${pts}" stroke="rgb(${g.color.join(',')})" stroke-width="${U2S(g.w*2)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`);
    } else {
      parts.push(`<rect x="${U2S(g.cx-g.hx+0.5)}" y="${U2S(g.cy-g.hy+0.5)}" width="${U2S(g.hx*2)}" height="${U2S(g.hy*2)}" rx="${U2S(Math.min(g.hx,g.hy)*0.5)}" fill="rgb(${g.color.join(',')})"/>`);
    }
  }
  let bg,defs='';
  if(d.bg.type==='grad'){
    defs=`<defs><linearGradient id="g" x1="${d.bg.p0[0]+0.5}" y1="${d.bg.p0[1]+0.5}" x2="${d.bg.p1[0]+0.5}" y2="${d.bg.p1[1]+0.5}"><stop offset="0" stop-color="rgb(${d.bg.c0.join(',')})"/><stop offset="1" stop-color="rgb(${d.bg.c1.join(',')})"/></linearGradient></defs>`;
    bg='fill="url(#g)"';
  } else bg=`fill="rgb(${d.bg.c.join(',')})"`;
  let border='';
  if(d.border) border=`<rect x="2" y="2" width="252" height="252" rx="${U2S((RADIUS+0.5)*256-2)}" fill="none" stroke="rgb(${d.border.color.join(',')})" stroke-width="4"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">${defs}<rect width="256" height="256" rx="${U2S(RADIUS*256)}" ${bg}/>${border}${parts.join('')}</svg>\n`;
}
const D=cache['D'];
const staticDir='D:\\study\\blog\\static';
const icoPng=s=>encodePng(s,s,D[s]);
fs.writeFileSync(path.join(staticDir,'favicon.ico'),encodeIco([16,32,48,256].map(s=>({size:s,png:icoPng(s)}))));
fs.writeFileSync(path.join(staticDir,'favicon-16x16.png'),icoPng(16));
fs.writeFileSync(path.join(staticDir,'favicon-32x32.png'),icoPng(32));
fs.writeFileSync(path.join(staticDir,'favicon-48x48.png'),icoPng(48));
fs.writeFileSync(path.join(staticDir,'apple-touch-icon.png'),icoPng(180));
fs.writeFileSync(path.join(staticDir,'favicon.png'),icoPng(256));
fs.writeFileSync(path.join(staticDir,'favicon.svg'),svgFor(designs.find(x=>x.key==='D')));
fs.writeFileSync(path.join(staticDir,'safari-pinned-tab.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path d="M${svgFor(designs.find(x=>x.key==='D')).match(/<path d="M([^"]+)"/)[1]}" stroke="#000" stroke-width="33" stroke-linecap="round" stroke-linejoin="round" fill="none"/><rect x="${U2S(0.16-0.06+0.5)}" y="${U2S(0.02-0.115+0.5)}" width="${U2S(0.12)}" height="${U2S(0.23)}" fill="#000"/></svg>\n`);
console.log('deployed to static/');
