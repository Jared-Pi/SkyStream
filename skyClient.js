"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Write `startTime` to a JSON file
const startTime = new Date().toISOString();
const startTimeFilePath = path.join(__dirname, "startTime.json");
fs.writeFileSync(startTimeFilePath, JSON.stringify({ startTime }), "utf-8");
class skyClient {
    constructor(url) {
        this.ws = new ws_1.default(url);
        this.receivedPosts = new Set();
        this.trendingTags = new Map();
        this.ws.on('error', console.error);
        this.ws.on('open', this.onOpen.bind(this));
        this.ws.on('close', this.onClose.bind(this));
        this.ws.on('message', this.onMessage.bind(this));
        // Log trending tags every 5 seconds
        setInterval(this.logTrendingTags.bind(this), 5000);
    }
    onOpen() {
        console.log(`\nConnected.\n`);
    }
    onClose() {
        console.log(`\nDisconnected.\n`);
    }
    async onMessage(data) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        const message = JSON.parse(data.toString());
        const operation = (_a = message === null || message === void 0 ? void 0 : message.commit) === null || _a === void 0 ? void 0 : _a.operation;
        const collection = (_b = message === null || message === void 0 ? void 0 : message.commit) === null || _b === void 0 ? void 0 : _b.collection;
        const postDid = message === null || message === void 0 ? void 0 : message.did;
        const postRkey = (_c = message === null || message === void 0 ? void 0 : message.commit) === null || _c === void 0 ? void 0 : _c.rkey;
        const postText = (_e = (_d = message === null || message === void 0 ? void 0 : message.commit) === null || _d === void 0 ? void 0 : _d.record) === null || _e === void 0 ? void 0 : _e.text;
        const tags = ((_f = postText === null || postText === void 0 ? void 0 : postText.match(/#\w+/g)) === null || _f === void 0 ? void 0 : _f.map((tag) => tag.toLowerCase())) || [];
        const postLangs = ((_h = (_g = message === null || message === void 0 ? void 0 : message.commit) === null || _g === void 0 ? void 0 : _g.record) === null || _h === void 0 ? void 0 : _h.langs) || [];
        if (operation === 'create') {
            const postURI = `${postDid}/${postRkey}`;
            if (!this.receivedPosts.has(postURI)) {
                this.receivedPosts.add(postURI);
                if (collection === 'app.bsky.feed.post' && ((_k = (_j = message === null || message === void 0 ? void 0 : message.commit) === null || _j === void 0 ? void 0 : _j.record) === null || _k === void 0 ? void 0 : _k.reply) == null && postLangs.includes('en') && tags.length > 0) {
                    this.handlePost(postURI, tags);
                }
                else if (collection === 'app.bsky.feed.post' && ((_m = (_l = message === null || message === void 0 ? void 0 : message.commit) === null || _l === void 0 ? void 0 : _l.record) === null || _m === void 0 ? void 0 : _m.reply) != null) {
                    this.handleReply(postURI);
                }
                else if (collection === 'app.bsky.feed.like') {
                    this.handleLike(postURI);
                }
            }
        }
    }
    handlePost(postURI, tags) {
        tags.forEach(tag => {
            if (!this.trendingTags.has(tag)) {
                this.trendingTags.set(tag, { tag: tag, uris: new Set(), engagement: 1 });
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
    handleReply(postURI) {
        this.updateEngagement(postURI);
    }
    handleLike(postURI) {
        this.updateEngagement(postURI);
    }
    updateEngagement(postURI) {
        const receivedPosts = JSON.parse(fs.readFileSync('receivedPosts.json', 'utf8') || '[]');
        const post = receivedPosts.find((p) => p.postURI === postURI);
        if (post) {
            post.tags.forEach((tag) => {
                const tagData = this.trendingTags.get(tag);
                if (tagData) {
                    tagData.engagement++;
                }
            });
        }
    }
    async logTrendingTags() {
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
