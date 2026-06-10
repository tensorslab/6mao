import { Component, ReactNode } from 'react'

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  render() {
    if (!this.state.error) {
      return this.props.children
    }

    return (
      <main className="grid h-full place-items-center bg-[#fff7e8] p-6 text-[#2c2118]">
        <section className="max-w-lg rounded-[28px] border border-[#f07f61]/30 bg-white p-6 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#f07f61]">Runtime Error</p>
          <h1 className="mt-2 text-2xl font-black">页面运行时出错</h1>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-[#2c2118]/70">
            这不是后端业务报错，而是前端渲染阶段抛出了异常。错误已被拦截，避免继续白屏。
          </p>
          <pre className="mt-4 max-h-64 overflow-auto rounded-2xl bg-[#192133] p-4 text-xs text-white">
            {this.state.error.message}
          </pre>
          <button
            className="mt-4 rounded-2xl bg-[#2c2118] px-4 py-2 font-black text-white"
            onClick={() => window.location.reload()}
          >
            重新加载
          </button>
        </section>
      </main>
    )
  }
}
