import axios from "axios";

// Function to fetch post data by URI
export async function fetchPost(uri: string) {
    try {
        // Fetch the HTML content from the URI
        const response = await axios.get(uri);
        const html = response.data;

        // Parse the HTML to extract the post content
        const BeautifulDom = require('beautiful-dom');
        const dom = new BeautifulDom(html);
        const post = dom.getElementById('bsky_post_text').textContent;
        // Check if post has lang="en"
        const langs = dom.getElementsByTagName('noscript').map((el: any) => el.innerHTML);
        const hasEnLang = langs.some((lang: string) => lang.includes('lang="en"'));



        return { post, hasEnLang, html };
    } catch (error) {
        return { post: undefined, hasEnLang: false };
    }
}
