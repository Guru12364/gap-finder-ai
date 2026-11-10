import Groq from 'groq-sdk';

const PRIMARY_MODEL = 'qwen/qwen3.8-27b';
const FALLBACK_MODEL = 'openai/gpt-oss-120b';

let groqInstance: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqInstance) {
    const apiKey = process.env.GROQ_API_KEY || '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';
    groqInstance = new Groq({ apiKey });
  }
  return groqInstance;
}

export interface GenerationOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

/**
 * Generates text completions using Groq's high-speed inference.
 * Uses llama-3.3-70b-versatile by default with automatic fallback to llama3-70b-8192.
 */
export async function generateWithGroq(
  systemPrompt: string,
  userPrompt: string,
  options?: GenerationOptions
): Promise<string> {
  const client = getGroqClient();
  const temperature = options?.temperature ?? 0.2;
  const maxTokens = options?.maxTokens ?? 4096;

  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  const requestPayload: Groq.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
    model: PRIMARY_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
    ...(options?.jsonMode ? { response_format: { type: 'json_object' } } : {}),
  };

  try {
    const completion = await client.chat.completions.create(requestPayload);
    const content = completion.choices[0]?.message?.content;
    if (content === undefined || content === null) {
      throw new Error('Groq returned an empty completion');
    }
    return content;
  } catch (error: any) {
    // If the primary model failed with model not found or rate limit, attempt fallback model
    if (
      error?.status === 404 ||
      error?.message?.toLowerCase().includes('model_not_found') ||
      error?.message?.toLowerCase().includes('decommissioned')
    ) {
      try {
        const fallbackCompletion = await client.chat.completions.create({
          ...requestPayload,
          model: FALLBACK_MODEL,
        });
        const fallbackContent = fallbackCompletion.choices[0]?.message?.content;
        if (fallbackContent !== undefined && fallbackContent !== null) {
          return fallbackContent;
        }
      } catch (fallbackError: any) {
        throw new Error(
          `Groq generation failed on both primary and fallback models: ${fallbackError.message || String(fallbackError)}`
        );
      }
    }

    throw new Error(`Groq generation failed: ${error.message || String(error)}`);
  }
}

/**
 * Generates streaming completions from Groq for interactive chat and assistant responses.
 * Yields text tokens in real time as they are generated.
 */
export async function* generateStreamWithGroq(
  systemPrompt: string,
  userPrompt: string
): AsyncGenerator<string, void, unknown> {
  const client = getGroqClient();

  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  let stream: any;
  try {
    stream = await client.chat.completions.create({
      model: PRIMARY_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 3000,
      stream: true,
    });
  } catch (err: any) {
    // Fallback to secondary model if primary fails to stream
    stream = await client.chat.completions.create({
      model: FALLBACK_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 3000,
      stream: true,
    });
  }

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    if (delta) {
      yield delta;
    }
  }
}

/**
 * Parses and extracts structured JSON from an LLM response string.
 * Resiliently handles markdown fences (```json ... ```), preamble text,
 * and trailing commas.
 */
export async function parseJsonResponse<T>(response: string): Promise<T> {
  if (!response || !response.trim()) {
    throw new Error('Cannot parse empty or null LLM response as JSON');
  }

  let text = response.trim();

  // 1. Remove markdown code fence blocks if present
  if (text.includes('```json')) {
    text = text.split('```json')[1]?.split('```')[0]?.trim() || text;
  } else if (text.includes('```')) {
    text = text.split('```')[1]?.split('```')[0]?.trim() || text;
  }

  // 2. Direct parse attempt
  try {
    return JSON.parse(text) as T;
  } catch {
    // 3. Find boundaries of the outermost JSON structure (Object or Array)
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');

    let start = -1;
    let end = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      start = firstBrace;
      end = text.lastIndexOf('}');
    } else if (firstBracket !== -1) {
      start = firstBracket;
      end = text.lastIndexOf(']');
    }

    if (start !== -1 && end !== -1 && end > start) {
      const candidate = text.substring(start, end + 1);
      try {
        return JSON.parse(candidate) as T;
      } catch {
        // 4. Clean trailing commas in arrays/objects: e.g. [1, 2,] or {"a": 1,}
        const cleanedCandidate = candidate
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/[\x00-\x1F\x7F-\x9F]/g, '');

        try {
          return JSON.parse(cleanedCandidate) as T;
        } catch (finalErr: any) {
          throw new Error(
            `Failed to parse LLM JSON response: ${finalErr.message}. Raw snippet: "${candidate.slice(0, 160)}..."`
          );
        }
      }
    }

    throw new Error(
      `No valid JSON object or array found in LLM output: "${text.slice(0, 160)}..."`
    );
  }
}
