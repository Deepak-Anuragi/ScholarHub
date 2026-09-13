import { MongoMemoryServer } from "mongodb-memory-server";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  interface ProvidedContext {
    mongoUri: string;
  }
}

/**
 * One in-memory MongoDB for the whole run, handed to the workers through
 * `provide`. src/test/setup.ts copies it into MONGODB_URI, which is what
 * lib/mongodb.ts reads — so nothing under src/ needs to know it is under test.
 */
let mongo: MongoMemoryServer;

export async function setup(project: TestProject): Promise<void> {
  mongo = await MongoMemoryServer.create();
  project.provide("mongoUri", mongo.getUri("scholarshub_test"));
}

export async function teardown(): Promise<void> {
  await mongo?.stop();
}
