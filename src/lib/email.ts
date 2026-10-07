export async function sendTransactionalEmail(input:{to:string;subject:string;html:string}){
 const key=process.env.BREVO_API_KEY;const sender=process.env.EMAIL_FROM;
 if(!key||!sender||!input.to)return {sent:false,skipped:true};
 const response=await fetch("https://api.brevo.com/v3/smtp/email",{method:"POST",headers:{"api-key":key,"content-type":"application/json"},body:JSON.stringify({sender:{email:sender.match(/<([^>]+)>/)?.[1]??sender.replace(/^.*?\s*/,'').trim(),name:sender.match(/^(.*?)\s*</)?.[1]?.trim()??"SET APART"},to:[{email:input.to}],subject:input.subject,htmlContent:input.html})});
 if(!response.ok)throw new Error(`Transactional email failed (${response.status}).`);return {sent:true};
}
