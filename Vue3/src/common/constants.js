import defaultAvatarAsset from "@/assets/images/avatar-default.png";

/**
 * 无头像时使用的默认头像：打包进前端本地资源，不依赖任何后端域名，
 * 后端系统设置 default_avatar_url 存在时优先使用后者
 */
export const DEFAULT_AVATAR_URL = defaultAvatarAsset;
