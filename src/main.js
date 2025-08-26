import UI_HTML from './ui.html'
import UI_CSS from './styles.css'

(function () {
  'use strict'

  const SCRIPT_NAME = 'Google Photos Saved Finder'
  let uiInjected = false
  let albumsLoaded = false
  let albums = []

  /**
   * Populates the album lists in the UI.
   * @param {Array} albumList - The list of albums from the GPTK API.
   */
  function populateAlbumLists (albumList) {
    const sourceList = document.getElementById('gpsf-source-albums')
    const destSelect = document.getElementById('gpsf-destination-album-select')

    // Clear existing content
    sourceList.innerHTML = ''
    // Keep the first "Choose..." option
    while (destSelect.options.length > 1) {
      destSelect.remove(1)
    }

    if (!albumList || albumList.length === 0) {
      sourceList.innerHTML = '<p>No albums found.</p>'
      return
    }

    albumList.forEach(album => {
      // Populate source albums checklist
      const checkboxId = `gpsf-album-${album.mediaKey}`
      const label = document.createElement('label')
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.id = checkboxId
      checkbox.value = album.mediaKey
      checkbox.dataset.title = album.title
      label.appendChild(checkbox)
      label.appendChild(document.createTextNode(` ${album.title} (${album.itemCount})`))
      sourceList.appendChild(label)

      // Populate destination album dropdown
      const option = document.createElement('option')
      option.value = album.mediaKey
      option.textContent = `${album.title} (${album.itemCount})`
      destSelect.appendChild(option)
    })
  }

  /**
    * Fetches all albums using the GPTK API and populates the UI.
    */
  async function loadAlbums () {
    if (albumsLoaded) return
    console.log(`${SCRIPT_NAME}: Loading albums...`)
    const sourceList = document.getElementById('gpsf-source-albums')
    sourceList.innerHTML = '<p>Loading albums...</p>'

    try {
      albums = await unsafeWindow.gptkApiUtils.getAllAlbums()
      albums.sort((a, b) => a.title.localeCompare(b.title))
      populateAlbumLists(albums)
      albumsLoaded = true
      console.log(`${SCRIPT_NAME}: ${albums.length} albums loaded.`)
    } catch (error) {
      console.error(`${SCRIPT_NAME}: Failed to load albums.`, error)
      sourceList.innerHTML = '<p class="gpsf-error">Error loading albums. Is GPTK running?</p>'
    }
  }

  /**
   * Injects the UI HTML and CSS into the page.
   * This function should only be called once.
   */
  function injectUI () {
    if (uiInjected) return

    // Inject CSS
    const style = document.createElement('style')
    style.textContent = UI_CSS
    document.head.appendChild(style)

    // Inject HTML
    const container = document.createElement('div')
    container.innerHTML = UI_HTML
    document.body.appendChild(container)

    uiInjected = true
    console.log(`${SCRIPT_NAME}: UI Injected.`)

    // Add event listeners for the UI
    addEventListeners()
  }

  /**
   * Shows the main UI modal.
   */
  function showUI () {
    if (!uiInjected) {
      injectUI()
    }
    document.getElementById('gpsf-overlay').style.display = 'block'
    document.getElementById('gpsf-modal').style.display = 'block'
    console.log(`${SCRIPT_NAME}: Showing UI.`)

    // Load albums if they haven't been loaded yet
    if (!albumsLoaded) {
      loadAlbums()
    }
  }

  /**
   * Hides the main UI modal.
   */
  function hideUI () {
    document.getElementById('gpsf-overlay').style.display = 'none'
    document.getElementById('gpsf-modal').style.display = 'none'
    console.log(`${SCRIPT_NAME}: Hiding UI.`)
  }

  /**
   * Adds event listeners to the UI elements.
   */
  let isProcessing = false
  let isCancelled = false

  /**
   * Logs a message to the UI log area.
   * @param {string} message - The message to log.
   * @param {string} type - The type of message ('error', 'success', 'info').
   */
  function log (message, type = 'info') {
    const logArea = document.getElementById('gpsf-log')
    const entry = document.createElement('div')
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`
    entry.className = `log-${type}`
    logArea.appendChild(entry)
    logArea.scrollTop = logArea.scrollHeight // Auto-scroll
  }

  /**
   * Updates the status and stats display.
   * @param {string} status - The main status message.
   * @param {number} scanned - Number of items scanned.
   * @param {number} total - Total items to scan.
   * @param {number} matches - Number of items matched.
   */
  function updateFeedback (status, scanned = 0, total = 0, matches = 0) {
    document.getElementById('gpsf-status').textContent = `Status: ${status}`
    document.getElementById('gpsf-stats').textContent = `Scanned: ${scanned}/${total} | Matches: ${matches}`
  }

  /**
   * Resets the UI to its initial state before processing.
   */
  function resetUIState () {
    document.getElementById('gpsf-start-button').disabled = false
    document.getElementById('gpsf-cancel-button').disabled = true
    const logArea = document.getElementById('gpsf-log')
    logArea.innerHTML = ''
    updateFeedback('Idle')
  }

  /**
   * Gathers all media items from the selected source albums.
   * @returns {Promise<Array>} A promise that resolves to an array of media items.
   */
  async function getSourceMediaItems () {
    const sourceCheckboxes = document.querySelectorAll('#gpsf-source-albums input[type="checkbox"]:checked')
    if (sourceCheckboxes.length === 0) {
      log('Error: No source albums selected.', 'error')
      return null
    }

    let allItems = []
    const itemKeys = new Set()

    for (const checkbox of sourceCheckboxes) {
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
      if (isCancelled) return null
    }

    return allItems
  }

  /**
   * Processes the media items in batches to find matches.
   * @param {Array} items - The array of media items to process.
   * @param {string} filterType - The filter to apply ('saved', 'not-saved', 'any').
   * @param {number} batchSize - The number of items to process in each batch.
   * @returns {Promise<Array|null>} A promise that resolves to an array of matched items, or null if cancelled.
   */
  async function processBatches (items, filterType, batchSize) {
    const matchedItems = []
    let scannedCount = 0
    const totalCount = items.length

    for (let i = 0; i < totalCount; i += batchSize) {
      if (isCancelled) return null
      const batch = items.slice(i, i + batchSize)
      updateFeedback(`Processing batch ${i / batchSize + 1} of ${Math.ceil(totalCount / batchSize)}...`, scannedCount, totalCount, matchedItems.length)

      const promises = batch.map(item => unsafeWindow.gptkApi.getItemInfo(item.mediaKey))
      const results = await Promise.all(promises)

      scannedCount += batch.length

      results.forEach(itemInfo => {
        if (!itemInfo) return
        const isSaved = itemInfo.savedToYourPhotos
        if (filterType === 'any' ||
           (filterType === 'saved' && isSaved) ||
           (filterType === 'not-saved' && !isSaved)) {
          matchedItems.push(itemInfo)
        }
      })

      updateFeedback(`Processing batch ${i / batchSize + 1} of ${Math.ceil(totalCount / batchSize)}...`, scannedCount, totalCount, matchedItems.length)
      log(`Batch processed. Scanned: ${scannedCount}/${totalCount}. Matches found: ${matchedItems.length}.`)
    }

    return matchedItems
  }

  /**
   * Adds the matched items to the destination album.
   * @param {Array} matchedItems - The array of items to add.
   */
  async function addToAlbum (matchedItems) {
    const destSelect = document.getElementById('gpsf-destination-album-select')
    const newAlbumName = document.getElementById('gpsf-destination-album-new').value.trim()
    let destinationAlbumId = destSelect.value

    if (!destinationAlbumId && !newAlbumName) {
      log('Error: No destination album selected or new album name provided.', 'error')
      return
    }

    try {
      if (newAlbumName) {
        log(`Creating new album: "${newAlbumName}"...`)
        updateFeedback('Creating new album...')
        destinationAlbumId = await unsafeWindow.gptkApi.createAlbum(newAlbumName)
        log(`Album "${newAlbumName}" created successfully with ID: ${destinationAlbumId}`, 'success')
      }

      if (!destinationAlbumId) {
        log('Error: Could not determine destination album ID.', 'error')
        return
      }

      const mediaKeys = matchedItems.map(item => item.mediaKey)
      log(`Adding ${mediaKeys.length} items to destination album...`)
      updateFeedback(`Adding ${mediaKeys.length} items to album...`)
      await unsafeWindow.gptkApiUtils.addToExistingAlbum(mediaKeys, destinationAlbumId)
      log(`${mediaKeys.length} items successfully added to the album.`, 'success')
      updateFeedback('Process Complete!', matchedItems.length, matchedItems.length, matchedItems.length)
    } catch (error) {
      log(`Error adding items to album: ${error.message}`, 'error')
      updateFeedback('Error!')
    }
  }

  /**
   * Starts the main process of finding and adding photos.
   */
  async function startProcess () {
    if (isProcessing) return
    isProcessing = true
    isCancelled = false
    resetUIState()
    document.getElementById('gpsf-start-button').disabled = true
    document.getElementById('gpsf-cancel-button').disabled = false

    log('Starting process...')
    updateFeedback('Starting...')

    const mediaItems = await getSourceMediaItems()
    if (!mediaItems || mediaItems.length === 0) {
      log('No media items to process. Stopping.', 'info')
      isProcessing = false
      resetUIState()
      return
    }
    if (isCancelled) {
      isProcessing = false
      resetUIState()
      return
    }

    const filterType = document.querySelector('input[name="filter-type"]:checked').value
    const batchSize = parseInt(document.getElementById('gpsf-batch-size').value, 10)

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

  /**
   * Sets the cancellation flag to stop the process.
   */
  function cancelProcess () {
    if (!isProcessing) return
    isCancelled = true
    document.getElementById('gpsf-cancel-button').disabled = true
    log('Cancellation requested. The process will stop after the current batch.', 'info')
    updateFeedback('Cancelling...')
  }

  /**
   * Adds event listeners to the UI elements.
   */
  function addEventListeners () {
    document.getElementById('gpsf-close-button').addEventListener('click', hideUI)
    document.getElementById('gpsf-overlay').addEventListener('click', hideUI)
    document.getElementById('gpsf-start-button').addEventListener('click', startProcess)
    document.getElementById('gpsf-cancel-button').addEventListener('click', cancelProcess)
  }

  /**
   * Initializes the script.
   */
  function initialize () {
    console.log(`${SCRIPT_NAME}: Initializing...`)

    // Check if the required GPTK API is available
    if (typeof unsafeWindow.gptkApi === 'undefined') {
      console.error(`${SCRIPT_NAME}: Google Photos Toolkit (GPTK) is not installed or enabled. This script requires GPTK to function.`)
      // Maybe show a popup to the user later.
      return
    }

    // Manually enable the GPTK core process flag as required
    if (unsafeWindow.gptkCore) {
      // This is a bit of a hack, but the prompt requires it.
      // We set it to false and let our script manage it.
      unsafeWindow.gptkCore.isProcessRunning = false
    }

    // Register the menu command to open the script's UI
    GM_registerMenuCommand('Start Google Photos Saved Finder', showUI)

    console.log(`${SCRIPT_NAME}: Initialized successfully. Ready to start from the Tampermonkey menu.`)
  }

  // Run the script
  initialize()
})()
