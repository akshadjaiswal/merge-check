import { GroqCompletionRequest, GroqCompletionResponse } from '@/types';

/**
 * Groq AI Client
 * Handles all interactions with Groq API
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY!;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-70b-versatile'; // Fast and accurate

export class GroqClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || GROQ_API_KEY;

    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }
  }

  /**
   * Create a chat completion
   */
  async createCompletion(request: GroqCompletionRequest): Promise<GroqCompletionResponse> {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model || MODEL,
          messages: request.messages,
          temperature: request.temperature ?? 0.3, // Lower temperature for consistent results
          max_tokens: request.max_tokens ?? 4000,
          response_format: request.response_format,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${response.status} ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Groq API error:', error);
      throw error;
    }
  }

  /**
   * Create completion with JSON response format
   */
  async createJSONCompletion(request: Omit<GroqCompletionRequest, 'response_format'>): Promise<any> {
    const response = await this.createCompletion({
      ...request,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in Groq response');
    }

    try {
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse JSON response:', content);
      throw new Error('Invalid JSON response from Groq');
    }
  }

  /**
   * Get usage statistics from response
   */
  getUsageStats(response: GroqCompletionResponse): {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  } {
    return response.usage;
  }
}

// Export singleton instance
export const groqClient = new GroqClient();
