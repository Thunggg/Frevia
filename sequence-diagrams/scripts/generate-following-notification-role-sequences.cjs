const { Diagram } = require('./generate-freelancer-sequences.cjs');
const diagrams = [];
function make(id, slug, title, controller, service, repository, actor) {
  const d = new Diagram(id, slug, title, service, true);
  d.names = [actor, `:${controller.replace('Controller', 'View')}`, `:${controller.replace('Controller', 'Route')}`, `:${controller}`, `:${service}`, `:${repository}`, ':PrismaService', 'Database'];
  diagrams.push(d);
  return d;
}
function following(id, slug, title) {
  return make(id, slug, title, 'FollowingFreelancerController', 'AccountProfileService', 'AccountProfileRepository', 'Client');
}
function role(d, user, name) {
  d.query(`requireRole(${user}, ${name}): findUserWithRoles(${user})`, `user.findFirst(id: ${user}; deletedAt null; include profile and roles)`, 'SELECT active user with profile and roles', 'User or null');
  d.stop('[user or profile missing]', '404 ProfileNotFoundException');
  d.stop(`[user lacks ${name} role]`, '403 AccountProfileForbiddenException');
}
let d = following('UC-29.01', 'view-following-list', 'View Following List');
d.start('getFollowing(userId)', 'GET /following/freelancers', 'Open following list'); role(d, 'clientId', 'CLIENT');
d.query('findFollowing(clientId)', 'followFreelancer.findMany(clientId; target deletedAt null, isBanned false; createdAt desc; include profile and skills)', 'SELECT follows, active non-banned freelancer profiles and skills ordered by proficiency desc', 'Following records');
d.msg(4, 4, 'Filter records without freelancerProfile; map freelancerId, createdAt and profile');
d.finish('FollowingFreelancerListDto', 'Display following freelancers or empty list');
d = following('UC-29.02', 'follow-freelancer', 'Follow Freelancer');
d.start('followFreelancer(userId, freelancerId)', 'POST /following/freelancers/:freelancerId', 'Click Follow'); role(d, 'clientId', 'CLIENT');
d.stop('[clientId == freelancerId]', '404 FreelancerNotFoundException'); role(d, 'freelancerId', 'FREELANCER');
d.query('findFollow(clientId, freelancerId)', 'followFreelancer.findUnique(clientId_freelancerId)', 'SELECT follow by composite key', 'Follow or null');
d.stop('[follow already exists]', '409 FollowDuplicateException');
d.msg(4, 4, 'followerName = trimmed client displayName or A client');
d.query('createFollowWithNotification(clientId, freelancerId, followerName)', '$transaction: followFreelancer.create; notification.create', 'INSERT follow; INSERT NEW_FOLLOWER notification for freelancer with client profile link; COMMIT', 'Created follow');
d.finish('{ message: You are now following this freelancer. }', 'Set local isFollowing=true; show success', '201 Created');
d = following('UC-29.03', 'unfollow-freelancer', 'Unfollow Freelancer');
d.start('unfollowFreelancer(userId, freelancerId)', 'DELETE /following/freelancers/:freelancerId', 'Click Unfollow'); role(d, 'clientId', 'CLIENT');
d.query('findFollow(clientId, freelancerId)', 'followFreelancer.findUnique(clientId_freelancerId)', 'SELECT follow by composite key', 'Follow or null');
d.stop('[follow missing]', '404 FollowNotFoundException');
d.query('deleteFollow(clientId, freelancerId)', 'followFreelancer.delete(clientId_freelancerId)', 'DELETE FollowFreelancer by composite key', 'Deleted follow');
d.finish('{ message: You unfollowed this freelancer. }', 'Set local isFollowing=false; show success');
function notification(id, slug, title) {
  return make(id, slug, title, 'NotificationController', 'NotificationService', 'NotificationRepository', 'Authenticated User');
}
function findNotification(d) {
  d.query('findById(userId, notificationId)', 'notification.findFirst(id, userId, deletedAt null)', 'SELECT active notification owned by current user', 'Notification or null');
  d.stop('[notification missing, deleted or belongs to another user]', '404 NotificationNotFoundException');
}
d = notification('UC-30.01', 'view-notification-list', 'View Notification List');
d.start('getAll(userId)', 'GET /notifications', 'Open notifications');
d.query('findAll(userId)', 'notification.findMany(userId; deletedAt null; createdAt desc)', 'SELECT current user notifications newest first', 'Notification[]');
d.finish('NotificationListDto', 'Display notifications and unread state; empty list if none');
d = notification('UC-30.02', 'mark-notification-as-read', 'Mark Notification as Read');
d.start('markRead(userId, notificationId)', 'PATCH /notifications/:id/read', 'Mark notification as read'); findNotification(d);
d.alternative('[notification.isRead == true]', () => {
  d.msg(4, 4, 'Use existing notification; no update needed');
}, '[else: notification is unread]', () => {
  d.query('markRead(notificationId)', 'notification.update(id; isRead true)', 'UPDATE Notification SET isRead=true', 'Updated notification');
});
d.finish('NotificationDto', 'Invalidate notifications query; refetch list and unread state');
d = notification('UC-30.03', 'mark-all-notifications-as-read', 'Mark All Notifications as Read');
d.start('markAllRead(userId)', 'PATCH /notifications/read-all', 'Click Mark all as read');
d.query('markAllRead(userId)', 'notification.updateMany(userId; isRead false; deletedAt null)', 'UPDATE current user active unread notifications SET isRead=true', '{ count: affected rows }');
d.finish('{ message: NotificationMessage.MARKED_ALL_READ, count }', 'Invalidate notifications query; refetch list; count may be zero');
d = notification('UC-30.04', 'delete-notification', 'Delete Notification');
d.start('delete(userId, notificationId)', 'DELETE /notifications/:id', 'Click Delete notification'); findNotification(d);
d.query('softDelete(notificationId)', 'notification.update(id; deletedAt new Date())', 'UPDATE Notification SET deletedAt=current timestamp', 'Soft-deleted notification');
d.finish('{ message: NotificationMessage.DELETED }', 'Invalidate notifications query; refetch active list');
function auth(id, slug, title) {
  return make(id, slug, title, 'AuthController', 'AuthService', 'AuthRepository', 'Authenticated User');
}
function token(d, source) {
  d.frame('ref', `TokenService.signAccessToken({ userId, roleId: ${source}.id, roleName: ${source}.name, sessionId }): sign JWT for the existing session`, () => { d.y += 45; });
  d.msg(4, 3, '{ accessToken }', true);
  d.msg(3, 2, 'Return role response DTO', true);
  d.msg(2, 1, '201 Created: { accessToken } (NestJS response)', true);
  d.frame('ref', 'Next.js /api/auth proxy sets accessToken cookie and returns { roleName: body.role }; on initial backend 401, refresh tokens and retry once if refresh succeeds', () => { d.y += 50; });
  d.msg(1, 0, 'Use new role and navigate to its workspace', true);
}
d = auth('UC-31.01', 'switch-role', 'Switch Role');
d.start('switchRole(userId, sessionId, body)', 'POST /auth/switch-role', 'Choose an assigned CLIENT or FREELANCER role', true);
d.query('switchPrimaryRole(userId, body.role): lookup assignment', 'userRole.findFirst(userId; role.name; role.deletedAt null; include role)', 'SELECT current user assignment to active target role', 'Assignment or null');
d.stop('[assignment missing]', '404 RoleNotFoundException');
d.query('switchPrimaryRole: persist primary role', '$transaction: userRole.updateMany(isPrimary true -> false); userRole.update(target -> true)', 'CLEAR existing primary assignment; SET target assignment primary; COMMIT', 'Assigned role');
token(d, 'role');
d = auth('UC-31.02', 'join-new-role', 'Join New Role');
d.start('joinRole(userId, sessionId, body)', 'POST /auth/join-role', 'Choose new CLIENT or FREELANCER role; Join', true);
d.frame('ref', 'AuthRepository.joinRole executes the following database operations in one Prisma interactive transaction; early missing-role / already-assigned result has no writes', () => { d.y += 45; });
d.query('joinRole: find target role', 'transaction.role.findFirst(name: body.role; deletedAt null)', 'SELECT active target role', 'Role or null');
d.stop('[target role missing: repository returns null]', '404 RoleNotFoundException');
d.query('joinRole: check existing assignment', 'transaction.userRole.findUnique(userId_roleId)', 'SELECT user role assignment', 'Existing assignment or null');
d.stop('[assignment exists: repository returns already-assigned]', '409 RoleAlreadyAssignedException');
d.query('joinRole: ensure profile', 'transaction.profile.upsert(userId; create if absent)', 'UPSERT Profile; return profile id', 'Profile id');
d.alternative('[body.role == FREELANCER]', () => {
  d.query('joinRole: ensure freelancer profile', 'transaction.freelancerProfile.upsert(profileId; create if absent)', 'UPSERT FreelancerProfile', 'Freelancer profile');
}, '[else: body.role == CLIENT]', () => {
  d.query('joinRole: ensure client profile', 'transaction.clientProfile.upsert(profileId; create if absent)', 'UPSERT ClientProfile', 'Client profile');
});
d.query('joinRole: assign and activate new role', 'transaction.userRole.updateMany(primary -> false); transaction.userRole.create(isPrimary true)', 'CLEAR primary role; INSERT new primary UserRole; COMMIT transaction', '{ status: joined, role }');
d.frame('ref', 'If Prisma P2002 occurs anywhere in joinRole: rollback transaction; AuthService maps the unique constraint error to 409 RoleAlreadyAssignedException', () => { d.y += 45; });
token(d, 'result.role');
for (const diagram of diagrams) diagram.save();
