// ==UserScript==
// @name        Google Photos Toolkit
// @description Bulk organize your media
// @version     2.10.0
// @author      xob0t
// @homepageURL https://github.com/xob0t/Google-Photos-Toolkit#readme
// @supportURL  https://github.com/xob0t/Google-Photos-Toolkit/discussions
// @match       *://photos.google.com/*
// @license     MIT
// @namespace   https://github.com/xob0t/Google-Photos-Toolkit
// @icon        https://raw.githubusercontent.com/xob0t/Google-Photos-Toolkit/main/media/icon.png
// @downloadURL https://github.com/xob0t/Google-Photos-Toolkit/releases/latest/download/google_photos_toolkit.user.js
// @run-at      body
// @grant       GM_registerMenuCommand
// @grant       unsafeWindow
// @noframes
// @match *://127.0.0.1/*
// ==/UserScript==
(function () {
  'use strict';

  var gptkMainTemplate = (`
<div class="overlay"></div>
<div id="gptk" class="container">
  <div class="header">
    <div class="header-info">
      <div class="header-text">Google Photos Toolkit</div>
    </div>

    <div id="hide">
      <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
        <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
      </svg>
    </div>
  </div>
  <hr>
  <div class="sources">
    <div class="source">
      <input type="radio" name="source" id="library" class="sourceHeaderInput" checked="checked">
      <label class="sourceHeader" for="library">
        <svg width="24px" height="24px">
          <path
            d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5-7l-3 3.72L9 13l-3 4h12l-4-5z">
          </path>
        </svg>Library</label>
    </div>
    <div class="source">
      <input type="radio" name="source" id="search" class="sourceHeaderInput">
      <label class="sourceHeader" for="search">
        <svg width="24px" height="24px" viewBox="0 0 24 24">
          <path
            d="M20.49 19l-5.73-5.73C15.53 12.2 16 10.91 16 9.5A6.5 6.5 0 1 0 9.5 16c1.41 0 2.7-.47 3.77-1.24L19 20.49 20.49 19zM5 9.5C5 7.01 7.01 5 9.5 5S14 7.01 14 9.5 11.99 14 9.5 14 5 11.99 5 9.5z">
          </path>
        </svg>Search</label>
    </div>
    <div class="source">
      <input type="radio" name="source" id="albums" class="sourceHeaderInput">
      <label class="sourceHeader" for="albums">
        <svg width="24px" height="24px">
          <path
            d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H6V4h6v7l2.5-1.88L17 11V4h1v16zm-4.33-6L17 18H7l2.5-3.2 1.67 2.18 2.5-2.98z">
          </path>
        </svg>Albums</label>
    </div>
    <div class="source">
      <input type="radio" name="source" id="sharedLinks" class="sourceHeaderInput">
      <label class="sourceHeader" for="sharedLinks">
        <svg width="24px" height="24px">
          <path
            d="M17 7h-4v2h4c1.65 0 3 1.35 3 3s-1.35 3-3 3h-4v2h4c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-6 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-2zm-3-4h8v2H8z">
          </path>
        </svg>Shared Links</label>
    </div>
    <div class="source">
      <input type="radio" name="source" id="favorites" class="sourceHeaderInput">
      <label class="sourceHeader" for="favorites">
        <svg width="24px" height="24px">
          <path
            d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z">
          </path>
        </svg>Favorites</label>
    </div>
    <div class="source">
      <input type="radio" name="source" id="trash" class="sourceHeaderInput">
      <label class="sourceHeader" for="trash">
        <svg width="24px" height="24px">
          <path
            d="M15 4V3H9v1H4v2h1v13c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6h1V4h-5zm2 15H7V6h10v13zM9 8h2v9H9zm4 0h2v9h-2z">
          </path>
        </svg>Trash</label>
    </div>
    <div class="source">
      <input type="radio" name="source" id="lockedFolder" class="sourceHeaderInput">
      <label class="sourceHeader" for="lockedFolder">
        <svg width="24px" height="24px">
          <path
            d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z">
          </path>
        </svg>Locked Folder</label>
    </div>

  </div>
  <hr>
  <div class="action-bar">
    <div class="action-buttons">
      <button id="showExistingAlbumForm" title="Add To Existing Album">Add To Existing Album</button>
      <button id="showNewAlbumForm" title="Add To New Album">Add To New Album</button>
      <button type="button" id="toTrash" title="Move To Trash">Move to Trash</button>
      <button type="button" id="restoreTrash" title="Restore From Trash">Restore From Trash</button>
      <button type="button" id="toArchive" title="Move ToArchive">Archive</button>
      <button type="button" id="unArchive" title="Remove From Archive">Un-Archive</button>
      <button type="button" id="toFavorite" title="Set Favorite">Favorite</button>
      <button type="button" id="unFavorite" title="Removed From Favorites">Un-Favorite</button>
      <button type="button" id="lock" title="Move to Locked Folder">Move to Locked Folder</button>
      <button type="button" id="unLock" title="Move out of Locked Folder">Move out of Locked Folder</button>
      <button
        type="button"
        id="copyDescFromOther"
        title="Copies captions embedded in the photos themselves (i.e. EXIF data) to the photo description, if the description is currently empty. Such captions otherwise only show up in the Info tab as 'Other'"
      >
        Copy Description from 'Other'
      </button>
    </div>

    <div class="to-existing-container">
      <form id="toExistingAlbum" class="flex" title="Add To Existing Album">
        <div class="refresh-albums svg-container" title="Refresh Albums">
          <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
            <path
              d="M482-160q-134 0-228-93t-94-227v-7l-64 64-56-56 160-160 160 160-56 56-64-64v7q0 100 70.5 170T482-240q26 0 51-6t49-18l60 60q-38 22-78 33t-82 11Zm278-161L600-481l56-56 64 64v-7q0-100-70.5-170T478-720q-26 0-51 6t-49 18l-60-60q38-22 78-33t82-11q134 0 228 93t94 227v7l64-64 56 56-160 160Z" />
          </svg>
        </div>
        <select id="existingAlbum" class="dropdown albums-select" name="targetAlbumMediaKeyExisting" required>
          <option value="">Press Refresh</option>
        </select>
        <button type="submit" title="Add To Existing Album">Submit</button>
      </form>
      <button class="return" title="Back to Actions">
        Return
      </button>
    </div>
    <div class="to-new-container">
      <form id="toNewAlbum" class="flex" title="Add To A New Album">
        <input id="newAlbumName" type="text" placeholder="Enter Album Name" required>
        <button type="submit" title="Add To A New Album">Submit</button>
      </form>
      <button class="return" title="Back to Actions">
        Return
      </button>
    </div>
  </div>
  <hr>
  <div class="window-body">
    <div class="sidebar scroll">
      <form class="filters-form">
        <div class="sidebar-top">
          <div class="flex centered" title="Reset all filters" id="filterResetButton">
            <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
              <path
                d="M440-122q-121-15-200.5-105.5T160-440q0-66 26-126.5T260-672l57 57q-38 34-57.5 79T240-440q0 88 56 155.5T440-202v80Zm80 0v-80q87-16 143.5-83T720-440q0-100-70-170t-170-70h-3l44 44-56 56-140-140 140-140 56 56-44 44h3q134 0 227 93t93 227q0 121-79.5 211.5T520-122Z" />
            </svg>
            Reset Filters
          </div>
        </div>
        <details open class="include-albums">
          <summary>Select Albums</summary>
          <fieldset>
            <select size="5" multiple="multiple" class="select-multiple albums-select scroll" name="albumsInclude" required>
              <option value="" title="First Album">Press Refresh</option>
            </select>
            <div class="select-control-buttons-row">
              <div class="refresh-albums svg-container" title="Refresh Albums">
                <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
                  <path
                    d="M482-160q-134 0-228-93t-94-227v-7l-64 64-56-56 160-160 160 160-56 56-64-64v7q0 100 70.5 170T482-240q26 0 51-6t49-18l60 60q-38 22-78 33t-82 11Zm278-161L600-481l56-56 64 64v-7q0-100-70.5-170T478-720q-26 0-51 6t-49 18l-60-60q38-22 78-33t82-11q134 0 228 93t94 227v7l64-64 56 56-160 160Z">
                  </path>
                </svg>
              </div>
              <button type="button" name="selectAll">Select All</button>
              <button type="button" name="resetAlbumSelection">Reset Selection</button>
            </div>
            <div class="select-control-buttons-row">
              <button type="button" name="selectShared">Select Shared</button>
              <button type="button" name="selectNonShared">Select Non-Shared</button>
            </div>
          </fieldset>
        </details>
        <details open class="search">
          <summary>Search</summary>
          <fieldset>
            <label class="form-control">
              <legend>Search Query:</legend>
              <input name="searchQuery" value="" type="input" placeholder="Search Query" required>
            </label>
          </fieldset>
        </details>
        <details class="exclude-albums">
          <summary>Exclude Albums</summary>
          <fieldset>
            <select size="5" multiple="multiple" class="select-multiple albums-select scroll" name="albumsExclude">
              <option value="" title="First Album">Press Refresh</option>
            </select>
            <div class="select-control-buttons-row">
              <div class="refresh-albums svg-container" title="Refresh Albums">
                <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24">
                  <path
                    d="M482-160q-134 0-228-93t-94-227v-7l-64 64-56-56 160-160 160 160-56 56-64-64v7q0 100 70.5 170T482-240q26 0 51-6t49-18l60 60q-38 22-78 33t-82 11Zm278-161L600-481l56-56 64 64v-7q0-100-70.5-170T478-720q-26 0-51 6t-49 18l-60-60q38-22 78-33t82-11q134 0 228 93t94 227v7l64-64 56 56-160 160Z">
                  </path>
                </svg>
              </div>
              <button type="button" name="selectAll">Select All</button>
              <button type="button" name="resetAlbumSelection">Reset Selection</button>
            </div>
            <div class="select-control-buttons-row">
              <button type="button" name="selectShared">Select Shared</button>
              <button type="button" name="selectNonShared">Select Non-Shared</button>
            </div>
          </fieldset>
        </details>
        <details class="date-interval">
          <summary>Date Interval</summary>
          <fieldset>
            <legend>From:</legend>
            <div class="flex centered input-wrapper">
              <input type="datetime-local" name="lowerBoundaryDate">
              <div class="date-reset flex centered" title="Reset Input" name="dateReset">
                <!-- https://www.svgrepo.com/svg/436706/clear-fill -->
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56">
                  <path
                    d="M 13.7851 49.5742 L 42.2382 49.5742 C 47.1366 49.5742 49.5743 47.1367 49.5743 42.3086 L 49.5743 13.6914 C 49.5743 8.8633 47.1366 6.4258 42.2382 6.4258 L 13.7851 6.4258 C 8.9101 6.4258 6.4257 8.8398 6.4257 13.6914 L 6.4257 42.3086 C 6.4257 47.1602 8.9101 49.5742 13.7851 49.5742 Z M 19.6913 38.3711 C 18.5429 38.3711 17.5820 37.4336 17.5820 36.2852 C 17.5820 35.7461 17.8163 35.2305 18.2382 34.8086 L 25.0351 27.9649 L 18.2382 21.1445 C 17.8163 20.7227 17.5820 20.2071 17.5820 19.6680 C 17.5820 18.4961 18.5429 17.5352 19.6913 17.5352 C 20.2539 17.5352 20.7460 17.7461 21.1679 18.1680 L 28.0117 25.0118 L 34.8554 18.1680 C 35.2539 17.7461 35.7695 17.5352 36.3085 17.5352 C 37.4804 17.5352 38.4413 18.4961 38.4413 19.6680 C 38.4413 20.2071 38.2070 20.7227 37.7851 21.1445 L 30.9648 27.9649 L 37.7851 34.8086 C 38.2070 35.2305 38.4413 35.7461 38.4413 36.2852 C 38.4413 37.4336 37.4804 38.3711 36.3085 38.3711 C 35.7695 38.3711 35.2539 38.1602 34.8788 37.7852 L 28.0117 30.8945 L 21.1444 37.7852 C 20.7460 38.1602 20.2773 38.3711 19.6913 38.3711 Z" />
                </svg>
              </div>
            </div>
            <legend>To:</legend>
            <div class="flex centered input-wrapper">
              <input type="datetime-local" name="higherBoundaryDate">
              <div class="date-reset flex centered" title="Reset Input" name="dateReset">
                <!-- https://www.svgrepo.com/svg/436706/clear-fill -->
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56">
                  <path
                    d="M 13.7851 49.5742 L 42.2382 49.5742 C 47.1366 49.5742 49.5743 47.1367 49.5743 42.3086 L 49.5743 13.6914 C 49.5743 8.8633 47.1366 6.4258 42.2382 6.4258 L 13.7851 6.4258 C 8.9101 6.4258 6.4257 8.8398 6.4257 13.6914 L 6.4257 42.3086 C 6.4257 47.1602 8.9101 49.5742 13.7851 49.5742 Z M 19.6913 38.3711 C 18.5429 38.3711 17.5820 37.4336 17.5820 36.2852 C 17.5820 35.7461 17.8163 35.2305 18.2382 34.8086 L 25.0351 27.9649 L 18.2382 21.1445 C 17.8163 20.7227 17.5820 20.2071 17.5820 19.6680 C 17.5820 18.4961 18.5429 17.5352 19.6913 17.5352 C 20.2539 17.5352 20.7460 17.7461 21.1679 18.1680 L 28.0117 25.0118 L 34.8554 18.1680 C 35.2539 17.7461 35.7695 17.5352 36.3085 17.5352 C 37.4804 17.5352 38.4413 18.4961 38.4413 19.6680 C 38.4413 20.2071 38.2070 20.7227 37.7851 21.1445 L 30.9648 27.9649 L 37.7851 34.8086 C 38.2070 35.2305 38.4413 35.7461 38.4413 36.2852 C 38.4413 37.4336 37.4804 38.3711 36.3085 38.3711 C 35.7695 38.3711 35.2539 38.1602 34.8788 37.7852 L 28.0117 30.8945 L 21.1444 37.7852 C 20.7460 38.1602 20.2773 38.3711 19.6913 38.3711 Z" />
                </svg>
              </div>
            </div>
            <hr>
            <div class="form-control">
              <label class="form-control">
                <input name="intervalType" type="radio" value="include" checked="checked">
                <span>Include Interval</span>
              </label>
              <label class="form-control">
                <input name="intervalType" type="radio" value="exclude">
                <span>Exclude Interval</span>
              </label>
            </div>
            <hr>
            <div class="form-control">
              <label class="form-control">
                <input name="dateType" type="radio" value="taken" checked="checked">
                <span>Date Taken</span>
              </label>
              <label class="form-control">
                <input name="dateType" type="radio" value="uploaded">
                <span>Date Uploaded</span>
              </label>
            </div>
          </fieldset>
        </details>
        <details class="filename">
          <summary>Filename</summary>
          <fieldset>
            <label class="form-control">
              <legend>Regex:</legend>
              <input name="fileNameRegex" value="" type="input" placeholder="Regex">
            </label>
            <label class="form-control">
              <input name="fileNameMatchType" value="include" type="radio" checked="checked">
              Include</label>
            <label class="form-control">
              <input name="fileNameMatchType" value="exclude" type="radio">
              Exclude
            </label>
          </fieldset>
        </details>
        <details class="description">
          <summary>Description</summary>
          <fieldset>
            <label class="form-control">
              <legend>Regex:</legend>
              <input name="descriptionRegex" value="" type="input" placeholder="Regex">
            </label>
            <label class="form-control">
              <input name="descriptionMatchType" value="include" type="radio" checked="checked">
              Include</label>
            <label class="form-control">
              <input name="descriptionMatchType" value="exclude" type="radio">
              Exclude
            </label>
          </fieldset>
        </details>
        <details class="space">
          <summary>Space</summary>
          <fieldset>
            <label class="form-control">
              <input name="space" value="" type="radio" checked="checked">
              Any </label>
            <label class="form-control">
              <input name="space" value="consuming" type="radio">
              Space-Consuming </label>
            <label class="form-control">
              <input name="space" value="non-consuming" type="radio">
              Not Space-Consuming
            </label>
          </fieldset>
        </details>
        <details class="similarity">
          <summary>Similarity</summary>
          <fieldset>
            <label class="warning">Experimental!</label>
          </fieldset>
          <fieldset>
            <legend>Threshold</legend>
            <div class="input-wrapper">
              <input name="similarityThreshold" type="number" placeholder="0.95" step="0.01" max="1" min="0">
            </div>
            <legend>Image height (advanced)</legend>
            <div class="input-wrapper">
              <input name="imageHeight" type="number" placeholder="Pixels" value="16">
            </div>
          </fieldset>
        </details>
        <details class="size">
          <summary>Size</summary>
          <fieldset>
            <legend>More Than</legend>
            <div class="input-wrapper">
              <input name="lowerBoundarySize" type="number" placeholder="Bytes">
            </div>
            <legend>Less Than</legend>
            <div class="input-wrapper">
              <input name="higherBoundarySize" type="number" placeholder="Bytes">
            </div>
          </fieldset>
        </details>
        <details class="quality">
          <summary>Quality</summary>
          <fieldset>
            <label class="form-control">
              <input name="quality" value="" type="radio" checked="checked">
              Any </label>
            <label class="form-control">
              <input name="quality" value="original" type="radio">
              Original </label>
            <label class="form-control">
              <input name="quality" value="storage-saver" type="radio">
              Storage Saver
            </label>
          </fieldset>
        </details>
        <details class="type">
          <summary>Type</summary>
          <fieldset>
            <label class="form-control">
              <input name="type" value="" type="radio" checked="checked">
              Any </label>
            <label class="form-control">
              <input name="type" value="image" type="radio">
              Image </label>
            <label class="form-control">
              <input name="type" value="video" type="radio">
              Video
            </label>
            <label class="form-control">
              <input name="type" value="live" type="radio">
              Live Photo
            </label>
          </fieldset>
        </details>
        <details class="upload-status">
          <summary>Upload Status</summary>
          <fieldset>
            <label class="form-control">
              <input name="uploadStatus" value="" type="radio" checked="checked">
              Any
            </label>
            <label class="form-control">
              <input name="uploadStatus" value="full" type="radio">
              Fully Uploaded
            </label>
            <label class="form-control">
              <input name="uploadStatus" value="partial" type="radio">
              Partially Uploaded
            </label>
          </fieldset>
        </details>
        <details class="archive">
          <summary>Archived</summary>
          <fieldset>
            <label class="form-control">
              <input name="archived" value="" type="radio" checked="checked">
              Any
            </label>
            <label class="form-control">
              <input name="archived" value="true" type="radio">
              Archived
            </label>
            <label class="form-control">
              <input name="archived" value="false" type="radio">
              Not Archived
            </label>
          </fieldset>
        </details>
        <details class="owned">
          <summary>Ownership</summary>
          <fieldset>
          <label class="form-control">
            <input name="owned" value="" type="radio" checked="checked">
            Any
          </label>
          <label class="form-control">
            <input name="owned" value="true" type="radio">
            Owned
          </label>
          <label class="form-control">
            <input name="owned" value="false" type="radio">
            Not Owned
          </label>
          </fieldset>
        </details>
        <details class="favorite">
          <summary>Favorite</summary>
          <fieldset>
          <label class="form-control">
            <input name="favorite" value="" type="radio" checked="checked">
            Any
          </label>
          <label class="form-control">
            <input name="favorite" value="true" type="radio">
            Favorite
          </label>
          <label class="form-control">
            <input name="favorite" value="false" type="radio">
            Not Favorite
          </label>
          </fieldset>
        </details>
        <hr>
        <fieldset class="exclude-shared">
          <label class="form-control">
            <input name="excludeShared" value="true" type="checkbox">
            Exclude Media With Shared Links
          </label>
        </fieldset>
        <fieldset class="exclude-favorites">
          <label class="form-control">
            <input name="excludeFavorites" value="true" type="checkbox">
            Exclude Favorites
          </label>
        </fieldset>
        <fieldset class="sort-by-size">
          <label class="form-control">
            <input name="sortBySize" value="true" type="checkbox">
            Sort by size
          </label>
        </fieldset>
      </form>
      <form class="settings-form">
        <details class="settings">
          <summary>Advanced Settings</summary>
          <fieldset>
            <legend>Max Concurrent Single Api Requests</legend>
            <div class="input-wrapper">
              <input name="maxConcurrentSingleApiReq" value="30" min="1" type="number" required>
            </div>
            <legend>Max Concurrent Batch Api Requests</legend>
            <div class="input-wrapper">
              <input name="maxConcurrentBatchApiReq" value="3" min="1" type="number" required>
            </div>
            <legend>Api Operation Batch Size</legend>
            <div class="input-wrapper">
              <input name="operationSize" value="500" max="500" min="1" type="number" required>
            </div>
            <legend>Locked Folder Api Operation Size</legend>
            <div class="input-wrapper">
              <input name="lockedFolderOpSize" value="100" max="100" min="1" type="number" required>
            </div>
            <legend>Bulk Info Api Batch Size</legend>
            <div class="input-wrapper">
              <input name="infoSize" value="5000" max="10000" min="1" type="number" required>
            </div>
            <div class="settings-controls">
              <button name="save" type="submit">Save</button>
              <button name="default">Default</button>
            </div>
          </fieldset>
        </details>
      </form>
    </div>

    <div class="main">
      <div class="filter-preview" title="Filter Preview">
        <span>
          Filter: None
        </span>
      </div>
      <div class="button-container">
        <button id="stopProcess">Stop</button>
        <button id="clearLog">Clear Log</button>
      </div>
      <div id="logArea" class="logarea scroll"></div>
    </div>
  </div>
  <div class="footer">
    <div class="info-container">
      <a class="homepage-link" href="%homepage%" target="_blank">%version%</a>
    </div>
    <div class="auto-scroll-container">
      <input type="checkbox" id="autoScroll" checked="checked">
      <label for="autoScroll"> AUTO SCROLL</label>
    </div>
  </div>
</div>

`);

  var buttonHtml = (`
<div
  id="gptk-button"
  role="button"
  class="U26fgb JRtysb WzwrXb YI2CVc G6iPcb"
  aria-label="GPTK"
  aria-disabled="false"
  tabindex="0"
  data-tooltip="GPTK"
  aria-haspopup="true"
  aria-expanded="false"
  data-dynamic="true"
  data-alignright="true"
  data-aligntop="true"
  data-tooltip-vertical-offset="-12"
  data-tooltip-horizontal-offset="0"
>
  <div class="NWlf3e MbhUzd" jsname="ksKsZd"></div>
  <span jsslot="" class="MhXXcc oJeWuf"
    ><span class="Lw7GHd snByac">
      <svg width="24px" height="24px" viewBox="0 0 17 17" style="fill: #008eff">
        <g xmlns="http://www.w3.org/2000/svg" stroke-width="1">
          <path
            d="M6.838,11.784 L12.744,5.879 C13.916,6.484 15.311,6.372 16.207,5.477 C16.897,4.786 17.131,3.795 16.923,2.839 L15.401,4.358 L14.045,4.624 L12.404,2.999 L12.686,1.603 L14.195,0.113 C13.24,-0.095 12.248,0.136 11.557,0.827 C10.661,1.723 10.549,3.117 11.155,4.291 L5.249,10.197 C4.076,9.592 2.681,9.705 1.784,10.599 C1.096,11.29 0.862,12.281 1.069,13.236 L2.592,11.717 L3.947,11.452 L5.59,13.077 L5.306,14.473 L3.797,15.963 C4.752,16.17 5.744,15.94 6.434,15.249 C7.33,14.354 7.443,12.958 6.838,11.784 L6.838,11.784 Z"
          ></path>
        </g>
      </svg>
      <div class="oK50pe eLNT1d" aria-hidden="true" jsname="JjzL4d"></div></span
  ></span>
</div>

`);

  var css = (`
:root {    --color-accent: #0d4574; --color-accent-dark: #202833; --primary-bg-color: #161616; --secondary-bg-color: #1b1b1b; --color-surface-200: #282828; --color-surface-300: #3f3f3f; --color-surface-400: #575757; --color-surface-500: #717171; --color-surface-600: #8b8b8b; --main-text-color: #d3d3d3; --main-text-color-hover: #e2e2e2; --secondary-text-color: #9c9c9c; --footer-color: #323232; --filter-preview-color: #0b0b0c; --warning: #E27070; --exit-button-background:darkred; --success: #53E678; --overlay-filter: blur(4px) brightness(0.5); }.overlay {    position: absolute; display: none; left: 0; top: 0; width: 100%; height: 100%; z-index: 499; backdrop-filter: var(--overlay-filter); }@media only screen and (min-width: 700px) {    .window-body {        display: grid; grid-template-columns: minmax(100px, 320px) minmax(100px, 3fr); }    #gptk .sources .sourceHeader {        font-size: 1.2rem; }}@media only screen and (max-width: 700px) {    .window-body {        display: flex; flex-direction: column-reverse; }    #gptk{        top: 0%!important; bottom: 0%!important; width: 100%!important; .main{            height: auto!important; max-height: 100%!important; }    }}#gptk {    position: fixed; top: 5%; left: 50%; transform: translateX(-50%); width: 90%; bottom: 5%; min-height: 300px; max-width: 1250px; min-width: 300px; z-index: 500; font-family: Helvetica, sans-serif; padding: 0; display: none; flex-direction: column; cursor: default; border-radius: 5px; color-scheme: dark; background-color: var(--primary-bg-color); color: var(--main-text-color); border: none; box-shadow: 0px 10px 10px rgba(0, 0, 0, 0.438); box-sizing: border-box; * {        box-sizing: border-box; }    .flex {        display: flex; }    .centered {        align-items: center; }    .grid {        display: grid; }    .columns {        gap: 1px; margin-bottom: 1px; grid-auto-flow: column; }    .refresh-albums {        cursor: pointer; fill: var(--main-text-color); background-color: var(--color-surface-200); }    .refresh-albums:hover {        fill: var(--main-text-color-hover); background-color: var(--color-surface-300); }    .dateForm {        grid-template-columns: 3em 60% 1em; }    .svg-container {        display: flex; justify-content: center; }    button {        background-color: var(--color-surface-200); color: var(--main-text-color); cursor: pointer; border: none; align-items: center; display: flex; padding: 0; border-radius: 0; height: 24px; padding-left: 5px; padding-right: 5px; transition: background ease 0.2s; }    button:disabled {        background-color: var(--primary-bg-color); cursor: not-allowed; color: var(--color-surface-500); }    button:disabled:hover {        background-color: var(--color-surface-100); }    button:hover {        background-color: var(--color-surface-300); }    legend,    label,    button {        font-size: 12px; line-height: 16px; font-weight: 500; text-transform: uppercase; }    option.shared {        background-color: var(--color-accent-dark); }    option:checked {        background-color: #007bff; /* A distinct blue */        color: white; font-weight: bold; }    hr {        border: none; margin: 0px; width: 100%; border-bottom: 1px solid var(--color-surface-300); }    .header {        border-top-right-radius: 5px; border-top-left-radius: 5px; padding: 5px 10px 5px 10px; align-items: center; width: 100%; display: grid; grid-template-columns: 1fr 1em; .header-info {            align-items: center; display: flex; }        .header-text {            font-family: Consolas, Liberation Mono, Menlo, Courier, monospace; font-size: 1.3rem; font-weight: 500; }    }    #hide {        cursor: pointer; fill: var(--color-surface-300); }    #hide:hover {        fill: var(--main-text-color-hover); }    .sources {        gap: 2px; display: flex; flex-wrap: wrap; background-color: var(--primary-bg-color); border-bottom: 2px var(--color-surface-500); border-top: 2px var(--color-surface-500); user-select: none; .sourceHeader {            display: flex; align-items: center; fill: var(--color-surface-500); cursor: pointer; font-weight: bold; transition: background ease 0.2s; svg {                margin-right: 3px; }        }        .source input {            display: none; }        input:disabled+.sourceHeader {            cursor: not-allowed; color: var(--footer-color); fill: var(--footer-color); }        input+.sourceHeader {            padding: 5px; }        input:not(:disabled)+.sourceHeader:hover {            fill: var(--main-text-color-hover); }        .source input:checked+.sourceHeader {            background-color: var(--color-accent); fill: var(--main-text-color); }    }    .window-body {        height: 100%; min-height: 0; }    .sidebar {        height: 100%; position: relative; display: grid; grid-template-rows: auto 1fr auto; grid-auto-flow: row; background-color: var(--secondary-bg-color); overflow: hidden scroll; overflow-y: auto; max-height: 100%; padding-left: 8px; form {            width: 100%; }        .filters-form {            grid-row: 1; }        .settings-form {            grid-row: 3; margin-bottom: 5px; summary {                color: var(--color-surface-400); }        }        summary {            font-size: 16px; font-weight: 500; line-height: 20px; position: relative; overflow: hidden; margin-bottom: 2px; padding: 6px 10px; cursor: pointer; white-space: nowrap; text-overflow: ellipsis; border-radius: 4px; flex-shrink: 0; }        summary:hover::marker {            color: var(--main-text-color-hover); }        summary::marker {            color: var(--color-surface-400); }        fieldset {            /* display: flex; */            /* (causes inconsistent rendering of the album selection fieldsets) */            flex-direction: column; margin: 0 20px; padding-left: 20px; padding: 0; border: 0; font-weight: inherit; font-style: inherit; font-family: inherit; font-size: 100%; vertical-align: baseline; }        legend,        label {            display: block; width: 100%; margin-bottom: 8px; }        legend {            margin-bottom: 3px; }        select {            width: 100%; box-sizing: border-box; }        .select-control-buttons-row {            display: grid; height: 24px; gap: 3px; box-sizing: border-box; margin-top: 3px; grid-template-columns: repeat(3, max-content)        }        .input-wrapper {            margin-left: 2px; margin-bottom: 8px; }        .sidebar-top {            display: flex; align-items: center; gap: 5px; }        #filterResetButton {            margin: 5px; width: 100%; fill: var(--color-surface-400); color: var(--color-surface-400); cursor: pointer; }        #filterResetButton:hover {            fill: var(--color-surface-600); color: var(--color-surface-600); }        .form-control {            cursor: pointer; }        .date-reset {            cursor: pointer; fill: var(--color-surface-400); stroke-width: 0; stroke-linejoin: round; stroke-linecap: round; height: 30px; width: 30px; stroke: var(--primary-bg-color); transition: stroke-width 1s cubic-bezier(0, 2.5, 0.30, 2.5); margin-left: 5px; }        .date-reset.clicked {            stroke-width: 2; }        .warning{            color: var(--warning); }        .date-reset:hover {            fill: var(--color-surface-600); }        .settings-controls {            flex-wrap: wrap; display: flex; gap: 2px; padding: 2px 2px; }    }    .action-bar {        display: flex; background-color: var(--secondary-bg-color); user-select: none; .action-buttons,        .to-existing-container,        .to-new-container {            flex-wrap: wrap; gap: 2px; padding: 2px 2px; }        .action-buttons{            display: flex; }        .to-existing-container,        .to-new-container {            display: none; }        select {            width: 100%; max-width: 400px; box-sizing: border-box; }        button.running {            background-color: var(--accent-color); }        svg {            fill: var(--color-surface-600); }    }    .main {        height: 100%; overflow: auto; display: grid; grid-auto-flow: row; grid-template-rows: max-content max-content auto; max-width: 100%; .filter-preview {            background-color: var(--filter-preview-color); padding-left: 20px; span {                text-wrap: pretty; }        }        #logArea {            height: 100%; font-family: Consolas, Liberation Mono, Menlo, Courier, monospace; font-size: 0.9rem; overflow: auto; padding: 10px; user-select: text; cursor: auto; .error {                color: var(--warning); }            .success {                color: var(--success); }        }        .button-container{            background-color: var(--color-surface-100); display: flex; gap: 2px; padding: 2px 2px; #stopProcess{                display: none; background-color: var(--exit-button-background); }        }    }    .footer {        width: 100%; padding: 5px; height: 35px; background-color: var(--color-surface-200); border-bottom-right-radius: 5px; border-bottom-left-radius: 5px; display: grid; align-items: center; grid-template-columns: 1fr 1fr; .auto-scroll-container {            display: grid; align-items: center; grid-template-columns: max-content max-content; justify-content: end; }        .info-container,        .info-container a {            font-family: Consolas, Liberation Mono, Menlo, Courier, monospace; color: var(--color-surface-500); margin-left: 10px; }    }    /* Scrollbar */    .scroll::-webkit-scrollbar {        width: 8px; height: 8px; }    .scroll::-webkit-scrollbar-corner {        background-color: transparent; }    .scroll::-webkit-scrollbar-thumb {        background-clip: padding-box; border: 2px solid transparent; border-radius: 4px; background-color: var(--color-surface-600); min-height: 40px; }    /* fade scrollbar */    .scroll::-webkit-scrollbar-thumb,    .scroll::-webkit-scrollbar-track {        visibility: hidden; }    .scroll:hover::-webkit-scrollbar-thumb,    .scroll:hover::-webkit-scrollbar-track {        visibility: visible; }}
`);

  function generateFilterDescription(filter) {
    // date check
    if (filter.lowerBoundaryDate >= filter.higherBoundaryDate) return 'Error: Invalid Date Interval';
    // size check
    if (parseInt(filter.lowerBoundarySize) >= parseInt(filter.higherBoundarySize)) return 'Error: Invalid Size Filter';
    let descriptionParts = ['Filter: All'];

    if (filter.owned === 'true') descriptionParts.push('owned');
    else if (filter.owned === 'false') descriptionParts.push('not owned');

    if (filter.space === 'consuming') descriptionParts.push('space consuming');
    if (filter.space === 'non-consuming') descriptionParts.push('non-space consuming');

    if (filter.uploadStatus === 'full') descriptionParts.push('fully uploaded');
    if (filter.uploadStatus === 'partial') descriptionParts.push('partially uploaded');

    if (filter.excludeShared === 'true') descriptionParts.push('non-shared');

    if (filter.favorite === 'true') descriptionParts.push('favorite');
    if (filter.excludeFavorites === 'true' || filter.favorite === 'false') descriptionParts.push('non-favorite');

    if (filter.quality === 'original') descriptionParts.push('original quality');
    else if (filter.quality === 'storage-saver') descriptionParts.push('storage-saver quality');
    if (filter.archived === 'true') descriptionParts.push('archived');
    else if (filter.archived === 'false') descriptionParts.push('non-archived');

    if (!filter.type) descriptionParts.push('media');
    else if (filter.type === 'video') descriptionParts.push('videos');
    else if (filter.type === 'live') descriptionParts.push('live photos');
    else if (filter.type === 'image') descriptionParts.push('images');

    if (filter.searchQuery) descriptionParts.push(`in search results of query "${filter.searchQuery}"`);

    if (filter.fileNameRegex) {
      descriptionParts.push('with filename');
      if (filter.fileNameMatchType === 'include') descriptionParts.push('matching');
      if (filter.fileNameMatchType === 'exclude') descriptionParts.push('not matching');
      descriptionParts.push(`regex "${filter.fileNameRegex}"`);
    }

    if (filter.descriptionRegex) {
      descriptionParts.push('with description');
      if (filter.descriptionMatchType === 'include') descriptionParts.push('matching');
      if (filter.descriptionMatchType === 'exclude') descriptionParts.push('not matching');
      descriptionParts.push(`regex "${filter.descriptionRegex}"`);
    }

    if (filter.similarityThreshold) descriptionParts.push(`with similarity more than "${filter.similarityThreshold}"`);

    if (parseInt(filter.lowerBoundarySize) > 0) descriptionParts.push(`larger than ${parseInt(filter.lowerBoundarySize)} bytes`);
    if (parseInt(filter.lowerBoundarySize) > 0 && parseInt(filter.higherBoundarySize) > 0) descriptionParts.push('and');
    if (parseInt(filter.higherBoundarySize) > 0) descriptionParts.push(`smaller than ${parseInt(filter.higherBoundarySize)} bytes`);

    if (filter.albumsInclude) {
      descriptionParts.push(Array.isArray(filter.albumsInclude) ? `in the ${filter.albumsInclude.length} target albums` : 'in the target album');
    }
    if (filter.albumsExclude) {
      descriptionParts.push('excluding items');
      descriptionParts.push(Array.isArray(filter.albumsExclude) ? `in the ${filter.albumsExclude.length} selected albums` : 'in the selected album');
    }

    if (filter.lowerBoundaryDate || filter.higherBoundaryDate) {
      const lowerBoundaryDate = filter.lowerBoundaryDate ? new Date(filter.lowerBoundaryDate).toLocaleString('en-GB') : null;
      const higherBoundaryDate = filter.higherBoundaryDate ? new Date(filter.higherBoundaryDate).toLocaleString('en-GB') : null;

      if (filter.dateType === 'taken') descriptionParts.push('taken');
      else if (filter.dateType === 'uploaded') descriptionParts.push('uploaded');

      if (lowerBoundaryDate && higherBoundaryDate) {
        if (filter.intervalType === 'exclude') {
          descriptionParts.push(`before ${lowerBoundaryDate} and after ${higherBoundaryDate}`);
        } else if (filter.intervalType === 'include') {
          descriptionParts.push(`from ${lowerBoundaryDate} to ${higherBoundaryDate}`);
        }
      } else if (lowerBoundaryDate) {
        if (filter.intervalType === 'exclude') descriptionParts.push(`before ${lowerBoundaryDate}`);
        else if (filter.intervalType === 'include') descriptionParts.push(`after ${lowerBoundaryDate}`);
      } else if (higherBoundaryDate) {
        if (filter.intervalType === 'exclude') descriptionParts.push(`after ${higherBoundaryDate}`);
        else if (filter.intervalType === 'include') descriptionParts.push(`before ${higherBoundaryDate}`);
      }
    }

    if (filter.sortBySize) descriptionParts.push('sorted by size');

    let filterDescriptionString = descriptionParts.join(' ');
    if (filterDescriptionString == 'Filter: All media') filterDescriptionString = 'Filter: None';
    return filterDescriptionString;
  }

  function getForm(selector) {
    let form = {};
    const formElement = document.querySelector(selector);
    const formData = new FormData(formElement);

    for (const [key, value] of formData) {

      if (value) {
        // Check if the key already exists in the form object
        if (Reflect.has(form, key)) {
          // If the value is not an array, make it an array
          if (!Array.isArray(form[key])) {
            form[key] = [form[key]];
          }
          // Add the new value to the array
          form[key].push(value);
        } else {
          // If the key doesn't exist in the form object, add it
          form[key] = value;
        }
      }
    }
    return form;
  }

  function disableActionBar(disabled) {
    const actions = document.querySelectorAll('.action-bar *');
    for (const action of actions) {
      action.disabled = disabled;
    }
  }

  function parser(data, rpcid) {
    /* notes

    add =w417-h174-k-no?authuser=0 to thumbnail url to set custon size, remove 'video' watermark, remove auth requirement

    */

    function libraryItemParse(itemData) {
      return {
        mediaKey: itemData?.[0],
        timestamp: itemData?.[2],
        timezoneOffset: itemData?.[4],
        creationTimestamp: itemData?.[5],
        dedupKey: itemData?.[3],
        thumb: itemData?.[1]?.[0],
        resWidth: itemData?.[1]?.[1],
        resHeight: itemData?.[1]?.[2],
        isPartialUpload: itemData[12]?.[0] === 20,
        isArchived: itemData?.[13],
        isFavorite: itemData?.at(-1)?.[163238866]?.[0],
        duration: itemData?.at(-1)?.[76647426]?.[0],
        descriptionShort: itemData?.at(-1)?.[396644657]?.[0],
        isLivePhoto: itemData?.at(-1)?.[146008172] ? true : false,
        livePhotoDuration: itemData?.at(-1)?.[146008172]?.[1],
        isOwned: itemData[7]?.filter((subArray) => subArray.includes(27)).length === 0,
        geoLocation: {
          coordinates: itemData?.at(-1)?.[129168200]?.[1]?.[0],
          name: itemData?.at(-1)?.[129168200]?.[1]?.[4]?.[0]?.[1]?.[0]?.[0],
        },
      };
    }

    function libraryTimelinePage(data) {
      return {
        items: data?.[0]?.map((itemData) => libraryItemParse(itemData)),
        nextPageId: data?.[1],
        lastItemTimestamp: parseInt(data?.[2]),
      };
    }

    function libraryGenericPage(data) {
      return {
        items: data?.[0]?.map((itemData) => libraryItemParse(itemData)),
        nextPageId: data?.[1],
      };
    }

    function lockedFolderItemParse(itemData) {
      return {
        mediaKey: itemData?.[0],
        timestamp: itemData?.[2],
        creationTimestamp: itemData?.[5],
        dedupKey: itemData?.[3],
        duration: itemData?.at(-1)?.[76647426]?.[0],
      };
    }

    function lockedFolderPage(data) {
      return {
        nextPageId: data?.[0],
        items: data?.[1]?.map((itemData) => lockedFolderItemParse(itemData)),
      };
    }

    function linkParse(itemData) {
      return {
        mediaKey: itemData?.[6],
        linkId: itemData?.[17],
        itemCount: itemData?.[3],
      };
    }

    function linksPage(data) {
      return {
        items: data?.[0]?.map((itemData) => linkParse(itemData)),
        nextPageId: data?.[1],
      };
    }

    function albumParse(itemData) {
      return {
        mediaKey: itemData?.[0],
        ownerActorId: itemData?.[6]?.[0],
        title: itemData?.at(-1)?.[72930366]?.[1],
        thumb: itemData?.[1]?.[0],
        itemCount: itemData?.at(-1)?.[72930366]?.[3],
        creationTimestamp: itemData?.at(-1)?.[72930366]?.[2]?.[4],
        modifiedTimestamp: itemData?.at(-1)?.[72930366]?.[2]?.[9],
        timestampRange: [itemData?.at(-1)?.[72930366]?.[2]?.[5], itemData?.at(-1)?.[72930366]?.[2]?.[6]],
        isShared: itemData?.at(-1)?.[72930366]?.[4] || false,
      };
    }

    function albumsPage(data) {
      return {
        items: data?.[0]?.map((itemData) => albumParse(itemData)),
        nextPageId: data?.[1],
      };
    }

    function partnerSharedItemParse(itemData) {
      return {
        mediaKey: itemData?.[0],
        thumb: itemData?.[1]?.[0],
        resWidth: itemData[1]?.[1],
        resHeight: itemData[1]?.[2],
        timestamp: itemData?.[2],
        timezoneOffset: itemData?.[4],
        creationTimestamp: itemData?.[5],
        dedupKey: itemData?.[3],
        saved: itemData?.[7]?.[3]?.[0] !== 20,
        isLivePhoto: itemData?.at(-1)?.[146008172] ? true : false,
        livePhotoDuration: itemData?.at(-1)?.[146008172]?.[1],
        duration: itemData?.at(-1)?.[76647426]?.[0],
      };
    }

    function albumItemParse(itemData) {
      return {
        mediaKey: itemData?.[0],
        thumb: itemData?.[1]?.[0],
        resWidth: itemData[1]?.[1],
        resHeight: itemData[1]?.[2],
        timestamp: itemData?.[2],
        timezoneOffset: itemData?.[4],
        creationTimestamp: itemData?.[5],
        dedupKey: itemData?.[3],
        isLivePhoto: itemData?.at(-1)?.[146008172] ? true : false,
        livePhotoDuration: itemData?.at(-1)?.[146008172]?.[1],
        duration: itemData?.at(-1)?.[76647426]?.[0],
      };
    }

    function trashItemParse(itemData) {
      return {
        mediaKey: itemData?.[0],
        thumb: itemData?.[1]?.[0],
        resWidth: itemData?.[1]?.[1],
        resHeight: itemData?.[1]?.[2],
        timestamp: itemData?.[2],
        timezoneOffset: itemData?.[4],
        creationTimestamp: itemData?.[5],
        dedupKey: itemData?.[3],
        duration: itemData?.at(-1)?.[76647426]?.[0],
      };
    }

    function actorParse(data) {
      return {
        actorId: data?.[0],
        gaiaId: data?.[1],
        name: data?.[11]?.[0],
        gender: data?.[11]?.[2],
        profiePhotoUrl: data?.[12]?.[0],
      };
    }

    function partnerSharedItemsPage(data) {
      return {
        nextPageId: data?.[0],
        items: data?.[1]?.map((itemData) => partnerSharedItemParse(itemData)),
        members: data?.[2]?.map((itemData) => actorParse(itemData)),
        parnterActorId: data?.[4],
        gaiaId: data?.[5],
      };
    }

    function albumItemsPage(data) {
      return {
        items: data?.[1]?.map((itemData) => albumItemParse(itemData)),
        nextPageId: data?.[2],
        mediaKey: data?.[3][0],
        title: data?.[3][1],
        owner: actorParse(data?.[3][5]),
        startTimestamp: data?.[3][2][5],
        endTimestamp: data?.[3][2][6],
        lastActivityTimestamp: data?.[3][2][7],
        creationTimestamp: data?.[3][2][8],
        newestOperationTimestamp: data?.[3][2][9],
        itemCount: data?.[3][21],
        authKey: data?.[3][19],
        members: data?.[3][9]?.map((itemData) => actorParse(itemData)),
      };
    }

    function trashPage(data) {
      return {
        items: data?.[0].map((itemData) => trashItemParse(itemData)),
        nextPageId: data?.[1],
      };
    }

    function itemBulkMediaInfoParse(itemData) {
      return {
        mediaKey: itemData?.[0],
        descriptionFull: itemData?.[1]?.[2],
        fileName: itemData?.[1]?.[3],
        timestamp: itemData?.[1]?.[6],
        timezoneOffset: itemData?.[1]?.[7],
        creationTimestamp: itemData?.[1]?.[8],
        size: itemData?.[1]?.[9],
        takesUpSpace: itemData?.[1]?.at(-1)?.[0] === undefined ? null : itemData?.[1]?.at(-1)?.[0] === 1,
        spaceTaken: itemData?.[1]?.at(-1)?.[1],
        isOriginalQuality: itemData?.[1]?.at(-1)?.[2] === undefined ? null : itemData?.[1]?.at(-1)?.[2] === 2,
      };
    }

    function itemInfoExtParse(itemData) {
      const source = [];

      const sourceMap = {
        1: 'mobile',
        2: 'web',
        3: 'shared',
        4: 'partnerShared',
        7: 'drive',
        8: 'pc',
        11: 'gmail',
      };

      source[0] = itemData[0]?.[27]?.[0] ? sourceMap[itemData[0][27][0]] : null;

      const sourceMapSecondary = {
        1: 'android',
        3: 'ios',
      };

      source[1] = itemData[0]?.[27]?.[1]?.[2] ? sourceMapSecondary[itemData[0][27][1][2]] : null;

      let owner = null;
      if (itemData[0]?.[27]?.length > 0) {
        owner = actorParse(itemData[0]?.[27]?.[3]?.[0] || itemData[0]?.[27]?.[4]?.[0]);
      }
      if (!owner?.actorId) {
        owner = actorParse(itemData[0]?.[28]);
      }

      return {
        mediaKey: itemData[0]?.[0],
        dedupKey: itemData[0]?.[11],
        descriptionFull: itemData[0]?.[1],
        fileName: itemData[0]?.[2],
        timestamp: itemData[0]?.[3],
        timezoneOffset: itemData[0]?.[4],
        size: itemData[0]?.[5],
        resWidth: itemData[0]?.[6],
        resHeight: itemData[0]?.[7],
        cameraInfo: itemData[0]?.[23],
        albums: itemData[0]?.[19]?.map((itemData) => albumParse(itemData)),
        source: source,
        takesUpSpace: itemData[0]?.[30]?.[0] === undefined ? null : itemData[0]?.[30]?.[0] === 1,
        spaceTaken: itemData[0]?.[30]?.[1],
        isOriginalQuality: itemData[0]?.[30]?.[2] === undefined ? null : itemData[0][30][2] === 2,
        savedToYourPhotos: itemData[0]?.[12].filter((subArray) => subArray.includes(20)).length === 0,
        owner: owner,
        geoLocation: {
          coordinates: itemData[0]?.[9]?.[0] || itemData[0]?.[13]?.[0],
          name: itemData[0]?.[13]?.[2]?.[0]?.[1]?.[0]?.[0],
          mapThumb: itemData?.[1],
        },
        other: itemData[0]?.[31],
      };
    }

    function itemInfoParse(itemData) {
      return {
        mediaKey: itemData[0]?.[0],
        dedupKey: itemData[0]?.[3],
        resWidth: itemData[0]?.[1]?.[1],
        resHeight: itemData[0]?.[1]?.[2],
        isPartialUpload: itemData[0]?.[12]?.[0] === 20,
        timestamp: itemData[0]?.[2],
        timezoneOffset: itemData[0]?.[4],
        creationTimestamp: itemData[0]?.[5],
        downloadUrl: itemData?.[1],
        downloadOriginalUrl: itemData?.[7], // url to download the original if item was modified after the upload
        savedToYourPhotos: itemData[0]?.[15]?.[163238866]?.length > 0,
        isArchived: itemData[0]?.[13],
        takesUpSpace: itemData[0]?.[15]?.[318563170]?.[0]?.[0] === undefined ? null : itemData[0]?.[15]?.[318563170]?.[0]?.[0] === 1,
        spaceTaken: itemData[0]?.[15]?.[318563170]?.[0]?.[1],
        isOriginalQuality: itemData[0]?.[15]?.[318563170]?.[0]?.[2] === undefined ? null : itemData[0]?.[15]?.[318563170]?.[0]?.[2] === 2,
        isFavorite: itemData[0]?.[15]?.[163238866]?.[0],
        duration: itemData[0]?.[15]?.[76647426]?.[0],
        isLivePhoto: itemData[0]?.[15]?.[146008172] ? true : false,
        livePhotoDuration: itemData[0]?.[15]?.[146008172]?.[1],
        livePhotoVideoDownloadUrl: itemData[0]?.[15]?.[146008172]?.[3],
        trashTimestamp: itemData[0]?.[15]?.[225032867]?.[0],
        descriptionFull: itemData[10],
        thumb: itemData[12],
      };
    }

    function bulkMediaInfo(data) {
      return data.map((itemData) => itemBulkMediaInfoParse(itemData));
    }

    function downloadTokenCheckParse(data) {
      return {
        fileName: data?.[0]?.[0]?.[0]?.[2]?.[0]?.[0],
        downloadUrl: data?.[0]?.[0]?.[0]?.[2]?.[0]?.[1],
        downloadSize: data?.[0]?.[0]?.[0]?.[2]?.[0]?.[2],
        unzippedSize: data?.[0]?.[0]?.[0]?.[2]?.[0]?.[3],
      };
    }

    function storageQuotaParse(data) {
      return {
        totalUsed: data?.[6]?.[0],
        totalAvailable: data?.[6]?.[1],
        usedByGPhotos: data?.[6]?.[3],
      };
    }

    function remoteMatchParse(itemData) {
      return {
        hash: itemData?.[0],
        mediaKey: itemData?.[1]?.[0],
        thumb: itemData?.[1]?.[1]?.[0],
        resWidth: itemData?.[1]?.[1]?.[1],
        resHeight: itemData?.[1]?.[1]?.[2],
        timestamp: itemData?.[1]?.[2],
        dedupKey: itemData?.[1]?.[3],
        timezoneOffset: itemData?.[1]?.[4],
        creationTimestamp: itemData?.[1]?.[5],
        duration: itemData?.[1]?.at(-1)?.[76647426]?.[0],
        cameraInfo: itemData?.[1]?.[1]?.[8],
      };
    }

    function remoteMatchesParse(data) {
      return data[0].map((itemData) => remoteMatchParse(itemData));
    }

    if (!data?.length) return null;
    if (rpcid === 'lcxiM') return libraryTimelinePage(data);
    if (rpcid === 'nMFwOc') return lockedFolderPage(data);
    if (rpcid === 'EzkLib') return libraryGenericPage(data);
    if (rpcid === 'F2A0H') return linksPage(data);
    if (rpcid === 'Z5xsfc') return albumsPage(data);
    if (rpcid === 'snAcKc') return albumItemsPage(data);
    if (rpcid === 'e9T5je') return partnerSharedItemsPage(data);
    if (rpcid === 'zy0IHe') return trashPage(data);
    if (rpcid === 'VrseUb') return itemInfoParse(data);
    if (rpcid === 'fDcn4b') return itemInfoExtParse(data);
    if (rpcid === 'EWgK9e') return bulkMediaInfo(data);
    if (rpcid === 'dnv2s') return downloadTokenCheckParse(data);
    if (rpcid === 'EzwWhf') return storageQuotaParse(data);
    if (rpcid === 'swbisb') return remoteMatchesParse(data);
  }

  function dateToHHMMSS(date) {
    // Options for formatting
    let options = { hour: '2-digit', minute: '2-digit', second: '2-digit' };

    // Formatted time string
    return date.toLocaleTimeString('en-GB', options);
  }
  function timeToHHMMSS(time) {
    const seconds = Math.floor((time / 1000) % 60);
    const minutes = Math.floor((time / (1000 * 60)) % 60);
    const hours = Math.floor((time / (1000 * 60 * 60)) % 24);
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return formattedTime;
  }
  function isPatternValid(pattern) {
    try {
      new RegExp(pattern);
      return true;
    } catch (e) {
      return e;
    }
  }
  function assertType(variable, expectedType) {
    const actualType = typeof variable;

    if (actualType !== expectedType) {
      throw new TypeError(`Expected type ${expectedType} but got ${actualType}`);
    }
  }

  function assertInstance(variable, expectedClass) {
    const actualClass = variable.constructor.name;

    if (!(variable instanceof expectedClass)) {
      throw new TypeError(`Expected instance of ${expectedClass.name} but got ${actualClass}`);
    }
  }

  // Defer execution to prevent UI blocking
  function defer(fn) {
    return new Promise((resolve) => setTimeout(() => resolve(fn()), 0));
  }

  /* eslint-disable no-undef */
  const windowGlobalData = {
    rapt: unsafeWindow.WIZ_global_data.Dbw5Ud,
    account: unsafeWindow.WIZ_global_data.oPEP7c,
    'f.sid': unsafeWindow.WIZ_global_data.FdrFJe,
    bl: unsafeWindow.WIZ_global_data.cfb2h,
    path: unsafeWindow.WIZ_global_data.eptZe,
    at: unsafeWindow.WIZ_global_data.SNlM0e,
  };

  class Api {
    async makeApiRequest(rpcid, requestData) {
      // type assertion
      if (rpcid) assertType(rpcid, 'string');

      requestData = [[[rpcid, JSON.stringify(requestData), null, 'generic']]];

      const requestDataString = `f.req=${encodeURIComponent(JSON.stringify(requestData))}&at=${encodeURIComponent(windowGlobalData.at)}&`;

      const params = {
        rpcids: rpcid,
        'source-path': window.location.pathname,
        'f.sid': windowGlobalData['f.sid'],
        bl: windowGlobalData.bl,
        pageId: 'none',
        rt: 'c',
      };
      // if in locked folder send rapt
      if (windowGlobalData.rapt) params.rapt = windowGlobalData.rapt;
      const paramsString = Object.keys(params)
        .map((key) => `${key}=${encodeURIComponent(params[key])}`)
        .join('&');
      const url = `https://photos.google.com${windowGlobalData.path}data/batchexecute?${paramsString}`;
      try {
        const response = await fetch(url, {
          headers: {
            'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
          },
          body: requestDataString,
          method: 'POST',
          credentials: 'include',
        });

        const responseBody = await response.text();
        const jsonLines = responseBody.split('\n').filter((line) => line.includes('wrb.fr'));
        let parsedData = JSON.parse(jsonLines[0]);
        return JSON.parse(parsedData[0][2]);
      } catch (error) {
        console.error(`Error in ${rpcid} request:`, error);
        throw error;
      }
    }

    async getItemsByTakenDate(timestamp = null, source = null, pageId = null, pageSize = 500, parseResponse = true) {
      // type assertion
      if (timestamp) assertType(timestamp, 'number');
      if (source) assertType(source, 'string');
      if (pageId) assertType(pageId, 'string');
      if (pageSize) assertType(pageSize, 'number');
      if (parseResponse) assertType(parseResponse, 'boolean');

      // Retrieves media items created before the provided timestamp
      if (source === 'library') source = 1;
      else if (source === 'archive') source = 2;
      else if (!source) source = 3; //both

      const rpcid = 'lcxiM';
      const requestData = [pageId, timestamp, pageSize, null, 1, source];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        if (parseResponse) return parser(response, rpcid);
        return response;
      } catch (error) {
        console.error('Error in getItemsByTakenDate:', error);
        throw error;
      }
    }

    async getItemsByUploadedDate(pageId = null, parseResponse = true) {
      // type assertion
      if (pageId) assertType(pageId, 'string');
      if (parseResponse) assertType(parseResponse, 'boolean');

      const rpcid = 'EzkLib';
      const requestData = ['', [[4, 'ra', 0, 0]], pageId];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        if (parseResponse) return parser(response, rpcid);
        return response;
      } catch (error) {
        console.error('Error in getItemsByUploadedDate:', error);
        throw error;
      }
    }

    async search(searchQuery, pageId = null, parseResponse = true) {
      // type assertion
      if (searchQuery) assertType(searchQuery, 'string');
      if (pageId) assertType(pageId, 'string');
      if (parseResponse) assertType(parseResponse, 'boolean');

      const rpcid = 'EzkLib';
      const requestData = [searchQuery, null, pageId];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        if (parseResponse) return parser(response, rpcid);
        return response;
      } catch (error) {
        console.error('Error in search:', error);
        throw error;
      }
    }

    async getRemoteMatchesByHash(hashArray, parseResponse = true) {
      // each hash is a base64-encoded binary SHA1 hash of a file
      // $ sha1sum "/path/to"/file" | xxd -r -p | base64

      // type assertion
      if (hashArray) assertInstance(hashArray, Array);
      if (parseResponse) assertType(parseResponse, 'boolean');

      const rpcid = 'swbisb';
      const requestData = [hashArray, null, 3, 0];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        if (parseResponse) return parser(response, rpcid);
        return response;
      } catch (error) {
        console.error('Error in getRemoteMatchesByHash:', error);
        throw error;
      }
    }

    async getFavoriteItems(pageId = null, parseResponse = true) {
      // type assertion
      if (pageId) assertType(pageId, 'string');
      if (parseResponse) assertType(parseResponse, 'boolean');

      const rpcid = 'EzkLib';
      const requestData = ['Favorites', [[5, '8', 0, 9]], pageId];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        if (parseResponse) return parser(response, rpcid);
        return response;
      } catch (error) {
        console.error('Error in getFavoriteItems:', error);
        throw error;
      }
    }

    async getTrashItems(pageId = null, parseResponse = true) {
      // type assertion
      if (pageId) assertType(pageId, 'string');
      if (parseResponse) assertType(parseResponse, 'boolean');

      const rpcid = 'zy0IHe';
      const requestData = [pageId];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        if (parseResponse) return parser(response, rpcid);
        return response;
      } catch (error) {
        console.error('Error in getTrashItems:', error);
        throw error;
      }
    }

    async getLockedFolderItems(pageId = null, parseResponse = true) {
      // type assertion
      if (pageId) assertType(pageId, 'string');
      if (parseResponse) assertType(parseResponse, 'boolean');

      const rpcid = 'nMFwOc';
      const requestData = [pageId];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        if (parseResponse) return parser(response, rpcid);
        return response;
      } catch (error) {
        console.error('Error in getLockedFolderItems:', error);
        throw error;
      }
    }

    async moveItemsToTrash(dedupKeyArray) {
      // type assertion
      if (dedupKeyArray) assertInstance(dedupKeyArray, Array);

      const rpcid = 'XwAOJf';
      const requestData = [null, 1, dedupKeyArray, 3];
      // note: It seems that '3' here corresponds to items' location
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        return response[0];
      } catch (error) {
        console.error('Error in moveItemsToTrash:', error);
        throw error;
      }
    }

    async restoreFromTrash(dedupKeyArray) {
      // type assertion
      if (dedupKeyArray) assertInstance(dedupKeyArray, Array);

      const rpcid = 'XwAOJf';
      const requestData = [null, 3, dedupKeyArray, 2];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        return response[0];
      } catch (error) {
        console.error('Error in restoreFromTrash:', error);
        throw error;
      }
    }

    async getSharedLinks(pageId = null, parseResponse = true) {
      // type assertion
      if (pageId) assertType(pageId, 'string');
      if (parseResponse) assertType(parseResponse, 'boolean');

      const rpcid = 'F2A0H';
      const requestData = [pageId, null, 2, null, 3];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        if (parseResponse) return parser(response, rpcid);
        return response;
      } catch (error) {
        console.error('Error in getSharedLinks:', error);
        throw error;
      }
    }

    async getAlbums(pageId = null, pageSize = 100, parseResponse = true) {
      // type assertion
      if (pageId) assertType(pageId, 'string');
      if (pageSize) assertType(pageSize, 'number');
      if (parseResponse) assertType(parseResponse, 'boolean');

      const rpcid = 'Z5xsfc';
      const requestData = [pageId, null, null, null, 1, null, null, pageSize, [2], 5];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        if (parseResponse) return parser(response, rpcid);
        return response;
      } catch (error) {
        console.error('Error in getAlbums:', error);
        throw error;
      }
    }

    async getAlbumPage(albumMediaKey, pageId = null, authKey = null, parseResponse = true) {
      // get items of an album or a shared link with the given id

      // type assertion
      if (albumMediaKey) assertType(albumMediaKey, 'string');
      if (pageId) assertType(pageId, 'string');
      if (authKey) assertType(authKey, 'string');
      if (parseResponse) assertType(parseResponse, 'boolean');

      const rpcid = 'snAcKc';
      const requestData = [albumMediaKey, pageId, null, authKey];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        if (parseResponse) return parser(response, rpcid);
        return response;
      } catch (error) {
        console.error('Error in getAlbumPage:', error);
        throw error;
      }
    }

    async removeItemsFromAlbum(itemAlbumMediaKeyArray) {
      // regular mediaKey's won't cut it, you need to get them from an album

      // type assertion
      if (itemAlbumMediaKeyArray) assertInstance(itemAlbumMediaKeyArray, Array);

      const rpcid = 'ycV3Nd';
      const requestData = [itemAlbumMediaKeyArray];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        return response;
      } catch (error) {
        console.error('Error in removeItemsFromAlbum:', error);
        throw error;
      }
    }

    async createAlbum(albumName) {
      // returns string id of the created album

      // type assertion
      if (albumName) assertType(albumName, 'string');

      const rpcid = 'OXvT9d';
      let requestData = [albumName, null, 2];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        return response[0][0];
      } catch (error) {
        console.error('Error in createAlbum:', error);
        throw error;
      }
    }

    async addItemsToAlbum(mediaKeyArray, albumMediaKey = null, albumName = null) {
      // supply album ID for adding to an existing album, or a name for a new one

      // type assertion
      if (mediaKeyArray) assertInstance(mediaKeyArray, Array);
      if (albumMediaKey) assertType(albumMediaKey, 'string');
      if (albumName) assertType(albumName, 'string');

      const rpcid = 'E1Cajb';
      let requestData = null;

      if (albumName) requestData = [mediaKeyArray, null, albumName];
      else if (albumMediaKey) requestData = [mediaKeyArray, albumMediaKey];

      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        return response;
      } catch (error) {
        console.error('Error in addItemsToAlbum:', error);
        throw error;
      }
    }

    async addItemsToSharedAlbum(mediaKeyArray, albumMediaKey = null, albumName = null) {
      // supply album ID for adding to an existing album, or a name for a new one

      // type assertion
      if (mediaKeyArray) assertInstance(mediaKeyArray, Array);
      if (albumMediaKey) assertType(albumMediaKey, 'string');
      if (albumName) assertType(albumName, 'string');

      const rpcid = 'laUYf';
      let requestData = null;

      if (albumName) requestData = [mediaKeyArray, null, albumName];
      else if (albumMediaKey) requestData = [albumMediaKey, [2, null, mediaKeyArray.map((id) => [[id]]), null, null, null, [1]]];

      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        return response;
      } catch (error) {
        console.error('Error in addItemsToSharedAlbum:', error);
        throw error;
      }
    }

    async setAlbumItemOrder(albumMediaKey, albumItemKeys, insertAfter = null) {
      // type assertion
      if (albumMediaKey) assertType(albumMediaKey, 'string');
      if (albumItemKeys) assertInstance(albumItemKeys, Array);

      const rpcid = 'QD9nKf';

      const albumItemKeysArray = albumItemKeys.map((item) => [[item]]);

      let requestData = null;

      if (insertAfter) {
        requestData = [albumMediaKey, null, 3, null, albumItemKeysArray, [[insertAfter]]];
      } else {
        requestData = [albumMediaKey, null, 1, null, albumItemKeysArray];
      }

      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        return response;
      } catch (error) {
        console.error('Error in setAlbumItemOrder:', error);
        throw error;
      }
    }

    async setFavorite(dedupKeyArray, action = true) {
      // type assertion
      if (dedupKeyArray) assertInstance(dedupKeyArray, Array);
      if (action) assertType(action, 'boolean');

      if (action === true) action = 1; //set favorite
      else if (action === false) action = 2; //un favorite
      dedupKeyArray = dedupKeyArray.map((item) => [null, item]);
      const rpcid = 'Ftfh0';
      const requestData = [dedupKeyArray, [action]];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        return response;
      } catch (error) {
        console.error('Error in setFavorite:', error);
        throw error;
      }
    }

    async setArchive(dedupKeyArray, action = true) {
      // type assertion
      if (dedupKeyArray) assertInstance(dedupKeyArray, Array);
      if (action) assertType(action, 'boolean');

      if (action === true) action = 1; // send to archive
      else if (action === false) action = 2; // un archive

      dedupKeyArray = dedupKeyArray.map((item) => [null, [action], [null, item]]);
      const rpcid = 'w7TP3c';
      const requestData = [dedupKeyArray, null, 1];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        return response;
      } catch (error) {
        console.error('Error in setArchive:', error);
        throw error;
      }
    }

    async moveToLockedFolder(dedupKeyArray) {
      // type assertion
      if (dedupKeyArray) assertInstance(dedupKeyArray, Array);

      const rpcid = 'StLnCe';
      const requestData = [dedupKeyArray, []];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        return response;
      } catch (error) {
        console.error('Error in moveToLockedFolder:', error);
        throw error;
      }
    }

    async removeFromLockedFolder(dedupKeyArray) {
      // type assertion
      if (dedupKeyArray) assertInstance(dedupKeyArray, Array);

      const rpcid = 'Pp2Xxe';
      const requestData = [dedupKeyArray];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        return response;
      } catch (error) {
        console.error('Error in removeFromLockedFolder:', error);
        throw error;
      }
    }

    async getStorageQuota(parseResponse = true) {
      // type assertion
      if (parseResponse) assertType(parseResponse, 'boolean');

      const rpcid = 'EzwWhf';
      const requestData = [];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        if (parseResponse) return parser(response, rpcid);
        return response;
      } catch (error) {
        console.error('Error in getDownloadUrl:', error);
        throw error;
      }
    }

    // there are at least two rpcid's that are used for file downloading
    // getDownloadUrl uses `pLFTfd`
    // getDownloadToken uses `yCLA7`
    // Both take mediaKeyArray as an argument
    // getDownloadUrl receives a dl url, and can use authKey to download shared media - dl url does not have a Content-Length header
    // getDownloadToken receives a token, which is then used to check if the dl url is ready with checkDownloadToken - dl url has a Content-Length header

    async getDownloadUrl(mediaKeyArray, authKey = null) {
      // type assertion
      if (mediaKeyArray) assertInstance(mediaKeyArray, Array);

      const rpcid = 'pLFTfd';
      const requestData = [mediaKeyArray, null, authKey];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        return response[0];
      } catch (error) {
        console.error('Error in getDownloadUrl:', error);
        throw error;
      }
    }

    async getDownloadToken(mediaKeyArray) {
      // use the token with checkDownloadToken to check if DL ulr is ready

      // type assertion
      if (mediaKeyArray) assertInstance(mediaKeyArray, Array);

      const rpcid = 'yCLA7';
      mediaKeyArray = mediaKeyArray.map((id) => [id]);
      const requestData = [mediaKeyArray];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        return response[0];
      } catch (error) {
        console.error('Error in getDownloadToken:', error);
        throw error;
      }
    }

    async checkDownloadToken(dlToken, parseResponse = true) {
      // returns dl url if one found

      // type assertion
      if (dlToken) assertType(dlToken, 'string');
      if (parseResponse) assertType(parseResponse, 'boolean');

      const rpcid = 'dnv2s';
      const requestData = [[dlToken]];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        if (parseResponse) return parser(response, rpcid);
        return response;
      } catch (error) {
        console.error('Error in checkDownloadToken:', error);
        throw error;
      }
    }

    async removeItemsFromSharedAlbum(albumMediaKey, mediaKeyArray) {
      // type assertion
      if (albumMediaKey) assertType(albumMediaKey, 'string');
      if (mediaKeyArray) assertInstance(mediaKeyArray, Array);

      const rpcid = 'LjmOue';
      const requestData = [
        [albumMediaKey],
        [mediaKeyArray],
        [[null, null, null, [null, [], []], null, null, null, null, null, null, null, null, null, []]],
      ];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        return response;
      } catch (error) {
        console.error('Error in removeItemsFromSharedAlbum:', error);
        throw error;
      }
    }

    async saveSharedMediaToLibrary(albumMediaKey, mediaKeyArray) {
      // save shared media to own library
      // type assertion
      if (albumMediaKey) assertType(albumMediaKey, 'string');
      if (mediaKeyArray) assertInstance(mediaKeyArray, Array);

      const rpcid = 'V8RKJ';
      const requestData = [mediaKeyArray, null, albumMediaKey];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        return response;
      } catch (error) {
        console.error('Error in saveSharedMediaToLibrary:', error);
        throw error;
      }
    }

    async savePartnerSharedMediaToLibrary(mediaKeyArray) {
      // save partner shared media to own library
      // type assertion
      if (mediaKeyArray) assertInstance(mediaKeyArray, Array);

      const rpcid = 'Es7fke';
      mediaKeyArray = mediaKeyArray.map((id) => [id]);
      const requestData = [mediaKeyArray];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        return response;
      } catch (error) {
        console.error('Error in savePartnerSharedMediaToLibrary:', error);
        throw error;
      }
    }

    async getPartnerSharedMedia(partnerActorId, gaiaId, pageId, parseResponse = true) {
      // partner's actorId, your account's gaiaId
      // type assertion
      if (partnerActorId) assertType(partnerActorId, 'string');
      if (gaiaId) assertType(gaiaId, 'string');
      if (pageId) assertType(pageId, 'string');
      if (parseResponse) assertType(parseResponse, 'boolean');

      const rpcid = 'e9T5je';
      const requestData = [pageId, null, [null, [[[2, 1]]], [partnerActorId], [null, gaiaId], 1]];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        if (parseResponse) return parser(response, rpcid);
        return response;
      } catch (error) {
        console.error('Error in getPartnerSharedMedia:', error);
        throw error;
      }
    }

    async setItemGeoData(dedupKeyArray, center, visible1, visible2, scale, gMapsPlaceId) {
      // type assertion
      if (dedupKeyArray) assertInstance(dedupKeyArray, Array);
      if (center) assertInstance(center, Array);
      if (visible1) assertInstance(visible1, Array);
      if (visible2) assertInstance(visible2, Array);
      if (scale) assertInstance(scale, 'number');
      if (gMapsPlaceId) assertInstance(gMapsPlaceId, 'string');

      // every point is an array of coordinates, every coordinate is 9 digit-long int
      // coordinates and scale can be extracted from mapThumb, but gMapsPlaceId is not exposed in GP
      const rpcid = 'EtUHOe';
      dedupKeyArray = dedupKeyArray.map((dedupKey) => [null, dedupKey]);
      const requestData = [dedupKeyArray, [2, center, [visible1, visible2], [null, null, scale], gMapsPlaceId]];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        return response;
      } catch (error) {
        console.error('Error in setItemGeoData:', error);
        throw error;
      }
    }

    async deleteItemGeoData(dedupKeyArray) {
      // type assertion
      if (dedupKeyArray) assertInstance(dedupKeyArray, Array);

      const rpcid = 'EtUHOe';
      dedupKeyArray = dedupKeyArray.map((dedupKey) => [null, dedupKey]);
      const requestData = [dedupKeyArray, [1]];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        return response;
      } catch (error) {
        console.error('Error in deleteItemGeoData:', error);
        throw error;
      }
    }

    async setItemTimestamp(dedupKey, timestamp, timezone) {
      // timestamp in epoch miliseconds
      // timesone as an offset e.g 19800 is GMT+05:30

      // type assertion
      if (dedupKey) assertType(dedupKey, 'string');
      if (timestamp) assertType(timestamp, 'number');
      if (timezone) assertType(timezone, 'number');
      const rpcid = 'DaSgWe';
      const requestData = [[[dedupKey, timestamp, timezone]]];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        return response;
      } catch (error) {
        console.error('Error in setItemTimestamp:', error);
        throw error;
      }
    }

    async setItemDescription(dedupKey, description) {
      // type assertion
      if (dedupKey) assertType(dedupKey, 'string');
      if (description) assertType(description, 'string');

      const rpcid = 'AQNOFd';
      const requestData = [null, description, dedupKey];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        return response;
      } catch (error) {
        console.error('Error in setItemDescription:', error);
        throw error;
      }
    }

    async getItemInfo(mediaKey, albumMediaKey = null, authKey = null, parseResponse = true) {
      // type assertion
      if (mediaKey) assertType(mediaKey, 'string');
      if (albumMediaKey) assertType(albumMediaKey, 'string');
      if (authKey) assertType(authKey, 'string');
      if (parseResponse) assertType(parseResponse, 'boolean');

      const rpcid = 'VrseUb';

      const requestData = [mediaKey, null, authKey, null, albumMediaKey];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        if (parseResponse) return parser(response, rpcid);
        return response;
      } catch (error) {
        console.error('Error in getItemInfo:', error);
        throw error;
      }
    }

    async getItemInfoExt(mediaKey, authKey = null, parseResponse = true) {
      // type assertion
      if (mediaKey) assertType(mediaKey, 'string');
      if (authKey) assertType(authKey, 'boolean');
      if (parseResponse) assertType(parseResponse, 'boolean');

      const rpcid = 'fDcn4b';
      const requestData = [mediaKey, 1, authKey, null, 1];
      try {
        const response = await this.makeApiRequest(rpcid, requestData);
        if (parseResponse) return parser(response, rpcid);
        return response;
      } catch (error) {
        console.error('Error in getItemInfoExt:', error);
        throw error;
      }
    }

    async getBatchMediaInfo(mediaKeyArray, parseResponse = true) {
      // type assertion
      if (mediaKeyArray) assertInstance(mediaKeyArray, Array);
      if (parseResponse) assertType(parseResponse, 'boolean');

      const rpcid = 'EWgK9e';
      mediaKeyArray = mediaKeyArray.map((id) => [id]);
      // prettier-ignore
      const requestData = [[[mediaKeyArray], [[null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, [], null, null, null, null, null, null, null, null, null, null, []]]]];
      try {
        let response = await this.makeApiRequest(rpcid, requestData);
        response = response[0][1];
        if (parseResponse) return parser(response, rpcid);
        return response;
      } catch (error) {
        console.error('Error in getBatchMediaInfo:', error);
        throw error;
      }
    }
  }

  function log(logMessage, type = null) {
    const logPrefix = '[GPTK]';

    const now = new Date();
    const timestamp = dateToHHMMSS(now);

    // Create a new div for the log message
    const logDiv = document.createElement('div');
    logDiv.textContent = `[${timestamp}] ${logMessage}`;

    if (type) logDiv.classList.add(type);

    console.log(`${logPrefix} [${timestamp}] ${logMessage}`);

    // Append the log message to the log container
    try {
      const logContainer = document.querySelector('#logArea');
      logContainer.appendChild(logDiv);
      if (document.querySelector('#autoScroll').checked) logDiv.scrollIntoView();
    } catch (error) {
      console.error(`${logPrefix} [${timestamp}] ${error}`);
    }
  }

  function splitArrayIntoChunks(arr, chunkSize = 500) {
    chunkSize = parseInt(chunkSize);
    const chunks = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      chunks.push(arr.slice(i, i + chunkSize));
    }
    return chunks;
  }

  const apiSettingsDefault = {
    maxConcurrentApiReq: 3,
    operationSize: 500,
    lockedFolderOpSize : 100,
    infoSize: 5000
  };

  class ApiUtils {
    constructor(core = null, settings) {
      this.api = new Api();
      this.executeWithConcurrency = this.executeWithConcurrency.bind(this);
      this.getAllItems = this.getAllItems.bind(this);
      this.copyOneDescriptionFromOther = this.copyOneDescriptionFromOther.bind(this);
      this.core = core;
      let { maxConcurrentSingleApiReq, maxConcurrentBatchApiReq, operationSize, infoSize, lockedFolderOpSize } =
        settings || apiSettingsDefault;

      this.maxConcurrentSingleApiReq = parseInt(maxConcurrentSingleApiReq);
      this.maxConcurrentBatchApiReq = parseInt(maxConcurrentBatchApiReq);
      this.operationSize = parseInt(operationSize);
      this.lockedFolderOpSize = parseInt(lockedFolderOpSize);
      this.infoSize = parseInt(infoSize);
    }

    async executeWithConcurrency(apiMethod, operationSize, itemsArray, ...args) {
      const promisePool = new Set();
      const results = [];
      const chunkedItems = splitArrayIntoChunks(itemsArray, operationSize);
      const maxConcurrentApiReq =
        operationSize == 1 ? this.maxConcurrentSingleApiReq : this.maxConcurrentBatchApiReq;

      for (const chunk of chunkedItems) {
        if (!this.core.isProcessRunning) return;

        while (promisePool.size >= maxConcurrentApiReq) {
          await Promise.race(promisePool);
        }

        if (operationSize != 1) log(`Processing ${chunk.length} items`);

        const promise = apiMethod.call(this.api, chunk, ...args);
        promisePool.add(promise);

        promise
          .then((result) => {
            results.push(...result);
            if (!Array.isArray(result)) {
              log(`Error executing action ${apiMethod.name}`, 'error');
            } else if (operationSize == 1 && results.length % 100 == 0) {
              log(`Processed ${results.length} items`);
            }
          })
          .catch((error) => {
            log(`${apiMethod.name} Api error ${error}`, 'error');
          })
          .finally(() => {
            promisePool.delete(promise);
          });
      }
      await Promise.all(promisePool);
      return results;
    }

    async getAllItems(apiMethod, ...args) {
      const items = [];
      let nextPageId = null;
      do {
        if (!this.core.isProcessRunning) return;
        const page = await apiMethod.call(this.api, ...args, nextPageId);
        if (page?.items?.length > 0) {
          log(`Found ${page.items.length} items`);
          items.push(...page.items);
        }
        nextPageId = page?.nextPageId;
      } while (nextPageId);
      return items;
    }

    async getAllAlbums() {
      return await this.getAllItems(this.api.getAlbums);
    }

    async getAllSharedLinks() {
      return await this.getAllItems(this.api.getSharedLinks);
    }

    async getAllMediaInSharedLink(sharedLinkId) {
      return await this.getAllItems(this.api.getAlbumPage, sharedLinkId);
    }

    async getAllMediaInAlbum(albumMediaKey) {
      return await this.getAllItems(this.api.getAlbumPage, albumMediaKey);
    }

    async getAllTrashItems() {
      return await this.getAllItems(this.api.getTrashItems);
    }

    async getAllFavoriteItems() {
      return await this.getAllItems(this.api.getFavoriteItems);
    }

    async getAllSearchItems(searchQuery) {
      return await this.getAllItems(this.api.search, searchQuery);
    }

    async getAllLockedFolderItems() {
      return await this.getAllItems(this.api.getLockedFolderItems);
    }

    async moveToLockedFolder(mediaItems) {
      log(`Moving ${mediaItems.length} items to locked folder`);
      const dedupKeyArray = mediaItems.map((item) => item.dedupKey);
      await this.executeWithConcurrency(this.api.moveToLockedFolder, this.lockedFolderOpSize, dedupKeyArray);
    }

    async removeFromLockedFolder(mediaItems) {
      log(`Moving ${mediaItems.length} items out of locked folder`);
      const dedupKeyArray = mediaItems.map((item) => item.dedupKey);
      await this.executeWithConcurrency(this.api.removeFromLockedFolder, this.lockedFolderOpSize, dedupKeyArray);
    }

    async moveToTrash(mediaItems) {
      log(`Moving ${mediaItems.length} items to trash`);
      const dedupKeyArray = mediaItems.map((item) => item.dedupKey);
      await this.executeWithConcurrency(this.api.moveItemsToTrash, this.operationSize, dedupKeyArray);
    }

    async restoreFromTrash(trashItems) {
      log(`Restoring ${trashItems.length} items from trash`);
      const dedupKeyArray = trashItems.map((item) => item.dedupKey);
      await this.executeWithConcurrency(this.api.restoreFromTrash, this.operationSize, dedupKeyArray);
    }

    async sendToArchive(mediaItems) {
      log(`Sending ${mediaItems.length} items to archive`);
      mediaItems = mediaItems.filter((item) => item?.isArchived !== true);
      const dedupKeyArray = mediaItems.map((item) => item.dedupKey);
      if (!mediaItems) {
        log('All target items are already archived');
        return;
      }
      await this.executeWithConcurrency(this.api.setArchive, this.operationSize, dedupKeyArray, true);
    }

    async unArchive(mediaItems) {
      log(`Removing ${mediaItems.length} items from archive`);
      mediaItems = mediaItems.filter((item) => item?.isArchived !== false);
      const dedupKeyArray = mediaItems.map((item) => item.dedupKey);
      if (!mediaItems) {
        log('All target items are not archived');
        return;
      }
      await this.executeWithConcurrency(this.api.setArchive, this.operationSize, dedupKeyArray, false);
    }

    async setAsFavorite(mediaItems) {
      log(`Setting ${mediaItems.length} items as favorite`);
      mediaItems = mediaItems.filter((item) => item?.isFavorite !== true);
      if (!mediaItems) {
        log('All target items are already favorite');
        return;
      }
      const dedupKeyArray = mediaItems.map((item) => item.dedupKey);
      await this.executeWithConcurrency(this.api.setFavorite, this.operationSize, dedupKeyArray, true);
    }

    async unFavorite(mediaItems) {
      log(`Removing ${mediaItems.length} items from favorites`);
      mediaItems = mediaItems.filter((item) => item?.isFavorite !== false);
      if (!mediaItems) {
        log('All target items are not favorite');
        return;
      }
      const dedupKeyArray = mediaItems.map((item) => item.dedupKey);
      await this.executeWithConcurrency(this.api.setFavorite, this.operationSize, dedupKeyArray, false);
    }

    async addToExistingAlbum(mediaItems, targetAlbum, preserveOrder = false) {
      log(`Adding ${mediaItems.length} items to album "${targetAlbum.title}"`);
      const mediaKeyArray = mediaItems.map((item) => item.mediaKey);

      const addItemFunction = targetAlbum.isShared ? this.api.addItemsToSharedAlbum : this.api.addItemsToAlbum;

      await this.executeWithConcurrency(addItemFunction, this.operationSize, mediaKeyArray, targetAlbum.mediaKey);

      if (preserveOrder) {
        log('Setting album item order');
        const albumItems = await this.getAllMediaInAlbum(targetAlbum.mediaKey);
        console.log('mediaItems');
        console.log(mediaItems);
        console.log('albumItems');
        console.log(albumItems);
        const orderMap = new Map();
        mediaItems.forEach((item, index) => {
          orderMap.set(item.dedupKey, index);
        });
        const sortedAlbumItems = [...albumItems].sort((a, b) => {
          const indexA = orderMap.has(a.dedupKey) ? orderMap.get(a.dedupKey) : Infinity;
          const indexB = orderMap.has(b.dedupKey) ? orderMap.get(b.dedupKey) : Infinity;
          return indexA - indexB;
        });
        const sortedMediaKeys = sortedAlbumItems.map((item) => item.mediaKey);
        console.log('sortedMediaKeys');
        console.log(sortedMediaKeys);
        for (const key of sortedMediaKeys.reverse()) {
          await this.api.setAlbumItemOrder(targetAlbum.mediaKey, [key]);
        }
      }
    }

    async addToNewAlbum(mediaItems, targetAlbumName, preserveOrder = false) {
      log(`Creating new album "${targetAlbumName}"`);
      const album = {};
      album.title = targetAlbumName;
      album.shared = false;
      album.mediaKey = await this.api.createAlbum(targetAlbumName);
      await this.addToExistingAlbum(mediaItems, album, preserveOrder);
    }

    async getBatchMediaInfoChunked(mediaItems) {
      log("Getting items' media info");
      const mediaKeyArray = mediaItems.map((item) => item.mediaKey);
      const mediaInfoData = await this.executeWithConcurrency(this.api.getBatchMediaInfo, this.infoSize, mediaKeyArray);
      return mediaInfoData;
    }

    async copyOneDescriptionFromOther(mediaItems) {
      // This method returns an array containing a single boolean indicating
      // whether the description was copied.  This lets us do two things: (1)
      // log progress as we go along (since this operation is slow compared to
      // batch operations), and (2) report to the user how many descriptions
      // were actually copied (since sometimes they aren't, see below).
      try {
        const item = mediaItems[0];
        const itemInfoExt = await this.api.getItemInfoExt(item.mediaKey);
        // To be safe, we only copy the description if the Google Photos
        // description field is empty and the 'Other' description is non-empty.
        if (itemInfoExt.descriptionFull || !itemInfoExt.other) {
          return [false];
        }
        // The Google Photos API doesn't allow the description to be identical
        // to the "Other" field.  Adding leading or trailing spaces doesn't
        // work - if you try this using the web app, it simply deletes the
        // description, and if you set it using the API directly then it
        // ignores the description at display time.  However it *does* work to
        // add a zero-width space (U+200B) since that character is not
        // considered to be whitespace.
        const description = itemInfoExt.other + "\u200B";
        await this.api.setItemDescription(item.dedupKey, description);
        return [true];
      } catch (error) {
        console.error('Error in copyOneDescriptionFromOther:', error);
        throw error;
      }
    }

    async copyDescriptionFromOther(mediaItems) {
      // Note that api.getBatchMediaInfo cannot be used to optimize this process
      // since that method returns a non-empty descriptionFull field if either
      // the actual "descriptionFull" field or the "other" field is set.  Only
      // api.getItemInfoExt distinguishes between the two.
      log(`Copying up to ${mediaItems.length} descriptions from 'Other' field`);
      const results = await this.executeWithConcurrency(this.copyOneDescriptionFromOther, 1, mediaItems);
      log(`Copied ${results.filter(Boolean).length} descriptions from 'Other' field`);
    }
  }

  function fileNameFilter(mediaItems, filter) {
    log('Filtering by filename');
    const regex = new RegExp(filter.fileNameRegex);
    if (filter?.fileNameMatchType === 'include') mediaItems = mediaItems.filter((item) => regex.test(item.fileName));
    else if (filter?.fileNameMatchType === 'exclude') mediaItems = mediaItems.filter((item) => !regex.test(item.fileName));
    log(`Item count after filtering: ${mediaItems?.length}`);
    return mediaItems;
  }

  function descriptionFilter(mediaItems, filter) {
    log('Filtering by description');
    const regex = new RegExp(filter.descriptionRegex);
    if (filter?.descriptionMatchType === 'include') mediaItems = mediaItems.filter((item) => regex.test(item.descriptionFull));
    else if (filter?.descriptionMatchType === 'exclude') mediaItems = mediaItems.filter((item) => !regex.test(item.descriptionFull));
    log(`Item count after filtering: ${mediaItems?.length}`);
    return mediaItems;
  }

  function sizeFilter(mediaItems, filter) {
    log('Filtering by size');
    if (parseInt(filter?.higherBoundarySize) > 0) mediaItems = mediaItems.filter((item) => item.size < filter.higherBoundarySize);
    if (parseInt(filter?.lowerBoundarySize) > 0) mediaItems = mediaItems.filter((item) => item.size > filter.lowerBoundarySize);
    log(`Item count after filtering: ${mediaItems?.length}`);
    return mediaItems;
  }

  function qualityFilter(mediaItems, filter) {
    log('Filtering by quality');
    if (filter.quality == 'original') mediaItems = mediaItems.filter((item) => item.isOriginalQuality);
    else if (filter.quality == 'storage-saver') mediaItems = mediaItems.filter((item) => !item.isOriginalQuality);
    log(`Item count after filtering: ${mediaItems?.length}`);
    return mediaItems;
  }

  function spaceFilter(mediaItems, filter) {
    log('Filtering by space');
    if (filter.space === 'consuming') mediaItems = mediaItems.filter((item) => item.takesUpSpace);
    else if (filter.space === 'non-consuming') mediaItems = mediaItems.filter((item) => !item.takesUpSpace);
    log(`Item count after filtering: ${mediaItems?.length}`);
    return mediaItems;
  }

  function filterByDate(mediaItems, filter) {
    log('Filtering by date');
    let lowerBoundaryDate = new Date(filter.lowerBoundaryDate).getTime();
    let higherBoundaryDate = new Date(filter.higherBoundaryDate).getTime();

    lowerBoundaryDate = isNaN(lowerBoundaryDate) ? -Infinity : lowerBoundaryDate;
    higherBoundaryDate = isNaN(higherBoundaryDate) ? Infinity : higherBoundaryDate;

    if (filter.intervalType === 'include') {
      if (filter.dateType === 'taken') {
        mediaItems = mediaItems.filter((item) => item.timestamp >= lowerBoundaryDate && item.timestamp <= higherBoundaryDate);
      } else if (filter.dateType === 'uploaded') {
        mediaItems = mediaItems.filter((item) => item.creationTimestamp >= lowerBoundaryDate && item.creationTimestamp <= higherBoundaryDate);
      }
    } else if (filter.intervalType === 'exclude') {
      if (filter.dateType === 'taken') {
        mediaItems = mediaItems.filter((item) => item.timestamp < lowerBoundaryDate || item.timestamp > higherBoundaryDate);
      } else if (filter.dateType === 'uploaded') {
        mediaItems = mediaItems.filter((item) => item.creationTimestamp < lowerBoundaryDate || item.creationTimestamp > higherBoundaryDate);
      }
    }
    log(`Item count after filtering: ${mediaItems?.length}`);
    return mediaItems;
  }

  function filterByMediaType(mediaItems, filter) {
    // if has duration - video, else image
    log('Filtering by media type');
    if (filter.type === 'video') mediaItems = mediaItems.filter((item) => item.duration);
    else if (filter.type === 'image') mediaItems = mediaItems.filter((item) => !item.duration);
    else if (filter.type === 'live') mediaItems = mediaItems.filter((item) => item.isLivePhoto);
    log(`Item count after filtering: ${mediaItems?.length}`);
    return mediaItems;
  }

  function filterFavorite(mediaItems, filter) {
    log('Filtering favorites');
    if (filter.favorite === 'true') {
      mediaItems = mediaItems.filter((item) => item?.isFavorite !== false);
    } else if (filter.favorite === 'false' || filter.excludeFavorites) {
      mediaItems = mediaItems.filter((item) => item?.isFavorite !== true);
    }

    log(`Item count after filtering: ${mediaItems?.length}`);
    return mediaItems;
  }

  function filterOwned(mediaItems, filter) {
    log('Filtering owned');
    if (filter.owned === 'true') {
      mediaItems = mediaItems.filter((item) => item?.isOwned !== false);
    } else if (filter.owned === 'false') {
      mediaItems = mediaItems.filter((item) => item?.isOwned !== true);
    }
    log(`Item count after filtering: ${mediaItems?.length}`);
    return mediaItems;
  }

  function filterByUploadStatus(mediaItems, filter) {
    log('Filtering by upload status');
    if (filter.uploadStatus === 'full') {
      mediaItems = mediaItems.filter((item) => item?.isPartialUpload === false);
    } else if (filter.uploadStatus === 'partial') {
      mediaItems = mediaItems.filter((item) => item?.isPartialUpload === true);
    }

    log(`Item count after filtering: ${mediaItems?.length}`);
    return mediaItems;
  }

  function filterArchived(mediaItems, filter) {
    log('Filtering archived');
    if (filter.archived === 'true') {
      mediaItems = mediaItems.filter((item) => item?.isArchived !== false);
    } else if (filter.archived === 'false') {
      mediaItems = mediaItems.filter((item) => item?.isArchived !== true);
    }

    log(`Item count after filtering: ${mediaItems?.length}`);
    return mediaItems;
  }

  // Process images in batches with yield points
  async function processBatch(items, processFn, batchSize = 5, core) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
      if (!core.isProcessRunning) return results;

      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((item) => {
          if (!core.isProcessRunning) return null;
          return processFn(item);
        })
      );
      results.push(...batchResults.filter(Boolean));
      // Yield to UI thread after each batch
      await defer(() => {});
    }
    return results;
  }

  // This being a usersctipt prevents it from using web workers
  // dHash implementation with non-blocking behavior
  async function generateImageHash(hashSize, blob, core) {
    if (!blob) return null;
    if (!core.isProcessRunning) return null;

    // Load image
    const img = new Image();
    const url = URL.createObjectURL(blob);
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    if (!core.isProcessRunning) {
      URL.revokeObjectURL(url);
      return null;
    }

    // Yield to UI thread after image loads
    await defer(() => {});

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = hashSize + 1;
    canvas.height = hashSize;

    // Draw the image scaled down
    ctx.drawImage(img, 0, 0, hashSize + 1, hashSize);
    URL.revokeObjectURL(url);

    if (!core.isProcessRunning) return null;

    // Get pixel data
    const imageData = ctx.getImageData(0, 0, hashSize + 1, hashSize);
    const pixels = imageData.data;

    // Yield to UI thread before processing pixels
    return await defer(() => {
      // Calculate the hash using differences between adjacent pixels
      let hash = 0n;

      for (let y = 0; y < hashSize; y++) {
        for (let x = 0; x < hashSize; x++) {
          if (!core.isProcessRunning) return null;

          // Position in the pixel array
          const pos = (y * (hashSize + 1) + x) * 4;
          const nextPos = (y * (hashSize + 1) + x + 1) * 4;

          // Convert to grayscale
          const gray1 = (pixels[pos] + pixels[pos + 1] + pixels[pos + 2]) / 3;
          const gray2 = (pixels[nextPos] + pixels[nextPos + 1] + pixels[nextPos + 2]) / 3;

          // Set bit if left pixel is brighter than right pixel
          if (gray1 > gray2) {
            hash |= 1n << BigInt(y * hashSize + x);
          }
        }
      }

      return hash;
    });
  }

  function hammingDistance(hash1, hash2) {
    if (hash1 === null || hash2 === null) return Infinity;

    let xor = hash1 ^ hash2;
    let distance = 0;

    while (xor !== 0n) {
      distance += Number(xor & 1n);
      xor >>= 1n;
    }

    return distance;
  }

  async function groupSimilarImages(imageHashes, similarityThreshold, hashSize = 8, core) {
    const groups = [];

    // Process in small batches to prevent UI blocking
    const batchSize = 10;
    for (let i = 0; i < imageHashes.length; i += batchSize) {
      const batch = imageHashes.slice(i, i + batchSize);
      for (const image of batch) {
        let addedToGroup = false;

        for (const group of groups) {
          if (!core.isProcessRunning) return groups;

          const groupHash = group[0].hash;
          const distance = hammingDistance(image.hash, groupHash);

          // Max distance for a 8x8 hash is 64
          const maxPossibleDistance = hashSize * hashSize;
          const similarity = 1 - distance / maxPossibleDistance;

          if (similarity >= similarityThreshold) {
            group.push(image);
            addedToGroup = true;
            break;
          }
        }

        if (!addedToGroup) {
          groups.push([image]);
        }
      }

      // Yield to UI thread after each batch
      await defer(() => {});
    }

    return groups.filter((group) => group.length > 1);
  }

  // Fetch image blobs with concurrency control
  async function fetchImageBlobs(mediaItems, maxConcurrency, imageHeight, core) {
    const fetchWithLimit = async (item, retries = 3) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        if (!core.isProcessRunning) return null;

        const url = item.thumb + `=h${imageHeight}`; // Resize image
        try {
          const response = await fetch(url, {
            cache: 'force-cache',
            credentials: 'include',
            signal: AbortSignal.timeout(10000), // fetch timeout 10s
          });

          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          if (!core.isProcessRunning) return null;

          const blob = await response.blob();
          return { ...item, blob };
        } catch (error) {
          if (attempt < retries) {
            log(`Attempt ${attempt} failed for ${item.mediaKey} (${error.message}). Retrying...`, 'error');
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // backoff
          } else {
            log(`Failed to fetch thumb ${item.mediaKey} after ${retries} attempts. Final error: ${error.message}`, 'error');
            return null;
          }
        }
      }
    };

    const results = [];
    const queue = [...mediaItems];

    // Process the queue with concurrency control
    const worker = async () => {
      while (queue.length > 0) {
        if (!core.isProcessRunning) return;

        const item = queue.shift();
        const result = await fetchWithLimit(item);
        if (result) results.push(result);
      }
    };

    // Start multiple workers to handle concurrent fetches
    const workers = Array.from({ length: maxConcurrency }, worker);
    await Promise.all(workers);

    return results;
  }

  // Calculate an appropriate hash size based on image height
  function calculateHashSize(imageHeight) {
    // Base hash size on the square root of the height
    // This provides a reasonable scaling factor
    const baseSize = Math.max(8, Math.floor(Math.sqrt(imageHeight) / 4));

    // Keep hash size as a power of 2 or other even number for efficient processing
    // Limiting to a reasonable maximum to prevent performance issues
    return Math.min(32, baseSize);
  }

  // Main function to filter similar media items
  async function filterSimilar(core, mediaItems, filter) {
    const maxConcurrentFetches = 50;
    const similarityThreshold = filter.similarityThreshold;
    const imageHeight = filter.imageHeight;
    const hashSize = calculateHashSize(imageHeight); // Dynamic hash size

    log('Fetching images');
    const itemsWithBlobs = await fetchImageBlobs(mediaItems, maxConcurrentFetches, imageHeight, core);
    if (!core.isProcessRunning) return [];

    log('Generating image hashes');
    // Process images in batches to prevent UI blocking
    const itemsWithHashes = await processBatch(
      itemsWithBlobs,
      async (item) => {
        if (!core.isProcessRunning) return null;
        const hash = await generateImageHash(hashSize, item.blob, core);
        return hash ? { ...item, hash } : null;
      },
      50, // Process 50 images per batch
      core
    );
    if (!core.isProcessRunning) return [];

    log('Grouping similar images');
    const groups = await groupSimilarImages(itemsWithHashes, similarityThreshold, hashSize, core);

    // Flatten the groups into a single array of items
    const flattenedGroups = groups.flat();

    log(`Found ${flattenedGroups.length} similar items across ${groups.length} groups`);
    return flattenedGroups;
  }

  class Core {
    constructor() {
      this.isProcessRunning = false;
      this.api = new Api();
    }

    async getAndFilterMedia(filter, source) {
      const mediaItems = await this.fetchMediaItems(source, filter);
      log(`Found items: ${mediaItems.length}`);
      if (!this.isProcessRunning || !mediaItems?.length) return mediaItems;

      const filteredItems = await this.applyFilters(mediaItems, filter, source);
      return filteredItems;
    }

    async fetchMediaItems(source, filter) {
      const sourceHandlers = {
        library: async () => {
          log('Reading library');
          return filter.dateType === 'uploaded' ? await this.getLibraryItemsByUploadDate(filter) : await this.getLibraryItemsByTakenDate(filter);
        },
        search: async () => {
          log('Reading search results');
          return await this.apiUtils.getAllSearchItems(filter.searchQuery);
        },
        trash: async () => {
          log('Getting trash items');
          return await this.apiUtils.getAllTrashItems();
        },
        lockedFolder: async () => {
          log('Getting locked folder items');
          return await this.apiUtils.getAllLockedFolderItems();
        },
        favorites: async () => {
          log('Getting favorite items');
          return await this.apiUtils.getAllFavoriteItems();
        },
        sharedLinks: async () => {
          log('Getting shared links');
          const sharedLinks = await this.apiUtils.getAllSharedLinks();
          if (!sharedLinks) {
            log('No shared links found', 'error');
            return [];
          }
          log(`Shared Links Found: ${sharedLinks.length}`);
          const sharedLinkItems = await Promise.all(
            sharedLinks.map(async (sharedLink) => {
              log('Getting shared link items');
              return await this.apiUtils.getAllMediaInSharedLink(sharedLink.linkId);
            })
          );
          return sharedLinkItems.flat();
        },
        albums: async () => {
          if (!filter.albumsInclude) {
            log('No target album!', 'error');
            throw new Error('no target album');
          }
          const albumMediaKeys = Array.isArray(filter.albumsInclude) ? filter.albumsInclude : [filter.albumsInclude];
          const albumItems = await Promise.all(
            albumMediaKeys.map(async (albumMediaKey) => {
              log('Getting album items');
              return await this.apiUtils.getAllMediaInAlbum(albumMediaKey);
            })
          );
          return albumItems.flat();
        },
      };

      const handler = sourceHandlers[source];
      if (!handler) {
        log(`Unknown source: ${source}`, 'error');
        return [];
      }

      const mediaItems = await handler();
      log('Source read complete');
      return mediaItems;
    }

    async applyFilters(mediaItems, filter, source) {
      let filteredItems = mediaItems;

      const filtersToApply = [
        {
          condition: source !== 'library' && (filter.lowerBoundaryDate || filter.higherBoundaryDate),
          method: () => filterByDate(filteredItems, filter),
        },
        {
          condition: filter.albumsExclude,
          method: async () => await this.excludeAlbumItems(filteredItems, filter),
        },
        {
          condition: filter.excludeShared,
          method: async () => await this.excludeSharedItems(filteredItems),
        },
        {
          condition: filter.owned,
          method: () => filterOwned(filteredItems, filter),
        },
        {
          condition: filter.uploadStatus,
          method: () => filterByUploadStatus(filteredItems, filter),
        },
        {
          condition: filter.archived,
          method: () => filterArchived(filteredItems, filter),
        },
        {
          condition: filter.favorite || filter.excludeFavorites,
          method: () => filterFavorite(filteredItems, filter),
        },
        {
          condition: filter.type,
          method: () => filterByMediaType(filteredItems, filter),
        },
      ];
      // filtering with basic filters
      let i = 0;
      do {
        const { condition, method } = filtersToApply[i];
        if (condition && filteredItems.length) {
          filteredItems = await method();
        }
        i++;
      } while (i < filtersToApply.length && filteredItems.length);

      // filtering with filters based on extended media info
      if (
        filteredItems.length &&
        (filter.space || filter.quality || filter.lowerBoundarySize || filter.higherBoundarySize || filter.fileNameRegex || filter.descriptionRegex)
      ) {
        filteredItems = await this.extendMediaItemsWithMediaInfo(filteredItems);

        const extendedFilters = [
          { condition: filter.fileNameRegex, method: () => fileNameFilter(filteredItems, filter) },
          { condition: filter.descriptionRegex, method: () => descriptionFilter(filteredItems, filter) },
          { condition: filter.space, method: () => spaceFilter(filteredItems, filter) },
          { condition: filter.quality, method: () => qualityFilter(filteredItems, filter) },
          {
            condition: filter.lowerBoundarySize || filter.higherBoundarySize,
            method: () => sizeFilter(filteredItems, filter),
          },
        ];

        i = 0;
        do {
          const { condition, method } = extendedFilters[i];
          if (condition && filteredItems.length) {
            filteredItems = await method();
          }
          i++;
        } while (i < extendedFilters.length && filteredItems.length);
      }

      if (filter.sortBySize && filteredItems.length) {
        filteredItems = await this.extendMediaItemsWithMediaInfo(filteredItems);
        filteredItems.sort((a, b) => (b.size || 0) - (a.size || 0));
      }

      // filtering by similarity
      if (filteredItems.length > 0 && filter.similarityThreshold) {
        filteredItems = filterSimilar(this, filteredItems, filter);
      }

      return filteredItems;
    }

    async excludeAlbumItems(mediaItems, filter) {
      const itemsToExclude = [];
      const albumMediaKeys = Array.isArray(filter.albumsExclude) ? filter.albumsExclude : [filter.albumsExclude];

      await Promise.all(
        albumMediaKeys.map(async (albumMediaKey) => {
          log('Getting album items to exclude');
          const excludedItems = await this.apiUtils.getAllMediaInAlbum(albumMediaKey);
          itemsToExclude.push(...excludedItems);
        })
      );

      log('Excluding album items');
      return mediaItems.filter((mediaItem) => !itemsToExclude.some((excludeItem) => excludeItem.dedupKey === mediaItem.dedupKey));
    }

    async excludeSharedItems(mediaItems) {
      log('Getting shared links items to exclude');
      const itemsToExclude = [];
      const sharedLinks = await this.apiUtils.getAllSharedLinks();

      await Promise.all(
        sharedLinks.map(async (sharedLink) => {
          const sharedLinkItems = await this.apiUtils.getAllMediaInSharedLink(sharedLink.linkId);
          itemsToExclude.push(...sharedLinkItems);
        })
      );

      log('Excluding shared items');
      return mediaItems.filter((mediaItem) => !itemsToExclude.some((excludeItem) => excludeItem.dedupKey === mediaItem.dedupKey));
    }

    async extendMediaItemsWithMediaInfo(mediaItems) {
      const mediaInfoData = await this.apiUtils.getBatchMediaInfoChunked(mediaItems);

      const extendedMediaItems = mediaItems.map((item) => {
        const matchingInfoItem = mediaInfoData.find((infoItem) => infoItem.mediaKey === item.mediaKey);
        return { ...item, ...matchingInfoItem };
      });
      return extendedMediaItems;
    }

    async getLibraryItemsByTakenDate(filter) {
      let source;
      if (filter.archived === 'true') {
        source = 'archive';
      } else if (filter.archived === 'false') {
        source = 'library';
      }

      let lowerBoundaryDate = new Date(filter.lowerBoundaryDate).getTime();
      let higherBoundaryDate = new Date(filter.higherBoundaryDate).getTime();

      lowerBoundaryDate = isNaN(lowerBoundaryDate) ? -Infinity : lowerBoundaryDate;
      higherBoundaryDate = isNaN(higherBoundaryDate) ? Infinity : higherBoundaryDate;

      const mediaItems = [];

      let nextPageId = null;

      if (Number.isInteger(lowerBoundaryDate || Number.isInteger(higherBoundaryDate)) && filter.intervalType === 'include') {
        let nextPageTimestamp = higherBoundaryDate !== Infinity ? higherBoundaryDate : null;
        do {
          if (!this.isProcessRunning) return;
          let mediaPage = await this.api.getItemsByTakenDate(nextPageTimestamp, source, nextPageId);
          nextPageId = mediaPage?.nextPageId;
          if (!mediaPage) break;
          nextPageTimestamp = mediaPage.lastItemTimestamp - 1;
          if (!mediaPage.items || mediaPage?.items?.length === 0) continue;
          mediaPage.items = mediaPage.items.filter((item) => item.timestamp >= lowerBoundaryDate && item.timestamp <= higherBoundaryDate);
          if (!mediaPage.items || mediaPage?.items?.length === 0) continue;
          log(`Found ${mediaPage?.items?.length} items`);
          mediaItems.push(...mediaPage.items);
        } while ((nextPageId && !nextPageTimestamp) || (nextPageTimestamp && nextPageTimestamp > lowerBoundaryDate));
      } else if (Number.isInteger(lowerBoundaryDate || Number.isInteger(higherBoundaryDate)) && filter.intervalType === 'exclude') {
        let nextPageTimestamp = null;
        do {
          if (!this.isProcessRunning) return;
          let mediaPage = await this.api.getItemsByTakenDate(nextPageTimestamp, source, nextPageId);
          nextPageId = mediaPage?.nextPageId;
          if (!mediaPage) break;
          nextPageTimestamp = mediaPage.lastItemTimestamp - 1;
          if (!mediaPage.items || mediaPage?.items?.length === 0) continue;
          mediaPage.items = mediaPage.items.filter((item) => item.timestamp < lowerBoundaryDate || item.timestamp > higherBoundaryDate);

          if (nextPageTimestamp > lowerBoundaryDate && nextPageTimestamp < higherBoundaryDate) {
            nextPageTimestamp = lowerBoundaryDate;
          } else {
            nextPageTimestamp = mediaPage.lastItemTimestamp - 1;
          }

          if (!mediaPage.items || mediaPage?.items?.length === 0) continue;

          log(`Found ${mediaPage?.items?.length} items`);
          mediaItems.push(...mediaPage.items);
        } while (nextPageId);
      } else {
        let nextPageTimestamp = null;
        do {
          if (!this.isProcessRunning) return;
          let mediaPage = await this.api.getItemsByTakenDate(nextPageTimestamp, source, nextPageId);
          nextPageId = mediaPage?.nextPageId;
          if (!mediaPage) break;
          nextPageTimestamp = mediaPage.lastItemTimestamp - 1;
          if (!mediaPage.items || mediaPage?.items?.length === 0) continue;
          log(`Found ${mediaPage?.items?.length} items`);
          mediaItems.push(...mediaPage.items);
        } while (nextPageId);
      }

      return mediaItems;
    }

    async getLibraryItemsByUploadDate(filter) {
      let lowerBoundaryDate = new Date(filter.lowerBoundaryDate).getTime();
      let higherBoundaryDate = new Date(filter.higherBoundaryDate).getTime();

      lowerBoundaryDate = isNaN(lowerBoundaryDate) ? -Infinity : lowerBoundaryDate;
      higherBoundaryDate = isNaN(higherBoundaryDate) ? Infinity : higherBoundaryDate;

      const mediaItems = [];

      let nextPageId = null;

      let skipTheRest = false;

      do {
        if (!this.isProcessRunning) return;
        let mediaPage = await this.api.getItemsByUploadedDate(nextPageId);
        const lastTimeStamp = mediaPage.items.at(-1).creationTimestamp;
        nextPageId = mediaPage?.nextPageId;
        if (!mediaPage) break;
        if (!mediaPage.items || mediaPage?.items?.length === 0) continue;
        if (filter.intervalType === 'include') {
          mediaPage.items = mediaPage.items.filter(
            (item) => item.creationTimestamp >= lowerBoundaryDate && item.creationTimestamp <= higherBoundaryDate
          );
          skipTheRest = lastTimeStamp < lowerBoundaryDate;
        } else if (filter.intervalType === 'exclude') {
          mediaPage.items = mediaPage.items.filter((item) => item.creationTimestamp < lowerBoundaryDate || item.creationTimestamp > higherBoundaryDate);
        }
        if (!mediaPage.items || mediaPage?.items?.length === 0) continue;
        log(`Found ${mediaPage?.items?.length} items`);
        mediaItems.push(...mediaPage.items);
      } while (nextPageId && !skipTheRest);

      return mediaItems;
    }

    preChecks(filter) {
      if (filter.fileNameRegex) {
        const isValid = isPatternValid(filter.fileNameRegex);
        if (isValid !== true) throw new Error(isValid);
      }
      if (filter.descriptionRegex) {
        const isValid = isPatternValid(filter.descriptionRegex);
        if (isValid !== true) throw new Error(isValid);
      }
      if (parseInt(filter.lowerBoundarySize) >= parseInt(filter.higherBoundarySize)) {
        throw new Error('Invalid Size Filter');
      }
    }

    async actionWithFilter(action, filter, source, targetAlbum, newTargetAlbumName, apiSettings) {
      try {
        this.preChecks(filter);
      } catch (error) {
        log(error, 'error');
        return;
      }

      this.isProcessRunning = true;
      // dispatch event to upate the ui without importing it
      document.dispatchEvent(new Event('change'));
      this.apiUtils = new ApiUtils(this, apiSettings || apiSettingsDefault);

      try {
        const startTime = new Date();
        const mediaItems = await this.getAndFilterMedia(filter, source, apiSettings);

        // Early exit if no items to process
        if (!mediaItems?.length) {
          log('No items to process');
          return;
        }

        // Exit if process was stopped externally
        if (!this.isProcessRunning) return;

        // Execute the appropriate action
        await this.executeAction(action, {
          mediaItems,
          source,
          targetAlbum,
          newTargetAlbumName,
          preserveOrder: Boolean(filter.similarityThreshold || filter.sortBySize),
        });

        log(`Task completed in ${timeToHHMMSS(new Date() - startTime)}`, 'success');
      } catch (error) {
        log(error.stack, 'error');
      } finally {
        this.isProcessRunning = false;
      }
    }

    async executeAction(action, params) {
      const { mediaItems, source, targetAlbum, newTargetAlbumName, preserveOrder } = params;
      log(`Items to process: ${mediaItems?.length}`);
      if (action.elementId === 'restoreTrash' || source === 'trash') await this.apiUtils.restoreFromTrash(mediaItems);
      if (action.elementId === 'unLock' || source === 'lockedFolder') await this.apiUtils.removeFromLockedFolder(mediaItems);
      if (action.elementId === 'lock') await this.apiUtils.moveToLockedFolder(mediaItems);
      if (action.elementId === 'toExistingAlbum') await this.apiUtils.addToExistingAlbum(mediaItems, targetAlbum, preserveOrder);
      if (action.elementId === 'toNewAlbum') await this.apiUtils.addToNewAlbum(mediaItems, newTargetAlbumName, preserveOrder);
      if (action.elementId === 'toTrash') await this.apiUtils.moveToTrash(mediaItems);
      if (action.elementId === 'toArchive') await this.apiUtils.sendToArchive(mediaItems);
      if (action.elementId === 'unArchive') await this.apiUtils.unArchive(mediaItems);
      if (action.elementId === 'toFavorite') await this.apiUtils.setAsFavorite(mediaItems);
      if (action.elementId === 'unFavorite') await this.apiUtils.unFavorite(mediaItems);
      if (action.elementId === 'copyDescFromOther') await this.apiUtils.copyDescriptionFromOther(mediaItems);
    }
  }

  const core = new Core();
  const apiUtils = new ApiUtils(core);

  // exposing api to be accesible globally
  unsafeWindow.gptkApi = new Api();
  unsafeWindow.gptkCore = core;
  unsafeWindow.gptkApiUtils = apiUtils;

  function updateUI() {
    function toggleVisibility(element, toggle) {
      const allDescendants = element.querySelectorAll('*');
      if (toggle) {
        element.style.display = 'block';
        for (const node of allDescendants) node.disabled = false;
      } else {
        element.style.display = 'none';
        for (const node of allDescendants) node.disabled = true;
      }
    }

    async function filterPreviewUpdate() {
      const previewElement = document.querySelector('.filter-preview span');
      try {
        const description = generateFilterDescription(getForm('.filters-form'));
        previewElement.innerText = description;
      } catch {
        previewElement.innerText = 'Failed to generate description';
      }
    }

    function isActiveTab(tabName) {
      return document.querySelector('input[name="source"]:checked').id === tabName;
    }

    function lockedFolderTabState() {
      const lockedFolderTab = document.getElementById('lockedFolder');
      if (!window.location.href.includes('lockedfolder')) {
        lockedFolderTab.disabled = true;
        lockedFolderTab.parentNode.title = 'To process items in the locked folder, you must open GPTK while in it';
      }
    }

    function updateActionButtonStates() {
      document.getElementById('unArchive').disabled = archivedExcluded;
      document.getElementById('toFavorite').disabled = favoritesOnly || isActiveTab('favorites');
      document.getElementById('unFavorite').disabled = favoritesExcluded;
      document.getElementById('toArchive').disabled = archivedOnly;
      document.getElementById('restoreTrash').disabled = !isActiveTab('trash');
      document.getElementById('toTrash').disabled = isActiveTab('trash');
      document.getElementById('lock').disabled = isActiveTab('lockedFolder');
      document.getElementById('unLock').disabled = !isActiveTab('lockedFolder');
      document.getElementById('copyDescFromOther').disabled = isActiveTab('trash');
    }

    function updateFilterVisibility() {
      const filterElements = {
        livePhotoType: document.querySelector('.type input[value=live]').parentNode,
        includeAlbums: document.querySelector('.include-albums'),
        owned: document.querySelector('.owned'),
        search: document.querySelector('.search'),
        favorite: document.querySelector('.favorite'),
        quality: document.querySelector('.quality'),
        size: document.querySelector('.size'),
        filename: document.querySelector('.filename'),
        description: document.querySelector('.description'),
        space: document.querySelector('.space'),
        excludeAlbums: document.querySelector('.exclude-albums'),
        uploadStatus: document.querySelector('.upload-status'),
        archive: document.querySelector('.archive'),
        excludeShared: document.querySelector('.exclude-shared'),
        excludeFavorite: document.querySelector('.exclude-favorites'),
      };

      // Default: hide all
      Object.values(filterElements).forEach((el) => toggleVisibility(el, false));

      // Conditions for showing filters based on the active tab.
      if (isActiveTab('albums')) {
        toggleVisibility(filterElements.includeAlbums, true);
      }
      if (['library', 'search', 'favorites'].some(isActiveTab)) {
        toggleVisibility(filterElements.owned, true);
        toggleVisibility(filterElements.uploadStatus, true);
        toggleVisibility(filterElements.archive, true);
      }
      if (isActiveTab('search')) {
        toggleVisibility(filterElements.search, true);
        toggleVisibility(filterElements.favorite, true);
      }
      if (!isActiveTab('trash')) {
        toggleVisibility(filterElements.livePhotoType, true);
        toggleVisibility(filterElements.quality, true);
        toggleVisibility(filterElements.size, true);
        toggleVisibility(filterElements.filename, true);
        toggleVisibility(filterElements.description, true);
        toggleVisibility(filterElements.space, true);
        if (!isActiveTab('lockedFolder')) {
          toggleVisibility(filterElements.excludeAlbums, true);
        }
        if (!isActiveTab('sharedLinks')) {
          toggleVisibility(filterElements.excludeShared, true);
        }
      }
      if (isActiveTab('library')) {
        toggleVisibility(filterElements.excludeFavorite, true);
      }
    }

    lockedFolderTabState();

    const filter = getForm('.filters-form');

    // console.log(filter);

    const favoritesOnly = filter.favorite === 'true';
    const favoritesExcluded = filter.excludeFavorites === 'true' || filter.favorite === 'false';
    const archivedOnly = filter.archived === 'true';
    const archivedExcluded = filter.archived === 'false';

    if (core.isProcessRunning) {
      disableActionBar(true);
      document.getElementById('stopProcess').style.display = 'block';
    } else {
      document.getElementById('stopProcess').style.display = 'none';
      disableActionBar(false);
      updateActionButtonStates();
    }

    updateFilterVisibility();
    filterPreviewUpdate();
  }

  // eslint-disable-next-line no-undef
  const version = `v${"2.10.0"}`;
  // eslint-disable-next-line no-undef
  const homepage = "https://github.com/xob0t/Google-Photos-Toolkit#readme";

  function htmlTemplatePrep(gptkMainTemplate) {
    return gptkMainTemplate.replace('%version%', version).replace('%homepage%', homepage);
  }

  function insertUi() {
    // for inserting html to work
    if (window.trustedTypes && window.trustedTypes.createPolicy) {
      window.trustedTypes.createPolicy('default', {
        createHTML: (string) => string,
      });
    }
    // html
    let buttonInsertLocation = '.J3TAe';
    if (window.location.href.includes('lockedfolder')) buttonInsertLocation = '.c9yG5b';
    document.querySelector(buttonInsertLocation).insertAdjacentHTML('afterbegin', buttonHtml);
    document.body.insertAdjacentHTML('afterbegin', htmlTemplatePrep(gptkMainTemplate));
    // css
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    baseListenersSetUp();
  }

  function showMainMenu() {
    const overlay = document.querySelector('.overlay');
    document.getElementById('gptk').style.display = 'flex';
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  function hideMainMenu() {
    const overlay = document.querySelector('.overlay');
    document.getElementById('gptk').style.display = 'none';
    overlay.style.display = 'none';
    document.body.style.overflow = 'visible';
  }

  function baseListenersSetUp() {
    document.addEventListener('change', updateUI);

    const gptkButton = document.getElementById('gptk-button');
    gptkButton.addEventListener('click', showMainMenu);
    const exitMenuButton = document.querySelector('#hide');
    exitMenuButton.addEventListener('click', hideMainMenu);
  }

  function getFromStorage(key) {
    if (typeof Storage !== 'undefined') {
      const userStorage = JSON.parse(localStorage.getItem(windowGlobalData.account)) || {};
      const storedData = userStorage[key];

      if (storedData) {
        console.log('Retrieved data from localStorage:', key);
        return storedData;
      } else {
        console.log('No data found in localStorage for key:', key);
        return null;
      }
    } else {
      console.log('Sorry, your browser does not support localStorage');
      return null;
    }
  }

  function addAlbums(albums) {
    function addAlbumsAsOptions(albums, albumSelects, addEmpty = false) {
      for (const albumSelect of albumSelects) {
        if (!albums?.length) {
          const option = document.createElement('option');
          option.textContent = 'No Albums';
          option.value = '';
          albumSelect.appendChild(option);
          continue;
        }
        for (const album of albums) {
          if (parseInt(album.itemCount) === 0 && !addEmpty) continue;
          const option = document.createElement('option');
          option.value = album.mediaKey;
          option.title = `Name: ${album.title}\nItems: ${album.itemCount}`;
          option.textContent = album.title;
          if (album.isShared) option.classList.add('shared');
          albumSelect.appendChild(option);
        }
      }
    }
    function emptySelects(albumSelects) {
      for (const albumSelect of albumSelects) {
        while (albumSelect.options.length > 0) {
          albumSelect.remove(0);
        }
      }
      updateUI();
    }
    const albumSelectsMultiple = document.querySelectorAll('.albums-select[multiple]');
    const albumSelectsSingle = document.querySelectorAll('.dropdown.albums-select');
    const albumSelects = [...albumSelectsMultiple, ...albumSelectsSingle];

    emptySelects(albumSelects);

    for (const select of albumSelectsSingle) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Select Album';
      select.appendChild(option);
    }

    addAlbumsAsOptions(albums, albumSelectsSingle, true);
    addAlbumsAsOptions(albums, albumSelectsMultiple, false);
  }

  const actions = [
    {
      elementId: 'toExistingAlbum',
      targetId: 'existingAlbum',
    },
    {
      elementId: 'toNewAlbum',
      targetId: 'newAlbumName',
    },
    { elementId: 'toTrash' },
    { elementId: 'restoreTrash' },
    { elementId: 'toArchive' },
    { elementId: 'unArchive' },
    { elementId: 'toFavorite' },
    { elementId: 'unFavorite' },
    { elementId: 'lock' },
    { elementId: 'unLock' },
    { elementId: 'copyDescFromOther' },
  ];

  function userConfirmation(action, filter, source) {
    function generateWarning(action, filter) {
      const filterDescription = generateFilterDescription(filter);
      const sourceHuman = document.querySelector('input[name="source"]:checked+label').textContent.trim();
      const actionElement = document.getElementById(action.elementId);
      const warning = [];
      warning.push(`Account: ${windowGlobalData.account}`);
      warning.push(`\nSource: ${sourceHuman}`);
      warning.push(`\n${filterDescription}`);
      warning.push(`\nAction: ${actionElement.title}`);
      return warning.join(' ');
    }
    const warning = generateWarning(action, filter);
    const confirmation = window.confirm(`${warning}\nProceed?`);
    if (!confirmation) return false;
    return true;
  }

  async function runAction(actionId) {
    const action = actions.find((action) => action.elementId === actionId);
    // get the target album if action has one
    let targetAlbum = null;
    let newTargetAlbumName = null;
    if (actionId === 'toExistingAlbum') {
      const albumMediaKey = document.getElementById(action?.targetId)?.value;
      targetAlbum = getFromStorage('albums').find((album) => album.mediaKey === albumMediaKey);
    } else {
      newTargetAlbumName = document.getElementById(action?.targetId)?.value;
    }
    // id of currently selected source element
    const source = document.querySelector('input[name="source"]:checked').id;

    // check filter validity
    const filtersForm = document.querySelector('.filters-form');
    if (!filtersForm.checkValidity()) {
      filtersForm.reportValidity();
      return;
    }

    // Parsed filter object
    const filter = getForm('.filters-form');
    // Parsed settings object
    const apiSettings = getForm('.settings-form');
    if (!userConfirmation(action, filter)) return;

    // Disable action bar while process is running
    disableActionBar(true);
    // add class to indicate which action is running
    document.getElementById(actionId).classList.add('running');
    // Run it
    await core.actionWithFilter(action, filter, source, targetAlbum, newTargetAlbumName, apiSettings);
    // remove 'running' class
    document.getElementById(actionId).classList.remove('running');
    // Update the ui
    updateUI();
    // force show main action bar
    showActionButtons();
  }

  function showExistingAlbumContainer() {
    document.querySelector('.action-buttons').style.display = 'none';
    document.querySelector('.to-existing-container').style.display = 'flex';
  }

  function showNewAlbumContainer() {
    document.querySelector('.action-buttons').style.display = 'none';
    document.querySelector('.to-new-container').style.display = 'flex';
  }

  function showActionButtons() {
    document.querySelector('.action-buttons').style.display = 'flex';
    document.querySelector('.to-existing-container').style.display = 'none';
    document.querySelector('.to-new-container').style.display = 'none';
  }

  function actionsListenersSetUp() {
    for (const action of actions) {
      const actionElement = document.getElementById(action.elementId);
      if (actionElement.type === 'button') {
        actionElement.addEventListener('click', async function (event) {
          event.preventDefault();
          await runAction(actionElement.id);
        });
      } else if (actionElement.tagName.toLowerCase() === 'form') {
        actionElement.addEventListener('submit', async function (event) {
          event.preventDefault();
          await runAction(actionElement.id);
        });
      }
    }

    const showExistingAlbumForm = document.querySelector('#showExistingAlbumForm');
    showExistingAlbumForm.addEventListener('click', showExistingAlbumContainer);

    const showNewAlbumForm = document.querySelector('#showNewAlbumForm');
    showNewAlbumForm.addEventListener('click', showNewAlbumContainer);

    const returnButtons = document.querySelectorAll('.return');
    for (const button of returnButtons) {
      button?.addEventListener('click', showActionButtons);
    }
  }

  function saveToStorage(key, value) {
    if (typeof Storage !== 'undefined') {
      let userStorage = JSON.parse(localStorage.getItem(windowGlobalData.account)) || {};
      userStorage[key] = value;
      localStorage.setItem(windowGlobalData.account, JSON.stringify(userStorage));
      console.log('Data saved to localStorage:', key);
    } else {
      console.log('Sorry, your browser does not support localStorage');
    }
  }

  function albumSelectsControlsSetUp() {
    const selectAllButtons = document.querySelectorAll('[name="selectAll"]');
    for (const selectAllButton of selectAllButtons) {
      selectAllButton?.addEventListener('click', selectAllAlbums);
    }

    const selectSharedButtons = document.querySelectorAll('[name="selectShared"]');
    for (const selectSharedButton of selectSharedButtons) {
      selectSharedButton?.addEventListener('click', selectSharedAlbums);
    }

    const selectNotSharedButtons = document.querySelectorAll('[name="selectNonShared"]');
    for (const selectNotSharedButton of selectNotSharedButtons) {
      selectNotSharedButton?.addEventListener('click', selectNotSharedAlbums);
    }

    const resetAlbumSelectionButtons = document.querySelectorAll('[name="resetAlbumSelection"]');
    for (const resetAlbumSelectionButton of resetAlbumSelectionButtons) {
      resetAlbumSelectionButton?.addEventListener('click', resetAlbumSelection);
    }

    const refreshAlbumsButtons = document.querySelectorAll('.refresh-albums');
    for (const refreshAlbumsButton of refreshAlbumsButtons) {
      refreshAlbumsButton?.addEventListener('click', refreshAlbums);
    }
  }

  function selectAllAlbums() {
    let parent = this.parentNode.parentNode;
    let closestSelect = parent.querySelector('select');
    for (const option of closestSelect.options) {
      if (option.value) option.selected = true;
    }
    updateUI();
  }

  function selectSharedAlbums() {
    updateUI();
    let parent = this.parentNode.parentNode;
    let closestSelect = parent.querySelector('select');
    for (const option of closestSelect.options) {
      if (option.value) option.selected = option.classList.contains('shared');
    }
    updateUI();
  }

  function selectNotSharedAlbums() {
    let parent = this.parentNode.parentNode;
    let closestSelect = parent.querySelector('select');
    for (const option of closestSelect.options) {
      if (option.value) option.selected = !option.classList.contains('shared');
    }
    updateUI();
  }

  function resetAlbumSelection() {
    let parent = this.parentNode.parentNode;
    let closestSelect = parent.querySelector('select');
    for (const option of closestSelect.options) option.selected = false;
    updateUI();
  }

  async function refreshAlbums() {
    // ugly
    core.isProcessRunning = true;
    let albums = null;
    try {
      albums = await apiUtils.getAllAlbums();
      addAlbums(albums);
      saveToStorage('albums', albums);
      log('Albums Refreshed');
    } catch (e) {
      log(`Error refreshing albums ${e}`, 'error');
    }
    core.isProcessRunning = false;
    updateUI();
  }

  function controlButttonsListeners() {
    const clearLogButton = document.getElementById('clearLog');
    clearLogButton.addEventListener('click', clearLog);
    const stopProcessButton = document.getElementById('stopProcess');
    stopProcessButton.addEventListener('click', stopProcess);
  }

  function clearLog() {
    const logContainer = document.getElementById('logArea');
    const logElements = Array.from(logContainer.childNodes);
    for (const logElement of logElements) {
      logElement.remove();
    }
  }

  function stopProcess() {
    log('Stopping the process');
    core.isProcessRunning = false;
  }

  function advancedSettingsListenersSetUp() {
    function saveApiSettings(event) {
      event.preventDefault();

      const userInptSettings = getForm('.settings-form');

      // Save values to localStorage
      saveToStorage('apiSettings', userInptSettings);
      log('Api settings saved');
    }

    function restoreApiDefaults() {
      // Save default values to localStorage
      saveToStorage('apiSettings', apiSettingsDefault);

      // Update the form with default values
      maxConcurrentSingleApiReqInput.value = apiSettingsDefault.maxConcurrentSingleApiReq;
      maxConcurrentBatchApiReqInput.value = apiSettingsDefault.maxConcurrentBatchApiReq;
      operationSizeInput.value = apiSettingsDefault.operationSize;
      lockedFolderOpSizeInput.value = apiSettingsDefault.lockedFolderOpSize;
      infoSizeInput.value = apiSettingsDefault.infoSize;
      log('Default api settings restored');
    }
    const maxConcurrentSingleApiReqInput = document.querySelector('input[name="maxConcurrentSingleApiReq"]');
    const maxConcurrentBatchApiReqInput = document.querySelector('input[name="maxConcurrentBatchApiReq"]');
    const operationSizeInput = document.querySelector('input[name="operationSize"]');
    const lockedFolderOpSizeInput = document.querySelector('input[name="lockedFolderOpSize"]');
    const infoSizeInput = document.querySelector('input[name="infoSize"]');
    const defaultButton = document.querySelector('button[name="default"]');
    const settingsForm = document.querySelector('.settings-form');

    const restoredSettings = getFromStorage('apiSettings');

    maxConcurrentSingleApiReqInput.value =
      restoredSettings?.maxConcurrentSingleApiReq || apiSettingsDefault.maxConcurrentSingleApiReq;
    maxConcurrentBatchApiReqInput.value =
      restoredSettings?.maxConcurrentBatchApiReq || apiSettingsDefault.maxConcurrentBatchApiReq;
    operationSizeInput.value = restoredSettings?.operationSize || apiSettingsDefault.operationSize;
    lockedFolderOpSizeInput.value = restoredSettings?.lockedFolderOpSize || apiSettingsDefault.lockedFolderOpSize;
    infoSizeInput.value = restoredSettings?.infoSize || apiSettingsDefault.infoSize;

    // Add event listener for form submission
    settingsForm.addEventListener('submit', saveApiSettings);
    // Add event listener for "Default" button click
    defaultButton.addEventListener('click', restoreApiDefaults);
  }

  async function filterListenersSetUp() {
    function resetDateInput() {
      let parent = this.parentNode;
      let closestSelect = parent.querySelector('input');
      closestSelect.value = '';
      updateUI();
    }
    function toggleClicked() {
      this.classList.add('clicked');
      setTimeout(() => {
        this.classList.remove('clicked');
      }, 500);
    }

    function resetAllFilters() {
      document.querySelector('.filters-form').reset();
      updateUI();
    }

    const resetDateButtons = document.querySelectorAll('[name="dateReset"]');
    for (const resetButton of resetDateButtons) {
      resetButton?.addEventListener('click', resetDateInput);
    }

    // reset all filters button

    const filterResetButton = document.querySelector('#filterResetButton');
    filterResetButton.addEventListener('click', resetAllFilters);

    // date reset button animation
    const dateResets = document.querySelectorAll('.date-reset');
    for (const reset of dateResets) {
      reset?.addEventListener('click', toggleClicked);
    }
  }

  function registerMenuCommand() {
    // Register a new menu command
    // eslint-disable-next-line no-undef
    GM_registerMenuCommand('Open GPTK window', function () {
      showMainMenu();
    });
  }

  async function initUI() {
    registerMenuCommand();
    insertUi();
    actionsListenersSetUp();
    filterListenersSetUp();
    controlButttonsListeners();
    albumSelectsControlsSetUp();
    advancedSettingsListenersSetUp();
    updateUI();

    const cachedAlbums = getFromStorage('albums');
    if (cachedAlbums) {
      log('Cached Albums Restored');
      addAlbums(cachedAlbums);
    }

    // confirm exit if process is running
    window.addEventListener('beforeunload', function (e) {
      if (unsafeWindow.gptkCore.isProcessRunning) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  initUI();

})();
