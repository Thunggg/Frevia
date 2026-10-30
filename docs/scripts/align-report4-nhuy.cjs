// Match the feature-group and class-table structure used by tthuan in Report 4.
const fs=require('node:fs');const path=require('node:path');
const sharp=require('../../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp');
const catalog=JSON.parse(fs.readFileSync('outputs/report-completion/catalog.json'));
const classes=JSON.parse(fs.readFileSync('outputs/report-completion/classes.json'));
const tex=s=>String(s).replace(/[&%_#$]/g,c=>'\\'+c);
const xml=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const write=(f,s)=>{fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,s.trimEnd()+'\n');};
const groups={
1:[['Freelancer Profile Management',['07'],'Public freelancer profile viewing and ownership-checked profile updates. Low-strength changes are submitted for review.'],['Freelancer Skill Management',['08'],'The freelancer skill list supports catalog lookup, duplicate checking and ownership-checked association removal.'],['Portfolio Management',['09'],'Portfolio entries can be viewed individually or as a list. Owners can add, update and soft-delete their portfolio items.']],
2:[['Identity Verification Management',['18'],'Freelancers upload identity documents and inspect the latest verification state. The submission workflow includes standard upload and AI verification.'],['Client Profile Management',['19'],'Public client information is retrieved separately from authenticated company-information updates.'],['Social Link Management',['20'],'An authenticated user manages links associated with their own profile, with one link per platform.'],['Favorite Freelancer Management',['21'],'Clients maintain their favorite freelancers without modifying the underlying freelancer accounts.']],
3:[['Following Freelancer Management',['29'],'Clients view followed freelancers, follow a freelancer and remove an existing follow relationship. A new follow creates a notification in the same transaction.'],['Notification Management',['30'],'Users view their notifications, mark one or all as read and soft-delete an owned notification.'],['Account Role Management',['31'],'Users activate an assigned role or join a new client/freelancer role. Both operations issue a new access token for the current session.']],
4:[['Review Management',['39'],'Contract participants view reviews and write a review after contract completion. Review authors can update or soft-delete their own review.'],['Review Response Management',['40'],'The reviewee can create or restore a response. Response authors can update or soft-delete their response.'],['General Account Profile Management',['41'],'Authenticated users view and update their general profile, change their password and upload an avatar.']],
5:[['Profile Update Request Management',['47.01','47.02','47.03','47.04','47.05'],'Administrators inspect pending requests, compare proposed changes, approve or reject a pending request and inspect request history.'],['Expert Profile Management',['47.06'],'Experts submit sanitized profile changes for administrative review. An existing pending expert revision prevents another submission.'],['Freelancer CV Management',['07'],'Freelancers upload, retrieve, replace and delete their own PDF CV. Upload and replacement use the same endpoint.']]
};
function matches(c,ids){return ids.some(id=>c.id.startsWith('UC-'+id+(id.includes('.')?'':'.')));}
function classSelection(sp,cs){
 const names=new Set(cs.map(c=>c.controller));
 let changed=true;
 while(changed){changed=false;for(const cl of classes[sp])if(names.has(cl.name))for(const dep of cl.deps)if(classes[sp].some(c=>c.name===dep.type)&&!names.has(dep.type)){names.add(dep.type);changed=true;}}
 return classes[sp].filter(cl=>names.has(cl.name));
}
async function diagram(sp,name,selected){
 selected=[...selected,{name:'PrismaService',deps:[],methods:[{name:'$transaction',private:false},{name:'model delegates',private:false}]}];
 const width=1500,colw=330;const pos=new Map();
 for(const [i,suffix]of ['Controller','Service','Repository','PrismaService'].entries())selected.filter(c=>suffix==='PrismaService'?c.name===suffix:c.name!=='PrismaService'&&c.name.endsWith(suffix)).forEach((c,j)=>pos.set(c.name,{x:20+i*370,y:75+j*250}));
 const height=125+Math.max(1,...[...pos.values()].map(p=>(p.y-75)/250+1))*250;
 let s=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><marker id="a" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8" fill="none" stroke="#111"/></marker></defs><rect width="100%" height="100%" fill="white"/><g font-family="Arial" fill="#111"><text x="750" y="36" text-anchor="middle" font-size="24">${xml(name)}</text>`;
 for(const c of selected)for(const d of c.deps){const a=pos.get(c.name),b=pos.get(d.type);if(a&&b)s+=`<path d="M${a.x+colw} ${a.y+110}C${a.x+350} ${a.y+110},${b.x-20} ${b.y+110},${b.x} ${b.y+110}" fill="none" stroke="#777" stroke-dasharray="5 4" marker-end="url(#a)"/>`;}
 for(const c of selected){const {x,y}=pos.get(c.name);s+=`<rect x="${x}" y="${y}" width="330" height="220" fill="white" stroke="#111"/><text x="${x+165}" y="${y+26}" text-anchor="middle" font-size="16" font-weight="bold">${xml(c.name)}</text><path d="M${x} ${y+40}h330M${x} ${y+125}h330" stroke="#111"/>`;
  for(const [j,d]of c.deps.slice(0,4).entries())s+=`<text x="${x+10}" y="${y+60+j*18}" font-size="12">- ${xml(d.name)}: ${xml(d.type)}</text>`;
  for(const [j,m]of c.methods.slice(0,4).entries())s+=`<text x="${x+10}" y="${y+146+j*17}" font-size="13">${m.private?'-':'+'} ${xml(m.name)}(...)</text>`;
 }
 s+='</g></svg>';const dest=`docs/Report 4/images/sprint${sp}/nhuy/classDiagram/${name.replaceAll(' ','')}`;
 write(dest+'.svg',s);await sharp(Buffer.from(s)).png().toFile(dest+'.png');return dest.split('docs/Report 4/')[1];
}
const paramMeaning={userId:'account identifier used by this operation',currentUserId:'authenticated user identifier used for ownership checks',adminId:'administrator identifier recorded with the review decision',profileId:'target profile identifier',contractId:'contract identifier',freelancerId:'target freelancer account identifier',clientId:'client account identifier',reviewId:'review identifier',responseId:'review response identifier',notificationId:'notification identifier',sessionId:'current authenticated session identifier',id:'target resource identifier',body:'validated HTTP request body',input:'validated operation input',dto:'validated operation input',file:'optional multipart file provided by the upload interceptor',files:'multipart identity-verification images and liveness frames',reviewNotes:'administrator review notes or rejection reason',profileType:'profile role type',responseText:'response content',search:'optional search text',filter:'validated list filters and pagination',data:'values to persist',profileStrength:'calculated profile completion strength',threshold:'profile strength threshold',name:'catalog name to resolve',skillId:'catalog or freelancer-skill identifier as required by the method',proficiencyLevel:'freelancer proficiency level'};
function code(s){return '\\code{'+s+'}';}
function route(cl,m){const src=fs.readFileSync(cl.file,'utf8');const before=src.slice(0,src.indexOf('export class '+cl.name));const decorators=[...before.matchAll(/@Controller\('([^']*)'\)/g)];const prefix=decorators.at(-1)?.[1]||'';const rm=m.route.match(/^(Get|Put|Post|Patch|Delete)\((?:'([^']*)')?\)/);return rm?`${rm[1].toUpperCase()} /${[prefix,rm[2]].filter(Boolean).join('/')}`:'';}
function description(m){
 const human=m.name.replace(/([a-z])([A-Z])/g,'$1 $2').toLowerCase();
 return `A method to ${human}${m.private?' as an internal helper':''}.`+(m.calls.length?' The implementation delegates to '+m.calls.map(code).join(', ')+'.':'');
}
(async()=>{
 for(let sp=1;sp<=5;sp++){
  let design=`% =================================================================\n% FILE: sections/nhuy/2/sprint${sp}.tex -- Sprint ${sp}\n% Structure follows the feature-group template used by tthuan.\n% =================================================================\n`;
  for(const [name,ids,desc]of groups[sp]){
   const cs=catalog.filter(c=>c.sprint===sp&&matches(c,ids));if(!cs.length)throw new Error('Empty group '+name);
   const img=await diagram(sp,name,classSelection(sp,cs));const slug=name.toLowerCase().replaceAll(' ','-');
   design+=`\n% ================= ${name} =================\n\\subsection{${name}}\n\n${desc}\n\n\\textbf{a.~Class Diagram}\n\n\\kfig{0.92\\textwidth}{${img}}{Class diagram of ${name}}{fig:nhuy-cls-${slug}}\n\n\\textbf{b.~Sequence Diagram(s)}\n`;
   for(const c of cs)design+=`\n\\subsubsection{${c.id} -- ${c.name}}\n\\kfig{0.78\\textwidth}{images/sprint${sp}/nhuy/sequences/${c.id}-${c.slug}}{Sequence diagram of ${c.id} ${c.name}}{fig:nhuy-seq-${c.slug}}\n`;
  }
  write(`docs/Report 4/sections/nhuy/2/sprint${sp}.tex`,design);
  let spec=`% =================================================================\n% FILE: sections/nhuy/4/sprint${sp}.tex -- Sprint ${sp}\n% Class specifications follow the shared Report 4 table conventions.\n% =================================================================\n`;
  for(const cl of classes[sp]){
   spec+=`\n\\subsection{${cl.name} Class}\n\n\\paragraph{ClassMethod}\n\\begin{ClassMethodTable}\n`;
   let n=1;
   if(cl.deps.length){spec+=`${String(n++).padStart(2,'0')} & ${code(cl.name+'(')}\\newline${cl.deps.map(d=>code(d.name+': '+d.type)).join(',\\newline')}${code(')')} &\nA method to initialize the ${cl.name.endsWith('Controller')?'controller':cl.name.endsWith('Service')?'service':'repository'} with its dependencies.\n`+cl.deps.map(d=>`\\newline -- ${code(d.name)}: ${code(d.type)} -- constructor-injected dependency.`).join('\n')+'\n\\newline -- \\textit{Returns:} '+code('void')+' -- constructor, no return value. \\\\ \\hline\n\n';}
   for(const m of cl.methods){
    spec+=`${String(n++).padStart(2,'0')} & ${code(m.name+'(')}${m.params.length?'\\newline'+m.params.map(p=>code(p)).join(',\\newline'):''}${code(')')} &\n${description(m)}\n`;
    for(const p of m.params){const at=p.indexOf(':');const name=p.slice(0,at).replace('?','').trim(),type=p.slice(at+1).trim();spec+=`\\newline -- ${code(name)}: ${code(type)} -- ${paramMeaning[name]||'operation parameter used by the implementation'}.\n`;}
    spec+=`\\newline -- \\textit{Returns:} ${code(m.returns.replace(' (serialized response)',''))} -- ${m.returns.includes('serialized')?'serialized controller response':'operation result'}.\n`;
    const r=route(cl,m);if(r)spec+=`\\newline -- Route: ${code(r)}.\n`;
    spec+=' \\\\ \\hline\n\n';
   }
   spec+='\\end{ClassMethodTable}\n\n\\paragraph{ClassAttribute}\n\\begin{ClassAttributeTable}\n'+cl.deps.map((d,i)=>`${String(i+1).padStart(2,'0')} & ${code(d.name)} & ${code(d.type)} -- injected ${/Repository|Prisma/.test(d.type)?'persistence gateway':'application dependency'}. \\\\ \\hline`).join('\n')+'\n\\end{ClassAttributeTable}\n';
  }
  write(`docs/Report 4/sections/nhuy/4/sprint${sp}.tex`,spec);
 }
 console.log('Aligned 5 design files and 5 class-specification files; generated 16 feature class diagrams.');
})();
