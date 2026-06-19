import type { QueryClient } from "@tanstack/react-query";
import type { Subscription } from "@adonisjs/transmit-client";

import { transmit } from "./client";
import { collectSubscribableGameIds } from "./collect-game-ids";
import { invalidatePublicLiveGameQueries } from "./invalidate-public";
import { gameChannel, parseTransmitMessage, type GameSSEPayload } from "./types";

type SubscriptionEntry = {
  subscription: Subscription;
  removeHandler: () => void;
};

type GameListener = (payload: GameSSEPayload) => void;

const INVALIDATE_DEBOUNCE_MS = 300;

class TransmitManager {
  private queryClient: QueryClient | null = null;
  private subscriptions = new Map<string, SubscriptionEntry>();
  private listeners = new Map<number, Set<GameListener>>();
  private listenerGameIds = new Set<number>();
  private subscribedGameIds = new Set<number>();
  private invalidateTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingInvalidations = new Set<number>();

  init(queryClient: QueryClient): void {
    this.queryClient = queryClient;
    void this.syncChannels();
  }

  destroy(): void {
    if (this.invalidateTimer != null) {
      clearTimeout(this.invalidateTimer);
      this.invalidateTimer = null;
    }
    this.pendingInvalidations.clear();

    for (const gameId of [...this.subscribedGameIds]) {
      void this.unsubscribeGame(gameId);
    }

    this.listeners.clear();
    this.listenerGameIds.clear();
    this.queryClient = null;
  }

  syncChannels(): void {
    if (!this.queryClient) return;

    const desired = collectSubscribableGameIds(
      this.queryClient,
      this.listenerGameIds,
    );

    for (const gameId of desired) {
      if (!this.subscribedGameIds.has(gameId)) {
        void this.subscribeGame(gameId);
      }
    }

    for (const gameId of this.subscribedGameIds) {
      if (!desired.has(gameId)) {
        void this.unsubscribeGame(gameId);
      }
    }
  }

  addListener(gameId: number, listener: GameListener): () => void {
    if (gameId <= 0) {
      return () => undefined;
    }

    const bucket = this.listeners.get(gameId) ?? new Set<GameListener>();
    bucket.add(listener);
    this.listeners.set(gameId, bucket);
    this.listenerGameIds.add(gameId);
    void this.syncChannels();

    return () => {
      const current = this.listeners.get(gameId);
      if (!current) return;
      current.delete(listener);
      if (current.size === 0) {
        this.listeners.delete(gameId);
        this.listenerGameIds.delete(gameId);
        void this.syncChannels();
      }
    };
  }

  private async subscribeGame(gameId: number): Promise<void> {
    const channel = gameChannel(gameId);
    if (this.subscriptions.has(channel)) {
      this.subscribedGameIds.add(gameId);
      return;
    }

    const subscription = transmit.subscription(channel);
    const removeHandler = subscription.onMessage((message) => {
      this.handleMessage(gameId, message);
    });

    this.subscriptions.set(channel, { subscription, removeHandler });

    try {
      await subscription.create();
      this.subscribedGameIds.add(gameId);
    } catch {
      removeHandler();
      this.subscriptions.delete(channel);
    }
  }

  private async unsubscribeGame(gameId: number): Promise<void> {
    const channel = gameChannel(gameId);
    const entry = this.subscriptions.get(channel);
    if (!entry) {
      this.subscribedGameIds.delete(gameId);
      return;
    }

    entry.removeHandler();
    try {
      await entry.subscription.delete();
    } catch {
      // Best-effort cleanup when the stream is already closed.
    }

    this.subscriptions.delete(channel);
    this.subscribedGameIds.delete(gameId);
  }

  private handleMessage(gameId: number, message: unknown): void {
    const payload = parseTransmitMessage(message);
    if (!payload) return;

    this.dispatch(gameId, payload);
    this.scheduleInvalidation(gameId);
  }

  private dispatch(gameId: number, payload: GameSSEPayload): void {
    const handlers = this.listeners.get(gameId);
    if (!handlers) return;
    for (const handler of handlers) {
      try {
        handler(payload);
      } catch {
        // Listener errors must not break the global stream.
      }
    }
  }

  private scheduleInvalidation(gameId: number): void {
    if (!this.queryClient) return;

    this.pendingInvalidations.add(gameId);
    if (this.invalidateTimer != null) return;

    this.invalidateTimer = setTimeout(() => {
      const client = this.queryClient;
      if (client) {
        for (const id of this.pendingInvalidations) {
          invalidatePublicLiveGameQueries(client, id);
        }
      }
      this.pendingInvalidations.clear();
      this.invalidateTimer = null;
    }, INVALIDATE_DEBOUNCE_MS);
  }
}

let manager: TransmitManager | null = null;

export function getTransmitManager(): TransmitManager {
  if (!manager) {
    manager = new TransmitManager();
  }
  return manager;
}
