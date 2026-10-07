import crypto from "node:crypto";
const COOKIE="set_apart_customer_session";const MAX=60*60*24*30;
function secret(){if(!process.env.SESSION_SECRET)throw new Error("SESSION_SECRET is not set.");return process.env.SESSION_SECRET}
function sign(v:string){return crypto.createHmac("sha256",secret()).update(v).digest("base64url")}
export function createCustomerToken(customerId:number){const body=Buffer.from(JSON.stringify({customerId,exp:Date.now()+MAX*1000})).toString("base64url");return `${body}.${sign(body)}`}
export function verifyCustomerToken(token:string|null|undefined){if(!token)return null;const[a,b]=token.split(".");if(!a||!b)return null;const e=sign(a),aa=Buffer.from(b),bb=Buffer.from(e);if(aa.length!==bb.length||!crypto.timingSafeEqual(aa,bb))return null;try{const x=JSON.parse(Buffer.from(a,"base64url").toString());return x.exp>Date.now()?x.customerId as number:null}catch{return null}}
export const CUSTOMER_COOKIE={name:COOKIE,maxAgeSeconds:MAX};
