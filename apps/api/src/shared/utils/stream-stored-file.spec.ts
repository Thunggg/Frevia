import { NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { streamStoredFile } from './stream-stored-file';

describe('streamStoredFile', () => {
  it('returns HTTP 404 for a missing upload without an unhandled stream error', async () => {
    await expect(
      streamStoredFile(join(tmpdir(), `${randomUUID()}.png`)),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('streams an existing file and closes the file handle', async () => {
    const path = join(tmpdir(), `${randomUUID()}.txt`);
    await writeFile(path, 'fixture');
    try {
      const file = await streamStoredFile(path);
      const chunks: Buffer[] = [];
      for await (const chunk of file.getStream()) chunks.push(chunk as Buffer);
      expect(Buffer.concat(chunks).toString()).toBe('fixture');
    } finally {
      await unlink(path);
    }
  });
});
