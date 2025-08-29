// This file mocks the GPTK API objects that our userscript depends on.
// In the test, this will be injected AFTER the GPTK button is visible
// to prove that our script doesn't rely on the API being available immediately.

window.unsafeWindow.gptkApi = {
  getItemInfo: () => Promise.resolve({ savedToYourPhotos: true }),
  createAlbum: () => Promise.resolve('newAlbumId'),
};

window.unsafeWindow.gptkApiUtils = {
  getAllAlbums: () => Promise.resolve([
    { mediaKey: 'albumId1', title: 'Test Album 1', itemCount: 5 },
    { mediaKey: 'albumId2', title: 'Test Album 2', itemCount: 10 },
  ]),
  addToExistingAlbum: () => Promise.resolve(),
};

window.unsafeWindow.gptkCore = {
  isProcessRunning: false,
};

console.log('Mock GPTK API has been injected.');
