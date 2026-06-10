import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs } from './schema/typeDefs.js';
import { productResolver } from './resolvers/productResolver.js';
import { categoryResolver } from './resolvers/categoryResolver.js';
import { supplierResolver } from './resolvers/supplierResolver.js';
import { transactionResolver } from './resolvers/transactionResolver.js';
import migrate from './db/migrations.js';
import pool from './db/connection.js'; // ← tambahkan ini

const resolvers = {
  Query: {
    ...productResolver.Query,
    ...categoryResolver.Query,
    ...supplierResolver.Query,
    ...transactionResolver.Query,
  },
  Mutation: {
    ...productResolver.Mutation,
    ...categoryResolver.Mutation,
    ...supplierResolver.Mutation,
  },
  Product: productResolver.Product,
  Transaction: transactionResolver.Transaction,
};

await migrate();

const server = new ApolloServer({ 
  typeDefs, 
  resolvers,
  introspection: true,
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async () => ({ db: pool }), // ← pool sudah dikenal sekarang
});

console.log(`🚀 GraphQL Server siap di: ${url}`);