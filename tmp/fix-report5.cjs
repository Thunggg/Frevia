const fs=require('fs');
const p='docs/Report 5/tools/build-nhuy-tests.mjs';
let s=fs.readFileSync(p,'utf8');
for(const [a,b]of [['FREELANCER','Freelancer'],['CLIENT','Client'],['ADMIN','Admin'],['EXPERT','Expert']]) {
 for(const key of ['name','roleName','role','target']) s=s.replaceAll(`${key}:'${a}'`,`${key}:'${b}'`);
}
s=s.replace("['client','CLIENT','N']","['client',shared.RoleName.CLIENT,'N']");
s=s.replace("bad(g,'rejects a processed analysis'","if(method==='confirmCvAnalysis')bad(g,'rejects a processed analysis'");
fs.writeFileSync(p,s);
