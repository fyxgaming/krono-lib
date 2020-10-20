/// <reference types="node" />
import { EventEmitter } from "events";
export declare class WSClient extends EventEmitter {
    private client;
    private url;
    private socket;
    private channels;
    private lastIds;
    constructor(client: any, url: string, channels?: string[]);
    connect(): any;
    subscribe(channelId: any, lastId?: number): void;
    unsubscribe(channelId: any): void;
    close(): void;
}
