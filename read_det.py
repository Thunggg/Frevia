with open(r'D:\Documents\Book\Do_an\Frevia\Frevia\docs\Report 4\sections\3.Detailed_Design.tex', encoding='utf-8') as f:
    for i, l in enumerate(f):
        if i < 80:
            print(l.rstrip())
