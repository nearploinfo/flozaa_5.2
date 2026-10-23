import { Component, type ErrorInfo, type ReactNode } from "react";
import { SomethingWentWrong } from "@/components/layout/something-went-wrong";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Catches render/lifecycle exceptions anywhere below it (not async/promise
 * errors — those must be caught at the call site) and swaps the crashed
 * subtree for the SomethingWentWrong fallback instead of a blank page. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled render error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <SomethingWentWrong onRetry={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}
