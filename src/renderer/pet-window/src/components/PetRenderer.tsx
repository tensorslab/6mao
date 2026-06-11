import type { PetRendererProps } from '../types'
import { CatSprite } from './CatSprite'

export function PetRenderer(props: PetRendererProps) {
  return <CatSprite {...props} />
}
