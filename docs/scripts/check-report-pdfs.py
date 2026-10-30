from pathlib import Path
from pypdf import PdfReader
import json,subprocess
root=Path(__file__).resolve().parents[2]
out=root/'outputs/report-completion'
catalog=json.loads((out/'catalog.json').read_text())
poppler=Path('C:/Users/NHAT HUY/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/poppler/Library/bin/pdftoppm.exe')
results={}
for report in [3,4]:
    pdf=out/f'report{report}-pdf/main.pdf'
    reader=PdfReader(pdf)
    pages=[p.extract_text() or '' for p in reader.pages]
    (out/f'report{report}-page-text.json').write_text(json.dumps(pages,ensure_ascii=True))
    hits={c['id']:[i+1 for i,t in enumerate(pages) if c['id'] in t] for c in catalog}
    missing=[uc for uc,p in hits.items() if not p]
    assert not missing,(report,missing)
    selected=[]
    def norm(t):
        return ''.join(t.replace('\ufb01','fi').replace('\ufb02','fl').split())
    for term in (['UC-07.02','UC-47.03'] if report==3 else ['UC-18.01','ProfileController Class','Profile, Account and Review Persistence']):
        candidates=[i+1 for i,t in enumerate(pages) if norm(term) in norm(t) and i>20 and (report!=3 or 'Created By' in t) and (report!=4 or term!='UC-18.01' or 'Part 1/' in t)]
        if not candidates:
            short=term.split(' -- ')[0]
            candidates=[i+1 for i,t in enumerate(pages) if short in t and i>20]
        if candidates:selected.append(candidates[0])
    selected=list(dict.fromkeys(selected))
    for page in selected:
        dest=out/f'report{report}-page{page}'
        subprocess.run([str(poppler),'-f',str(page),'-l',str(page),'-singlefile','-r','95','-png',str(pdf),str(dest)],check=True,capture_output=True)
    results[report]={'pages':len(pages),'ucIdsFound':len(hits),'missing':missing,'previewPages':selected}
(out/'pdf-validation.json').write_text(json.dumps(results,indent=2))
print(json.dumps(results,indent=2))
