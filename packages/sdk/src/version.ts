/** Mirrors package.json; a test keeps the two in sync. */
export const SDK_VERSION = "0.1.3";

/** Sent on every Iris request so Circle can attribute traffic. Browsers drop the header silently. */
export const LUMENLINE_SDK_USER_AGENT = `lumenline-sdk/${SDK_VERSION}`;
