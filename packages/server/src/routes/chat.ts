// 聊天路由
import express from 'express';
import type { Request, Response } from 'express';
import type { ChatRequest } from '../types';
import {
  sendChatRequest,
  sendStreamChatRequest,
} from '../services/siliconFlow';

const router = express.Router();

const getModelBaseUrl = (req: Request) => {
  const baseUrlHeader = req.headers['x-model-base-url'];
  return Array.isArray(baseUrlHeader) ? baseUrlHeader[0] : baseUrlHeader;
};

/**
 * 聊天完成接口（支持普通和流式响应）
 */
router.post('/completions', async (req: Request, res: Response) => {
  try {
    console.log('收到聊天请求:', {
      path: req.path,
      method: req.method,
      headers: {
        authorization: req.headers.authorization ? '***' + req.headers.authorization.slice(-4) : '空',
        'content-type': req.headers['content-type'],
      },
      hasBody: !!req.body,
    });

    const apiKey = req.headers.authorization?.replace('Bearer ', '') || '';
    const baseUrl = getModelBaseUrl(req);

    console.log('提取的API Key:', apiKey ? '***' + apiKey.slice(-4) : '空');

    if (!apiKey) {
      console.log('返回401错误: 未提供API Key');
      return res.status(401).json({
        error: {
          message: '未提供API Key',
          type: 'unauthorized',
          param: null,
          code: null,
        },
      });
    }

    const request: ChatRequest = req.body;

    if (!request.model || !request.messages || request.messages.length === 0) {
      return res.status(400).json({
        error: {
          message: '缺少必要的请求参数',
          type: 'bad_request',
          param: null,
          code: null,
        },
      });
    }

    if (request.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      sendStreamChatRequest(
        apiKey,
        request,
        baseUrl,
        (chunk) => {
          res.write(
            `data: ${JSON.stringify({
              id: `chatcmpl-${Date.now()}`,
              object: 'chat.completion.chunk',
              created: Math.floor(Date.now() / 1000),
              model: request.model,
              choices: [
                {
                  index: 0,
                  delta: {
                    content: chunk,
                  },
                  finish_reason: null,
                },
              ],
            })} \n\n`,
          );
        },
        () => {
          res.write('data: [DONE]\n\n');
          res.end();
        },
        (error) => {
          console.error('流式请求失败:', error);

          res.write(
            `data: ${JSON.stringify({
              error: {
                message: error.message,
                type: 'server_error',
                param: null,
                code: null,
              },
            })} \n\n`,
          );

          res.write('data: [DONE]\n\n');
          res.end();
        },
      );
    } else {
      const response = await sendChatRequest(apiKey, request, baseUrl);
      return res.json(response);
    }
  } catch (error) {
    console.error('聊天请求失败:', error);

    return res.status(500).json({
      error: {
        message: error instanceof Error ? error.message : '服务器内部错误',
        type: 'server_error',
        param: null,
        code: null,
      },
    });
  }
});

export default router;
