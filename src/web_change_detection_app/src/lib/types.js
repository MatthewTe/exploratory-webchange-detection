/**
 * @typedef {import("postgres").Parameter} Parameter
 */

/**
 * @typedef {Object} IWebsite
 * @property {string} id - The website's ID.
 * @property {string} name - The name of the website.
 * @property {string} url - The URL of the website.
 * @property {string} archive_period - The archive period of the website.
 */

/**
 * @typedef {Object} ISnapshot
 * @property {string=} [id]
 * @property {string} extracted_dt
 * @property {string} static_dir_root
 * @property {string | Parameter} website
 */