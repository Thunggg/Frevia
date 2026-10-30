// Canonical UC inventory and Report 3/4 source generation, preserving other authors.
const fs = require('node:fs');
const path = require('node:path');
const ts = require(require.resolve('typescript', { paths: [path.resolve('apps/api')] }));
const shared = require('../../sequence-diagrams/scripts/generate-freelancer-sequences.cjs');
const all = [...shared.diagrams];
const originalSave = shared.Diagram.prototype.save;
shared.Diagram.prototype.save = function () { all.push(this); };
for (const file of ['generate-account-sequences', 'generate-following-notification-role-sequences', 'generate-review-profile-sequences', 'generate-revision-cv-sequences']) require(`../../sequence-diagrams/scripts/${file}.cjs`);
shared.Diagram.prototype.save = originalSave;
const tex = x => String(x).replace(/[\\{}%&#_$~^]/g, c => ({'\\':'\u005c textbackslash{}','{':'\\{','}':'\\}','%':'\\%','&':'\\&','#':'\\#','_':'\\_','$':'\\$','~':'\\textasciitilde{}','^':'\\textasciicircum{}'}[c])).replace('\\ textbackslash','\\textbackslash');
const xml = x => String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const write = (f, s) => { fs.mkdirSync(path.dirname(f),{recursive:true}); fs.writeFileSync(f,s); };
const title = ['', 'Freelancer Profile, Skills and Portfolio', 'Identity Verification, Client Profile, Social Links and Favorites', 'Following, Notifications and Account Roles', 'Reviews, Review Responses and Account Settings', 'Profile Revision Approval, Expert Profile and CV'];
const specBase = 'sections/2.Subsections/2.2.Subsections/2.2.3.Subsections';
const catalog = all.map(d => {
  const old = d.id;
  if (/^UC-10\./.test(d.id)) d.id = d.id.replace('UC-10.','UC-07.');
  else if (/^UC-11\./.test(d.id)) d.id = d.id.replace('UC-11.','UC-08.');
  else if (/^UC-12\./.test(d.id)) d.id = d.id.replace('UC-12.','UC-09.');
  const group = Number(d.id.slice(3,5));
  const sprint = (group <= 9 && !/^UC-07\.0[3-6]$/.test(d.id)) ? 1 : group <= 21 && group >=18 ? 2 : group >=29 && group<=31 ? 3 : group>=39 && group<=41 ? 4 : 5;
  const messages = d.events.filter(e=>e.type==='msg');
  const clean = s => s.replace(/^\d+(?:\.\d+)*\.\s*/, '');
  const endpoint = clean(messages.find(e=>e.a===1&&e.b===2).label).replace(/\n\(body\)/,'');
  const trigger = clean(messages.find(e=>e.a===0).label);
  const operations = messages.filter(e=>!e.ret && (e.a===4 && e.b===5 || e.a===4&&e.b===4)).map(e=>clean(e.label));
  const breaks = d.events.filter(e=>e.type==='frame'&&e.kind==='break').map(f=>({condition:f.condition,error:clean(messages.find(e=>e.ret&&e.y>f.y&&e.y<f.y+f.h)?.label || 'Request rejected')}));
  const branches = d.events.filter(e=>(e.type==='frame'&&['alt','opt','ref'].includes(e.kind))||e.type==='divider').filter(e=>!e.condition.includes('Verify jwt')&&!e.condition.includes('PermissionGuard')).map(e=>e.condition);
  const result = clean(messages.filter(e=>e.b===0).at(-1).label);
  const actor = d.names?.[0] || (d.write ? 'Freelancer' : 'Visitor / Freelancer');
  const serviceResult=clean(messages.filter(e=>e.ret&&e.a===4&&e.b===3).at(-1)?.label||'Branch-specific file or result');
  const data = {id:d.id,oldId:old,slug:d.slug,name:d.title,sprint,actor,auth:d.write,endpoint,trigger,operations,breaks,branches,result,serviceResult,domain:d.domain,controller:d.names?.[3]?.slice(1)||`${d.domain}Controller`};
  // New canonical sources; preserve original IDs as historical files to avoid deleting work.
  if (old !== d.id) originalSave.call(d);
  return data;
}).sort((a,b)=>a.sprint-b.sprint||a.id.localeCompare(b.id));
if (catalog.length!==51) throw new Error(`Expected 51 UC, got ${catalog.length}`);
write('outputs/report-completion/catalog.json',JSON.stringify(catalog,null,2));
const list = a => a.length ? a.map((s,i)=>`${i+1}. ${tex(s)}`).join(' \\newline\n') : 'None.';
const row = (k,v) => `${tex(k)} & ${v} \\\\ \\hline\n`;
for (let sprint=1;sprint<=5;sprint++) {
  const cases = catalog.filter(c=>c.sprint===sprint);
  let spec = `% Canonical scope: Nguyen Lu Nhat Huy, Sprint ${sprint}.\n\\paragraph{Sprint ${sprint}: ${tex(title[sprint])}}\n`;
  let functional = `\\subsection{Sprint ${sprint}: ${tex(title[sprint])}}\n`;
  let design = `\\subsection{Sprint ${sprint}: ${tex(title[sprint])}}\nThis section documents ${cases.length} individual use cases against the implemented HTTP controllers, services and Prisma repositories. Authentication and permission checks precede protected handlers; public profile reads are identified separately.\n\\textbf{a.~Class Diagram}\n\\kfig{0.98\\textwidth}{images/sprint${sprint}/nhuy/classDiagram/CanonicalClasses}{Class diagram for Sprint ${sprint}}{fig:nhuy-canonical-class-${sprint}}\n\\textbf{b.~Sequence Diagrams}\n`;
  for (const c of cases) {
    const pre = c.auth ? `${c.actor} is authenticated with an active session and permission for the endpoint. Required records and valid input are prepared for the success path.` : 'The target freelancer/client resource exists. This read endpoint is public and does not require a JWT.';
    spec += `\n\\subparagraph{${c.id} -- ${tex(c.name)}}\n{\\singlespacing\\small\n\\begin{longtable}{|L{3.2cm}|L{11.1cm}|}\\hline\n`;
    spec += row('UC ID and Name',`${c.id} -- ${tex(c.name)}`)+row('Created By','Nguyen Lu Nhat Huy')+row('Primary Actor',tex(c.actor))+row('Trigger',tex(c.trigger))+row('Description',`The actor performs ${tex(c.name.toLowerCase())}. ${tex(c.result)}.`)+row('Preconditions',tex(pre))+row('Post-conditions',tex(c.result))+row('Normal Flow',list([c.trigger,`The system receives ${c.endpoint}.`,...c.operations, c.result]))+row('Alternative Flows',list(c.branches))+row('Exceptions',list(c.breaks.map(b=>`${b.condition}: ${b.error}. The interaction ends without continuing the success path.`)))+row('Priority','High')+row('Frequency of Use',/View/.test(c.name)?'On demand when the actor opens the relevant page.':'On demand when the actor submits the action.')+row('Business Rules',`Authorization, ownership and state constraints are listed in Exceptions and Alternative Flows; the endpoint is ${c.auth?'protected':'public'}.`)+row('Other Information',tex(c.endpoint))+row('Assumptions','Storage/database services are available for the normal path. Infrastructure failures must not be reported as a successful operation.');
    spec += '\\end{longtable}}\n';
    functional += `\n\\subsubsection{${c.id} -- ${tex(c.name)}}\n\\textbf{Function Trigger:} ${tex(c.trigger)}.\n\n\\textbf{Function description:} ${tex(c.result)}.\n\n\\textbf{Precondition:} ${tex(pre)}\n\n\\textbf{Process and validation:}\n\\begin{enumerate}\n${[...c.operations,c.result].map(x=>'\\item '+tex(x)).join('\n')}\n\\end{enumerate}\n\\textbf{Alternative and exception handling:} ${tex([...c.branches,...c.breaks.map(b=>`${b.condition}: ${b.error}`)].join('; ')||'An empty collection is a valid result.')}\n\n\\textbf{Interface/API mapping:} ${tex(c.endpoint)}. The UI displays the returned state or error.\n`;
    design += `\n\\subsubsection{${c.id} -- ${tex(c.name)}}\n${tex(c.trigger)}. ${tex(c.result)}.\n\\kfig{0.98\\textwidth}{images/sprint${sprint}/nhuy/sequences/${c.id}-${c.slug}}{Sequence diagram of ${c.id} ${tex(c.name)}}{fig:nhuy-${c.id.replace('.','-').toLowerCase()}}\n`;
  }
  write(`docs/Report 3/${specBase}/sprint${sprint}/nhuy.tex`,spec);
  write(`docs/Report 3/sections/4.Subsections/sprint${sprint}/nhuy.tex`,functional);
  write(`docs/Report 4/sections/nhuy/2/sprint${sprint}.tex`,design);
}
// Replace only this author's old sprint-1 imports; preserve all other authors.
let f='docs/Report 3/sections/2.Subsections/2.2.Subsections/2.2.3.Use_Case_Specification.tex';
let s=fs.readFileSync(f,'utf8').replace(/^\\input\{[^\n]*(?:3.Profile_Management|4.Skills_Management|5.Portfolio_Management)\}\s*$/gm,'');
for(let i=1;i<=5;i++) if(!s.includes(`${specBase}/sprint${i}/nhuy}`)) s+=`\n\\input{${specBase}/sprint${i}/nhuy}\n`;
write(f,s);
f='docs/Report 3/sections/4.Functional_Requirement.tex';s=fs.readFileSync(f,'utf8');
for(let i=1;i<=5;i++) {const line=`\\input{sections/4.Subsections/sprint${i}/nhuy}`;s=s.replace(`% ${line}`,line);if(!s.includes(line))s+=`\n${line}\n`;}
write(f,s);
// Canonical UC description table, replacing obsolete rows owned by this module.
f='docs/Report 3/sections/2.Subsections/2.2.Subsections/2.2.2.Use_Case_Description.tex';s=fs.readFileSync(f,'utf8').replace(/^UC-(?:10|11|12)(?:\.\d+)? &[^\n]*\n\\hline\r?\n/gm,'');
s=s.replace(/\n% BEGIN NHUY CANONICAL[\s\S]*?% END NHUY CANONICAL\n/g,'\n');
s+='\n% BEGIN NHUY CANONICAL\n\\paragraph{Canonical use cases by sprint -- Nguyen Lu Nhat Huy}\n\\begin{longtable}{|L{1.9cm}|L{4.2cm}|L{2.5cm}|L{5.4cm}|}\\hline\nID & Use Case & Actor & Description \\\\ \\hline\n'+catalog.map(c=>`${c.id} & ${tex(c.name)} & ${tex(c.actor)} & Sprint ${c.sprint}. ${tex(c.result)} \\\\ \\hline`).join('\n')+'\n\\end{longtable}\n% END NHUY CANONICAL\n';write(f,s);
// Controller, service and repository class specifications from real TypeScript declarations.
const moduleSets={1:['profiles/profile','portfolios/portfolio'],2:['account-profile/account-profile'],3:['account-profile/account-profile','notifications/notification','auth/auth'],4:['reviews/review','account-profile/account-profile'],5:['profile-revisions/profile-revision','expert-profile/expert-profile','profiles/profile']};
const configPath=ts.findConfigFile('apps/api',ts.sys.fileExists,'tsconfig.json');
const config=ts.readConfigFile(configPath,ts.sys.readFile);
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,path.dirname(configPath));
const program=ts.createProgram(parsed.fileNames,parsed.options);const checker=program.getTypeChecker();
function allowed(sprint,cl,m) {
 if(cl==='AuthController'||cl==='AuthService')return ['switchRole','joinRole'].includes(m);
 if(cl==='AuthRepository')return ['switchPrimaryRole','joinRole'].includes(m);
 if(cl.startsWith('AdminExpert')||cl.startsWith('PublicExpert'))return false;
 if(cl.startsWith('ExpertProfile'))return !['getMine','updateByAdmin','updateDirect','findPublicMany','findPublicById','findPublicByUserId','findPublicExpertById'].includes(m);
 if(cl.startsWith('Profile')&&!cl.startsWith('ProfileRevision'))return sprint===1 ? !/Cv|LocalCv/.test(m) : /Cv|LocalCv|findFreelancerProfileById/.test(m)&&!['analyzeCv','readCvBytes'].includes(m);
 if(cl.includes('AccountProfile')||['IdentityVerificationController','ClientProfileController','SocialLinkController','FavoriteFreelancerController','FollowingFreelancerController'].includes(cl)) {
  if(sprint===2) return !/General|Avatar|Password|Follow|discover/.test(m)&&!['get','update','changePassword','uploadAvatar','getAvatarFile'].includes(m)||cl==='ClientProfileController'&&['getDetail','update'].includes(m);
  if(sprint===3)return /Follow|follow|requireRole|findUserWithRoles/.test(m);
  if(sprint===4)return /General|Avatar|Password|hash|detectAvatar/.test(m)||cl==='GeneralAccountProfileController';
 }
 return true;
}
const classData={};
for(let sprint=1;sprint<=5;sprint++) {
  let classes=[];
  for(const mod of moduleSets[sprint]) for(const type of ['controller','service','repo']) {
    const file=`apps/api/src/routes/${mod}.${type}.ts`;const src=program.getSourceFile(file)||ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
    for(const cl of src.statements.filter(ts.isClassDeclaration)) {
      const name=cl.name.text;
      const ctor=cl.members.find(ts.isConstructorDeclaration);
      const deps=(ctor?.parameters||[]).map(p=>({name:p.name.getText(src),type:p.type?.getText(src)||'unknown'}));
      const methods=cl.members.filter(ts.isMethodDeclaration).filter(m=>allowed(sprint,name,m.name.getText(src))).map(m=>{
        const signature=checker.getSignatureFromDeclaration(m);
        let returns=m.type?.getText(src)||(signature?checker.typeToString(checker.getReturnTypeOfSignature(signature)):'object');
        if(returns.length>180) returns=returns.startsWith('Promise<')?'Promise of the selected database projection / response object':'Selected database projection / response object';
        const serializer=(ts.getDecorators(m)||[]).map(x=>x.expression.getText(src)).find(x=>x.startsWith('ZodSerializerDto('));
        if(serializer) returns=serializer.slice(17,-1)+' (serialized response)';
        return {name:m.name.getText(src),params:m.parameters.map(p=>`${p.name.getText(src)}${p.questionToken?'?':''}: ${p.type?.getText(src)||checker.typeToString(checker.getTypeAtLocation(p))}`),returns,private:m.modifiers?.some(x=>x.kind===ts.SyntaxKind.PrivateKeyword),calls:[...new Set([...m.body.getText(src).matchAll(/this\.(\w+)\.(\w+)\(/g)].map(x=>`${x[1]}.${x[2]}`))],route:(ts.getDecorators(m)||[]).map(x=>x.expression.getText(src)).filter(x=>/^(Get|Put|Post|Patch|Delete)\(/.test(x)).join(';')};
      });
      if(!methods.length)continue;
      classes.push({name,file,deps,methods});
    }
  }
  // Shared classes are referenced at later sprints rather than repeated in full.
  classData[sprint]=classes;
  let text=`\\subsection{Sprint ${sprint}: Class Specifications}\nThe following signatures and injected dependencies are taken from the implementation. Shared Profile and AccountProfile classes introduced in earlier sprints also support this sprint's use cases.\n`;
  for(const cl of classes) {
    text+=`\n\\subsubsection{${cl.name} Class}\n\\textbf{Source:} \\texttt{${tex(cl.file)}}.\n\\paragraph{ClassMethod}\n\\begin{ClassMethodTable}\n`;
    for(const [i,m] of cl.methods.entries()) {
      const related=catalog.filter(c=>c.controller===cl.name||c.domain+'Service'===cl.name).filter(c=>c.operations.some(o=>o.includes(m.name+'('))||(m.route && c.endpoint.includes(m.route)));
      const behavior=related.length?related.map(c=>c.serviceResult).slice(0,2).join('; '):m.calls.length?`Delegates to ${m.calls.join(', ')}.`:`Implements ${m.name.replace(/([A-Z])/g,' $1').toLowerCase()} for this resource; ${m.private?'private helper':'application operation'}.`;
      text+=`${String(i+1).padStart(2,'0')} & ${tex(m.name)}(\\newline ${m.params.map(tex).join(',\\newline ')}) & ${tex(behavior)}${m.route?' \\newline Route: '+tex(m.route):''} \\newline Returns: ${tex(m.returns)}. ${m.private?'Private helper.':''} \\\\ \\hline\n`;
    }
    text+='\\end{ClassMethodTable}\n\\paragraph{ClassAttribute}\n\\begin{ClassAttributeTable}\n'+(cl.deps.length?cl.deps.map((p,i)=>`${i+1} & ${tex(p.name)} & ${tex(p.type)} -- constructor-injected dependency. \\\\ \\hline`).join('\n'):'1 & None & No injected dependency. \\\\ \\hline')+'\n\\end{ClassAttributeTable}\n';
  }
  write(`docs/Report 4/sections/nhuy/4/sprint${sprint}.tex`,text);
}
write('outputs/report-completion/classes.json',JSON.stringify(classData,null,2));
write('outputs/report-completion/traceability.csv','Sprint,UC,Name,Endpoint,Sequence,Specification\n'+catalog.map(c=>[c.sprint,c.id,c.name,c.endpoint,`sequence-diagrams/${c.id}-${c.slug}.drawio`,`${specBase}/sprint${c.sprint}/nhuy.tex`].map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\n'));
console.log(`Generated Report 3/4 sources and traceability for ${catalog.length} use cases.`);
