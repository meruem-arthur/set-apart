import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { customDesigns } from "@/db/schema";
import { requireStaff } from "./auth";
import { logActivity } from "@/lib/activity-log";

const requestSchema=z.object({name:z.string().min(1).max(160),email:z.string().email(),phone:z.string().min(6).max(40),shirtColor:z.string().min(1).max(40),size:z.string().min(1).max(20),quantity:z.number().int().min(1).max(100),artworkUrl:z.string().url(),mockupUrl:z.string().url().optional().nullable(),transform:z.string().max(2000).optional().nullable(),notes:z.string().max(2000).optional().nullable()});
export const createCustomDesign=createServerFn({method:"POST"}).validator(requestSchema).handler(async({data})=>{const [r]=await db.insert(customDesigns).values({...data,artworkPublicId:null,mockupPublicId:null,status:"pending",updatedAt:new Date()}).returning({id:customDesigns.id});return {id:r.id,status:"pending" as const}});
export const listCustomDesigns=createServerFn({method:"GET"}).handler(async()=>{await requireStaff({role:["admin","super_admin","staff"]});return db.query.customDesigns.findMany({orderBy:desc(customDesigns.createdAt)});});
export const updateCustomDesign=createServerFn({method:"POST"}).validator(z.object({id:z.number(),status:z.enum(["pending","reviewing","contacted","approved","rejected","completed"]),adminNotes:z.string().max(4000).optional().nullable()})).handler(async({data})=>{const staff=await requireStaff({role:["admin","super_admin"]});await db.update(customDesigns).set({status:data.status,adminNotes:data.adminNotes??null,updatedAt:new Date()}).where(eq(customDesigns.id,data.id));await logActivity({staffId:staff.id,staffName:staff.name,staffRole:staff.role,action:`Updated custom design #${data.id} to ${data.status}`,entityType:"custom_design",entityId:data.id});return {success:true}});
