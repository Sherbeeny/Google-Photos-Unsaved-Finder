// This file mocks the WIZ_global_data object that the GPTK userscript depends on.
// In the real Google Photos environment, this object contains authentication tokens and other session data.
// For our test harness, we can provide plausible-looking dummy data.

window.WIZ_global_data = {
  // rapt: Used for locked folder requests. Can be a dummy string.
  Dbw5Ud: "dummy_rapt_token",

  // account: The user's email or account ID.
  oPEP7c: "test.user@example.com",

  // f.sid: A session ID.
  FdrFJe: "dummy_session_id",

  // bl: Another session or build-related token.
  cfb2h: "dummy_bl_token",

  // path: The API path.
  eptZe: "/_/PhotosUi/data/",

  // at: An authentication token. This is the most critical one.
  SNlM0e: "dummy_at_token"
};

// This file mocks the WIZ_global_data object that the GPTK userscript depends on.
// In the real Google Photos environment, this object contains authentication tokens and other session data.
// For our test harness, we can provide plausible-looking dummy data.

window.WIZ_global_data = {
  // rapt: Used for locked folder requests. Can be a dummy string.
  Dbw5Ud: "dummy_rapt_token",

  // account: The user's email or account ID.
  oPEP7c: "test.user@example.com",

  // f.sid: A session ID.
  FdrFJe: "dummy_session_id",

  // bl: Another session or build-related token.
  cfb2h: "dummy_bl_token",

  // path: The API path.
  eptZe: "/_/PhotosUi/data/",

  // at: An authentication token. This is the most critical one.
  SNlM0e: "dummy_at_token"
};

// This file intentionally left blank. The polyfill is handled in the test.
