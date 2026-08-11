exports.id=324,exports.ids=[324],exports.modules={25591:(a,b,c)=>{Promise.resolve().then(c.bind(c,68734))},33340:(a,b,c)=>{"use strict";c.d(b,{ThemeProvider:()=>d});let d=(0,c(97954).registerClientReference)(function(){throw Error("Attempted to call ThemeProvider() from the server but ThemeProvider is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"D:\\crm\\src\\components\\theme-provider.tsx","ThemeProvider")},44943:(a,b,c)=>{"use strict";c.d(b,{cn:()=>f});var d=c(43249),e=c(58829);function f(...a){return(0,e.QP)((0,d.$)(a))}},45877:(a,b,c)=>{Promise.resolve().then(c.t.bind(c,81170,23)),Promise.resolve().then(c.t.bind(c,23597,23)),Promise.resolve().then(c.t.bind(c,36893,23)),Promise.resolve().then(c.t.bind(c,89748,23)),Promise.resolve().then(c.t.bind(c,6060,23)),Promise.resolve().then(c.t.bind(c,7184,23)),Promise.resolve().then(c.t.bind(c,69576,23)),Promise.resolve().then(c.t.bind(c,73041,23)),Promise.resolve().then(c.t.bind(c,51384,23))},51472:(a,b,c)=>{"use strict";c.r(b),c.d(b,{default:()=>j,metadata:()=>h,viewport:()=>i});var d=c(75338),e=c(18039),f=c.n(e),g=c(33340);c(61135);let h={title:"Sajtpress CRM",description:"AI sales CRM for the Sajtpress platform."},i={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:[{media:"(prefers-color-scheme: light)",color:"#f8f9fb"},{media:"(prefers-color-scheme: dark)",color:"#0d0f14"}]};function j({children:a}){return(0,d.jsx)("html",{lang:"en",suppressHydrationWarning:!0,children:(0,d.jsx)("body",{className:`${f().className} min-h-screen bg-background text-foreground antialiased`,children:(0,d.jsx)(g.ThemeProvider,{children:a})})})}},61135:()=>{},65343:(a,b,c)=>{Promise.resolve().then(c.bind(c,33340))},67697:(a,b,c)=>{"use strict";c.d(b,{C1:()=>j,EC:()=>A,Et:()=>t,IP:()=>p,JT:()=>k,Kd:()=>u,MO:()=>r,PH:()=>n,RC:()=>l,RO:()=>w,_:()=>z,eK:()=>h,f8:()=>m,g9:()=>F,ht:()=>C,iG:()=>v,ik:()=>q,jw:()=>E,kF:()=>o,kg:()=>B,lY:()=>D,mm:()=>i,ro:()=>s,s3:()=>x});var d=c(56275);let e=globalThis;function f(){return e.__cmsPool||(e.__cmsPool=d.createPool({host:process.env.DB_HOST||"localhost",port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER||"",password:process.env.DB_PASSWORD||"",database:process.env.DB_NAME||"",waitForConnections:!0,connectionLimit:5,charset:"utf8mb4_general_ci"})),e.__cmsPool}function g(){return e.__crmSchema||(e.__crmSchema=(async()=>{let a=f();await a.query(`
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
      `)})().catch(a=>{throw e.__crmSchema=void 0,a})),e.__crmSchema}async function h(a){await g();let[b]=await f().query(`INSERT INTO crm_companies (name, industry, city, website, employees, annual_value, status, account_manager, industry_match)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,[a.name.slice(0,190),(a.industry??"").slice(0,120),(a.city??"").slice(0,120),(a.website??"").slice(0,300),a.employees??null,a.annualValue??0,(a.status??"lead").slice(0,20),(a.accountManager??"").slice(0,120),+!!a.industryMatch]);return b.insertId}async function i(a={}){await g();let b=[],c=[];if(a.q){b.push("(name LIKE ? OR industry LIKE ? OR city LIKE ?)");let d=`%${a.q}%`;c.push(d,d,d)}a.status&&(b.push("status = ?"),c.push(a.status));let[d]=await f().query(`SELECT * FROM crm_companies ${b.length?`WHERE ${b.join(" AND ")}`:""} ORDER BY updated_at DESC LIMIT 500`,c);return d}async function j(a){await g();let[b]=await f().query("SELECT * FROM crm_companies WHERE id = ? LIMIT 1",[a]);return b[0]??null}async function k(a,b){await g(),await f().query("UPDATE crm_companies SET name=?, industry=?, city=?, website=?, employees=?, annual_value=?, status=?, account_manager=?, industry_match=? WHERE id=?",[b.name.slice(0,190),(b.industry??"").slice(0,120),(b.city??"").slice(0,120),(b.website??"").slice(0,300),b.employees??null,b.annualValue??0,(b.status??"lead").slice(0,20),(b.accountManager??"").slice(0,120),+!!b.industryMatch,a])}async function l(a){await g();let b=f();await b.query("DELETE FROM crm_activities WHERE company_id = ?",[a]),await b.query("DELETE FROM crm_deals WHERE company_id = ?",[a]),await b.query("DELETE FROM crm_contacts WHERE company_id = ?",[a]),await b.query("DELETE FROM crm_companies WHERE id = ?",[a])}async function m(a={}){await g();let b=[],c=[];if(a.q){b.push("(c.name LIKE ? OR c.industry LIKE ? OR c.city LIKE ?)");let d=`%${a.q}%`;c.push(d,d,d)}a.status&&(b.push("c.status = ?"),c.push(a.status));let[d]=await f().query(`SELECT c.*,
       (SELECT COUNT(*) FROM crm_contacts ct WHERE ct.company_id = c.id) AS contacts,
       (SELECT COUNT(*) FROM crm_deals d WHERE d.company_id = c.id AND d.stage NOT IN ('won','lost')) AS open_deals,
       (SELECT COALESCE(SUM(d.value),0) FROM crm_deals d WHERE d.company_id = c.id AND d.stage NOT IN ('won','lost')) AS open_value,
       (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.company_id = c.id) AS last_activity
       FROM crm_companies c
      ${b.length?`WHERE ${b.join(" AND ")}`:""}
      ORDER BY c.updated_at DESC LIMIT 500`,c);return d}async function n(a){let b=a.filter(a=>Number.isInteger(a)).slice(0,500);if(!b.length)return;await g();let c=b.map(()=>"?").join(","),d=f();await d.query(`DELETE FROM crm_activities WHERE company_id IN (${c})`,b),await d.query(`DELETE FROM crm_deals WHERE company_id IN (${c})`,b),await d.query(`DELETE FROM crm_contacts WHERE company_id IN (${c})`,b),await d.query(`DELETE FROM crm_companies WHERE id IN (${c})`,b)}async function o(a,b){let c=a.filter(a=>Number.isInteger(a)).slice(0,500);if(!c.length)return;await g();let d=c.map(()=>"?").join(",");await f().query(`UPDATE crm_companies SET status = ? WHERE id IN (${d})`,[b.slice(0,20),...c])}async function p(a,b){await g();let[c]=await f().query("INSERT INTO crm_contacts (company_id, name, role, email, phone, department, influence) VALUES (?, ?, ?, ?, ?, ?, ?)",[a,b.name.slice(0,190),(b.role??"").slice(0,120),(b.email??"").slice(0,190),(b.phone??"").slice(0,60),(b.department??"").slice(0,60),(b.influence??"none").slice(0,20)]);return c.insertId}async function q(a){await g();let[b]=await f().query("SELECT * FROM crm_contacts WHERE company_id = ? ORDER BY id ASC",[a]);return b}async function r(a){await g(),await f().query("DELETE FROM crm_contacts WHERE id = ?",[a])}async function s(a,b){await g();let[c]=await f().query("INSERT INTO crm_deals (company_id, title, value, stage, probability, expected_close, owner) VALUES (?, ?, ?, ?, ?, ?, ?)",[a,b.title.slice(0,190),b.value??0,(b.stage??"new").slice(0,20),b.probability??null,b.expectedClose||null,(b.owner??"").slice(0,120)]);return c.insertId}async function t(a={}){if(await g(),null!=a.companyId){let[b]=await f().query("SELECT * FROM crm_deals WHERE company_id = ? ORDER BY updated_at DESC",[a.companyId]);return b}let[b]=await f().query("SELECT * FROM crm_deals ORDER BY updated_at DESC LIMIT 1000");return b}async function u(a,b){await g();let c=[],d=[];void 0!==b.title&&(c.push("title=?"),d.push(b.title.slice(0,190))),void 0!==b.value&&(c.push("value=?"),d.push(b.value)),void 0!==b.stage&&(c.push("stage=?"),d.push(b.stage.slice(0,20))),void 0!==b.probability&&(c.push("probability=?"),d.push(b.probability)),void 0!==b.expectedClose&&(c.push("expected_close=?"),d.push(b.expectedClose||null)),void 0!==b.owner&&(c.push("owner=?"),d.push(b.owner.slice(0,120))),c.length&&(d.push(a),await f().query(`UPDATE crm_deals SET ${c.join(", ")} WHERE id = ?`,d))}async function v(a){await g(),await f().query("DELETE FROM crm_deals WHERE id = ?",[a])}async function w(a){await g();let[b]=await f().query("INSERT INTO crm_activities (company_id, contact_id, type, summary) VALUES (?, ?, ?, ?)",[a.companyId,a.contactId??null,(a.type??"note").slice(0,20),a.summary.slice(0,500)]);return b.insertId}async function x(a,b=50){await g();let[c]=await f().query("SELECT * FROM crm_activities WHERE company_id = ? ORDER BY id DESC LIMIT ?",[a,b]);return c}function y(){return e.__crmAuthSchema||(e.__crmAuthSchema=(async()=>{let a=f();await a.query(`
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
      `)})().catch(a=>{throw e.__crmAuthSchema=void 0,a})),e.__crmAuthSchema}async function z(){await y();let[a]=await f().query("SELECT COUNT(*) AS n FROM crm_users");return Number(a[0]?.n??0)}async function A(a,b){await y();let[c]=await f().query("INSERT INTO crm_organizations (name, slug) VALUES (?, ?)",[a.slice(0,190),b.slice(0,120)]);return c.insertId}async function B(a){await y();let[b]=await f().query("INSERT INTO crm_users (organization_id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)",[a.organizationId,a.email.toLowerCase().slice(0,190),(a.name??"").slice(0,190),a.passwordHash.slice(0,255),(a.role??"member").slice(0,20)]);return b.insertId}async function C(a){await y();let[b]=await f().query("SELECT * FROM crm_users WHERE email = ? AND status = 'active' LIMIT 1",[a.toLowerCase()]);return b[0]??null}async function D(a){await y(),await f().query("UPDATE crm_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?",[a])}async function E(a){await y(),await f().query("INSERT INTO crm_sessions (user_id, organization_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",[a.userId,a.organizationId,a.tokenHash,a.expiresAt])}async function F(a){await y(),await f().query("DELETE FROM crm_sessions WHERE token_hash = ?",[a])}},68734:(a,b,c)=>{"use strict";c.d(b,{ThemeProvider:()=>f});var d=c(21124),e=c(45523);function f({children:a}){return(0,d.jsx)(e.N,{attribute:"class",defaultTheme:"dark",enableSystem:!1,children:a})}},87080:a=>{function b(a){var b=Error("Cannot find module '"+a+"'");throw b.code="MODULE_NOT_FOUND",b}b.keys=()=>[],b.resolve=b,b.id=87080,a.exports=b},87733:(a,b,c)=>{Promise.resolve().then(c.t.bind(c,54160,23)),Promise.resolve().then(c.t.bind(c,31603,23)),Promise.resolve().then(c.t.bind(c,68495,23)),Promise.resolve().then(c.t.bind(c,75170,23)),Promise.resolve().then(c.t.bind(c,77526,23)),Promise.resolve().then(c.t.bind(c,78922,23)),Promise.resolve().then(c.t.bind(c,29234,23)),Promise.resolve().then(c.t.bind(c,12263,23)),Promise.resolve().then(c.bind(c,82146))},93758:(a,b,c)=>{"use strict";c.d(b,{l:()=>h,p:()=>g});var d=c(21124),e=c(38301),f=c(44943);let g=e.forwardRef(({className:a,...b},c)=>(0,d.jsx)("input",{ref:c,className:(0,f.cn)("h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-electric",a),...b}));g.displayName="Input";let h=e.forwardRef(({className:a,...b},c)=>(0,d.jsx)("select",{ref:c,className:(0,f.cn)("h-10 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:border-electric",a),...b}));h.displayName="Select"}};