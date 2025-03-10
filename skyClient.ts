import WebSocket from "ws";
import mongoose from 'mongoose';

interface TagData {
    tag: string;
    uris: Set<string>;
    engagement: number;
}

// MongoDB Schema for Tags
const tagSchema = new mongoose.Schema({
    tag: { type: String, required: true, unique: true },
    engagement: { type: Number, required: true }
});

// Create a Mongoose model
const TagModel = mongoose.model('trending', tagSchema);

class skyClient {
    private ws: WebSocket;
    private receivedPosts: Set<string>;
    private trendingTags: Map<string, TagData>;

    constructor(url: string) {
        this.ws = new WebSocket(url);
        this.receivedPosts = new Set<string>();
        this.trendingTags = new Map<string, TagData>();

        // Connect to MongoDB
        this.connectToMongoDB();

        this.ws.on('error', console.error);
        this.ws.on('open', this.onOpen.bind(this));
        this.ws.on('close', this.onClose.bind(this));
        this.ws.on('message', this.onMessage.bind(this));

        // Log trending tags every 10 seconds
        setInterval(this.logTrendingTags.bind(this), 10000);
    }

    private async connectToMongoDB() {
        try {
            await mongoose.connect('mongodb://localhost:27017/skystream', {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 5000,
                connectTimeoutMS: 5000,
            });
            console.log('Connected to MongoDB');
        } catch (error) {
            console.error('MongoDB connection error:', error);
            process.exit(1);
        }
    }

    private onOpen() {
        console.log(`\nConnected.\n`);
    }

    private onClose() {
        console.log(`\nDisconnected.\n`);
        mongoose.connection.close(); // Close MongoDB connection
        process.exit(0);
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
    }

    private handleReply(postURI: string) {
        this.updateEngagement(postURI);
    }

    private handleLike(postURI: string) {
        this.updateEngagement(postURI);
    }

    private updateEngagement(postURI: string) {
        this.trendingTags.forEach(tagData => {
            if (tagData.uris.has(postURI)) {
                tagData.engagement++;
            }
        });
    }

    private async logTrendingTags() {
        const sortedTags = Array.from(this.trendingTags.values()).sort((a, b) => b.engagement - a.engagement);
        const limitedTags = sortedTags.slice(0, 10).map(tagData => ({
            tag: tagData.tag,
            engagement: tagData.engagement
        }));

        console.clear();
        console.log("Trending Tags:", limitedTags);

        try {
            for (const tagData of limitedTags) {
                // Upsert the tag data (update if exists, insert if not)
                await TagModel.findOneAndUpdate(
                    { tag: tagData.tag }, // Filter by tag
                    { engagement: tagData.engagement }, // Update engagement
                    { upsert: true, new: true } // Upsert option
                );
            }
        } catch (error) {
            console.error('MongoDB update error:', error);
        }
    }

    public getTrendingTags(): TagData[] {
        return Array.from(this.trendingTags.values()).sort((a, b) => b.engagement - a.engagement);
    }
}

const sClient = new skyClient(`wss://jetstream2.us-west.bsky.network/subscribe`);