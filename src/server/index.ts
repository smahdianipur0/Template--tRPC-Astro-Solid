import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context.ts";
import { z } from "zod";
import { createUser } from "../utils/surreal-cloud";
import { server } from '@passwordless-id/webauthn'


const t = initTRPC.context<Context>().create({
    transformer: {
        input: superjson,
        output: superjson,
    },
});

export const router = t.router;

export const appRouter = router({

    challenge: t.procedure
        .query(async () => {
            const challenge = server.randomChallenge()
            return { message: challenge };
            console.log(challenge);
        }),

    registry:t.procedure
        .input(
            z.object({ 
                challenge: z.string(),
                registry : z.object({  
                  type: z.literal("public-key"),  
                  id: z.string(),  
                  rawId: z.string(),  
                  authenticatorAttachment: z.string(),  
                  clientExtensionResults: z.object({}),  
                  response: z.object({  
                    attestationObject: z.string(),  
                    authenticatorData: z.string(),  
                    clientDataJSON: z.string(),  
                    publicKey: z.string(),  
                    publicKeyAlgorithm: z.number(),  
                    transports: z.array(z.string())  
                  }),  
                  user: z.object({ name: z.string(), id: z.string().uuid()  
                  })  
                })  
            })
        )
            
        .mutation(async ({ input }) => {
            let addToDb: string | undefined;
            const expected = {
                challenge: input.challenge,
                origin: "http://localhost:4321",
            }
            const registrationParsed = await server.verifyRegistration(input.registry, expected);
            if (registrationParsed.userVerified === true) {
                addToDb = await createUser(registrationParsed.credential.id, registrationParsed.credential);
                console.log(addToDb); 
            }
            return { message: addToDb || "User not created" };
        }),        

    greetWithName: t.procedure
        .input(
            z.object({
                names: z.string(),
            }),
        )
        .mutation(async ({ input }) => {
            return { message: `Hello ${input.names}!!` };
        }),
});

export type AppRouter = typeof appRouter;