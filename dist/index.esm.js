/*!
 * aux-swiper v1.0.0
 * Utilities for SwiperJS in Webflow
 * (c) 2025 AlpineUX
 * Released under the MIT License.
 */
const swiperInstancesMap = new WeakMap();
const resizeObserverMap = new WeakMap();
if (typeof window !== 'undefined') {
    window.swiperInstances = window.swiperInstances || {};
}
const utils = {
    decodeHTMLEntities(text) {
        if (!text)
            return null;
        const doc = new DOMParser().parseFromString(text, "text/html");
        return doc.documentElement.textContent;
    },
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
    getBooleanAttribute(element, attribute, defaultValue = false) {
        const value = element.getAttribute(attribute);
        if (value === null)
            return defaultValue;
        return value === "true" || value === "";
    },
    getNumberAttribute(element, attribute, defaultValue) {
        const value = element.getAttribute(attribute);
        if (value === null)
            return defaultValue;
        const parsed = Number(value);
        return Number.isNaN(parsed) ? defaultValue : parsed;
    },
    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },
    createUniqueId(element, index) {
        if (element.id)
            return element.id;
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `swiper-${index}-${timestamp}-${random}`;
    }
};
class SwiperManager {
    constructor(element, index) {
        this.swiperInstance = null;
        this.thumbsInstance = null;
        this.resizeObserver = null;
        this.element = element;
        this.index = index;
        this.uniqueId = utils.createUniqueId(element, index);
        this.checkResponsiveState = this.checkResponsiveState.bind(this);
        this.debouncedResize = utils.debounce(this.checkResponsiveState, 250);
        this.init();
    }
    isSwiperAvailable() {
        return typeof window !== 'undefined' &&
            (typeof Swiper !== 'undefined' || typeof window.Swiper !== 'undefined');
    }
    getSwiperConstructor() {
        if (typeof Swiper !== 'undefined') {
            return Swiper;
        }
        if (typeof window !== 'undefined' && typeof window.Swiper !== 'undefined') {
            return window.Swiper;
        }
        return null;
    }
    getNavigationElements() {
        var _a, _b, _c, _d, _e, _f;
        const prevSelector = this.element.getAttribute("data-nav-prev");
        const nextSelector = this.element.getAttribute("data-nav-next");
        let prevButton = null;
        let nextButton = null;
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
    buildBreakpointsFromAttributes(el) {
        const breakpoints = {};
        const breakpointMap = {
            'xs': 478,
            'sm': 640,
            'md': 768,
            'lg': 1024,
            'xl': 1280,
            '2xl': 1536
        };
        Object.keys(breakpointMap).forEach(size => {
            const slidesAttr = el.getAttribute(`data-slides-${size}`);
            if (slidesAttr !== null) {
                const breakpointPx = breakpointMap[size];
                if (!breakpoints[breakpointPx]) {
                    breakpoints[breakpointPx] = {};
                }
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
    buildSwiperConfig(el, isThumbs = false) {
        var _a, _b;
        const { prevButton, nextButton } = this.getNavigationElements();
        const config = {
            slidesPerView: el.getAttribute("data-slides-per-view") || "auto",
            centeredSlides: utils.getBooleanAttribute(el, "data-centered"),
            spaceBetween: utils.getNumberAttribute(el, "data-space-between", 20),
            loop: utils.getBooleanAttribute(el, "data-loop"),
            speed: utils.getNumberAttribute(el, "data-speed", 300),
            allowTouchMove: utils.getBooleanAttribute(el, "data-allow-touch-move", true),
            grabCursor: utils.getBooleanAttribute(el, "data-grab-cursor"),
            freeMode: utils.getBooleanAttribute(el, "data-free-mode"),
            watchSlidesProgress: utils.getBooleanAttribute(el, "data-watch-slides-progress"),
            slidesOffsetBefore: utils.getNumberAttribute(el, "data-slides-offset-before", 0),
            slidesOffsetAfter: utils.getNumberAttribute(el, "data-slides-offset-after", 0),
            updateOnWindowResize: true,
            observer: true,
            observeParents: true,
            observeSlideChildren: true
        };
        if (config.slidesPerView !== "auto") {
            const numericValue = utils.getNumberAttribute(el, "data-slides-per-view", 1);
            config.slidesPerView = numericValue;
        }
        const autoplayAttr = el.getAttribute("data-autoplay");
        if (autoplayAttr !== "false" && autoplayAttr !== null) {
            config.autoplay = {
                delay: utils.getNumberAttribute(el, "data-autoplay-delay", 3000),
                disableOnInteraction: utils.getBooleanAttribute(el, "data-autoplay-disable-interaction"),
                pauseOnMouseEnter: utils.getBooleanAttribute(el, "data-autoplay-pause-on-hover", true)
            };
        }
        if (!isThumbs || el.hasAttribute("data-nav-prev") || el.hasAttribute("data-nav-next")) {
            if (prevButton || nextButton) {
                config.navigation = {
                    prevEl: prevButton,
                    nextEl: nextButton,
                    hideOnClick: utils.getBooleanAttribute(el, "data-nav-hide-on-click")
                };
            }
        }
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
        const scrollbarEl = (_b = el.parentElement) === null || _b === void 0 ? void 0 : _b.querySelector('.swiper-scrollbar');
        if (scrollbarEl) {
            config.scrollbar = {
                el: scrollbarEl,
                draggable: utils.getBooleanAttribute(el, "data-scrollbar-draggable", true),
                hide: utils.getBooleanAttribute(el, "data-scrollbar-hide")
            };
        }
        const breakpointsAttr = el.getAttribute("data-breakpoints");
        if (breakpointsAttr) {
            const decodedBreakpoints = utils.decodeHTMLEntities(breakpointsAttr);
            const parsedBreakpoints = utils.parseJSON(decodedBreakpoints);
            if (parsedBreakpoints) {
                config.breakpoints = parsedBreakpoints;
            }
        }
        const individualBreakpoints = this.buildBreakpointsFromAttributes(el);
        if (Object.keys(individualBreakpoints).length > 0) {
            config.breakpoints = Object.assign(Object.assign({}, config.breakpoints), individualBreakpoints);
        }
        config.a11y = {
            enabled: utils.getBooleanAttribute(el, "data-a11y-enabled", true),
            prevSlideMessage: el.getAttribute("data-a11y-prev-message") || 'Previous slide',
            nextSlideMessage: el.getAttribute("data-a11y-next-message") || 'Next slide',
            firstSlideMessage: el.getAttribute("data-a11y-first-message") || 'This is the first slide',
            lastSlideMessage: el.getAttribute("data-a11y-last-message") || 'This is the last slide'
        };
        return config;
    }
    initializeSwiper() {
        if (this.element.dataset.swiperInitialized)
            return;
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
            const thumbsSelector = this.element.getAttribute("data-thumbs");
            const thumbsElement = thumbsSelector ? document.querySelector(thumbsSelector) : null;
            let mainConfig = this.buildSwiperConfig(this.element);
            if (thumbsElement) {
                const thumbsConfig = this.buildSwiperConfig(thumbsElement, true);
                this.thumbsInstance = new SwiperConstructor(thumbsElement, thumbsConfig);
                mainConfig.thumbs = { swiper: this.thumbsInstance };
                if (typeof window !== 'undefined') {
                    window.swiperInstances[`${this.uniqueId}-thumbs`] = this.thumbsInstance;
                }
            }
            this.swiperInstance = new SwiperConstructor(this.element, mainConfig);
            swiperInstancesMap.set(this.element, this.swiperInstance);
            if (typeof window !== 'undefined') {
                window.swiperInstances[this.uniqueId] = this.swiperInstance;
            }
            this.element.dataset.swiperInitialized = "true";
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
    destroySwiper() {
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
            this.dispatchEvent('swiperDestroyed');
        }
        catch (error) {
            console.error('Error destroying Swiper:', error);
        }
    }
    checkResponsiveState() {
        const viewportWidth = window.innerWidth;
        const minWidth = utils.getNumberAttribute(this.element, "data-disable-swiper-min-width", NaN);
        const maxWidth = utils.getNumberAttribute(this.element, "data-disable-swiper-max-width", NaN);
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
    init() {
        if (this.element.dataset.swiperInitialized)
            return;
        this.checkResponsiveState();
        if (typeof window !== 'undefined') {
            if ('ResizeObserver' in window) {
                this.resizeObserver = new ResizeObserver(this.debouncedResize);
                this.resizeObserver.observe(document.documentElement);
                resizeObserverMap.set(this.element, this.resizeObserver);
            }
        }
        this.element.swiperAPI = {
            init: () => this.initializeSwiper(),
            destroy: () => this.destroySwiper(),
            getInstance: () => this.swiperInstance,
            getThumbsInstance: () => this.thumbsInstance,
            refresh: () => this.checkResponsiveState(),
            update: () => { var _a; return (_a = this.swiperInstance) === null || _a === void 0 ? void 0 : _a.update(); },
            updateSize: () => { var _a; return (_a = this.swiperInstance) === null || _a === void 0 ? void 0 : _a.updateSize(); },
            updateSlides: () => { var _a; return (_a = this.swiperInstance) === null || _a === void 0 ? void 0 : _a.updateSlides(); }
        };
    }
    cleanup() {
        this.destroySwiper();
        if (typeof window !== 'undefined') {
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
                resizeObserverMap.delete(this.element);
            }
            else {
                window.removeEventListener("resize", this.debouncedResize);
            }
        }
        delete this.element.swiperAPI;
    }
}
function initializeSwipers() {
    if (typeof document !== 'undefined' && document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSwipers);
        return;
    }
    if (typeof document === 'undefined')
        return;
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
    if (typeof window !== 'undefined') {
        window.cleanupSwipers = () => {
            managers.forEach(manager => manager.cleanup());
            managers.length = 0;
        };
        window.addEventListener('beforeunload', window.cleanupSwipers);
    }
}

var swiperManager = /*#__PURE__*/Object.freeze({
    __proto__: null,
    SwiperManager: SwiperManager,
    initializeSwipers: initializeSwipers,
    utils: utils
});

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAuxSwiper);
    }
    else {
        initializeAuxSwiper();
    }
}
function initializeAuxSwiper() {
    Promise.resolve().then(function () { return swiperManager; }).then(({ initializeSwipers }) => {
        initializeSwipers();
    });
}
if (typeof window !== 'undefined') {
    window.AuxSwiper = {
        SwiperManager: () => Promise.resolve().then(function () { return swiperManager; }).then(m => m.SwiperManager),
        utils: () => Promise.resolve().then(function () { return swiperManager; }).then(m => m.utils),
        init: initializeAuxSwiper
    };
}

export { SwiperManager, utils };
