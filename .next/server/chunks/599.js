exports.id=599,exports.ids=[599],exports.modules={25591:(a,b,c)=>{Promise.resolve().then(c.bind(c,68734))},31391:(a,b,c)=>{"use strict";c.d(b,{B:()=>g,E:()=>f});var d=c(55511);function e(a,b,c,e){return new Promise((f,g)=>{(0,d.scrypt)(a,b,c,e,(a,b)=>a?g(a):f(b))})}async function f(a){let b=(0,d.randomBytes)(16),c=await e(a.normalize("NFKC"),b,32,{N:16384,r:8,p:1,maxmem:0x4000000});return`scrypt$16384$8$1$${b.toString("base64")}$${c.toString("base64")}`}async function g(a,b){let c,f,g,h=b.split("$");if(6!==h.length||"scrypt"!==h[0])return!1;let i=Number(h[1]),j=Number(h[2]),k=Number(h[3]);try{c=Buffer.from(h[4],"base64"),f=Buffer.from(h[5],"base64")}catch{return!1}if(!Number.isInteger(i)||!Number.isInteger(j)||!Number.isInteger(k)||i<2||0===c.length||0===f.length)return!1;try{g=await e(a.normalize("NFKC"),c,f.length,{N:i,r:j,p:k,maxmem:0x4000000})}catch{return!1}return g.length===f.length&&(0,d.timingSafeEqual)(g,f)}},33340:(a,b,c)=>{"use strict";c.d(b,{ThemeProvider:()=>d});let d=(0,c(97954).registerClientReference)(function(){throw Error("Attempted to call ThemeProvider() from the server but ThemeProvider is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"D:\\crm\\src\\components\\theme-provider.tsx","ThemeProvider")},44943:(a,b,c)=>{"use strict";c.d(b,{cn:()=>f});var d=c(43249),e=c(58829);function f(...a){return(0,e.QP)((0,d.$)(a))}},45877:(a,b,c)=>{Promise.resolve().then(c.t.bind(c,81170,23)),Promise.resolve().then(c.t.bind(c,23597,23)),Promise.resolve().then(c.t.bind(c,36893,23)),Promise.resolve().then(c.t.bind(c,89748,23)),Promise.resolve().then(c.t.bind(c,6060,23)),Promise.resolve().then(c.t.bind(c,7184,23)),Promise.resolve().then(c.t.bind(c,69576,23)),Promise.resolve().then(c.t.bind(c,73041,23)),Promise.resolve().then(c.t.bind(c,51384,23))},50009:(a,b,c)=>{"use strict";c.d(b,{ky:()=>o,OC:()=>m,J0:()=>n});var d=c(70495),e=c(69206),f=c(55511);let g="crm_session";function h(a){return(0,f.createHash)("sha256").update(a).digest("hex")}var i=c(66896),j=c(67697);let k=function(a=process.env){let b=(a.SAJTPRESS_INTEGRATION??"").trim().toLowerCase();return{enabled:"on"===b||"1"===b||"true"===b,webappUrl:(a.WEBAPP_INTERNAL_URL??"").trim().replace(/\/+$/,""),secret:(a.INTERNAL_API_SECRET??"").trim(),cookieDomain:(a.SESSION_COOKIE_DOMAIN??"").trim()}}();async function l(){let a=await (0,d.UL)(),b=a.get(g)?.value;if(!b)return null;let c=await (0,j.Fg)(h(b)).catch(()=>null);if(!c)return null;let e=await (0,j.kl)(c.user_id).catch(()=>null);return e&&"active"===e.status?{userId:e.id,organizationId:e.organization_id,email:e.email,name:e.name,role:(0,i.aU)(e.role)}:null}async function m(){let a=await l();return a||(0,e.redirect)("/login"),a}async function n(a,b){let c=(0,f.randomBytes)(32).toString("base64url"),e=new Date(Date.now()+2592e6);await (0,j.jw)({userId:a,organizationId:b,tokenHash:h(c),expiresAt:e}),(await (0,d.UL)()).set(g,c,{httpOnly:!0,secure:!0,sameSite:"lax",path:"/",expires:e,domain:k.cookieDomain||void 0})}async function o(){let a=await (0,d.UL)(),b=a.get(g)?.value;b&&await (0,j.g9)(h(b)).catch(()=>{}),a.delete(g)}},51472:(a,b,c)=>{"use strict";c.r(b),c.d(b,{default:()=>j,metadata:()=>h,viewport:()=>i});var d=c(75338),e=c(18039),f=c.n(e),g=c(33340);c(61135);let h={title:"Sajtpress CRM",description:"AI sales CRM for the Sajtpress platform."},i={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:[{media:"(prefers-color-scheme: light)",color:"#f8f9fb"},{media:"(prefers-color-scheme: dark)",color:"#0d0f14"}]};function j({children:a}){return(0,d.jsx)("html",{lang:"en",suppressHydrationWarning:!0,children:(0,d.jsx)("body",{className:`${f().className} min-h-screen bg-background text-foreground antialiased`,children:(0,d.jsx)(g.ThemeProvider,{children:a})})})}},58201:(a,b,c)=>{"use strict";c.d(b,{UH:()=>i,Zm:()=>k,iC:()=>j});var d=c(91488);c(27806);var e=c(69206),f=c(67697),g=c(31391),h=c(50009);async function i(a){let b;try{b=await (0,f._)()}catch{return{error:"Database not reachable — check the server configuration."}}if(b>0)return{error:"Setup has already been completed. Please sign in."};let c=a.orgName.trim(),d=a.email.trim().toLowerCase();if(!c)return{error:"Organization name is required."};if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d))return{error:"Enter a valid email address."};if(a.password.length<8)return{error:"Password must be at least 8 characters."};let e=await (0,f.EC)(c,c.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,120)||"org"),i=await (0,g.E)(a.password),j=await (0,f.kg)({organizationId:e,email:d,name:a.name.trim(),passwordHash:i,role:"owner"});return await (0,h.J0)(j,e),{ok:!0}}async function j(a){let b,c=a.email.trim().toLowerCase();try{b=await (0,f.ht)(c)}catch{return{error:"Database not reachable — check the server configuration."}}let d=await (0,g.B)(a.password,b?.password_hash??"scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");return b&&d?(await (0,h.J0)(b.id,b.organization_id),await (0,f.lY)(b.id).catch(()=>{}),{ok:!0}):{error:"Invalid email or password."}}async function k(){await (0,h.ky)(),(0,e.redirect)("/login")}(0,c(40410).D)([i,j,k]),(0,d.A)(i,"40620cf50a76957dc6541c116ec2cc370b36a056db",null),(0,d.A)(j,"4064586f9e9abd1b991b1c97f0fe721f59e67bde17",null),(0,d.A)(k,"006cb1d53f1b05ecb010f5f46f9b998b6ce65876b7",null)},61135:()=>{},65343:(a,b,c)=>{Promise.resolve().then(c.bind(c,33340))},66896:(a,b,c)=>{"use strict";c.d(b,{$3:()=>h,aU:()=>i,tm:()=>e});let d=["owner","admin","member"];function e(a){return d.includes(a)}let f={owner:3,admin:2,member:1},g={"company:read":"member","company:write":"member","company:delete":"admin","deal:read":"member","deal:write":"member","deal:delete":"admin","member:manage":"admin","org:manage":"owner"};function h(a,b){return f[a]>=f[g[b]]}function i(a){return a&&e(a)?a:"member"}},67697:(a,b,c)=>{"use strict";c.d(b,{C1:()=>k,EC:()=>B,Et:()=>u,Fg:()=>L,IP:()=>q,JT:()=>l,Kd:()=>v,MO:()=>s,PH:()=>o,RC:()=>m,RO:()=>x,Sv:()=>H,ZZ:()=>G,_:()=>A,eK:()=>i,f8:()=>n,fs:()=>N,g9:()=>M,ht:()=>D,iG:()=>w,if:()=>J,ik:()=>r,jw:()=>K,kF:()=>p,kg:()=>C,kl:()=>E,lJ:()=>O,lY:()=>F,mm:()=>j,ro:()=>t,s3:()=>y,v_:()=>I});var d=c(56275);let e=globalThis;function f(){return e.__cmsPool||(e.__cmsPool=d.createPool({host:process.env.DB_HOST||"localhost",port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER||"",password:process.env.DB_PASSWORD||"",database:process.env.DB_NAME||"",waitForConnections:!0,connectionLimit:5,charset:"utf8mb4_general_ci"})),e.__cmsPool}async function g(a,b,c,d){let[e]=await a.query("SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",[b,c]);0===Number(e[0]?.n??0)&&await a.query(`ALTER TABLE \`${b}\` ADD COLUMN ${d}`)}function h(){return e.__crmSchema||(e.__crmSchema=(async()=>{let a=f();await a.query(`
        CREATE TABLE IF NOT EXISTS crm_companies (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL DEFAULT 0,
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
          organization_id INT UNSIGNED NOT NULL DEFAULT 0,
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
          organization_id INT UNSIGNED NOT NULL DEFAULT 0,
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
          organization_id INT UNSIGNED NOT NULL DEFAULT 0,
          company_id INT UNSIGNED NOT NULL,
          contact_id INT UNSIGNED NULL,
          type VARCHAR(20) NOT NULL DEFAULT 'note',
          summary VARCHAR(500) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_activity_company (company_id, id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await g(a,"crm_companies","organization_id","organization_id INT UNSIGNED NOT NULL DEFAULT 0"),await g(a,"crm_contacts","organization_id","organization_id INT UNSIGNED NOT NULL DEFAULT 0"),await g(a,"crm_deals","organization_id","organization_id INT UNSIGNED NOT NULL DEFAULT 0"),await g(a,"crm_activities","organization_id","organization_id INT UNSIGNED NOT NULL DEFAULT 0")})().catch(a=>{throw e.__crmSchema=void 0,a})),e.__crmSchema}async function i(a,b){await h();let[c]=await f().query(`INSERT INTO crm_companies (organization_id, name, industry, city, website, employees, annual_value, status, account_manager, industry_match)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[a,b.name.slice(0,190),(b.industry??"").slice(0,120),(b.city??"").slice(0,120),(b.website??"").slice(0,300),b.employees??null,b.annualValue??0,(b.status??"lead").slice(0,20),(b.accountManager??"").slice(0,120),+!!b.industryMatch]);return c.insertId}async function j(a,b={}){await h();let c=["organization_id = ?"],d=[a];if(b.q){c.push("(name LIKE ? OR industry LIKE ? OR city LIKE ?)");let a=`%${b.q}%`;d.push(a,a,a)}b.status&&(c.push("status = ?"),d.push(b.status));let[e]=await f().query(`SELECT * FROM crm_companies WHERE ${c.join(" AND ")} ORDER BY updated_at DESC LIMIT 500`,d);return e}async function k(a,b){await h();let[c]=await f().query("SELECT * FROM crm_companies WHERE id = ? AND organization_id = ? LIMIT 1",[b,a]);return c[0]??null}async function l(a,b,c){await h(),await f().query("UPDATE crm_companies SET name=?, industry=?, city=?, website=?, employees=?, annual_value=?, status=?, account_manager=?, industry_match=? WHERE id=? AND organization_id=?",[c.name.slice(0,190),(c.industry??"").slice(0,120),(c.city??"").slice(0,120),(c.website??"").slice(0,300),c.employees??null,c.annualValue??0,(c.status??"lead").slice(0,20),(c.accountManager??"").slice(0,120),+!!c.industryMatch,b,a])}async function m(a,b){await h();let c=f();await c.query("DELETE FROM crm_activities WHERE company_id = ? AND organization_id = ?",[b,a]),await c.query("DELETE FROM crm_deals WHERE company_id = ? AND organization_id = ?",[b,a]),await c.query("DELETE FROM crm_contacts WHERE company_id = ? AND organization_id = ?",[b,a]),await c.query("DELETE FROM crm_companies WHERE id = ? AND organization_id = ?",[b,a])}async function n(a,b={}){await h();let c=["c.organization_id = ?"],d=[a];if(b.q){c.push("(c.name LIKE ? OR c.industry LIKE ? OR c.city LIKE ?)");let a=`%${b.q}%`;d.push(a,a,a)}b.status&&(c.push("c.status = ?"),d.push(b.status));let[e]=await f().query(`SELECT c.*,
       (SELECT COUNT(*) FROM crm_contacts ct WHERE ct.company_id = c.id) AS contacts,
       (SELECT COUNT(*) FROM crm_deals d WHERE d.company_id = c.id AND d.stage NOT IN ('won','lost')) AS open_deals,
       (SELECT COALESCE(SUM(d.value),0) FROM crm_deals d WHERE d.company_id = c.id AND d.stage NOT IN ('won','lost')) AS open_value,
       (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.company_id = c.id) AS last_activity
       FROM crm_companies c
      WHERE ${c.join(" AND ")}
      ORDER BY c.updated_at DESC LIMIT 500`,d);return e}async function o(a,b){let c=b.filter(a=>Number.isInteger(a)).slice(0,500);if(!c.length)return;await h();let d=c.map(()=>"?").join(","),e=f();await e.query(`DELETE FROM crm_activities WHERE organization_id = ? AND company_id IN (${d})`,[a,...c]),await e.query(`DELETE FROM crm_deals WHERE organization_id = ? AND company_id IN (${d})`,[a,...c]),await e.query(`DELETE FROM crm_contacts WHERE organization_id = ? AND company_id IN (${d})`,[a,...c]),await e.query(`DELETE FROM crm_companies WHERE organization_id = ? AND id IN (${d})`,[a,...c])}async function p(a,b,c){let d=b.filter(a=>Number.isInteger(a)).slice(0,500);if(!d.length)return;await h();let e=d.map(()=>"?").join(",");await f().query(`UPDATE crm_companies SET status = ? WHERE organization_id = ? AND id IN (${e})`,[c.slice(0,20),a,...d])}async function q(a,b,c){await h();let[d]=await f().query("INSERT INTO crm_contacts (organization_id, company_id, name, role, email, phone, department, influence) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",[a,b,c.name.slice(0,190),(c.role??"").slice(0,120),(c.email??"").slice(0,190),(c.phone??"").slice(0,60),(c.department??"").slice(0,60),(c.influence??"none").slice(0,20)]);return d.insertId}async function r(a,b){await h();let[c]=await f().query("SELECT * FROM crm_contacts WHERE company_id = ? AND organization_id = ? ORDER BY id ASC",[b,a]);return c}async function s(a,b){await h(),await f().query("DELETE FROM crm_contacts WHERE id = ? AND organization_id = ?",[b,a])}async function t(a,b,c){await h();let[d]=await f().query("INSERT INTO crm_deals (organization_id, company_id, title, value, stage, probability, expected_close, owner) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",[a,b,c.title.slice(0,190),c.value??0,(c.stage??"new").slice(0,20),c.probability??null,c.expectedClose||null,(c.owner??"").slice(0,120)]);return d.insertId}async function u(a,b={}){if(await h(),null!=b.companyId){let[c]=await f().query("SELECT * FROM crm_deals WHERE organization_id = ? AND company_id = ? ORDER BY updated_at DESC",[a,b.companyId]);return c}let[c]=await f().query("SELECT * FROM crm_deals WHERE organization_id = ? ORDER BY updated_at DESC LIMIT 1000",[a]);return c}async function v(a,b,c){await h();let d=[],e=[];void 0!==c.title&&(d.push("title=?"),e.push(c.title.slice(0,190))),void 0!==c.value&&(d.push("value=?"),e.push(c.value)),void 0!==c.stage&&(d.push("stage=?"),e.push(c.stage.slice(0,20))),void 0!==c.probability&&(d.push("probability=?"),e.push(c.probability)),void 0!==c.expectedClose&&(d.push("expected_close=?"),e.push(c.expectedClose||null)),void 0!==c.owner&&(d.push("owner=?"),e.push(c.owner.slice(0,120))),d.length&&(e.push(b,a),await f().query(`UPDATE crm_deals SET ${d.join(", ")} WHERE id = ? AND organization_id = ?`,e))}async function w(a,b){await h(),await f().query("DELETE FROM crm_deals WHERE id = ? AND organization_id = ?",[b,a])}async function x(a,b){await h();let[c]=await f().query("INSERT INTO crm_activities (organization_id, company_id, contact_id, type, summary) VALUES (?, ?, ?, ?, ?)",[a,b.companyId,b.contactId??null,(b.type??"note").slice(0,20),b.summary.slice(0,500)]);return c.insertId}async function y(a,b,c=50){await h();let[d]=await f().query("SELECT * FROM crm_activities WHERE company_id = ? AND organization_id = ? ORDER BY id DESC LIMIT ?",[b,a,c]);return d}function z(){return e.__crmAuthSchema||(e.__crmAuthSchema=(async()=>{let a=f();await a.query(`
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
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_audit_logs (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          user_id INT UNSIGNED NULL,
          actor_email VARCHAR(190) NOT NULL DEFAULT '',
          action VARCHAR(40) NOT NULL DEFAULT '',
          entity VARCHAR(40) NOT NULL DEFAULT '',
          entity_id INT UNSIGNED NULL,
          summary VARCHAR(255) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_audit_org (organization_id, id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `)})().catch(a=>{throw e.__crmAuthSchema=void 0,a})),e.__crmAuthSchema}async function A(){await z();let[a]=await f().query("SELECT COUNT(*) AS n FROM crm_users");return Number(a[0]?.n??0)}async function B(a,b){await z();let[c]=await f().query("INSERT INTO crm_organizations (name, slug) VALUES (?, ?)",[a.slice(0,190),b.slice(0,120)]);return c.insertId}async function C(a){await z();let[b]=await f().query("INSERT INTO crm_users (organization_id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)",[a.organizationId,a.email.toLowerCase().slice(0,190),(a.name??"").slice(0,190),a.passwordHash.slice(0,255),(a.role??"member").slice(0,20)]);return b.insertId}async function D(a){await z();let[b]=await f().query("SELECT * FROM crm_users WHERE email = ? AND status = 'active' LIMIT 1",[a.toLowerCase()]);return b[0]??null}async function E(a){await z();let[b]=await f().query("SELECT * FROM crm_users WHERE id = ? LIMIT 1",[a]);return b[0]??null}async function F(a){await z(),await f().query("UPDATE crm_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?",[a])}async function G(a){await z();let[b]=await f().query("SELECT * FROM crm_users WHERE organization_id = ? ORDER BY created_at ASC",[a]);return b}async function H(a){await z();let[b]=await f().query("SELECT COUNT(*) AS n FROM crm_users WHERE organization_id = ? AND role = 'owner' AND status = 'active'",[a]);return Number(b[0]?.n??0)}async function I(a,b,c){await z(),await f().query("UPDATE crm_users SET role = ? WHERE id = ? AND organization_id = ?",[c.slice(0,20),b,a])}async function J(a,b,c){await z(),await f().query("UPDATE crm_users SET status = ? WHERE id = ? AND organization_id = ?",[c.slice(0,20),b,a])}async function K(a){await z(),await f().query("INSERT INTO crm_sessions (user_id, organization_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",[a.userId,a.organizationId,a.tokenHash,a.expiresAt])}async function L(a){await z();let[b]=await f().query("SELECT * FROM crm_sessions WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP LIMIT 1",[a]);return b[0]??null}async function M(a){await z(),await f().query("DELETE FROM crm_sessions WHERE token_hash = ?",[a])}async function N(a){await z(),await f().query("INSERT INTO crm_audit_logs (organization_id, user_id, actor_email, action, entity, entity_id, summary) VALUES (?, ?, ?, ?, ?, ?, ?)",[a.organizationId,a.userId,a.actorEmail.slice(0,190),a.action.slice(0,40),a.entity.slice(0,40),a.entityId??null,(a.summary??"").slice(0,255)])}async function O(a,b=100){await z();let[c]=await f().query("SELECT * FROM crm_audit_logs WHERE organization_id = ? ORDER BY id DESC LIMIT ?",[a,b]);return c}},68734:(a,b,c)=>{"use strict";c.d(b,{ThemeProvider:()=>f});var d=c(21124),e=c(45523);function f({children:a}){return(0,d.jsx)(e.N,{attribute:"class",defaultTheme:"dark",enableSystem:!1,children:a})}},87080:a=>{function b(a){var b=Error("Cannot find module '"+a+"'");throw b.code="MODULE_NOT_FOUND",b}b.keys=()=>[],b.resolve=b,b.id=87080,a.exports=b},87733:(a,b,c)=>{Promise.resolve().then(c.t.bind(c,54160,23)),Promise.resolve().then(c.t.bind(c,31603,23)),Promise.resolve().then(c.t.bind(c,68495,23)),Promise.resolve().then(c.t.bind(c,75170,23)),Promise.resolve().then(c.t.bind(c,77526,23)),Promise.resolve().then(c.t.bind(c,78922,23)),Promise.resolve().then(c.t.bind(c,29234,23)),Promise.resolve().then(c.t.bind(c,12263,23)),Promise.resolve().then(c.bind(c,82146))}};