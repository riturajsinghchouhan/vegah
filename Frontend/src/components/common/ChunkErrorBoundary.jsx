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
    console.error("Chunk load error caught by boundary:", error, errorInfo);
  }

  handleReload = () => {
    sessionStorage.removeItem("vegah_lazy_chunk_retry_timestamp");
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
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
              onClick={this.handleReload}
              className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Refresh Page Now
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
