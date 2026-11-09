import fs from 'node:fs';
const input='tmp/report5-artifacts/build.mjs';
let source=fs.readFileSync(input,'utf8');
source=source.replace("import { FileBlob, SpreadsheetFile, Workbook } from '@oai/artifact-tool';", "import { createRequire } from 'node:module';\nimport { pathToFileURL } from 'node:url';");
source=source.replace("const root=path.resolve(import.meta.dirname,'../..');", "const root=path.resolve(import.meta.dirname,'../../..');\nconst workDir=path.join(root,'tmp/report5-artifacts');\nconst runtimeRequire=createRequire(path.join(workDir,'package.json'));\nconst {FileBlob,SpreadsheetFile,Workbook}=await import(pathToFileURL(runtimeRequire.resolve('@oai/artifact-tool')));");
source=source.replaceAll('path.join(import.meta.dirname,','path.join(workDir,');
fs.writeFileSync('docs/Report 5/tools/build-nhuy-system-report.mjs',source);
