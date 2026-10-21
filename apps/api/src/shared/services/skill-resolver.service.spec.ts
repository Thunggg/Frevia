import { SkillResolverService } from './skill-resolver.service';

describe('SkillResolverService', () => {
  const activeSkills = [
    { id: 1, name: 'JavaScript', slug: 'javascript' },
    { id: 2, name: 'React', slug: 'react' },
    { id: 3, name: 'Tailwind CSS', slug: 'tailwind-css' },
    { id: 4, name: 'Node.js', slug: 'node-js' },
    { id: 5, name: 'C#', slug: 'c-sharp' },
  ];

  const makeService = () => {
    const findMany = jest.fn().mockResolvedValue(activeSkills);
    const service = new SkillResolverService({ skill: { findMany } } as never);
    return { service, findMany };
  };

  it('maps display names, slugs and AI aliases to Skill IDs in input order', async () => {
    const { service } = makeService();

    await expect(
      service.resolveSkillIds([
        'React.js',
        'Tailwind CSS',
        'JS',
        'nodejs',
        'react',
        'unknown skill',
      ]),
    ).resolves.toEqual([2, 3, 1, 4]);
  });

  it('queries active skills once and ignores empty or duplicate input', async () => {
    const { service, findMany } = makeService();

    await expect(
      service.resolveSkillIds([' C Sharp ', '', 'c#']),
    ).resolves.toEqual([5]);
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      select: { id: true, name: true, slug: true },
    });
  });

  it('does not query when no usable skill name is supplied', async () => {
    const { service, findMany } = makeService();

    await expect(service.resolveSkillIds([' '])).resolves.toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });
});
