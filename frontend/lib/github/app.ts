import { readFileSync } from 'fs';
import { join } from 'path';
import { sign } from 'jsonwebtoken';

/**
 * GitHub App Authentication
 * Generates JWT tokens for GitHub App API access
 */

const GITHUB_APP_ID = process.env.GITHUB_APP_ID!;
const PRIVATE_KEY_PATH = process.env.GITHUB_PRIVATE_KEY_PATH!;

// Cache the private key to avoid reading file multiple times
let privateKeyCache: string | null = null;

/**
 * Get GitHub App private key from file
 */
function getPrivateKey(): string {
  if (privateKeyCache) {
    return privateKeyCache;
  }

  try {
    // Read private key from file path
    const keyPath = join(process.cwd(), PRIVATE_KEY_PATH);
    privateKeyCache = readFileSync(keyPath, 'utf8');
    return privateKeyCache;
  } catch (error) {
    console.error('Error reading GitHub private key:', error);
    throw new Error('Failed to read GitHub App private key');
  }
}

/**
 * Generate JWT token for GitHub App authentication
 * Valid for 10 minutes
 */
export function generateAppJWT(): string {
  const privateKey = getPrivateKey();

  const payload = {
    iat: Math.floor(Date.now() / 1000) - 60, // Issued at (60 seconds ago to account for clock drift)
    exp: Math.floor(Date.now() / 1000) + 600, // Expires in 10 minutes
    iss: GITHUB_APP_ID, // GitHub App ID
  };

  return sign(payload, privateKey, { algorithm: 'RS256' });
}

/**
 * Get installation access token for a specific installation
 * This token is used to make API calls on behalf of the installation
 */
export async function getInstallationAccessToken(installationId: number): Promise<string> {
  const jwt = generateAppJWT();

  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get installation access token: ${error}`);
  }

  const data = await response.json();
  return data.token;
}

/**
 * Verify GitHub App is properly configured
 */
export async function verifyAppConfiguration(): Promise<boolean> {
  try {
    const jwt = generateAppJWT();

    const response = await fetch('https://api.github.com/app', {
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    return response.ok;
  } catch (error) {
    console.error('GitHub App configuration verification failed:', error);
    return false;
  }
}
