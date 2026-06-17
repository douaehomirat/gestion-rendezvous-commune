// src/services/notificationSocket.jsx
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient = null;
let subscriptions = new Map(); // ✅ Stocker les subscriptions

console.log('🔧 notificationSocket.jsx chargé');

/**
 * ✅ Connexion WebSocket Notifications (DEBUG)
 */
export const connectNotificationSocket = (userId, role, onNotification) => {
  console.log('🚀 connectNotificationSocket appelé:', { userId, role });

  // ✅ Vérifier si déjà connecté
  if (stompClient && stompClient.active) {
    console.log('⚠️ Déjà connecté, return client existant');
    return stompClient;
  }

  try {
    // Créer SockJS + STOMP client
    console.log('📡 Création SockJS...');
    const socket = new SockJS('https://gestion-rendezvous-commune-production-b126.up.railway.app/ws');
    
    stompClient = new Client({
      webSocketFactory: () => {
        console.log('🔌 WebSocketFactory appelée');
        return socket;
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        console.log('🐛 STOMP DEBUG:', str); // ✅ Debug STOMP
      },
    });

    // ✅ Événements de connexion
    stompClient.onConnect = (frame) => {
      console.log('✅ WebSocket CONNECTÉ:', frame);
      
      // ✅ Nettoyer anciennes subscriptions
      subscriptions.forEach(sub => sub.unsubscribe());
      subscriptions.clear();

      // ✅ S'abonner USER
      if (userId) {
        const userSub = stompClient.subscribe(`/topic/notifications/user/${userId}`, (message) => {
          try {
            const notification = JSON.parse(message.body);
            console.log('🔔 USER Notification reçue:', notification);
            onNotification(notification);
          } catch (e) {
            console.error('❌ Erreur parse USER:', e, message.body);
          }
        });
        subscriptions.set('user', userSub);
        console.log('✅ Abonné USER:', `/topic/notifications/user/${userId}`);
      }

      // ✅ S'abonner ROLE
      if (role) {
        const roleSub = stompClient.subscribe(`/topic/notifications/role/${role}`, (message) => {
          try {
            const notification = JSON.parse(message.body);
            console.log('🔔 ROLE Notification reçue:', notification);
            onNotification(notification);
          } catch (e) {
            console.error('❌ Erreur parse ROLE:', e, message.body);
          }
        });
        subscriptions.set('role', roleSub);
        console.log('✅ Abonné ROLE:', `/topic/notifications/role/${role}`);
      }
    };

    stompClient.onStompError = (frame) => {
      console.error('❌ STOMP Error:', frame);
    };

    stompClient.onWebSocketError = (error) => {
      console.error('❌ WebSocket Error:', error);
    };

    stompClient.onDisconnect = () => {
      console.log('🔌 WebSocket déconnecté');
    };

    stompClient.onWebSocketClose = () => {
      console.log('🚪 WebSocket fermé');
    };

    // ✅ ACTIVATION
    console.log('⚡ Activation STOMP...');
    stompClient.activate();

    return stompClient;

  } catch (error) {
    console.error('💥 Erreur création client:', error);
    throw error;
  }
};

/**
 * ✅ Déconnexion propre
 */
export const disconnectNotificationSocket = () => {
  console.log('🔌 Déconnexion demandée...');
  
  if (stompClient) {
    // ✅ Unsubscribe proprement
    subscriptions.forEach((sub, key) => {
      console.log('❌ Unsubscribe:', key);
      sub.unsubscribe();
    });
    subscriptions.clear();
    
    stompClient.deactivate();
    stompClient = null;
    console.log('✅ Déconnexion terminée');
  } else {
    console.log('ℹ️ Aucun client à déconnecter');
  }
};

// ✅ Test de connexion (utilitaire)
export const testConnection = () => {
  console.log('🧪 Test connection:', {
    client: !!stompClient,
    active: stompClient?.active,
    connected: stompClient?.connected,
    subscriptions: subscriptions.size
  });
};

// ✅ Export par défaut
export default {
  connectNotificationSocket,
  disconnectNotificationSocket,
  testConnection
};