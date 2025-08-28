import uiHtml from './popup.html'

// State variables
let albums = []
let isProcessing = false
let isCancelled = false

// Element references
let startButton, cancelButton, progressBar, uiContainer

const SCRIPT_NAME = 'Google Photos Saved Finder'

/**
 * Creates a Trusted Types policy to allow injecting HTML.
 * This is necessary to work with Google's strict Content Security Policy.
 */
function createTrustedPolicy () {
  if (window.trustedTypes && window.trustedTypes.createPolicy) {
    window.trustedTypes.createPolicy('default', {
      createHTML: (string) => string
    })
  }
}

/**
 * Awaits the appearance of an element in the DOM.
 * @param {string} selector The CSS selector to wait for.
 * @param {Document|Element} [root=document] The root element to search within.
 * @returns {Promise<Element>} A promise that resolves with the found element.
 */
function waitForElement (selector, root = document) {
  return new Promise(resolve => {
    const el = root.querySelector(selector)
    if (el) {
      resolve(el)
      return
    }
    const observer = new MutationObserver(() => {
      const found = root.querySelector(selector)
      if (found) {
        observer.disconnect()
        resolve(found)
      }
    })
    observer.observe(root, { childList: true, subtree: true })
  })
}

/**
 * Populates the album lists in the UI.
 * @param {Array} albumList - The list of albums from the GPTK API.
 * @param {Document} doc The document to populate the lists in.
 */
export function populateAlbumLists (albumList, doc) {
  const sourceList = doc.getElementById('gpsf-source-albums')
  const destSelect = doc.getElementById('gpsf-destination-album-select')

  sourceList.innerHTML = ''
  destSelect.innerHTML = '<option value="" selected>Choose existing album...</option>'

  if (!albumList || albumList.length === 0) {
    sourceList.innerHTML = '<li>No albums found.</li>'
    return
  }

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
 * Hides the main UI.
 */
function hideUI() {
    if (uiContainer) {
        uiContainer.style.display = 'none';
    }
}

/**
 * Shows the main UI.
 * @param {string} email The user's email address.
 */
export function showUI (email) {
    if (!uiContainer) {
        uiContainer = document.createElement('div');
        uiContainer.id = 'gpsf-container';
        uiContainer.innerHTML = uiHtml;
        document.body.appendChild(uiContainer);

        // Get element references
        startButton = document.getElementById('gpsf-start-button');
        cancelButton = document.getElementById('gpsf-cancel-button');
        progressBar = document.getElementById('gpsf-progress-bar');

        // Add event listeners and load initial data
        addEventListeners(document);
        loadAlbums(document);
    }

    uiContainer.style.display = 'block';
    const subtitleEl = document.getElementById('gpsf-subtitle');
    if (subtitleEl) {
        subtitleEl.textContent = `For account: ${email}`;
    }
}

/**
 * Logs a message to the log area in the UI.
 * @param {string} message The message to log.
 * @param {Document} doc The document to log to.
 */
function log (message, doc, type = 'info') {
  const logArea = doc.getElementById('gpsf-log')
  if (!logArea) return
  const entry = doc.createElement('div')
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`
  if (type === 'error') entry.style.color = '#d93025'
  if (type === 'success') entry.style.color = '#1e8e3e'
  logArea.appendChild(entry)
  logArea.scrollTop = logArea.scrollHeight
}

/**
 * Updates the feedback area in the UI.
 * @param {string} status The status message to display.
 * @param {Document} doc The document to update.
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
 * Resets the UI to its initial state.
 * @param {Document} doc The document to reset.
 */
function resetUIState (doc) {
  startButton.disabled = false
  cancelButton.disabled = true
  const logArea = doc.getElementById('gpsf-log')
  logArea.innerHTML = ''
  updateFeedback('Idle', doc)
}

/**
 * Gets all media items from the selected source albums.
 * @param {Document} doc The document to get the selected albums from.
 */
async function getSourceMediaItems (doc) {
  const sourceCheckboxes = doc.querySelectorAll('#gpsf-source-albums input[type="checkbox"]:not(#gpsf-select-all-checkbox):checked')
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
  items.forEach(item => {
    const img = doc.createElement('img')
    img.src = item.url
    img.title = item.filename
    resultsContainer.appendChild(img)
  })
}

/**
 * Adds the matched photos to a new or existing album.
 * @param {Array} matchedItems The media items to add to the album.
 * @param {Document} doc The document to get the destination album from.
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
  doc.getElementById('gpsf-cancel-button').addEventListener('click', () => {
      cancelProcess(doc);
      hideUI();
  })
  doc.getElementById('gpsf-select-all-checkbox').addEventListener('change', (event) => {
    const checkboxes = doc.querySelectorAll('#gpsf-source-albums input[type="checkbox"]:not(#gpsf-select-all-checkbox)')
    checkboxes.forEach(checkbox => {
      checkbox.checked = event.target.checked
    })
  })
}

// Self-executing anonymous function for the final userscript
(async function () {
  if (typeof unsafeWindow === 'undefined') {
    window.unsafeWindow = window
  }

  // Create a Trusted Types policy to allow injecting our UI HTML.
  createTrustedPolicy()

  if (typeof GM_info !== 'undefined' && GM_info.scriptHandler === 'Tampermonkey') {
    // In the live userscript, wait for GPTK and the user account to be ready.
    try {
      await waitForElement('#gptk-button')
      const anchor = await waitForElement('a[aria-label^="Google Account:"]')
      const label = anchor.getAttribute('aria-label') || ''
      const match = label.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
      const email = match ? match[1] : 'Unknown Account'

      if (unsafeWindow.gptkCore) unsafeWindow.gptkCore.isProcessRunning = false
      GM_registerMenuCommand('Start Google Photos Saved Finder', () => showUI(email))
    } catch (error) {
      console.error(`${SCRIPT_NAME}: Failed to initialize.`, error)
      alert(`${SCRIPT_NAME}: Could not initialize. Is Google Photos Toolkit (GPTK) installed and active?`)
    }
  } else if (window.E2E_TESTING) {
    // In the E2E test environment, just run the UI directly.
    showUI('test@example.com')
  }
})()
