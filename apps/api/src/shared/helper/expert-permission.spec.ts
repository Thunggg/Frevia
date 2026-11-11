import { expertHasPermission } from './expert-permission';

describe('expert permissions', () => {
  it.each([
    ['GET', '/api/expert/disputes'],
    ['GET', '/api/expert/disputes/12'],
    ['POST', '/api/expert/disputes/12/decision'],
    ['POST', '/api/expert/disputes/12/final-decision'],
    ['GET', '/api/auth/me'],
    ['POST', '/api/auth/logout'],
    ['GET', '/api/expert-profile/me'],
    ['PUT', '/api/expert-profile/me'],
    ['GET', '/api/profile-revisions/me'],
  ])('allows %s %s', (method, path) => {
    expect(expertHasPermission(method, path)).toBe(true);
  });

  it.each([
    ['GET', '/api/payments'],
    ['POST', '/api/auth/join-role'],
    ['POST', '/api/auth/switch-role'],
    ['GET', '/api/admin/users'],
    ['POST', '/api/admin/disputes/12/decision'],
    ['POST', '/api/disputes'],
    ['POST', '/api/proposals'],
    ['POST', '/api/contracts'],
    ['POST', '/api/reviews/contracts/12'],
    ['DELETE', '/api/expert/disputes/12'],
    ['PUT', '/api/expert/disputes/12/decision'],
  ])('denies %s %s', (method, path) => {
    expect(expertHasPermission(method, path)).toBe(false);
  });
});
