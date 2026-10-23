import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught error:', error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="w-full min-h-[360px] p-8 flex flex-col items-center justify-center text-center bg-[#F4F0E8] border border-[rgba(23,40,61,0.12)] rounded-2xl my-6"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <div className="w-12 h-12 rounded-full bg-[#D71920]/10 flex items-center justify-center text-[#D71920] mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3
            className="text-2xl font-bold uppercase tracking-wider text-[#17283D] mb-2"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
          >
            {this.props.fallbackTitle || 'EXPERIENCE TEMPORARILY UNAVAILABLE'}
          </h3>
          <p className="text-sm text-[#536174] max-w-md mb-6 leading-relaxed">
            A temporary display exception occurred while rendering this section. You can reload this component to restore full interactivity.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#17283D] hover:bg-[#315F9C] text-white text-xs uppercase tracking-widest font-semibold transition-all shadow-sm cursor-pointer"
            style={{ fontFamily: "'Rajdhani', sans-serif" }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Module</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
