import { Firestore, Timestamp } from 'firebase-admin/firestore';

// Helper function to convert Firestore data to plain objects
function convertFirestoreData(data: any): any {
  if (!data) return null;

  const converted: any = { ...data };

  // Convert Firestore Timestamps to JavaScript Dates
  Object.keys(converted).forEach((key) => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate();
    } else if (converted[key] && typeof converted[key] === 'object' && converted[key].toDate) {
      converted[key] = converted[key].toDate();
    }
  });

  return converted;
}

// Custom Firestore adapter for BetterAuth
export function createFirestoreAdapter(db: Firestore): any {
  // Verify Firestore connection is available
  if (!db) {
    throw new Error('Firestore database instance is required');
  }

  const usersCollection = db.collection('users');
  const sessionsCollection = db.collection('sessions');
  const accountsCollection = db.collection('accounts');
  const verificationsCollection = db.collection('verifications');

  // Return adapter object with all required methods
  const adapter = {
    async getUser(userId: string) {
      try {
        if (!userId) {
          throw new Error('User ID is required');
        }
        const doc = await usersCollection.doc(userId).get();
        if (!doc.exists) return null;
        const data = convertFirestoreData(doc.data());
        return { id: doc.id, ...data } as any;
      } catch (error) {
        console.error('[Firestore Adapter] getUser error:', {
          userId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },

    async getUserByEmail(email: string) {
      try {
        if (!email || typeof email !== 'string') {
          throw new Error('Valid email is required');
        }
        const snapshot = await usersCollection.where('email', '==', email).limit(1).get();
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        const data = convertFirestoreData(doc.data());
        return { id: doc.id, ...data } as any;
      } catch (error) {
        console.error('[Firestore Adapter] getUserByEmail error:', {
          email,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },

    // Generic findOne method that BetterAuth uses internally
    async findOne(query: any) {
      try {
        const collectionName = query.from || query.model;

        if (!query || !query.where || !collectionName) {
          throw new Error('Invalid query: missing required fields (where, from/model)');
        }

        let collection;

        // Map BetterAuth collection names to our Firestore collections
        switch (collectionName) {
          case 'user':
          case 'users':
            collection = usersCollection;
            break;
          case 'session':
          case 'sessions':
            collection = sessionsCollection;
            break;
          case 'account':
          case 'accounts':
            collection = accountsCollection;
            break;
          case 'verification':
          case 'verifications':
            collection = verificationsCollection;
            break;
          default:
            console.error(`[Firestore Adapter] Unknown collection: ${collectionName}`);
            throw new Error(`Unknown collection: ${collectionName}`);
        }

        let firestoreQuery: any = collection;
        const whereClauses = Array.isArray(query.where) ? query.where : [query.where];

        for (const clause of whereClauses) {
          const { field, value, operator } = clause;
          if (field && value !== undefined) {
            // Map operator if necessary, or default to '=='
            const op = operator === 'eq' || !operator ? '==' : operator;
            firestoreQuery = firestoreQuery.where(field, op, value);
          }
        }

        const snapshot = await firestoreQuery.limit(1).get();
        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        if (!doc.exists) return null;

        const data = convertFirestoreData(doc.data());
        return { id: doc.id, ...data } as any;
      } catch (error) {
        console.error('[Firestore Adapter] findOne error:', {
          error: error instanceof Error ? error.message : String(error),
          query,
          stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
      }
    },

    async findMany(query: any) {
      try {
        const collectionName = query.from || query.model;

        if (!query || !collectionName) {
          throw new Error('Invalid query: missing required fields (from/model)');
        }

        let collection;
        switch (collectionName) {
          case 'user':
          case 'users':
            collection = usersCollection;
            break;
          case 'session':
          case 'sessions':
            collection = sessionsCollection;
            break;
          case 'account':
          case 'accounts':
            collection = accountsCollection;
            break;
          case 'verification':
          case 'verifications':
            collection = verificationsCollection;
            break;
          default:
            console.error(`[Firestore Adapter] Unknown collection: ${collectionName}`);
            throw new Error(`Unknown collection: ${collectionName}`);
        }

        let firestoreQuery: any = collection;

        if (query.where) {
          const whereClauses = Array.isArray(query.where) ? query.where : [query.where];
          for (const clause of whereClauses) {
            const { field, value, operator } = clause;
            if (field && value !== undefined) {
              const op = operator === 'eq' || !operator ? '==' : operator;
              firestoreQuery = firestoreQuery.where(field, op, value);
            }
          }
        }

        if (query.limit) {
          firestoreQuery = firestoreQuery.limit(query.limit);
        }

        if (query.offset) {
          firestoreQuery = firestoreQuery.offset(query.offset);
        }

        const snapshot = await firestoreQuery.get();
        if (snapshot.empty) return [];

        return snapshot.docs.map((doc: any) => {
          const data = convertFirestoreData(doc.data());
          return { id: doc.id, ...data };
        });
      } catch (error) {
        console.error('[Firestore Adapter] findMany error:', {
          error: error instanceof Error ? error.message : String(error),
          query,
          stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
      }
    },

    async create(data: any) {
      try {
        const collectionName = data.model;
        if (!collectionName) {
          throw new Error('Invalid create request: missing model');
        }

        let collection;
        switch (collectionName) {
          case 'user':
          case 'users':
            collection = usersCollection;
            break;
          case 'session':
          case 'sessions':
            collection = sessionsCollection;
            break;
          case 'account':
          case 'accounts':
            collection = accountsCollection;
            break;
          case 'verification':
          case 'verifications':
            collection = verificationsCollection;
            break;
          default:
            throw new Error(`Unknown collection: ${collectionName}`);
        }

        const docRef = collection.doc();
        const docData = {
          ...data.data, // BetterAuth passes the actual data in a 'data' property
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Remove model from data if it exists to avoid saving it to DB
        delete docData.model;

        await docRef.set(docData);
        const doc = await docRef.get();
        const convertedData = convertFirestoreData(doc.data());
        return { id: doc.id, ...convertedData } as any;
      } catch (error) {
        console.error('[Firestore Adapter] create error:', {
          error: error instanceof Error ? error.message : String(error),
          data,
        });
        throw error;
      }
    },

    async update(data: any) {
      try {
        const collectionName = data.model;
        const id = data.where?.value || data.id; // Try to find ID from where clause or direct id property

        if (!collectionName || !id) {
          throw new Error('Invalid update request: missing model or id');
        }

        let collection;
        switch (collectionName) {
          case 'user':
          case 'users':
            collection = usersCollection;
            break;
          case 'session':
          case 'sessions':
            collection = sessionsCollection;
            break;
          case 'account':
          case 'accounts':
            collection = accountsCollection;
            break;
          case 'verification':
          case 'verifications':
            collection = verificationsCollection;
            break;
          default:
            throw new Error(`Unknown collection: ${collectionName}`);
        }

        const updateData = {
          ...data.update, // BetterAuth passes update data in 'update' property
          updatedAt: new Date(),
        };

        await collection.doc(id).update(updateData);
        const doc = await collection.doc(id).get();
        const convertedData = convertFirestoreData(doc.data());
        return { id: doc.id, ...convertedData } as any;
      } catch (error) {
        console.error('[Firestore Adapter] update error:', {
          error: error instanceof Error ? error.message : String(error),
          data,
        });
        throw error;
      }
    },

    async delete(data: any) {
      try {
        const collectionName = data.model;
        const id = data.where?.value || data.id;

        if (!collectionName || !id) {
          throw new Error('Invalid delete request: missing model or id');
        }

        let collection;
        switch (collectionName) {
          case 'user':
          case 'users':
            collection = usersCollection;
            break;
          case 'session':
          case 'sessions':
            collection = sessionsCollection;
            break;
          case 'account':
          case 'accounts':
            collection = accountsCollection;
            break;
          case 'verification':
          case 'verifications':
            collection = verificationsCollection;
            break;
          default:
            throw new Error(`Unknown collection: ${collectionName}`);
        }

        await collection.doc(id).delete();
        return { success: true };
      } catch (error) {
        console.error('[Firestore Adapter] delete error:', {
          error: error instanceof Error ? error.message : String(error),
          data,
        });
        throw error;
      }
    },

    async createUser(data: any) {
      try {
        const docRef = usersCollection.doc();
        const userData = {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await docRef.set(userData);
        const doc = await docRef.get();
        const convertedData = convertFirestoreData(doc.data());
        return { id: doc.id, ...convertedData } as any;
      } catch (error) {
        console.error('[Firestore Adapter] createUser error:', {
          error: error instanceof Error ? error.message : String(error),
          data,
          stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
      }
    },

    async updateUser(userId: string, data: any) {
      await usersCollection.doc(userId).update({
        ...data,
        updatedAt: new Date(),
      });
      const doc = await usersCollection.doc(userId).get();
      const convertedData = convertFirestoreData(doc.data());
      return { id: doc.id, ...convertedData } as any;
    },

    async deleteUser(userId: string) {
      await usersCollection.doc(userId).delete();
    },

    async getSession(sessionId: string) {
      const doc = await sessionsCollection.doc(sessionId).get();
      if (!doc.exists) return null;
      const data = convertFirestoreData(doc.data());
      return { id: doc.id, ...data } as any;
    },

    async getSessionByToken(token: string) {
      const snapshot = await sessionsCollection.where('token', '==', token).limit(1).get();
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      const data = convertFirestoreData(doc.data());
      return { id: doc.id, ...data } as any;
    },

    async createSession(data: any) {
      const docRef = sessionsCollection.doc();
      const sessionData = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await docRef.set(sessionData);
      const doc = await docRef.get();
      const convertedData = convertFirestoreData(doc.data());
      return { id: doc.id, ...convertedData } as any;
    },

    async updateSession(sessionId: string, data: any) {
      await sessionsCollection.doc(sessionId).update({
        ...data,
        updatedAt: new Date(),
      });
      const doc = await sessionsCollection.doc(sessionId).get();
      const convertedData = convertFirestoreData(doc.data());
      return { id: doc.id, ...convertedData } as any;
    },

    async deleteSession(sessionId: string) {
      await sessionsCollection.doc(sessionId).delete();
    },

    async deleteSessionsByUserId(userId: string) {
      const snapshot = await sessionsCollection.where('userId', '==', userId).get();
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    },

    async getAccount(accountId: string) {
      const doc = await accountsCollection.doc(accountId).get();
      if (!doc.exists) return null;
      const data = convertFirestoreData(doc.data());
      return { id: doc.id, ...data } as any;
    },

    async getAccountByProvider(providerId: string, providerAccountId: string) {
      const snapshot = await accountsCollection
        .where('providerId', '==', providerId)
        .where('providerAccountId', '==', providerAccountId)
        .limit(1)
        .get();
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      const data = convertFirestoreData(doc.data());
      return { id: doc.id, ...data } as any;
    },

    async createAccount(data: any) {
      const docRef = accountsCollection.doc();
      const accountData = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await docRef.set(accountData);
      const doc = await docRef.get();
      const convertedData = convertFirestoreData(doc.data());
      return { id: doc.id, ...convertedData } as any;
    },

    async updateAccount(accountId: string, data: any) {
      await accountsCollection.doc(accountId).update({
        ...data,
        updatedAt: new Date(),
      });
      const doc = await accountsCollection.doc(accountId).get();
      const convertedData = convertFirestoreData(doc.data());
      return { id: doc.id, ...convertedData } as any;
    },

    async deleteAccount(accountId: string) {
      await accountsCollection.doc(accountId).delete();
    },

    async getVerification(verificationId: string) {
      const doc = await verificationsCollection.doc(verificationId).get();
      if (!doc.exists) return null;
      const data = convertFirestoreData(doc.data());
      return { id: doc.id, ...data } as any;
    },

    async getVerificationByToken(token: string) {
      const snapshot = await verificationsCollection.where('token', '==', token).limit(1).get();
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      const data = convertFirestoreData(doc.data());
      return { id: doc.id, ...data } as any;
    },

    async createVerification(data: any) {
      const docRef = verificationsCollection.doc();
      const verificationData = {
        ...data,
        createdAt: new Date(),
        expiresAt: data.expiresAt || new Date(Date.now() + 60 * 60 * 1000), // 1 hour default
      };
      await docRef.set(verificationData);
      const doc = await docRef.get();
      const convertedData = convertFirestoreData(doc.data());
      return { id: doc.id, ...convertedData } as any;
    },

    async deleteVerification(verificationId: string) {
      await verificationsCollection.doc(verificationId).delete();
    },

    async deleteExpiredVerifications() {
      const now = new Date();
      const snapshot = await verificationsCollection.where('expiresAt', '<', now).get();
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    },
  };

  // Verify adapter has required structure
  if (!adapter.getUser || !adapter.createUser || !adapter.getSession || !adapter.createSession) {
    throw new Error('Firestore adapter is missing required methods');
  }

  return adapter;
}

