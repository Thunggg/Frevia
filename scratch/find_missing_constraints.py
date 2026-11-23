import xml.etree.ElementTree as ET
import glob

for f in glob.glob('class-diagrams/*.drawio'):
    tree = ET.parse(f)
    root = tree.getroot()
    diagrams = root.findall('.//diagram')
    if not diagrams:
        diagrams = [root]
    for d in diagrams:
        dname = d.get('name', 'Page')
        cells = {c.get('id'): c for c in d.findall('.//mxCell')}
        for cid, c in cells.items():
            if c.get('edge') == '1':
                src = c.get('source')
                tgt = c.get('target')
                style = c.get('style', '')
                has_entryX = 'entryX=' in style
                has_exitX = 'exitX=' in style
                if not has_entryX or not has_exitX:
                    print(f"[{f}] Tab '{dname}': Edge '{cid}' ({src} -> {tgt}) MISSING: entryX={has_entryX}, exitX={has_exitX}")
