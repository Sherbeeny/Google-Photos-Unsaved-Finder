import uiHtml from './ui.html'
import styles from './styles.css'

// State variables
let uiInjected = false
let mdcInitialized = false
let albumsLoaded = false
let albums = []
let isProcessing = false
let isCancelled = false

// MDC instances
let dialog, destSelect, startButton, cancelButton

const SCRIPT_NAME = 'Google Photos Saved Finder'

/**
 * Injects all CSS into the page.
 */
function injectStyles () {
  const localStyleSheet = document.createElement('style')
  localStyleSheet.innerText = styles
  document.head.appendChild(localStyleSheet)
  const mdcCSS = GM_getResourceText('mdcCSS')
  GM_addStyle(mdcCSS)
}

/**
 * Populates the album lists in the UI with MDC components.
 * @param {Array} albumList - The list of albums from the GPTK API.
 */
export function populateAlbumLists (albumList) {
  const sourceList = document.getElementById('gpsf-source-albums')
  const destList = document.getElementById('gpsf-destination-album-select')

  sourceList.innerHTML = ''
  destList.innerHTML = '<li class="mdc-list-item mdc-list-item--selected" aria-selected="true" data-value=""><span></span></li>'

  if (!albumList || albumList.length === 0) {
    sourceList.innerHTML = '<p class="mdc-typography--body2">No albums found.</p>'
    return
  }

  albumList.forEach(album => {
    const checkboxId = `gpsf-album-${album.mediaKey}`
    const formField = document.createElement('div')
    formField.className = 'mdc-form-field'
    const checkboxDiv = document.createElement('div')
    checkboxDiv.className = 'mdc-checkbox'
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.className = 'mdc-checkbox__native-control'
    input.id = checkboxId
    input.value = album.mediaKey
    input.dataset.title = album.title
    const bg = document.createElement('div')
    bg.className = 'mdc-checkbox__background'
    bg.innerHTML = '<svg class="mdc-checkbox__checkmark" viewBox="0 0 24 24"><path class="mdc-checkbox__checkmark-path" fill="none" d="M1.73,12.91 8.1,19.28 22.79,4.59"/></svg><div class="mdc-checkbox__mixedmark"></div>'
    checkboxDiv.appendChild(input)
    checkboxDiv.appendChild(bg)
    const label = document.createElement('label')
    label.htmlFor = checkboxId
    label.textContent = ` ${album.title} (${album.itemCount})`
    formField.appendChild(checkboxDiv)
    formField.appendChild(label)
    console.log('TEST: Appending formField:', formField.outerHTML)
    sourceList.appendChild(formField)
    // eslint-disable-next-line no-new
    new window.mdc.checkbox.MDCCheckbox(checkboxDiv)

    const listItem = document.createElement('li')
    listItem.className = 'mdc-list-item'
    listItem.dataset.value = album.mediaKey
    listItem.innerHTML = `<span class="mdc-list-item__text">${album.title} (${album.itemCount})</span>`
    destList.appendChild(listItem)
  })
}

/**
  * Fetches all albums using the GPTK API and populates the UI.
  */
export async function loadAlbums () {
  if (albumsLoaded) return
  log('Loading albums...')
  try {
    console.log('TEST: Before getAllAlbums await')
    albums = await unsafeWindow.gptkApiUtils.getAllAlbums()
    console.log('TEST: After getAllAlbums await', albums)
    albums.sort((a, b) => a.title.localeCompare(b.title))
    populateAlbumLists(albums)
    albumsLoaded = true
    log(`${albums.length} albums loaded successfully.`, 'success')
  } catch (error) {
    console.error(`${SCRIPT_NAME}: Failed to load albums.`, error)
    log('Error loading albums. Is GPTK running?', 'error')
  }
}

/**
 * Initializes all Material Design Components.
 */
