import '../../img/icon-34.png'
import '../../img/icon-128.png'


chrome.runtime.onConnect.addListener(port => {
    const onMessage = (request, {sender: {tab}}) => {
        const send = data => port.postMessage({
            data: data,
            id: request.id,
            todo: request.todo
        });

        switch (request.todo) {
            case 'ping':
                send('pong');
                break;

            default:
                send();
                break;
        }
    };

    port.onMessage.addListener(onMessage);
});