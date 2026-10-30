import fs from 'node:fs/promises';
import {Workbook,SpreadsheetFile} from '@oai/artifact-tool';
const catalog=JSON.parse(await fs.readFile('outputs/report-completion/catalog.json','utf8'));
const evidence=JSON.parse(await fs.readFile('outputs/report-completion/jest-results.json','utf8'));
const out='outputs/report-completion';
const scenarios=c=>[
  {name:'Valid operation',condition:'Valid actor, records and input; choose the normal success branch.',expected:`Service returns ${c.serviceResult}. UI: ${c.result}.`,kind:'N'},
  ...c.breaks.map(b=>({name:b.condition,condition:`Prepare fixtures satisfying ${b.condition}; keep earlier guards valid.`,expected:`${b.error}. Do not execute later success-path writes.`,kind:'A'})),
  ...c.branches.filter(b=>/\[|< 20|>= 20|P2002|count|empty|configured|local|remote|strength/i.test(b)).map(b=>({name:'Alternative: '+b,condition:b,expected:`Follow this implemented branch: ${b}. Return its branch-specific state; preserve unrelated records.`,kind:/20|size|count|MB/.test(b)?'B':'N'}))
];
function styleHeader(sh,range,color='#718E38') {
 const r=sh.getRange(range);r.format.fill=color;r.format.font={bold:true,color:'#FFFFFF'};r.format.wrapText=true;r.format.rowHeight=32;
}
const system=Workbook.create();
const idx=system.worksheets.add('Nhuy Coverage');
idx.getRange('A1:F3').values=[['FREVIA - NHUY TEST COVERAGE',null,null,null,null,null],['Scope','51 UCs; 5 sprints','Execution','Designed tests remain Untested',null,null],['Sprint','Use cases','Planned test cases','Passed','Failed','Untested']];
styleHeader(idx,'A3:F3');idx.getRange('A1:F1').format.font={bold:true,size:16};
idx.getRange('A1:F9').format.columnWidth=25;
let systemTotal=0;
for(let sprint=1;sprint<=5;sprint++) {
 const sh=system.worksheets.add(`Nhuy Sprint ${sprint}`);
 const cases=catalog.filter(c=>c.sprint===sprint);const rows=[];
 const headers=['ID','Test Case Description','Test Case Procedure','Expected Results','Actual Results','Inter-test case Dependence','Result','Test date','Tester','Note'];
 sh.getRange('A1:J4').values=[['Feature',`Nhuy - Sprint ${sprint}`,null,null,null,null,null,null,null,null],['Test requirement',cases.map(c=>c.id).join(', '),null,null,null,null,null,null,null,null],['Reference Document',`Report 3/4 nhuy sprint ${sprint}; source controllers/services/repositories`,null,null,null,null,null,null,null,null],['Execution note','Planned system tests. No live browser/API execution claimed.',null,null,null,null,null,null,null,null]];
 sh.getRange('B1:J4').merge(true);sh.getRange('A1:J4').format.rowHeight=36;sh.getRange('A1:J4').format.wrapText=true;
 sh.getRange('A6:J6').values=[headers];styleHeader(sh,'A6:J6');
 for(const c of cases) {
  for(const [i,s] of scenarios(c).entries()) rows.push([`${c.id}-TC${String(i+1).padStart(2,'0')}`,`${c.name}: ${s.name}`,`1. ${s.condition}\n2. ${c.trigger}.\n3. Send ${c.endpoint} with prepared input.\n4. Verify response, UI and persistence.`,s.expected,null,c.auth?`Active authenticated ${c.actor}; endpoint permission; isolated fixtures. No dependency on test execution order.`:'Public endpoint; isolated existing resource fixtures.', 'Untested',null,null,`Sprint ${sprint}; ${s.kind}; source-backed expected behavior.`]);
 }
 sh.getRange(`A7:J${rows.length+6}`).values=rows;
 sh.getRange(`A1:J${rows.length+6}`).format.font={name:'Arial',size:10};
 sh.getRange(`A7:J${rows.length+6}`).format.wrapText=true;
 sh.getRange(`A7:J${rows.length+6}`).format.verticalAlignment='top';
 sh.getRange(`A7:J${rows.length+6}`).format.rowHeight=125;
 for(const [col,width] of Object.entries({A:23,B:45,C:70,D:65,E:26,F:45,G:14,H:16,I:18,J:30}))sh.getRange(`${col}1:${col}${rows.length+6}`).format.columnWidth=width;
 sh.getRange(`A7:J${rows.length+6}`).format.borders={preset:'all',style:'thin',color:'#B6C79C'};
 sh.getRange(`G7:G${rows.length+6}`).dataValidation={rule:{type:'list',values:['Pass','Fail','Untested','N/A']}};
 idx.getRange(`A${sprint+3}:F${sprint+3}`).values=[[sprint,cases.length,rows.length,null,null,null]];
 for(const [col,stat]of [['D','Pass'],['E','Fail'],['F','Untested']])idx.getRange(`${col}${sprint+3}`).formulas=[[`=COUNTIFS('Nhuy Sprint ${sprint}'!G7:G${rows.length+6},"${stat}")`]];
 systemTotal+=rows.length;
}
idx.getRange('A10:F12').values=[['Sources','Expected results derived from code and approved sprint/UC mapping.',null,null,null,null],['Status','Actual Results/Test date/Tester intentionally blank until executed.',null,null,null,null],['Existing template','Original sheets retained; these sheets supplement this author only.',null,null,null,null]];
idx.getRange('A10:F12').format.wrapText=true;idx.getRange('A10:F12').format.rowHeight=45;
await system.recalculate();
await (await SpreadsheetFile.exportXlsx(system)).save(`${out}/report5-system-additions.xlsx`);
const sysImage=await system.render({sheetName:'Nhuy Sprint 1',range:'A6:D9',scale:0.75,format:'png'});
await fs.writeFile(`${out}/system-preview.png`,new Uint8Array(await sysImage.arrayBuffer()));
const unit=Workbook.create();const summary=unit.worksheets.add('Nhuy Unit Coverage');
summary.getRange('A1:F3').values=[['FREVIA - NHUY UNIT TEST PLAN',null,null,null,null,null],['Scope','51 UC decision matrices; execution evidence listed separately',null,null,null,null],['UC','Function Name','Sprint','Designed cases','Status','Test sheet']];styleHeader(summary,'A3:F3','#C36D24');
let summaryRow=4;
for(const c of catalog) {
 const ss=scenarios(c);const name=`H${c.id.slice(3)}`;const sh=unit.worksheets.add(name);const n=ss.length;const last=String.fromCharCode(70+n-1);
 sh.getRange('A1:F6').values=[['Function Code',c.id,null,'Function Name',c.name,null],['Created By','Nguyen Lu Nhat Huy',null,'Executed By',null,null],['Test requirement',c.endpoint,null,null,null,null],['Passed','Failed','Untested','Normal','Abnormal','Boundary'],[0,0,n,ss.filter(s=>s.kind==='N').length,ss.filter(s=>s.kind==='A').length,ss.filter(s=>s.kind==='B').length],['Evidence','Unit design is not an execution result. See Nhuy Executed Tests for the actual Jest run.',null,null,null,null]];
 styleHeader(sh,'A4:F4','#C36D24');
 const labels=['Test case ID','Type (N/A/B)','Condition / input','Mock setup','Expected assertion','Execution status','Actual result','Source / traceability'];
 for(let i=0;i<labels.length;i++)sh.getRange(`A${8+i}:E${8+i}`).values=[[labels[i],null,null,null,null]];
 for(const [i,s]of ss.entries()) {
  const col=String.fromCharCode(70+i);
  sh.getRange(`${col}8:${col}15`).values=[[`${c.id}-UT${String(i+1).padStart(2,'0')}`],[s.kind],[s.condition],[`Mock repository/storage/hash/token dependencies for this condition. Invoke the service; keep earlier guards valid. Assert returned value or exception and dependency calls.`],[i===0?`Resolve ${c.serviceResult}; verify the expected repository calls and side effects. Do not assert browser rendering in this unit test.`:s.expected],['Untested'],[null],[`${c.id}; ${c.domain}Service; Report 4 Sprint ${c.sprint}`]];
 }
 sh.getRange(`A8:${last}8`).format.fill='#F6DFC2';sh.getRange(`A8:${last}8`).format.font={bold:true};
 sh.getRange(`A1:${last}15`).format.font={name:'Arial',size:10};sh.getRange(`A1:${last}15`).format.wrapText=true;
 sh.getRange('A8:E15').merge(true);
 sh.getRange(`A8:${last}15`).format.verticalAlignment='top';
 sh.getRange(`A1:E15`).format.columnWidth=13;sh.getRange(`F1:${last}15`).format.columnWidth=45;
 sh.getRange(`A1:${last}2`).format.rowHeight=85;
 sh.getRange(`A8:${last}15`).format.borders={preset:'all',style:'thin',color:'#D5B38E'};
 for(const [row,h]of [[3,55],[6,50],[8,35],[9,25],[10,110],[11,115],[12,150],[13,30],[14,45],[15,50]])sh.getRange(`A${row}:${last}${row}`).format.rowHeight=h;
 summary.getRange(`A${summaryRow}:F${summaryRow}`).values=[[c.id,c.name,c.sprint,n,'Untested',name]];summaryRow++;
}
summary.getRange(`A1:F${summaryRow}`).format.columnWidth=26;summary.getRange(`B1:B${summaryRow}`).format.columnWidth=48;summary.getRange(`A1:F${summaryRow}`).format.wrapText=true;
const ev=unit.worksheets.add('Nhuy Executed Tests');
ev.getRange('A1:F4').values=[['Execution evidence','Jest service/repository tests; not browser/system tests',null,null,null,null],['Date','2026-10-30','Suites passed',evidence.numPassedTestSuites,'Tests passed',evidence.numPassedTests],['Command','node node_modules/jest/bin/jest.js --runInBand --json --testPathPatterns=account-profile|portfolio|notification|review|profile-revision|expert-profile|auth.switch-role|auth.join-role',null,null,null,null],['Source test file','Describe block','Test name','Status','Duration (ms)','Failure details']];
styleHeader(ev,'A4:F4','#C36D24');
const evidenceRows=evidence.testResults.flatMap(s=>s.assertionResults.map(t=>[s.name.replaceAll('\\','/').split('/apps/api/').at(-1),t.ancestorTitles.join(' > '),t.title,t.status,t.duration,t.failureMessages.join('\n')]));
ev.getRange(`A5:F${evidenceRows.length+4}`).values=evidenceRows;
ev.getRange(`A1:F${evidenceRows.length+4}`).format.columnWidth=38;ev.getRange(`A1:F${evidenceRows.length+4}`).format.wrapText=true;ev.getRange(`A5:F${evidenceRows.length+4}`).format.rowHeight=65;
await unit.recalculate();
await (await SpreadsheetFile.exportXlsx(unit)).save(`${out}/report5-unit-additions.xlsx`);
const unitImage=await unit.render({sheetName:'H07.01',range:'A8:H13',scale:0.8,format:'png'});
await fs.writeFile(`${out}/unit-preview.png`,new Uint8Array(await unitImage.arrayBuffer()));
console.log(JSON.stringify({ucs:catalog.length,systemCases:systemTotal,unitCases:catalog.reduce((s,c)=>s+scenarios(c).length,0),executed:evidenceRows.length}));
