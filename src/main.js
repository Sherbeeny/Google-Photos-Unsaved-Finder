import uiHtml from './popup.html'

// --- Constants ---
const SCRIPT_NAME = 'Google Photos Saved Finder'

// --- State Variables ---
let albums = []
let isProcessing = false
let isCancelled = false

// --- Element References ---
let startButton, cancelButton, progressBar, uiContainer

/**
 * Ensures a Trusted Types policy exists for creating the UI.
 * Uses a try-catch block to gracefully handle cases where the 'default'
 * policy has already been created by another script (e.g., GPTK).
 */
function setupTrustedTypesPolicy () {
  if (!window.trustedTypes) return
  try {
    // Attempt to create the policy.
    window.trustedTypes.createPolicy('default', {
      createHTML: (string) => string
    })
  } catch (error) {
    // A TypeError will be thrown if the policy already exists.
    // We can safely ignore this specific error.
    if (error.name !== 'TypeError') {
      console.error(`${SCRIPT_NAME}: Unexpected error creating Trusted Types policy:`, error)
    }
  }
}

/**
 * Populates the album dropdowns and lists in the UI.
 * @param {Array<object>} albumList - The list of album objects from the GPTK API.
 * @param {Document} doc - The document object of the UI.
 */
function populateAlbumLists (albumList, doc) {
  const sourceList = doc.getElementById('gpsf-source-albums')
  const destSelect = doc.getElementById('gpsf-destination-album-select')

  sourceList.innerHTML = ''
  destSelect.innerHTML = '<option value="" selected>Choose existing album...</option>'

  if (!albumList || albumList.length === 0) {
    sourceList.innerHTML = '<li>No albums found. Refresh or check GPTK.</li>'
    return
  }

  // Add a "Select All" checkbox
  const selectAllLi = doc.createElement('li')
  const selectAllCheckbox = doc.createElement('input')
  selectAllCheckbox.type = 'checkbox'
  selectAllCheckbox.id = 'gpsf-select-all-checkbox'
  const selectAllLabel = doc.createElement('label')
  selectAllLabel.htmlFor = 'gpsf-select-all-checkbox'
  selectAllLabel.textContent = ' Select All'
  selectAllLabel.style.fontWeight = 'bold'
  selectAllLi.appendChild(selectAllCheckbox)
  selectAllLi.appendChild(selectAllLabel)
  sourceList.appendChild(selectAllLi)

  // Populate album lists
  albumList.forEach(album => {
    const checkboxId = `gpsf-album-${album.mediaKey}`
    const li = doc.createElement('li')
    const checkbox = doc.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.id = checkboxId
    checkbox.value = album.mediaKey
    checkbox.dataset.title = album.title
    const label = doc.createElement('label')
    label.htmlFor = checkboxId
    label.textContent = ` ${album.title} (${album.itemCount})`
    li.appendChild(checkbox)
    li.appendChild(label)
    sourceList.appendChild(li)

    const option = doc.createElement('option')
    option.value = album.mediaKey
    option.textContent = `${album.title} (${album.itemCount})`
    destSelect.appendChild(option)
  })
}

/**
 * Fetches all albums using the GPTK API and populates the UI lists.
 * @param {Document} doc - The document object of the UI.
 */
async function loadAlbums (doc) {
  log('Attempting to load albums via GPTK API...', doc)
  try {
    albums = await unsafeWindow.gptkApiUtils.getAllAlbums()
    albums.sort((a, b) => a.title.localeCompare(b.title))
    populateAlbumLists(albums, doc)
    log(`${albums.length} albums loaded successfully.`, doc, 'success')
  } catch (error) {
    const errorMessage = 'Error loading albums. Is the Google Photos Toolkit (GPTK) script installed and active?'
    console.error(`${SCRIPT_NAME}: ${errorMessage}`, error)
    log(errorMessage, doc, 'error')
  }
}

/** Hides the main UI container. */
function hideUI () {
  if (uiContainer) {
    uiContainer.style.display = 'none'
  }
}

/**
 * Creates and shows the main UI. If the UI already exists, it just shows it.
 * @param {string} email - The user's email address to display in the UI.
 */
