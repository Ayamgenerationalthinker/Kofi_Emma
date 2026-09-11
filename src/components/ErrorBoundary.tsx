import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// Section 89: if an unexpected runtime error occurs, show a plain "Something
// went wrong" screen with a reload action — never a raw stack trace to a
// normal user. The error itself is still logged to the console for anyone
// debugging.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Unhandled error in Abele Drums Coach:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-charcoal-950 px-6 text-center text-parchment">
        <AlertTriangle className="h-10 w-10 text-red-400" aria-hidden="true" />
        <h1 className="text-xl font-bold">Something went wrong.</h1>
        <p className="max-w-sm text-sm text-parchment/60">
          Your practice data is safe — it lives in this browser's storage, not in this screen. Reloading usually fixes it.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="min-h-[44px] rounded-md bg-gold-500 px-6 py-3 font-bold text-charcoal-950 hover:bg-gold-400"
        >
          Reload App
        </button>
      </div>
    );
  }
}
