import os
import subprocess
import concurrent.futures

DRAWIO = r"C:\Program Files\draw.io\draw.io.exe"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MAP = {
    # Sprint 1
    "UC-0-jwt-verify.drawio": "docs/Report 4/images/sprint1/tthuan/sequences/VerifyJwt.pdf",
    "UC-01-Login-with-Google.drawio": "docs/Report 4/images/sprint1/tthuan/sequences/LoginWithGoogle.pdf",
    "UC-02-Login.drawio": "docs/Report 4/images/sprint1/tthuan/sequences/Login.pdf",
    "UC-03-Logout.drawio": "docs/Report 4/images/sprint1/tthuan/sequences/Logout.pdf",
    "UC-04-register.drawio": "docs/Report 4/images/sprint1/tthuan/sequences/Register.pdf",
    "UC-05-forgot-password.drawio": "docs/Report 4/images/sprint1/tthuan/sequences/ForgotPassword.pdf",
    "UC-06_01-view-role-list.drawio": "docs/Report 4/images/sprint1/tthuan/sequences/ViewRoleList.pdf",
    "UC-06_02-view-role-detail.drawio": "docs/Report 4/images/sprint1/tthuan/sequences/ViewRoleDetail.pdf",
    "UC-06_03-create-role.drawio": "docs/Report 4/images/sprint1/tthuan/sequences/CreateRole.pdf",
    "UC-06_04-update-role.drawio": "docs/Report 4/images/sprint1/tthuan/sequences/UpdateRole.pdf",
    "UC-06_05-delete-role.drawio": "docs/Report 4/images/sprint1/tthuan/sequences/DeleteRole.pdf",
    "UC-06_06-update-role-permissions.drawio": "docs/Report 4/images/sprint1/tthuan/sequences/UpdateRolePermissions.pdf",

    # Sprint 2
    "UC-15.01-view-permission-list.drawio": "docs/Report 4/images/sprint2/tthuan/sequences/ViewPermissionList.pdf",
    "UC-15.02-view-permission-detail.drawio": "docs/Report 4/images/sprint2/tthuan/sequences/ViewPermissionDetail.pdf",
    "UC-16.01-view-session-list.drawio": "docs/Report 4/images/sprint2/tthuan/sequences/ViewSessionList.pdf",
    "UC-16.02-view-session-detail.drawio": "docs/Report 4/images/sprint2/tthuan/sequences/ViewSessionDetail.pdf",
    "UC-16.03-revoke-session.drawio": "docs/Report 4/images/sprint2/tthuan/sequences/RevokeSession.pdf",
    "UC-17.01-create-forum-category.drawio": "docs/Report 4/images/sprint2/tthuan/sequences/CreateForumCategory.pdf",
    "UC-17.02-update-forum-category.drawio": "docs/Report 4/images/sprint2/tthuan/sequences/UpdateForumCategory.pdf",
    "UC-17.03-delete-forum-category.drawio": "docs/Report 4/images/sprint2/tthuan/sequences/DeleteForumCategory.pdf",
    "UC-17.06-restore-forum-category.drawio": "docs/Report 4/images/sprint2/tthuan/sequences/RestoreForumCategory.pdf",
    "UC-14.01-view-forum-category-list.drawio": "docs/Report 4/images/sprint2/tthuan/sequences/ViewForumCategoryList.pdf",
    "UC-14.02-view-forum-category-detail.drawio": "docs/Report 4/images/sprint2/tthuan/sequences/ViewForumCategoryDetail.pdf",

    # Sprint 3
    "UC-28.01-view-user-list.drawio": "docs/Report 4/images/sprint3/tthuan/sequences/ViewUserList.pdf",
    "UC-28.02-view-user-detail.drawio": "docs/Report 4/images/sprint3/tthuan/sequences/ViewUserDetail.pdf",
    "UC-28.03-create-user.drawio": "docs/Report 4/images/sprint3/tthuan/sequences/CreateUser.pdf",
    "UC-28.04-update-user.drawio": "docs/Report 4/images/sprint3/tthuan/sequences/UpdateUser.pdf",
    "UC-28.05-update-client-profile.drawio": "docs/Report 4/images/sprint3/tthuan/sequences/UpdateClientProfile.pdf",
    "UC-28.06-update-freelancer-basic-info.drawio": "docs/Report 4/images/sprint3/tthuan/sequences/UpdateFreelancerBasicInfo.pdf",
    "UC-28.07-update-freelancer-skills.drawio": "docs/Report 4/images/sprint3/tthuan/sequences/UpdateFreelancerSkills.pdf",
    "UC-28.08-update-portfolio.drawio": "docs/Report 4/images/sprint3/tthuan/sequences/UpdateFreelancerPortfolio.pdf",

    # Sprint 4
    "UC-37.01-view-banner-list.drawio": "docs/Report 4/images/sprint4/tthuan/sequences/ViewBannerList.pdf",
    "UC-37.02-view-banner-detail.drawio": "docs/Report 4/images/sprint4/tthuan/sequences/ViewBannerDetail.pdf",
    "UC-37.03-create-banner.drawio": "docs/Report 4/images/sprint4/tthuan/sequences/CreateBanner.pdf",
    "UC-37.04-update-banner.drawio": "docs/Report 4/images/sprint4/tthuan/sequences/UpdateBanner.pdf",
    "UC-37.05-delete-banner.drawio": "docs/Report 4/images/sprint4/tthuan/sequences/DeleteBanner.pdf",
    "UC-38.01-view-skill-list.drawio": "docs/Report 4/images/sprint4/tthuan/sequences/ViewSkillList.pdf",
    "UC-38.02-view-skill-detail.drawio": "docs/Report 4/images/sprint4/tthuan/sequences/ViewSkillDetail.pdf",
    "UC-38.03-create-skill.drawio": "docs/Report 4/images/sprint4/tthuan/sequences/CreateSkill.pdf",
    "UC-38.04-update-skill.drawio": "docs/Report 4/images/sprint4/tthuan/sequences/UpdateSkill.pdf",
    "UC-38.05-delete-skill.drawio": "docs/Report 4/images/sprint4/tthuan/sequences/DeleteSkill.pdf",
    "UC-38.06-restore-skill.drawio": "docs/Report 4/images/sprint4/tthuan/sequences/RestoreSkill.pdf",

    # Sprint 5
    "UC-28.09-update-expert-profile.drawio": "docs/Report 4/images/sprint5/tthuan/sequences/UpdateExpertProfile.pdf",
    "UC-46.01-view-job-category-list.drawio": "docs/Report 4/images/sprint5/tthuan/sequences/ViewJobCategoryList.pdf",
    "UC-46.02-view-job-category-detail.drawio": "docs/Report 4/images/sprint5/tthuan/sequences/ViewJobCategoryDetail.pdf",
    "UC-46.03-create-job-category.drawio": "docs/Report 4/images/sprint5/tthuan/sequences/CreateJobCategory.pdf",
    "UC-46.04-update-job-category.drawio": "docs/Report 4/images/sprint5/tthuan/sequences/UpdateJobCategory.pdf",
    "UC-46.05-delete-job-category.drawio": "docs/Report 4/images/sprint5/tthuan/sequences/DeleteJobCategory.pdf",
}

def export_one(item):
    src_file, dst_rel = item
    src_path = os.path.join(BASE_DIR, "sequence-diagrams-remake", src_file)
    dst_path = os.path.join(BASE_DIR, dst_rel.replace("/", os.sep))
    os.makedirs(os.path.dirname(dst_path), exist_ok=True)

    cmd = [DRAWIO, "-x", "--crop", "-f", "pdf", "-o", dst_path, src_path]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if res.returncode == 0:
        print(f"OK: {src_file} -> {dst_rel}")
        return True
    else:
        print(f"FAIL: {src_file} -> {dst_rel}: {res.stderr.decode('utf-8', errors='ignore')}")
        return False

def main():
    print(f"Exporting {len(MAP)} sequence diagrams...")
    # Run sequentially or with small pool (draw.io desktop sometimes locks GPU/cache if too concurrent)
    success = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        results = executor.map(export_one, MAP.items())
        for r in results:
            if r:
                success += 1
    print(f"Done: {success}/{len(MAP)} exported successfully.")

if __name__ == "__main__":
    main()

