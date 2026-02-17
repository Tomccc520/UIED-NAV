// 这里回话会在socket链接成功的时候一次才会触发
module.exports = () => {
  /**
   * Socket 连接鉴权中间件（占位）
   */
  return async (ctx, next) => {
    void ctx;
    await next();
  };
};
