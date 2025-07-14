export interface SwiperConfig {
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
export interface NavigationElements {
    prevButton: HTMLElement | null;
    nextButton: HTMLElement | null;
}
export interface SwiperAPI {
    init: () => void;
    destroy: () => void;
    getInstance: () => any | null;
    getThumbsInstance: () => any | null;
    refresh: () => void;
    update: () => void;
    updateSize: () => void;
    updateSlides: () => void;
}
export interface BreakpointMap {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
}
export type BreakpointSize = keyof BreakpointMap;
declare global {
    interface HTMLElement {
        swiperAPI?: SwiperAPI;
    }
    interface Window {
        swiperInstances: Record<string, any>;
        cleanupSwipers?: () => void;
        Swiper?: any;
        AuxSwiper?: {
            SwiperManager: () => Promise<any>;
            utils: () => Promise<any>;
            init: () => void;
        };
    }
    const Swiper: {
        new (element: HTMLElement, config: any): any;
    } | undefined;
}
