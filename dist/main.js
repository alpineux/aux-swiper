"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.utils = exports.SwiperManager = void 0;
// Use WeakMap for better memory management and privacy
const swiperInstancesMap = new WeakMap();
const resizeObserverMap = new WeakMap();
// Store all swiper instances for potential external access (keeping for backward compatibility)
window.swiperInstances = window.swiperInstances || {};
/**
 * Utility functions
 */
const utils = {
    // Decode HTML entities in breakpoints string
    decodeHTMLEntities(text) {
        if (!text)
            return null;
        const doc = new DOMParser().parseFromString(text, "text/html");
        return doc.documentElement.textContent;
    },
    // Try to parse JSON safely with better error handling
    parseJSON(str) {
        if (!str || typeof str !== 'string')
            return null;
        try {
            return JSON.parse(str);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.warn('Invalid JSON in Swiper config:', { error: errorMessage, input: str });
            return null;
        }
    },
    // Get a boolean value from a data attribute
    getBooleanAttribute(element, attribute, defaultValue = false) {
        const value = element.getAttribute(attribute);
        if (value === null)
            return defaultValue;
        return value === "true" || value === "";
    },
    // Get a number value from a data attribute with validation
    getNumberAttribute(element, attribute, defaultValue) {
        const value = element.getAttribute(attribute);
        if (value === null)
            return defaultValue;
        const parsed = Number(value);
        return Number.isNaN(parsed) ? defaultValue : parsed;
    },
    // Debounce function for performance optimization
    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },
    // Create unique ID with better collision avoidance
    createUniqueId(element, index) {
        if (element.id)
            return element.id;
        // Generate more unique ID using timestamp and random
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `swiper-${index}-${timestamp}-${random}`;
    }
};
exports.utils = utils;
/**
 * SwiperManager class for better organization and memory management
 */
