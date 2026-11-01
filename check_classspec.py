with open(r'D:\Documents\Book\Do_an\Frevia\Frevia\docs\Report 4\sections\4.Class_Specification.tex', encoding='utf-8') as f:
    content = f.read()
import re
ms = re.findall(r'\\(section|subsection|subsubsection)\{([^\}]+)\}', content)
for m in ms[:80]:
    print(m[0], '::', m[1])
