/**
 * 聊天消息内容渲染：自动识别 URL，把图片/视频内联展示。
 * - 图片扩展名: png/jpg/jpeg/gif/webp/svg/avif
 * - 视频扩展名: mp4/webm/mov/m4v
 * - 兼容带 query string 的签名链接（如 supabase ?token=xxx）
 * - 兼容 Markdown 图片语法 ![alt](url)
 */
import { Fragment, type ReactNode } from 'react'

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif)$/i
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i

// 匹配 markdown 图片或裸 URL（http/https）
const TOKEN_RE = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)]+)/g

type MediaKind = 'image' | 'video' | 'link'

function detectKind(url: string): MediaKind {
  // 取 pathname 部分（去掉 query/hash）
  let pathname = url
  try {
    pathname = new URL(url).pathname
  } catch {
    pathname = url.split('?')[0].split('#')[0]
  }
  if (IMAGE_EXT.test(pathname)) return 'image'
  if (VIDEO_EXT.test(pathname)) return 'video'
  return 'link'
}

function renderMedia(url: string, alt: string, key: string): ReactNode {
  const kind = detectKind(url)
  if (kind === 'image') {
    return (
      <img
        key={key}
        src={url}
        alt={alt || 'image'}
        loading="lazy"
        className="my-2 max-h-72 max-w-full rounded-2xl object-contain shadow"
      />
    )
  }
  if (kind === 'video') {
    return (
      <video
        key={key}
        src={url}
        controls
        preload="metadata"
        className="my-2 max-h-72 max-w-full rounded-2xl shadow"
      />
    )
  }
  return (
    <a
      key={key}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all underline decoration-[#f07f61] underline-offset-2 hover:text-[#f07f61]"
    >
      {url}
    </a>
  )
}

export function MessageContent({ content }: { content: string }) {
  const parts: ReactNode[] = []
  let lastIndex = 0
  let matchIndex = 0

  for (const match of content.matchAll(TOKEN_RE)) {
    const start = match.index ?? 0
    if (start > lastIndex) {
      parts.push(<Fragment key={`t-${matchIndex}`}>{content.slice(lastIndex, start)}</Fragment>)
    }
    const [whole, mdAlt, mdUrl, rawUrl] = match
    const url = mdUrl || rawUrl
    const alt = mdAlt || ''
    parts.push(renderMedia(url, alt, `m-${matchIndex}`))
    lastIndex = start + whole.length
    matchIndex++
  }

  if (lastIndex < content.length) {
    parts.push(<Fragment key="tail">{content.slice(lastIndex)}</Fragment>)
  }

  return <>{parts}</>
}
