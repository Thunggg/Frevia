import os
base = r'D:\Documents\Book\Do_an\Frevia\Frevia\docs\Report 4\sections'
for root,dirs,files in os.walk(base):
    for f in files:
        if f.endswith('.tex'):
            path = os.path.join(root,f)
            if path != base and 'sections' in path:
                print(path)
