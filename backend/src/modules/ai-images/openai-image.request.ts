import OpenAI from 'openai';
import type { AppConfig } from '../../config/env.js';

export interface StructuredImageRequest {
  imageUrl: string;
  model: string;
  instructions: string;
  prompt: string;
  schemaName: string;
  schema: Record<string, unknown>;
  detail: 'high' | 'original';
  maxOutputTokens: number;
}

export type RequestStructuredImage = (request: StructuredImageRequest) => Promise<string>;

export function createOpenAiImageRequester(config: AppConfig): RequestStructuredImage {
  let client: OpenAI | null = null;
  return async (request) => {
    if (!config.ai.openAiApiKey) throw new Error('OpenAI image provider is not configured');
    const imageUrl = new URL(request.imageUrl);
    if (
      imageUrl.protocol !== 'https:' ||
      imageUrl.hostname !== 'res.cloudinary.com' ||
      !imageUrl.pathname.startsWith(`/${config.cloudinaryCloudName}/image/upload/`)
    ) {
      throw new Error('Image URL is not an owned Cloudinary image');
    }
    client ??= new OpenAI({
      apiKey: config.ai.openAiApiKey,
      baseURL: config.ai.openAiBaseUrl,
      timeout: config.ai.timeoutMs,
      maxRetries: 1,
    });
    const response = await client.responses.create({
      model: request.model,
      instructions: request.instructions,
      input: [{
        role: 'user',
        content: [
          { type: 'input_text', text: request.prompt },
          { type: 'input_image', image_url: request.imageUrl, detail: request.detail },
        ],
      }],
      text: { format: { type: 'json_schema', name: request.schemaName, strict: true, schema: request.schema } },
      max_output_tokens: request.maxOutputTokens,
      store: false,
    });
    if (response.status !== 'completed' || !response.output_text) {
      throw new Error('OpenAI image response was incomplete');
    }
    return response.output_text;
  };
}
