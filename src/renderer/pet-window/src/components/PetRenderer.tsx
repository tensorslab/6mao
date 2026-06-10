import type { PetRendererProps } from '../types'
import { CatLive2D } from './CatLive2D'
import { CatSprite } from './CatSprite'

export function PetRenderer(props: PetRendererProps) {
  if (props.mode === 'live2d') {
    return <CatLive2D {...props} />
  }

  return <CatSprite {...props} />
}
