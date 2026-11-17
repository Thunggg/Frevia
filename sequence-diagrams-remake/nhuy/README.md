# Sequence diagrams - Nguyen Lu Nhat Huy

Updated 2026-11-10. Editable sources for Report 4; 51 use cases across Sprints 1-5. UC identifiers are retained from the report. Report 3 screenshots and report PDFs are not overwritten by this script.

## Current flow changes

- Review creation rejects only an active existing review. A deleted review is restored with new content in one transaction, old responses are hidden, and the reviewee is notified. Concurrent create/restore conflicts return 409.
- Approval of an Expert revision activates the Expert record. The profile screen checks pending approval every five seconds while visible, and on focus; an active Expert enters /expert/disputes. Profile settings opens /expert/profile?edit=1 for intentional editing.
- Expert business access is limited to dispute resolution. Own profile read/update, own revision status, authentication and logout remain available. Expert cannot join/switch roles or use Client/Freelancer functions.
- UC-07 describes the Freelancer professional profile; UC-41 describes general account fields. Expert updates use UC-47.06, not the generic account-profile endpoint.

Validation: all 51 sources parse as XML with unique cell IDs and valid parent/source/target references. The three main changed flows (UC-39.03, UC-47.03, UC-47.06) were exported with draw.io and visually inspected. Report 4 image copies and PDFs need a separate export/synchronization before rebuilding the report.

## Diagram index

