import type { Request, Response } from 'express';
import {
  getValidatedBody,
  getValidatedParams,
  getValidatedQuery,
} from '../../common/validation/validate-request.js';
import type { ChatIdentityService } from './chat.identity.js';
import {
  chatFeedbackResponseSchema,
  chatMessageListResponseSchema,
  chatSessionListResponseSchema,
  chatSessionResponseSchema,
  chatSseEventSchema,
  type ChatFeedbackInput,
  type ChatListQuery,
  type ChatMessageListQuery,
  type ChatMessageParams,
  type ChatSessionParams,
  type CreateChatSessionInput,
  type SendChatMessageInput,
} from './chat.schemas.js';
import type { ChatService } from './chat.service.js';

export class ChatController {
  constructor(
    private readonly service: ChatService,
    private readonly identityService: ChatIdentityService,
  ) {}

  createSession = async (request: Request, response: Response): Promise<void> => {
    const identity = await this.identityService.resolve(request, response);
    const data = await this.service.createSession(
      identity,
      getValidatedBody<CreateChatSessionInput>(request),
    );
    response.status(201).json(chatSessionResponseSchema.parse({ success: true, data, meta: null }));
  };

  listSessions = async (request: Request, response: Response): Promise<void> => {
    const identity = await this.identityService.resolve(request, response);
    const result = await this.service.listSessions(
      identity,
      getValidatedQuery<ChatListQuery>(request),
    );
    response.status(200).json(
      chatSessionListResponseSchema.parse({
        success: true,
        data: result.data,
        meta: result.meta,
      }),
    );
  };

  listMessages = async (request: Request, response: Response): Promise<void> => {
    const identity = await this.identityService.resolve(request, response);
    const result = await this.service.listMessages(
      identity,
      getValidatedParams<ChatSessionParams>(request).id,
      getValidatedQuery<ChatMessageListQuery>(request),
    );
    response.status(200).json(
      chatMessageListResponseSchema.parse({
        success: true,
        data: result.data,
        meta: result.meta,
      }),
    );
  };

  sendMessage = async (request: Request, response: Response): Promise<void> => {
    const identity = await this.identityService.resolve(request, response);
    const abortController = new AbortController();
    const abort = () => abortController.abort(new Error('CLIENT_CLOSED'));
    request.once('aborted', abort);
    response.once('close', () => {
      if (!response.writableEnded) abort();
    });
    const events = await this.service.prepareStream(
      identity,
      getValidatedParams<ChatSessionParams>(request).id,
      getValidatedBody<SendChatMessageInput>(request),
      abortController.signal,
    );

    response.status(200);
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    response.setHeader('Cache-Control', 'no-cache, no-transform');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no');
    response.flushHeaders();
    try {
      for await (const rawEvent of events) {
        if (abortController.signal.aborted || response.destroyed) break;
        const event = chatSseEventSchema.parse(rawEvent);
        response.write(`event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`);
      }
    } catch {
      if (!response.destroyed) {
        response.write(
          `event: error\ndata: ${JSON.stringify({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Luồng chat bị gián đoạn',
            retryable: true,
            partial: true,
          })}\n\n`,
        );
      }
    } finally {
      if (!response.destroyed) response.end();
    }
  };

  feedback = async (request: Request, response: Response): Promise<void> => {
    const identity = await this.identityService.resolve(request, response);
    const data = await this.service.feedback(
      identity,
      getValidatedParams<ChatMessageParams>(request).id,
      getValidatedBody<ChatFeedbackInput>(request),
    );
    response
      .status(200)
      .json(chatFeedbackResponseSchema.parse({ success: true, data, meta: null }));
  };
}
