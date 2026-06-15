import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pilotApplicationsTable = pgTable("pilot_applications", {
  id: serial("id").primaryKey(),
  company: text("company").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPilotApplicationSchema = createInsertSchema(pilotApplicationsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertPilotApplication = z.infer<typeof insertPilotApplicationSchema>;
export type PilotApplication = typeof pilotApplicationsTable.$inferSelect;
