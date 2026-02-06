// 模型路由
import express from 'express';
import type { Request, Response } from 'express';
import { getAvailableModels } from '../services/siliconFlow';

const router = express.Router();

/**
 * 获取模型列表
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // 从请求头获取API Key
    const apiKey = req.headers.authorization?.replace('Bearer ', '') || '';
    
    if (!apiKey) {
      return res.status(401).json({
        error: {
          message: '未提供API Key',
          type: 'unauthorized',
          param: null,
          code: null,
        },
      });
    }
    
    // 获取模型列表
    const models = await getAvailableModels(apiKey);
    
    // 返回响应
    res.json({
      object: 'list',
      data: models.map(model => ({
        id: model.id,
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: 'siliconflow',
      })),
    });
  } catch (error) {
    console.error('获取模型列表失败:', error);
    
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
