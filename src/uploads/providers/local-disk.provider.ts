import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';

export class LocalDiskProvider {
  private readonly uploadDir: string;

  constructor(uploadDir: string) {
    this.uploadDir = uploadDir;
  }

  async upload(key: string, buffer: Buffer): Promise<string> {
    const filePath = path.join(this.uploadDir, key);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await fsPromises.writeFile(filePath, buffer);
    return `/api/uploads/${key}`;
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    await fsPromises.unlink(filePath).catch(() => {});
  }

  async getSignedUrl(key: string): Promise<string> {
    return `/api/uploads/${key}`;
  }

  getFilePath(key: string): string {
    return path.join(this.uploadDir, key);
  }
}
