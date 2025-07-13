/**
 * Swiper Init Data Attributes
 *
 * A lightweight utility to initialize Swiper instances using HTML data attributes.
 * Enables easy configuration of Swiper sliders without writing JavaScript code.
 *
 * @version 2.0.0
 * @license MIT
 * @author John Lomat
 * @see https://github.com/johnlomat/swiper-init-data-attributes
 */
declare global {
    interface Window {
        swiperInstances: Record<string, any>;
        cleanupSwipers?: () => void;
        Swiper?: any;
    }
    const Swiper: {
        new (element: HTMLElement, config: any): any;
    } | undefined;
}
interface SwiperConfig {
    slidesPerView?: number | string;
    centeredSlides?: boolean;
    spaceBetween?: number;
    loop?: boolean;
    speed?: number;
    allowTouchMove?: boolean;
    grabCursor?: boolean;
    freeMode?: boolean;
    watchSlidesProgress?: boolean;
    slidesOffsetBefore?: number;
    slidesOffsetAfter?: number;
    updateOnWindowResize?: boolean;
    observer?: boolean;
    observeParents?: boolean;
    observeSlideChildren?: boolean;
    autoplay?: {
        delay?: number;
        disableOnInteraction?: boolean;
        pauseOnMouseEnter?: boolean;
    };
    navigation?: {
        prevEl?: HTMLElement | null;
        nextEl?: HTMLElement | null;
        hideOnClick?: boolean;
    };
    pagination?: {
        el?: HTMLElement | null;
        clickable?: boolean;
        type?: string;
        dynamicBullets?: boolean;
        hideOnClick?: boolean;
    };
    scrollbar?: {
        el?: HTMLElement | null;
        draggable?: boolean;
        hide?: boolean;
    };
    breakpoints?: Record<number, Partial<SwiperConfig>>;
    thumbs?: {
        swiper?: any;
    };
    a11y?: {
        enabled?: boolean;
        prevSlideMessage?: string;
        nextSlideMessage?: string;
        firstSlideMessage?: string;
        lastSlideMessage?: string;
    };
}
interface NavigationElements {
    prevButton: HTMLElement | null;
    nextButton: HTMLElement | null;
}
interface SwiperAPI {
    init: () => void;
    destroy: () => void;
    getInstance: () => any | null;
    getThumbsInstance: () => any | null;
    refresh: () => void;
    update: () => void;
    updateSize: () => void;
    updateSlides: () => void;
}
interface BreakpointMap {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
}
type BreakpointSize = keyof BreakpointMap;
declare global {
    interface HTMLElement {
        swiperAPI?: SwiperAPI;
    }
}
/**
 * Utility functions
 */
declare const utils: {
    decodeHTMLEntities(text: string | null): string | null;
    parseJSON(str: string | null): any | null;
    getBooleanAttribute(element: HTMLElement, attribute: string, defaultValue?: boolean): boolean;
    getNumberAttribute(element: HTMLElement, attribute: string, defaultValue: number): number;
    debounce<T extends (...args: any[]) => void>(func: T, delay: number): (...args: Parameters<T>) => void;
    createUniqueId(element: HTMLElement, index: number): string;
};
/**
 * SwiperManager class for better organization and memory management
 */
declare class SwiperManager {
    private element;
    private index;
    private uniqueId;
    private swiperInstance;
    private thumbsInstance;
    private resizeObserver;
    private debouncedResize;
    constructor(element: HTMLElement, index: number);
    /**
     * Check if Swiper is available globally
     */
    private isSwiperAvailable;
    /**
     * Get the Swiper constructor
     */
    private getSwiperConstructor;
    /**
     * Get navigation elements with improved selector handling
     */
    private getNavigationElements;
    /**
     * Build breakpoints configuration from individual data attributes
     */
    private buildBreakpointsFromAttributes;
    /**
     * Build Swiper configuration from data attributes
     */
    private buildSwiperConfig;
    /**
     * Initialize the Swiper instance
     */
    private initializeSwiper;
    /**
     * Destroy the Swiper instance
     */
    private destroySwiper;
    /**
     * Check if Swiper should be enabled or disabled based on viewport width
     */
    private checkResponsiveState;
    /**
     * Dispatch custom events with better error handling
     */
    private dispatchEvent;
    /**
     * Initialize the manager
     */
    private init;
    /**
     * Cleanup method for proper memory management
     */
    cleanup(): void;
}
export { SwiperManager, utils };
export type { SwiperConfig, SwiperAPI, NavigationElements, BreakpointMap, BreakpointSize };
