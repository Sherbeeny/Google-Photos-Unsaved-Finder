import uiHtml from './popup.html'
import styles from './styles.css'

// State variables
let albums = []
let isProcessing = false
let isCancelled = false

// MDC instances
let destSelect, startButton, cancelButton, progressBar

const SCRIPT_NAME = 'Google Photos Saved Finder'

/**
 * Injects all CSS into the page.
 * @param {Document} doc The document to inject the styles into.
 */
function injectStyles (doc) {
  const styleEl = doc.createElement('style')
  styleEl.textContent = styles
  doc.head.appendChild(styleEl)
}

/**
 * Populates the album lists in the UI with MDC components.
 * @param {Array} albumList - The list of albums from the GPTK API.
 * @param {Document} doc The document to populate the lists in.
 */
export function populateAlbumLists (albumList, doc) {
  const sourceList = doc.getElementById('gpsf-source-albums')
  const destList = doc.getElementById('gpsf-destination-album-select')

  sourceList.innerHTML = ''
  destList.innerHTML = '<li class="mdc-list-item mdc-list-item--selected" aria-selected="true" data-value=""><span></span></li>'

  if (!albumList || albumList.length === 0) {
    sourceList.innerHTML = '<p class="mdc-typography--body2">No albums found.</p>'
    return
  }

  albumList.forEach(album => {
    const checkboxId = `gpsf-album-${album.mediaKey}`
    const formField = doc.createElement('div')
    formField.className = 'mdc-form-field'
    const checkboxDiv = doc.createElement('div')
    checkboxDiv.className = 'mdc-checkbox'
    const input = doc.createElement('input')
    input.type = 'checkbox'
    input.className = 'mdc-checkbox__native-control'
    input.id = checkboxId
    input.value = album.mediaKey
    input.dataset.title = album.title
    const bg = doc.createElement('div')
    bg.className = 'mdc-checkbox__background'
    bg.innerHTML = '<svg class="mdc-checkbox__checkmark" viewBox="0 0 24 24"><path class="mdc-checkbox__checkmark-path" fill="none" d="M1.73,12.91 8.1,19.28 22.79,4.59"/></svg><div class="mdc-checkbox__mixedmark"></div>'
    checkboxDiv.appendChild(input)
    checkboxDiv.appendChild(bg)
    const label = doc.createElement('label')
    label.htmlFor = checkboxId
    label.textContent = ` ${album.title} (${album.itemCount})`
    formField.appendChild(checkboxDiv)
    formField.appendChild(label)
    sourceList.appendChild(formField)
    // eslint-disable-next-line no-new
    new window.mdc.checkbox.MDCCheckbox(checkboxDiv)

    const listItem = doc.createElement('li')
    listItem.className = 'mdc-list-item'
    listItem.dataset.value = album.mediaKey
    listItem.innerHTML = `<span class="mdc-list-item__text">${album.title} (${album.itemCount})</span>`
    destList.appendChild(listItem)
  })
}

/**
  * Fetches all albums using the GPTK API and populates the UI.
  * @param {Document} doc The document to populate the lists in.
  */
export async function loadAlbums (doc) {
  log('Loading albums...', doc)
  try {
    albums = await unsafeWindow.gptkApiUtils.getAllAlbums()
    albums.sort((a, b) => a.title.localeCompare(b.title))
    populateAlbumLists(albums, doc)
    log(`${albums.length} albums loaded successfully.`, doc, 'success')
  } catch (error) {
    console.error(`${SCRIPT_NAME}: Failed to load albums.`, error)
    log('Error loading albums. Is GPTK running?', doc, 'error')
  }
}

/**
 * Initializes all Material Design Components.
 * @param {Document} doc The document to initialize the components in.
 */
