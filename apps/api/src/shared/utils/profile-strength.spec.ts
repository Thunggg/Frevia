import {
  calculateClientProfileStrength,
  calculateFreelancerProfileStrength,
} from './profile-strength';

describe('profile strength', () => {
  it('matches the seven freelancer completion criteria used by the UI', () => {
    expect(
      calculateFreelancerProfileStrength({
        displayName: 'Freelancer',
        bio: null,
        title: null,
        education: [],
        certifications: [],
        skillCount: 0,
        portfolioCount: 0,
      }),
    ).toBe(14);

    expect(
      calculateFreelancerProfileStrength({
        displayName: 'Freelancer',
        bio: 'Bio',
        title: 'Engineer',
        education: ['University'],
        certifications: ['Certificate'],
        skillCount: 2,
        portfolioCount: 1,
      }),
    ).toBe(100);
  });

  it('calculates client strength from general and company information', () => {
    expect(
      calculateClientProfileStrength({
        displayName: 'Client',
        companyName: 'Company',
      }),
    ).toBe(40);
  });
});
