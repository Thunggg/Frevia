"""
Generate UC-13.01 Create Contract sequence diagram:
1. Exact Auth/JWT pattern from user Image 1:
   - ref [3.1. Verify jwt]
   - alt [no Bearer token || verify failed || session is null] (401)
     alt divider [user is banned || roleId is missing || permission denied] (403)
   - then: Send request by POST method -> Controller
2. Formatting from user Image 2:
   - Natural 2-line wrapping that spans comfortably across the 2 columns
   - labelBackgroundColor=none (bg text none!)
3. Sequential service checks from Tai UC-11.04:
   - Check 1: find proposal -> alt [proposal not found] (404) vs [proposal found]
   - Check 2: check status & ownership & amount -> alt [proposal invalid] (400/403) vs [proposal valid]
   - Check 3: check existing contract -> alt [contract already exists] (409) vs [contract not exists]
   - Check 4: transaction creation -> alt [create failed] (500) vs [create success] (201)
4. Equal columns: exactly 200px apart (Client: 100, View: 300, Route: 500, Controller: 700, Service: 900, Repo: 1100, Model: 1300, Database: 1500)
"""

import xml.etree.ElementTree as ET

def generate_perfect_uc13_01():
    X_ACTOR = 100
    X_VIEW = 300
    X_ROUTE = 500
    X_CTRL = 700
    X_SVC = 900
    X_REPO = 1100
    X_MODEL = 1300
    X_DB = 1500

    TOTAL_WIDTH = 1680
    TOTAL_HEIGHT = 3300
    LIFELINE_TOP = 240
    LIFELINE_HEIGHT = 3000

    root = ET.Element('mxfile', {
        'host': 'Electron',
        'agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) draw.io/29.0.3',
        'version': '29.0.3'
    })

    diagram = ET.SubElement(root, 'diagram', {
        'id': 'contract-01-create',
        'name': 'Contract-01-create'
    })

    graph_model = ET.SubElement(diagram, 'mxGraphModel', {
        'dx': '1600',
        'dy': '900',
        'grid': '1',
        'gridSize': '10',
        'guides': '1',
        'tooltips': '1',
        'connect': '1',
        'arrows': '1',
        'fold': '1',
        'page': '1',
        'pageScale': '1',
        'pageWidth': str(TOTAL_WIDTH),
        'pageHeight': str(TOTAL_HEIGHT),
        'math': '0',
        'shadow': '0'
    })

    m_root = ET.SubElement(graph_model, 'root')
    ET.SubElement(m_root, 'mxCell', {'id': '0'})
    ET.SubElement(m_root, 'mxCell', {'id': '1', 'parent': '0'})

    def add_cell(cid, parent_id, value, style, vertex=None, edge=None, geo_attribs=None, pts=None, src_pt=None, tgt_pt=None):
        attribs = {'id': cid, 'parent': parent_id}
        if value is not None:
            attribs['value'] = value
        if style:
            attribs['style'] = style
        if vertex:
            attribs['vertex'] = '1'
        if edge:
            attribs['edge'] = '1'
        cell = ET.SubElement(m_root, 'mxCell', attribs)
        if geo_attribs:
            g_elem = ET.SubElement(cell, 'mxGeometry', geo_attribs)
            if src_pt:
                ET.SubElement(g_elem, 'mxPoint', {'x': str(src_pt[0]), 'y': str(src_pt[1]), 'as': 'sourcePoint'})
            if tgt_pt:
                ET.SubElement(g_elem, 'mxPoint', {'x': str(tgt_pt[0]), 'y': str(tgt_pt[1]), 'as': 'targetPoint'})
            if pts:
                arr = ET.SubElement(g_elem, 'Array', {'as': 'points'})
                for p in pts:
                    ET.SubElement(arr, 'mxPoint', {'x': str(p[0]), 'y': str(p[1])})
        return cell

    # Styles (Strictly B&W, bg none!)
    LL_STYLE = "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;dropTarget=0;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;fillColor=#ffffff;strokeColor=#000000;fontColor=#000000;fontSize=12;fontStyle=1;newEdgeStyle={\"curved\":0,\"rounded\":0};"
    BAR_STYLE = "html=1;points=[[0,0,0,0,5],[0,1,0,0,-5],[1,0,0,0,5],[1,1,0,0,-5]];perimeter=orthogonalPerimeter;outlineConnect=0;targetShapes=umlLifeline;portConstraint=eastwest;fillColor=#ffffff;strokeColor=#000000;newEdgeStyle={\"curved\":0,\"rounded\":0};"
    SYNC_STYLE = "html=1;verticalAlign=bottom;endArrow=block;curved=0;rounded=0;strokeColor=#000000;fontSize=11;whiteSpace=wrap;"
    REPLY_STYLE = "html=1;verticalAlign=bottom;endArrow=open;dashed=1;endSize=8;curved=0;rounded=0;fontSize=11;strokeColor=#000000;whiteSpace=wrap;"
    FRAME_STYLE = "shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=60;height=25;fontSize=11;fillColor=none;strokeColor=#000000;fontStyle=1;"
    FRAME_LABEL_STYLE = "text;html=1;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=11;fillColor=none;strokeColor=none;fontColor=#000000;fontStyle=1;"
    DIV_STYLE = "endArrow=none;dashed=1;html=1;rounded=0;strokeColor=#000000;"

    def add_msg(mid, src_x, tgt_x, y, label, is_reply=False):
        style = REPLY_STYLE if is_reply else SYNC_STYLE
        add_cell(mid, '1', label, style, edge=True,
                 geo_attribs={'relative': '1', 'as': 'geometry'},
                 src_pt=(src_x, y), tgt_pt=(tgt_x, y))

    def add_self_call(mid, col_x, y, label, dy=35, dx=45):
        add_cell(mid, '1', '', SYNC_STYLE, edge=True,
                 geo_attribs={'relative': '1', 'as': 'geometry'},
                 src_pt=(col_x + 5, y), tgt_pt=(col_x + 5, y + dy),
                 pts=[(col_x + dx, y), (col_x + dx, y + dy)])
        add_cell(f"{mid}_lbl", '1', label,
                 'text;html=1;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=11;fontColor=#000000;',
                 vertex=True, geo_attribs={'x': str(col_x + dx + 5), 'y': str(y + 2), 'width': '140', 'height': str(dy - 4), 'as': 'geometry'})

    # 1. Lifelines (Width = 140, Delta X = 200, Perfectly Equal!)
    add_cell('actor', '1', 'Client',
             'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;whiteSpace=wrap;fillColor=#ffffff;strokeColor=#000000;fontColor=#000000;fontStyle=1;',
             vertex=True, geo_attribs={'x': str(X_ACTOR - 15), 'y': '150', 'width': '30', 'height': '60', 'as': 'geometry'})
    add_cell('actor_line', '1', '', DIV_STYLE, edge=True,
             geo_attribs={'relative': '1', 'as': 'geometry'},
             src_pt=(X_ACTOR, 220), tgt_pt=(X_ACTOR, LIFELINE_TOP + LIFELINE_HEIGHT))
    add_cell('bar_actor_0', '1', '', BAR_STYLE, vertex=True,
             geo_attribs={'x': str(X_ACTOR - 5), 'y': '320', 'width': '10', 'height': str(LIFELINE_HEIGHT - 120), 'as': 'geometry'})

    add_cell('ll_view', '1', ':ContractView', LL_STYLE, vertex=True,
             geo_attribs={'x': str(X_VIEW - 70), 'y': str(LIFELINE_TOP), 'width': '140', 'height': str(LIFELINE_HEIGHT), 'as': 'geometry'})
    add_cell('bar_view_0', 'll_view', '', BAR_STYLE, vertex=True,
             geo_attribs={'x': '65', 'y': '80', 'width': '10', 'height': str(LIFELINE_HEIGHT - 120), 'as': 'geometry'})

    add_cell('ll_route', '1', ':ContractRoute', LL_STYLE, vertex=True,
             geo_attribs={'x': str(X_ROUTE - 70), 'y': str(LIFELINE_TOP), 'width': '140', 'height': str(LIFELINE_HEIGHT), 'as': 'geometry'})
    add_cell('bar_route_0', 'll_route', '', BAR_STYLE, vertex=True,
             geo_attribs={'x': '65', 'y': '270', 'width': '10', 'height': str(LIFELINE_HEIGHT - 310), 'as': 'geometry'})

    add_cell('ll_controller', '1', ':ContractController', LL_STYLE, vertex=True,
             geo_attribs={'x': str(X_CTRL - 70), 'y': str(LIFELINE_TOP), 'width': '140', 'height': str(LIFELINE_HEIGHT), 'as': 'geometry'})
    add_cell('bar_controller_0', 'll_controller', '', BAR_STYLE, vertex=True,
             geo_attribs={'x': '65', 'y': '630', 'width': '10', 'height': str(LIFELINE_HEIGHT - 670), 'as': 'geometry'})

    add_cell('ll_service', '1', ':ContractService', LL_STYLE, vertex=True,
             geo_attribs={'x': str(X_SVC - 70), 'y': str(LIFELINE_TOP), 'width': '140', 'height': str(LIFELINE_HEIGHT), 'as': 'geometry'})
    add_cell('bar_service_0', 'll_service', '', BAR_STYLE, vertex=True,
             geo_attribs={'x': '65', 'y': '685', 'width': '10', 'height': str(LIFELINE_HEIGHT - 725), 'as': 'geometry'})

    add_cell('ll_repo', '1', ':ContractRepo', LL_STYLE, vertex=True,
             geo_attribs={'x': str(X_REPO - 70), 'y': str(LIFELINE_TOP), 'width': '140', 'height': str(LIFELINE_HEIGHT), 'as': 'geometry'})
    add_cell('bar_repo_0', 'll_repo', '', BAR_STYLE, vertex=True,
             geo_attribs={'x': '65', 'y': '740', 'width': '10', 'height': '270', 'as': 'geometry'})
    add_cell('bar_repo_1', 'll_repo', '', BAR_STYLE, vertex=True,
             geo_attribs={'x': '65', 'y': '1970', 'width': '10', 'height': '240', 'as': 'geometry'})
    add_cell('bar_repo_2', 'll_repo', '', BAR_STYLE, vertex=True,
             geo_attribs={'x': '65', 'y': '2470', 'width': '10', 'height': '280', 'as': 'geometry'})

    add_cell('ll_model', '1', ':PrismaService', LL_STYLE, vertex=True,
             geo_attribs={'x': str(X_MODEL - 70), 'y': str(LIFELINE_TOP), 'width': '140', 'height': str(LIFELINE_HEIGHT), 'as': 'geometry'})
    add_cell('bar_model_0', 'll_model', '', BAR_STYLE, vertex=True,
             geo_attribs={'x': '65', 'y': '795', 'width': '10', 'height': '170', 'as': 'geometry'})
    add_cell('bar_model_1', 'll_model', '', BAR_STYLE, vertex=True,
             geo_attribs={'x': '65', 'y': '2015', 'width': '10', 'height': '160', 'as': 'geometry'})
    add_cell('bar_model_2', 'll_model', '', BAR_STYLE, vertex=True,
             geo_attribs={'x': '65', 'y': '2515', 'width': '10', 'height': '200', 'as': 'geometry'})

    add_cell('db_icon', '1', '',
             'strokeWidth=2;html=1;shape=mxgraph.flowchart.database;whiteSpace=wrap;fillColor=#ffffff;strokeColor=#000000;',
             vertex=True, geo_attribs={'x': str(X_DB - 30), 'y': '170', 'width': '60', 'height': '60', 'as': 'geometry'})
    add_cell('db_label', '1', 'Database',
             'text;html=1;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontColor=#000000;fontSize=12;fontStyle=1;',
             vertex=True, geo_attribs={'x': str(X_DB - 40), 'y': '232', 'width': '80', 'height': '24', 'as': 'geometry'})
    add_cell('db_line', '1', '', DIV_STYLE, edge=True,
             geo_attribs={'relative': '1', 'as': 'geometry'},
             src_pt=(X_DB, 260), tgt_pt=(X_DB, LIFELINE_TOP + LIFELINE_HEIGHT))
    add_cell('bar_db_0', '1', '', BAR_STYLE, vertex=True,
             geo_attribs={'x': str(X_DB - 5), 'y': '1080', 'width': '10', 'height': '65', 'as': 'geometry'})
    add_cell('bar_db_1', '1', '', BAR_STYLE, vertex=True,
             geo_attribs={'x': str(X_DB - 5), 'y': '2300', 'width': '10', 'height': '65', 'as': 'geometry'})
    add_cell('bar_db_2', '1', '', BAR_STYLE, vertex=True,
             geo_attribs={'x': str(X_DB - 5), 'y': '2800', 'width': '10', 'height': '70', 'as': 'geometry'})

    # ================= MESSAGES & FLOW =================
    # Step 1: Actor fills form
    add_msg('m1', X_ACTOR + 5, X_VIEW - 5, 330,
            "1. Fill in contract info<br>(proposalId, totalAmount, terms, expiresAt, milestones)")

    # Step 2: View validates form
    add_self_call('val', X_VIEW, 370, "2. Validate form data", dy=35, dx=45)

    # Frame: opt [invalid form data]
    add_cell('fr_opt_data', '1', 'opt', FRAME_STYLE, vertex=True,
             geo_attribs={'x': '10', 'y': '435', 'width': '340', 'height': '95', 'as': 'geometry'})
    add_cell('fr_opt_data_lbl', '1', '[invalid form data]', FRAME_LABEL_STYLE, vertex=True,
             geo_attribs={'x': '80', 'y': '435', 'width': '130', 'height': '25', 'as': 'geometry'})
    add_msg('val_err', X_VIEW - 5, X_ACTOR + 5, 480,
            "2.1.1. Display validation error", is_reply=True)

    # Step 3: POST /contracts
    add_msg('m3', X_VIEW + 5, X_ROUTE - 5, 550,
            "3. POST /contracts (CreateContractBodyDTO)")

    # Frame: ref [3.1. Verify jwt] (Matching Image 1)
    add_cell('fr_ref_jwt', '1', 'ref',
             'shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=50;height=22;fontSize=12;fillColor=none;strokeColor=#000000;',
             vertex=True, geo_attribs={'x': '430', 'y': '595', 'width': '220', 'height': '50', 'as': 'geometry'})
    add_cell('fr_ref_jwt_lbl', '1', '3.1. Verify jwt',
             'text;html=1;whiteSpace=wrap;strokeColor=none;fontSize=12;align=center;verticalAlign=middle;fillColor=none;fontColor=#000000;',
             vertex=True, geo_attribs={'x': '440', 'y': '607', 'width': '200', 'height': '28', 'as': 'geometry'})

    # Frame: alt [no Bearer token || verify failed || session is null] (Matching Image 1)
    add_cell('fr_alt_auth', '1', 'alt', FRAME_STYLE, vertex=True,
             geo_attribs={'x': '10', 'y': '665', 'width': '520', 'height': '190', 'as': 'geometry'})
    add_cell('fr_alt_auth_lbl1', '1', '[no Bearer token || verify failed || session is null]', FRAME_LABEL_STYLE, vertex=True,
             geo_attribs={'x': '80', 'y': '665', 'width': '300', 'height': '25', 'as': 'geometry'})
    add_msg('m_auth_401', X_ROUTE - 5, X_VIEW + 5, 710,
            "3.1.1. Return 401 response", is_reply=True)
    add_msg('m_auth_401_ui', X_VIEW - 5, X_ACTOR + 5, 745,
            "3.1.2. Display error message", is_reply=True)

    add_cell('div_alt_auth', '1', '', DIV_STYLE, edge=True,
             geo_attribs={'relative': '1', 'as': 'geometry'},
             src_pt=('10', '765'), tgt_pt=('530', '765'))
    add_cell('fr_alt_auth_lbl2', '1', '[user is banned || roleId is missing || permission denied]', FRAME_LABEL_STYLE, vertex=True,
             geo_attribs={'x': '80', 'y': '770', 'width': '350', 'height': '25', 'as': 'geometry'})
    add_msg('m_auth_403', X_ROUTE - 5, X_VIEW + 5, 805,
            "3.2.1. Return 403 response", is_reply=True)
    add_msg('m_auth_403_ui', X_VIEW - 5, X_ACTOR + 5, 840,
            "3.2.2. Display error message", is_reply=True)

    # Step 3 -> 4: Route calls Controller (Matching Image 1: Send request by POST method)
    add_msg('m4', X_ROUTE + 5, X_CTRL - 5, 880,
            "3. Send request by POST method")
    add_msg('m5', X_CTRL + 5, X_SVC - 5, 930,
            "4. createContract(@UserActive('userId'), body)")

    # Step 5: Service queries proposal
    add_msg('m6', X_SVC + 5, X_REPO - 5, 985,
            "5. findProposalWithJob(proposalId)")
    add_msg('m7', X_REPO + 5, X_MODEL - 5, 1035,
            "6. prisma.proposal.findUnique({where:<br>{id}, include: {job}})")
    add_msg('m8', X_MODEL + 5, X_DB - 5, 1085,
            "7. Execute SELECT query")
    add_msg('m9', X_DB - 5, X_MODEL + 5, 1130,
            "8. Return query result", is_reply=True)
    add_msg('m10', X_MODEL - 5, X_REPO + 5, 1170,
            "9. Return proposal or null", is_reply=True)
    add_msg('m11', X_REPO - 5, X_SVC + 5, 1210,
            "10. Return proposal or null", is_reply=True)

    # Step 11: Service self-call: Handle find proposal result (Sequential Check 1)
    add_self_call('chk_prop', X_SVC, 1245, "11. Handle find proposal result", dy=35, dx=45)

    # Frame: alt [proposal not found] (Sequential Check 1)
    add_cell('fr_alt_prop', '1', 'alt', FRAME_STYLE, vertex=True,
             geo_attribs={'x': '10', 'y': '1295', 'width': '1510', 'height': '1820', 'as': 'geometry'})
    add_cell('fr_alt_prop_lbl1', '1', '[proposal not found]', FRAME_LABEL_STYLE, vertex=True,
             geo_attribs={'x': '80', 'y': '1295', 'width': '180', 'height': '25', 'as': 'geometry'})
    add_msg('err_404_svc', X_SVC - 5, X_CTRL + 5, 1340,
            "11.1.1. throw 404 ProposalNotFound", is_reply=True)
    add_msg('err_404_ctrl', X_CTRL - 5, X_ROUTE + 5, 1380,
            "11.1.2. Return 404 response", is_reply=True)
    add_msg('err_404_rt', X_ROUTE - 5, X_VIEW + 5, 1420,
            "11.1.3. Return 404 response", is_reply=True)
    add_msg('err_404_ui', X_VIEW - 5, X_ACTOR + 5, 1460,
            "11.1.4. Display error message", is_reply=True)

    # Divider: [proposal found]
    add_cell('div_alt_prop', '1', '', DIV_STYLE, edge=True,
             geo_attribs={'relative': '1', 'as': 'geometry'},
             src_pt=('10', '1505'), tgt_pt=('1520', '1505'))
    add_cell('fr_alt_prop_lbl2', '1', '[proposal found]', FRAME_LABEL_STYLE, vertex=True,
             geo_attribs={'x': '80', 'y': '1510', 'width': '150', 'height': '25', 'as': 'geometry'})

    # Step 12: Check proposal status & ownership & amount (Sequential Check 2)
    add_self_call('chk_rules', X_SVC, 1545, "11.2.1. Check proposal status,<br>client ownership &amp; amount", dy=40, dx=45)

    # Frame: alt [proposal invalid] vs [proposal valid] (Sequential Check 2)
    add_cell('fr_alt_rules', '1', 'alt', FRAME_STYLE, vertex=True,
             geo_attribs={'x': '20', 'y': '1605', 'width': '1490', 'height': '1480', 'as': 'geometry'})
    add_cell('fr_alt_rules_lbl1', '1', '[status not allowed || clientId != job.clientId || positions filled || amount mismatch]', FRAME_LABEL_STYLE, vertex=True,
             geo_attribs={'x': '90', 'y': '1605', 'width': '520', 'height': '25', 'as': 'geometry'})
    add_msg('err_rules_svc', X_SVC - 5, X_CTRL + 5, 1655,
            "11.2.1.1.1. throw 400/403 InvalidProposalException", is_reply=True)
    add_msg('err_rules_ctrl', X_CTRL - 5, X_ROUTE + 5, 1695,
            "11.2.1.1.2. Return 400/403 response", is_reply=True)
    add_msg('err_rules_rt', X_ROUTE - 5, X_VIEW + 5, 1735,
            "11.2.1.1.3. Return 400/403 response", is_reply=True)
    add_msg('err_rules_ui', X_VIEW - 5, X_ACTOR + 5, 1775,
            "11.2.1.1.4. Display error message", is_reply=True)

    # Divider: [proposal is valid & actionable]
    add_cell('div_alt_rules', '1', '', DIV_STYLE, edge=True,
             geo_attribs={'relative': '1', 'as': 'geometry'},
             src_pt=('20', '1820'), tgt_pt=('1510', '1820'))
    add_cell('fr_alt_rules_lbl2', '1', '[proposal is valid &amp; actionable]', FRAME_LABEL_STYLE, vertex=True,
             geo_attribs={'x': '90', 'y': '1825', 'width': '250', 'height': '25', 'as': 'geometry'})

    # Step 13: Check existing contract (Sequential Check 3)
    add_msg('m_chk_exist', X_SVC + 5, X_REPO - 5, 1865,
            "11.2.1.2.1. findContractByProposalId(proposalId)")
    add_msg('m_chk_exist_m', X_REPO + 5, X_MODEL - 5, 1910,
            "11.2.1.2.2. prisma.contract.findUnique({where:<br>{proposalId}})")
    add_msg('m_chk_exist_db', X_MODEL + 5, X_DB - 5, 1960,
            "11.2.1.2.3. Execute SELECT query")
    add_msg('m_chk_exist_r1', X_DB - 5, X_MODEL + 5, 2005,
            "11.2.1.2.4. Return query result", is_reply=True)
    add_msg('m_chk_exist_r2', X_MODEL - 5, X_REPO + 5, 2045,
            "11.2.1.2.5. Return contract or null", is_reply=True)
    add_msg('m_chk_exist_r3', X_REPO - 5, X_SVC + 5, 2085,
            "11.2.1.2.6. Return contract or null", is_reply=True)

    add_self_call('chk_exist_h', X_SVC, 2120, "11.2.1.2.7. Handle existing contract check", dy=35, dx=45)

    # Frame: alt [contract already exists] vs [contract not exists] (Sequential Check 3)
    add_cell('fr_alt_exist', '1', 'alt', FRAME_STYLE, vertex=True,
             geo_attribs={'x': '30', 'y': '2170', 'width': '1470', 'height': '890', 'as': 'geometry'})
    add_cell('fr_alt_exist_lbl1', '1', '[contract already exists for proposal]', FRAME_LABEL_STYLE, vertex=True,
             geo_attribs={'x': '100', 'y': '2170', 'width': '270', 'height': '25', 'as': 'geometry'})
    add_msg('err_409_svc', X_SVC - 5, X_CTRL + 5, 2215,
            "11.2.1.2.7.1. throw 409 ContractAlreadyExists", is_reply=True)
    add_msg('err_409_ctrl', X_CTRL - 5, X_ROUTE + 5, 2255,
            "11.2.1.2.7.2. Return 409 response", is_reply=True)
    add_msg('err_409_rt', X_ROUTE - 5, X_VIEW + 5, 2295,
            "11.2.1.2.7.3. Return 409 response", is_reply=True)
    add_msg('err_409_ui', X_VIEW - 5, X_ACTOR + 5, 2335,
            "11.2.1.2.7.4. Display error message", is_reply=True)

    # Divider: [contract not exists]
    add_cell('div_alt_exist', '1', '', DIV_STYLE, edge=True,
             geo_attribs={'relative': '1', 'as': 'geometry'},
             src_pt=('30', '2380'), tgt_pt=('1500', '2380'))
    add_cell('fr_alt_exist_lbl2', '1', '[contract not exists -&gt; proceed create]', FRAME_LABEL_STYLE, vertex=True,
             geo_attribs={'x': '100', 'y': '2385', 'width': '270', 'height': '25', 'as': 'geometry'})

    # Step 14: Execution inside transaction (Sequential Step 4)
    add_msg('m_create_repo', X_SVC + 5, X_REPO - 5, 2425,
            "11.2.1.2.7.5. createContract(body, clientId, freelancerId, jobId)")
    add_msg('m_create_m', X_REPO + 5, X_MODEL - 5, 2475,
            "11.2.1.2.7.6. prisma.$transaction(async tx =&gt; {<br>tx.contract.create, tx.milestone.createMany})")
    add_msg('m_create_db', X_MODEL + 5, X_DB - 5, 2530,
            "11.2.1.2.7.7. Execute INSERT query (contract &amp; milestones)")
    add_msg('m_create_db_r', X_DB - 5, X_MODEL + 5, 2580,
            "11.2.1.2.7.8. Return created records", is_reply=True)
    add_msg('m_create_m_r', X_MODEL - 5, X_REPO + 5, 2620,
            "11.2.1.2.7.9. Return created contract", is_reply=True)
    add_msg('m_create_repo_r', X_REPO - 5, X_SVC + 5, 2660,
            "11.2.1.2.7.10. Return contract entity", is_reply=True)

    add_self_call('chk_create_h', X_SVC, 2695, "11.2.1.2.7.11. Handle create result", dy=35, dx=45)

    # Frame: alt [create failed] vs [create success] (Sequential Check 4)
    add_cell('fr_alt_create', '1', 'alt', FRAME_STYLE, vertex=True,
             geo_attribs={'x': '40', 'y': '2745', 'width': '1450', 'height': '290', 'as': 'geometry'})
    add_cell('fr_alt_create_lbl1', '1', '[create failed]', FRAME_LABEL_STYLE, vertex=True,
             geo_attribs={'x': '110', 'y': '2745', 'width': '140', 'height': '25', 'as': 'geometry'})
    add_msg('err_500_svc', X_SVC - 5, X_CTRL + 5, 2785,
            "11.2.1.2.7.11.1. throw 500 CreateContractFailed", is_reply=True)
    add_msg('err_500_ctrl', X_CTRL - 5, X_ROUTE + 5, 2825,
            "11.2.1.2.7.11.2. Return 500 response", is_reply=True)
    add_msg('err_500_rt', X_ROUTE - 5, X_VIEW + 5, 2865,
            "11.2.1.2.7.11.3. Return 500 response", is_reply=True)
    add_msg('err_500_ui', X_VIEW - 5, X_ACTOR + 5, 2905,
            "11.2.1.2.7.11.4. Display error message", is_reply=True)

    # Divider: [create success]
    add_cell('div_alt_create', '1', '', DIV_STYLE, edge=True,
             geo_attribs={'relative': '1', 'as': 'geometry'},
             src_pt=('40', '2945'), tgt_pt=('1490', '2945'))
    add_cell('fr_alt_create_lbl2', '1', '[create success]', FRAME_LABEL_STYLE, vertex=True,
             geo_attribs={'x': '110', 'y': '2950', 'width': '140', 'height': '25', 'as': 'geometry'})
    add_msg('succ_svc', X_SVC - 5, X_CTRL + 5, 2985,
            "11.2.1.2.7.11.5. Return created contract data", is_reply=True)
    add_msg('succ_ctrl', X_CTRL - 5, X_ROUTE + 5, 3025,
            "11.2.1.2.7.11.6. Return 201 Created (DTO)", is_reply=True)
    add_msg('succ_rt', X_ROUTE - 5, X_VIEW + 5, 3065,
            "11.2.1.2.7.11.7. Return 201 Created", is_reply=True)
    add_msg('succ_ui', X_VIEW - 5, X_ACTOR + 5, 3105,
            "11.2.1.2.7.11.8. Display success message &amp; redirect", is_reply=True)

    ET.indent(root, space='  ')
    return ET.tostring(root, encoding='utf-8', xml_declaration=True).decode('utf-8')

xml_content = generate_perfect_uc13_01()
target_file = 'sequence-diagrams-remake/ntin/UC-13.01-create-contract.drawio'
with open(target_file, 'w', encoding='utf-8') as f:
    f.write(xml_content)
print(f"Successfully generated {target_file} ({len(xml_content)} bytes)")