function showUI (email) {
  if (!uiContainer) {
    uiContainer = document.createElement('div')
    uiContainer.id = 'gpsf-container'
    // Use the 'default' policy, which should exist now.
    const trustedHtml = (window.trustedTypes && trustedTypes.default)
      ? trustedTypes.default.createHTML(uiHtml)
      : uiHtml
    uiContainer.innerHTML = trustedHtml
    document.body.appendChild(uiContainer)

    // Use a MutationObserver to robustly wait for the UI elements to be parsed
    const observer = new MutationObserver((mutations, obs) => {
      const startButtonNode = document.getElementById('gpsf-start-button')
      if (startButtonNode) {
        // Now that the button exists, get all references and add listeners
        startButton = startButtonNode
        cancelButton = document.getElementById('gpsf-cancel-button')
        progressBar = document.getElementById('gpsf-progress-bar')
        addEventListeners(document)
        loadAlbums(document)
        obs.disconnect() // Clean up the observer once done
      }
    })

    observer.observe(uiContainer, {
      childList: true,
      subtree: true
    })
  }

  uiContainer.style.display = 'block'
  const subtitleEl = document.getElementById('gpsf-subtitle')
  if (subtitleEl) {
    subtitleEl.textContent = `For account: ${email}`
  }
}

/**
 * Logs a message to the UI's log area.
 * @param {string} message - The message to log.
 * @param {Document} doc - The document object of the UI.
 * @param {'info'|'success'|'error'} [type='info'] - The type of log message.
 */
