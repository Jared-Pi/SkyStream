import WebSocket from "ws";
import * as fs from 'fs';

interface TagData {
    tag: string;
    uris: Set<string>;
    engagement: number;
}

class skyClient {
    private ws: WebSocket;
    private receivedPosts: Set<string>;
    private trendingTags: Map<string, TagData>;

    constructor(url: string) {
        this.ws = new WebSocket(url);
        this.receivedPosts = new Set<string>();
        this.trendingTags = new Map<string, TagData>();

        this.ws.on('error', console.error);
        this.ws.on('open', this.onOpen.bind(this));
        this.ws.on('close', this.onClose.bind(this));
        this.ws.on('message', this.onMessage.bind(this));

        // Log trending tags every 5 seconds
        setInterval(this.logTrendingTags.bind(this), 5000);
    }

    private onOpen() {
        console.log(`\nConnected.\n`);
    }

    private onClose() {
        console.log(`\nDisconnected.\n`);
    }

    private async onMessage(data: WebSocket.Data) {
        const message = JSON.parse(data.toString());
        const operation = message?.commit?.operation;
        const collection = message?.commit?.collection;
        const postDid = message?.did;
        const postRkey = message?.commit?.rkey;
        const postText = message?.commit?.record?.text;
        const tags = postText?.match(/#\w+/g)?.map((tag: string) => tag.toLowerCase()) || [];
        const postLangs = message?.commit?.record?.langs || [];

        if (operation === 'create') {
            const postURI = `${postDid}/${postRkey}`;
            if (!this.receivedPosts.has(postURI)) {
                this.receivedPosts.add(postURI);

                if (collection === 'app.bsky.feed.post' && message?.commit?.record?.reply == null && postLangs.includes('en') && tags.length > 0) {
                    this.handlePost(postURI, tags);
                } else if (collection === 'app.bsky.feed.post' && message?.commit?.record?.reply != null) {
                    this.handleReply(postURI);
                } else if (collection === 'app.bsky.feed.like') {
                    this.handleLike(postURI);
                }
            }
        }
    }

    private handlePost(postURI: string, tags: string[]) {
        tags.forEach(tag => {
            if (!this.trendingTags.has(tag)) {
                this.trendingTags.set(tag, { tag: tag, uris: new Set<string>(), engagement: 1 });
            }
            const tagData = this.trendingTags.get(tag);
            if (tagData) {
                tagData.uris.add(postURI);
                tagData.engagement++;
            }
        });
        const receivedPosts = JSON.parse(fs.readFileSync('receivedPosts.json', 'utf8') || '[]');
        receivedPosts.push({ postURI, tags });
        fs.writeFileSync('receivedPosts.json', JSON.stringify(receivedPosts, null, 2));
    }

    private handleReply(postURI: string) {
        this.updateEngagement(postURI);
    }

    private handleLike(postURI: string) {
        this.updateEngagement(postURI);
    }

    private updateEngagement(postURI: string) {
        const receivedPosts = JSON.parse(fs.readFileSync('receivedPosts.json', 'utf8') || '[]');
        const post = receivedPosts.find((p: any) => p.postURI === postURI);

        if (post) {
            post.tags.forEach((tag: string) => {
                const tagData = this.trendingTags.get(tag);
                if (tagData) {
                    tagData.engagement++;
                }
            });
        }
    }

    private async logTrendingTags() {
        const sortedTags = Array.from(this.trendingTags.values()).sort((a, b) => b.engagement - a.engagement);
        const limitedTags = sortedTags.slice(0, 25).map(tagData => ({
            tag: tagData.tag,
            engagement: tagData.engagement
        }));

        console.clear();
        console.log("Trending Tags:", limitedTags);

        // Write the trending tags data to a JSON file
        fs.writeFileSync('trendingTags.json', JSON.stringify(limitedTags, null, 2));
    }
}

const sClient = new skyClient(`wss://jetstream2.us-west.bsky.network/subscribe`);
