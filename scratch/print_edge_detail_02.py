import xml.etree.ElementTree as ET

tree = ET.parse('sequence-diagrams-remake/ntin/UC-13.02-update-contract.drawio')
root = tree.getroot()
for cid in ['m1', 'val', 'rt', 'inv1', 'c1']:
    c = root.find(f".//mxCell[@id='{cid}']")
    if c is not None:
        geo = c.find('mxGeometry')
        print(f"--- {cid} ---")
        print("value:", c.get('value'))
        print("style:", c.get('style'))
        if geo is not None:
            print("geo attribs:", geo.attrib)
            pts = geo.find('Array')
            if pts is not None:
                print("pts:", [(p.get('x'), p.get('y')) for p in pts.findall('mxPoint')])
