import xml.etree.ElementTree as ET
import os

class UnifiedDiagramBuilder:
    def __init__(self, xml_source_path):
        self.xml_source_path = xml_source_path
        self.tree = ET.parse(xml_source_path)
        self.root = self.tree.getroot()
        self.cells = self.root.findall('.//mxCell')
        
        self.nodes = {}
        for c in self.cells:
            if c.get('vertex') == '1' and 'swimlane' in c.get('style', ''):
                geo = c.find('mxGeometry')
                self.nodes[c.get('id')] = {
                    'cell': c,
                    'w': float(geo.get('width', 300)),
                    'h': float(geo.get('height', 200)),
                    'x': 0.0,
                    'y': 0.0,
                    'col': 0,
                    'stack_idx': 0,
                }
        
        self.edges = []
        for c in self.cells:
            if c.get('edge') == '1':
                self.edges.append({
                    'id': c.get('id'),
                    'src': c.get('source'),
                    'tgt': c.get('target'),
                    'val': c.get('value', ''),
                    'dashed': 'dashed=1' in c.get('style', ''),
                })

    def layout(self, columns, top_y=160, stack_gap=55, col_gap=160, start_x=40):
        self.columns = columns
        curr_x = start_x
        self.col_info = []

        for ci, col in enumerate(columns):
            if not col:
                continue
            col_w = max(self.nodes[nid]['w'] for nid in col)
            curr_y = top_y
            for si, nid in enumerate(col):
                node = self.nodes[nid]
                node['x'] = curr_x
                node['y'] = curr_y
                node['col'] = ci
                node['stack_idx'] = si
                curr_y += node['h'] + stack_gap
            self.col_info.append({
                'col_idx': ci,
                'x': curr_x,
                'w': col_w,
                'right': curr_x + col_w,
                'nodes': col
            })
            curr_x += col_w + col_gap

    def route_all(self):
        classified = []
        express_count = 0
        bypass_count = 0

        # Filter out redundant reverse relations
        filtered_edges = []
        for e in self.edges:
            if e['id'] in ('sub_rel_contract_milestone',):
                continue
            filtered_edges.append(e)
        self.edges = filtered_edges

        # Group pins per node per face to prevent any two edges on the same face from sharing Y
        face_pins = {} # (nid, face) -> list of (eid, 'in' or 'out')

        for e in self.edges:
            sid = e['src']
            tid = e['tgt']
            if sid not in self.nodes or tid not in self.nodes:
                continue
            sn = self.nodes[sid]
            tn = self.nodes[tid]
            scol = sn['col']
            tcol = tn['col']

            if scol == 1 and tcol == 3:
                etype = 'TOP_EXPRESS'
                sface = 'top' if sn['stack_idx'] == 0 else 'right'
                tface = 'top' if tn['stack_idx'] == 0 else 'left'
                express_idx = express_count
                express_count += 1
            elif scol == tcol:
                col_nodes = self.col_info[scol]['nodes']
                s_idx = col_nodes.index(sid)
                t_idx = col_nodes.index(tid)
                if abs(s_idx - t_idx) == 1:
                    etype = 'SAME_COL_ADJ'
                    sface = 'bottom' if t_idx > s_idx else 'top'
                    tface = 'top' if t_idx > s_idx else 'bottom'
                    express_idx = -1
                else:
                    etype = 'SAME_COL_BYPASS'
                    sface = 'left'
                    tface = 'left'
                    express_idx = bypass_count
                    bypass_count += 1
            elif tcol > scol:
                etype = 'FORWARD'
                sface = 'right'
                tface = 'left'
                express_idx = -1
            else:
                etype = 'BACKWARD'
                sface = 'left'
                tface = 'right'
                express_idx = -1

            classified.append({
                'data': e,
                'etype': etype,
                'sface': sface,
                'tface': tface,
                'sn': sn,
                'tn': tn,
                'scol': scol,
                'tcol': tcol,
                'express_idx': express_idx,
            })
            face_pins.setdefault((sid, sface), []).append((e['id'], 'out'))
            face_pins.setdefault((tid, tface), []).append((e['id'], 'in'))

        # Sort all pins on each face by the other end's Y coordinate
        pin_fracs = {} # (eid, nid) -> frac
        for (nid, face), pin_list in face_pins.items():
            if face in ('right', 'left'):
                def get_other_y(item):
                    eid, direction = item
                    ed = [x for x in self.edges if x['id'] == eid][0]
                    other_id = ed['tgt'] if direction == 'out' else ed['src']
                    return self.nodes[other_id]['y']
                pin_list.sort(key=get_other_y)
                n = len(pin_list)
                for idx, (eid, _) in enumerate(pin_list):
                    frac = 0.5 if n == 1 else 0.16 + 0.68 * idx / (n - 1)
                    pin_fracs[(eid, nid)] = round(frac, 4)

        # Build gap tracks
        gap_edges = {}
        for ce in classified:
            if ce['etype'] == 'FORWARD':
                gap_key = (ce['scol'], ce['scol'] + 1)
                gap_edges.setdefault(gap_key, []).append((ce['data']['id'], ce['sn']['y'], ce['tn']['y']))
            elif ce['etype'] == 'BACKWARD':
                gap_key = (ce['tcol'], ce['tcol'] + 1)
                gap_edges.setdefault(gap_key, []).append((ce['data']['id'], ce['sn']['y'], ce['tn']['y']))
            elif ce['etype'] == 'SAME_COL_BYPASS':
                gap_key = (ce['scol'] - 1, ce['scol'])
                gap_edges.setdefault(gap_key, []).append((ce['data']['id'], ce['sn']['y'], ce['tn']['y']))
            elif ce['etype'] == 'TOP_EXPRESS' and ce['sface'] == 'right':
                # Express edge uses Gap 1-2 and Gap 2-3
                gap_edges.setdefault((1, 2), []).append((ce['data']['id'] + '_up', ce['sn']['y'], 0))
                gap_edges.setdefault((2, 3), []).append((ce['data']['id'] + '_down', 0, ce['tn']['y']))

        edge_tracks = {}
        for (c1, c2), track_items in gap_edges.items():
            col1 = self.col_info[c1]
            col2 = self.col_info[c2]
            gap_left = col1['right'] + 22
            gap_right = col2['x'] - 22
            k = len(track_items)
            track_items.sort(key=lambda it: (it[1] + it[2]) / 2.0)
            for i, it in enumerate(track_items):
                if k == 1:
                    track_x = (gap_left + gap_right) / 2.0
                else:
                    track_x = gap_left + (i + 0.5) * (gap_right - gap_left) / k
                edge_tracks[it[0]] = track_x

        rendered = []
        for ce in classified:
            e = ce['data']
            eid = e['id']
            sid = e['src']
            tid = e['tgt']
            sn = ce['sn']
            tn = ce['tn']
            sface = ce['sface']
            tface = ce['tface']
            etype = ce['etype']

            if sface in ('right', 'left'):
                exitX = 1.0 if sface == 'right' else 0.0
                exitY = pin_fracs.get((eid, sid), 0.5)
            elif sface == 'top':
                exitX = 0.5
                exitY = 0.0
            else:
                exitX = 0.5
                exitY = 1.0

            if tface in ('left', 'right'):
                entryX = 0.0 if tface == 'left' else 1.0
                entryY = pin_fracs.get((eid, tid), 0.5)
            elif tface == 'top':
                entryX = 0.5
                entryY = 0.0
            else:
                entryX = 0.5
                entryY = 1.0

            pts = []
            if etype == 'TOP_EXPRESS':
                lane_y = 90 - 45 * ce['express_idx']
                if sface == 'top' and tface == 'top':
                    p1_x = sn['x'] + sn['w'] * exitX
                    p2_x = tn['x'] + tn['w'] * entryX
                    pts = [(round(p1_x), round(lane_y)), (round(p2_x), round(lane_y))]
                else:
                    gap12_x = edge_tracks.get(eid + '_up', self.col_info[1]['right'] + 40)
                    gap23_x = edge_tracks.get(eid + '_down', self.col_info[2]['right'] + 40)
                    p_start_y = sn['y'] + sn['h'] * exitY
                    p_end_y = tn['y'] + tn['h'] * entryY
                    pts = [
                        (round(gap12_x), round(p_start_y)),
                        (round(gap12_x), round(lane_y)),
                        (round(gap23_x), round(lane_y)),
                        (round(gap23_x), round(p_end_y)),
                    ]
            elif etype in ('FORWARD', 'BACKWARD', 'SAME_COL_BYPASS'):
                track_x = edge_tracks.get(eid, (sn['x'] + tn['x']) / 2.0)
                p1_y = sn['y'] + sn['h'] * exitY
                p2_y = tn['y'] + tn['h'] * entryY
                pts = [(round(track_x), round(p1_y)), (round(track_x), round(p2_y))]
            elif etype == 'SAME_COL_ADJ':
                pts = []

            style = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;"
            style += "startArrow=none;endArrow=open;endSize=12;fontSize=13;"
            if e['val']:
                style += "labelBackgroundColor=#ffffff;"
            else:
                style += "labelBackgroundColor=none;"
            if e['dashed']:
                style += "dashed=1;"
            style += f"exitX={exitX};exitY={exitY};exitDx=0;exitDy=0;"
            style += f"entryX={entryX};entryY={entryY};entryDx=0;entryDy=0;"

            rendered.append({
                'id': eid,
                'source': sid,
                'target': tid,
                'value': e['val'],
                'style': style,
                'pts': pts,
            })

        return rendered

    def apply_and_save(self, output_path, rendered_edges):
        for nid, info in self.nodes.items():
            geo = info['cell'].find('mxGeometry')
            geo.set('x', str(round(info['x'])))
            geo.set('y', str(round(info['y'])))
            geo.set('width', str(round(info['w'])))
            geo.set('height', str(round(info['h'])))

        edge_map = {e['id']: e for e in rendered_edges}
        parent_map = {c: p for p in self.tree.iter() for c in p}
        to_remove = []
        for c in self.cells:
            if c.get('edge') == '1':
                if c.get('id') not in edge_map:
                    to_remove.append(c)
                else:
                    ed = edge_map[c.get('id')]
                    c.set('style', ed['style'])
                    c.set('value', ed['value'])
                    geo = c.find('mxGeometry')
                    if geo is not None:
                        arr = geo.find('Array')
                        if arr is not None:
                            geo.remove(arr)
                        if ed['pts']:
                            arr = ET.SubElement(geo, 'Array', {'as': 'points'})
                            for px, py in ed['pts']:
                                ET.SubElement(arr, 'mxPoint', {'x': str(px), 'y': str(py)})

        for c in to_remove:
            parent = parent_map.get(c)
            if parent is not None:
                parent.remove(c)

        self.tree.write(output_path, encoding='utf-8', xml_declaration=False)
        print(f"Generated clean diagram: {output_path}")