function log (message, doc, type = 'info') {
  const logArea = doc.getElementById('gpsf-log')
  if (!logArea) return
  const entry = doc.createElement('div')
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`
  if (type === 'error') entry.className = 'log-error'
  if (type === 'success') entry.className = 'log-success'
  logArea.appendChild(entry)
  logArea.scrollTop = logArea.scrollHeight
}

/**
 * Updates the feedback area in the UI with the current status.
 * @param {string} status - The status message to display.
 * @param {Document} doc - The document object of the UI.
 * @param {number} [scanned=0] - Number of items scanned.
 * @param {number} [total=0] - Total number of items to scan.
 * @param {number} [matches=0] - Number of matched items found.
 */
function updateFeedback (status, doc, scanned = 0, total = 0, matches = 0) {
  doc.getElementById('gpsf-status').textContent = `Status: ${status}`
  doc.getElementById('gpsf-stats').textContent = `Scanned: ${scanned}/${total} | Matches: ${matches}`

  if (total > 0 && scanned > 0 && scanned <= total) {
    progressBar.style.display = 'block'
    progressBar.max = total
    progressBar.value = scanned
  } else {
    progressBar.style.display = 'none'
  }
}

/**
 * Resets the UI to its initial, idle state.
 * @param {Document} doc - The document object of the UI.
 */
function resetUIState (doc) {
  startButton.disabled = false
  cancelButton.disabled = true
  const logArea = doc.getElementById('gpsf-log')
  logArea.innerHTML = ''
  updateFeedback('Idle', doc)
}

/**
 * Gets all unique media items from the user-selected source albums.
 * @param {Document} doc - The document object of the UI.
 * @returns {Promise<Array<object>|null>} A promise that resolves with an array of media items, or null if cancelled.
 */
async function getSourceMediaItems (doc) {
  const sourceCheckboxes = doc.querySelectorAll('#gpsf-source-albums input[type="checkbox"]:not(#gpsf-select-all-checkbox):checked')
  if (sourceCheckboxes.length === 0) {
    log('No source albums selected.', doc, 'error')
    return null
  }

  const allItems = []
  const itemKeys = new Set() // Use a Set to efficiently track unique items
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
 * Processes batches of media items to find matches based on the filter type.
 * @param {Array<object>} items - The media items to process.
 * @param {'any'|'saved'|'not-saved'} filterType - The type of filter to apply.
 * @param {Document} doc - The document object of the UI.
 * @param {number} batchSize - The number of items to process in each batch.
 * @returns {Promise<Array<object>|null>} A promise that resolves with an array of matched items, or null if cancelled.
 */
async function processBatches (items, filterType, doc, batchSize) {
  const matchedItems = []
  let scannedCount = 0
  const totalCount = items.length

  for (let i = 0; i < totalCount; i += batchSize) {
    if (isCancelled) return null
    const batch = items.slice(i, i + batchSize)
    updateFeedback(`Processing batch ${Math.ceil((i + 1) / batchSize)} of ${Math.ceil(totalCount / batchSize)}...`, doc, scannedCount, totalCount, matchedItems.length)

    try {
      const promises = batch.map(item => unsafeWindow.gptkApi.getItemInfo(item.mediaKey))
      const results = await Promise.all(promises)
      scannedCount += batch.length

      results.forEach(itemInfo => {
        if (!itemInfo) return // Skip if item info couldn't be fetched
        const isSaved = itemInfo.savedToYourPhotos
        if (filterType === 'any' || (filterType === 'saved' && isSaved) || (filterType === 'not-saved' && !isSaved)) {
          matchedItems.push(itemInfo)
        }
      })
    } catch (error) {
      log(`Error processing batch: ${error.message}`, doc, 'error')
      // Decide if we should continue or stop on batch error. For now, we continue.
    }
    log(`Batch processed. Scanned: ${scannedCount}/${totalCount}. Matches found: ${matchedItems.length}.`, doc)
  }
  return matchedItems
}

/**
 * Renders thumbnail images of the matched photos in the UI.
 * @param {Array<object>} items - The matched media items to render.
 * @param {Document} doc - The document object of the UI.
 */
function renderResults (items, doc) {
  const resultsContainer = doc.getElementById('gpsf-results-container')
  resultsContainer.innerHTML = ''
  if (items.length === 0) {
    resultsContainer.innerHTML = '<p>No matching photos found.</p>'
    return
  }
  items.forEach(item => {
    const img = doc.createElement('img')
    // Use a smaller thumbnail URL for performance
    img.src = `${item.url}=w100-h100-c`
    img.title = item.filename
    resultsContainer.appendChild(img)
  })
}

/**
 * Adds the matched photos to a new or existing album using the GPTK API.
 * @param {Array<object>} matchedItems - The media items to add.
 * @param {Document} doc - The document object of the UI.
 */
async function addToAlbum (matchedItems, doc) {
  const destSelect = doc.getElementById('gpsf-destination-album-select')
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
      // TODO: Refresh album lists after creation
    }

    if (!destinationAlbumId) return // Should not happen if logic is correct

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
 * Main function to start the entire process.
 * @param {Document} doc - The document object of the UI.
 */
async function startProcess (doc) {
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
    renderResults(matchedItems, doc) // Show thumbnails of what was found
    await addToAlbum(matchedItems, doc)
  } else {
    log('Processing complete. No matches found.', doc, 'info')
    updateFeedback('Complete. No matches found.', doc, mediaItems.length, mediaItems.length, 0)
  }

  isProcessing = false
  resetUIState(doc)
}

/**
 * Sets the cancellation flag and updates the UI.
 * @param {Document} doc - The document object of the UI.
 */
function cancelProcess (doc) {
  if (!isProcessing) return
  isCancelled = true
  cancelButton.disabled = true
  log('Cancellation requested. The process will stop after the current batch.', doc, 'info')
  updateFeedback('Cancelling...', doc)
}

/**
 * Adds all necessary event listeners to the UI elements.
 * @param {Document} doc - The document object of the UI.
 */
function addEventListeners (doc) {
  doc.getElementById('gpsf-start-button').addEventListener('click', () => startProcess(doc))
  doc.getElementById('gpsf-cancel-button').addEventListener('click', () => {
    cancelProcess(doc)
    hideUI()
  })
  doc.getElementById('gpsf-select-all-checkbox').addEventListener('change', (event) => {
    const checkboxes = doc.querySelectorAll('#gpsf-source-albums input[type="checkbox"]:not(#gpsf-select-all-checkbox)')
    checkboxes.forEach(checkbox => {
      checkbox.checked = event.target.checked
    })
  })
}

/**
 * Initializes and shows the UI. Assumes GPTK is ready.
 */
function initializeAndShowUI () {
  try {
    const anchor = document.querySelector('a[aria-label^="Google Account:"]')
    const label = anchor ? anchor.getAttribute('aria-label') : ''
    const match = label.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
    const email = match ? match[1] : 'Unknown Account'

    // Reset GPTK's state in case it was left running
    if (unsafeWindow.gptkCore) unsafeWindow.gptkCore.isProcessRunning = false

    showUI(email)
  } catch (error) {
    console.error(`${SCRIPT_NAME}: Initialization failed.`, error)
    alert(`${SCRIPT_NAME}: Could not initialize. ${error.message}`)
  }
}

/**
 * Main self-executing function for the userscript.
 */
(function () {
  // Polyfill unsafeWindow if it's not available
  if (typeof unsafeWindow === 'undefined') {
    window.unsafeWindow = window
  }

  setupTrustedTypesPolicy()

  // Check if we are running in a real Tampermonkey environment
  if (typeof GM_info !== 'undefined' && GM_info.scriptHandler === 'Tampermonkey') {
    GM_registerMenuCommand('Start Google Photos Saved Finder', initializeAndShowUI)
    console.log(`${SCRIPT_NAME}: Menu command registered.`)
  }

  // --- E2E Testing ---
  // Expose the initialization function for Playwright to call
  if (window.E2E_TESTING) {
    if (!window.unsafeWindow) window.unsafeWindow = window
    window.unsafeWindow.gpsf = { initializeAndShowUI }
  }
})()
