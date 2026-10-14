import { createYoga, createSchema } from 'graphql-yoga';
import { typeDefs } from '../../lib/graphql/typeDefs.js';
import { resolvers } from '../../lib/graphql/resolvers.js';
import prisma from '../../lib/prisma.js';
import { parseSession } from '../../lib/auth.js';
import { getLocalPersonas } from '../../lib/mockFallback.js';

export const config = {
  api: {
    // Disable Next.js default body parser so GraphQL Yoga can handle requests directly
    bodyParser: false,
  },
};

const schema = createSchema({
  typeDefs,
  resolvers,
});

export default createYoga({
  schema,
  graphqlEndpoint: '/api/graphql',
  landingPage: true, // Enables built-in interactive GraphiQL playground
  context: async ({ req }) => {
    let currentUser = null;
    try {
      const userId = parseSession(req);
      if (userId) {
        try {
          currentUser = await prisma.user.findUnique({ where: { id: userId } });
        } catch (dbErr) {
          // Fallback if db is unavailable
        }
        if (!currentUser) {
          currentUser = getLocalPersonas().find(p => p.id === userId) || null;
        }
      }
    } catch (e) {
      // Ignored
    }

    return {
      req,
      prisma,
      currentUser
    };
  }
});
