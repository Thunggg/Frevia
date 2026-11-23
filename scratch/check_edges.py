import xml.etree.ElementTree as ET
from diagram_engine import DiagramEngine

# Define columns for all 4 sprints
sprint1_cols = [
    ['contract_route', 'sf_route'],
    ['contract_ctrl', 'sf_ctrl', 'contract_gAuth', 'contract_gPerm'],
    ['contract_dtoCreate', 'contract_dtoUpdate', 'contract_dtoQuery', 'contract_dtoResp', 'contract_typeDetail',
     'sf_dtoUpload', 'sf_dtoGet', 'sf_dtoDelete', 'sf_typeShared'],
    ['contract_svc', 'sf_svc', 'sf_uCloudinary'],
    ['contract_repo', 'sf_repo'],
    ['contract_schemaContract', 'sf_schemaFile', 'contract_schemaJob', 'contract_schemaProposal', 'contract_schemaUser'],
    ['contract_enumStatus', 'contract_enumFee'],
]

sprint2_cols = [
    ['ms_route', 'mf_route', 'sub_route'],
    ['ms_ctrl', 'mf_ctrl', 'sub_ctrl', 'ms_gAuth', 'ms_gPerm'],
    ['ms_dtoCreate', 'ms_dtoUpdate', 'ms_dtoQuery', 'ms_dtoListResp', 'ms_typeMilestone',
     'mf_dtoUpload', 'mf_dtoGet', 'mf_dtoDelete', 'mf_typeMilestoneFile',
     'sub_dtoSubmitBody', 'sub_dtoRequestChanges', 'sub_dtoGetSubmissions', 'sub_typeSubmission', 'sub_typeFile'],
    ['ms_svc', 'mf_svc', 'mf_uCloudinary', 'sub_svc'],
    ['ms_repo', 'mf_repo', 'sub_repo'],
    ['ms_schemaContract', 'ms_schemaMilestone', 'mf_schemaFile', 'sub_schemaSubmission', 'sub_schemaSubFile', 'ms_schemaDispute', 'mf_schemaUser'],
]

sprint3_cols = [
    ['disp_routeUser', 'disp_routeExpert'],
    ['disp_ctrlUser', 'disp_ctrlExpert', 'disp_gAuth', 'disp_gPerm'],
    ['disp_dtoCreate', 'disp_dtoCounter', 'disp_dtoDecision', 'disp_dtoVote', 'disp_dtoDetail', 'disp_typeEvidence'],
    ['disp_svcUser', 'disp_svcExpert'],
    ['disp_repoUser', 'disp_repoExpert'],
    ['disp_schemaContract', 'disp_schemaMilestone', 'disp_schemaDispute', 'disp_schemaEvidence', 'disp_schemaFile'],
]

sprint4_cols = [
    ['pay_route'],
    ['pay_ctrl', 'pay_gAuth'],
    ['pay_dtoIntent', 'pay_dtoCheckout', 'pay_dtoCard', 'pay_dtoSettlement', 'pay_dtoTx'],
    ['pay_svc', 'pay_uStripe'],
    ['pay_repo'],
    ['pay_schemaContract', 'pay_schemaMilestone', 'pay_schemaTx', 'pay_schemaUser'],
]

sprints = [
    ('class-diagrams/Sprint1_Contract_Management_Class_Diagram.drawio', sprint1_cols),
    ('class-diagrams/Sprint2_Milestone_Management_Class_Diagram.drawio', sprint2_cols),
    ('class-diagrams/Sprint3_Dispute_Management_Class_Diagram.drawio', sprint3_cols),
    ('class-diagrams/Sprint4_Payment_Management_Class_Diagram.drawio', sprint4_cols),
]

for path, cols in sprints:
    print("=" * 60)
    print("CHECKING:", path)
    eng = DiagramEngine(path)
    eng.layout(cols)
    for e in eng.edge_data:
        sid = e['src']
        tid = e['tgt']
        sn = eng.nodes[sid]
        tn = eng.nodes[tid]
        scol = sn['col']
        tcol = tn['col']
        diff = tcol - scol
        if abs(diff) > 1 and not (scol == 1 and tcol == 3):
            print(f"  LONG EDGE: {e['id']}: {sid} (col {scol}) -> {tid} (col {tcol}) | diff={diff}")
        elif diff == 0:
            print(f"  SAME COL: {e['id']}: {sid} (col {scol}) -> {tid} (col {tcol})")
