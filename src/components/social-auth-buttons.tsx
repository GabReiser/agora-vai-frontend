import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.3 12 2.3 6.8 2.3 2.6 6.5 2.6 11.8S6.8 21.3 12 21.3c6.9 0 9.5-4.8 9.5-7.4 0-.5-.1-.9-.1-1.3H12Z" />
    </svg>
  );
}
function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#F25022" d="M3 3h8.5v8.5H3z" />
      <path fill="#7FBA00" d="M12.5 3H21v8.5h-8.5z" />
      <path fill="#00A4EF" d="M3 12.5h8.5V21H3z" />
      <path fill="#FFB900" d="M12.5 12.5H21V21h-8.5z" />
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden="true">
      <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9-.7 0-1.9-.8-3.1-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.5.8 1.1 1.7 2.4 3 2.4 1.2-.1 1.6-.8 3.1-.8 1.4 0 1.9.8 3.1.8 1.3 0 2.1-1.2 2.9-2.3.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.7-1-2.7-4.1ZM14.3 5.9c.7-.8 1.1-1.9 1-3-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.2-.6 2.9-1.4Z" />
    </svg>
  );
}

// Placeholders prontos para integrar Firebase signInWithPopup
export async function handleGoogleAuth() {
  // TODO: signInWithPopup(auth, new GoogleAuthProvider())
  toast.info("Login com Google em breve.");
}
export async function handleMicrosoftAuth() {
  // TODO: signInWithPopup(auth, new OAuthProvider('microsoft.com'))
  toast.info("Login com Microsoft em breve.");
}
export async function handleAppleAuth() {
  // TODO: signInWithPopup(auth, new OAuthProvider('apple.com'))
  toast.info("Login com Apple em breve.");
}

interface Props {
  dividerLabel?: string;
}

export function SocialAuthButtons({ dividerLabel = "ou continue com e-mail" }: Props) {
  const btn =
    "h-11 bg-card/40 border-border/60 hover:bg-card/80 hover:border-primary/40";
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2">
        <Button type="button" variant="outline" onClick={handleGoogleAuth} className={btn} aria-label="Continuar com Google">
          <GoogleIcon />
        </Button>
        <Button type="button" variant="outline" onClick={handleMicrosoftAuth} className={btn} aria-label="Continuar com Microsoft">
          <MicrosoftIcon />
        </Button>
        <Button type="button" variant="outline" onClick={handleAppleAuth} className={btn} aria-label="Continuar com Apple">
          <AppleIcon />
        </Button>
      </div>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/60" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">{dividerLabel}</span>
        </div>
      </div>
    </div>
  );
}
