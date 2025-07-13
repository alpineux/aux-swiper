import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

const isProduction = process.env.NODE_ENV === 'production';

const banner = `/*!
 * aux-swiper v1.0.0
 * Utilities for SwiperJS in Webflow
 * (c) 2025 AlpineUX
 * Released under the MIT License.
 */`;

const baseConfig = {
    input: 'src/index.ts',
    external: [], // No external dependencies for browser bundle
    plugins: [
        typescript({
            tsconfig: './tsconfig.json',
            declaration: true,
            declarationDir: './dist'
        })
    ]
};

export default [
    // UMD build for script tags (main browser bundle)
    {
        ...baseConfig,
        output: [
            {
                file: 'dist/index.umd.js',
                format: 'umd',
                name: 'AuxSwiper',
                banner,
                sourcemap: !isProduction
            },
            // Minified version
            ...(isProduction ? [{
                file: 'dist/index.umd.min.js',
                format: 'umd',
                name: 'AuxSwiper',
                banner,
                plugins: [terser({
                    format: {
                        comments: /^!/
                    }
                })]
            }] : [])
        ]
    },

    // ES Module build
    {
        ...baseConfig,
        output: {
            file: 'dist/index.esm.js',
            format: 'es',
            banner,
            sourcemap: !isProduction
        }
    },

    // CommonJS build
    {
        ...baseConfig,
        output: {
            file: 'dist/index.js',
            format: 'cjs',
            banner,
            sourcemap: !isProduction,
            exports: 'named'
        }
    }
];