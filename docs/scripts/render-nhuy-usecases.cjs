const fs=require('node:fs');const path=require('node:path');
const sharp=require('../../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp');
const cs=JSON.parse(fs.readFileSync('outputs/report-completion/catalog.json'));
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
const wrap=s=>s.match(/.{1,34}(?:\s|$)/g)||[s];
(async()=>{
 let tex='\n% BEGIN NHUY SPRINT DIAGRAMS\n\\paragraph{Canonical Sprint Use Cases -- Nguyen Lu Nhat Huy}\nThese diagrams show the 51 use cases assigned to this author using the final sprint identifiers. Existing diagrams for other authors are retained.\n';
 for(let sp=1;sp<=5;sp++) {
  const list=cs.filter(c=>c.sprint===sp),actors=[...new Set(list.map(c=>c.actor))];const h=180+Math.ceil(list.length/2)*180;
  let s=`<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="${h}"><rect width="100%" height="100%" fill="white"/><g font-family="Arial" font-size="20" fill="#111"><rect x="330" y="35" width="1130" height="${h-70}" fill="none" stroke="#111"/><text x="895" y="67" text-anchor="middle" font-weight="bold">Frevia - Sprint ${sp}</text>`;
  const ay={};actors.forEach((a,i)=>{const y=150+i*(h-220)/Math.max(1,actors.length);ay[a]=y;s+=`<circle cx="130" cy="${y-25}" r="18" fill="white" stroke="#111"/><path d="M130 ${y-7}v55m-32-34h64m-32 34l-28 38m28-38l28 38" fill="none" stroke="#111"/><text x="130" y="${y+115}" text-anchor="middle" font-size="18">${esc(a)}</text>`;});
  for(const [i,c]of list.entries()) {
    const x=620+(i%2)*540,y=155+Math.floor(i/2)*180;
    s+=`<line x1="165" y1="${ay[c.actor]+15}" x2="${x-240}" y2="${y}" stroke="#999"/><ellipse cx="${x}" cy="${y}" rx="240" ry="65" fill="white" stroke="#111"/><text x="${x}" y="${y-18}" text-anchor="middle"><tspan x="${x}" font-weight="bold">${c.id}</tspan>${wrap(c.name).map((l,j)=>`<tspan x="${x}" dy="26">${esc(l.trim())}</tspan>`).join('')}</text>`;
  }
  s+='</g></svg>';const base=`docs/Report 3/image/UC_diagram/nhuy-sprint${sp}`;fs.mkdirSync(path.dirname(base),{recursive:true});fs.writeFileSync(base+'.svg',s);await sharp(Buffer.from(s)).png().toFile(base+'.png');
  tex+=`\\begin{figure}[H]\\centering\n\\includegraphics[width=0.98\\textwidth,height=0.85\\textheight,keepaspectratio]{image/UC_diagram/nhuy-sprint${sp}.png}\n\\caption{Sprint ${sp} use cases -- Nguyen Lu Nhat Huy}\\label{fig:nhuy-usecases-${sp}}\n\\end{figure}\n`;
 }
 tex+='% END NHUY SPRINT DIAGRAMS\n';const f='docs/Report 3/sections/2.Subsections/2.2.Subsections/2.2.1.Diagram.tex';let t=fs.readFileSync(f,'utf8').replace(/\n% BEGIN NHUY SPRINT DIAGRAMS[\s\S]*?% END NHUY SPRINT DIAGRAMS\n/g,'\n');fs.writeFileSync(f,t+tex);
 console.log('Generated 5 canonical UC diagrams for Report 3.');
})();
