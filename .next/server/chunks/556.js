exports.id=556,exports.ids=[556],exports.modules={20595:(a,b,c)=>{"use strict";c.d(b,{z:()=>e});var d=c(75338);function e({title:a,subtitle:b,children:c}){return(0,d.jsx)("div",{className:"grid min-h-screen place-items-center bg-background p-4",children:(0,d.jsxs)("div",{className:"w-full max-w-sm",children:[(0,d.jsxs)("div",{className:"mb-6 text-center",children:[(0,d.jsxs)("p",{className:"text-lg font-semibold tracking-tight",children:["Sajt",(0,d.jsx)("span",{className:"text-electric",children:"press"})," ",(0,d.jsx)("span",{className:"text-muted-foreground",children:"CRM"})]}),(0,d.jsx)("h1",{className:"mt-5 text-xl font-semibold tracking-tight",children:a}),b&&(0,d.jsx)("p",{className:"mt-1 text-sm text-muted-foreground",children:b})]}),(0,d.jsx)("div",{className:"surface p-5",children:c})]})})}},28303:a=>{function b(a){var b=Error("Cannot find module '"+a+"'");throw b.code="MODULE_NOT_FOUND",b}b.keys=()=>[],b.resolve=b,b.id=28303,a.exports=b},35284:(a,b,c)=>{"use strict";c.d(b,{$:()=>i});var d=c(21124),e=c(38301),f=c(44943);let g={default:"bg-electric text-white shadow-xs hover:bg-electric/90",outline:"border border-border bg-card hover:bg-secondary",ghost:"bg-transparent hover:bg-secondary text-foreground",danger:"bg-danger text-white shadow-xs hover:bg-danger/90"},h={sm:"h-8 px-2.5 text-xs gap-1.5",md:"h-9 px-3.5 text-sm gap-1.5",icon:"h-8 w-8"},i=e.forwardRef(({className:a,variant:b="default",size:c="md",...e},i)=>(0,d.jsx)("button",{ref:i,className:(0,f.cn)("inline-flex items-center justify-center rounded-lg font-medium transition-colors","focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50","disabled:cursor-not-allowed disabled:opacity-50",g[b],h[c],a),...e}));i.displayName="Button"},35552:(a,b,c)=>{"use strict";c.d(b,{Bw:()=>g,C1:()=>k,Et:()=>u,Fg:()=>C,IP:()=>q,JT:()=>l,Kd:()=>v,MO:()=>s,PH:()=>o,RC:()=>m,RO:()=>x,_:()=>A,eK:()=>i,f8:()=>n,iG:()=>w,ik:()=>r,kF:()=>p,kl:()=>B,mm:()=>j,ro:()=>t,s3:()=>y});var d=c(29382);let e=globalThis;function f(){return e.__cmsPool||(e.__cmsPool=d.createPool({host:process.env.DB_HOST||"localhost",port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER||"",password:process.env.DB_PASSWORD||"",database:process.env.DB_NAME||"",waitForConnections:!0,connectionLimit:5,charset:"utf8mb4_general_ci"})),e.__cmsPool}async function g(){if(!process.env.DB_NAME)return!1;try{return await f().query("SELECT 1"),!0}catch{return!1}}function h(){return e.__crmSchema||(e.__crmSchema=(async()=>{let a=f();await a.query(`
        CREATE TABLE IF NOT EXISTS crm_companies (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(190) NOT NULL DEFAULT '',
          industry VARCHAR(120) NOT NULL DEFAULT '',
          city VARCHAR(120) NOT NULL DEFAULT '',
          website VARCHAR(300) NOT NULL DEFAULT '',
          employees INT UNSIGNED NULL,
          annual_value INT UNSIGNED NOT NULL DEFAULT 0,
          status VARCHAR(20) NOT NULL DEFAULT 'lead',
          account_manager VARCHAR(120) NOT NULL DEFAULT '',
          industry_match TINYINT(1) NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_company_status (status, name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_contacts (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          company_id INT UNSIGNED NOT NULL,
          name VARCHAR(190) NOT NULL DEFAULT '',
          role VARCHAR(120) NOT NULL DEFAULT '',
          email VARCHAR(190) NOT NULL DEFAULT '',
          phone VARCHAR(60) NOT NULL DEFAULT '',
          department VARCHAR(60) NOT NULL DEFAULT '',
          influence VARCHAR(20) NOT NULL DEFAULT 'none',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_contact_company (company_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_deals (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          company_id INT UNSIGNED NOT NULL,
          title VARCHAR(190) NOT NULL DEFAULT '',
          value INT UNSIGNED NOT NULL DEFAULT 0,
          stage VARCHAR(20) NOT NULL DEFAULT 'new',
          probability TINYINT UNSIGNED NULL,
          expected_close DATE NULL,
          owner VARCHAR(120) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_deal_company (company_id),
          INDEX idx_deal_stage (stage)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_activities (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          company_id INT UNSIGNED NOT NULL,
          contact_id INT UNSIGNED NULL,
          type VARCHAR(20) NOT NULL DEFAULT 'note',
          summary VARCHAR(500) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_activity_company (company_id, id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `)})().catch(a=>{throw e.__crmSchema=void 0,a})),e.__crmSchema}async function i(a){await h();let[b]=await f().query(`INSERT INTO crm_companies (name, industry, city, website, employees, annual_value, status, account_manager, industry_match)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,[a.name.slice(0,190),(a.industry??"").slice(0,120),(a.city??"").slice(0,120),(a.website??"").slice(0,300),a.employees??null,a.annualValue??0,(a.status??"lead").slice(0,20),(a.accountManager??"").slice(0,120),+!!a.industryMatch]);return b.insertId}async function j(a={}){await h();let b=[],c=[];if(a.q){b.push("(name LIKE ? OR industry LIKE ? OR city LIKE ?)");let d=`%${a.q}%`;c.push(d,d,d)}a.status&&(b.push("status = ?"),c.push(a.status));let[d]=await f().query(`SELECT * FROM crm_companies ${b.length?`WHERE ${b.join(" AND ")}`:""} ORDER BY updated_at DESC LIMIT 500`,c);return d}async function k(a){await h();let[b]=await f().query("SELECT * FROM crm_companies WHERE id = ? LIMIT 1",[a]);return b[0]??null}async function l(a,b){await h(),await f().query("UPDATE crm_companies SET name=?, industry=?, city=?, website=?, employees=?, annual_value=?, status=?, account_manager=?, industry_match=? WHERE id=?",[b.name.slice(0,190),(b.industry??"").slice(0,120),(b.city??"").slice(0,120),(b.website??"").slice(0,300),b.employees??null,b.annualValue??0,(b.status??"lead").slice(0,20),(b.accountManager??"").slice(0,120),+!!b.industryMatch,a])}async function m(a){await h();let b=f();await b.query("DELETE FROM crm_activities WHERE company_id = ?",[a]),await b.query("DELETE FROM crm_deals WHERE company_id = ?",[a]),await b.query("DELETE FROM crm_contacts WHERE company_id = ?",[a]),await b.query("DELETE FROM crm_companies WHERE id = ?",[a])}async function n(a={}){await h();let b=[],c=[];if(a.q){b.push("(c.name LIKE ? OR c.industry LIKE ? OR c.city LIKE ?)");let d=`%${a.q}%`;c.push(d,d,d)}a.status&&(b.push("c.status = ?"),c.push(a.status));let[d]=await f().query(`SELECT c.*,
       (SELECT COUNT(*) FROM crm_contacts ct WHERE ct.company_id = c.id) AS contacts,
       (SELECT COUNT(*) FROM crm_deals d WHERE d.company_id = c.id AND d.stage NOT IN ('won','lost')) AS open_deals,
       (SELECT COALESCE(SUM(d.value),0) FROM crm_deals d WHERE d.company_id = c.id AND d.stage NOT IN ('won','lost')) AS open_value,
       (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.company_id = c.id) AS last_activity
       FROM crm_companies c
      ${b.length?`WHERE ${b.join(" AND ")}`:""}
      ORDER BY c.updated_at DESC LIMIT 500`,c);return d}async function o(a){let b=a.filter(a=>Number.isInteger(a)).slice(0,500);if(!b.length)return;await h();let c=b.map(()=>"?").join(","),d=f();await d.query(`DELETE FROM crm_activities WHERE company_id IN (${c})`,b),await d.query(`DELETE FROM crm_deals WHERE company_id IN (${c})`,b),await d.query(`DELETE FROM crm_contacts WHERE company_id IN (${c})`,b),await d.query(`DELETE FROM crm_companies WHERE id IN (${c})`,b)}async function p(a,b){let c=a.filter(a=>Number.isInteger(a)).slice(0,500);if(!c.length)return;await h();let d=c.map(()=>"?").join(",");await f().query(`UPDATE crm_companies SET status = ? WHERE id IN (${d})`,[b.slice(0,20),...c])}async function q(a,b){await h();let[c]=await f().query("INSERT INTO crm_contacts (company_id, name, role, email, phone, department, influence) VALUES (?, ?, ?, ?, ?, ?, ?)",[a,b.name.slice(0,190),(b.role??"").slice(0,120),(b.email??"").slice(0,190),(b.phone??"").slice(0,60),(b.department??"").slice(0,60),(b.influence??"none").slice(0,20)]);return c.insertId}async function r(a){await h();let[b]=await f().query("SELECT * FROM crm_contacts WHERE company_id = ? ORDER BY id ASC",[a]);return b}async function s(a){await h(),await f().query("DELETE FROM crm_contacts WHERE id = ?",[a])}async function t(a,b){await h();let[c]=await f().query("INSERT INTO crm_deals (company_id, title, value, stage, probability, expected_close, owner) VALUES (?, ?, ?, ?, ?, ?, ?)",[a,b.title.slice(0,190),b.value??0,(b.stage??"new").slice(0,20),b.probability??null,b.expectedClose||null,(b.owner??"").slice(0,120)]);return c.insertId}async function u(a={}){if(await h(),null!=a.companyId){let[b]=await f().query("SELECT * FROM crm_deals WHERE company_id = ? ORDER BY updated_at DESC",[a.companyId]);return b}let[b]=await f().query("SELECT * FROM crm_deals ORDER BY updated_at DESC LIMIT 1000");return b}async function v(a,b){await h();let c=[],d=[];void 0!==b.title&&(c.push("title=?"),d.push(b.title.slice(0,190))),void 0!==b.value&&(c.push("value=?"),d.push(b.value)),void 0!==b.stage&&(c.push("stage=?"),d.push(b.stage.slice(0,20))),void 0!==b.probability&&(c.push("probability=?"),d.push(b.probability)),void 0!==b.expectedClose&&(c.push("expected_close=?"),d.push(b.expectedClose||null)),void 0!==b.owner&&(c.push("owner=?"),d.push(b.owner.slice(0,120))),c.length&&(d.push(a),await f().query(`UPDATE crm_deals SET ${c.join(", ")} WHERE id = ?`,d))}async function w(a){await h(),await f().query("DELETE FROM crm_deals WHERE id = ?",[a])}async function x(a){await h();let[b]=await f().query("INSERT INTO crm_activities (company_id, contact_id, type, summary) VALUES (?, ?, ?, ?)",[a.companyId,a.contactId??null,(a.type??"note").slice(0,20),a.summary.slice(0,500)]);return b.insertId}async function y(a,b=50){await h();let[c]=await f().query("SELECT * FROM crm_activities WHERE company_id = ? ORDER BY id DESC LIMIT ?",[a,b]);return c}function z(){return e.__crmAuthSchema||(e.__crmAuthSchema=(async()=>{let a=f();await a.query(`
        CREATE TABLE IF NOT EXISTS crm_organizations (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(190) NOT NULL DEFAULT '',
          slug VARCHAR(120) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_org_slug (slug)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_users (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          email VARCHAR(190) NOT NULL,
          name VARCHAR(190) NOT NULL DEFAULT '',
          password_hash VARCHAR(255) NOT NULL DEFAULT '',
          role VARCHAR(20) NOT NULL DEFAULT 'member',
          status VARCHAR(20) NOT NULL DEFAULT 'active',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          last_login_at TIMESTAMP NULL,
          UNIQUE KEY uq_user_email (email),
          INDEX idx_user_org (organization_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_sessions (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          user_id INT UNSIGNED NOT NULL,
          organization_id INT UNSIGNED NOT NULL,
          token_hash CHAR(64) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NOT NULL,
          UNIQUE KEY uq_session_token (token_hash),
          INDEX idx_session_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `)})().catch(a=>{throw e.__crmAuthSchema=void 0,a})),e.__crmAuthSchema}async function A(){await z();let[a]=await f().query("SELECT COUNT(*) AS n FROM crm_users");return Number(a[0]?.n??0)}async function B(a){await z();let[b]=await f().query("SELECT * FROM crm_users WHERE id = ? LIMIT 1",[a]);return b[0]??null}async function C(a){await z();let[b]=await f().query("SELECT * FROM crm_sessions WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP LIMIT 1",[a]);return b[0]??null}},92100:(a,b,c)=>{"use strict";c.r(b),c.d(b,{"004430a9fae6cd4dde7806cb0a5a8c449839f45727":()=>s,"403cb700f07eadc92d0bf6ea33fe19edb30a73e63f":()=>q,"4073122afe1109b7dc451063c9b23af65c8a4ffda4":()=>r});var d=c(91488);c(27806);var e=c(69206),f=c(67697),g=c(55511);function h(a,b,c,d){return new Promise((e,f)=>{(0,g.scrypt)(a,b,c,d,(a,b)=>a?f(a):e(b))})}async function i(a){let b=(0,g.randomBytes)(16),c=await h(a.normalize("NFKC"),b,32,{N:16384,r:8,p:1,maxmem:0x4000000});return`scrypt$16384$8$1$${b.toString("base64")}$${c.toString("base64")}`}async function j(a,b){let c,d,e,f=b.split("$");if(6!==f.length||"scrypt"!==f[0])return!1;let i=Number(f[1]),j=Number(f[2]),k=Number(f[3]);try{c=Buffer.from(f[4],"base64"),d=Buffer.from(f[5],"base64")}catch{return!1}if(!Number.isInteger(i)||!Number.isInteger(j)||!Number.isInteger(k)||i<2||0===c.length||0===d.length)return!1;try{e=await h(a.normalize("NFKC"),c,d.length,{N:i,r:j,p:k,maxmem:0x4000000})}catch{return!1}return e.length===d.length&&(0,g.timingSafeEqual)(e,d)}var k=c(70495);function l(a){return(0,g.createHash)("sha256").update(a).digest("hex")}let m="crm_session",n=function(a=process.env){let b=(a.SAJTPRESS_INTEGRATION??"").trim().toLowerCase();return{enabled:"on"===b||"1"===b||"true"===b,webappUrl:(a.WEBAPP_INTERNAL_URL??"").trim().replace(/\/+$/,""),secret:(a.INTERNAL_API_SECRET??"").trim(),cookieDomain:(a.SESSION_COOKIE_DOMAIN??"").trim()}}();async function o(a,b){let c=(0,g.randomBytes)(32).toString("base64url"),d=new Date(Date.now()+2592e6);await (0,f.jw)({userId:a,organizationId:b,tokenHash:l(c),expiresAt:d}),(await (0,k.UL)()).set(m,c,{httpOnly:!0,secure:!0,sameSite:"lax",path:"/",expires:d,domain:n.cookieDomain||void 0})}async function p(){let a=await (0,k.UL)(),b=a.get(m)?.value;b&&await (0,f.g9)(l(b)).catch(()=>{}),a.delete(m)}async function q(a){let b;try{b=await (0,f._)()}catch{return{error:"Database not reachable — check the server configuration."}}if(b>0)return{error:"Setup has already been completed. Please sign in."};let c=a.orgName.trim(),d=a.email.trim().toLowerCase();if(!c)return{error:"Organization name is required."};if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d))return{error:"Enter a valid email address."};if(a.password.length<8)return{error:"Password must be at least 8 characters."};let e=await (0,f.EC)(c,c.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,120)||"org"),g=await i(a.password),h=await (0,f.kg)({organizationId:e,email:d,name:a.name.trim(),passwordHash:g,role:"owner"});return await o(h,e),{ok:!0}}async function r(a){let b,c=a.email.trim().toLowerCase();try{b=await (0,f.ht)(c)}catch{return{error:"Database not reachable — check the server configuration."}}let d=await j(a.password,b?.password_hash??"scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");return b&&d?(await o(b.id,b.organization_id),await (0,f.lY)(b.id).catch(()=>{}),{ok:!0}):{error:"Invalid email or password."}}async function s(){await p(),(0,e.redirect)("/login")}(0,c(40410).D)([q,r,s]),(0,d.A)(q,"403cb700f07eadc92d0bf6ea33fe19edb30a73e63f",null),(0,d.A)(r,"4073122afe1109b7dc451063c9b23af65c8a4ffda4",null),(0,d.A)(s,"004430a9fae6cd4dde7806cb0a5a8c449839f45727",null)}};