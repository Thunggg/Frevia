from pathlib import Path
import re
file = Path(r"D:\Year4\FA26\Capstone_Project\Frevia\docs\Report 3\sections\3.Subsections\3.1.Subsections\3.1.5.Entity_Relationship_Diagram.tex")
t = file.read_text(encoding='utf-8')
# Change small ERD subsubsections to paragraphs, except the overall "Entity Relationship Diagram"
t = re.sub(r"\\subsubsection\{(?!Entity Relationship Diagram)([^}]+)\}", r"\\paragraph{\1}", t)
file.write_text(t, encoding='utf-8')
print("done")
PY