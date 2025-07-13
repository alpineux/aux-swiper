/**
 * aux-swiper - Utilities for SwiperJS in Webflow
 * Main entry point
 */

export { SwiperManager, utils } from './swiper-manager';
export type {
    SwiperConfig,
    SwiperAPI,
    NavigationElements,
    BreakpointMap,
    BreakpointSize
} from './types';

// Auto-initialize when used as script tag
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAuxSwiper);
    } else {
        initializeAuxSwiper();
    }
}

function initializeAuxSwiper() {
    // Import and run the initialization
    import('./swiper-manager').then(({ initializeSwipers }) => {
        initializeSwipers();
    });
}

// Expose on window for global access when used as script tag
if (typeof window !== 'undefined') {
    (window as any).AuxSwiper = {
        SwiperManager: () => import('./swiper-manager').then(m => m.SwiperManager),
        utils: () => import('./swiper-manager').then(m => m.utils),
        init: initializeAuxSwiper
    };
}