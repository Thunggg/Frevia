import xml.etree.ElementTree as ET

tree = ET.parse('sequence-diagrams-remake/ntin/UC-13.02-update-contract.drawio')
root = tree.getroot()
for cid in ['m1', 'rt', 'c1', 'c2', 'c3']:
    c = root.find(f".//mxCell[@id='{cid}']")
    geo = c.find('mxGeometry')
    print(f"=== {cid} ===")
    print("geo attribs:", geo.attrib)
    for child in geo:
        print("  child:", child.tag, child.attrib)
