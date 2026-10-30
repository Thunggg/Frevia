const fs=require('node:fs');
const path=require('node:path');
const sharp=require('../../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp');
const catalog=JSON.parse(fs.readFileSync('outputs/report-completion/catalog.json'));
const classes=JSON.parse(fs.readFileSync('outputs/report-completion/classes.json'));
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
(async()=>{
  for(const c of catalog) {
    const src=`sequence-diagrams/previews/${c.id}-${c.slug}.svg`;
    const dest=`docs/Report 4/images/sprint${c.sprint}/nhuy/sequences/${c.id}-${c.slug}`;
    fs.mkdirSync(path.dirname(dest),{recursive:true});
    fs.copyFileSync(src,dest+'.svg');
    await sharp(src).png().toFile(dest+'.png');
  }
  for(let sprint=1;sprint<=5;sprint++) {
    const data=classes[sprint];
    // Dependency overview; full class methods/signatures are in Class Specification.
    const boxWidth=430,rowHeight=215,width=1480,height=120+Math.max(...['Controller','Service','Repository'].map(type=>data.filter(c=>c.name.endsWith(type)).length))*rowHeight;
    const positions=new Map();
    for(const [col,type]of ['Controller','Service','Repository'].entries())data.filter(c=>c.name.endsWith(type)).forEach((c,row)=>positions.set(c.name,{x:35+col*490,y:75+row*rowHeight}));
    let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><marker id="dep" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="none" stroke="#555"/></marker></defs><rect width="100%" height="100%" fill="white"/><g font-family="Arial" fill="#111"><text x="740" y="38" text-anchor="middle" font-size="24">Sprint ${sprint} — implementation classes and dependencies</text>`;
    for(const c of data)for(const dep of c.deps) {
      const a=positions.get(c.name),b=positions.get(dep.type);
      if(a&&b)svg+=`<path d="M${a.x+430} ${a.y+80} C${a.x+460} ${a.y+80},${b.x-30} ${b.y+80},${b.x} ${b.y+80}" fill="none" stroke="#777" stroke-dasharray="5 3" marker-end="url(#dep)"/>`;
    }
    for(const [i,c] of data.entries()) {
      const {x,y}=positions.get(c.name);
      svg+=`<rect x="${x}" y="${y}" width="${boxWidth}" height="190" fill="white" stroke="#111"/><text x="${x+215}" y="${y+27}" text-anchor="middle" font-size="17" font-weight="bold">${esc(c.name)}</text><path d="M${x} ${y+40}h430" stroke="#111"/>`;
      const deps=c.deps.map(p=>`${p.name}: ${p.type}`);
      for(const [j,t] of deps.slice(0,4).entries())svg+=`<text x="${x+12}" y="${y+62+j*18}" font-size="12">${esc(t)}</text>`;
      svg+=`<path d="M${x} ${y+120}h430" stroke="#111"/>`;
      for(const [j,m]of c.methods.slice(0,2).entries())svg+=`<text x="${x+12}" y="${y+141+j*17}" font-size="13">${m.private?'-':'+'} ${esc(m.name)}(...)</text>`;
      svg+=`<text x="${x+12}" y="${y+180}" font-size="12">${c.methods.length} methods; full signatures in Class Specification</text>`;
    }
    svg+='</g></svg>';
    const dest=`docs/Report 4/images/sprint${sprint}/nhuy/classDiagram/CanonicalClasses`;
    fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest+'.svg',svg);
    await sharp(Buffer.from(svg)).png().toFile(dest+'.png');
  }
  console.log('Rendered 51 sequence diagrams and 5 class overviews to PNG.');
})();