def build_sprint1():
    cols = [
        ['contract_route', 'sf_route'],
        ['contract_ctrl', 'sf_ctrl', 'contract_gAuth', 'contract_gPerm'],
        ['contract_dtoCreate', 'contract_dtoUpdate', 'contract_dtoQuery', 'contract_dtoResp', 'contract_typeDetail',
         'sf_dtoUpload', 'sf_dtoGet', 'sf_dtoDelete', 'sf_typeShared'],
        ['contract_svc', 'sf_svc', 'sf_uCloudinary'],
        ['contract_repo', 'sf_repo'],
        ['sf_schemaFile', 'contract_schemaContract', 'contract_schemaJob', 'contract_schemaProposal', 'contract_schemaUser'],
        ['contract_enumStatus', 'contract_enumFee'],
    ]
    path = 'class-diagrams/Sprint1_Contract_Management_Class_Diagram.drawio'
    builder = UnifiedDiagramBuilder(path)
    builder.layout(cols, top_y=160, stack_gap=55, col_gap=160, start_x=40)
    edges = builder.route_all()
    builder.apply_and_save(path, edges)

def build_sprint2():
    cols = [
        ['ms_route', 'mf_route', 'sub_route'],
        ['ms_ctrl', 'mf_ctrl', 'sub_ctrl', 'ms_gAuth', 'ms_gPerm'],
        ['ms_dtoCreate', 'ms_dtoUpdate', 'ms_dtoQuery', 'ms_dtoListResp', 'ms_typeMilestone',
         'mf_dtoUpload', 'mf_dtoGet', 'mf_dtoDelete', 'mf_typeMilestoneFile',
         'sub_dtoSubmitBody', 'sub_dtoRequestChanges', 'sub_dtoGetSubmissions', 'sub_typeSubmission', 'sub_typeFile'],
        ['ms_svc', 'mf_svc', 'mf_uCloudinary', 'sub_svc'],
        ['ms_repo', 'mf_repo', 'sub_repo'],
        ['ms_schemaContract', 'ms_schemaMilestone', 'mf_schemaFile', 'sub_schemaSubmission', 'sub_schemaSubFile', 'ms_schemaDispute', 'mf_schemaUser'],
    ]
    path = 'class-diagrams/Sprint2_Milestone_Management_Class_Diagram.drawio'
    builder = UnifiedDiagramBuilder(path)
    builder.layout(cols, top_y=160, stack_gap=55, col_gap=160, start_x=40)
    edges = builder.route_all()
    builder.apply_and_save(path, edges)

