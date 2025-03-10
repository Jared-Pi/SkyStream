import WebSocket from "ws";

const ws = new WebSocket(`wss://jetstream2.us-west.bsky.network/subscribe`);

// Object to store tags and their counts
const tagCounts: { [tag: string]: number } = {};
const receivedPosts = new Set<string>();

function extractDidAndRkey(uri: string): { did: string, rkey: string } | undefined {
    const match = uri.match(/at:\/\/(did:plc:[^\/]+)\/app\.bsky\.feed\.post\/([^\/]+)/);
    if (match) {
        return { did: match[1], rkey: match[2] };
    }
    return undefined;
}

function constructURI(did: string, rkey: string): string {
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
    if (msgCount < 30) {
        // Parse the message data as JSON
        const message = JSON.parse(data.toString());
        // Extract relevant fields
        const operation = message?.commit?.operation;
        const collection = message?.commit?.collection;
        const postDid = message?.did;
        const postRkey = message?.commit?.rkey;
        const postLangs = message?.commit?.record?.langs || [];

        if (operation == 'create') { //Received specific operation
            if (collection == 'app.bsky.feed.post' && message?.commit?.record?.reply == null && postLangs == 'en') { //Received a new post
                const postText = message?.commit?.record?.text;
                const tags = postText?.match(/#\w+/g) || [];
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

            else if (collection == 'app.bsky.feed.post' && message?.commit?.record?.reply != null) { //Received a new reply
                const replyText = message?.commit?.record?.text;
                const replyRootURI = message?.commit?.record?.reply?.root?.uri;
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
                const likeSubjectURI = message?.commit?.record?.subject?.uri;
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



    } else { ws.close(); }
});