import * as bcrypt from 'bcrypt';

export class HashingService {
  private readonly SALT_ROUNDS = 10;

  async hash(value: string): Promise<string> {
    return (await bcrypt.hash(value, this.SALT_ROUNDS)) as string;
  }

  async verify(value: string, hash: string): Promise<boolean> {
    return (await bcrypt.compare(value, hash)) as boolean;
  }
}
