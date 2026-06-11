import type { PetAction } from '../../../../shared/ipc-channels'
import type { SpriteActionConfig, SpriteAssetConfig } from '../types'

import blackAndWhiteCatPreview from '../../../../../resources/black_and_white/cat.png?url'
import standFrame01 from '../../../../../resources/black_and_white/00_stand/00_stand_00001_.png?url'

type FrameModule = { default: string } | string

const LOOPING_ACTIONS = new Set<PetAction>(['stand', 'walk', 'run', 'sleep'])

const FPS_BY_ACTION: Partial<Record<PetAction, number>> = {
  stand: 10,
  walk: 12,
  run: 16,
  turn: 14,
  sit: 12,
  lie: 10,
  sleep: 8,
  stretch: 12,
  groom: 10,
  jump: 16,
  meow: 12,
  shadow: 12
}

function moduleUrl(module: FrameModule): string {
  return typeof module === 'string' ? module : module.default
}

function sortFrameEntries(
  entries: Array<[string, () => Promise<FrameModule>]>
): Array<[string, () => Promise<FrameModule>]> {
  return entries.sort(([left], [right]) => left.localeCompare(right))
}

function createActionConfig(
  action: PetAction,
  firstFrame: string,
  modules: Record<string, () => Promise<FrameModule>>
): SpriteActionConfig {
  let cachedFrames: string[] | null = null

  return {
    fps: FPS_BY_ACTION[action] ?? 12,
    frames: [firstFrame],
    loop: LOOPING_ACTIONS.has(action),
    loadFrames: async () => {
      if (cachedFrames) return cachedFrames

      const loadedFrames = await Promise.all(
        sortFrameEntries(Object.entries(modules)).map(([, load]) => load().then(moduleUrl))
      )
      cachedFrames = [firstFrame, ...loadedFrames]
      return cachedFrames
    }
  }
}

const standModules = import.meta.glob(
  [
    '../../../../../resources/black_and_white/00_stand/*.png',
    '!../../../../../resources/black_and_white/00_stand/00_stand_00001_.png'
  ],
  {
    query: '?url',
    import: 'default'
  }
) as Record<string, () => Promise<FrameModule>>
const walkModules = import.meta.glob('../../../../../resources/black_and_white/01_walk/*.png', {
  query: '?url',
  import: 'default'
}) as Record<string, () => Promise<FrameModule>>
const runModules = import.meta.glob('../../../../../resources/black_and_white/02_run/*.png', {
  query: '?url',
  import: 'default'
}) as Record<string, () => Promise<FrameModule>>
const turnModules = import.meta.glob('../../../../../resources/black_and_white/03_turn/*.png', {
  query: '?url',
  import: 'default'
}) as Record<string, () => Promise<FrameModule>>
const sitModules = import.meta.glob('../../../../../resources/black_and_white/04_sit/*.png', {
  query: '?url',
  import: 'default'
}) as Record<string, () => Promise<FrameModule>>
const lieModules = import.meta.glob('../../../../../resources/black_and_white/05_lie/*.png', {
  query: '?url',
  import: 'default'
}) as Record<string, () => Promise<FrameModule>>
const sleepModules = import.meta.glob('../../../../../resources/black_and_white/06_sleep/*.png', {
  query: '?url',
  import: 'default'
}) as Record<string, () => Promise<FrameModule>>
const stretchModules = import.meta.glob(
  '../../../../../resources/black_and_white/07_stretch/*.png',
  {
    query: '?url',
    import: 'default'
  }
) as Record<string, () => Promise<FrameModule>>
const groomModules = import.meta.glob('../../../../../resources/black_and_white/08_groom/*.png', {
  query: '?url',
  import: 'default'
}) as Record<string, () => Promise<FrameModule>>
const jumpModules = import.meta.glob('../../../../../resources/black_and_white/09_jump/*.png', {
  query: '?url',
  import: 'default'
}) as Record<string, () => Promise<FrameModule>>
const meowModules = import.meta.glob('../../../../../resources/black_and_white/10_meow/*.png', {
  query: '?url',
  import: 'default'
}) as Record<string, () => Promise<FrameModule>>
const shadowModules = import.meta.glob('../../../../../resources/black_and_white/11_shadow/*.png', {
  query: '?url',
  import: 'default'
}) as Record<string, () => Promise<FrameModule>>

export const blackAndWhiteCatAsset: SpriteAssetConfig = {
  previewPath: blackAndWhiteCatPreview,
  defaultAction: 'stand',
  actions: {
    stand: createActionConfig('stand', standFrame01, standModules),
    walk: createActionConfig('walk', standFrame01, walkModules),
    run: createActionConfig('run', standFrame01, runModules),
    turn: createActionConfig('turn', standFrame01, turnModules),
    sit: createActionConfig('sit', standFrame01, sitModules),
    lie: createActionConfig('lie', standFrame01, lieModules),
    sleep: createActionConfig('sleep', standFrame01, sleepModules),
    stretch: createActionConfig('stretch', standFrame01, stretchModules),
    groom: createActionConfig('groom', standFrame01, groomModules),
    jump: createActionConfig('jump', standFrame01, jumpModules),
    meow: createActionConfig('meow', standFrame01, meowModules),
    shadow: createActionConfig('shadow', standFrame01, shadowModules)
  }
}
