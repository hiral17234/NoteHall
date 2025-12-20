import { AlertTriangle, Settings, RefreshCw } from "lucide-react";
import { firebaseMissingKeys } from "@/lib/firebase";

export function FirebaseConfigError() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Firebase Configuration Required
          </h1>
          <p className="text-muted-foreground">
            The app cannot start because Firebase is not configured correctly.
          </p>
        </div>

        {/* Missing Keys */}
        {firebaseMissingKeys.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-4 text-left">
            <p className="text-sm font-medium text-foreground mb-2">
              Missing environment variables:
            </p>
            <ul className="space-y-1">
              {firebaseMissingKeys.map((key) => (
                <li key={key} className="text-sm text-destructive font-mono">
                  • {key}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-card border border-border rounded-lg p-4 text-left space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Settings className="w-4 h-4" />
            How to fix this
          </h2>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Open your <strong>Firebase Console</strong></li>
            <li>Go to Project Settings → General</li>
            <li>Copy your web app configuration values</li>
            <li>In Lovable, go to <strong>Settings → Secrets</strong></li>
            <li>Add each missing secret with the correct value</li>
            <li>
              <strong>Redeploy</strong> the application
            </li>
          </ol>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Page
        </button>

        {/* Footer */}
        <p className="text-xs text-muted-foreground">
          Once secrets are configured and the app is redeployed, this page will
          be replaced with the login screen.
        </p>
      </div>
    </div>
  );
}
