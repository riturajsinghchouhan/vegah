import React from "react";

export class ChunkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  handleReload = () => {
    sessionStorage.removeItem("vegah_lazy_chunk_retry_timestamp");
    window.location.reload();
  };

  handleRetry = () => {
    sessionStorage.removeItem("vegah_lazy_chunk_retry_timestamp");
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const err = this.state.error;
      const isChunkError = err?.name === 'ChunkLoadError' || 
        (err?.message && (
          err.message.includes('Loading chunk') || 
          err.message.includes('dynamically imported module') ||
          err.message.includes('Failed to fetch dynamically imported module') ||
          err.message.includes('Importing a module script failed')
        ));

      if (isChunkError) {
        return (
          <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-gray-50 font-sans">
            <div className="max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100 space-y-4">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl">
                ⚡
              </div>
              <h2 className="text-xl font-bold text-gray-900">Application Updated</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                A new version of Vegah is available. Please click below to refresh and load the latest updates.
              </p>
              <button
                onClick={this.handleRetry}
                className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Refresh Page Now
              </button>
            </div>
          </div>
        );
      }

      // Generic JavaScript runtime error UI
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-gray-50 font-sans">
          <div className="max-w-lg w-full bg-white p-8 rounded-2xl shadow-xl border border-red-100 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xl font-bold">
                ⚠️
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Something went wrong</h2>
                <p className="text-xs text-gray-500">An unexpected application error occurred.</p>
              </div>
            </div>
            {err?.message && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-mono text-red-800 break-words max-h-40 overflow-y-auto">
                {err.message}
              </div>
            )}
            <button
              onClick={this.handleRetry}
              className="w-full py-2.5 px-5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm rounded-xl transition-all cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

