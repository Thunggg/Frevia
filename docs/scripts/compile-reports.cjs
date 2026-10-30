const fs=require('node:fs');const path=require('node:path');const cp=require('node:child_process');
const root=path.resolve('.');const exe=path.join(root,'outputs/report-completion/tectonic/tectonic.exe');
const reports=process.argv.slice(2).map(Number);const runs=[];
for(const report of reports.length?reports:[3,4]){
 const out=path.join(root,`outputs/report-completion/report${report}-pdf`);
 const result=cp.spawnSync(exe,['main.tex','--outdir',out,'--keep-logs','--keep-intermediates'],{cwd:path.join(root,`docs/Report ${report}`),encoding:'utf8',maxBuffer:20*1024*1024,windowsHide:true});
 fs.writeFileSync(path.join(root,`outputs/report-completion/report${report}-build.stdout.txt`),result.stdout||'');
 fs.writeFileSync(path.join(root,`outputs/report-completion/report${report}-build.stderr.txt`),result.stderr||'');
 runs.push({report,exitCode:result.status,error:result.error?.message||null,pdfExists:fs.existsSync(path.join(out,'main.pdf'))});
}
const previous=fs.existsSync('outputs/report-completion/build-results.json')?JSON.parse(fs.readFileSync('outputs/report-completion/build-results.json')):[];
fs.writeFileSync('outputs/report-completion/build-results.json',JSON.stringify([...previous.filter(p=>!runs.some(r=>r.report===p.report)),...runs].sort((a,b)=>a.report-b.report),null,2));console.log(JSON.stringify(runs));if(runs.some(r=>r.exitCode!==0))process.exitCode=1;
