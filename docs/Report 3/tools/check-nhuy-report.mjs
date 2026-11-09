import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const report=path.resolve(import.meta.dirname,'..');
const load=p=>fs.readFileSync(path.join(report,p),'utf8');
const coverage=JSON.parse(load('nhuy-coverage.json'));
assert.equal(coverage.count,51);
assert.equal(new Set(coverage.functions.map(f=>f.id)).size,51);
const catalog=fs.readFileSync(path.resolve(report,'../UC_diagram/Frevia_UC.csv'),'utf8');
const inputs=[];
function dependencies(file,seen=new Set()){
  const resolved=path.join(report,file);
  if(seen.has(resolved))return;
  assert.ok(fs.existsSync(resolved),`Missing input: ${file}`);
  seen.add(resolved);
  const text=fs.readFileSync(resolved,'utf8').replace(/(?<!\\)%.*$/gm,'');
  for(const match of text.matchAll(/\\input\{([^}]+)\}/g)){
    const relative=match[1];
    const selected=fs.existsSync(path.join(report,relative+'.tex'))?relative+'.tex':relative;
    inputs.push(selected); dependencies(selected,seen);
  }
}
dependencies('main.tex'); dependencies('nhuy-report3.tex');
const specBase='sections/2.Subsections/2.2.Subsections/2.2.3.Subsections';
const source=[...['3.Profile','4.Skills','5.Portfolio'].map(n=>`${specBase}/sprint1/2.2.3.${n}_Management.tex`),...[2,3,4,5].map(n=>`${specBase}/sprint${n}/nhuy.tex`)];
const useCases=source.map(load).join('\n');
const functional=[1,2,3,4,5].map(n=>load(`sections/3.Subsections/sprint${n}/nhuy.tex`)).join('\n');
const overview=load('sections/2.Subsections/2.2.Subsections/2.2.2.Use_Case_Description.tex');
const headings=[...useCases.matchAll(/\\subparagraph\{(UC-\d+\.\d+)/g)].map(m=>m[1]);
assert.equal(headings.length,51);
const noCatalog=[];
for(const f of coverage.functions){
 assert.equal(headings.filter(id=>id===f.id).length,1,`Duplicate or missing specification: ${f.id}`);
 assert.ok(functional.includes(`(${f.id})`),`Missing functional description: ${f.id}`);
 assert.equal(overview.split('\n').filter(line=>line.startsWith(f.id+' &')).length,1,`Overview entry: ${f.id}`);
 if(!catalog.includes(f.id+','))noCatalog.push(f.id);
}
assert.equal(noCatalog.length,0,`IDs absent from catalog: ${noCatalog.join(', ')}`);
for(const label of ['Function Trigger','Function Description','Screen Layout (Mock-up Description)','Function Details','Acceptance Criteria']){
 assert.equal(functional.split(label).length-1,51,`Incomplete ${label}`);
}
assert.ok(!/<<<<<<<|>>>>>>>/.test(useCases+functional));
const screenshotFile=path.join(report,'nhuy-screenshots.json');
if(fs.existsSync(screenshotFile)){
  const captures=JSON.parse(fs.readFileSync(screenshotFile,'utf8')).functions;
  for(const [id,capture] of Object.entries(captures)){
    assert.ok(coverage.functions.some(f=>f.id===id),`Unknown screenshot UC: ${id}`);
    assert.ok(fs.existsSync(path.join(report,capture.image)),`Missing screenshot file: ${capture.image}`);
    assert.ok(functional.includes(capture.image),`Screenshot not included: ${id}`);
  }
  console.log(JSON.stringify({screenshotFunctions:Object.keys(captures).length,remainingFunctions:51-Object.keys(captures).length}));
}
console.log(JSON.stringify({useCases:51,uniqueSpecifications:headings.length,functionalDescriptions:51,allCatalogIdsPresent:true,inputFilesChecked:inputs.length,perSprint:coverage.sprints},null,2));
