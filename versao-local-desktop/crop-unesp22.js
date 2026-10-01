const sharp=require('sharp');
const S='C:/Users/Paulo/AppData/Local/Temp/claude/D--Users-Paulo-Desktop-Claude-Code/4e8469bc-f671-4dbc-8f13-7f33a42b20ba/scratchpad/u22/';
const spec=require('./crop-unesp22.json');
(async()=>{for(const [name,dir,page,x0,y0,x1,y1] of spec){
 const f=1.26;const src=S+dir+'/page'+page+'.png';
 const left=Math.round(x0*f),top=Math.round(y0*f),width=Math.round((x1-x0)*f),height=Math.round((y1-y0)*f);
 await sharp(src).extract({left,top,width,height}).toFile('public/simulados/unesp22/'+name+'.png');console.log('ok',name);}})();
