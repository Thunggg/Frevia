import csv
import os
import xml.etree.ElementTree as ET
from xml.dom import minidom
from collections import defaultdict

WORKSPACE_DIR = r"d:\Documents\Book\Do_an\Frevia\frevia-clone"
UC_DIR = os.path.join(WORKSPACE_DIR, "uc-diagrams")
CSV_PATH = os.path.join(UC_DIR, "Frevia_UC.csv")

modules_dict = {}
all_ucs_dict = {}
actor_modules = defaultdict(lambda: defaultdict(list))

with open(CSV_PATH, 'r', encoding='utf-8', errors='replace') as f:
    reader = csv.reader(f)
    next(reader)
    for r in reader:
        if not r or not r[0].strip():
            continue
        uc_id = r[0].strip()
        mod_id = r[1].strip()
        mod_name = r[2].strip()
        uc_name = r[3].strip()
        actor_field = r[-1].strip()
        
        # Specific fixes for empty fields if any
        if uc_id == 'UC-11.07' and not actor_field:
            actor_field = 'Client'
        if uc_id == 'UC-48.02' and not actor_field:
            actor_field = 'Admin'
            
        actors = [a.strip() for a in actor_field.split(',') if a.strip()]
        
        modules_dict[mod_id] = mod_name
        all_ucs_dict[uc_id] = (mod_id, mod_name, uc_name)
        
        for a in actors:
            actor_modules[a][(mod_id, mod_name)].append((uc_id, uc_name))

