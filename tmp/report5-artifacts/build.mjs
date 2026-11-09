import fs from 'node:fs/promises';
import path from 'node:path';
import { FileBlob, SpreadsheetFile, Workbook } from '@oai/artifact-tool';
const root=path.resolve(import.meta.dirname,'../..');
const data=JSON.parse(await fs.readFile(path.join(import.meta.dirname,'system-cases.json'),'utf8'));
const wb=await SpreadsheetFile.importXlsx(await FileBlob.load(path.join(root,'tmp/report5-originals/Report5_Test Report.xlsx')));
const image=await wb.render({sheetName:'User Authentication',range:'A1:N16',scale:1,format:'png'});
await fs.writeFile(path.join(import.meta.dirname,'baseline-system.png'),new Uint8Array(await image.arrayBuffer()));
console.log('Baseline rendered');
if(process.argv.includes('--preview'))process.exit(0);
const names=[];
const fonts={name:'Arial',size:10};
const fill='#CCFFFF';
for(const [module,cases]of Object.entries(data.modules)) {
 const name=('NH '+module).slice(0,31);names.push({name,cases});
 const s=wb.worksheets.add(name);
 s.getRange(`A1:N${cases.length+20}`).format.font=fonts;
 s.getRange(`A1:N${cases.length+20}`).format.wrapText=true;
 s.getRange(`A1:N${cases.length+20}`).format.verticalAlignment='center';
 s.getRange('A:A').format.columnWidth=25;
 s.getRange('B:B').format.columnWidth=48;
 s.getRange('C:C').format.columnWidth=72;
 s.getRange('D:D').format.columnWidth=70;
 s.getRange('E:E').format.columnWidth=58;
 s.getRange('F:N').format.columnWidth=17;
 s.getRange('A2:A8').values=[['Feature'],['Test requirement'],['Number of TCs'],['Testing Round'],['Round 1'],['Round 2'],['Round 3']];
 s.mergeCells('B2:E2');s.getRange('B2').values=[[module]];
 s.mergeCells('B3:E3');s.getRange('B3').values=[[`Nguyen Lu Nhat Huy. API/system test specification for ${[...new Set(cases.map(c=>c.uc))].join(', ')}. Prepared on 09/11/2026. Pending execution on the application. Unit results are recorded separately.`]];
 const sectionCount=cases.reduce((n,c,i)=>n+(i===0||cases[i-1].uc!==c.uc?1:0),0);
 s.mergeCells('B4:E4');s.getRange('B4').formulas=[[`=COUNTA(A12:A${cases.length*2+30})-${sectionCount-1}`]];
 s.getRange('B5:E5').values=[['Passed','Failed','Pending','N/A']];
 for(const [r,col] of [[6,'F'],[7,'I'],[8,'L']])s.getRange(`B${r}:E${r}`).formulas=[[`=COUNTIF(${col}12:${col}${cases.length*2+30},B5)`,`=COUNTIF(${col}12:${col}${cases.length*2+30},C5)`,`=COUNTIF(${col}12:${col}${cases.length*2+30},D5)`,`=COUNTIF(${col}12:${col}${cases.length*2+30},E5)`]];
 s.getRange('A3:E3').format.rowHeight=48;
 s.getRange('A10:N10').values=[['Test Case ID','Test Case Description','Test Case Procedure','Expected Results','Pre-conditions','Round 1','Test date','Tester','Round 2','Test date','Tester','Round 3','Test date','Tester']];
 s.getRange('A10:N10').format={fill:'#76933C',font:{...fonts,bold:true,color:'#FFFFFF'},rowHeight:32,wrapText:true};
 let row=11,last='';
 for(const c of cases) {
  if(c.uc!==last){s.getRange(`A${row}:N${row}`).values=[[c.feature,...Array(13).fill(null)]];s.getRange(`A${row}:N${row}`).format={fill,font:{...fonts,bold:true},rowHeight:28};last=c.uc;row++;}
  s.getRange(`A${row}:N${row}`).values=[[c.id,c.description,c.procedure,c.expected,c.preconditions,'Pending',null,null,'Pending',null,null,'Pending',null,null]];
  s.getRange(`A${row}:N${row}`).format.rowHeight=Math.max(96,Math.min(230,Math.ceil(Math.max(c.procedure.length/95,c.expected.length/90,c.preconditions.length/78))*15));
  s.getRange(`B${row}:E${row}`).format.font={...fonts,color:'#008000',italic:true};
  for(const col of ['F','I','L']){s.getRange(`${col}${row}`).dataValidation={rule:{type:'list',values:['Passed','Failed','Pending','N/A']}};s.getRange(`${col}${row}`).format.fill='#FFF2CC';}
  row++;
 }
 s.freezePanes.freezeRows(10);
 console.log(name,cases.length);
}
// Add to the existing test catalogue and statistics using adjacent conventions.
const catalogue=wb.worksheets.getItem('Test Cases');
const statistics=wb.worksheets.getItem('Test Statistics');
const cover=wb.worksheets.getItem('Cover');cover.getRange('A20:F20').values=[['09/11/2026','1.9','Add Nhat Huy test cases','A',`Add ${Object.values(data.modules).flat().length} Pending system/API cases for 51 use cases across Sprints 1-5. Unit execution is recorded separately.`,'Reports 3-4 and backend source']];cover.getRange('A20:F20').format={font:fonts,wrapText:true,rowHeight:72};
// Existing statistics totals occupy row 34; extend the table below its 23 modules.
const oldLast=33;
statistics.getRange('B34:N39').values=Array.from({length:6},()=>Array(13).fill(null));
let statRow=34,catRow=128;
for(const [index,{name,cases}]of names.entries()) {
 const escaped=name.replaceAll("'","''");
 statistics.getRange(`B${statRow}:H${statRow}`).formulas=[[`=${24+index}`,`='${escaped}'!B2`,`='${escaped}'!B6`,`='${escaped}'!C6`,`='${escaped}'!D6`,`='${escaped}'!E6`,`='${escaped}'!B4`]];
 statistics.getRange(`B${statRow}:H${statRow}`).format={font:fonts,rowHeight:28};
 for(const uc of [...new Set(cases.map(c=>c.uc))]) {
  const c=cases.find(c=>c.uc===uc);
  catalogue.getRange(`B${catRow}:F${catRow}`).values=[[catRow-9,c.feature,name,c.uc+' - '+c.description,c.preconditions]];
  catalogue.getRange(`B${catRow}:F${catRow}`).format={font:fonts,wrapText:true,rowHeight:48};
  catRow++;
 }
 statRow++;
}
statistics.getRange(`C${statRow}`).values=[['Sub total']];
statistics.getRange(`D${statRow}:H${statRow}`).formulas=[['D','E','F','G','H'].map(c=>`=SUM(${c}11:${c}${statRow-1})`)];
statistics.getRange(`B${statRow}:H${statRow}`).format={fill,font:{...fonts,bold:true},rowHeight:28};
statistics.getRange(`C${statRow+2}`).values=[['Test coverage']];statistics.getRange(`E${statRow+2}`).formulas=[[`=(D${statRow}+E${statRow})*100/(H${statRow}-G${statRow})`]];statistics.getRange(`F${statRow+2}`).values=[['%']];
statistics.getRange(`C${statRow+3}`).values=[['Test successful coverage']];statistics.getRange(`E${statRow+3}`).formulas=[[`=D${statRow}*100/(H${statRow}-G${statRow})`]];statistics.getRange(`F${statRow+3}`).values=[['%']];
statistics.getRange('C6').values=[['Original module results are retained. Nhat Huy cases added on 09/11/2026 are Pending; Jest unit results do not establish system-test execution.']];
statistics.getRange('C6:H6').format.rowHeight=45;
wb.recalculate();
console.log((await wb.inspect({kind:'table',range:`'NH Account Profile'!A2:F15`,include:'values,formulas',tableMaxRows:14,tableMaxCols:6,tableMaxCellChars:90})).ndjson);
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#NUM!',options:{useRegex:true,maxResults:10},summary:'Formula error scan'})).ndjson);
for(const name of ['NH Account Profile','NH CV Management','NH Profile Revision Review']) {
 const preview=await wb.render({sheetName:name,range:'A2:H15',scale:1,format:'png'});
 await fs.writeFile(path.join(import.meta.dirname,name.replaceAll(' ','-')+'.png'),new Uint8Array(await preview.arrayBuffer()));
}
await (await SpreadsheetFile.exportXlsx(wb)).save(path.join(root,'docs/Report 5/Report5_Test Report.xlsx'));
console.log('System workbook saved');
