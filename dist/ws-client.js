"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WSClient = void 0;
const events_1 = require("events");
class WSClient extends events_1.EventEmitter {
    constructor(client, url, channels = []) {
        super();
        this.client = client;
        this.url = url;
        this.lastIds = new Map();
        this.channels = new Set(channels);
        this.socket = this.connect();
    }
    connect() {
        const socket = new this.client(this.url);
        socket.onopen = () => {
            socket.onmessage = (e) => {
                const { id, channel, event, data } = JSON.parse(e.data);
                const lastId = this.lastIds.get(channel) || 0;
                if (id > lastId)
                    this.lastIds.set(channel, id);
                this.emit(event, data, channel);
            };
            Array.from(this.channels).forEach(channel => this.subscribe(channel));
        };
        socket.onerror = console.error;
        socket.onclose = () => {
            this.socket = this.connect();
        };
        return socket;
    }
    subscribe(channelId, lastId) {
        this.channels.add(channelId);
        if (!this.socket || this.socket.readyState !== 1)
            return;
        this.socket.send(JSON.stringify({
            action: 'subscribe',
            channelId,
            lastId: lastId || this.lastIds.get(channelId) || null
        }));
    }
    unsubscribe(channelId) {
        this.channels.delete(channelId);
        if (!this.socket || this.socket.readyState !== 1)
            return;
        this.socket.send(JSON.stringify({
            action: 'unsubscribe',
            channelId
        }));
    }
    close() {
        this.socket.close();
    }
}
exports.WSClient = WSClient;
//# sourceMappingURL=ws-client.js.map