class TemplateBuilder:
    def __init__(self, page_name, diagram_id):
        self.page_name = page_name
        self.diagram_id = diagram_id
        self.cell_counter = 0
        
        self.diagram = ET.Element('diagram', {'name': page_name, 'id': diagram_id})
        self.model = ET.SubElement(self.diagram, 'mxGraphModel', {
            'dx': '2084', 'dy': '1348', 'grid': '1', 'gridSize': '10', 'guides': '1',
            'tooltips': '1', 'connect': '1', 'arrows': '1', 'fold': '1', 'page': '1',
            'pageScale': '1', 'pageWidth': '1250', 'pageHeight': '1150', 'math': '0', 'shadow': '0'
        })
        self.root = ET.SubElement(self.model, 'root')
        ET.SubElement(self.root, 'mxCell', {'id': '0'})
        ET.SubElement(self.root, 'mxCell', {'id': '1', 'parent': '0'})
        
    def next_id(self, prefix='c'):
        self.cell_counter += 1
        return f"{prefix}_{self.cell_counter}"
        
    def add_title(self, text):
        return None


    def add_actor(self, x, y, name, w=35, h=70, font_size=14):
        cid = self.next_id('act')
        style = (f"shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;"
                 f"fontSize={font_size};fontFamily=Tahoma;")
        cell = ET.SubElement(self.root, 'mxCell', {
            'id': cid, 'value': name, 'style': style, 'vertex': '1', 'parent': '1'
        })
        ET.SubElement(cell, 'mxGeometry', {'x': str(x), 'y': str(y), 'width': str(w), 'height': str(h), 'as': 'geometry'})
        return cid

    def add_swimlane(self, x, y, w, h, title="Frevia"):
        cid = "swimlane_frevia"
        style = ("swimlane;whiteSpace=wrap;html=1;startSize=30;fontSize=15;fontFamily=Tahoma;fontStyle=1;"
                 "fillColor=#dae8fc;strokeColor=#6c8ebf;")
        cell = ET.SubElement(self.root, 'mxCell', {
            'id': cid, 'value': title, 'style': style, 'vertex': '1', 'parent': '1'
        })
        ET.SubElement(cell, 'mxGeometry', {'x': str(x), 'y': str(y), 'width': str(w), 'height': str(h), 'as': 'geometry'})
        return cid

    def add_module_uc(self, x, y, uc_id, uc_name, parent_id, w=150, h=60):
        cid = self.next_id('uc_mod')
        val = f"{uc_name}\n{uc_id}"
        style = ("ellipse;whiteSpace=wrap;html=1;fontSize=11;fontFamily=Tahoma;fontStyle=1;"
                 "fillColor=#ffffff;strokeColor=#000000;")
        cell = ET.SubElement(self.root, 'mxCell', {
            'id': cid, 'value': val, 'style': style, 'vertex': '1', 'parent': parent_id
        })
        ET.SubElement(cell, 'mxGeometry', {'x': str(x), 'y': str(y), 'width': str(w), 'height': str(h), 'as': 'geometry'})
        return cid

    def add_sub_uc(self, x, y, uc_id, uc_name, parent_id, w=135, h=48):
        cid = self.next_id('uc_sub')
        val = f"{uc_name}\n{uc_id}"
        style = ("ellipse;whiteSpace=wrap;html=1;fontSize=10;fontFamily=Tahoma;"
                 "fillColor=#ffffff;strokeColor=#000000;")
        cell = ET.SubElement(self.root, 'mxCell', {
            'id': cid, 'value': val, 'style': style, 'vertex': '1', 'parent': parent_id
        })
        ET.SubElement(cell, 'mxGeometry', {'x': str(x), 'y': str(y), 'width': str(w), 'height': str(h), 'as': 'geometry'})
        return cid

    def add_simple_uc(self, x, y, val, parent_id, w=135, h=60, font_size=12, font_style=0):
        cid = self.next_id('uc')
        style = (f"ellipse;whiteSpace=wrap;html=1;fontSize={font_size};fontFamily=Tahoma;"
                 f"fontStyle={font_style};fillColor=#ffffff;strokeColor=#000000;")
        cell = ET.SubElement(self.root, 'mxCell', {
            'id': cid, 'value': val, 'style': style, 'vertex': '1', 'parent': parent_id
        })
        ET.SubElement(cell, 'mxGeometry', {'x': str(x), 'y': str(y), 'width': str(w), 'height': str(h), 'as': 'geometry'})
        return cid

    def add_edge(self, source_id, target_id):
        cid = self.next_id('m')
        style = "endArrow=none;html=1;rounded=0;fontFamily=Tahoma;fontSize=13;"
        cell = ET.SubElement(self.root, 'mxCell', {
            'id': cid, 'style': style, 'edge': '1', 'parent': '1',
            'source': source_id, 'target': target_id
        })
        ET.SubElement(cell, 'mxGeometry', {'relative': '1', 'as': 'geometry'})
        return cid

    def add_include_edge(self, source_id, target_id):
        cid = self.next_id('inc')
        style = ("edgeStyle=orthogonalEdgeStyle;rounded=0;endArrow=open;dashed=1;html=1;"
                 "strokeColor=#000000;fontSize=10;fontFamily=Tahoma;labelBackgroundColor=#ffffff;"
                 "align=center;verticalAlign=middle;")
        cell = ET.SubElement(self.root, 'mxCell', {
            'id': cid, 'value': '&lt;&lt;include&gt;&gt;', 'style': style, 'edge': '1', 'parent': '1',
            'source': source_id, 'target': target_id
        })
        geom = ET.SubElement(cell, 'mxGeometry', {'relative': '1', 'x': '0.75', 'y': '-10', 'as': 'geometry'})
        ET.SubElement(geom, 'mxPoint', {'as': 'offset'})
        return cid


def build_actor_auth_page(actor_name, page_name, diagram_id, title_text, has_forgot=True):
    builder = TemplateBuilder(page_name=page_name, diagram_id=diagram_id)
    builder.add_title(title_text)
    
    sw_id = builder.add_swimlane(140, 60, 780, 490, "Frevia")
    act_id = builder.add_actor(40, 265, actor_name, w=35, h=70)
    
    # UC-03 Logout (top left)
    uc_logout = builder.add_simple_uc(50, 85, "Logout\nUC-03", sw_id, w=135, h=60, font_size=12, font_style=0)
    builder.add_edge(act_id, uc_logout)
    
    # UC-02 Login (center)
    uc_login = builder.add_simple_uc(370, 225, "Login\nUC-02", sw_id, w=140, h=65, font_size=13, font_style=1)
    builder.add_edge(act_id, uc_login)
    
    # Logout -> Login (<<include>>)
    builder.add_include_edge(uc_logout, uc_login)
    
    # UC-05 Forgot Password (bottom left)
    if has_forgot:
        uc_forgot = builder.add_simple_uc(50, 345, "Forgot Password\nUC-05", sw_id, w=135, h=60, font_size=12, font_style=0)
        builder.add_edge(act_id, uc_forgot)
        
    return builder.diagram


