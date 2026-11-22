import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    OURANOIR_CONFIG?: { gaMeasurementId?: string; turnstileSiteKey?: string; contactEmail?: string };
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id: string) => void;
    };
    ouranoirTrack?: (name: string, params?: Record<string, unknown>) => void;
  }
}

const SCRIPT_ID = 'cf-turnstile-script';

/**
 * Cloudflare Turnstile spam check. Renders only when a site key is configured in
 * js/site-config.js (turnstileSiteKey); otherwise renders nothing.
 */
const Turnstile = ({ onToken }: { onToken: (token: string) => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const siteKey = window.OURANOIR_CONFIG?.turnstileSiteKey;

  useEffect(() => {
    if (!siteKey || !ref.current) return;
    let widgetId: string | undefined;
    const render = () => {
      if (!ref.current || !window.turnstile) return;
      widgetId = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        theme: 'light',
        callback: (token: string) => onToken(token),
        'expired-callback': () => onToken(''),
        'error-callback': () => onToken(''),
      });
    };
    if (window.turnstile) {
      render();
    } else {
      let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener('load', render);
    }
    return () => { if (widgetId && window.turnstile) window.turnstile.remove(widgetId); };
  }, [siteKey, onToken]);

  return siteKey ? <div ref={ref} className="min-h-[65px]" /> : null;
};

export default Turnstile;
