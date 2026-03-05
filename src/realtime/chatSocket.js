import { conversationAgent } from '../agents/conversationAgent';

const CHANNEL = 'kinflow-agent-chat';

class InMemorySocketServer {
  constructor() {
    this.clients = new Set();
  }

  connect(client) {
    this.clients.add(client);
    return () => this.clients.delete(client);
  }

  broadcast(payload) {
    this.clients.forEach((client) => client.receive(payload));
  }
}

const singletonServer = new InMemorySocketServer();

export const createChatSocketClient = ({ userId, onMessage }) => {
  const receive = (payload) => {
    onMessage?.(payload);
  };

  const disconnect = singletonServer.connect({ receive });

  return {
    send(message, context = {}) {
      const userEvent = {
        id: `${Date.now()}-user-${userId}`,
        type: 'chat_message',
        senderId: userId,
        channel: CHANNEL,
        createdAt: Date.now(),
        text: message,
      };

      singletonServer.broadcast(userEvent);

      const agentResult = conversationAgent.execute({ message, ...context }, { channel: CHANNEL });
      singletonServer.broadcast({
        id: `${Date.now()}-agent`,
        type: 'agent_message',
        senderId: 'conversation-agent',
        channel: CHANNEL,
        createdAt: Date.now(),
        text: agentResult.responseText,
        suggestions: agentResult.suggestions,
        metadata: agentResult.metadata,
      });
    },

    close() {
      disconnect();
    },
  };
};
