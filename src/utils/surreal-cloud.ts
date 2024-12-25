import { Surreal, RecordId } from 'surrealdb';

// Open a connection and authenticate
async function getDb(){
	const db = new Surreal();   
    try {
    	console.log("Attempting to connect to SurrealDB...");
    	await db.connect("wss://new-instance-069vtnm759oib0f6sldlofb29k.aws-use1.surreal.cloud", {
			namespace: "demo namespace",
				database: "demo database",
				auth: {
					username: "xxx",
					password: "xxx",
				}
		});
        console.log("Connected to SurrealDB successfully.");
        return db;
    } catch (err) {
        console.error("Failed to connect to SurrealDB:", err instanceof Error ? err.message : String(err));
        await db.close();
        throw err;
    }
}


export type permissions = {
  id?: {tb: string, id: string};
  user: string;
  vaultCount: number;
}

async function createEntry(tableName: string, user: string, vaultCount: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("Database not initialized");
    return;
  }
  try {
    console.log(`Creating entry in table ${tableName} with user: ${user} and vaultCount: ${vaultCount}`);
    const entry = await db.create<permissions>(tableName, {
      user,
      vaultCount,
    });
    console.log("Entry created successfully:", entry);
  } catch (err: unknown) {
    console.error(`Failed to create entry in ${tableName}:`, err instanceof Error ? err.message : String(err));
  } finally {
    await db.close();
  }
}


export async function createPermission(user: string, vaultCount: number): Promise<void> {
  await createEntry("permissions", user, vaultCount);
}