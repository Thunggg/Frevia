"""
Generate clean, monochrome, perfectly spaced UC-13.01 sequence diagram
Matching the exact conventions of UC-13.02 with 8 evenly spaced lifelines:
Client (80), :ContractView (280), :ContractRoute (480), :ContractController (680),
:ContractService (880), :ContractRepo (1080), :ContractModel (1280), Database (1480).
All delta X = 200px.
Zero colors (black & white only).
All edges use sourcePoint & targetPoint.
"""

import xml.etree.ElementTree as ET

def build_monochrome_uc13_01():
    # Lifeline X centers (all delta = 200px)
    X_ACTOR = 80
    X_VIEW = 280
    X_ROUTE = 480
    X_CTRL = 680
    X_SVC = 880
    X_REPO = 1080
    X_MODEL = 1280
    X_DB = 1480

    TOTAL_WIDTH = 1654
    TOTAL_HEIGHT = 2700
    LIFELINE_TOP = 240
    LIFELINE_HEIGHT = 2360

    root = ET.Element('mxfile', {
        'host': 'Electron',
        'agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) draw.io/29.0.3 Chrome/140.0.7339.249 Electron/38.7.0 Safari/537.36',
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

    def add_cell(cid, parent_id, value, style, vertex=None, edge=None, source=None, target=None, geo_attribs=None, pts=None, src_pt=None, tgt_pt=None):
        attribs = {'id': cid, 'parent': parent_id}
        if value is not None:
            attribs['value'] = value
        if style:
            attribs['style'] = style
        if vertex:
            attribs['vertex'] = '1'
        if edge:
            attribs['edge'] = '1'
        if source:
            attribs['source'] = source
        if target:
            attribs['target'] = target
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

    # Frames (Monochrome, fillColor=none)
    # opt [invalid data]
    add_cell('opt_data_frame', '1', 'opt',
             'shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=70;height=30;fontSize=12;fillColor=none;strokeColor=#000000;',
             vertex=True, geo_attribs={'x': '10', 'y': '440', 'width': '340', 'height': '105', 'as': 'geometry'})
    add_cell('opt_data_label', '1', '[invalid data]',
             'text;html=1;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=12;fillColor=none;strokeColor=none;fontColor=#000000;',
             vertex=True, geo_attribs={'x': '90', 'y': '440', 'width': '120', 'height': '30', 'as': 'geometry'})

    # ref [Verify JWT]
    add_cell('ref_frame', '1', 'ref',
             'shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=50;height=22;fontSize=12;fillColor=none;strokeColor=#000000;',
             vertex=True, geo_attribs={'x': '370', 'y': '610', 'width': '220', 'height': '56', 'as': 'geometry'})
    add_cell('ref_label', '1', '3.1. Verify jwt &amp; check permission',
             'text;html=1;whiteSpace=wrap;strokeColor=none;fontSize=12;align=center;verticalAlign=middle;fillColor=none;fontColor=#000000;',
             vertex=True, geo_attribs={'x': '380', 'y': '623', 'width': '200', 'height': '30', 'as': 'geometry'})

    # opt [invalid token]
    add_cell('opt_token_frame', '1', 'opt',
             'shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=70;height=30;fontSize=12;fillColor=none;strokeColor=#000000;',
             vertex=True, geo_attribs={'x': '10', 'y': '690', 'width': '500', 'height': '125', 'as': 'geometry'})
    add_cell('opt_token_label', '1', '[invalid token / unauthorized]',
             'text;html=1;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=12;fillColor=none;strokeColor=none;fontColor=#000000;',
             vertex=True, geo_attribs={'x': '90', 'y': '690', 'width': '180', 'height': '30', 'as': 'geometry'})

    # alt 1 [invalid proposal / amount mismatch]
    add_cell('alt1_frame', '1', 'alt',
             'shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=60;height=30;fontSize=12;fillColor=none;strokeColor=#000000;',
             vertex=True, geo_attribs={'x': '10', 'y': '1270', 'width': '1510', 'height': '1270', 'as': 'geometry'})
    add_cell('alt1_l1', '1', '[proposal not found / not actionable / forbidden / amount mismatch]',
             'text;html=1;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=12;fillColor=none;strokeColor=none;fontColor=#000000;fontStyle=1;',
             vertex=True, geo_attribs={'x': '80', 'y': '1270', 'width': '450', 'height': '30', 'as': 'geometry'})
    add_cell('alt1_div', '1', '',
             'endArrow=none;dashed=1;html=1;rounded=0;strokeColor=#000000;',
             edge=True, geo_attribs={'relative': '1', 'as': 'geometry'},
             src_pt=('10', '1490'), tgt_pt=('1520', '1490'))
    add_cell('alt1_l2', '1', '[proposal is valid &amp; actionable]',
             'text;html=1;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=12;fillColor=none;strokeColor=none;fontColor=#000000;fontStyle=1;',
             vertex=True, geo_attribs={'x': '80', 'y': '1495', 'width': '250', 'height': '30', 'as': 'geometry'})

    # alt 2 [contract already exists] vs [create contract success]
    add_cell('alt2_frame', '1', 'alt',
             'shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=60;height=30;fontSize=12;fillColor=none;strokeColor=#000000;',
             vertex=True, geo_attribs={'x': '20', 'y': '1760', 'width': '1480', 'height': '760', 'as': 'geometry'})
    add_cell('alt2_l1', '1', '[contract already exists for proposal]',
             'text;html=1;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=12;fillColor=none;strokeColor=none;fontColor=#000000;fontStyle=1;',
             vertex=True, geo_attribs={'x': '90', 'y': '1760', 'width': '260', 'height': '30', 'as': 'geometry'})
    add_cell('alt2_div', '1', '',
             'endArrow=none;dashed=1;html=1;rounded=0;strokeColor=#000000;',
             edge=True, geo_attribs={'relative': '1', 'as': 'geometry'},
             src_pt=('20', '1980'), tgt_pt=('1500', '1980'))
    add_cell('alt2_l2', '1', '[contract not exists -&gt; create contract success]',
             'text;html=1;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=12;fillColor=none;strokeColor=none;fontColor=#000000;fontStyle=1;',
             vertex=True, geo_attribs={'x': '90', 'y': '1985', 'width': '300', 'height': '30', 'as': 'geometry'})

    # Lifelines: All white, strokeColor=#000000
    LL_STYLE = "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;dropTarget=0;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;fillColor=#ffffff;strokeColor=#000000;fontColor=#000000;fontSize=12;fontStyle=1;newEdgeStyle={\"curved\":0,\"rounded\":0};"
    BAR_STYLE = "html=1;points=[[0,0,0,0,5],[0,1,0,0,-5],[1,0,0,0,5],[1,1,0,0,-5]];perimeter=orthogonalPerimeter;outlineConnect=0;targetShapes=umlLifeline;portConstraint=eastwest;fillColor=#ffffff;strokeColor=#000000;newEdgeStyle={\"curved\":0,\"rounded\":0};"

    # 1. Actor: Client
    add_cell('actor', '1', 'Client',
             'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;whiteSpace=wrap;fillColor=#ffffff;strokeColor=#000000;fontColor=#000000;fontStyle=1;',
             vertex=True, geo_attribs={'x': str(X_ACTOR - 15), 'y': '150', 'width': '30', 'height': '60', 'as': 'geometry'})
    add_cell('actor_line', '1', '',
             'endArrow=none;dashed=1;html=1;rounded=0;strokeColor=#000000;',
             edge=True, geo_attribs={'relative': '1', 'as': 'geometry'},
             src_pt=(str(X_ACTOR), '220'), tgt_pt=(str(X_ACTOR), str(LIFELINE_TOP + LIFELINE_HEIGHT)))
    add_cell('bar_actor_0', '1', '', BAR_STYLE,
             vertex=True, geo_attribs={'x': str(X_ACTOR - 5), 'y': '320', 'width': '10', 'height': '2200', 'as': 'geometry'})

    # 2. :ContractView
    add_cell('ll_view', '1', ':ContractView', LL_STYLE,
             vertex=True, geo_attribs={'x': str(X_VIEW - 70), 'y': str(LIFELINE_TOP), 'width': '140', 'height': str(LIFELINE_HEIGHT), 'as': 'geometry'})
    add_cell('bar_view_0', 'll_view', '', BAR_STYLE,
             vertex=True, geo_attribs={'x': '65', 'y': '80', 'width': '10', 'height': '2190', 'as': 'geometry'})

    # 3. :ContractRoute
    add_cell('ll_route', '1', ':ContractRoute', LL_STYLE,
             vertex=True, geo_attribs={'x': str(X_ROUTE - 70), 'y': str(LIFELINE_TOP), 'width': '140', 'height': str(LIFELINE_HEIGHT), 'as': 'geometry'})
    add_cell('bar_route_0', 'll_route', '', BAR_STYLE,
             vertex=True, geo_attribs={'x': '65', 'y': '310', 'width': '10', 'height': '1940', 'as': 'geometry'})

    # 4. :ContractController
    add_cell('ll_controller', '1', ':ContractController', LL_STYLE,
             vertex=True, geo_attribs={'x': str(X_CTRL - 70), 'y': str(LIFELINE_TOP), 'width': '140', 'height': str(LIFELINE_HEIGHT), 'as': 'geometry'})
    add_cell('bar_controller_0', 'll_controller', '', BAR_STYLE,
             vertex=True, geo_attribs={'x': '65', 'y': '570', 'width': '10', 'height': '1640', 'as': 'geometry'})

    # 5. :ContractService
    add_cell('ll_service', '1', ':ContractService', LL_STYLE,
             vertex=True, geo_attribs={'x': str(X_SVC - 70), 'y': str(LIFELINE_TOP), 'width': '140', 'height': str(LIFELINE_HEIGHT), 'as': 'geometry'})
    add_cell('bar_service_0', 'll_service', '', BAR_STYLE,
             vertex=True, geo_attribs={'x': '65', 'y': '625', 'width': '10', 'height': '1550', 'as': 'geometry'})

    # 6. :ContractRepo
    add_cell('ll_repo', '1', ':ContractRepo', LL_STYLE,
             vertex=True, geo_attribs={'x': str(X_REPO - 70), 'y': str(LIFELINE_TOP), 'width': '140', 'height': str(LIFELINE_HEIGHT), 'as': 'geometry'})
    add_cell('bar_repo_0', 'll_repo', '', BAR_STYLE,
             vertex=True, geo_attribs={'x': '65', 'y': '680', 'width': '10', 'height': '270', 'as': 'geometry'})
    add_cell('bar_repo_1', 'll_repo', '', BAR_STYLE,
             vertex=True, geo_attribs={'x': '65', 'y': '1290', 'width': '10', 'height': '240', 'as': 'geometry'})
    add_cell('bar_repo_2', 'll_repo', '', BAR_STYLE,
             vertex=True, geo_attribs={'x': '65', 'y': '1795', 'width': '10', 'height': '280', 'as': 'geometry'})

    # 7. :ContractModel
    add_cell('ll_model', '1', ':ContractModel', LL_STYLE,
             vertex=True, geo_attribs={'x': str(X_MODEL - 70), 'y': str(LIFELINE_TOP), 'width': '140', 'height': str(LIFELINE_HEIGHT), 'as': 'geometry'})
    add_cell('bar_model_0', 'll_model', '', BAR_STYLE,
             vertex=True, geo_attribs={'x': '65', 'y': '735', 'width': '10', 'height': '170', 'as': 'geometry'})
    add_cell('bar_model_1', 'll_model', '', BAR_STYLE,
             vertex=True, geo_attribs={'x': '65', 'y': '1335', 'width': '10', 'height': '160', 'as': 'geometry'})
    add_cell('bar_model_2', 'll_model', '', BAR_STYLE,
             vertex=True, geo_attribs={'x': '65', 'y': '1840', 'width': '10', 'height': '200', 'as': 'geometry'})

    # 8. Database
    add_cell('db_icon', '1', '',
             'strokeWidth=2;html=1;shape=mxgraph.flowchart.database;whiteSpace=wrap;fillColor=#ffffff;strokeColor=#000000;',
             vertex=True, geo_attribs={'x': str(X_DB - 30), 'y': '170', 'width': '60', 'height': '60', 'as': 'geometry'})
    add_cell('db_label', '1', 'Database',
             'text;html=1;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontColor=#000000;fontSize=12;fontStyle=1;',
             vertex=True, geo_attribs={'x': str(X_DB - 40), 'y': '232', 'width': '80', 'height': '24', 'as': 'geometry'})
    add_cell('db_line', '1', '',
             'endArrow=none;dashed=1;html=1;rounded=0;strokeColor=#000000;',
             edge=True, geo_attribs={'relative': '1', 'as': 'geometry'},
             src_pt=(str(X_DB), '260'), tgt_pt=(str(X_DB), str(LIFELINE_TOP + LIFELINE_HEIGHT)))
    add_cell('bar_db_0', '1', '', BAR_STYLE,
             vertex=True, geo_attribs={'x': str(X_DB - 5), 'y': '1020', 'width': '10', 'height': '65', 'as': 'geometry'})
    add_cell('bar_db_1', '1', '', BAR_STYLE,
             vertex=True, geo_attribs={'x': str(X_DB - 5), 'y': '1620', 'width': '10', 'height': '65', 'as': 'geometry'})
    add_cell('bar_db_2', '1', '', BAR_STYLE,
             vertex=True, geo_attribs={'x': str(X_DB - 5), 'y': '2120', 'width': '10', 'height': '70', 'as': 'geometry'})

    # Message styles (Monochrome)
    SYNC_STYLE = "html=1;verticalAlign=bottom;endArrow=block;curved=0;rounded=0;strokeColor=#000000;labelBackgroundColor=#ffffff;fontSize=11;whiteSpace=wrap;"
    REPLY_STYLE = "html=1;verticalAlign=bottom;endArrow=open;dashed=1;endSize=8;curved=0;rounded=0;fontSize=11;strokeColor=#000000;labelBackgroundColor=#ffffff;whiteSpace=wrap;"

    def add_msg(mid, src_x, tgt_x, y, label, is_reply=False):
        style = REPLY_STYLE if is_reply else SYNC_STYLE
        add_cell(mid, '1', label, style, edge=True,
                 geo_attribs={'relative': '1', 'as': 'geometry'},
                 src_pt=(str(src_x), str(y)), tgt_pt=(str(tgt_x), str(y)))

    # Messages
    # 1. Fill details
    add_msg('m1', X_ACTOR + 5, X_VIEW - 5, 330,
            "1. Fill in contract info<br>(proposalId, totalAmount, terms, expiresAt, milestones)")

    # 2. View self validation
    add_cell('val', '1', '',
             'html=1;verticalAlign=bottom;endArrow=block;curved=0;rounded=0;strokeColor=#000000;',
             edge=True, geo_attribs={'relative': '1', 'as': 'geometry'},
             src_pt=(str(X_VIEW + 5), '370'), tgt_pt=(str(X_VIEW + 5), '405'),
             pts=[(X_VIEW + 45, 370), (X_VIEW + 45, 405)])
    add_cell('val_label', '1', '2. Check validate contract data',
             'text;html=1;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=11;fontColor=#000000;',
             vertex=True, geo_attribs={'x': str(X_VIEW + 50), 'y': '375', 'width': '130', 'height': '25', 'as': 'geometry'})

    # 2.1 Display error
    add_msg('valmsg', X_VIEW - 5, X_ACTOR + 5, 475,
            "2.1. Display message that required input valid fields", is_reply=True)

    # 3. POST /contracts
    add_msg('rt', X_VIEW + 5, X_ROUTE - 5, 560,
            "3. POST /contracts<br>(CreateContractBodyDTO)")

    # 3.1.1 & 3.1.2 Invalid token
    add_msg('inv1', X_ROUTE - 5, X_VIEW + 5, 725,
            "3.1.1. Return error message", is_reply=True)
    add_msg('inv2', X_VIEW - 5, X_ACTOR + 5, 765,
            "3.1.2. Redirect to login / show error", is_reply=True)

    # 4. Route -> Controller
    add_msg('c1', X_ROUTE + 5, X_CTRL - 5, 820,
            "4. createContract(@UserActive('userId'), body)")

    # 5. Controller -> Service
    add_msg('c2', X_CTRL + 5, X_SVC - 5, 875,
            "5. createContract(clientId, body)")

    # 6. Service -> Repo
    add_msg('c3', X_SVC + 5, X_REPO - 5, 930,
            "6. findProposalWithJob(body.proposalId)")

    # 7. Repo -> Model
    add_msg('c4', X_REPO + 5, X_MODEL - 5, 985,
            "7. prisma.proposal.findUnique({where: {id}, include: {job}})")

    # 8. Model -> DB
    add_msg('c5', X_MODEL + 5, X_DB - 5, 1035,
            "8. Execute query to check proposal status &amp; job owner")

    # 9. DB -> Model
    add_msg('r1', X_DB - 5, X_MODEL + 5, 1080,
            "9. Return result", is_reply=True)

    # 10. Model -> Repo
    add_msg('r2', X_MODEL - 5, X_REPO + 5, 1120,
            "10. Return result", is_reply=True)

    # 11. Repo -> Service
    add_msg('r3', X_REPO - 5, X_SVC + 5, 1160,
            "11. Return proposal with job", is_reply=True)

    # 12. Service self-check
    add_cell('chk', '1', '',
             'html=1;verticalAlign=bottom;endArrow=block;curved=0;rounded=0;strokeColor=#000000;',
             edge=True, geo_attribs={'relative': '1', 'as': 'geometry'},
             src_pt=(str(X_SVC + 5), '1195'), tgt_pt=(str(X_SVC + 5), '1235'),
             pts=[(X_SVC + 50, 1195), (X_SVC + 50, 1235)])
    add_cell('chk_label', '1', '12. Check proposal ownership,<br>status, positions &amp; amount',
             'text;html=1;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize=11;fontColor=#000000;',
             vertex=True, geo_attribs={'x': str(X_SVC + 55), 'y': '1200', 'width': '140', 'height': '30', 'as': 'geometry'})

    # 12.1 Error returns
    add_msg('b11', X_SVC - 5, X_CTRL + 5, 1315,
            "12.1.1. Return error (404 / 403 / 400)", is_reply=True)
    add_msg('b12', X_CTRL - 5, X_ROUTE + 5, 1355,
            "12.1.2. Return error response", is_reply=True)
    add_msg('b13', X_ROUTE - 5, X_VIEW + 5, 1395,
            "12.1.3. Return error response", is_reply=True)
    add_msg('b14', X_VIEW - 5, X_ACTOR + 5, 1435,
            "12.1.4. Show message &quot;Proposal invalid or amount mismatch&quot;", is_reply=True)

    # 12.2 Check existing contract
    add_msg('b21', X_SVC + 5, X_REPO - 5, 1535,
            "12.2.1. findContractByProposalId(proposalId)")
    add_msg('b22', X_REPO + 5, X_MODEL - 5, 1585,
            "12.2.2. prisma.contract.findUnique({where: {proposalId}})")
    add_msg('b23', X_MODEL + 5, X_DB - 5, 1635,
            "12.2.3. Execute query to check existing contract")
    add_msg('b24', X_DB - 5, X_MODEL + 5, 1680,
            "12.2.4. Return result", is_reply=True)
    add_msg('b25', X_MODEL - 5, X_REPO + 5, 1715,
            "12.2.5. Return result", is_reply=True)
    add_msg('b26', X_REPO - 5, X_SVC + 5, 1750,
            "12.2.6. Return existing contract or null", is_reply=True)

    # 12.2.7.1 409 Conflict
    add_msg('n11', X_SVC - 5, X_CTRL + 5, 1805,
            "12.2.7.1.1. Return error (409 Conflict)", is_reply=True)
    add_msg('n12', X_CTRL - 5, X_ROUTE + 5, 1845,
            "12.2.7.1.2. Return error response", is_reply=True)
    add_msg('n13', X_ROUTE - 5, X_VIEW + 5, 1885,
            "12.2.7.1.3. Return error response", is_reply=True)
    add_msg('n14', X_VIEW - 5, X_ACTOR + 5, 1925,
            "12.2.7.1.4. Show message &quot;Contract already exists for proposal&quot;", is_reply=True)

    # 12.2.7.2 Proceed create contract
    add_msg('n21', X_SVC + 5, X_REPO - 5, 2035,
            "12.2.7.2.1. createContract(body, clientId, freelancerId, jobId)")
    add_msg('n22', X_REPO + 5, X_MODEL - 5, 2085,
            "12.2.7.2.2. prisma.$transaction(tx =&gt; {...})")
    add_msg('n23', X_MODEL + 5, X_DB - 5, 2135,
            "12.2.7.2.3. Execute insert query (contract &amp; milestones)")
    add_msg('n24', X_DB - 5, X_MODEL + 5, 2185,
            "12.2.7.2.4. Return created record", is_reply=True)
    add_msg('n25', X_MODEL - 5, X_REPO + 5, 2225,
            "12.2.7.2.5. Return created contract", is_reply=True)
    add_msg('n26', X_REPO - 5, X_SVC + 5, 2265,
            "12.2.7.2.6. Return contract entity", is_reply=True)
    add_msg('n27', X_SVC - 5, X_CTRL + 5, 2305,
            "12.2.7.2.7. Return contract data", is_reply=True)
    add_msg('n28', X_CTRL - 5, X_ROUTE + 5, 2345,
            "12.2.7.2.8. 201 Created (CreateContractResponseDTO)", is_reply=True)
    add_msg('n29', X_ROUTE - 5, X_VIEW + 5, 2385,
            "12.2.7.2.9. 201 Created with contract slug", is_reply=True)
    add_msg('n30', X_VIEW - 5, X_ACTOR + 5, 2425,
            "12.2.7.2.10. Show message &quot;Create contract success&quot; &amp; redirect", is_reply=True)

    ET.indent(root, space='  ')
    return ET.tostring(root, encoding='utf-8', xml_declaration=True).decode('utf-8')

xml_content = build_monochrome_uc13_01()
out_file = 'sequence-diagrams-remake/ntin/UC-13.01-create-contract.drawio'
with open(out_file, 'w', encoding='utf-8') as f:
    f.write(xml_content)
print(f"Successfully generated monochrome, equal-spaced {out_file} ({len(xml_content)} bytes)")
