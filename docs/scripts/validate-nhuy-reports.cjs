const fs=require('node:fs');const path=require('node:path');
const cs=JSON.parse(fs.readFileSync('outputs/report-completion/catalog.json'));
const failures=[];const counts=[];
for(let sprint=1;sprint<=5;sprint++){
 const list=cs.filter(c=>c.sprint===sprint);
 const spec=`docs/Report 3/sections/2.Subsections/2.2.Subsections/2.2.3.Subsections/sprint${sprint}/nhuy.tex`;
 const func=`docs/Report 3/sections/4.Subsections/sprint${sprint}/nhuy.tex`;
 const seq=`docs/Report 4/sections/nhuy/2/sprint${sprint}.tex`;
 for(const file of [spec,func,seq]){
  const txt=fs.readFileSync(file,'utf8');
  for(const c of list)if(!txt.includes(c.id+' -- '+c.name))failures.push(`${file}: missing ${c.id}`);
  const stack=[];
  for(const m of txt.matchAll(/\\(begin|end)\{([^}]+)\}/g))if(m[1]==='begin')stack.push(m[2]);else if(stack.pop()!==m[2])failures.push(`${file}: environment mismatch ${m[2]}`);
  if(stack.length)failures.push(`${file}: unclosed environments`);
  if(/undefined|TODO|TBD|placeholder|pending export/i.test(txt))failures.push(`${file}: placeholder`);
 }
 for(const c of list){
  for(const ext of ['png','svg'])if(!fs.existsSync(`docs/Report 4/images/sprint${sprint}/nhuy/sequences/${c.id}-${c.slug}.${ext}`))failures.push(`Missing ${c.id} ${ext}`);
  if(!fs.existsSync(`sequence-diagrams/${c.id}-${c.slug}.drawio`))failures.push(`Missing ${c.id} drawio`);
 }
 counts.push({sprint,ucs:list.length,specifications:list.length,functionalRequirements:list.length,sequences:list.length});
}
// Check active includes, resolving relative to each report root as LaTeX does.
for(const report of [3,4]){
 const root=`docs/Report ${report}`;const visited=new Set();
 function visit(relative){
  const f=path.join(root,relative);if(visited.has(f))return;visited.add(f);
  if(!fs.existsSync(f)){failures.push(`Missing active input ${f}`);return;}
  const src=fs.readFileSync(f,'utf8').split('\n').map(l=>l.replace(/(?<!\\)%.*/, '')).join('\n');
  for(const m of src.matchAll(/\\input\{([^}]+)\}/g))visit(m[1].endsWith('.tex')?m[1]:m[1]+'.tex');
 }
 visit('main.tex');
 for(let sp=1;sp<=5;sp++)if(![...visited].some(f=>report===3?f.replaceAll('\\','/').endsWith(`sprint${sp}/nhuy.tex`):f.replaceAll('\\','/').endsWith(`nhuy/2/sprint${sp}.tex`)))failures.push(`Report ${report}: sprint ${sp} not included`);
}
const result={counts,total:cs.length,failures};fs.writeFileSync('outputs/report-completion/validation.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));if(failures.length)process.exitCode=1;