function initializeMDC () {
  if (mdcInitialized) return
  const dialogEl = document.getElementById('gpsf-modal')
  if (!dialogEl) return
  dialog = new window.mdc.dialog.MDCDialog(dialogEl)
  destSelect = new window.mdc.select.MDCSelect(document.getElementById('gpsf-destination-album-select-container'))
  startButton = new window.mdc.ripple.MDCRipple(document.getElementById('gpsf-start-button'))
  cancelButton = new window.mdc.ripple.MDCRipple(document.getElementById('gpsf-cancel-button'))
  document.querySelectorAll('.mdc-text-field').forEach(el => new window.mdc.textField.MDCTextField(el))
  document.querySelectorAll('.mdc-radio').forEach(el => new window.mdc.radio.MDCRadio(el))
  mdcInitialized = true
}

export function injectUI () {
  if (uiInjected) return
  injectStyles()
  const container = document.createElement('div')
  container.id = 'gpsf-container'
  container.innerHTML = uiHtml
  document.body.appendChild(container)
  uiInjected = true
  initializeMDC()
  addEventListeners()
}

export function showUI () {
  if (!uiInjected) injectUI()
  if (dialog && !dialog.isOpen) dialog.open()
  document.getElementById('gpsf-overlay').style.display = 'block'
  if (!albumsLoaded) loadAlbums()
}

function hideUI () {
  if (dialog && dialog.isOpen) dialog.close()
  document.getElementById('gpsf-overlay').style.display = 'none'
}

function log (message, type = 'info') {
  const logArea = document.getElementById('gpsf-log')
  if (!logArea) return
  const entry = document.createElement('div')
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`
  entry.className = `log-${type}`
  logArea.appendChild(entry)
  logArea.scrollTop = logArea.scrollHeight
}

function updateFeedback (status, scanned = 0, total = 0, matches = 0) {
  document.getElementById('gpsf-status').textContent = `Status: ${status}`
  document.getElementById('gpsf-stats').textContent = `Scanned: ${scanned}/${total} | Matches: ${matches}`
}

function resetUIState () {
  startButton.disabled = false
  cancelButton.disabled = true
  const logArea = document.getElementById('gpsf-log')
  logArea.innerHTML = ''
  updateFeedback('Idle')
}

async function getSourceMediaItems () {
  const sourceCheckboxes = document.querySelectorAll('#gpsf-source-albums input[type="checkbox"]:checked')
  if (sourceCheckboxes.length === 0) {
    log('No source albums selected.', 'error')
    return null
  }
  const allItems = []
  const itemKeys = new Set()
  updateFeedback('Fetching media items...')
  for (const checkbox of sourceCheckboxes) {
    if (isCancelled) return null
    const albumId = checkbox.value
    const albumTitle = checkbox.dataset.title
    log(`Fetching items from album: "${albumTitle}"...`)
    try {
      const items = await unsafeWindow.gptkApiUtils.getAllMediaInAlbum(albumId)
      items.forEach(item => {
        if (!itemKeys.has(item.mediaKey)) {
          itemKeys.add(item.mediaKey)
          allItems.push(item)
        }
      })
      log(`Found ${items.length} items in "${albumTitle}". Total unique items so far: ${allItems.length}`)
    } catch (error) {
      log(`Error fetching items from album "${albumTitle}": ${error.message}`, 'error')
    }
  }
  return allItems
}

async function processBatches (items, filterType, batchSize) {
  const matchedItems = []
  let scannedCount = 0
  const totalCount = items.length
  for (let i = 0; i < totalCount; i += batchSize) {
    if (isCancelled) return null
    const batch = items.slice(i, i + batchSize)
    updateFeedback(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(totalCount / batchSize)}...`, scannedCount, totalCount, matchedItems.length)
    const promises = batch.map(item => unsafeWindow.gptkApi.getItemInfo(item.mediaKey))
    const results = await Promise.all(promises)
    scannedCount += batch.length
    results.forEach(itemInfo => {
      if (!itemInfo) return
      const isSaved = itemInfo.savedToYourPhotos
      if (filterType === 'any' || (filterType === 'saved' && isSaved) || (filterType === 'not-saved' && !isSaved)) {
        matchedItems.push(itemInfo)
      }
    })
    log(`Batch processed. Scanned: ${scannedCount}/${totalCount}. Matches found: ${matchedItems.length}.`)
  }
  return matchedItems
}

