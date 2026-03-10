import CryptoJS from 'crypto-js';

/**
 * 密码 Base64 编码后传输，后端解码（避免明文）
 * 支持 UTF-8：使用 TextEncoder + btoa
 */
export function base64Encode(str) {
  if (str == null) return '';
  const s = String(str);
  try {
    const bytes = new TextEncoder().encode(s);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  } catch (_) {
    return btoa(s);
  }
}

/**
 * 验证码答案前端 MD5 后传输，后端对比 MD5(answer) 一致性
 */
export function captchaMd5(answer) {
  const s = answer == null ? '' : String(answer).trim();
  return CryptoJS.MD5(s).toString(CryptoJS.enc.Hex).toLowerCase();
}
