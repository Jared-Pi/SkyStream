"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const ws = new ws_1.default(`wss://jetstream2.us-west.bsky.network/subscribe`);
// Object to store tags and their counts
const tagCounts = {};
const receivedPosts = new Set();
function extractDidAndRkey(uri) {
    const match = uri.match(/at:\/\/(did:plc:[^\/]+)\/app\.bsky\.feed\.post\/([^\/]+)/);
    if (match) {
        return { did: match[1], rkey: match[2] };
    }
    return undefined;
}
function constructURI(did, rkey) {
    return `${did}/${rkey}`;
}
ws.on('error', console.error);
ws.on('open', () => {
    console.log(`\nConnected.\n`);
});
ws.on('close', () => {
    console.log(`\nDisconnected.\n`);
    process.exit(0);
});
let msgCount = 0;
ws.on('message', async (data) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
    if (msgCount < 30) {
        // Parse the message data as JSON
        const message = JSON.parse(data.toString());
        // Extract relevant fields
        const operation = (_a = message === null || message === void 0 ? void 0 : message.commit) === null || _a === void 0 ? void 0 : _a.operation;
        const collection = (_b = message === null || message === void 0 ? void 0 : message.commit) === null || _b === void 0 ? void 0 : _b.collection;
        const postDid = message === null || message === void 0 ? void 0 : message.did;
        const postRkey = (_c = message === null || message === void 0 ? void 0 : message.commit) === null || _c === void 0 ? void 0 : _c.rkey;
        const postLangs = ((_e = (_d = message === null || message === void 0 ? void 0 : message.commit) === null || _d === void 0 ? void 0 : _d.record) === null || _e === void 0 ? void 0 : _e.langs) || [];
        if (operation == 'create') { //Received specific operation
            if (collection == 'app.bsky.feed.post' && ((_g = (_f = message === null || message === void 0 ? void 0 : message.commit) === null || _f === void 0 ? void 0 : _f.record) === null || _g === void 0 ? void 0 : _g.reply) == null && postLangs == 'en') { //Received a new post
                const postText = (_j = (_h = message === null || message === void 0 ? void 0 : message.commit) === null || _h === void 0 ? void 0 : _h.record) === null || _j === void 0 ? void 0 : _j.text;
                const tags = (postText === null || postText === void 0 ? void 0 : postText.match(/#\w+/g)) || [];
                const newPostURI = constructURI(postDid, postRkey);
                console.log(`Received post (${msgCount + 1}):`);
                console.log(`DID: ${postDid}`);
                console.log(`Rkey: ${postRkey}`);
                console.log(`Languages: ${postLangs.join(", ")}`);
                console.log(`URI: ${newPostURI}`);
                console.log(`Text: ${postText}`);
                console.log(`Tags: ${tags.join(", ")}`);
                console.log(`-----\n`);
                msgCount++;
            }
            else if (collection == 'app.bsky.feed.post' && ((_l = (_k = message === null || message === void 0 ? void 0 : message.commit) === null || _k === void 0 ? void 0 : _k.record) === null || _l === void 0 ? void 0 : _l.reply) != null) { //Received a new reply
                const replyText = (_o = (_m = message === null || message === void 0 ? void 0 : message.commit) === null || _m === void 0 ? void 0 : _m.record) === null || _o === void 0 ? void 0 : _o.text;
                const replyRootURI = (_s = (_r = (_q = (_p = message === null || message === void 0 ? void 0 : message.commit) === null || _p === void 0 ? void 0 : _p.record) === null || _q === void 0 ? void 0 : _q.reply) === null || _r === void 0 ? void 0 : _r.root) === null || _s === void 0 ? void 0 : _s.uri;
                const replyRootData = replyRootURI ? extractDidAndRkey(replyRootURI) : undefined;
                const replyRootPostURI = replyRootData ? constructURI(replyRootData.did, replyRootData.rkey) : undefined;
                console.log(`Received reply (${msgCount + 1}):`);
                console.log(`DID: ${postDid}`);
                console.log(`Rkey: ${postRkey}`);
                console.log(`URI: ${replyRootPostURI}`);
                console.log(`replyText: ${replyText}`);
                console.log(`-----\n`);
                msgCount++;
            }
            else if (collection == 'app.bsky.feed.like') { //Received a new like
                const likeSubjectURI = (_v = (_u = (_t = message === null || message === void 0 ? void 0 : message.commit) === null || _t === void 0 ? void 0 : _t.record) === null || _u === void 0 ? void 0 : _u.subject) === null || _v === void 0 ? void 0 : _v.uri;
                const likeSubjectData = likeSubjectURI ? extractDidAndRkey(likeSubjectURI) : undefined;
                const likeSubjectPostURI = likeSubjectData ? constructURI(likeSubjectData.did, likeSubjectData.rkey) : undefined;
                console.log(`Received like (${msgCount + 1}):`);
                console.log(`DID: ${postDid}`);
                console.log(`Rkey: ${postRkey}`);
                console.log(`URI: ${likeSubjectPostURI}`);
                console.log(`-----\n`);
                msgCount++;
            }
        }
    }
    else {
        ws.close();
    }
});
