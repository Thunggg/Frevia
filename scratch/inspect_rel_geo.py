import xml.etree.ElementTree as ET

tree = ET.parse('class-diagrams/UC-24_Manage_Milestone_Class_Diagram.drawio')
for d in tree.getroot().findall('.//diagram'):
    if 'UC-26' in d.get('name', ''):
        for cid in ['sub_rel_contract_milestone', 'sub_rel_sub_subFile', 'sub_rel_milestone_sub', 'sub_rel_user_sub']:
            c = d.find(f".//mxCell[@id='{cid}']")
            if c is not None:
                print('---', cid, '---')
                print('attribs:', c.attrib)
                print('style:', c.get('style'))
                geo = c.find('mxGeometry')
                if geo is not None:
                    print('geo attribs:', geo.attrib)
                    for child in geo:
                        print('  child:', child.tag, child.attrib)
