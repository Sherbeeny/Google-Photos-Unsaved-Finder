import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { JSDOM } from 'jsdom'
import fs from 'fs'
import path from 'path'

// We need to import the functions to test them.
import * as script from '../src/main.js'

// Mock the global Greasemonkey functions and other globals
vi.stubGlobal('GM_getResourceText', vi.fn().mockReturnValue('/* MDC CSS */'))
vi.stubGlobal('GM_addStyle', vi.fn())
vi.stubGlobal('GM_registerMenuCommand', vi.fn())

describe('Google Photos Saved Finder - Integration Tests', () => {
  beforeEach(() => {
    const uiHtml = fs.readFileSync(path.resolve(__dirname, '../src/ui.html'), 'utf8')
    const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body>${uiHtml}</body></html>`, {
      runScripts: 'dangerously',
      url: 'https://photos.google.com/',
      pretendToBeVisual: true,
    })

    const window = dom.window
    const document = window.document
    window.unsafeWindow = {}
    Object.assign(global, { window, document, unsafeWindow: window.unsafeWindow })

    window.mdc = {
      dialog: { MDCDialog: vi.fn((el) => ({ open: vi.fn(), close: vi.fn(), listen: vi.fn(), isOpen: false, root: el })) },
      select: { MDCSelect: vi.fn(() => ({ listen: vi.fn(), value: '' })) },
      ripple: { MDCRipple: vi.fn(el => ({set: vi.fn(), disabled: false})) },
      textField: { MDCTextField: vi.fn() },
      radio: { MDCRadio: vi.fn() },
      checkbox: { MDCCheckbox: vi.fn() },
      list: { MDCList: vi.fn() },
    }

    window.unsafeWindow.gptkApi = {
      getItemInfo: vi.fn(),
      createAlbum: vi.fn(),
    }
    window.unsafeWindow.gptkApiUtils = {
      getAllAlbums: vi.fn(),
      getAllMediaInAlbum: vi.fn(),
      addToExistingAlbum: vi.fn(),
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
    window.unsafeWindow.gptkApiUtils.getAllAlbums.mockResolvedValue(fakeAlbums)

    await script.showUI()

    await new Promise(resolve => process.nextTick(resolve));

    const sourceList = document.getElementById('gpsf-source-albums')
    expect(sourceList.children.length).toBe(2)
    expect(sourceList.textContent).toContain('Summer Vacation (50)')

    const destList = document.getElementById('gpsf-destination-album-select')
    expect(destList.children.length).toBe(3)
  })

  it('should run the full process when Start is clicked', async () => {
    const fakeAlbums = [{ mediaKey: 'album1', title: 'Test Album', itemCount: 2 }]
    const fakeMediaItems = [ { mediaKey: 'item1', dedupKey: 'd1' }, { mediaKey: 'item2', dedupKey: 'd2' } ]
    const itemInfos = [ { mediaKey: 'item1', savedToYourPhotos: true }, { mediaKey: 'item2', savedToYourPhotos: false } ]

    window.unsafeWindow.gptkApiUtils.getAllAlbums.mockResolvedValue(fakeAlbums)
    window.unsafeWindow.gptkApiUtils.getAllMediaInAlbum.mockResolvedValue(fakeMediaItems)
    window.unsafeWindow.gptkApi.getItemInfo.mockImplementation(mediaKey => Promise.resolve(itemInfos.find(info => info.mediaKey === mediaKey)))
    window.unsafeWindow.gptkApi.createAlbum.mockResolvedValue('new-album-id')
    window.unsafeWindow.gptkApiUtils.addToExistingAlbum.mockResolvedValue(true)

    await script.showUI()
    await new Promise(resolve => process.nextTick(resolve));

    document.querySelector('#gpsf-source-albums input[type="checkbox"]').checked = true
    document.querySelector('input[name="filter-type"][value="not-saved"]').checked = true
    document.getElementById('gpsf-destination-album-new').value = 'My New Album'

    await script.startProcess()
    await new Promise(resolve => process.nextTick(resolve));
    await new Promise(resolve => process.nextTick(resolve));

    expect(window.unsafeWindow.gptkApiUtils.getAllMediaInAlbum).toHaveBeenCalledWith('album1')
    expect(window.unsafeWindow.gptkApi.getItemInfo).toHaveBeenCalledWith('item1')
    expect(window.unsafeWindow.gptkApi.getItemInfo).toHaveBeenCalledWith('item2')
    expect(window.unsafeWindow.gptkApi.createAlbum).toHaveBeenCalledWith('My New Album')
    expect(window.unsafeWindow.gptkApiUtils.addToExistingAlbum).toHaveBeenCalledWith(['item2'], 'new-album-id')
    const logArea = document.getElementById('gpsf-log')
    expect(logArea.textContent).toContain('1 items successfully added.')
  })
})