def build_business_page(actor_display_name, page_name, diagram_id, title_text, module_specs):
    builder = TemplateBuilder(page_name=page_name, diagram_id=diagram_id)
    builder.add_title(title_text)
    
    sw_height = 1020
    sw_id = builder.add_swimlane(130, 60, 970, sw_height, "Frevia")
    actor_id = builder.add_actor(40, 470, actor_display_name, w=35, h=70)
    
    # Login UC in center right (x=780, y=475) for business module <<include>> connections (NO Logout on business pages)
    login_id = builder.add_simple_uc(780, 475, "UC-02\nLogin", sw_id, w=105, h=55, font_size=12, font_style=1)
    builder.add_edge(actor_id, login_id)
    
    module_layouts = []
    total_rows = 0
    for spec in module_specs:
        mid = spec['mid']
        mname = spec.get('mname', modules_dict.get(mid, mid))
        sub_ucs = spec.get('sub_ucs', [])
        
        k = len(sub_ucs)
        if k == 0:
            rows = 1
            col_assignment = []
        elif k == 1:
            rows = 1
            col_assignment = [(0, sub_ucs[0], 0)]
        elif k == 2:
            rows = 1
            col_assignment = [(0, sub_ucs[0], 0), (0, sub_ucs[1], 1)]
        elif k in [3, 4]:
            rows = 2
            col1 = sub_ucs[:2]
            col2 = sub_ucs[2:]
            col_assignment = [(r_i, u, 0) for r_i, u in enumerate(col1)] + [(r_i, u, 1) for r_i, u in enumerate(col2)]
        elif k in [5, 6]:
            rows = 2
            col1 = sub_ucs[:2]
            col2 = sub_ucs[2:4]
            col3 = sub_ucs[4:]
            col_assignment = ([(r_i, u, 0) for r_i, u in enumerate(col1)] +
                              [(r_i, u, 1) for r_i, u in enumerate(col2)] +
                              [(r_i, u, 2) for r_i, u in enumerate(col3)])
        elif k in [7, 8, 9]:
            rows = 3
            col1 = sub_ucs[:3]
            col2 = sub_ucs[3:6]
            col3 = sub_ucs[6:]
            col_assignment = ([(r_i, u, 0) for r_i, u in enumerate(col1)] +
                              [(r_i, u, 1) for r_i, u in enumerate(col2)] +
                              [(r_i, u, 2) for r_i, u in enumerate(col3)])
        elif k == 10:
            rows = 4
            col1 = sub_ucs[:4]
            col2 = sub_ucs[4:7]
            col3 = sub_ucs[7:]
            col_assignment = ([(r_i, u, 0) for r_i, u in enumerate(col1)] +
                              [(r_i, u, 1) for r_i, u in enumerate(col2)] +
                              [(r_i, u, 2) for r_i, u in enumerate(col3)])
        else: # 17 UCs (Forum)
            rows = 6
            col1 = sub_ucs[:6]
            col2 = sub_ucs[6:12]
            col3 = sub_ucs[12:]
            col_assignment = ([(r_i, u, 0) for r_i, u in enumerate(col1)] +
                              [(r_i, u, 1) for r_i, u in enumerate(col2)] +
                              [(r_i, u, 2) for r_i, u in enumerate(col3)])
            
        module_layouts.append((mid, mname, sub_ucs, rows, col_assignment))
        total_rows += rows
        
    avail_h = 840
    row_h = min(85, max(50, avail_h // max(1, total_rows)))
    base_top = 130 + (avail_h - total_rows * row_h) // 2
    col_x_map = {0: 240, 1: 395, 2: 545}
    curr_row = 0
    
    for mid, mname, sub_ucs, m_rows, col_assignment in module_layouts:
        start_y = base_top + curr_row * row_h
        slot_span = m_rows * row_h
        mod_center_y = start_y + slot_span // 2 - 30
        
        # Module UC
        mod_cid = builder.add_module_uc(30, mod_center_y, mid, mname, sw_id, w=150, h=60)
        builder.add_edge(actor_id, mod_cid)
        builder.add_include_edge(mod_cid, login_id)
        
        # Sub UCs connected to Module with clean solid lines
        for r_offset, (cid_str, cname_str), c_idx in col_assignment:
            u_y = start_y + r_offset * row_h
            u_x = col_x_map[c_idx]
            sub_cid = builder.add_sub_uc(u_x, u_y, cid_str, cname_str, sw_id, w=135, h=48)
            builder.add_edge(mod_cid, sub_cid)
            
        curr_row += m_rows
        
    return builder.diagram


def save_diagram_file(filename, diagram_elements):
    mxfile = ET.Element('mxfile', {
        'host': 'Electron',
        'agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) draw.io/29.3.0 Chrome/140.0.7339.249 Electron/38.7.2 Safari/537.36',
        'version': '29.3.0',
        'pages': str(len(diagram_elements))
    })
    for diag in diagram_elements:
        mxfile.append(diag)
    
    out_path = os.path.join(UC_DIR, filename)
    xml_str = ET.tostring(mxfile, encoding='utf-8')
    parsed = minidom.parseString(xml_str)
    pretty_xml = parsed.toprettyxml(indent='  ', encoding='utf-8')
    
    with open(out_path, 'wb') as f:
        f.write(pretty_xml)
    print(f"Saved: {filename} ({len(diagram_elements)} pages)")


def get_actor_subs(actor_name, mid):
    for (m_id, m_name), ucs in actor_modules[actor_name].items():
        if m_id == mid:
            return ucs
    return []


def main():
    print("Strictly generating Actor diagrams according to Frevia_UC.csv...")

    # =========================================================================
    # 1. GUEST (1 page: Account Onboarding, Job & Forum Browsing)
    # =========================================================================
    gst_builder = TemplateBuilder("Guest 1/1", "Guest_1")
    gst_builder.add_title("Guest - Use Case Diagram (1/1) - Account Onboarding, Job & Community Browsing")
    sw_gst = gst_builder.add_swimlane(140, 60, 840, 620, "Frevia")
    act_gst = gst_builder.add_actor(40, 320, "Guest", w=35, h=70)
    
    # 1. Top: Auth / Onboarding
    uc_reg = gst_builder.add_simple_uc(50, 45, "Register\nUC-04", sw_gst, w=145, h=55, font_size=11, font_style=1)
    gst_builder.add_edge(act_gst, uc_reg)
    
    uc_gw = gst_builder.add_simple_uc(340, 45, "Login with Google\nUC-01", sw_gst, w=150, h=55, font_size=11, font_style=0)
    gst_builder.add_edge(act_gst, uc_gw)
    act_g = gst_builder.add_actor(1020, 95, "Google Authentication Service", w=35, h=70, font_size=12)
    gst_builder.add_edge(act_g, uc_gw)
    
    # 2. Middle: UC-10 Job Browsing
    uc_jb = gst_builder.add_module_uc(50, 165, "UC-10", "Job Browsing", sw_gst, w=150, h=55)
    gst_builder.add_edge(act_gst, uc_jb)
    c_jb1 = gst_builder.add_sub_uc(280, 150, "UC-10.01", "View Job List", sw_gst, w=150, h=46)
    c_jb2 = gst_builder.add_sub_uc(470, 150, "UC-10.02", "View Job Detail", sw_gst, w=150, h=46)
    gst_builder.add_edge(uc_jb, c_jb1)
    gst_builder.add_edge(uc_jb, c_jb2)
    
    # 3. Bottom: UC-14 Forum Management
    uc_forum_g = gst_builder.add_module_uc(50, 385, "UC-14", "Forum Management", sw_gst, w=150, h=55)
    gst_builder.add_edge(act_gst, uc_forum_g)
    
    sub_forum_g = [
        ("UC-14.01", "View Forum Category List", 280, 275),
        ("UC-14.02", "View Forum Category Detail", 470, 275),
        ("UC-14.03", "View Post List", 280, 375),
        ("UC-14.04", "View Post Detail", 470, 375),
        ("UC-14.10", "View Post Likes", 280, 475),
        ("UC-14.11", "View Post Comments", 470, 475),
    ]
    for uid, uname, ux, uy in sub_forum_g:
        sub_c = gst_builder.add_sub_uc(ux, uy, uid, uname, sw_gst, w=160, h=46)
        gst_builder.add_edge(uc_forum_g, sub_c)
        
    save_diagram_file('Guest.drawio', [gst_builder.diagram])

    # =========================================================================
    # 2. EXPERT (1 page: UC-02, UC-03, UC-05, UC-47.06)
    # =========================================================================
    exp_builder = TemplateBuilder("Expert 1/1", "Expert_1")
    exp_builder.add_title("Expert - Use Case Diagram (1/1) - Authorization & Profile Review")
    sw_exp = exp_builder.add_swimlane(140, 60, 800, 520, "Frevia")
    act_exp = exp_builder.add_actor(40, 260, "Expert", w=35, h=70)
    
    uc_lo_exp = exp_builder.add_simple_uc(50, 80, "Logout\nUC-03", sw_exp, w=135, h=60, font_size=12, font_style=0)
    exp_builder.add_edge(act_exp, uc_lo_exp)
    
    uc_li_exp = exp_builder.add_simple_uc(370, 220, "Login\nUC-02", sw_exp, w=140, h=65, font_size=13, font_style=1)
    exp_builder.add_edge(act_exp, uc_li_exp)
    exp_builder.add_include_edge(uc_lo_exp, uc_li_exp)
    
    uc_fp_exp = exp_builder.add_simple_uc(50, 360, "Forgot Password\nUC-05", sw_exp, w=135, h=60, font_size=12, font_style=0)
    exp_builder.add_edge(act_exp, uc_fp_exp)
    
    uc_mod_47 = exp_builder.add_module_uc(370, 360, "UC-47", "Profile Update Review", sw_exp, w=160, h=60)
    exp_builder.add_edge(act_exp, uc_mod_47)
    exp_builder.add_include_edge(uc_mod_47, uc_li_exp)
    c_47_06 = exp_builder.add_sub_uc(580, 365, "UC-47.06", "Update Profile Expert", sw_exp, w=150, h=50)
    exp_builder.add_edge(uc_mod_47, c_47_06)
    
    save_diagram_file('Expert.drawio', [exp_builder.diagram])

    # =========================================================================
    # 3. ADMIN (4 pages: Page 1 = Auth (UC-02, UC-03), Pages 2-4 = 16 business modules)
    # =========================================================================
    adm_p1 = build_actor_auth_page('Admin', 'Admin 1/4', 'Admin_1', 'Admin - Use Case Diagram (1/4) - Authorization', has_forgot=False)
    adm_p2_specs = [
        {'mid': 'UC-06', 'sub_ucs': get_actor_subs('Admin', 'UC-06')},
        {'mid': 'UC-13', 'sub_ucs': get_actor_subs('Admin', 'UC-13')},
        {'mid': 'UC-15', 'sub_ucs': get_actor_subs('Admin', 'UC-15')},
        {'mid': 'UC-16', 'sub_ucs': get_actor_subs('Admin', 'UC-16')},
        {'mid': 'UC-17', 'sub_ucs': get_actor_subs('Admin', 'UC-17')},
    ]
    adm_p2 = build_business_page('Admin', 'Admin 2/4', 'Admin_2', 'Admin - Use Case Diagram (2/4) - Role, Contract & Security Management', adm_p2_specs)
    
    adm_p3_specs = [
        {'mid': 'UC-28', 'sub_ucs': get_actor_subs('Admin', 'UC-28')},
        {'mid': 'UC-33', 'sub_ucs': get_actor_subs('Admin', 'UC-33')},
        {'mid': 'UC-34', 'sub_ucs': get_actor_subs('Admin', 'UC-34')},
        {'mid': 'UC-35', 'sub_ucs': get_actor_subs('Admin', 'UC-35')},
        {'mid': 'UC-36', 'sub_ucs': get_actor_subs('Admin', 'UC-36')},
    ]
    adm_p3 = build_business_page('Admin', 'Admin 3/4', 'Admin_3', 'Admin - Use Case Diagram (3/4) - User, Moderation & Dispute Management', adm_p3_specs)
    
    adm_p4_specs = [
        {'mid': 'UC-37', 'sub_ucs': get_actor_subs('Admin', 'UC-37')},
        {'mid': 'UC-38', 'sub_ucs': get_actor_subs('Admin', 'UC-38')},
        {'mid': 'UC-43', 'sub_ucs': get_actor_subs('Admin', 'UC-43')},
        {'mid': 'UC-46', 'sub_ucs': get_actor_subs('Admin', 'UC-46')},
        {'mid': 'UC-47', 'sub_ucs': get_actor_subs('Admin', 'UC-47')},
        {'mid': 'UC-48', 'sub_ucs': get_actor_subs('Admin', 'UC-48')},
    ]
    adm_p4 = build_business_page('Admin', 'Admin 4/4', 'Admin_4', 'Admin - Use Case Diagram (4/4) - Content, Platform & System Configuration', adm_p4_specs)
    save_diagram_file('Admin.drawio', [adm_p1, adm_p2, adm_p3, adm_p4])

    # =========================================================================
    # 4. CLIENT (6 pages: Page 1 = Auth, Pages 2-6 = 21 business modules)
    # =========================================================================
    cl_p1 = build_actor_auth_page('Client', 'Client 1/6', 'Client_1', 'Client - Use Case Diagram (1/6) - Authorization', has_forgot=True)
    
    # Page 2: Job Browsing (UC-10), Job Management (UC-11: 7 UCs!), Session (UC-16), Profile (UC-19), Social Links (UC-20), Favorite Freelancers (UC-21)
    cl_p2_specs = [
        {'mid': 'UC-10', 'sub_ucs': get_actor_subs('Client', 'UC-10')},
        {'mid': 'UC-11', 'sub_ucs': get_actor_subs('Client', 'UC-11')},
        {'mid': 'UC-16', 'sub_ucs': get_actor_subs('Client', 'UC-16')},
        {'mid': 'UC-19', 'sub_ucs': get_actor_subs('Client', 'UC-19')},
        {'mid': 'UC-20', 'sub_ucs': get_actor_subs('Client', 'UC-20')},
        {'mid': 'UC-21', 'sub_ucs': get_actor_subs('Client', 'UC-21')},
    ]
    cl_p2 = build_business_page('Client', 'Client 2/6', 'Client_2', 'Client - Use Case Diagram (2/6) - Job & Profile Management', cl_p2_specs)
    
    cl_p3_specs = [
        {'mid': 'UC-13', 'sub_ucs': get_actor_subs('Client', 'UC-13')},
        {'mid': 'UC-24', 'sub_ucs': get_actor_subs('Client', 'UC-24')},
        {'mid': 'UC-25', 'sub_ucs': get_actor_subs('Client', 'UC-25')},
        {'mid': 'UC-26', 'sub_ucs': get_actor_subs('Client', 'UC-26')},
    ]
    cl_p3 = build_business_page('Client', 'Client 3/6', 'Client_3', 'Client - Use Case Diagram (3/6) - Contract & Milestone Management', cl_p3_specs)
    
    cl_p4_specs = [
        {'mid': 'UC-14', 'sub_ucs': get_actor_subs('Client', 'UC-14')},
    ]
    cl_p4 = build_business_page('Client', 'Client 4/6', 'Client_4', 'Client - Use Case Diagram (4/6) - Forum Community Management', cl_p4_specs)
    
    cl_p5_specs = [
        {'mid': 'UC-27', 'sub_ucs': get_actor_subs('Client', 'UC-27')},
        {'mid': 'UC-29', 'sub_ucs': get_actor_subs('Client', 'UC-29')},
        {'mid': 'UC-30', 'sub_ucs': get_actor_subs('Client', 'UC-30')},
        {'mid': 'UC-31', 'sub_ucs': get_actor_subs('Client', 'UC-31')},
        {'mid': 'UC-32', 'sub_ucs': get_actor_subs('Client', 'UC-32')},
    ]
    cl_p5 = build_business_page('Client', 'Client 5/6', 'Client_5', 'Client - Use Case Diagram (5/6) - Communication, Notification & Proposal Management', cl_p5_specs)
    
    cl_p6_specs = [
        {'mid': 'UC-33', 'sub_ucs': get_actor_subs('Client', 'UC-33')},
        {'mid': 'UC-39', 'sub_ucs': get_actor_subs('Client', 'UC-39')},
        {'mid': 'UC-40', 'sub_ucs': get_actor_subs('Client', 'UC-40')},
        {'mid': 'UC-41', 'sub_ucs': get_actor_subs('Client', 'UC-41')},
        {'mid': 'UC-43', 'sub_ucs': get_actor_subs('Client', 'UC-43')},
    ]
    cl_p6 = build_business_page('Client', 'Client 6/6', 'Client_6', 'Client - Use Case Diagram (6/6) - Dispute, Review & Payment Management', cl_p6_specs)
    save_diagram_file('Client.drawio', [cl_p1, cl_p2, cl_p3, cl_p4, cl_p5, cl_p6])

    # =========================================================================
    # 5. FREELANCER (7 pages: Page 1 = Auth, Pages 2-7 = 25 business modules)
    # =========================================================================
    fl_p1 = build_actor_auth_page('Freelancer', 'Freelancer 1/7', 'Freelancer_1', 'Freelancer - Use Case Diagram (1/7) - Authorization', has_forgot=True)
    fl_p2_specs = [
        {'mid': 'UC-07', 'sub_ucs': get_actor_subs('Freelancer', 'UC-07')},
        {'mid': 'UC-08', 'sub_ucs': get_actor_subs('Freelancer', 'UC-08')},
        {'mid': 'UC-09', 'sub_ucs': get_actor_subs('Freelancer', 'UC-09')},
        {'mid': 'UC-10', 'sub_ucs': get_actor_subs('Freelancer', 'UC-10')},
    ]
    fl_p2 = build_business_page('Freelancer', 'Freelancer 2/7', 'Freelancer_2', 'Freelancer - Use Case Diagram (2/7) - Profile, Skill & Portfolio Management', fl_p2_specs)
    
    fl_p3_specs = [
        {'mid': 'UC-12', 'sub_ucs': get_actor_subs('Freelancer', 'UC-12')},
        {'mid': 'UC-13', 'sub_ucs': get_actor_subs('Freelancer', 'UC-13')},
        {'mid': 'UC-16', 'sub_ucs': get_actor_subs('Freelancer', 'UC-16')},
        {'mid': 'UC-18', 'sub_ucs': get_actor_subs('Freelancer', 'UC-18')},
    ]
    fl_p3 = build_business_page('Freelancer', 'Freelancer 3/7', 'Freelancer_3', 'Freelancer - Use Case Diagram (3/7) - Contract, Bookmark & Verification Management', fl_p3_specs)
    
    fl_p4_specs = [
        {'mid': 'UC-14', 'sub_ucs': get_actor_subs('Freelancer', 'UC-14')},
    ]
    fl_p4 = build_business_page('Freelancer', 'Freelancer 4/7', 'Freelancer_4', 'Freelancer - Use Case Diagram (4/7) - Forum Community Management', fl_p4_specs)
    
    fl_p5_specs = [
        {'mid': 'UC-20', 'sub_ucs': get_actor_subs('Freelancer', 'UC-20')},
        {'mid': 'UC-22', 'sub_ucs': get_actor_subs('Freelancer', 'UC-22')},
        {'mid': 'UC-23', 'sub_ucs': get_actor_subs('Freelancer', 'UC-23')},
        {'mid': 'UC-24', 'sub_ucs': get_actor_subs('Freelancer', 'UC-24')},
        {'mid': 'UC-25', 'sub_ucs': get_actor_subs('Freelancer', 'UC-25')},
        {'mid': 'UC-26', 'sub_ucs': get_actor_subs('Freelancer', 'UC-26')},
    ]
    fl_p5 = build_business_page('Freelancer', 'Freelancer 5/7', 'Freelancer_5', 'Freelancer - Use Case Diagram (5/7) - Job Alert, Saved Search & Milestone Management', fl_p5_specs)
    
    fl_p6_specs = [
        {'mid': 'UC-27', 'sub_ucs': get_actor_subs('Freelancer', 'UC-27')},
        {'mid': 'UC-30', 'sub_ucs': get_actor_subs('Freelancer', 'UC-30')},
        {'mid': 'UC-31', 'sub_ucs': get_actor_subs('Freelancer', 'UC-31')},
        {'mid': 'UC-32', 'sub_ucs': get_actor_subs('Freelancer', 'UC-32')},
    ]
    fl_p6 = build_business_page('Freelancer', 'Freelancer 6/7', 'Freelancer_6', 'Freelancer - Use Case Diagram (6/7) - Conversation, Notification & Proposal Management', fl_p6_specs)
    
    fl_p7_specs = [
        {'mid': 'UC-33', 'sub_ucs': get_actor_subs('Freelancer', 'UC-33')},
        {'mid': 'UC-39', 'sub_ucs': get_actor_subs('Freelancer', 'UC-39')},
        {'mid': 'UC-40', 'sub_ucs': get_actor_subs('Freelancer', 'UC-40')},
        {'mid': 'UC-41', 'sub_ucs': get_actor_subs('Freelancer', 'UC-41')},
        {'mid': 'UC-43', 'sub_ucs': get_actor_subs('Freelancer', 'UC-43')},
        {'mid': 'UC-46', 'sub_ucs': get_actor_subs('Freelancer', 'UC-46')},
    ]
    fl_p7 = build_business_page('Freelancer', 'Freelancer 7/7', 'Freelancer_7', 'Freelancer - Use Case Diagram (7/7) - Dispute, Review & Payment Management', fl_p7_specs)
    save_diagram_file('Freelancer.drawio', [fl_p1, fl_p2, fl_p3, fl_p4, fl_p5, fl_p6, fl_p7])

    # Template
    save_diagram_file('Freelancer_template.drawio', [fl_p1, fl_p2])

    # =========================================================================
    # 6. SYSTEM (1 page: UC-43.12, UC-43.13)
    # =========================================================================
    sys_builder = TemplateBuilder('System 1/1', 'System_1')
    sys_builder.add_title('System - Use Case Diagram (1/1) - Automated Background Payment Sync')
    sw_sys = sys_builder.add_swimlane(130, 60, 970, 1020, "Frevia")
    act_sys = sys_builder.add_actor(40, 470, "System", w=35, h=70)
    
    m_pay = sys_builder.add_module_uc(30, 470, "UC-43", "Payment Management", sw_sys, w=150, h=60)
    sys_builder.add_edge(act_sys, m_pay)
    
    c_wh = sys_builder.add_sub_uc(240, 440, "UC-43.12", "Handle Stripe Webhook Event", sw_sys, w=160, h=48)
    c_sync = sys_builder.add_sub_uc(420, 440, "UC-43.13", "Sync Payment Intent Status", sw_sys, w=160, h=48)
    sys_builder.add_edge(m_pay, c_wh)
    sys_builder.add_edge(m_pay, c_sync)
    
    act_stripe = sys_builder.add_actor(1140, 465, "Stripe", w=35, h=70)
    sys_builder.add_edge(act_stripe, c_wh)
    save_diagram_file('System.drawio', [sys_builder.diagram])

    # =========================================================================
    # 7. AI SERVICE (1 page: UC-42.01, UC-44.01, UC-45.01)
    # =========================================================================
    ai_builder = TemplateBuilder('AI Service 1/1', 'AI_Service_1')
    ai_builder.add_title('AI Service - Use Case Diagram (1/1) - Automated Intelligence')
    sw_ai = ai_builder.add_swimlane(130, 60, 970, 1020, "Frevia")
    act_ai = ai_builder.add_actor(40, 470, "AI Service", w=35, h=70)
    
    m_rec = ai_builder.add_module_uc(30, 240, "UC-42", "Job & Freelancer Recommendation", sw_ai, w=160, h=60)
    ai_builder.add_edge(act_ai, m_rec)
    c_rec = ai_builder.add_sub_uc(250, 246, "UC-42.01", "Recommend Jobs / Freelancers", sw_ai, w=165, h=48)
    ai_builder.add_edge(m_rec, c_rec)
    
    m_mod = ai_builder.add_module_uc(30, 470, "UC-44", "AI Content Moderation", sw_ai, w=160, h=60)
    ai_builder.add_edge(act_ai, m_mod)
    c_mod = ai_builder.add_sub_uc(250, 476, "UC-44.01", "Moderate Content by AI", sw_ai, w=165, h=48)
    ai_builder.add_edge(m_mod, c_mod)
    
    m_face = ai_builder.add_module_uc(30, 700, "UC-45", "AI Face Scan & Duplicate Detection", sw_ai, w=160, h=60)
    ai_builder.add_edge(act_ai, m_face)
    c_face = ai_builder.add_sub_uc(250, 706, "UC-45.01", "Scan Face and Detect Duplicate Identity", sw_ai, w=165, h=48)
    ai_builder.add_edge(m_face, c_face)
    save_diagram_file('AI_Service.drawio', [ai_builder.diagram])

    print("\nAll Actor diagrams successfully regenerated strictly matching Frevia_UC.csv!")

if __name__ == '__main__':
    main()
