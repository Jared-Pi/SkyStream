"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const ws = new ws_1.default(`wss://jetstream2.us-east.bsky.network/subscribe?wantedCollections=app.bsky.feed.post`);
ws.on('error', console.error);
ws.on('open', () => {
    console.log(`Connected.`);
});
ws.on('close', () => {
    console.log(`Disconnected`);
    process.exit(0);
});
let msgCount = 0;
ws.on('message', (data) => {
    var _a, _b;
    if (msgCount < 3) {
        // Parse the message data as JSON
        const message = JSON.parse(data.toString());
        // Check if the message has the expected structure
        if ((message === null || message === void 0 ? void 0 : message.kind) === "commit") {
            // Safely extract relevant fields
            const postDid = message.did;
            const postRkey = message.commit.rkey;
            const postCid = message.commit.cid;
            const postText = (_a = message.commit.record) === null || _a === void 0 ? void 0 : _a.text;
            const postLangs = ((_b = message.commit.record) === null || _b === void 0 ? void 0 : _b.langs) || [];
            // Extract tags from the post text using regex
            const tags = (postText === null || postText === void 0 ? void 0 : postText.match(/#\w+/g)) || [];
            if (postLangs.includes('en') && tags.length > 0) {
                // Log the post's details
                console.log(`Received post (${msgCount + 1}):`);
                console.log(`DID: ${postDid}`);
                console.log(`Rkey: ${postRkey}`);
                console.log(`CID: ${postCid}`);
                console.log(`Languages: ${postLangs.join(", ")}`);
                console.log(`Text: ${postText}`);
                console.log(`Tags: ${tags.join(", ")}`);
                console.log('---'); // Separator for readability
                msgCount++;
            }
        }
    }
    else {
        ws.close();
    }
});
