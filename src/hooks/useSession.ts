import { useEffect, useState } from 'react';

export function useSession() {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    let session = localStorage.getItem('rewriter_session');

    if (!session) {
      session = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('rewriter_session', session);
    }

    setSessionId(session);
  }, []);

  return sessionId;
}
