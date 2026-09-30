import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function RouteTransition({ children }) {
    const location = useLocation();

    // Scroll to top on route change.
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    // No blocking boot overlay. The Header and each page render their own
    // skeletons while data loads, so content paints immediately and the
    // largest-contentful element (hero) is not hidden behind an opaque layer.
    // Hiding real content behind a full-screen overlay pushes LCP/FCP out by
    // seconds and was the primary cause of the poor performance score.
    return <>{children}</>;
}
