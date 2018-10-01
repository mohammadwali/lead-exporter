let port = null;
const todoConstraints = {
    PING: 'ping'
};
const handleDisconnect = () => (port = null);
const onRuntimeConnect = (request, sender, sendResponse) => {
    if (request.ping) {
        return sendResponse({pong: true});
    }

    if (!sender.tab) {
        handleRequestOrResponse(request, false)
    }
};
const handleRequestOrResponse = (req, isReply) => {
    req.reply = (typeof isReply !== 'boolean') ? true : isReply;

    switch (req.todo) {
        case connection.todo.PING:
            console.log('njfndnfdnfd......', req.data);
            break;
    }
};

// this port connects with background script
port = chrome.runtime.connect();
port.onDisconnect.addListener(handleDisconnect);
port.onMessage.addListener(handleRequestOrResponse); // for replies

// if background script sent a message
chrome.runtime.onMessage.addListener(onRuntimeConnect);

export const connection = {
    port,
    todo: todoConstraints,
    postMessage: (todo, data) => port.postMessage({todo, data})
};