function initializeMDC (doc) {
  destSelect = new window.mdc.select.MDCSelect(doc.getElementById('gpsf-destination-album-select-container'))
  startButton = new window.mdc.ripple.MDCRipple(doc.getElementById('gpsf-start-button'))
  cancelButton = new window.mdc.ripple.MDCRipple(doc.getElementById('gpsf-cancel-button'))
  progressBar = new window.mdc.linearProgress.MDCLinearProgress(doc.querySelector('#gpsf-progress-bar-container .mdc-linear-progress'))
  doc.querySelectorAll('.mdc-text-field').forEach(el => new window.mdc.textField.MDCTextField(el))
  doc.querySelectorAll('.mdc-radio').forEach(el => new window.mdc.radio.MDCRadio(el))
  doc.querySelectorAll('.mdc-checkbox').forEach(el => new window.mdc.checkbox.MDCCheckbox(el))
}

/**
 * Shows the main UI.
 */
export function showUI () {
  const popup = window.open('', 'Google Photos Saved Finder', 'width=600,height=800')
  popup.document.write(uiHtml)
  injectStyles(popup.document)

  const mdcScript = popup.document.createElement('script')
  mdcScript.src = 'https://unpkg.com/material-components-web@latest/dist/material-components-web.min.js'
  mdcScript.onload = () => {
    try {
      if (window.mdc) {
        initializeMDC(popup.document)
        addEventListeners(popup.document)
        loadAlbums(popup.document)
      } else {
        log('MDC library not loaded.', popup.document, 'error')
      }
    } catch (e) {
      log(`Error initializing MDC: ${e.message}`, popup.document, 'error')
    }
  }
  popup.document.head.appendChild(mdcScript)
}

/**
 * Logs a message to the log area in the UI.
 * @param {string} message The message to log.
 * @param {Document} doc The document to log to.
 * @param {string} type The type of log message (e.g., 'info', 'success', 'error').
 */
function log (message, doc, type = 'info') {
  const logArea = doc.getElementById('gpsf-log')
  if (!logArea) return
  const entry = doc.createElement('div')
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`
  entry.className = `log-${type}`
  if (type === 'error') {
    entry.style.color = 'red'
  }
  logArea.appendChild(entry)
  logArea.scrollTop = logArea.scrollHeight
}

/**
 * Updates the feedback area in the UI.
 * @param {string} status The status message to display.
 * @param {Document} doc The document to update.
 * @param {number} scanned The number of items scanned.
 * @param {number} total The total number of items to scan.
 * @param {number} matches The number of matches found.
 */
function updateFeedback (status, doc, scanned = 0, total = 0, matches = 0) {
  doc.getElementById('gpsf-status').textContent = `Status: ${status}`
  doc.getElementById('gpsf-stats').textContent = `Scanned: ${scanned}/${total} | Matches: ${matches}`
  const progressBarContainer = doc.getElementById('gpsf-progress-bar-container')

  if (total > 0 && scanned > 0 && scanned <= total) {
    progressBarContainer.style.display = 'block'
    progressBar.progress = scanned / total
  } else {
    progressBarContainer.style.display = 'none'
    progressBar.progress = 0
  }
}

/**
 * Resets the UI to its initial state.
 * @param {Document} doc The document to reset.
 */
function resetUIState (doc) {
  startButton.disabled = false
  cancelButton.disabled = true
  const logArea = doc.getElementById('gpsf-log')
  logArea.innerHTML = ''
  updateFeedback('Idle', doc)
  const progressBarContainer = doc.getElementById('gpsf-progress-bar-container')
  progressBarContainer.style.display = 'none'
  if (progressBar) {
    progressBar.progress = 0
  }
}

/**
 * Gets all media items from the selected source albums.
 * @param {Document} doc The document to get the selected albums from.
 * @returns {Promise<Array|null>} A promise that resolves with an array of media items, or null if no albums are selected.
 */
async function getSourceMediaItems (doc) {
  const sourceCheckboxes = doc.querySelectorAll('#gpsf-source-albums input[type="checkbox"]:checked')
  if (sourceCheckboxes.length === 0) {
    log('No source albums selected.', doc, 'error')
    return null
  }
  const allItems = []
  const itemKeys = new Set()
  updateFeedback('Fetching media items...', doc)
  for (const checkbox of sourceCheckboxes) {
    if (isCancelled) return null
    const albumId = checkbox.value
    const albumTitle = checkbox.dataset.title
    log(`Fetching items from album: "${albumTitle}"...`, doc)
    try {
      const items = await unsafeWindow.gptkApiUtils.getAllMediaInAlbum(albumId)
      items.forEach(item => {
        if (!itemKeys.has(item.mediaKey)) {
          itemKeys.add(item.mediaKey)
          allItems.push(item)
        }
      })
      log(`Found ${items.length} items in "${albumTitle}". Total unique items so far: ${allItems.length}`, doc)
    } catch (error) {
      log(`Error fetching items from album "${albumTitle}": ${error.message}`, doc, 'error')
    }
  }
  return allItems
}

/**
 * Processes batches of media items to find saved photos.
 * @param {Array} items The media items to process.
 * @param {string} filterType The type of filter to apply ('any', 'saved', 'not-saved').
 * @param {Document} doc The document to update the feedback in.
 * @param {number} batchSize The number of items to process in each batch.
 * @returns {Promise<Array|null>} A promise that resolves with an array of matched media items, or null if the process is cancelled.
 */
async function processBatches (items, filterType, doc, batchSize) {
  const matchedItems = []
  let scannedCount = 0
  const totalCount = items.length
  for (let i = 0; i < totalCount; i += batchSize) {
    if (isCancelled) return null
    const batch = items.slice(i, i + batchSize)
    updateFeedback(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(totalCount / batchSize)}...`, doc, scannedCount, totalCount, matchedItems.length)
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
    log(`Batch processed. Scanned: ${scannedCount}/${totalCount}. Matches found: ${matchedItems.length}.`, doc)
  }
  return matchedItems
}

