const fs=require('node:fs');
const write=(f,s)=>fs.writeFileSync(f,s);
for(let report of [3,4])for(let sp=1;sp<=5;sp++){
 const files=report===3?[`docs/Report 3/sections/2.Subsections/2.2.Subsections/2.2.3.Subsections/sprint${sp}/nhuy.tex`,`docs/Report 3/sections/4.Subsections/sprint${sp}/nhuy.tex`]:[`docs/Report 4/sections/nhuy/4/sprint${sp}.tex`];
 for(const f of files){let s=fs.readFileSync(f,'utf8');
  s=s.replace(/[—–]/g,'--').replace(/→/g,' to ');
  if(report===4)s=s.replace(/\\texttt\{([^}]+)\}/g,'\\code{$1}');
  // Allow wrapping long implementation identifiers without changing their printed names.
  s=s.replace(/\b[A-Za-z][A-Za-z0-9]*\b/g,(word,index)=>{
   if(['ClassMethodTable','ClassAttributeTable'].includes(word)||s[index-1]==='\\')return word;
   return word.replace(/([a-z])([A-Z])/g,'$1\\allowbreak{}$2');
  });
  if(report===3)s=s.replace(/\//g,'/\\allowbreak{}').replace(/\\&/g,'\\&\\allowbreak{}').replace(/=/g,'=\\allowbreak{}');
  if(!s.startsWith('\\begingroup'))s='\\begingroup\\sloppy\\emergencystretch=3em\\relax\n'+s+'\n\\endgroup\n';
  write(f,s);
 }
}
const drivers=[['docs/Report 3/sections/2.Subsections/2.2.Subsections/2.2.3.Use_Case_Specification.tex','sections/2.Subsections/2.2.Subsections/2.2.3.Subsections'],['docs/Report 3/sections/4.Functional_Requirement.tex','sections/4.Subsections']];
for(const [f,base]of drivers){let s=fs.readFileSync(f,'utf8');
 s=s.replace(/^\\input\{[^\n}]*\/nhuy(?:\.tex)?\}\s*$/gm,'');
 for(let sp=1;sp<=5;sp++){
  const line=`\\input{${base}/sprint${sp}/nhuy.tex}\n`;
  const re=new RegExp(`(% Sprint\\s*${sp}\\r?\\n% =+\\r?\\n)`);
  if(re.test(s))s=s.replace(re,'$1'+line);else s+=`\n% Sprint${sp}\n${line}`;
 }
 s=s.replace(/\\input\{([^}]+)(?<!\.tex)\}/g,'\\input{$1.tex}');write(f,s);
}
let f='docs/Report 4/sections/5.Database_Design.tex';write(f,'\\section{Database Design}\n\\input{sections/nhuy/database.tex}\n');
f='docs/Report 4/main.tex';let s=fs.readFileSync(f,'utf8');if(!s.includes('\\input{sections/5.Database_Design}'))s=s.replace('\\end{document}','\\input{sections/5.Database_Design}\n\n\\end{document}');write(f,s);
console.log('Applied breakable identifiers, explicit .tex inputs, sprint ordering and database integration.');
