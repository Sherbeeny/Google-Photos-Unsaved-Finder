import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { JSDOM } from 'jsdom'
import fs from 'fs'
import path from 'path'

import * as script from '../src/main.js'

vi.stubGlobal('GM_getResourceText', vi.fn().mockReturnValue('/* MDC CSS */'))
vi.stubGlobal('GM_addStyle', vi.fn())
vi.stubGlobal('GM_registerMenuCommand', vi.fn())

describe('Google Photos Saved Finder - Integration Tests', () => {
  beforeEach(() => {
    const uiHtml = fs.readFileSync(path.resolve(__dirname, '../src/ui.html'), 'utf8')
    const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body>${uiHtml}</body></html>`, {
      url: 'https://photos.google.com/',
    })

    global.window = dom.window
    global.document = dom.window.document
    global.unsafeWindow = dom.window

    global.unsafeWindow.gptkApiUtils = {
      getAllAlbums: vi.fn(),
    }

    global.window.mdc = {
      dialog: { MDCDialog: vi.fn(() => ({ open: vi.fn(), close: vi.fn(), listen: vi.fn() })) },
      select: { MDCSelect: vi.fn(() => ({ listen: vi.fn(), value: '' })) },
      ripple: { MDCRipple: vi.fn(() => ({ disabled: false })) },
      textField: { MDCTextField: vi.fn() },
      radio: { MDCRadio: vi.fn() },
      checkbox: { MDCCheckbox: vi.fn() },
    }

    script.injectUI()
  });

  afterEach(() => {
    vi.restoreAllMocks()
  });

  it('should fetch albums and populate the UI when shown', async () => {
    const fakeAlbums = [
      { mediaKey: 'album1', title: 'Summer Vacation', itemCount: 50 },
      { mediaKey: 'album2', title: 'Birthdays', itemCount: 100 },
    ]
    global.unsafeWindow.gptkApiUtils.getAllAlbums.mockResolvedValue(fakeAlbums)

    await script.showUI()
    await new Promise(resolve => process.nextTick(resolve));

    const sourceList = document.getElementById('gpsf-source-albums')
    expect(sourceList.textContent).toContain('Summer Vacation (50)')
    expect(sourceList.textContent).toContain('Birthdays (100)')
  });
})