/**
 * Renders the matched photos in the UI.
 * @param {Array} items The matched media items to render.
 * @param {Document} doc The document to render the results in.
 */
function renderResults (items, doc) {
  const resultsContainer = doc.getElementById('gpsf-results-container')
  resultsContainer.innerHTML = ''
  if (items.length === 0) {
    resultsContainer.innerHTML = '<p>No matching photos found.</p>'
    return
  }
  const grid = doc.createElement('div')
  grid.className = 'photo-grid'
  items.forEach(item => {
    const itemEl = doc.createElement('div')
    itemEl.className = 'photo-grid-item'
    const img = doc.createElement('img')
    img.src = item.url
    itemEl.appendChild(img)
    grid.appendChild(itemEl)
  })
  resultsContainer.appendChild(grid)
}

/**
 * Adds the matched photos to a new or existing album.
 * @param {Array} matchedItems The media items to add to the album.
 * @param {Document} doc The document to get the destination album from.
 */
async function addToAlbum (matchedItems, doc) {
  const newAlbumName = doc.getElementById('gpsf-destination-album-new').value.trim()
  let destinationAlbumId = destSelect.value
  if (!destinationAlbumId && !newAlbumName) {
    log('No destination album selected or new album name provided.', doc, 'error')
    return
  }
  try {
    if (newAlbumName) {
      log(`Creating new album: "${newAlbumName}"...`, doc)
      updateFeedback('Creating new album...', doc)
      destinationAlbumId = await unsafeWindow.gptkApi.createAlbum(newAlbumName)
      log(`Album "${newAlbumName}" created successfully.`, doc, 'success')
    }
    if (!destinationAlbumId) return
    log(`Adding ${matchedItems.length} items to destination album...`, doc)
    updateFeedback(`Adding ${matchedItems.length} items...`, doc)
    await unsafeWindow.gptkApiUtils.addToExistingAlbum(matchedItems.map(item => item.mediaKey), destinationAlbumId)
    log(`${matchedItems.length} items successfully added.`, doc, 'success')
    updateFeedback('Process Complete!', doc, matchedItems.length, matchedItems.length, matchedItems.length)
  } catch (error) {
    log(`Error adding items to album: ${error.message}`, doc, 'error')
    updateFeedback('Error!', doc)
  }
}

