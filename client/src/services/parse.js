import Parse from 'parse';

// Back4App Parse Server configuration
// Application ID and JavaScript Key are safe for client-side use.
// NEVER expose the Master Key in frontend code.
Parse.initialize(
  "z0erd9pONNgZ4tByrY1zJmTEcSCX4zVKRsHS8r2v", // Application ID
  "DgTFn1wsAS6HL680HqFKlSzTiQAgTkrkscZbRM6Y"  // JavaScript Key
);
Parse.serverURL = 'https://parseapi.back4app.com/';

export { Parse };
