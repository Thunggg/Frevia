import { Injectable } from '@nestjs/common';

import { PrismaService } from './prisma.service';

type ResolvedSkill = {
  id: number;
  name: string;
  slug: string;
};

@Injectable()
export class SkillResolverService {
  /** AI output is not constrained to the display name used in the catalog. */
  private readonly skillAliases: Readonly<Record<string, string>> = {
    js: 'javascript',
    ts: 'typescript',
    reactjs: 'react',
    nodejs: 'nodejs',
    postgres: 'postgresql',
    postgresdb: 'postgresql',
    mongo: 'mongodb',
    nextjs: 'nextjs',
    vuejs: 'vuejs',
    angularjs: 'angular',
    expressjs: 'express',
    dotnet: 'net',
    csharp: 'c#',
    cpp: 'c++',
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve a single skill name to an existing Skill record.
   *
   * Returns null when the skill cannot be resolved.
   */
  async resolveSkill(skillName: string): Promise<ResolvedSkill | null> {
    return (await this.resolveSkills([skillName]))[0] ?? null;
  }

  /**
   * Resolve multiple skill names.
   *
   * Duplicated skills are removed.
   * Unknown skills are ignored.
   */
  async resolveSkills(skillNames: readonly string[]): Promise<ResolvedSkill[]> {
    const lookupKeys = skillNames
      .filter((skillName): skillName is string => typeof skillName === 'string')
      .map((skillName) => this.normalizeSkillName(skillName))
      .filter(Boolean);

    if (!lookupKeys.length) {
      return [];
    }

    // One query avoids an N-times full catalog scan when an AI returns a list.
    const skills = await this.prisma.skill.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, slug: true },
    });
    const skillsByLookupKey = new Map<string, ResolvedSkill>();

    for (const skill of skills) {
      for (const value of [skill.name, skill.slug]) {
        const key = this.normalizeSkillName(value);
        if (key && !skillsByLookupKey.has(key)) {
          skillsByLookupKey.set(key, skill);
        }
      }
    }

    const resolved = new Map<number, ResolvedSkill>();
    for (const lookupKey of lookupKeys) {
      const canonicalKey = this.skillAliases[lookupKey] ?? lookupKey;
      // Prefer an explicit catalog name/slug before falling back to an alias.
      const skill =
        skillsByLookupKey.get(lookupKey) ?? skillsByLookupKey.get(canonicalKey);
      if (skill) resolved.set(skill.id, skill);
    }

    return [...resolved.values()];
  }

  /**
   * Resolve skills and return only their database IDs.
   *
   * Useful when creating FreelancerSkill or JobSkill records.
   */
  async resolveSkillIds(skillNames: readonly string[]) {
    const skills = await this.resolveSkills(skillNames);

    return skills.map((skill) => skill.id);
  }

  /**
   * Punctuation- and whitespace-insensitive matching lets "React.js",
   * "react js", and the slug "react-js" resolve to the same catalog skill.
   * C# and C++ retain their meaningful characters.
   */
  normalizeSkillName(value: string): string {
    return value
      .normalize('NFKC')
      .toLocaleLowerCase()
      .trim()
      .replace(/\([^)]*\)/g, ' ')
      .replace(/[._\-/]+/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\s/g, '');
  }
}
