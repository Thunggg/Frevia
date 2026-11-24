import xml.etree.ElementTree as ET
import copy

def esc(s):
    if not s:
        return ""
    return (s.replace("&", "&amp;")
             .replace("<", "&lt;")
             .replace(">", "&gt;")
             .replace('"', "&quot;"))

class DiagramEngine:
    def __init__(self, xml_path):
        self.xml_path = xml_path
        self.tree = ET.parse(xml_path)
        self.root = self.tree.getroot()
        self.cells = self.root.findall('.//mxCell')
        
        # Extract all nodes and existing edges
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
                }
        
        self.edge_data = []
        for c in self.cells:
            if c.get('edge') == '1':
                self.edge_data.append({
                    'id': c.get('id'),
                    'src': c.get('source'),
                    'tgt': c.get('target'),
                    'val': c.get('value', ''),
                    'dashed': 'dashed=1' in c.get('style', ''),
                })

    def layout(self, columns, top_y=160, stack_gap=50, col_gap=160, start_x=40):
        """
        columns: list of list of node IDs.
        """
        curr_x = start_x
        self.col_info = []
        
        for col_idx, col in enumerate(columns):
            if not col:
                continue
            # compute max width in this col
            col_w = max(self.nodes[nid]['w'] for nid in col)
            curr_y = top_y
            for nid in col:
                node = self.nodes[nid]
                node['x'] = curr_x
                node['y'] = curr_y
                node['col'] = col_idx
                # keep its width or expand to col_w if needed
                curr_y += node['h'] + stack_gap
            self.col_info.append({
                'col_idx': col_idx,
                'x': curr_x,
                'w': col_w,
                'right': curr_x + col_w,
                'nodes': col
            })
            curr_x += col_w + col_gap

    def route_edges(self):
        """
        Compute orthogonal paths and waypoints for all edges.
        """
        # Group edges by type and connection faces
        # We need pin distribution for nodes:
        # outgoing on right face, outgoing on left face, outgoing on top
        # incoming on left face, incoming on right face, incoming on top
        out_pins = {} # (nid, face) -> list of edge_ids
        in_pins = {}  # (nid, face) -> list of edge_ids

        # First pass: classify each edge's face usage
        classified_edges = []
        express_edges = []

        for e in self.edge_data:
            sid = e['src']
            tid = e['tgt']
            if sid not in self.nodes or tid not in self.nodes:
                continue
            sn = self.nodes[sid]
            tn = self.nodes[tid]
            scol = sn['col']
            tcol = tn['col']

            # Controller (Col 1) -> Service (Col 3): Top Express
            if scol == 1 and tcol == 3:
                etype = 'TOP_EXPRESS'
                sface = 'top'
                tface = 'top'
                express_edges.append(e['id'])
            # Same column
            elif scol == tcol:
                # check if adjacent in stack
                col_nodes = self.col_info[scol]['nodes']
                s_idx = col_nodes.index(sid)
                t_idx = col_nodes.index(tid)
                if abs(s_idx - t_idx) == 1:
                    etype = 'SAME_COL_ADJACENT'
                    sface = 'bottom' if t_idx > s_idx else 'top'
                    tface = 'top' if t_idx > s_idx else 'bottom'
                else:
                    etype = 'SAME_COL_BYPASS'
                    sface = 'right'
                    tface = 'right'
            # Forward adjacent or multi-column
            elif tcol > scol:
                etype = 'FORWARD'
                sface = 'right'
                tface = 'left'
            # Backward adjacent (e.g. Service Col 3 -> DTO Col 2)
            else:
                etype = 'BACKWARD'
                sface = 'left'
                tface = 'right'

            classified_edges.append({
                'data': e,
                'etype': etype,
                'sface': sface,
                'tface': tface,
                'sn': sn,
                'tn': tn,
                'scol': scol,
                'tcol': tcol,
            })

            out_pins.setdefault((sid, sface), []).append(e['id'])
            in_pins.setdefault((tid, tface), []).append(e['id'])

        # Sort pin lists by vertical order of target / source
        for (nid, face), eids in out_pins.items():
            if face in ('right', 'left'):
                # sort by target y
                eids.sort(key=lambda eid: self.nodes[[e['tgt'] for e in self.edge_data if e['id'] == eid][0]]['y'])
        for (nid, face), eids in in_pins.items():
            if face in ('right', 'left'):
                # sort by source y
                eids.sort(key=lambda eid: self.nodes[[e['src'] for e in self.edge_data if e['id'] == eid][0]]['y'])

        # Group channel edges to allocate distinct X tracks
        # gap (c, c+1) has forward edges (from c to c+1) and backward edges (from c+1 to c)
        gap_edges = {} # (c, c+1) -> list of classified_edge
        for ce in classified_edges:
            if ce['etype'] == 'FORWARD':
                gap_key = (ce['scol'], ce['scol'] + 1)
                gap_edges.setdefault(gap_key, []).append(ce)
            elif ce['etype'] == 'BACKWARD':
                gap_key = (ce['tcol'], ce['tcol'] + 1)
                gap_edges.setdefault(gap_key, []).append(ce)
            elif ce['etype'] == 'SAME_COL_BYPASS':
                gap_key = (ce['scol'], ce['scol'] + 1)
                gap_edges.setdefault(gap_key, []).append(ce)

        # Allocate distinct tracks in each gap
        edge_tracks = {} # eid -> track_x
        for (c1, c2), ces in gap_edges.items():
            col1 = self.col_info[c1]
            col2 = self.col_info[c2]
            gap_left = col1['right'] + 25
            gap_right = col2['x'] - 25
            num_edges = len(ces)
            # sort edges by average y position to keep tracks orderly
            ces.sort(key=lambda item: (item['sn']['y'] + item['tn']['y']) / 2.0)
            for idx, item in enumerate(ces):
                if num_edges == 1:
                    track_x = (gap_left + gap_right) / 2.0
                else:
                    track_x = gap_left + (idx + 0.5) * (gap_right - gap_left) / num_edges
                edge_tracks[item['data']['id']] = track_x

        # Top express lanes for Controller -> Service
        express_lanes = {} # eid -> lane_y
        for idx, eid in enumerate(express_edges):
            express_lanes[eid] = 90 - 45 * idx

        # Now build final styles and waypoints for each edge
        rendered_edges = []
        for ce in classified_edges:
            e = ce['data']
            eid = e['id']
            sid = e['src']
            tid = e['tgt']
            sn = ce['sn']
            tn = ce['tn']
            sface = ce['sface']
            tface = ce['tface']
            etype = ce['etype']

            # Compute exitX, exitY
            out_list = out_pins.get((sid, sface), [eid])
            out_idx = out_list.index(eid) if eid in out_list else 0
            n_out = len(out_list)
            if sface in ('right', 'left'):
                exit_frac = 0.5 if n_out == 1 else 0.18 + 0.64 * out_idx / (n_out - 1)
                exitX = 1.0 if sface == 'right' else 0.0
                exitY = round(exit_frac, 4)
            elif sface == 'top':
                exit_frac = 0.5 if n_out == 1 else 0.3 + 0.4 * out_idx / (n_out - 1)
                exitX = round(exit_frac, 4)
                exitY = 0.0
            else: # bottom
                exitX = 0.5
                exitY = 1.0

            # Compute entryX, entryY
            in_list = in_pins.get((tid, tface), [eid])
            in_idx = in_list.index(eid) if eid in in_list else 0
            n_in = len(in_list)
            if tface in ('left', 'right'):
                entry_frac = 0.5 if n_in == 1 else 0.18 + 0.64 * in_idx / (n_in - 1)
                entryX = 0.0 if tface == 'left' else 1.0
                entryY = round(entry_frac, 4)
            elif tface == 'top':
                entry_frac = 0.5 if n_in == 1 else 0.3 + 0.4 * in_idx / (n_in - 1)
                entryX = round(entry_frac, 4)
                entryY = 0.0
            else: # bottom
                entryX = 0.5
                entryY = 1.0

            # Calculate points
            pts = []
            if etype == 'TOP_EXPRESS':
                lane_y = express_lanes[eid]
                p1_x = sn['x'] + sn['w'] * exitX
                p2_x = tn['x'] + tn['w'] * entryX
                pts = [(round(p1_x), round(lane_y)), (round(p2_x), round(lane_y))]
            elif etype in ('FORWARD', 'BACKWARD', 'SAME_COL_BYPASS'):
                track_x = edge_tracks.get(eid, (sn['x'] + tn['x']) / 2.0)
                p1_y = sn['y'] + sn['h'] * exitY
                p2_y = tn['y'] + tn['h'] * entryY
                pts = [(round(track_x), round(p1_y)), (round(track_x), round(p2_y))]
            elif etype == 'SAME_COL_ADJACENT':
                pts = [] # direct straight vertical line!

            # Construct style string
            style = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;"
            style += "startArrow=none;endArrow=open;endSize=12;fontSize=13;labelBackgroundColor=none;"
            if e['dashed']:
                style += "dashed=1;"
            style += f"exitX={exitX};exitY={exitY};exitDx=0;exitDy=0;"
            style += f"entryX={entryX};entryY={entryY};entryDx=0;entryDy=0;"

            rendered_edges.append({
                'id': eid,
                'source': sid,
                'target': tid,
                'value': e['val'],
                'style': style,
                'pts': pts,
            })

        return rendered_edges

    def write_diagram(self, output_path, rendered_edges):
        # Update node geometries in XML
        for nid, info in self.nodes.items():
            cell = info['cell']
            geo = cell.find('mxGeometry')
            geo.set('x', str(round(info['x'])))
            geo.set('y', str(round(info['y'])))
            geo.set('width', str(round(info['w'])))
            geo.set('height', str(round(info['h'])))

        # Update edges in XML
        edge_map = {e['id']: e for e in rendered_edges}
        for c in self.cells:
            if c.get('edge') == '1' and c.get('id') in edge_map:
                ed = edge_map[c.get('id')]
                c.set('style', ed['style'])
                c.set('value', ed['value'])
                geo = c.find('mxGeometry')
                if geo is not None:
                    # remove old points array if any
                    arr = geo.find('Array')
                    if arr is not None:
                        geo.remove(arr)
                    if ed['pts']:
                        arr = ET.SubElement(geo, 'Array', {'as': 'points'})
                        for px, py in ed['pts']:
                            ET.SubElement(arr, 'mxPoint', {'x': str(px), 'y': str(py)})

        # Save XML
        self.tree.write(output_path, encoding='utf-8', xml_declaration=False)
        print(f"Successfully generated: {output_path}")

print("DiagramEngine ready.")
