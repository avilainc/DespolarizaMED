const sharp=require('sharp');const fs=require('fs');
const names=process.argv.slice(3);const out=process.argv[2];
(async()=>{const W=560;const bufs=[];let y=0;const comps=[];
for(let i=0;i<names.length;i++){const b=await sharp('public/simulados/unesp22/'+names[i]+'.png').resize({width:W-10}).png().toBuffer();const m=await sharp(b).metadata();comps.push({b,i,h:m.height});}
// two columns
const colH=[0,0];const placed=[];
for(const c of comps){const col=colH[0]<=colH[1]?0:1;placed.push({input:c.b,left:col*W,top:colH[col]});colH[col]+=c.h+10;}
const H=Math.max(...colH);
await sharp({create:{width:W*2,height:H,channels:3,background:'#ffffff'}}).composite(placed).png().toFile(out);
console.log(names.map((n,i)=>n+':'+(placed[i].left?'R':'L')+placed[i].top).join(' '));})();
