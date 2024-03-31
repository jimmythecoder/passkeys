import { UAParser } from "ua-parser-js";

/**
 * Generate a identifier for the user agent without any spaces e.g. "Windows-Chrome"
 * @returns {string} The identifier string of the user agent
 */
export function getUserAgentIdentifier() {
    const parser = new UAParser();
    const ua = parser.getResult();

    return `${ua.os.name}-${ua.browser.name}`.replaceAll(" ", "");
}
