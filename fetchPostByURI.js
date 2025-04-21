"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPost = fetchPost;
const axios_1 = __importDefault(require("axios"));
// Function to fetch post data by URI
async function fetchPost(uri) {
    try {
        // Fetch the HTML content from the URI
        const response = await axios_1.default.get(uri);
        const html = response.data;
        // Parse the HTML to extract the post content
        const BeautifulDom = require('beautiful-dom');
        const dom = new BeautifulDom(html);
        const post = dom.getElementById('bsky_post_text').textContent;
        // Check if post has lang="en"
        const langs = dom.getElementsByTagName('noscript').map((el) => el.innerHTML);
        const hasEnLang = langs.some((lang) => lang.includes('lang="en"'));
        return { post, hasEnLang, html };
    }
    catch (error) {
        return { post: undefined, hasEnLang: false };
    }
}
