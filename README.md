# AuxSwiper

A lightweight TypeScript utility library for initializing SwiperJS instances using HTML data attributes. Perfect for Webflow projects and no-code environments.

## Features

- 🚀 **Zero Configuration** - Just add data attributes to your HTML
- 📱 **Responsive Breakpoints** - Simple `data-slides-sm`, `data-slides-lg` syntax
- ♿ **Accessible** - Built-in accessibility features
- 🎯 **Lightweight** - ~5KB minified + gzipped
- 🔧 **TypeScript** - Full type safety and IntelliSense support
- 🌐 **Universal** - Works with script tags, ES modules, and CommonJS

## Quick Start

### 1. Include SwiperJS and AuxSwiper

```html
<!-- Swiper CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">

<!-- Your HTML -->
<div class="swiper" data-slides-per-view="1" data-slides-lg="3" data-autoplay="true">
  <div class="swiper-wrapper">
    <div class="swiper-slide">Slide 1</div>
    <div class="swiper-slide">Slide 2</div>
    <div class="swiper-slide">Slide 3</div>
  </div>
  <div class="swiper-pagination"></div>
</div>

<!-- Swiper JS -->
<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>
<!-- AuxSwiper -->
<script src="https://unpkg.com/aux-swiper@latest/dist/index.umd.min.js"></script>
```

### 2. Or install via npm

```bash
npm install aux-swiper
```

```javascript
import 'aux-swiper';
// Automatically initializes all .swiper elements
```

## Data Attributes

### Basic Configuration

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `data-slides-per-view` | number\|string | `"auto"` | Number of slides per view |
| `data-space-between` | number | `20` | Space between slides in px |
| `data-loop` | boolean | `false` | Enable continuous loop mode |
| `data-speed` | number | `300` | Transition speed in ms |
| `data-autoplay` | boolean\|string | `false` | Enable autoplay |
| `data-autoplay-delay` | number | `3000` | Autoplay delay in ms |

### Responsive Breakpoints

| Attribute | Breakpoint | Description |
|-----------|------------|-------------|
| `data-slides-xs` | 478px+ | Extra small screens |
| `data-slides-sm` | 640px+ | Small screens |
| `data-slides-md` | 768px+ | Medium screens |
| `data-slides-lg` | 1024px+ | Large screens |
| `data-slides-xl` | 1280px+ | Extra large screens |
| `data-slides-2xl` | 1536px+ | 2X large screens |

### Advanced Features

| Attribute | Type | Description |
|-----------|------|-------------|
| `data-slides-offset-before` | number | Offset before first slide |
| `data-slides-offset-after` | number | Offset after last slide |
| `data-centered` | boolean | Center slides |
| `data-free-mode` | boolean | Enable free mode |
| `data-grab-cursor` | boolean | Show grab cursor |

## Examples

### Responsive Slider
```html
<div class="swiper" 
     data-slides-per-view="1"
     data-slides-sm="2" 
     data-slides-lg="4"
     data-space-between="20"
     data-autoplay="true">
  <!-- slides -->
</div>
```

### Product Gallery with Thumbs
```html
<!-- Main slider -->
<div class="swiper main-slider" data-thumbs=".thumb-slider">
  <!-- slides -->
</div>

<!-- Thumbnail slider -->
<div class="swiper thumb-slider" data-slides-per-view="4">
  <!-- thumb slides -->
</div>
```

### Custom Navigation
```html
<div class="swiper" 
     data-nav-prev=".my-prev-btn"
     data-nav-next=".my-next-btn">
  <!-- slides -->
</div>
<button class="my-prev-btn">Previous</button>
<button class="my-next-btn">Next</button>
```

## API Reference

### Programmatic Access

```javascript
// Get swiper instance
const swiperEl = document.querySelector('.swiper');
const instance = swiperEl.swiperAPI.getInstance();

// Control methods
swiperEl.swiperAPI.init();      // Initialize
swiperEl.swiperAPI.destroy();   // Destroy
swiperEl.swiperAPI.update();    // Update
swiperEl.swiperAPI.refresh();   // Refresh responsive state
```

### Global Access

```javascript
// All swiper instances
console.log(window.swiperInstances);

// Cleanup all instances
window.cleanupSwipers();
```

### TypeScript Support

```typescript
import { SwiperManager, utils } from 'aux-swiper';
import type { SwiperConfig, SwiperAPI } from 'aux-swiper';

// Create custom manager
const manager = new SwiperManager(element, 0);

// Type-safe configuration
const config: SwiperConfig = {
  slidesPerView: 3,
  spaceBetween: 20
};
```

## Browser Support

- Chrome 63+
- Firefox 67+
- Safari 12+
- Edge 79+

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

MIT © [AlpineUX](https://github.com/alpineux)