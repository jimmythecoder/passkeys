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

/**
 *
 * @param date ISO date string
 * @returns date formatted as a string
 */
export function dateFormat(date: string) {
    return new Date(date).toLocaleDateString();
}

export function daysAgo(date: string) {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}
