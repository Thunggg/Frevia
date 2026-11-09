# Unit Test Index — Nguyễn Lữ Nhật Huy

Đánh lại số theo thứ tự UC đã thống nhất. Giữ nguyên UF-01–UF-121 của các phần khác. Mã chính của Nhật Huy là UF-122–UF-171; các hàm hỗ trợ nằm ở UF-172–UF-178.

| UC | Chức năng | Matrix | Method |
| --- | --- | --- | --- |
| UC-07.01 | View Freelancer Profile | UF-122 | `viewProfile` |
| UC-07.02 | Update Freelancer Profile | UF-123 | `updateProfile` |
| UC-08.01 | View Freelancer Skill List | UF-124 | `getSkills` |
| UC-08.02 | Add Freelancer Skill | UF-125 | `addSkill` |
| UC-08.03 | Delete Freelancer Skill | UF-126 | `deleteSkill` |
| UC-09.01 | View Portfolio List | UF-127 | `getPortfolios` |
| UC-09.02 | Add Portfolio | UF-128 | `addPortfolio` |
| UC-09.03 | View Portfolio Detail | UF-129 | `getPortfolioDetail` |
| UC-09.04 | Update Portfolio | UF-130 | `updatePortfolio` |
| UC-09.05 | Delete Portfolio | UF-131 | `deletePortfolio` |
| UC-18.01 | Upload Identity Documents | UF-132 | `uploadIdentityDocument` |
| UC-18.02 | View Verification Status | UF-133 | `getIdentityStatus` |
| UC-19.01 | View Client Profile | UF-134 | `getClientProfile` |
| UC-19.02 | Update Company Information | UF-135 | `updateClientProfile` |
| UC-20.01 | View Social Link List | UF-136 | `getSocialLinks` |
| UC-20.02 | Add Social Link | UF-137 | `addSocialLink` |
| UC-20.03 | Delete Social Link | UF-138 | `deleteSocialLink` |
| UC-21.01 | View Favorite Freelancer List | UF-139 | `getFavorites` |
| UC-21.02 | Add Freelancer to Favorites | UF-140 | `addFavorite` |
| UC-21.03 | Remove Freelancer from Favorites | UF-141 | `removeFavorite` |
| UC-29.01 | View Following List | UF-142 | `getFollowing` |
| UC-29.02 | Follow Freelancer | UF-143 | `followFreelancer` |
| UC-29.03 | Unfollow Freelancer | UF-144 | `unfollowFreelancer` |
| UC-30.01 | View Notification List | UF-145 | `getAll` |
| UC-30.02 | Mark Notification as Read | UF-146 | `markRead` |
| UC-30.03 | Mark All Notifications as Read | UF-147 | `markAllRead` |
| UC-30.04 | Delete Notification | UF-148 | `delete` |
| UC-31.01 | Switch Role | UF-149 | `switchRole` |
| UC-31.02 | Join New Role | UF-150 | `joinRole` |
| UC-39.01 | View Review List | UF-151 | `list` |
| UC-39.02 | View Review Detail | UF-152 | `detail` |
| UC-39.03 | Write Review | UF-153 | `create` |
| UC-39.04 | Update Review | UF-154 | `update` |
| UC-39.05 | Delete Review | UF-155 | `remove` |
| UC-40.01 | Respond to Review | UF-156 | `respond` |
| UC-40.02 | Update Review Response | UF-157 | `updateResponse` |
| UC-40.03 | Delete Review Response | UF-158 | `removeResponse` |
| UC-41.01 | View Profile | UF-159 | `getGeneralProfile` |
| UC-41.02 | Update Profile | UF-160 | `updateGeneralProfile` |
| UC-41.03 | Change Password | UF-161 | `changePassword` |
| UC-41.04 | Upload Avatar | UF-162 | `uploadAvatar` |
| UC-47.01 | View Pending Profile Update Request List | UF-163 | `list` |
| UC-47.02 | View Profile Update Request Detail | UF-164 | `detail` |
| UC-47.03 | Approve Profile Update Request | UF-165 | `approve` |
| UC-47.04 | Reject Profile Update Request | UF-166 | `reject` |
| UC-47.05 | View Profile Update Request History | UF-167 | `latestForUser` |
| UC-47.06 | Update Profile Expert | UF-168 | `submitUpdate` |
| UC-07.03 | Upload CV | UF-169 | `uploadCv` |
| UC-07.04 | View CV | UF-170 | `getCvFile` |
| UC-07.05 | Replace CV | UF-169 | `uploadCv` |
| UC-07.06 | Delete CV | UF-171 | `deleteCv` |

Upload CV và Replace CV cùng dùng `uploadCv`, nên UC-07.03 và UC-07.05 dùng chung một matrix.

UC-47.05 còn dùng lại `list` tại UF-163 cho lịch sử đầy đủ của admin;
UF-167 kiểm tra endpoint trả revision gần nhất của tài khoản.

Các hàm hỗ trợ có matrix riêng theo quy tắc mỗi method một matrix:

| Matrix | Method | UC liên quan |
| --- | --- | --- |
| UF-172 | `requiresManualReview` | UC-07.02, UC-19.02, UC-41.02 |
| UF-173 | `submit` | UC-07.02, UC-19.02, UC-41.02, UC-47.06 |
| UF-174 | `submitIdentityAiCheck` | UC-18.01 |
| UF-175 | `analyzeCv` | UC-07.03, UC-07.05 |
| UF-176 | `getCvAnalysis` | UC-07.03, UC-07.05 |
| UF-177 | `confirmCvAnalysis` | UC-07.03, UC-07.05 |
| UF-178 | `discardCvAnalysis` | UC-07.03, UC-07.05 |
