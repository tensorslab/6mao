import type { PetAction } from '../../../../shared/ipc-channels'
import type { SpriteActionConfig, SpriteAssetConfig } from '../types'

import yellowCatPreview from '../../../../../resources/yellow_cat/cat.png?url'
import standFrame01 from '../../../../../resources/yellow_cat/stand/stand_00001_.png?url'

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
    '../../../../../resources/yellow_cat/stand/*.png',
    '!../../../../../resources/yellow_cat/stand/stand_00001_.png'
  ],
  {
    query: '?url',
    import: 'default'
  }
) as Record<string, () => Promise<FrameModule>>
const walkModules = import.meta.glob('../../../../../resources/yellow_cat/01_walk/*.png', {
  query: '?url',
  import: 'default'
}) as Record<string, () => Promise<FrameModule>>
const runModules = import.meta.glob('../../../../../resources/yellow_cat/02_run/*.png', {
  query: '?url',
  import: 'default'
}) as Record<string, () => Promise<FrameModule>>
const turnModules = import.meta.glob('../../../../../resources/yellow_cat/03_turn/*.png', {
  query: '?url',
  import: 'default'
}) as Record<string, () => Promise<FrameModule>>
const sitModules = import.meta.glob('../../../../../resources/yellow_cat/04_sit/*.png', {
  query: '?url',
  import: 'default'
}) as Record<string, () => Promise<FrameModule>>
const lieModules = import.meta.glob('../../../../../resources/yellow_cat/05_lie/*.png', {
  query: '?url',
  import: 'default'
}) as Record<string, () => Promise<FrameModule>>
const sleepModules = import.meta.glob('../../../../../resources/yellow_cat/06_sleep/*.png', {
  query: '?url',
  import: 'default'
}) as Record<string, () => Promise<FrameModule>>
const stretchModules = import.meta.glob('../../../../../resources/yellow_cat/07_stretch/*.png', {
  query: '?url',
  import: 'default'
}) as Record<string, () => Promise<FrameModule>>
const groomModules = import.meta.glob('../../../../../resources/yellow_cat/08_groom/*.png', {
  query: '?url',
  import: 'default'
}) as Record<string, () => Promise<FrameModule>>
const jumpModules = import.meta.glob('../../../../../resources/yellow_cat/09_jump/*.png', {
  query: '?url',
  import: 'default'
}) as Record<string, () => Promise<FrameModule>>
const meowModules = import.meta.glob('../../../../../resources/yellow_cat/10_meow/*.png', {
  query: '?url',
  import: 'default'
}) as Record<string, () => Promise<FrameModule>>
const shadowModules = import.meta.glob('../../../../../resources/yellow_cat/11_shadow/*.png', {
  query: '?url',
  import: 'default'
}) as Record<string, () => Promise<FrameModule>>

export const yellowCatAsset: SpriteAssetConfig = {
  previewPath: yellowCatPreview,
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
