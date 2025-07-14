export declare const utils: {
    decodeHTMLEntities(text: string | null): string | null;
    parseJSON(str: string | null): any | null;
    getBooleanAttribute(element: HTMLElement, attribute: string, defaultValue?: boolean): boolean;
    getNumberAttribute(element: HTMLElement, attribute: string, defaultValue: number): number;
    debounce<T extends (...args: any[]) => void>(func: T, delay: number): (...args: Parameters<T>) => void;
    createUniqueId(element: HTMLElement, index: number): string;
};
export declare class SwiperManager {
    private element;
    private index;
    private uniqueId;
    private swiperInstance;
    private thumbsInstance;
    private resizeObserver;
    private debouncedResize;
    constructor(element: HTMLElement, index: number);
    private isSwiperAvailable;
    private getSwiperConstructor;
    private getNavigationElements;
    private buildBreakpointsFromAttributes;
    private buildSwiperConfig;
    private initializeSwiper;
    private destroySwiper;
    private checkResponsiveState;
    private dispatchEvent;
    private init;
    cleanup(): void;
}
export declare function initializeSwipers(): void;
