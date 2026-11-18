import fs from 'node:fs';
const folder='docs/Report 5';
const previous=JSON.parse(fs.readFileSync('tmp/report5-before-renumber/catalog.json','utf8'));
const current=JSON.parse(fs.readFileSync(`${folder}/tools/nhuy-test-catalog.json`,'utf8'));
const ucList=JSON.parse(fs.readFileSync('docs/Report 3/nhuy-coverage.json','utf8')).functions;
const oldByMethod=new Map(previous.groups.map(g=>[g.key+'.'+g.method,g]));
for(const g of current.groups){
 const old=oldByMethod.get(g.key+'.'+g.method);
 if(JSON.stringify(old.cases)!==JSON.stringify(g.cases))throw Error('Test content changed: '+g.method);
}
const primary=new Map(current.groups.slice(0,50).map(g=>[g.uc[0],g]));
primary.set('UC-07.05',current.groups.find(g=>g.method==='uploadCv'));
let out='# Unit Test Index — Nguyễn Lữ Nhật Huy\n\nĐánh lại số theo thứ tự UC đã thống nhất. Giữ nguyên UF-01–UF-121 của các phần khác. Mã chính của Nhật Huy là UF-122–UF-171; các hàm hỗ trợ nằm ở UF-172–UF-178.\n\n| UC | Chức năng | Matrix | Method |\n| --- | --- | --- | --- |\n';
for(const u of ucList){const g=primary.get(u.id);if(!g)throw Error('Unmapped UC '+u.id);out+=`| ${u.id} | ${u.name} | ${g.id} | \`${g.method}\` |\n`;}
out+='\nUpload CV và Replace CV cùng dùng `uploadCv`, nên UC-07.03 và UC-07.05 dùng chung một matrix.\n\nCác hàm hỗ trợ có matrix riêng theo quy tắc mỗi method một matrix:\n\n| Matrix | Method | UC liên quan |\n| --- | --- | --- |\n';
for(const g of current.groups.slice(50))out+=`| ${g.id} | \`${g.method}\` | ${g.uc.join(', ')} |\n`;
fs.writeFileSync(`${folder}/NHUY-UNIT-TEST-INDEX.md`,out);
console.log(out);
