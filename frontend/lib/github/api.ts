import { getInstallationAccessToken } from './app';
import { GitHubPRFile, GitHubRepository } from '@/types';

/**
 * GitHub API Client
 * Handles all interactions with GitHub API
 */

export class GitHubAPIClient {
  private token: string;
  private headers: HeadersInit;

  constructor(token: string) {
    this.token = token;
    this.headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  /**
   * Create client from installation ID
   */
  static async fromInstallation(installationId: number): Promise<GitHubAPIClient> {
    const token = await getInstallationAccessToken(installationId);
    return new GitHubAPIClient(token);
  }

  /**
   * Create client from user access token (OAuth)
   */
  static fromUserToken(accessToken: string): GitHubAPIClient {
    return new GitHubAPIClient(accessToken);
  }

  /**
   * Fetch PR files with diffs
   */
  async getPRFiles(owner: string, repo: string, prNumber: number): Promise<GitHubPRFile[]> {
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`;

    try {
      const response = await fetch(url, { headers: this.headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch PR files: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching PR files:', error);
      throw error;
    }
  }

  /**
   * Fetch full PR diff
   */
  async getPRDiff(owner: string, repo: string, prNumber: number): Promise<string> {
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`;

    try {
      const response = await fetch(url, {
        headers: {
          ...this.headers,
          'Accept': 'application/vnd.github.v3.diff',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch PR diff: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      console.error('Error fetching PR diff:', error);
      throw error;
    }
  }

  /**
   * Fetch file content at specific commit
   */
  async getFileContent(owner: string, repo: string, path: string, ref: string): Promise<string> {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`;

    try {
      const response = await fetch(url, { headers: this.headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch file content: ${response.statusText}`);
      }

      const data = await response.json();
      // Content is base64 encoded
      return Buffer.from(data.content, 'base64').toString('utf-8');
    } catch (error) {
      console.error('Error fetching file content:', error);
      throw error;
    }
  }

  /**
   * Post a comment on PR (summary comment)
   */
  async postPRComment(
    owner: string,
    repo: string,
    prNumber: number,
    body: string
  ): Promise<number> {
    const url = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ body }),
      });

      if (!response.ok) {
        throw new Error(`Failed to post PR comment: ${response.statusText}`);
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error posting PR comment:', error);
      throw error;
    }
  }

  /**
   * Post an inline review comment on specific line
   */
  async postReviewComment(
    owner: string,
    repo: string,
    prNumber: number,
    commitId: string,
    path: string,
    line: number,
    body: string
  ): Promise<number> {
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/comments`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          body,
          commit_id: commitId,
          path,
          line,
          side: 'RIGHT', // Comment on the new version
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to post review comment:', error);
        throw new Error(`Failed to post review comment: ${response.statusText}`);
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error posting review comment:', error);
      throw error;
    }
  }

  /**
   * Update existing comment
   */
  async updateComment(
    owner: string,
    repo: string,
    commentId: number,
    body: string
  ): Promise<void> {
    const url = `https://api.github.com/repos/${owner}/${repo}/issues/comments/${commentId}`;

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify({ body }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update comment: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  /**
   * List user's accessible repositories
   */
  async listUserRepositories(): Promise<GitHubRepository[]> {
    const url = 'https://api.github.com/user/repos?sort=updated&per_page=100';

    try {
      const response = await fetch(url, { headers: this.headers });

      if (!response.ok) {
        throw new Error(`Failed to list repositories: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error listing repositories:', error);
      throw error;
    }
  }

  /**
   * Get installation repositories
   */
  async listInstallationRepositories(installationId: number): Promise<GitHubRepository[]> {
    const url = `https://api.github.com/user/installations/${installationId}/repositories?per_page=100`;

    try {
      const response = await fetch(url, { headers: this.headers });

      if (!response.ok) {
        throw new Error(`Failed to list installation repositories: ${response.statusText}`);
      }

      const data = await response.json();
      return data.repositories || [];
    } catch (error) {
      console.error('Error listing installation repositories:', error);
      throw error;
    }
  }

  /**
   * Get PR information
   */
  async getPRInfo(owner: string, repo: string, prNumber: number) {
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`;

    try {
      const response = await fetch(url, { headers: this.headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch PR info: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching PR info:', error);
      throw error;
    }
  }

  /**
   * Get authenticated user
   */
  async getAuthenticatedUser() {
    const url = 'https://api.github.com/user';

    try {
      const response = await fetch(url, { headers: this.headers });

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching authenticated user:', error);
      throw error;
    }
  }
}
