import re, os
base = r'D:\Documents\Book\Do_an\Frevia\Frevia\docs\Report 4\sections'
for root, dirs, files in os.walk(base):
    for f in files:
        if f.endswith('.tex'):
            path = os.path.join(root,f)
            if any(x in path for x in ['\\kvy\\','\\nhuy\\','\\ntin\\','\\ptai\\','\\tthuan\\']):
                with open(path,encoding='utf-8') as fh:
                    content = fh.read()
                orig = content
                content2 = re.sub(r'^\\subsubsection\{(Class Diagram|UC-[^\}]+)\}', r'\\paragraph{\1}', content, flags=re.M)
                if content2 != orig:
                    with open(path,'w',encoding='utf-8') as fh:
                        fh.write(content2)
print('done')
