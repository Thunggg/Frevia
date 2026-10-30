// Run from the repository root. Shares the established draw.io/SVG renderer.
const { Diagram } = require('./generate-freelancer-sequences.cjs');
const diagrams = [];
function make(id, slug, title, controller, actor, auth = true) {
  const d = new Diagram(id, slug, title, 'AccountProfile', auth);
  d.names = [actor, `:${controller.replace('Controller', 'View')}`, `:${controller.replace('Controller', 'Route')}`, `:${controller}`, ':AccountProfileService', ':AccountProfileRepository', ':PrismaService', 'Database'];
  diagrams.push(d);
  return d;
}
function role(d, name) {
  d.query('requireRole(userId): findUserWithRoles(userId)', 'user.findFirst(id: userId; deletedAt: null; include roles, profile)', 'SELECT active User + Profile + roles', 'User with roles or null');
  d.stop('[user or profile missing]', '404 ProfileNotFoundException');
  d.stop(`[user lacks ${name} role]`, '403 AccountProfileForbiddenException');
}
function links(d) {
  d.query('findSocialLinks(userId)', 'profile.findUnique(userId); if present socialLink.findMany(profileId; platform asc)', 'SELECT Profile; SELECT social links ordered by platform if profile exists', 'SocialLink[] or null if profile missing');
  d.stop('[profile missing: result is null]', '404 ProfileNotFoundException');
}
let d = make('UC-18.01', 'upload-identity-documents', 'Upload Identity Documents', 'IdentityVerificationController', 'Freelancer');
d.start('upload(userId, body, file) OR aiCheck(userId, body, files)', 'POST /identity-verifications/documents OR /identity-verifications/ai-check', 'Select document type and files; submit multipart request', true);
role(d, 'FREELANCER');
d.alternative('[standard upload: POST /documents]', () => {
  d.stop('[file missing]', '400 IdentityFileRequiredException');
  d.stop('[not PDF / JPEG / PNG OR size > 10 MB]', '400 IdentityFileInvalidException');
  d.frame('ref', 'persistIdentityFile: CloudinaryService.uploadFile if configured; otherwise mkdir/writeFile under uploads; return secure URL or local:// path', () => { d.y += 45; });
  d.query('createIdentityDocument(userId, documentType, fileUrl)', 'idVerificationDocument.create(data)', 'INSERT IdVerificationDocument (status defaults to PENDING)', 'Created identity document');
}, '[AI flow used by current UI: POST /ai-check]', () => {
  d.stop('[front / selfie missing OR liveness count outside 1..40]', '400 IdentityAiFrontRequired / SelfieRequired / LivenessRequiredException');
  d.stop('[invalid image type or size: document/selfie <=10 MB; liveness frame <=2 MB]', '400 IdentityAiImageInvalid / FramesInvalidException');
  d.query('findIdentityDocuments(userId)', 'idVerificationDocument.findMany(userId; deletedAt null; createdAt desc)', 'SELECT active identity documents newest first', 'Identity documents');
  d.stop('[latest document status is APPROVED]', '409 IdentityAlreadyVerifiedException');
  d.frame('ref', 'IdentityAiService.verify(front, back?, selfie, liveness): OCR, QR, face match and liveness. AI transport failure propagates; no document is inserted.', () => { d.y += 55; });
  d.msg(4, 4, 'Normalize document number; AI VERIFIED => PENDING, otherwise REJECTED with reason');
  d.frame('opt', '[normalized identity number exists]', () => {
    d.query('findApprovedIdentityDocumentByIdentityNumber(userId, number)', 'idVerificationDocument.findFirst; fallback $queryRaw with normalized number', 'SELECT APPROVED active document belonging to another user', 'Duplicate document id or null');
    d.msg(4, 4, 'If duplicate: override status to REJECTED; set duplicateOfId and reviewNotes');
  });
  d.frame('ref', 'persistIdentityFile for front, optional back, selfie: Cloudinary if configured, otherwise local filesystem', () => { d.y += 40; });
  d.query('createIdentityAiDocument(data)', 'idVerificationDocument.create(data)', 'INSERT document, final status, review notes, AI summaries, score and scanned time', 'Created identity document');
});
d.msg(4, 4, 'presentIdentityDocument: convert local URLs to protected file endpoints; present safe QR consistency');
d.finish('IdentityVerificationDocumentDto', 'Display submitted / rejected result; refresh verification state', '201 Created');
d = make('UC-18.02', 'view-verification-status', 'View Verification Status', 'IdentityVerificationController', 'Freelancer');
d.start('getStatus(userId) -> getIdentityStatus(userId)', 'GET /identity-verifications/status', 'Open identity verification section'); role(d, 'FREELANCER');
d.query('findIdentityDocuments(userId)', 'idVerificationDocument.findMany(userId; deletedAt null; createdAt desc)', 'SELECT active identity documents newest first', 'Identity document list (possibly empty)');
d.msg(4, 4, 'status = documents[0]?.status ?? null; map presentIdentityDocument over all documents');
d.finish('IdentityVerificationStatusDto { status, documents }', 'Display latest status, history and review notes; empty history has null status');
d = make('UC-19.01', 'view-client-profile', 'View Client Profile', 'ClientProfileController', 'Visitor / User', false);
d.start('getDetail(userId) -> getClientProfile(userId)', 'GET /clients/:userId', 'Open client profile');
d.query('findClientProfile(userId)', 'profile.findFirst(userId; user.deletedAt null; include clientProfile, socialLinks, user roles)', 'SELECT active client profile with social links ordered by platform', 'Profile or null');
d.stop('[clientProfile missing OR user lacks CLIENT role]', '404 ClientProfileNotFoundException');
d.finish('ClientProfileDetailDto', 'Display client profile and company information');
d = make('UC-19.02', 'update-company-information', 'Update Company Information', 'ClientProfileController', 'Client');
d.start('update(userId, body) -> updateClientProfile(userId, input)', 'PUT /clients/me/profile', 'Edit companyName, companyDescription and website; Save', true); role(d, 'CLIENT');
d.msg(4, 4, 'Read profileCompletionPercent; ProfileRevisionService.requiresManualReview(strength)');
d.alternative('[profile strength < 20]', () => {
  d.frame('ref', 'ProfileRevisionService.submitClient: ProfileRevisionRepository reads snapshot and creates / updates latest PENDING CLIENT revision in transaction; live company information unchanged', () => { d.y += 55; });
  d.msg(4, 4, 'Build result: reviewRequired true, revision, original profileStrength');
}, '[else: profile strength >= 20]', () => {
  d.query('updateClientProfile(userId, input)', '$transaction: profile.findUniqueOrThrow; calculateClientProfileStrength; profile.update; clientProfile.upsert; profile.findUniqueOrThrow', 'SELECT Profile; UPDATE completion percent; UPSERT ClientProfile; SELECT updated profile; COMMIT', 'Updated profile with completion percent');
  d.msg(4, 4, 'ProfileRevisionService.directUpdateResult: reviewRequired false, revision null, updated profileStrength');
});
d.finish('ProfileRevisionSubmissionDto', 'Show server submitted / updated message');
d = make('UC-20.01', 'view-social-link-list', 'View Social Link List', 'SocialLinkController', 'Authenticated User');
d.start('getAll(userId) -> getSocialLinks(userId)', 'GET /social-links', 'Open social links settings'); links(d);
d.finish('SocialLinkListDto', 'Display social links or empty list');
d = make('UC-20.02', 'add-social-link', 'Add Social Link', 'SocialLinkController', 'Authenticated User');
d.start('add(userId, body) -> addSocialLink(userId, input)', 'POST /social-links', 'Select platform, enter URL; Add', true); links(d);
d.query('findSocialLinkByPlatform(userId, input.platform)', 'profile.findUnique(userId); socialLink.findFirst(profileId, platform)', 'SELECT link for current profile and platform', 'Existing social link or null');
d.stop('[platform already linked]', '409 SocialLinkDuplicateException');
d.query('createSocialLink(userId, input)', 'profile.findUniqueOrThrow(userId); socialLink.create(profileId, platform, url)', 'INSERT SocialLink for current profile', 'Created social link');
d.finish('SocialLinkDto', 'Append link to local list; clear URL; show success', '201 Created');
d = make('UC-20.03', 'delete-social-link', 'Delete Social Link', 'SocialLinkController', 'Authenticated User');
d.start('remove(userId, id) -> deleteSocialLink(userId, id)', 'DELETE /social-links/:id', 'Click remove social link');
d.query('findSocialLinkById(id)', 'socialLink.findUnique(id; include profile)', 'SELECT SocialLink and owner profile', 'Social link or null');
d.stop('[link missing]', '404 SocialLinkNotFoundException');
d.stop('[link.profile.userId != userId]', '403 AccountProfileForbiddenException');
d.query('deleteSocialLink(id)', 'socialLink.delete(id)', 'DELETE SocialLink', 'Deleted social link');
d.finish('{ message: Social link deleted successfully. }', 'Remove link from local list; show success');
d = make('UC-21.01', 'view-favorite-freelancer-list', 'View Favorite Freelancer List', 'FavoriteFreelancerController', 'Client');
d.start('getAll(userId) -> getFavorites(userId)', 'GET /favorites/freelancers', 'Open favorite freelancers'); role(d, 'CLIENT');
d.query('findFavorites(clientId)', 'favoriteFreelancer.findMany(clientId; createdAt desc; include freelancer.profile.freelancerProfile.skills)', 'SELECT favorites newest first; include freelancer profile and skills by proficiency desc', 'Favorite records');
d.msg(4, 4, 'Filter records without freelancerProfile; map freelancerId, createdAt, profile');
d.finish('FavoriteFreelancerListDto', 'Display favorite freelancers or empty list');
d = make('UC-21.02', 'add-freelancer-to-favorites', 'Add Freelancer to Favorites', 'FavoriteFreelancerController', 'Client');
d.start('add(userId, freelancerId) -> addFavorite(userId, freelancerId)', 'POST /favorites/freelancers/:freelancerId', 'Click favorite freelancer'); role(d, 'CLIENT');
d.stop('[clientId == freelancerId]', '404 FreelancerNotFoundException');
d.query('findUserWithRoles(freelancerId)', 'user.findFirst(id: freelancerId; deletedAt null; include roles, profile)', 'SELECT target active user, profile and roles', 'Target freelancer or null');
d.stop('[target profile missing OR target lacks FREELANCER role]', '404 FreelancerNotFoundException');
d.query('findFavorite(clientId, freelancerId)', 'favoriteFreelancer.findUnique(clientId_freelancerId)', 'SELECT favorite by composite key', 'Favorite or null');
d.stop('[favorite already exists]', '409 FavoriteDuplicateException');
d.query('createFavorite(clientId, freelancerId)', 'favoriteFreelancer.create(clientId, freelancerId)', 'INSERT FavoriteFreelancer', 'Created favorite');
d.finish('{ message: Freelancer added to favorites. }', 'Display favorite state and success', '201 Created');
d = make('UC-21.03', 'remove-freelancer-from-favorites', 'Remove Freelancer from Favorites', 'FavoriteFreelancerController', 'Client');
d.start('remove(userId, freelancerId) -> removeFavorite(userId, freelancerId)', 'DELETE /favorites/freelancers/:freelancerId', 'Click remove favorite'); role(d, 'CLIENT');
d.query('findFavorite(clientId, freelancerId)', 'favoriteFreelancer.findUnique(clientId_freelancerId)', 'SELECT favorite by composite key', 'Favorite or null');
d.stop('[favorite missing]', '404 FavoriteNotFoundException');
d.query('deleteFavorite(clientId, freelancerId)', 'favoriteFreelancer.delete(clientId_freelancerId)', 'DELETE FavoriteFreelancer by composite key', 'Deleted favorite');
d.finish('{ message: Freelancer removed from favorites. }', 'Remove freelancer from local favorites list; show success');
for (const diagram of diagrams) diagram.save();
