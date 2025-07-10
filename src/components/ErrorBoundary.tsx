import { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Error Boundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Report to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="w-full h-full flex items-center justify-center min-h-[400px] m-4">
          <div className="text-center space-y-6 max-w-md p-6">
            <AlertTriangle className="h-16 w-16 mx-auto text-destructive animate-pulse" />
            
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-destructive">
                Κάτι πήγε στραβά
              </h2>
              <p className="text-sm text-muted-foreground">
                Παρουσιάστηκε ένα απροσδόκητο σφάλμα. Παρακαλώ δοκιμάστε ξανά.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left bg-muted p-4 rounded-lg text-xs">
                <summary className="cursor-pointer font-mono text-destructive mb-2">
                  {this.state.error.message}
                </summary>
                <pre className="whitespace-pre-wrap text-muted-foreground overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="space-y-2">
              <Button onClick={this.handleRetry} className="mr-2">
                <RefreshCw className="h-4 w-4 mr-2" />
                Δοκιμή ξανά
              </Button>
              <Button variant="outline" onClick={this.handleReload}>
                <Home className="h-4 w-4 mr-2" />
                Επαναφόρτωση σελίδας
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook wrapper for functional components
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
};