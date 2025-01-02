import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context.ts";
import { z } from "zod";
<<<<<<< Updated upstream
=======
import  { createPermission } from "../utils/surreal-cloud";
import {server} from '@passwordless-id/webauthn'

>>>>>>> Stashed changes

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
              user: z.object({  
                id: z.string(),
                name: z.string(),  
                displayName: z.string(),  
              }),  
              credential: z.object({  
                id: z.string(),  
                publicKey: z.string(),  
                algorithm: z.string(),
                transports: z.array(z.enum(['internal', 'hybrid'])) 
              }),  
              authenticatorData: z.string(),  
              clientData: z.string(),  
            });  
        .mutation(async ({ input }) => {
            const expected = {
                challenge: input.challenge,
                origin: "http://localhost:4321",
            }
            const registrationParsed = await server.verifyRegistration(input.registration, expected);
            console.log(registrationParsed);
            return { message: registrationParsed };
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