import { useEffect, useState } from 'react'
import { Cat, Share2, MessageCircle } from 'lucide-react'
import type { Pet } from '../api/types'

interface SuccessCelebrationProps {
  pet: Pet
  totalCount: number
  onStartChat: () => void
}

export function SuccessCelebration({ pet, totalCount, onStartChat }: SuccessCelebrationProps) {
  const [stage, setStage] = useState<'celebration' | 'card'>('celebration')
  const [showBondTip, setShowBondTip] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setStage('card')
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (stage === 'card') {
      const timer = setTimeout(() => setShowBondTip(true), 1000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [stage])

  const handleSaveCard = () => {
    // 模拟保存逻辑，实际可使用 html2canvas 等
    alert('正在生成领养纪念卡并保存到本地...')
  }

  const getOrdinalText = (count: number) => {
    const chineseOrdinals = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
    if (count <= 3) {
      return `第 ${chineseOrdinals[count]} 只专属桌面伙伴`
    }
    return `第 ${count} 只专属桌面伙伴`
  }

  const getEmotionalQuote = (count: number) => {
    if (count === 1) return '故事的开始✨'
    if (count === 2) return '半山喵事处热闹起来啦'
    if (count === 3) return '铲屎官的喵窝又添一员'
    return '大家庭又壮大啦'
  }

  const getBondText = (count: number) => {
    if (count === 1) return '✨ 首次羁绊达成 1%'
    if (count === 2) return '✨ 新羁绊达成 1%'
    return '✨ 羁绊达成 +1'
  }

  const getPersonalityLabel = (templateId?: string) => {
    const labels: Record<string, string> = {
      'cat-default': '均衡型',
      'cat-tsundere': '傲娇型',
      'cat-clingy': '黏人型',
      'cat-social': '社牛型',
      'cat-philosopher': '哲学家',
      'cat-mischief': '淘气型',
      'cat-lazy': '懒懒型'
    }
    return labels[templateId || ''] || '神秘'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#fffcf5]/95 backdrop-blur-sm animate-in fade-in duration-500">
      {/* 庆祝阶段 */}
      {stage === 'celebration' && (
        <div className="relative flex flex-col items-center">
          <div className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#f4b860]/20" />
          <div className="absolute inset-0 -z-10 h-64 w-64 animate-pulse rounded-full bg-[#f07f61]/10 blur-3xl" />
          
          <div className="relative mb-6 transform transition-all duration-1000 ease-out scale-110">
            {/* 猫咪剪影渐变为清晰图标 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center animate-out fade-out fill-mode-forwards duration-1000">
                <Cat size={120} className="text-[#2c2118]/10" />
              </div>
              <div className="animate-in fade-in zoom-in-90 duration-1000 delay-500">
                <div className="rounded-full bg-[#f4b860] p-8 text-white shadow-2xl">
                  <Cat size={80} />
                </div>
              </div>
            </div>
            
            {/* 粒子效果模拟 */}
            <div className="absolute -inset-8 pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute h-4 w-4 text-[#f07f61] animate-in zoom-in-0 fade-in duration-1000 delay-700 fill-mode-forwards"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `rotate(${i * 45}deg) translateY(-80px)`,
                  }}
                >
                  ❤️
                </div>
              ))}
            </div>
          </div>
          
          <h2 className="animate-in slide-in-from-bottom-4 fade-in text-3xl font-black text-[#2c2118] duration-700 delay-1000">
            领养成功！
          </h2>
        </div>
      )}

      {/* 纪念卡阶段 */}
      {stage === 'card' && (
        <div className="w-full max-w-sm px-6 animate-in zoom-in-95 fade-in duration-500">
          <div className="relative overflow-hidden rounded-[40px] border border-white/60 bg-[#fff7e8] p-8 shadow-2xl">
            {/* 卡片顶部 */}
            <div className="mb-8 flex items-center justify-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-[#2c2118] p-1 text-white">
                <Cat size={16} />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-[#2c2118]/40">
                半山喵事处
              </span>
            </div>

            {/* 卡片中间 */}
            <div className="mb-10 flex flex-col items-center text-center">
              <div className="mb-6 rounded-[32px] bg-[#f4b860] p-8 text-white shadow-lg ring-8 ring-white/50">
                <Cat size={64} />
              </div>
              <h1 className="mb-2 text-3xl font-black text-[#2c2118]">{pet.name}</h1>
              <span className="rounded-full bg-[#f07f61] px-4 py-1 text-sm font-black text-white">
                {getPersonalityLabel(pet.template)}小猫咪
              </span>
            </div>

            {/* 卡片底部 */}
            <div className="border-t border-[#2c2118]/5 pt-8 text-center">
              <p className="mb-1 text-xs font-bold text-[#2c2118]/40">领养日期：{new Date().toLocaleDateString()}</p>
              <p className="text-sm font-black text-[#f07f61]">
                {getOrdinalText(totalCount)}，{getEmotionalQuote(totalCount)}
              </p>
            </div>

            {/* 饰品装饰 */}
            <div className="absolute -right-4 -top-4 text-4xl opacity-10">🐾</div>
            <div className="absolute -bottom-4 -left-4 text-4xl opacity-10">🐾</div>
          </div>

          {/* 操作按钮 */}
          <div className="mt-8 flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                onClick={handleSaveCard}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#2c2118]/10 bg-white/80 py-4 font-black text-[#2c2118] transition hover:bg-white"
              >
                <Share2 size={18} />
                保存纪念卡
              </button>
              <button
                onClick={onStartChat}
                className="flex flex-[1.5] items-center justify-center gap-2 rounded-2xl bg-[#2c2118] py-4 font-black text-white shadow-xl transition hover:scale-[1.02]"
              >
                <MessageCircle size={18} />
                开始和 TA 聊天
              </button>
            </div>
            {showBondTip && (
              <div className="flex items-center justify-center gap-2 animate-in slide-in-from-top-2 fade-in">
                <span className="text-xs font-bold text-[#f4b860]">{getBondText(totalCount)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
