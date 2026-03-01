/**
 * @copyright Tomda (https://www.tomda.top)
 * @copyright UIED技术团队 (https://fsuied.com)
 * @author UIED技术团队
 * @createDate 2026.2.14
 *
 * @file apiResponse.ts
 * @description 前端 API 响应解包工具，统一处理 {code,data,message} 与直出数据两种结构
 */

/**
 * 解包 API 响应体
 * 兼容后端统一包装结构与直接返回结构。
 */
export const unwrapApiResponse = <T>(payload: unknown, fallback: T): T => {
  if (payload === undefined || payload === null) return fallback;
  if (typeof payload !== 'object') return payload as T;
  const payloadObject = payload as Record<string, unknown>;

  /**
   * 识别“包装型响应”，避免把业务对象中的普通 data 字段误判为包装体。
   * 兼容：
   * - { code, data, message }
   * - { success, data, ... }
   */
  const hasWrappedData = (
    'data' in payloadObject &&
    (
      'code' in payloadObject ||
      'success' in payloadObject ||
      'message' in payloadObject ||
      'msg' in payloadObject ||
      'error' in payloadObject
    )
  );

  if (hasWrappedData) {
    return (payloadObject.data ?? fallback) as T;
  }
  return payloadObject as T;
};

/**
 * 解包数组类型响应
 * 当后端返回空值或异常结构时，保证返回数组。
 */
export const unwrapApiList = <T>(payload: unknown): T[] => {
  const data = unwrapApiResponse<unknown>(payload, []);
  return Array.isArray(data) ? data : [];
};
