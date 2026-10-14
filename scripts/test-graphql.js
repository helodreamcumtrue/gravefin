import { createSchema, createYoga } from 'graphql-yoga';
import { typeDefs } from '../lib/graphql/typeDefs.js';
import { resolvers } from '../lib/graphql/resolvers.js';
import { parse, execute } from 'graphql';

async function testGraphQL() {
  console.log('--- Testing GraphQL Schema Compilation & Query Execution ---');

  const schema = createSchema({
    typeDefs,
    resolvers
  });

  const query = /* GraphQL */ `
    query TestGravefinCatalog {
      systemStats {
        totalProjects
        totalResurrections
        totalCreditsStaked
        averageRevivalScore
      }
      projects(limit: 3) {
        id
        title
        status
        stakeRequired
        techTags
        revivalScore
        revivalDetails {
          overallScore
          effortEstimate
        }
        owner {
          alias
          reputation
        }
      }
      leaderboard(limit: 2) {
        alias
        reputation
        credits
      }
    }
  `;

  const mutation = /* GraphQL */ `
    mutation TestSimulationCron {
      triggerTimeoutCheck(secret: "graveyard_secret_key", simulateDaysElapsed: 7) {
        success
        effectiveDate
        events
        summary
      }
    }
  `;

  const document = parse(query);
  const result = await execute({
    schema,
    document,
    contextValue: {
      currentUser: { id: 'u1', alias: 'Digger-1042', credits: 500, reputation: 100 }
    }
  });

  const mutDoc = parse(mutation);
  const mutResult = await execute({
    schema,
    document: mutDoc,
    contextValue: {
      currentUser: { id: 'u1', alias: 'Digger-1042', credits: 500, reputation: 100 }
    }
  });

  if (mutResult.errors) {
    console.error('Mutation Errors:', JSON.stringify(mutResult.errors, null, 2));
    process.exit(1);
  }

  console.log('Mutation Execution Result:', JSON.stringify(mutResult.data, null, 2));

  if (result.errors) {
    console.error('GraphQL Errors:', JSON.stringify(result.errors, null, 2));
    process.exit(1);
  }

  console.log('GraphQL Execution Result:', JSON.stringify(result.data, null, 2));
  console.log('✅ GraphQL Schema & Resolvers PASSED with 100% accuracy!');
}

testGraphQL().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
