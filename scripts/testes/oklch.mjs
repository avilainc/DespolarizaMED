// Converte as cores medidas do logo para oklch, que é o formato dos tokens.
const cores = {
  "azul do emblema  #4884c0": [0x48,0x84,0xc0],
  "azul-marinho     #184878": [0x18,0x48,0x78],
  "laranja MED      #fc7824": [0xfc,0x78,0x24],
  "teal do fundo    #549c9c": [0x54,0x9c,0x9c],
  "azul-escuro      #182430": [0x18,0x24,0x30],
  "azul claro texto #90c0fc": [0x90,0xc0,0xfc],
};
const srgb = (v) => { v/=255; return v<=0.04045 ? v/12.92 : ((v+0.055)/1.055)**2.4; };
function oklch([R,G,B]) {
  const r=srgb(R), g=srgb(G), b=srgb(B);
  const l=Math.cbrt(0.4122214708*r+0.5363325363*g+0.0514459929*b);
  const m=Math.cbrt(0.2119034982*r+0.6806995451*g+0.1073969566*b);
  const s=Math.cbrt(0.0883024619*r+0.2817188376*g+0.6299787005*b);
  const L=0.2104542553*l+0.7936177850*m-0.0040720468*s;
  const A=1.9779984951*l-2.4285922050*m+0.4505937099*s;
  const Bb=0.0259040371*l+0.7827717662*m-0.8086757660*s;
  const C=Math.hypot(A,Bb);
  let H=Math.atan2(Bb,A)*180/Math.PI; if(H<0) H+=360;
  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`;
}
for (const [nome, rgb] of Object.entries(cores)) console.log(`  ${nome}  ->  ${oklch(rgb)}`);
