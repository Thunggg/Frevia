from pathlib import Path
file = Path(r"D:\Year4\FA26\Capstone_Project\Frevia\docs\Report 3\sections\3.Subsections\3.1.Subsections\3.1.5.Entity_Relationship_Diagram.tex")
t = file.read_text(encoding='utf-8')
t = t.replace("\\begin{center}\n\\begin{tabular}", "\\begin{center}\n\\small\\sloppy\n\\begin{tabular}")
file.write_text(t, encoding='utf-8')
print("done")
PY