async function addToAlbum (matchedItems) {
  const newAlbumName = document.getElementById('gpsf-destination-album-new').value.trim()
  let destinationAlbumId = destSelect.value
  if (!destinationAlbumId && !newAlbumName) {
    log('No destination album selected or new album name provided.', 'error')
    return
  }
  try {
    if (newAlbumName) {
      log(`Creating new album: "${newAlbumName}"...`)
      updateFeedback('Creating new album...')
      destinationAlbumId = await unsafeWindow.gptkApi.createAlbum(newAlbumName)
      log(`Album "${newAlbumName}" created successfully.`, 'success')
    }
    if (!destinationAlbumId) return
    log(`Adding ${matchedItems.length} items to destination album...`)
    updateFeedback(`Adding ${matchedItems.length} items...`)
    await unsafeWindow.gptkApiUtils.addToExistingAlbum(matchedItems.map(item => item.mediaKey), destinationAlbumId)
    log(`${matchedItems.length} items successfully added.`, 'success')
    updateFeedback('Process Complete!', matchedItems.length, matchedItems.length, matchedItems.length)
  } catch (error) {
    log(`Error adding items to album: ${error.message}`, 'error')
    updateFeedback('Error!')
  }
}

export async function startProcess () {
  if (isProcessing) return
  isProcessing = true
  isCancelled = false
  resetUIState()
  startButton.disabled = true
  cancelButton.disabled = false
  log('Starting process...')
  const mediaItems = await getSourceMediaItems()
  if (!mediaItems || mediaItems.length === 0 || isCancelled) {
    log('No media items to process or process cancelled.', 'info')
    isProcessing = false
    resetUIState()
    return
  }
  const filterType = document.querySelector('input[name="filter-type"]:checked').value
  const batchSize = parseInt(document.getElementById('gpsf-batch-size').value, 10) || 20
  const matchedItems = await processBatches(mediaItems, filterType, batchSize)
  if (isCancelled) {
    log('Process cancelled by user.', 'info')
  } else if (matchedItems && matchedItems.length > 0) {
    log(`Processing complete. Found ${matchedItems.length} matches.`, 'success')
    await addToAlbum(matchedItems)
  } else {
    log('Processing complete. No matches found.', 'info')
    updateFeedback('Complete. No matches found.', mediaItems.length, mediaItems.length, 0)
  }
  isProcessing = false
  resetUIState()
}

function cancelProcess () {
  if (!isProcessing) return
  isCancelled = true
  cancelButton.disabled = true
  log('Cancellation requested. The process will stop after the current batch.', 'info')
  updateFeedback('Cancelling...')
}

function addEventListeners () {
  dialog.listen('MDCDialog:closed', hideUI)
  document.getElementById('gpsf-overlay').addEventListener('click', hideUI)
  document.getElementById('gpsf-start-button').addEventListener('click', startProcess)
  document.getElementById('gpsf-cancel-button').addEventListener('click', cancelProcess)
}

function main () {
  console.log(`${SCRIPT_NAME}: Initializing...`)
  if (typeof unsafeWindow.gptkApi === 'undefined' || typeof unsafeWindow.gptkApiUtils === 'undefined') {
    console.error(`${SCRIPT_NAME}: Google Photos Toolkit (GPTK) is not available.`)
    return
  }
  if (unsafeWindow.gptkCore) unsafeWindow.gptkCore.isProcessRunning = false
  GM_registerMenuCommand('Start Google Photos Saved Finder', showUI)
  console.log(`${SCRIPT_NAME}: Initialized successfully.`)
}

// Self-executing anonymous function for the final userscript
(function () {
  if (typeof GM_info !== 'undefined' && GM_info.scriptHandler === 'Tampermonkey') {
    const mdcScript = document.createElement('script')
    mdcScript.src = 'https://unpkg.com/material-components-web@latest/dist/material-components-web.min.js'
    mdcScript.onload = main
    document.head.appendChild(mdcScript)
  }
})()
