import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled application error:', error, errorInfo)
  }

  handleClearCacheAndReload = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys()
        await Promise.all(keys.map(key => caches.delete(key)))
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map(reg => reg.unregister()))
      }
    } catch (e) {
      console.error('Error clearing cache:', e)
    }
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center text-red-400 text-2xl font-bold">
              !
            </div>
            <h2 className="text-xl font-black text-white mb-2">RiseUp Results Publisher</h2>
            <p className="text-sm text-slate-400 mb-4">
              An unexpected issue occurred while rendering the interface.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl text-left text-xs font-mono text-red-300 border border-red-500/20 mb-6 overflow-x-auto">
              {this.state.error?.message || 'Unknown error'}
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-sky-500/20 cursor-pointer"
              >
                Reload Page
              </button>
              <button
                onClick={this.handleClearCacheAndReload}
                className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition-all cursor-pointer"
              >
                Clear Cache & Refresh App
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
