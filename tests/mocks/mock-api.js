// This file contains sanitized, hand-crafted mock data for Jest integration tests.

export const mockApi = {
  // Mock response for getAlbums (rpcid: Z5xsfc)
  getAlbums: {
    rpcid: 'Z5xsfc',
    response: `)]}'\n\n${JSON.stringify([["wrb.fr", "Z5xsfc", JSON.stringify([
      [
        ['AF1Qip_mock_album_key_1', ['https://example.com/mock-thumb-1.jpg', 800, 600], null, null, null, ['owner-id-1'], null, null, null, { '72930366': [4, 'Test Album 1', [], 10, true] }],
        ['AF1Qip_mock_album_key_2', ['https://example.com/mock-thumb-2.jpg', 1024, 768], null, null, null, ['owner-id-1'], null, null, null, { '72930366': [4, 'Test Album 2', [], 5, true] }],
      ],
      null // nextPageId
    ])]]])}`
  },

  // Mock response for getAlbumPage (rpcid: snAcKc)
  getAlbumPage: {
    rpcid: 'snAcKc',
    response: `)]}'\n\n${JSON.stringify([["wrb.fr", "snAcKc", JSON.stringify([
      null,
      [
        ['AF1Qip_mock_item_key_1', ['https://example.com/item-thumb-1.jpg', 800, 600], 1443352954000, 'dedup-key-1'],
        ['AF1Qip_mock_item_key_2', ['https://example.com/item-thumb-2.jpg', 800, 600], 1443352955000, 'dedup-key-2'],
      ],
      null, // nextPageId
      ['AF1Qip_mock_album_key_1', 'Test Album 1', null, null, null, { 'name': 'Mock User' }]
    ])]]])}`
  },

  // Mock response for getItemInfoExt (rpcid: fDcn4b)
  getItemInfoExt: {
    rpcid: 'fDcn4b',
    // In a real scenario, we'd map item keys to responses. For this test, one response is enough.
    // This item is "not saved" because it has a value in the array at index 12.
    response: `)]}'\n\n${JSON.stringify([["wrb.fr", "fDcn4b", JSON.stringify(
        [[['AF1Qip_mock_item_key_1'], null, 'item1.jpg', 1443352954000, null, 15000, 800, 600, null, null, null, 'dedup-key-1', [[20]], null, null, null, null, null, null, [], null, null, null, null, null, null, null, null, { 'name': 'Mock User' }, null, [1, 10000, 2], null]]
    )]]])}`
  }
};
