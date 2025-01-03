import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context.ts";
import { z } from "zod";
import { createUser, queryUser } from "../utils/surreal-cloud";
import { server } from '@passwordless-id/webauthn'


const t = initTRPC.context<Context>().create({
    transformer: {
        input: superjson,
        output: superjson,
    },
});

export const router = t.router;

const registrationInputSchema = z.object({ 
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

const authenticationInputSchema = z.object({  
    challenge: z.string(),  
    authenticationData: z.object({  
        authenticatorAttachment: z.string(),  
        clientExtensionResults: z.object({}),  
        id: z.string(),  
        rawId: z.string(),  
        type: z.string(),  
        response: z.object({  
            authenticatorData: z.string(),  
            clientDataJSON: z.string(),  
            signature: z.string(),  
            userHandle: z.string(),  
        }),  
    })  
});



export const appRouter = router({

    challenge: t.procedure
        .query(async () => {
            const challenge = server.randomChallenge()
            return { message: challenge };
            console.log(challenge);
        }),

    registry:t.procedure
        .input(registrationInputSchema)      
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

    authenticate:t.procedure
        .input(authenticationInputSchema)
        .mutation(async({input}) =>{
            const credentialKey  = await queryUser(input.authenticationData.id);
            if (!credentialKey){ return { message: "Failed to find user" }}

            const expected = {
                challenge: input.challenge,
                origin: "http://localhost:4321",
                userVerified: true, 
            }
            
            const authenticationParsed = await server.verifyAuthentication(input.authenticationData, credentialKey[0].credentials, expected)
            if (authenticationParsed.userVerified === true) {

            }
            return { message: authenticationParsed  || "User not authenticated" };
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