import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "./context.ts";
import { z } from "zod";
import  { createPermission } from "../utils/surreal-cloud";

const t = initTRPC.context<Context>().create({
    transformer: {
        input: superjson,
        output: superjson,
    },
});

export const router = t.router;

export const appRouter = router({
    greeting: t.procedure
        .query(async () => {
            return { message: "Hello from tRPC!" };
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

    dbInteraction: t.procedure
        .input(z.object({
              user: z.string(),
              vaultName: z.string(),
            }),
        )
        .mutation(async ({ input }) => {
                console.log(`Received mutation request with user: ${input.user} and vaultName: ${input.vaultName}`);
                await createPermission(input.user, input.vaultName);
                console.log("Permission created successfully.");
                return { message: "done" } ;
        }),


});

export type AppRouter = typeof appRouter;