module.exports = app => {
  /**
   * Socket 消息过滤中间件（示例事件）
   */
  return async (ctx, next) => {
    void app;
    ctx.socket.emit('res', '我在每次回话的时候才执行');
    await next();
  };
};
