/**
 * Module ws-client.ts implements a websocket client
 * @packageDocumentation
 */

import { EventEmitter } from "events";

export class WSClient extends EventEmitter {
    private socket: any;
    private channels: Set<string>;
    private lastIds = new Map<string, number>();

    /**
    * Purpose: creates a new websocket client with an input websocket, URL and a list of channels
    * 
    * 
    */
   
    constructor(private client, private url: string, channels: string[] = []) {
        super();
        this.channels = new Set<string>(channels);
        this.socket = this.connect();
    }

    /**
    * Purpose: connects this object's websocket client to this object's URL property 
    * 
    * 
    */

    connect() {
        const socket = new this.client(this.url);
        socket.onopen = () => {
            socket.onmessage = (e) => {
                const {id, channel, event, data} = JSON.parse(e.data);
                const lastId = this.lastIds.get(channel) || 0;
                if(id > lastId) this.lastIds.set(channel, id);
                this.emit(event, data, channel);
            }
            Array.from(this.channels).forEach(channel => this.subscribe(channel));
            
        }
        socket.onerror = console.error;
        socket.onclose = () => {
            this.socket = this.connect();
        };
        return socket;
    }

    /**
    * Purpose: subscribes this object to the input channel ID 
    * 
    * 
    */

    subscribe(channelId, lastId?: number) {
        this.channels.add(channelId);
        if(!this.socket || this.socket.readyState !== 1) return;
        this.socket.send(JSON.stringify({
            action: 'subscribe',
            channelId,
            lastId: lastId || this.lastIds.get(channelId) || null
        }));
    }

    /**
    * Purpose: unsubscribes this object from a given channel ID 
    * 
    * 
    */

    unsubscribe(channelId) {
        this.channels.delete(channelId);
        if(!this.socket || this.socket.readyState !== 1) return;
        this.socket.send(JSON.stringify({
            action: 'unsubscribe',
            channelId
        }));
    }

    /**
    * Purpose: closes this object's websocket connection 
    * 
    * 
    */

    close() {
        this.socket.close();
    }
}