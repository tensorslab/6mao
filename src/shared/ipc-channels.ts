export const IPC_CHANNELS = {
  // ── 窗口控制 ──
  WINDOW_OPEN_CHAT: 'window:open-chat',
  WINDOW_CLOSE_CHAT: 'window:close-chat',
  WINDOW_SET_IGNORE_MOUSE: 'window:set-ignore-mouse',
  WINDOW_PET_DRAG_START: 'window:pet-drag-start',
  WINDOW_PET_DRAG_MOVE: 'window:pet-drag-move',
  WINDOW_PET_DRAG_END: 'window:pet-drag-end',
  WINDOW_PET_MOTION_RESUME: 'window:pet-motion-resume',

  // ── 宠物数据 ──
  PET_SWITCH: 'pet:switch',
  PET_CURRENT: 'pet:current',
  PET_STATUS_UPDATE: 'pet:status-update',
  PET_EMOTION: 'pet:emotion',
  PET_ACTION: 'pet:action',

  // ── Daemon 管理 ──
  DAEMON_STATUS: 'daemon:status',
  DAEMON_PORT: 'daemon:port',

  // ── 大师调用 ──
  MASTER_START: 'master:start',
  MASTER_DONE: 'master:done',
  MASTER_ARTIFACT: 'master:artifact',

  // ── 主动行为（Daemon → 宠物） ──
  PET_PROACTIVE: 'pet:proactive',

  // ── 偏好设置 ──
  PREFERENCES_UPDATE: 'preferences:update'
} as const

export type PetEmotion =
  | 'idle'
  | 'talk'
  | 'happy'
  | 'sad'
  | 'surprised'
  | 'thinking'
  | 'painting'
  | 'celebrate'
  | 'sleep'
  | 'paw_wave'

export type PetRenderMode = 'sprite' | 'live2d'

export type PetAction =
  | 'stand'
  | 'walk'
  | 'run'
  | 'turn'
  | 'sit'
  | 'lie'
  | 'sleep'
  | 'stretch'
  | 'groom'
  | 'jump'
  | 'meow'
  | 'shadow'

export type PetDirection = 'left' | 'right'

export type DaemonStatus = 'starting' | 'running' | 'stopped' | 'error'

export interface OpenChatPayload {
  petId: string
}

export interface PetDragPayload {
  screenX: number
  screenY: number
}

export interface PetSwitchPayload {
  petId: string
  name?: string
}

export interface PetCurrentPayload {
  petId: string
  name: string
}

export interface PetEmotionPayload {
  emotion: PetEmotion
}

export interface PetActionPayload {
  action: PetAction
  direction?: PetDirection
}

export interface DaemonStatusPayload {
  status: DaemonStatus
  port?: number
}

export interface MasterStartPayload {
  masterType: string
  taskId: string
}

export interface MasterDonePayload {
  taskId: string
  summary?: string
}

export interface MasterArtifactPayload {
  taskId: string
  type: 'image' | 'code' | 'text' | 'search'
  data: string
}

export interface PetProactivePayload {
  action: string
  text?: string
}

export interface PreferencesUpdatePayload {
  key: string
  value: unknown
}