def build_sprint3():
    cols = [
        ['disp_routeUser', 'disp_routeExpert'],
        ['disp_ctrlUser', 'disp_ctrlExpert', 'disp_gAuth', 'disp_gPerm'],
        ['disp_dtoCreate', 'disp_dtoCounter', 'disp_dtoDecision', 'disp_dtoVote', 'disp_dtoDetail', 'disp_typeEvidence'],
        ['disp_svcUser', 'disp_svcExpert'],
        ['disp_repoUser', 'disp_repoExpert'],
        ['disp_schemaContract', 'disp_schemaMilestone', 'disp_schemaDispute', 'disp_schemaEvidence', 'disp_schemaFile'],
    ]
    path = 'class-diagrams/Sprint3_Dispute_Management_Class_Diagram.drawio'
    builder = UnifiedDiagramBuilder(path)
    builder.layout(cols, top_y=160, stack_gap=55, col_gap=160, start_x=40)
    edges = builder.route_all()
    builder.apply_and_save(path, edges)

def build_sprint4():
    cols = [
        ['pay_route'],
        ['pay_ctrl', 'pay_gAuth'],
        ['pay_dtoIntent', 'pay_dtoCheckout', 'pay_dtoCard', 'pay_dtoSettlement', 'pay_dtoTx'],
        ['pay_svc', 'pay_uStripe'],
        ['pay_repo'],
        ['pay_schemaUser', 'pay_schemaContract', 'pay_schemaMilestone', 'pay_schemaTx'],
    ]
    path = 'class-diagrams/Sprint4_Payment_Management_Class_Diagram.drawio'
    builder = UnifiedDiagramBuilder(path)
    builder.layout(cols, top_y=160, stack_gap=55, col_gap=160, start_x=40)
    edges = builder.route_all()
    builder.apply_and_save(path, edges)

if __name__ == '__main__':
    build_sprint1()
    build_sprint2()
    build_sprint3()
    build_sprint4()
