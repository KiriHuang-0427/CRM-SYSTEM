/**
 * 统一错误处理中间件
 * 
 * 放在所有路由之后，捕获未被处理的错误
 * 路由中只需调用 next(err) 即可触发
 */
function errorHandler(err, req, res, next) {
  // 记录详细日志
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  res.status(err.status || 500).json({
    error: err.message || '服务器内部错误',
  });
}

module.exports = errorHandler;
