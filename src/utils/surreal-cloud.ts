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
  user: string;
  vaultName: string;
}

export async function createPermission(user: string, vaultName: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("Database not initialized");
    return;
  }
  try {
    console.log(`Creating entry in table  with user`);
        console.log(vaultName);
    const valut = db.select(new RecordId('vaults', vaultName));

      if ( JSON.stringify(valut) === '{}'){
        console.log('adding new');
        const entry = await db.create<permissions>(new RecordId('permissions', 'oldmate'), {
        vaultCount: 1,
      });
        const newVault = await db.create<permissions>(new RecordId('vaults', vaultName)); 

    } else { 
      console.log('incrementing');
      const newCount = valut.vaultCount + 1 ;
      const neEntry = await db.create<permissions>(new RecordId('permissions', user), {
        vaultCount: newCount,
      });
      console.log(newCount);
    }
    console.log("Entry created successfully:", entry);
  } catch (err: unknown) {
    console.error(`Failed to create entry in:`, err instanceof Error ? err.message : String(err));
  } finally {
    await db.close();
  }
}
