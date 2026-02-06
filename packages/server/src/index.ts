// 服务端主入口
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import chatRouter from './routes/chat';
import modelsRouter from './routes/models';

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3001;

// 配置中间件
app.use(cors()); // 启用CORS
app.use(bodyParser.json()); // 解析JSON请求体
app.use(bodyParser.urlencoded({ extended: true })); // 解析URL编码请求体

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '服务运行正常' });
});

// API路由
app.use('/v1/chat', chatRouter);
app.use('/v1/models', modelsRouter);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: '接口不存在',
      type: 'not_found',
      param: null,
      code: null,
    },
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务端运行在 http://localhost:${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
  console.log(`API文档: http://localhost:${PORT}/v1`);
});
