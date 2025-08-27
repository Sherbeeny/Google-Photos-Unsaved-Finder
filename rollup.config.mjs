import { readFileSync } from 'fs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { string } from 'rollup-plugin-string'
import postcss from 'rollup-plugin-postcss'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))

const banner = `
// ==UserScript==
// @name         Google Photos Saved Finder
// @namespace    ${pkg.homepage}
// @version      ${pkg.version}
// @description  ${pkg.description}
// @author       ${pkg.author}
// @match        *://photos.google.com/*
// @license      ${pkg.license}
// @grant        GM_registerMenuCommand
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @run-at       document-idle
// @resource     mdcCSS https://cdnjs.cloudflare.com/ajax/libs/material-components-web/14.0.0/material-components-web.min.css
// @homepageURL  ${pkg.homepage}
// @supportURL   ${pkg.bugs.url}
// @updateURL    https://github.com/Sherbeeny/Google-Photos-Saved-Finder/releases/latest/download/gpsf.user.js
// @downloadURL  https://github.com/Sherbeeny/Google-Photos-Saved-Finder/releases/latest/download/gpsf.user.js
// ==/UserScript==
`

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/gpsf.user.js',
    format: 'iife',
    banner: banner.trim()
  },
  plugins: [
    string({
      include: '**/*.html'
    }),
    postcss({
      extract: false,
      inject: false,
      minimize: true
    }),
    nodeResolve(),
    commonjs()
  ]
}
