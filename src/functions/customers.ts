import {createServerFn,createServerOnlyFn} from "@tanstack/react-start";import {getCookie,setCookie,deleteCookie} from "@tanstack/react-start/server";import {desc,eq} from "drizzle-orm";import bcrypt from "bcryptjs";import {z} from "zod";import {db} from "@/db/client";import {customers,orders} from "@/db/schema";import {createCustomerToken,CUSTOMER_COOKIE,verifyCustomerToken} from "@/lib/customer-session";
import {createCustomerResetToken,readCustomerResetToken,passwordFingerprint,CUSTOMER_RESET_TTL_MINUTES} from "@/lib/customer-reset";
import {sendTransactionalEmail} from "@/lib/email";
import crypto from "node:crypto";
const esc=(v:string)=>v.replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch] as string));
/** Emails a signed password link. Falls back to the server log if email isn't configured. */
async function sendPasswordLink(c:{id:number;name:string;email:string|null;passwordHash:string|null},mode:"reset"|"claim"){
  if(!c.email)return;
  const base=(process.env.APP_URL??"http://localhost:3000").replace(/\/+$/,"");
  const link=`${base}/reset-password/${createCustomerResetToken(c)}`;
  const claim=mode==="claim";
  try{
    const r=await sendTransactionalEmail({to:c.email,subject:claim?"Set your SET APART password":"Reset your SET APART password",html:`<div style="font-family:Arial,sans-serif;background:#050505;color:#f2f2f2;padding:32px"><h2 style="margin:0 0 12px">${claim?"Finish creating your account":"Reset your password"}</h2><p>Hi ${esc(c.name)}, ${claim?"we found your previous orders with this email. Use the button below to set a password and access your account.":"use the button below to choose a new password."} This link expires in ${CUSTOMER_RESET_TTL_MINUTES} minutes.</p><p style="margin:24px 0"><a href="${link}" style="background:#e10600;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold">${claim?"Set password":"Reset password"}</a></p><p style="font-size:12px;color:#999">If you didn't request this, you can ignore this email.</p></div>`});
    if(r.sent)return;
  }catch(err){console.error("[customer-password] email failed",err)}
  console.log(`[customer-password] ${c.email} → ${link} (expires in ${CUSTOMER_RESET_TTL_MINUTES}m)`);
}
const credentials=z.object({name:z.string().min(1).max(160).optional(),email:z.string().email(),password:z.string().min(8)});
export const registerCustomer=createServerFn({method:"POST"}).validator(credentials).handler(async({data})=>{const exists=await db.query.customers.findFirst({where:eq(customers.email,data.email.toLowerCase())});if(exists&&exists.passwordHash)throw new Error("An account already exists for that email.");if(exists){await sendPasswordLink(exists,"claim");return{verify:true as const,email:data.email.toLowerCase()}}const[c]=await db.insert(customers).values({name:data.name||data.email.split("@")[0]||"Customer",email:data.email.toLowerCase(),passwordHash:await bcrypt.hash(data.password,12)}).returning({id:customers.id,name:customers.name,email:customers.email});if(!c)throw new Error("Could not create account.");setCookie(CUSTOMER_COOKIE.name,createCustomerToken(c.id),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:CUSTOMER_COOKIE.maxAgeSeconds});return c});
export const loginCustomer=createServerFn({method:"POST"}).validator(credentials.omit({name:true})).handler(async({data})=>{const c=await db.query.customers.findFirst({where:eq(customers.email,data.email.toLowerCase())});if(!c?.passwordHash||!(await bcrypt.compare(data.password,c.passwordHash)))throw new Error("Invalid email or password.");setCookie(CUSTOMER_COOKIE.name,createCustomerToken(c.id),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:CUSTOMER_COOKIE.maxAgeSeconds});return{id:c.id,name:c.name,email:c.email}});
export const logoutCustomer=createServerFn({method:"POST"}).handler(async()=>{deleteCookie(CUSTOMER_COOKIE.name,{path:"/"});return{success:true}});
export const getCurrentCustomer=createServerFn({method:"GET"}).handler(async()=>{const id=verifyCustomerToken(getCookie(CUSTOMER_COOKIE.name));if(!id)return null;const c=await db.query.customers.findFirst({where:eq(customers.id,id)});return c?{id:c.id,name:c.name,email:c.email,phone:c.phone}:null;});
export const requireCustomer=createServerOnlyFn(async()=>{const id=verifyCustomerToken(getCookie(CUSTOMER_COOKIE.name));if(!id)throw new Error("UNAUTHORIZED");const c=await db.query.customers.findFirst({where:eq(customers.id,id)});if(!c)throw new Error("UNAUTHORIZED");return c});

const GENERIC_RESET_MESSAGE="If that email has an account or past orders, we've sent a link to set a new password.";
export const requestCustomerPasswordReset=createServerFn({method:"POST"}).validator(z.object({email:z.string().email()})).handler(async({data})=>{
  const c=await db.query.customers.findFirst({where:eq(customers.email,data.email.toLowerCase())});
  if(c)await sendPasswordLink(c,c.passwordHash?"reset":"claim");
  return{message:GENERIC_RESET_MESSAGE};
});
export const resetCustomerPassword=createServerFn({method:"POST"}).validator(z.object({token:z.string().min(10),password:z.string().min(8,"Password must be at least 8 characters.")})).handler(async({data})=>{
  const invalid=new Error("This link is invalid or has expired. Please request a new one.");
  const t=readCustomerResetToken(data.token);if(!t)throw invalid;
  const c=await db.query.customers.findFirst({where:eq(customers.id,t.customerId)});if(!c)throw invalid;
  const a=Buffer.from(passwordFingerprint(c.passwordHash)),b=Buffer.from(t.fingerprint);
  if(a.length!==b.length||!crypto.timingSafeEqual(a,b))throw invalid;
  await db.update(customers).set({passwordHash:await bcrypt.hash(data.password,12),updatedAt:new Date()}).where(eq(customers.id,c.id));
  setCookie(CUSTOMER_COOKIE.name,createCustomerToken(c.id),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:CUSTOMER_COOKIE.maxAgeSeconds});
  return{success:true};
});
export const getMyOrders=createServerFn({method:"GET"}).handler(async()=>{
  const c=await requireCustomer();
  const rows=await db.query.orders.findMany({where:eq(orders.customerId,c.id),orderBy:desc(orders.createdAt),limit:50,columns:{orderNumber:true,trackingToken:true,total:true,orderStatus:true,createdAt:true}});
  return rows.map(r=>({orderNumber:r.orderNumber,trackingToken:r.trackingToken,total:Number(r.total),status:r.orderStatus,createdAt:r.createdAt.toISOString()}));
});
