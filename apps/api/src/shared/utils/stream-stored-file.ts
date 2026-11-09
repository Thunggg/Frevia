import { NotFoundException, StreamableFile } from '@nestjs/common';
import { open } from 'node:fs/promises';

export async function streamStoredFile(absolutePath: string) {
  try {
    // Open before returning the response so missing files become HTTP errors.
    const handle = await open(absolutePath, 'r');
    return new StreamableFile(handle.createReadStream());
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error.code === 'ENOENT' || error.code === 'ENOTDIR')
    ) {
      throw new NotFoundException(
        'The uploaded file is unavailable on this server.',
      );
    }
    throw error;
  }
}
