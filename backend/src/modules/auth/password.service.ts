import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';

interface ScryptParameters {
  cost: number;
  blockSize: number;
  parallelization: number;
  keyLength: number;
}

const defaultParameters: ScryptParameters = {
  cost: 16_384,
  blockSize: 8,
  parallelization: 1,
  keyLength: 64,
};

function deriveKey(password: string, salt: Buffer, parameters: ScryptParameters): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    nodeScrypt(
      password,
      salt,
      parameters.keyLength,
      {
        N: parameters.cost,
        r: parameters.blockSize,
        p: parameters.parallelization,
        maxmem: 64 * 1024 * 1024,
      },
      (error, derivedKey) => {
        if (error) reject(error);
        else resolve(derivedKey);
      },
    );
  });
}

export class PasswordService {
  constructor(private readonly parameters: ScryptParameters = defaultParameters) {}

  async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const derivedKey = await deriveKey(password, salt, this.parameters);
    return [
      'scrypt',
      this.parameters.cost,
      this.parameters.blockSize,
      this.parameters.parallelization,
      salt.toString('base64url'),
      derivedKey.toString('base64url'),
    ].join('$');
  }

  async verify(password: string, encodedHash: string): Promise<boolean> {
    const [algorithm, cost, blockSize, parallelization, salt, storedKey] = encodedHash.split('$');
    if (algorithm !== 'scrypt' || !cost || !blockSize || !parallelization || !salt || !storedKey) {
      return false;
    }

    const expectedKey = Buffer.from(storedKey, 'base64url');
    const decodedSalt = Buffer.from(salt, 'base64url');
    const parameters: ScryptParameters = {
      cost: Number(cost),
      blockSize: Number(blockSize),
      parallelization: Number(parallelization),
      keyLength: expectedKey.length,
    };
    if (
      !Number.isSafeInteger(parameters.cost) ||
      parameters.cost < 16_384 ||
      parameters.cost > 32_768 ||
      (parameters.cost & (parameters.cost - 1)) !== 0 ||
      !Number.isSafeInteger(parameters.blockSize) ||
      parameters.blockSize < 1 ||
      parameters.blockSize > 16 ||
      !Number.isSafeInteger(parameters.parallelization) ||
      parameters.parallelization < 1 ||
      parameters.parallelization > 4 ||
      parameters.keyLength < 32 ||
      parameters.keyLength > 128 ||
      decodedSalt.length < 16 ||
      decodedSalt.length > 64
    ) {
      return false;
    }

    try {
      const actualKey = await deriveKey(password, decodedSalt, parameters);
      return actualKey.length === expectedKey.length && timingSafeEqual(actualKey, expectedKey);
    } catch {
      return false;
    }
  }
}
