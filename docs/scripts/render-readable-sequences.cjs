const fs=require('node:fs');const path=require('node:path');
const sharp=require('../../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp');
const shared=require('../../sequence-diagrams/scripts/generate-freelancer-sequences.cjs');
const diagrams=[...shared.diagrams];shared.Diagram.prototype.save=function(){diagrams.push(this);};
for(const f of ['generate-account-sequences','generate-following-notification-role-sequences','generate-review-profile-sequences','generate-revision-cv-sequences'])require(`../../sequence-diagrams/scripts/${f}.cjs`);
const catalog=JSON.parse(fs.readFileSync('outputs/report-completion/catalog.json'));
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const xs=[90,330,590,850,1130,1430,1730,1990],W=2110;
function lines(s,max){
 const words=s.replace(/\n/g,' ').split(/\s+/).flatMap(w=>w.length>max?(w.match(new RegExp(`.{1,${max}}`,'g'))||[]):[w]);
 const out=[];let line='';for(const w of words){if(line&&(line+' '+w).length>max){out.push(line);line=w;}else line+=(line?' ':'')+w;}if(line)out.push(line);return out;
}
function text(x,y,ls,size=24,anchor='middle'){return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}">${ls.map((l,i)=>`<tspan x="${x}" dy="${i?28:0}">${esc(l)}</tspan>`).join('')}</text>`;}
(async()=>{
 const counts={};
 for(const d of diagrams){const c=catalog.find(c=>c.id===d.id);if(!c)continue;
  const messages=d.events.filter(e=>e.type==='msg').sort((a,b)=>a.y-b.y);let shift=0,prev=250;
  const points=messages.map(e=>{
   e.ls=lines(e.label,Math.max(18,Math.floor(Math.abs(xs[e.a]-xs[e.b]||330)/12)));
   let y=300+(e.y-300)*1.5+shift;const min=prev+48+(e.ls.length-1)*28;
   if(y<min){shift+=min-y;y=min;}prev=y;e.py=y;return {old:e.y,new:y};
  });
  const map=y=>{let i=points.findIndex(p=>p.old>=y);if(i<0){const p=points.at(-1);return p.new+(y-p.old)*1.5;}if(!i)return points[0].new+(y-points[0].old)*1.5;const a=points[i-1],b=points[i];return a.new+(y-a.old)*(b.new-a.new)/(b.old-a.old);};
  const H=map(d.y)+70;
  let body='';
  for(let i=0;i<xs.length;i++)body+=`<line x1="${xs[i]}" y1="220" x2="${xs[i]}" y2="${H}" stroke="#777" stroke-dasharray="9 7"/>${i?`<rect x="${xs[i]-5}" y="240" width="10" height="${H-240}" fill="white" stroke="#111"/>`:''}`;
  for(const f of d.events.filter(e=>e.type==='frame')){
   const y=map(f.y),h=map(f.y+f.h)-y;
   body+=`<rect x="25" y="${y}" width="2060" height="${h}" fill="none" stroke="#555"/>${text(70,y+27,[f.kind],22)}${text(120,y+27,lines(f.condition,160),20,'start')}`;
  }
  for(const f of d.events.filter(e=>e.type==='divider'))body+=`<path d="M25 ${map(f.y)}h2060" stroke="#555" stroke-dasharray="8 6"/>${text(120,map(f.y)+28,lines(f.condition,160),20,'start')}`;
  for(const e of messages){const a=xs[e.a],b=xs[e.b],y=e.py;body+=a===b?`<path d="M${a} ${y}h55v28h-55" fill="none" stroke="#111" marker-end="url(#call)"/>`:`<path d="M${a} ${y}H${b}" fill="none" stroke="#111" ${e.ret?'stroke-dasharray="9 7"':''} marker-end="url(#${e.ret?'reply':'call'})"/>`;body+=text(a===b?a+150:(a+b)/2,y-12-(e.ls.length-1)*28,e.ls);}
  const cuts=[220];let start=220;
  for(const e of messages){if(e.py-start>1030){let cut=e.py-40-(e.ls.length-1)*28;
   for(const f of d.events.filter(f=>f.type==='frame'||f.type==='divider')){const top=map(f.y),bottom=top+32+lines(f.condition,160).length*28;if(cut>top-10&&cut<bottom+10)cut=top-20;}
   if(cut>start+350){cuts.push(cut);start=cut;}}}cuts.push(H);
  const names=d.names||[d.write?'Freelancer':'Visitor / Freelancer',`:${d.domain}View`,`:${d.domain}Route`,`:${d.domain}Controller`,`:${d.domain}Service`,`:${d.domain}Repository`,':PrismaService','Database'];
  const base=`docs/Report 4/images/sprint${c.sprint}/nhuy/sequences/${c.id}-${c.slug}`;
  for(let i=0;i<cuts.length-1;i++){
   const height=cuts[i+1]-cuts[i]+185;
   let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}"><defs><marker id="call" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0 0L10 5L0 10Z"/></marker><marker id="reply" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0 0L10 5L0 10" fill="none" stroke="#111"/></marker><clipPath id="clip"><rect x="0" y="185" width="2110" height="${height-185}"/></clipPath></defs><rect width="100%" height="100%" fill="white"/><g font-family="Arial" fill="#111">${text(W/2,30,[`${c.id} - ${c.name} (${i+1}/${cuts.length-1})`],25)}`;
   for(let j=0;j<names.length;j++){
    if(j===7)svg+=`<path d="M${xs[j]-25} 77v50a25 9 0 0 0 50 0v-50" fill="white" stroke="#111"/><ellipse cx="${xs[j]}" cy="77" rx="25" ry="9" fill="white" stroke="#111"/>${text(xs[j],161,['Database'],22)}`;
    else svg+=`<rect x="${j===0?10:xs[j]-110}" y="65" width="${j===0?180:220}" height="105" fill="white" stroke="#111"/>${text(j===0?100:xs[j],99,lines(names[j],20),22)}`;
   }
   svg+=`<g clip-path="url(#clip)"><g transform="translate(0,${185-cuts[i]})">${body}</g></g></g></svg>`;
   if(!process.argv.includes('--layout-only')){fs.writeFileSync(`${base}-part${i+1}.svg`,svg);await sharp(Buffer.from(svg)).png().toFile(`${base}-part${i+1}.png`);}
  }
  counts[c.id]=cuts.length-1;
 }
 for(let sp=1;sp<=5;sp++){
  const f=`docs/Report 4/sections/nhuy/2/sprint${sp}.tex`;let s=fs.readFileSync(f,'utf8');
  for(const c of catalog.filter(c=>c.sprint===sp)){
   const line=s.split('\n').find(l=>l.startsWith('\\kfig')&&l.includes(`/${c.id}-${c.slug}}`));
   let replacement='\\clearpage\n\\begin{landscape}\n';
   for(let i=1;i<=counts[c.id];i++)replacement+=`\\begin{figure}[p]\\centering\n\\includegraphics[width=0.98\\linewidth,height=0.66\\linewidth,keepaspectratio]{images/sprint${sp}/nhuy/sequences/${c.id}-${c.slug}-part${i}.png}\n\\caption{${c.id} ${c.name} -- Part ${i}/${counts[c.id]}}\\label{fig:nhuy-${c.id.replace('.','-').toLowerCase()}-part${i}}\n\\end{figure}\\clearpage\n`;
   replacement+='\\end{landscape}\n';s=line?s.replace(line,replacement):s.replace(/\\clearpage\s*\\begin\{landscape\}[\s\S]*?\\end\{landscape\}\s*/g,block=>block.includes(`/${c.id}-${c.slug}-part`)?replacement:block);
  }
  fs.writeFileSync(f,s);
 }
 const main='docs/Report 4/main.tex';let s=fs.readFileSync(main,'utf8');if(!s.includes('\\usepackage{pdflscape}'))s=s.replace('\\usepackage{graphicx}','\\usepackage{graphicx}\n\\usepackage{pdflscape}');fs.writeFileSync(main,s);
 fs.writeFileSync('outputs/report-completion/sequence-panel-counts.json',JSON.stringify(counts,null,2));console.log(`Rendered ${Object.values(counts).reduce((a,b)=>a+b,0)} readable panels for ${Object.keys(counts).length} diagrams.`);
})();
