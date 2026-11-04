
$dir = "d:\Documents\Book\Do_an\Frevia\frevia-clone\sequence-diagrams\ptai"

function Make([string]$id, [string]$name, [string]$inner) {
    return "<mxfile host=`"app.diagrams.net`"><diagram id=`"$id`" name=`"$name`"><mxGraphModel dx=`"1422`" dy=`"800`" grid=`"1`" gridSize=`"10`" guides=`"1`" tooltips=`"1`" connect=`"1`" arrows=`"1`" fold=`"1`" page=`"1`" pageScale=`"1`" pageWidth=`"1654`" pageHeight=`"1935`" math=`"0`" shadow=`"0`"><root><mxCell id=`"0`"/><mxCell id=`"1`" parent=`"0`"/>$inner</root></mxGraphModel></diagram></mxfile>"
}
function Actor([string]$label) {
    return "<mxCell id=`"actor`" value=`"$label`" style=`"shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"85`" y=`"200`" width=`"30`" height=`"60`" as=`"geometry`"/></mxCell><mxCell id=`"actor_line`" value=`"`" style=`"endArrow=none;dashed=1;html=1;`" edge=`"1`" parent=`"1`"><mxGeometry relative=`"1`" as=`"geometry`"><mxPoint x=`"100`" y=`"282`" as=`"sourcePoint`"/><mxPoint x=`"100`" y=`"1815`" as=`"targetPoint`"/></mxGeometry></mxCell><mxCell id=`"bar_actor`" value=`"`" style=`"html=1;perimeter=orthogonalPerimeter;portConstraint=eastwest;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"95`" y=`"330`" width=`"10`" height=`"1280`" as=`"geometry`"/></mxCell>"
}
function LL([string]$id, [string]$label, [int]$x, [int]$barY, [int]$barH, [int]$w=160) {
    return "<mxCell id=`"ll_$id`" value=`"$label`" style=`"shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;dropTarget=0;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"$x`" y=`"240`" width=`"$w`" height=`"1575`" as=`"geometry`"/></mxCell><mxCell id=`"bar_$id`" value=`"`" style=`"html=1;perimeter=orthogonalPerimeter;portConstraint=eastwest;`" vertex=`"1`" parent=`"ll_$id`"><mxGeometry x=`"$([int]($w/2-5))`" y=`"$barY`" width=`"10`" height=`"$barH`" as=`"geometry`"/></mxCell>"
}
function Arr([string]$id, [string]$lbl, [int]$x1,[int]$y1,[int]$x2,[int]$y2,[bool]$ret=$false) {
    $s = if($ret){"html=1;verticalAlign=bottom;endArrow=open;dashed=1;endSize=8;"}else{"html=1;verticalAlign=bottom;endArrow=block;"}
    return "<mxCell id=`"$id`" value=`"$lbl`" style=`"$s`" edge=`"1`" parent=`"1`"><mxGeometry relative=`"1`" as=`"geometry`"><mxPoint x=`"$x1`" y=`"$y1`" as=`"sourcePoint`"/><mxPoint x=`"$x2`" y=`"$y2`" as=`"targetPoint`"/></mxGeometry></mxCell>"
}
function JwtRef() {
    return "<mxCell id=`"m_rf1`" value=`"ref`" style=`"shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=50;height=22;fontSize=12;fillColor=none;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"420`" y=`"420`" width=`"300`" height=`"56`" as=`"geometry`"/></mxCell><mxCell id=`"m_rl1`" value=`"3.1. Verify jwt`" style=`"text;html=1;strokeColor=none;fillColor=none;align=center;fontSize=12;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"520`" y=`"433`" width=`"195`" height=`"30`" as=`"geometry`"/></mxCell><mxCell id=`"m_of1`" value=`"opt`" style=`"shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=70;height=30;fontSize=12;fillColor=none;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"10`" y=`"500`" width=`"560`" height=`"145`" as=`"geometry`"/></mxCell><mxCell id=`"m_ol1`" value=`"[invalid token]`" style=`"text;html=1;align=left;fontSize=12;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"110`" y=`"500`" width=`"130`" height=`"30`" as=`"geometry`"/></mxCell>$(Arr 'jwtErr1' '3.1.1. Return 401 Unauthorized' 510 565 305 565 $true)$(Arr 'jwtErr2' '3.1.2. Show Unauthorized' 295 620 105 620 $true)"
}

# Saved-Search lifelines
# view=225, route=435, ctrl=650(SS), svc=875, repo=1090, prisma=1310
function SSLifelines() {
    return (Actor "Freelancer") +
           (LL "view" ":SavedSearchView" 225 90 1280) +
           (LL "route" ":SavedSearchRoute" 435 150 1165) +
           (LL "ctrl" ":SavedSearchController" 650 430 835 185) +
           (LL "svc" ":SavedSearchService" 885 490 720) +
           (LL "repo" ":SavedSearchRepository" 1095 550 310 185) +
           (LL "prisma" ":PrismaService" 1330 610 175 140)
}

# UC-22.01 View Saved Search List
$uc2201 = (SSLifelines) + (JwtRef) +
    (Arr "e0" "1. Navigate to Saved Searches page" 105 330 295 330) +
    (Arr "e1" "2. GET /saved-searches" 305 390 505 390) +
    (Arr "e2" "3. getSavedSearches(userId)" 520 675 742 675) +
    (Arr "e3" "4. getSavedSearches(userId)" 752 735 975 735) +
    (Arr "e4" "5. findAllByUserId(userId)" 985 795 1187 795) +
    (Arr "e5" "6. prisma.savedSearch.findMany({where:{userId}, select:savedSearchSelect, orderBy:{createdAt:desc}})" 1197 855 1420 855) +
    (Arr "e6" "7. Execute findMany query" 1430 915 1520 915) +
    (Arr "e7" "8. Return SavedSearch[]" 1520 975 1430 975 $true) +
    (Arr "e8" "9. Return SavedSearch[]" 1420 1030 1197 1030 $true) +
    (Arr "e9" "10. Return SavedSearch[]" 1187 1085 985 1085 $true) +
    (Arr "e10" "11. Return SavedSearch[]" 975 1140 752 1140 $true) +
    (Arr "e11" "12. Return 200 SavedSearch[]" 742 1195 520 1195 $true) +
    (Arr "e12" "13. Return 200 SavedSearch[]" 510 1250 305 1250 $true) +
    (Arr "e13" "14. Display saved search list" 295 1305 105 1305 $true)
Make "uc22-01-view-saved-search-list" "UC-22.01-View-Saved-Search-List" $uc2201 | Set-Content "$dir\UC-22.01_-_View_Saved_Search_List.drawio" -Encoding UTF8
Write-Host "UC-22.01 done"

# UC-22.02 View Saved Search Detail
$uc2202 = (SSLifelines) + (JwtRef) +
    (Arr "e0" "1. Click on a saved search item" 105 330 295 330) +
    (Arr "e1" "2. GET /saved-searches/:id" 305 390 505 390) +
    (Arr "e2" "3. getSavedSearchDetail(userId, id)" 520 675 742 675) +
    (Arr "e3" "4. getSavedSearchDetail(userId, id)" 752 735 975 735) +
    (Arr "e4" "5. findByIdAndUserId(id, userId)" 985 795 1187 795) +
    (Arr "e5" "6. prisma.savedSearch.findFirst({where:{id,userId}, select:savedSearchSelect})" 1197 855 1420 855) +
    (Arr "e6" "7. Execute findFirst" 1430 915 1520 915) +
    (Arr "e7" "8. Return SavedSearch | null" 1520 975 1430 975 $true) +
    "<mxCell id=`"alt`" value=`"alt`" style=`"shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=70;height=30;fillColor=none;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"20`" y=`"1010`" width=`"1500`" height=`"450`" as=`"geometry`"/></mxCell><mxCell id=`"alt_lbl0`" value=`"[savedSearch == null]`" style=`"text;html=1;align=left;fontSize=12;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"120`" y=`"1012`" width=`"190`" height=`"28`" as=`"geometry`"/></mxCell>$(Arr 'e8_1' '9.1.1. throw SavedSearchNotFoundException()' 1187 1065 985 1065 $true)$(Arr 'e8_2' '9.1.2. Return 404 Not Found' 975 1115 752 1115 $true)$(Arr 'e8_3' '9.1.3. Return 404' 742 1165 520 1165 $true)$(Arr 'e8_4' '9.1.4. Show Not Found' 510 1215 305 1215 $true)$(Arr 'e8_5' '9.1.5. Show error message' 295 1265 105 1265 $true)" +
    "<mxCell id=`"alt_div`" value=`"`" style=`"endArrow=none;dashed=1;html=1;`" edge=`"1`" parent=`"1`"><mxGeometry relative=`"1`" as=`"geometry`"><mxPoint x=`"20`" y=`"1300`" as=`"sourcePoint`"/><mxPoint x=`"1520`" y=`"1300`" as=`"targetPoint`"/></mxGeometry></mxCell><mxCell id=`"alt_lbl1`" value=`"[savedSearch found]`" style=`"text;html=1;align=left;fontSize=12;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"120`" y=`"1302`" width=`"180`" height=`"28`" as=`"geometry`"/></mxCell>" +
    (Arr "e9_1" "9.2.1. Return savedSearch" 1187 1360 985 1360 $true) +
    (Arr "e9_2" "9.2.2. Return savedSearch" 975 1415 752 1415 $true) +
    (Arr "e9_3" "9.2.3. Return 200 savedSearch" 742 1465 520 1465 $true) +
    (Arr "e9_4" "9.2.4. Return 200" 510 1520 305 1520 $true) +
    (Arr "e9_5" "9.2.5. Display saved search detail" 295 1575 105 1575 $true)
Make "uc22-02-view-saved-search-detail" "UC-22.02-View-Saved-Search-Detail" $uc2202 | Set-Content "$dir\UC-22.02_-_View_Saved_Search_Detail.drawio" -Encoding UTF8
Write-Host "UC-22.02 done"

# UC-22.03 Create Saved Search
$uc2203 = (SSLifelines) + (JwtRef) +
    (Arr "e0" "1. Click Save Search" 105 330 295 330) +
    (Arr "e1" "2. POST /saved-searches {name, searchParams}" 305 390 505 390) +
    (Arr "e2" "3. createSavedSearch(userId, body)" 520 675 742 675) +
    (Arr "e3" "4. createSavedSearch(userId, body)" 752 735 975 735) +
    (Arr "e4" "5. create(userId, data)" 985 795 1187 795) +
    (Arr "e5" "6. prisma.savedSearch.create({data:{userId,name,searchParams}, select:savedSearchSelect})" 1197 855 1420 855) +
    (Arr "e6" "7. Execute create query" 1430 915 1520 915) +
    (Arr "e7" "8. Return SavedSearch" 1520 975 1430 975 $true) +
    (Arr "e8" "9. Return SavedSearch" 1420 1030 1197 1030 $true) +
    (Arr "e9" "10. Return SavedSearch" 1187 1085 985 1085 $true) +
    (Arr "e10" "11. Return SavedSearch" 975 1140 752 1140 $true) +
    (Arr "e11" "12. Return 201 SavedSearch" 742 1195 520 1195 $true) +
    (Arr "e12" "13. Return 201" 510 1250 305 1250 $true) +
    (Arr "e13" "14. Show Search saved successfully" 295 1305 105 1305 $true)
Make "uc22-03-create-saved-search" "UC-22.03-Create-Saved-Search" $uc2203 | Set-Content "$dir\UC-22.03_-_Create_Saved_Search.drawio" -Encoding UTF8
Write-Host "UC-22.03 done"

# UC-22.04 Update Saved Search
$uc2204 = (SSLifelines) + (JwtRef) +
    (Arr "e0" "1. Click Edit on a saved search" 105 330 295 330) +
    (Arr "e1" "2. PATCH /saved-searches/:id {name}" 305 390 505 390) +
    (Arr "e2" "3. updateSavedSearch(userId, id, body)" 520 675 742 675) +
    (Arr "e3" "4. updateSavedSearch(userId, id, body)" 752 735 975 735) +
    (Arr "e4" "5. update(id, userId, data)" 985 795 1187 795) +
    (Arr "e5" "6. prisma.savedSearch.updateMany({where:{id,userId}, data:{name}})" 1197 855 1420 855) +
    (Arr "e6" "7. Execute updateMany" 1430 915 1520 915) +
    (Arr "e7" "8. Return {count}" 1520 975 1430 975 $true) +
    "<mxCell id=`"opt_cnt`" value=`"opt`" style=`"shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=70;height=30;fontSize=12;fillColor=none;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"1060`" y=`"1000`" width=`"500`" height=`"80`" as=`"geometry`"/></mxCell><mxCell id=`"opt_cnt_lbl`" value=`"[count == 0]`" style=`"text;html=1;align=left;fontSize=12;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"1160`" y=`"1002`" width=`"140`" height=`"28`" as=`"geometry`"/></mxCell>$(Arr 'e_cnt' '9.1. Return null' 1420 1050 1197 1050 $true)" +
    (Arr "e8" "9. findByIdAndUserId(id, userId) — re-fetch updated" 1197 1110 1420 1110) +
    (Arr "e9" "10. Return updatedSavedSearch" 1420 1170 1197 1170 $true) +
    (Arr "e10" "11. Return updatedSavedSearch" 1187 1225 985 1225 $true) +
    "<mxCell id=`"opt_nn`" value=`"opt`" style=`"shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=70;height=30;fontSize=12;fillColor=none;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"730`" y=`"1255`" width=`"500`" height=`"80`" as=`"geometry`"/></mxCell><mxCell id=`"opt_nn_lbl`" value=`"[savedSearch == null]`" style=`"text;html=1;align=left;fontSize=12;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"840`" y=`"1257`" width=`"190`" height=`"28`" as=`"geometry`"/></mxCell>$(Arr 'e_nn' '12.1. throw SavedSearchNotFoundException()' 975 1305 752 1305 $true)" +
    (Arr "e11" "12. Return updatedSavedSearch" 975 1360 752 1360 $true) +
    (Arr "e12" "13. Return 200 updatedSavedSearch" 742 1415 520 1415 $true) +
    (Arr "e13" "14. Return 200" 510 1465 305 1465 $true) +
    (Arr "e14" "15. Show Search updated successfully" 295 1515 105 1515 $true)
Make "uc22-04-update-saved-search" "UC-22.04-Update-Saved-Search" $uc2204 | Set-Content "$dir\UC-22.04_-_Update_Saved_Search.drawio" -Encoding UTF8
Write-Host "UC-22.04 done"

# UC-22.05 Delete Saved Search
$uc2205 = (SSLifelines) + (JwtRef) +
    (Arr "e0" "1. Click Delete on a saved search" 105 330 295 330) +
    (Arr "e1" "2. DELETE /saved-searches/:id" 305 390 505 390) +
    (Arr "e2" "3. deleteSavedSearch(userId, id)" 520 675 742 675) +
    (Arr "e3" "4. deleteSavedSearch(userId, id)" 752 735 975 735) +
    (Arr "e4" "5. delete(id, userId)" 985 795 1187 795) +
    (Arr "e5" "6. prisma.savedSearch.deleteMany({where:{id,userId}})" 1197 855 1420 855) +
    (Arr "e6" "7. Execute deleteMany" 1430 915 1520 915) +
    (Arr "e7" "8. Return {count}" 1520 975 1430 975 $true) +
    (Arr "e8" "9. Return count > 0 (boolean)" 1420 1030 1197 1030 $true) +
    "<mxCell id=`"alt`" value=`"alt`" style=`"shape=umlFrame;whiteSpace=wrap;html=1;pointerEvents=0;width=70;height=30;fillColor=none;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"20`" y=`"1065`" width=`"1500`" height=`"430`" as=`"geometry`"/></mxCell><mxCell id=`"alt_lbl0`" value=`"[deleted == false]`" style=`"text;html=1;align=left;fontSize=12;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"120`" y=`"1067`" width=`"180`" height=`"28`" as=`"geometry`"/></mxCell>$(Arr 'e9_1' '10.1.1. throw SavedSearchNotFoundException()' 1187 1120 985 1120 $true)$(Arr 'e9_2' '10.1.2. Return 404' 975 1170 752 1170 $true)$(Arr 'e9_3' '10.1.3. Return 404' 742 1220 520 1220 $true)$(Arr 'e9_4' '10.1.4. Show Not Found' 295 1270 105 1270 $true)" +
    "<mxCell id=`"alt_div`" value=`"`" style=`"endArrow=none;dashed=1;html=1;`" edge=`"1`" parent=`"1`"><mxGeometry relative=`"1`" as=`"geometry`"><mxPoint x=`"20`" y=`"1305`" as=`"sourcePoint`"/><mxPoint x=`"1520`" y=`"1305`" as=`"targetPoint`"/></mxGeometry></mxCell><mxCell id=`"alt_lbl1`" value=`"[deleted == true]`" style=`"text;html=1;align=left;fontSize=12;`" vertex=`"1`" parent=`"1`"><mxGeometry x=`"120`" y=`"1307`" width=`"180`" height=`"28`" as=`"geometry`"/></mxCell>" +
    (Arr "e10_1" "10.2.1. Return void" 1187 1360 985 1360 $true) +
    (Arr "e10_2" "10.2.2. Return 200" 975 1415 752 1415 $true) +
    (Arr "e10_3" "10.2.3. Return 200" 742 1465 520 1465 $true) +
    (Arr "e10_4" "10.2.4. Return 200" 510 1515 305 1515 $true) +
    (Arr "e10_5" "10.2.5. Show Saved search deleted" 295 1565 105 1565 $true)
Make "uc22-05-delete-saved-search" "UC-22.05-Delete-Saved-Search" $uc2205 | Set-Content "$dir\UC-22.05_-_Delete_Saved_Search.drawio" -Encoding UTF8
Write-Host "UC-22.05 done"

Write-Host "All UC-22 done!"
