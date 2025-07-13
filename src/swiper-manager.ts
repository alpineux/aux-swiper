/**
 * SwiperManager - Core functionality for aux-swiper
 */

import type {
    SwiperConfig,
    SwiperAPI,
    NavigationElements,
    BreakpointMap,
    BreakpointSize
} from './types';

// Use WeakMap for better memory management and privacy
const swiperInstancesMap = new WeakMap<HTMLElement, any>();
const resizeObserverMap = new WeakMap<HTMLElement, ResizeObserver>();

// Store all swiper instances for potential external access (keeping for backward compatibility)
if (typeof window !== 'undefined') {
    window.swiperInstances = window.swiperInstances || {};
}

/**
 * Utility functions
 */
export const utils = {
    // Decode HTML entities in breakpoints string
    decodeHTMLEntities(text: string | null): string | null {
        if (!text) return null;
        const doc = new DOMParser().parseFromString(text, "text/html");
        return doc.documentElement.textContent;
    },

    // Try to parse JSON safely with better error handling
    parseJSON(str: string | null): any | null {
        if (!str || typeof str !== 'string') return null;
        try {
            return JSON.parse(str);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.warn('Invalid JSON in Swiper config:', { error: errorMessage, input: str });
            return null;
        }
    },

    // Get a boolean value from a data attribute
    getBooleanAttribute(element: HTMLElement, attribute: string, defaultValue: boolean = false): boolean {
        const value = element.getAttribute(attribute);
        if (value === null) return defaultValue;
        return value === "true" || value === "";
    },

    // Get a number value from a data attribute with validation
    getNumberAttribute(element: HTMLElement, attribute: string, defaultValue: number): number {
        const value = element.getAttribute(attribute);
        if (value === null) return defaultValue;
        const parsed = Number(value);
        return Number.isNaN(parsed) ? defaultValue : parsed;
    },

    // Debounce function for performance optimization
    debounce<T extends (...args: any[]) => void>(func: T, delay: number): (...args: Parameters<T>) => void {
        let timeoutId: NodeJS.Timeout;
        return (...args: Parameters<T>): void => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    // Create unique ID with better collision avoidance
    createUniqueId(element: HTMLElement, index: number): string {
        if (element.id) return element.id;

        // Generate more unique ID using timestamp and random
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `swiper-${index}-${timestamp}-${random}`;
    }
};

/**
 * SwiperManager class for better organization and memory management
 */
export class SwiperManager {
    private element: HTMLElement;
    private index: number;
    private uniqueId: string;
    private swiperInstance: any | null = null;
    private thumbsInstance: any | null = null;
    private resizeObserver: ResizeObserver | null = null;
    private debouncedResize: () => void;

    constructor(element: HTMLElement, index: number) {
        this.element = element;
        this.index = index;
        this.uniqueId = utils.createUniqueId(element, index);

        // Bind methods to preserve context
        this.checkResponsiveState = this.checkResponsiveState.bind(this);
        this.debouncedResize = utils.debounce(this.checkResponsiveState, 250);

        this.init();
    }

    /**
     * Check if Swiper is available globally
     */
    private isSwiperAvailable(): boolean {
        return typeof window !== 'undefined' &&
            (typeof Swiper !== 'undefined' || typeof window.Swiper !== 'undefined');
    }

    /**
     * Get the Swiper constructor
     */
    private getSwiperConstructor(): any {
        if (typeof Swiper !== 'undefined') {
            return Swiper;
        }
        if (typeof window !== 'undefined' && typeof window.Swiper !== 'undefined') {
            return window.Swiper;
        }
        return null;
    }

    /**
     * Get navigation elements with improved selector handling
     */
    private getNavigationElements(): NavigationElements {
        const prevSelector = this.element.getAttribute("data-nav-prev");
        const nextSelector = this.element.getAttribute("data-nav-next");

        let prevButton: HTMLElement | null = null;
        let nextButton: HTMLElement | null = null;

        // Use more robust selectors and error handling
        try {
            prevButton = prevSelector ?
                document.querySelector<HTMLElement>(prevSelector) :
                this.element.closest('.swiper-container, .swiper-wrapper')?.parentElement?.querySelector<HTMLElement>('.swiper-button-prev') ||
                this.element.parentElement?.querySelector<HTMLElement>('.swiper-button-prev') || null;

            nextButton = nextSelector ?
                document.querySelector<HTMLElement>(nextSelector) :
                this.element.closest('.swiper-container, .swiper-wrapper')?.parentElement?.querySelector<HTMLElement>('.swiper-button-next') ||
                this.element.parentElement?.querySelector<HTMLElement>('.swiper-button-next') || null;
        } catch (error) {
            console.warn('Error finding navigation elements:', error);
        }

        return { prevButton, nextButton };
    }

    /**
     * Build breakpoints configuration from individual data attributes
     */
    private buildBreakpointsFromAttributes(el: HTMLElement): Record<number, Partial<SwiperConfig>> {
        const breakpoints: Record<number, Partial<SwiperConfig>> = {};

        // Define breakpoint mappings (can be customized)
        const breakpointMap: BreakpointMap = {
            'xs': 478,   // Extra small/Mobile
            'sm': 640,   // Mobile/Small tablets
            'md': 768,   // Tablets
            'lg': 1024,  // Desktop
            'xl': 1280,  // Large desktop
            '2xl': 1536  // Extra large desktop
        };

        // Get all possible breakpoint attributes
        (Object.keys(breakpointMap) as BreakpointSize[]).forEach(size => {
            const slidesAttr = el.getAttribute(`data-slides-${size}`);

            if (slidesAttr !== null) {
                const breakpointPx = breakpointMap[size];

                // Initialize breakpoint config if it doesn't exist
                if (!breakpoints[breakpointPx]) {
                    breakpoints[breakpointPx] = {};
                }

                // Parse slidesPerView value
                let slidesPerView: number | string = slidesAttr;
                if (slidesAttr !== "auto") {
                    const numericValue = parseFloat(slidesAttr);
                    if (!isNaN(numericValue)) {
                        slidesPerView = numericValue;
                    }
                }

                breakpoints[breakpointPx].slidesPerView = slidesPerView;
            }
        });

        return breakpoints;
    }

    /**
     * Build Swiper configuration from data attributes
     */
    private buildSwiperConfig(el: HTMLElement, isThumbs: boolean = false): SwiperConfig {
        const { prevButton, nextButton } = this.getNavigationElements();

        // Core configuration with better type handling
        const config: SwiperConfig = {
            // Basic settings
            slidesPerView: el.getAttribute("data-slides-per-view") || "auto",
            centeredSlides: utils.getBooleanAttribute(el, "data-centered"),
            spaceBetween: utils.getNumberAttribute(el, "data-space-between", 20),
            loop: utils.getBooleanAttribute(el, "data-loop"),
            speed: utils.getNumberAttribute(el, "data-speed", 300),

            // Interactive features
            allowTouchMove: utils.getBooleanAttribute(el, "data-allow-touch-move", true),
            grabCursor: utils.getBooleanAttribute(el, "data-grab-cursor"),
            freeMode: utils.getBooleanAttribute(el, "data-free-mode"),
            watchSlidesProgress: utils.getBooleanAttribute(el, "data-watch-slides-progress"),

            // Slide offsets
            slidesOffsetBefore: utils.getNumberAttribute(el, "data-slides-offset-before", 0),
            slidesOffsetAfter: utils.getNumberAttribute(el, "data-slides-offset-after", 0),

            // Performance optimizations
            updateOnWindowResize: true,
            observer: true,
            observeParents: true,
            observeSlideChildren: true
        };

        // Handle slidesPerView conversion
        if (config.slidesPerView !== "auto") {
            const numericValue = utils.getNumberAttribute(el, "data-slides-per-view", 1);
            config.slidesPerView = numericValue;
        }

        // Autoplay settings with better handling
        const autoplayAttr = el.getAttribute("data-autoplay");
        if (autoplayAttr !== "false" && autoplayAttr !== null) {
            config.autoplay = {
                delay: utils.getNumberAttribute(el, "data-autoplay-delay", 3000),
                disableOnInteraction: utils.getBooleanAttribute(el, "data-autoplay-disable-interaction"),
                pauseOnMouseEnter: utils.getBooleanAttribute(el, "data-autoplay-pause-on-hover", true)
            };
        }

        // Navigation (only add if not a thumbs slider or has specified nav buttons)
        if (!isThumbs || el.hasAttribute("data-nav-prev") || el.hasAttribute("data-nav-next")) {
            if (prevButton || nextButton) {
                config.navigation = {
                    prevEl: prevButton,
                    nextEl: nextButton,
                    hideOnClick: utils.getBooleanAttribute(el, "data-nav-hide-on-click")
                };
            }
        }

        // Pagination with enhanced options
        const paginationEl = el.parentElement?.querySelector<HTMLElement>('.swiper-pagination');
        if (paginationEl) {
            config.pagination = {
                el: paginationEl,
                clickable: true,
                type: el.getAttribute("data-pagination-type") || "bullets",
                dynamicBullets: utils.getBooleanAttribute(el, "data-pagination-dynamic"),
                hideOnClick: utils.getBooleanAttribute(el, "data-pagination-hide-on-click")
            };
        }

        // Scrollbar support
        const scrollbarEl = el.parentElement?.querySelector<HTMLElement>('.swiper-scrollbar');
        if (scrollbarEl) {
            config.scrollbar = {
                el: scrollbarEl,
                draggable: utils.getBooleanAttribute(el, "data-scrollbar-draggable", true),
                hide: utils.getBooleanAttribute(el, "data-scrollbar-hide")
            };
        }

        // Process breakpoints configuration
        const breakpointsAttr = el.getAttribute("data-breakpoints");
        if (breakpointsAttr) {
            const decodedBreakpoints = utils.decodeHTMLEntities(breakpointsAttr);
            const parsedBreakpoints = utils.parseJSON(decodedBreakpoints);
            if (parsedBreakpoints) {
                config.breakpoints = parsedBreakpoints;
            }
        }

        // Process individual breakpoint attributes (new simplified approach)
        const individualBreakpoints = this.buildBreakpointsFromAttributes(el);
        if (Object.keys(individualBreakpoints).length > 0) {
            config.breakpoints = { ...config.breakpoints, ...individualBreakpoints };
        }

        // A11y improvements
        config.a11y = {
            enabled: utils.getBooleanAttribute(el, "data-a11y-enabled", true),
            prevSlideMessage: el.getAttribute("data-a11y-prev-message") || 'Previous slide',
            nextSlideMessage: el.getAttribute("data-a11y-next-message") || 'Next slide',
            firstSlideMessage: el.getAttribute("data-a11y-first-message") || 'This is the first slide',
            lastSlideMessage: el.getAttribute("data-a11y-last-message") || 'This is the last slide'
        };

        return config;
    }

    /**
     * Initialize the Swiper instance
     */
    private initializeSwiper(): void {
        if (this.element.dataset.swiperInitialized) return;

        // Check if Swiper is available
        if (!this.isSwiperAvailable()) {
            console.warn('Swiper library not found. Please include Swiper.js before this script.');
            return;
        }

        const SwiperConstructor = this.getSwiperConstructor();
        if (!SwiperConstructor) {
            console.error('Unable to access Swiper constructor.');
            return;
        }

        try {
            // Check for thumbs configuration
            const thumbsSelector = this.element.getAttribute("data-thumbs");
            const thumbsElement = thumbsSelector ? document.querySelector<HTMLElement>(thumbsSelector) : null;

            let mainConfig = this.buildSwiperConfig(this.element);

            // Initialize thumbs Swiper if needed
            if (thumbsElement) {
                const thumbsConfig = this.buildSwiperConfig(thumbsElement, true);

                this.thumbsInstance = new SwiperConstructor(thumbsElement, thumbsConfig);
                mainConfig.thumbs = { swiper: this.thumbsInstance };

                // Store thumbs instance for backward compatibility
                if (typeof window !== 'undefined') {
                    window.swiperInstances[`${this.uniqueId}-thumbs`] = this.thumbsInstance;
                }
            }

            // Create and store the Swiper instance
            this.swiperInstance = new SwiperConstructor(this.element, mainConfig);

            // Store in WeakMap for better memory management
            swiperInstancesMap.set(this.element, this.swiperInstance);

            // Store in window for backward compatibility
            if (typeof window !== 'undefined') {
                window.swiperInstances[this.uniqueId] = this.swiperInstance;
            }

            // Mark as initialized
            this.element.dataset.swiperInitialized = "true";

            // Dispatch custom event with better error handling
            this.dispatchEvent('swiperInitialized', {
                swiper: this.swiperInstance,
                config: mainConfig,
                thumbs: this.thumbsInstance
            });

        } catch (error) {
            console.error('Error initializing Swiper:', error);
            this.dispatchEvent('swiperError', { error });
        }
    }

    /**
     * Destroy the Swiper instance
     */
    private destroySwiper(): void {
        try {
            if (this.swiperInstance) {
                this.swiperInstance.destroy(true, true);
                swiperInstancesMap.delete(this.element);
                if (typeof window !== 'undefined') {
                    delete window.swiperInstances[this.uniqueId];
                }
                this.swiperInstance = null;
            }

            if (this.thumbsInstance) {
                this.thumbsInstance.destroy(true, true);
                if (typeof window !== 'undefined') {
                    delete window.swiperInstances[`${this.uniqueId}-thumbs`];
                }
                this.thumbsInstance = null;
            }

            delete this.element.dataset.swiperInitialized;

            // Dispatch custom event
            this.dispatchEvent('swiperDestroyed');

        } catch (error) {
            console.error('Error destroying Swiper:', error);
        }
    }

    /**
     * Check if Swiper should be enabled or disabled based on viewport width
     */
    private checkResponsiveState(): void {
        const viewportWidth = window.innerWidth;
        const minWidth = utils.getNumberAttribute(this.element, "data-disable-swiper-min-width", NaN);
        const maxWidth = utils.getNumberAttribute(this.element, "data-disable-swiper-max-width", NaN);

        // Determine if Swiper should be disabled based on viewport constraints
        const shouldDisable = (
            (!isNaN(minWidth) && !isNaN(maxWidth) && viewportWidth >= minWidth && viewportWidth <= maxWidth) ||
            (!isNaN(minWidth) && isNaN(maxWidth) && viewportWidth >= minWidth) ||
            (!isNaN(maxWidth) && isNaN(minWidth) && viewportWidth <= maxWidth)
        );

        if (shouldDisable) {
            if (this.element.dataset.swiperInitialized) {
                this.destroySwiper();
            }
        } else {
            if (!this.element.dataset.swiperInitialized) {
                this.initializeSwiper();
            }
        }
    }

    /**
     * Dispatch custom events with better error handling
     */
    private dispatchEvent(eventName: string, detail: any = {}): void {
        try {
            this.element.dispatchEvent(new CustomEvent(eventName, {
                detail,
                bubbles: true,
                cancelable: true
            }));
        } catch (error) {
            console.warn(`Error dispatching ${eventName} event:`, error);
        }
    }

    /**
     * Initialize the manager
     */
    private init(): void {
        // Skip already initialized swipers
        if (this.element.dataset.swiperInitialized) return;

        // Initial state check
        this.checkResponsiveState();

        // Set up resize handling
        if (typeof window !== 'undefined') {
            // Use ResizeObserver for better performance instead of window resize
            if ('ResizeObserver' in window) {
                this.resizeObserver = new ResizeObserver(this.debouncedResize);
                this.resizeObserver.observe(document.documentElement);
                resizeObserverMap.set(this.element, this.resizeObserver);
            }
        }

        // Expose API for external access with better methods
        this.element.swiperAPI = {
            init: (): void => this.initializeSwiper(),
            destroy: (): void => this.destroySwiper(),
            getInstance: (): any | null => this.swiperInstance,
            getThumbsInstance: (): any | null => this.thumbsInstance,
            refresh: (): void => this.checkResponsiveState(),
            // New methods for better control
            update: (): void => this.swiperInstance?.update(),
            updateSize: (): void => this.swiperInstance?.updateSize(),
            updateSlides: (): void => this.swiperInstance?.updateSlides()
        };
    }

    /**
     * Cleanup method for proper memory management
     */
    public cleanup(): void {
        this.destroySwiper();

        if (typeof window !== 'undefined') {
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
                resizeObserverMap.delete(this.element);
            } else {
                // Remove event listener fallback
                window.removeEventListener("resize", this.debouncedResize);
            }
        }

        delete this.element.swiperAPI;
    }
}

/**
 * Initialize all Swiper elements
 */
export function initializeSwipers(): void {
    // Use modern DOM loading check
    if (typeof document !== 'undefined' && document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSwipers);
        return;
    }

    if (typeof document === 'undefined') return;

    const swiperElements = document.querySelectorAll<HTMLElement>(".swiper");
    const managers: SwiperManager[] = [];

    swiperElements.forEach((element, index) => {
        try {
            const manager = new SwiperManager(element, index);
            managers.push(manager);
        } catch (error) {
            console.error('Error initializing Swiper manager:', error);
        }
    });

    // Global cleanup function for proper memory management
    if (typeof window !== 'undefined') {
        window.cleanupSwipers = (): void => {
            managers.forEach(manager => manager.cleanup());
            managers.length = 0;
        };

        // Cleanup on page unload
        window.addEventListener('beforeunload', window.cleanupSwipers);
    }
}