class SwiperManager {
    constructor(element, index) {
        this.swiperInstance = null;
        this.thumbsInstance = null;
        this.resizeObserver = null;
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
    isSwiperAvailable() {
        return typeof window !== 'undefined' &&
            (typeof Swiper !== 'undefined' || typeof window.Swiper !== 'undefined');
    }
    /**
     * Get the Swiper constructor
     */
    getSwiperConstructor() {
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
    getNavigationElements() {
        var _a, _b, _c, _d, _e, _f;
        const prevSelector = this.element.getAttribute("data-nav-prev");
        const nextSelector = this.element.getAttribute("data-nav-next");
        let prevButton = null;
        let nextButton = null;
        // Use more robust selectors and error handling
        try {
            prevButton = prevSelector ?
                document.querySelector(prevSelector) :
                ((_b = (_a = this.element.closest('.swiper-container, .swiper-wrapper')) === null || _a === void 0 ? void 0 : _a.parentElement) === null || _b === void 0 ? void 0 : _b.querySelector('.swiper-button-prev')) ||
                    ((_c = this.element.parentElement) === null || _c === void 0 ? void 0 : _c.querySelector('.swiper-button-prev')) || null;
            nextButton = nextSelector ?
                document.querySelector(nextSelector) :
                ((_e = (_d = this.element.closest('.swiper-container, .swiper-wrapper')) === null || _d === void 0 ? void 0 : _d.parentElement) === null || _e === void 0 ? void 0 : _e.querySelector('.swiper-button-next')) ||
                    ((_f = this.element.parentElement) === null || _f === void 0 ? void 0 : _f.querySelector('.swiper-button-next')) || null;
        }
        catch (error) {
            console.warn('Error finding navigation elements:', error);
        }
        return { prevButton, nextButton };
    }
    /**
     * Build breakpoints configuration from individual data attributes
     */
    buildBreakpointsFromAttributes(el) {
        const breakpoints = {};
        // Define breakpoint mappings (can be customized)
        const breakpointMap = {
            'xs': 478, // Extra small/Mobile
            'sm': 640, // Mobile/Small tablets
            'md': 768, // Tablets
            'lg': 1024, // Desktop
            'xl': 1280, // Large desktop
            '2xl': 1536 // Extra large desktop
        };
        // Get all possible breakpoint attributes
        Object.keys(breakpointMap).forEach(size => {
            const slidesAttr = el.getAttribute(`data-slides-${size}`);
            if (slidesAttr !== null) {
                const breakpointPx = breakpointMap[size];
                // Initialize breakpoint config if it doesn't exist
                if (!breakpoints[breakpointPx]) {
                    breakpoints[breakpointPx] = {};
                }
                // Parse slidesPerView value
                let slidesPerView = slidesAttr;
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
    buildSwiperConfig(el, isThumbs = false) {
        var _a, _b;
        const { prevButton, nextButton } = this.getNavigationElements();
        // Core configuration with better type handling
        const config = {
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
        const paginationEl = (_a = el.parentElement) === null || _a === void 0 ? void 0 : _a.querySelector('.swiper-pagination');
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
        const scrollbarEl = (_b = el.parentElement) === null || _b === void 0 ? void 0 : _b.querySelector('.swiper-scrollbar');
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
            config.breakpoints = Object.assign(Object.assign({}, config.breakpoints), individualBreakpoints);
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
    initializeSwiper() {
        if (this.element.dataset.swiperInitialized)
            return;
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
            const thumbsElement = thumbsSelector ? document.querySelector(thumbsSelector) : null;
            let mainConfig = this.buildSwiperConfig(this.element);
            // Initialize thumbs Swiper if needed
            if (thumbsElement) {
                const thumbsConfig = this.buildSwiperConfig(thumbsElement, true);
                this.thumbsInstance = new SwiperConstructor(thumbsElement, thumbsConfig);
                mainConfig.thumbs = { swiper: this.thumbsInstance };
                // Store thumbs instance for backward compatibility
                window.swiperInstances[`${this.uniqueId}-thumbs`] = this.thumbsInstance;
            }
            // Create and store the Swiper instance
            this.swiperInstance = new SwiperConstructor(this.element, mainConfig);
            // Store in WeakMap for better memory management
            swiperInstancesMap.set(this.element, this.swiperInstance);
            // Store in window for backward compatibility
            window.swiperInstances[this.uniqueId] = this.swiperInstance;
            // Mark as initialized
            this.element.dataset.swiperInitialized = "true";
            // Dispatch custom event with better error handling
            this.dispatchEvent('swiperInitialized', {
                swiper: this.swiperInstance,
                config: mainConfig,
                thumbs: this.thumbsInstance
            });
        }
        catch (error) {
            console.error('Error initializing Swiper:', error);
            this.dispatchEvent('swiperError', { error });
        }
    }
    /**
     * Destroy the Swiper instance
     */
    destroySwiper() {
        try {
            if (this.swiperInstance) {
                this.swiperInstance.destroy(true, true);
                swiperInstancesMap.delete(this.element);
                delete window.swiperInstances[this.uniqueId];
                this.swiperInstance = null;
            }
            if (this.thumbsInstance) {
                this.thumbsInstance.destroy(true, true);
                delete window.swiperInstances[`${this.uniqueId}-thumbs`];
                this.thumbsInstance = null;
            }
            delete this.element.dataset.swiperInitialized;
            // Dispatch custom event
            this.dispatchEvent('swiperDestroyed');
        }
        catch (error) {
            console.error('Error destroying Swiper:', error);
        }
    }
    /**
     * Check if Swiper should be enabled or disabled based on viewport width
     */
    checkResponsiveState() {
        const viewportWidth = window.innerWidth;
        const minWidth = utils.getNumberAttribute(this.element, "data-disable-swiper-min-width", NaN);
        const maxWidth = utils.getNumberAttribute(this.element, "data-disable-swiper-max-width", NaN);
        // Determine if Swiper should be disabled based on viewport constraints
        const shouldDisable = ((!isNaN(minWidth) && !isNaN(maxWidth) && viewportWidth >= minWidth && viewportWidth <= maxWidth) ||
            (!isNaN(minWidth) && isNaN(maxWidth) && viewportWidth >= minWidth) ||
            (!isNaN(maxWidth) && isNaN(minWidth) && viewportWidth <= maxWidth));
        if (shouldDisable) {
            if (this.element.dataset.swiperInitialized) {
                this.destroySwiper();
            }
        }
        else {
            if (!this.element.dataset.swiperInitialized) {
                this.initializeSwiper();
            }
        }
    }
    /**
     * Dispatch custom events with better error handling
     */
    dispatchEvent(eventName, detail = {}) {
        try {
            this.element.dispatchEvent(new CustomEvent(eventName, {
                detail,
                bubbles: true,
                cancelable: true
            }));
        }
        catch (error) {
            console.warn(`Error dispatching ${eventName} event:`, error);
        }
    }
    /**
     * Initialize the manager
     */
    init() {
        // Skip already initialized swipers
        if (this.element.dataset.swiperInitialized)
            return;
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
            init: () => this.initializeSwiper(),
            destroy: () => this.destroySwiper(),
            getInstance: () => this.swiperInstance,
            getThumbsInstance: () => this.thumbsInstance,
            refresh: () => this.checkResponsiveState(),
            // New methods for better control
            update: () => { var _a; return (_a = this.swiperInstance) === null || _a === void 0 ? void 0 : _a.update(); },
            updateSize: () => { var _a; return (_a = this.swiperInstance) === null || _a === void 0 ? void 0 : _a.updateSize(); },
            updateSlides: () => { var _a; return (_a = this.swiperInstance) === null || _a === void 0 ? void 0 : _a.updateSlides(); }
        };
    }
    /**
     * Cleanup method for proper memory management
     */
    cleanup() {
        this.destroySwiper();
        if (typeof window !== 'undefined') {
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
                resizeObserverMap.delete(this.element);
            }
            else {
                // Remove event listener fallback
                window.removeEventListener("resize", this.debouncedResize);
            }
        }
        delete this.element.swiperAPI;
    }
}
exports.SwiperManager = SwiperManager;
/**
 * Initialize all Swiper elements
 */
function initializeSwipers() {
    // Use modern DOM loading check
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSwipers);
        return;
    }
    const swiperElements = document.querySelectorAll(".swiper");
    const managers = [];
    swiperElements.forEach((element, index) => {
        try {
            const manager = new SwiperManager(element, index);
            managers.push(manager);
        }
        catch (error) {
            console.error('Error initializing Swiper manager:', error);
        }
    });
    // Global cleanup function for proper memory management
    window.cleanupSwipers = () => {
        managers.forEach(manager => manager.cleanup());
        managers.length = 0;
    };
    // Cleanup on page unload
    if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', window.cleanupSwipers);
    }
}
// Initialize when DOM is ready
initializeSwipers();
//# sourceMappingURL=main.js.map