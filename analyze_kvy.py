with open(r'D:\Documents\Book\Do_an\Frevia\Frevia\docs\Report 4\sections\kvy\2\sprint1.tex', encoding='utf-8') as f:
    content = f.read()
import re
ms = re.findall(r'\\(subsection|subsubsection|paragraph)\{([^\}]+)\}', content)
for m in ms[:60]:
    print(m[0], '::', m[1])
