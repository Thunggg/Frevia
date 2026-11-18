from pathlib import Path
import re
file = Path(r"D:\Year4\FA26\Capstone_Project\Frevia\docs\Report 3\sections\3.Subsections\3.1.Subsections\3.1.5.Entity_Relationship_Diagram.tex")
t = file.read_text(encoding='utf-8')
def repl(m):
    return r"\begin{tabularx}{\linewidth}{|L{2.5cm}|Y|}"
t = re.sub(r"\\begin\{tabular\}\{\|L\{[\d.]+cm\}\|L\{[\d.]+cm\}\|\}", repl, t)
t = t.replace("\\begin{tabular}", "\\begin{tabularx}{\\linewidth}{|L{2.5cm}|Y|}")
t = t.replace("\\end{tabular}", "\\end{tabularx}")
file.write_text(t, encoding='utf-8')
print("done")
PY