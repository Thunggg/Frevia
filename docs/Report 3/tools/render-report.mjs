import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const [pdfPath,toolsDir,outDir,...requested]=process.argv.slice(2);
if(!pdfPath||!toolsDir||!outDir)throw new Error('Usage: node render-report.mjs PDF TOOLS_DIR OUTPUT_DIR [page ...]');
const require=createRequire(path.join(path.resolve(toolsDir),'package.json'));
const canvasModule=require('@napi-rs/canvas');
for(const key of ['DOMMatrix','ImageData','Path2D'])globalThis[key]=canvasModule[key];
const pdfjs=await import(pathToFileURL(path.join(path.resolve(toolsDir),'node_modules/pdfjs-dist/legacy/build/pdf.mjs')));
const loadingTask=pdfjs.getDocument({data:new Uint8Array(fs.readFileSync(pdfPath)),useSystemFonts:true});
const document=await loadingTask.promise;
fs.mkdirSync(outDir,{recursive:true});
const records=[];
for(let number=1;number<=document.numPages;number++){
 const page=await document.getPage(number);
 const text=await page.getTextContent();
 const viewport=page.getViewport({scale:1});
 const outside=text.items.filter(item=>item.str?.trim()&&(item.transform[4]<-2||item.transform[4]+item.width>viewport.width+2));
 records.push({page:number,textItems:text.items.length,outsidePage:outside.map(item=>item.str),functionHeading:text.items.some(item=>item.str?.includes('Function:'))});
}
const selected=requested.length?requested.map(Number):[1,2,3,...records.filter(r=>r.functionHeading).filter((_,i)=>i%10===0).map(r=>r.page),document.numPages];
for(const number of new Set(selected)){
 if(number<1||number>document.numPages)continue;
 const page=await document.getPage(number);
 const viewport=page.getViewport({scale:1.5});
 const canvas=canvasModule.createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));
 await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
 fs.writeFileSync(path.join(outDir,`page-${number}.png`),canvas.toBuffer('image/png'));
}
const findings={file:path.basename(pdfPath),pages:document.numPages,renderedPages:[...new Set(selected)],pagesWithOutsideText:records.filter(r=>r.outsidePage.length),blankPages:records.filter(r=>r.textItems<2).map(r=>r.page)};
fs.writeFileSync(path.join(outDir,'layout-check.json'),JSON.stringify(findings,null,2));
console.log(JSON.stringify({file:findings.file,pages:findings.pages,renderedPages:findings.renderedPages,pagesWithOutsideText:findings.pagesWithOutsideText.length,blankPages:findings.blankPages}));
await loadingTask.destroy();