| Sprint | Source | Screen / entry point |
| --- | --- | --- |
| 1 | [UC-07.01-view-freelancer-profile](UC-07.01-view-freelancer-profile.drawio) | `/profiles/:profileId (public view); /freelancer/profile (own professional profile)` |
| 1 | [UC-07.02-update-freelancer-profile](UC-07.02-update-freelancer-profile.drawio) | `/profiles/:profileId (public view); /freelancer/profile (own professional profile)` |
| 1 | [UC-08.01-view-freelancer-skill-list](UC-08.01-view-freelancer-skill-list.drawio) | `/freelancer/profile - skills / portfolio; /profiles/:profileId - public view` |
| 1 | [UC-08.02-add-freelancer-skill](UC-08.02-add-freelancer-skill.drawio) | `/freelancer/profile - skills / portfolio; /profiles/:profileId - public view` |
| 1 | [UC-08.03-delete-freelancer-skill](UC-08.03-delete-freelancer-skill.drawio) | `/freelancer/profile - skills / portfolio; /profiles/:profileId - public view` |
| 1 | [UC-09.01-view-portfolio-list](UC-09.01-view-portfolio-list.drawio) | `/freelancer/profile - skills / portfolio; /profiles/:profileId - public view` |
| 1 | [UC-09.02-add-portfolio](UC-09.02-add-portfolio.drawio) | `/freelancer/profile - skills / portfolio; /profiles/:profileId - public view` |
| 1 | [UC-09.03-view-portfolio-detail](UC-09.03-view-portfolio-detail.drawio) | `/freelancer/profile - skills / portfolio; /profiles/:profileId - public view` |
| 1 | [UC-09.04-update-portfolio](UC-09.04-update-portfolio.drawio) | `/freelancer/profile - skills / portfolio; /profiles/:profileId - public view` |
| 1 | [UC-09.05-delete-portfolio](UC-09.05-delete-portfolio.drawio) | `/freelancer/profile - skills / portfolio; /profiles/:profileId - public view` |
| 2 | [UC-18.01-upload-identity-documents](UC-18.01-upload-identity-documents.drawio) | `/freelancer/profile - identity verification` |
| 2 | [UC-18.02-view-verification-status](UC-18.02-view-verification-status.drawio) | `/freelancer/profile - identity verification` |
| 2 | [UC-19.01-view-client-profile](UC-19.01-view-client-profile.drawio) | `/clients/:userId (public view); /client/profile (own company profile)` |
| 2 | [UC-19.02-update-company-information](UC-19.02-update-company-information.drawio) | `/clients/:userId (public view); /client/profile (own company profile)` |
| 2 | [UC-20.01-view-social-link-list](UC-20.01-view-social-link-list.drawio) | `/client/profile or /freelancer/profile - social links` |
| 2 | [UC-20.02-add-social-link](UC-20.02-add-social-link.drawio) | `/client/profile or /freelancer/profile - social links` |
| 2 | [UC-20.03-delete-social-link](UC-20.03-delete-social-link.drawio) | `/client/profile or /freelancer/profile - social links` |
| 2 | [UC-21.01-view-favorite-freelancer-list](UC-21.01-view-favorite-freelancer-list.drawio) | `/client/profile?tab=favorites; public freelancer profile - favorite action` |
| 2 | [UC-21.02-add-freelancer-to-favorites](UC-21.02-add-freelancer-to-favorites.drawio) | `/client/profile?tab=favorites; public freelancer profile - favorite action` |
| 2 | [UC-21.03-remove-freelancer-from-favorites](UC-21.03-remove-freelancer-from-favorites.drawio) | `/client/profile?tab=favorites; public freelancer profile - favorite action` |
| 3 | [UC-29.01-view-following-list](UC-29.01-view-following-list.drawio) | `/client/profile?tab=following; public freelancer profile - follow action` |
| 3 | [UC-29.02-follow-freelancer](UC-29.02-follow-freelancer.drawio) | `/client/profile?tab=following; public freelancer profile - follow action` |
| 3 | [UC-29.03-unfollow-freelancer](UC-29.03-unfollow-freelancer.drawio) | `/client/profile?tab=following; public freelancer profile - follow action` |
| 3 | [UC-30.01-view-notification-list](UC-30.01-view-notification-list.drawio) | `/client/notifications or /freelancer/notifications; notification bell` |
| 3 | [UC-30.02-mark-notification-as-read](UC-30.02-mark-notification-as-read.drawio) | `/client/notifications or /freelancer/notifications; notification bell` |
| 3 | [UC-30.03-mark-all-notifications-as-read](UC-30.03-mark-all-notifications-as-read.drawio) | `/client/notifications or /freelancer/notifications; notification bell` |
| 3 | [UC-30.04-delete-notification](UC-30.04-delete-notification.drawio) | `/client/notifications or /freelancer/notifications; notification bell` |
| 3 | [UC-31.01-switch-role](UC-31.01-switch-role.drawio) | `Client / Freelancer account menu - switch or add role; Expert is denied` |
| 3 | [UC-31.02-join-new-role](UC-31.02-join-new-role.drawio) | `Client / Freelancer account menu - switch or add role; Expert is denied` |
| 4 | [UC-39.01-view-review-list](UC-39.01-view-review-list.drawio) | `/client/reviews?contractId=:id; /freelancer/profile?tab=reviews` |
| 4 | [UC-39.02-view-review-detail](UC-39.02-view-review-detail.drawio) | `/client/reviews?contractId=:id; /freelancer/profile?tab=reviews` |
| 4 | [UC-39.03-write-review](UC-39.03-write-review.drawio) | `/client/reviews?contractId=:id; /freelancer/profile?tab=reviews` |
| 4 | [UC-39.04-update-review](UC-39.04-update-review.drawio) | `/client/reviews?contractId=:id; /freelancer/profile?tab=reviews` |
| 4 | [UC-39.05-delete-review](UC-39.05-delete-review.drawio) | `/client/reviews?contractId=:id; /freelancer/profile?tab=reviews` |
| 4 | [UC-40.01-respond-to-review](UC-40.01-respond-to-review.drawio) | `/client/reviews?contractId=:id; /freelancer/profile?tab=reviews` |
| 4 | [UC-40.02-update-review-response](UC-40.02-update-review-response.drawio) | `/client/reviews?contractId=:id; /freelancer/profile?tab=reviews` |
| 4 | [UC-40.03-delete-review-response](UC-40.03-delete-review-response.drawio) | `/client/reviews?contractId=:id; /freelancer/profile?tab=reviews` |
| 4 | [UC-41.01-view-profile](UC-41.01-view-profile.drawio) | `/client/profile or /freelancer/profile - account settings (not professional-profile UC-07)` |
| 4 | [UC-41.02-update-profile](UC-41.02-update-profile.drawio) | `/client/profile or /freelancer/profile - account settings (not professional-profile UC-07)` |
| 4 | [UC-41.03-change-password](UC-41.03-change-password.drawio) | `/client/profile or /freelancer/profile - account settings (not professional-profile UC-07)` |
| 4 | [UC-41.04-upload-avatar](UC-41.04-upload-avatar.drawio) | `/client/profile or /freelancer/profile - account settings (not professional-profile UC-07)` |
| 5 | [UC-07.03-upload-cv](UC-07.03-upload-cv.drawio) | `/freelancer/profile - CV management` |
| 5 | [UC-07.04-view-cv](UC-07.04-view-cv.drawio) | `/freelancer/profile - CV management` |
| 5 | [UC-07.05-replace-cv](UC-07.05-replace-cv.drawio) | `/freelancer/profile - CV management` |
| 5 | [UC-07.06-delete-cv](UC-07.06-delete-cv.drawio) | `/freelancer/profile - CV management` |
| 5 | [UC-47.01-view-pending-profile-update-request-list](UC-47.01-view-pending-profile-update-request-list.drawio) | `/admin/profile-revisions - administrator review workflow` |
| 5 | [UC-47.02-view-profile-update-request-detail](UC-47.02-view-profile-update-request-detail.drawio) | `/admin/profile-revisions - administrator review workflow` |
| 5 | [UC-47.03-approve-profile-update-request](UC-47.03-approve-profile-update-request.drawio) | `/admin/profile-revisions - administrator review workflow` |
| 5 | [UC-47.04-reject-profile-update-request](UC-47.04-reject-profile-update-request.drawio) | `/admin/profile-revisions - administrator review workflow` |
| 5 | [UC-47.05-view-profile-update-request-history](UC-47.05-view-profile-update-request-history.drawio) | `/admin/profile-revisions - administrator review workflow` |
| 5 | [UC-47.06-update-profile-expert](UC-47.06-update-profile-expert.drawio) | `/expert/profile?edit=1 - own Expert profile; /expert/disputes - Expert workspace` |