/**
 * Starts the process of finding saved photos.
 * @param {Document} doc The document to work with.
 */
export async function startProcess (doc) {
  if (isProcessing) return
  isProcessing = true
  isCancelled = false
  resetUIState(doc)
  startButton.disabled = true
  cancelButton.disabled = false
  log('Starting process...', doc)
  const mediaItems = await getSourceMediaItems(doc)
  if (!mediaItems || mediaItems.length === 0 || isCancelled) {
    log('No media items to process or process cancelled.', doc, 'info')
    isProcessing = false
    resetUIState(doc)
    return
  }
  const filterType = doc.querySelector('input[name="filter-type"]:checked').value
  const batchSize = parseInt(doc.getElementById('gpsf-batch-size').value, 10) || 20
  const matchedItems = await processBatches(mediaItems, filterType, doc, batchSize)
  if (isCancelled) {
    log('Process cancelled by user.', doc, 'info')
  } else if (matchedItems && matchedItems.length > 0) {
    log(`Processing complete. Found ${matchedItems.length} matches.`, doc, 'success')
    renderResults(matchedItems, doc)
    await addToAlbum(matchedItems, doc)
  } else {
    log('Processing complete. No matches found.', doc, 'info')
    updateFeedback('Complete. No matches found.', doc, mediaItems.length, mediaItems.length, 0)
  }
  isProcessing = false
  resetUIState(doc)
}

/**
 * Cancels the current process.
 * @param {Document} doc The document to update the UI in.
 */
function cancelProcess (doc) {
  if (!isProcessing) return
  isCancelled = true
  cancelButton.disabled = true
  log('Cancellation requested. The process will stop after the current batch.', doc, 'info')
  updateFeedback('Cancelling...', doc)
}

/**
 * Adds event listeners to the UI elements.
 * @param {Document} doc The document to add the event listeners to.
 */
function addEventListeners (doc) {
  doc.getElementById('gpsf-start-button').addEventListener('click', () => startProcess(doc))
  doc.getElementById('gpsf-cancel-button').addEventListener('click', () => cancelProcess(doc))
  doc.getElementById('gpsf-close-button').addEventListener('click', () => doc.defaultView.close())
  doc.getElementById('gpsf-select-all-checkbox').addEventListener('change', (event) => {
    const checkboxes = doc.querySelectorAll('#gpsf-source-albums input[type="checkbox"]')
    checkboxes.forEach(checkbox => {
      checkbox.checked = event.target.checked
    })
  })
}

/**
 * The main function of the userscript.
 */
function main () {
  if (typeof unsafeWindow === 'undefined') {
    window.unsafeWindow = window
  }

  if (typeof GM_info === 'undefined' || !GM_info.scriptHandler) {
    // E2E testing environment
    if (window.E2E_TESTING) {
      showUI()
    }
  } else {
    // Tampermonkey environment
    if (typeof unsafeWindow.gptkApi === 'undefined' || typeof unsafeWindow.gptkApiUtils === 'undefined') {
      console.error(`${SCRIPT_NAME}: Google Photos Toolkit (GPTK) is not available.`)
      return
    }
    if (unsafeWindow.gptkCore) unsafeWindow.gptkCore.isProcessRunning = false
    GM_registerMenuCommand('Start Google Photos Saved Finder', showUI)
  }
}

// Self-executing anonymous function for the final userscript
(function () {
  if (typeof GM_info !== 'undefined' && GM_info.scriptHandler === 'Tampermonkey') {
    // In the live userscript, run main immediately to avoid CSP issues on the host page.
    // The popup window will handle loading MDC for itself.
    main()
  } else {
    // In the E2E test environment, the popup seems to have trouble loading external scripts.
    // Therefore, we load MDC on the main test page first, and then call main().
    const mdcScript = document.createElement('script')
    mdcScript.src = 'https://unpkg.com/material-components-web@latest/dist/material-components-web.min.js'
    mdcScript.onload = main
    document.head.appendChild(mdcScript)
  }
})()
