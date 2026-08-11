exports.id=830,exports.ids=[830],exports.modules={2220:(a,b,c)=>{"use strict";c.d(b,{RO:()=>J,IP:()=>A,PH:()=>y,kF:()=>z,_:()=>M,eK:()=>s,ro:()=>E,jw:()=>Q,Bw:()=>o,RC:()=>w,MO:()=>C,iG:()=>H,C1:()=>u,Fg:()=>R,ht:()=>N,kl:()=>O,s3:()=>K,mm:()=>t,td:()=>x,ik:()=>B,jQ:()=>D,Et:()=>F,fI:()=>I,lY:()=>P,JT:()=>v,Kd:()=>G,fs:()=>S});var d=c(29382),e=c(50505);let f={name:"c.name",industry:"c.industry",contacts:"contacts",openValue:"open_value",score:"c.lead_score",health:"health_rank",lastActivity:"last_activity"},g=new Set(Object.keys(f));function h(a,b,c){let d=Math.min(100,Math.max(1,Math.floor(b)||25)),e=Math.max(1,Math.ceil(c/d)),f=Math.min(Math.max(1,Math.floor(a)||1),e);return{page:f,pageSize:d,offset:(f-1)*d,pageCount:e}}let i={name:"ct.name",role:"ct.role",company:"co.name",email:"ct.email",influence:"ct.influence"},j=new Set(Object.keys(i)),k={title:"d.title",company:"co.name",value:"d.value",stage:`FIELD(d.stage, ${e.w7.map(a=>`'${a}'`).join(", ")})`,expectedClose:"d.expected_close",created:"d.id"},l=new Set(Object.keys(k)),m=globalThis;function n(){return m.__cmsPool||(m.__cmsPool=d.createPool({host:process.env.DB_HOST||"localhost",port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER||"",password:process.env.DB_PASSWORD||"",database:process.env.DB_NAME||"",waitForConnections:!0,connectionLimit:5,charset:"utf8mb4_general_ci"})),m.__cmsPool}async function o(){if(!process.env.DB_NAME)return!1;try{return await n().query("SELECT 1"),!0}catch{return!1}}async function p(a,b,c,d){let[e]=await a.query("SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",[b,c]);0===Number(e[0]?.n??0)&&await a.query(`ALTER TABLE \`${b}\` ADD COLUMN ${d}`)}function q(){return m.__crmSchema||(m.__crmSchema=(async()=>{let a=n();await a.query(`
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
          lead_score TINYINT UNSIGNED NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_company_status (status, name),
          INDEX idx_company_org (organization_id, updated_at)
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
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_leads (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL DEFAULT 0,
          name VARCHAR(190) NOT NULL DEFAULT '',
          company VARCHAR(190) NOT NULL DEFAULT '',
          title VARCHAR(120) NOT NULL DEFAULT '',
          email VARCHAR(190) NOT NULL DEFAULT '',
          phone VARCHAR(60) NOT NULL DEFAULT '',
          source VARCHAR(30) NOT NULL DEFAULT 'other',
          status VARCHAR(20) NOT NULL DEFAULT 'new',
          industry VARCHAR(120) NOT NULL DEFAULT '',
          website VARCHAR(300) NOT NULL DEFAULT '',
          employees INT UNSIGNED NULL,
          annual_value INT UNSIGNED NOT NULL DEFAULT 0,
          industry_match TINYINT(1) NOT NULL DEFAULT 0,
          lead_score TINYINT UNSIGNED NOT NULL DEFAULT 0,
          notes VARCHAR(500) NOT NULL DEFAULT '',
          converted_company_id INT UNSIGNED NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_lead_org (organization_id, lead_score),
          INDEX idx_lead_status (organization_id, status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_tasks (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL DEFAULT 0,
          company_id INT UNSIGNED NULL,
          title VARCHAR(300) NOT NULL DEFAULT '',
          notes VARCHAR(500) NOT NULL DEFAULT '',
          due_date DATE NULL,
          priority VARCHAR(10) NOT NULL DEFAULT 'normal',
          done TINYINT(1) NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_task_org (organization_id, done, due_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await p(a,"crm_companies","organization_id","organization_id INT UNSIGNED NOT NULL DEFAULT 0"),await p(a,"crm_contacts","organization_id","organization_id INT UNSIGNED NOT NULL DEFAULT 0"),await p(a,"crm_deals","organization_id","organization_id INT UNSIGNED NOT NULL DEFAULT 0"),await p(a,"crm_activities","organization_id","organization_id INT UNSIGNED NOT NULL DEFAULT 0"),await p(a,"crm_companies","lead_score","lead_score TINYINT UNSIGNED NOT NULL DEFAULT 0")})().catch(a=>{throw m.__crmSchema=void 0,a})),m.__crmSchema}function r(a){return(0,e.DY)({hasWebsite:!!(a.website??"").trim(),employees:a.employees??null,industryMatch:!!a.industryMatch,annualValue:a.annualValue??0})}async function s(a,b){await q();let[c]=await n().query(`INSERT INTO crm_companies (organization_id, name, industry, city, website, employees, annual_value, status, account_manager, industry_match, lead_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[a,b.name.slice(0,190),(b.industry??"").slice(0,120),(b.city??"").slice(0,120),(b.website??"").slice(0,300),b.employees??null,b.annualValue??0,(b.status??"lead").slice(0,20),(b.accountManager??"").slice(0,120),+!!b.industryMatch,r(b)]);return c.insertId}async function t(a,b={}){await q();let c=["organization_id = ?"],d=[a];if(b.q){c.push("(name LIKE ? OR industry LIKE ? OR city LIKE ?)");let a=`%${b.q}%`;d.push(a,a,a)}b.status&&(c.push("status = ?"),d.push(b.status));let[e]=await n().query(`SELECT * FROM crm_companies WHERE ${c.join(" AND ")} ORDER BY updated_at DESC LIMIT 500`,d);return e}async function u(a,b){await q();let[c]=await n().query("SELECT * FROM crm_companies WHERE id = ? AND organization_id = ? LIMIT 1",[b,a]);return c[0]??null}async function v(a,b,c){await q(),await n().query("UPDATE crm_companies SET name=?, industry=?, city=?, website=?, employees=?, annual_value=?, status=?, account_manager=?, industry_match=?, lead_score=? WHERE id=? AND organization_id=?",[c.name.slice(0,190),(c.industry??"").slice(0,120),(c.city??"").slice(0,120),(c.website??"").slice(0,300),c.employees??null,c.annualValue??0,(c.status??"lead").slice(0,20),(c.accountManager??"").slice(0,120),+!!c.industryMatch,r(c),b,a])}async function w(a,b){await q();let c=n();await c.query("DELETE FROM crm_activities WHERE company_id = ? AND organization_id = ?",[b,a]),await c.query("DELETE FROM crm_deals WHERE company_id = ? AND organization_id = ?",[b,a]),await c.query("DELETE FROM crm_contacts WHERE company_id = ? AND organization_id = ?",[b,a]),await c.query("DELETE FROM crm_companies WHERE id = ? AND organization_id = ?",[b,a])}async function x(a,b){await q();let c=["c.organization_id = ?"],d=[a];if(b.q){c.push("(c.name LIKE ? OR c.industry LIKE ? OR c.city LIKE ?)");let a=`%${b.q}%`;d.push(a,a,a)}b.status&&(c.push("c.status = ?"),d.push(b.status));let e=`WHERE ${c.join(" AND ")}`,i=n(),[j]=await i.query(`SELECT COUNT(*) AS n FROM crm_companies c ${e}`,d),k=Number(j[0]?.n??0),{offset:l,pageSize:m,page:o,pageCount:p}=h(b.page,b.pageSize,k),r=function(a,b){let c=g.has(a)?f[a]:f.score;return`ORDER BY ${c} ${1===b?"ASC":"DESC"}, c.id DESC`}(b.sortKey,b.sortDir),[s]=await i.query(`SELECT c.*,
       (SELECT COUNT(*) FROM crm_contacts ct WHERE ct.company_id = c.id) AS contacts,
       (SELECT COUNT(*) FROM crm_deals d WHERE d.company_id = c.id AND d.stage NOT IN ('won','lost')) AS open_deals,
       (SELECT COALESCE(SUM(d.value),0) FROM crm_deals d WHERE d.company_id = c.id AND d.stage NOT IN ('won','lost')) AS open_value,
       (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.company_id = c.id) AS last_activity,
       (CASE
          WHEN (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.company_id = c.id) IS NULL THEN 2
          WHEN (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.company_id = c.id) < (NOW() - INTERVAL 30 DAY) THEN 0
          WHEN (SELECT COALESCE(SUM(d.value),0) FROM crm_deals d WHERE d.company_id = c.id AND d.stage NOT IN ('won','lost')) > 0
               AND (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.company_id = c.id) >= (NOW() - INTERVAL 14 DAY) THEN 3
          ELSE 1
        END) AS health_rank
       FROM crm_companies c
       ${e}
       ${r}
       LIMIT ? OFFSET ?`,[...d,m,l]);return{rows:s,total:k,page:o,pageCount:p}}async function y(a,b){let c=b.filter(a=>Number.isInteger(a)).slice(0,500);if(!c.length)return;await q();let d=c.map(()=>"?").join(","),e=n();await e.query(`DELETE FROM crm_activities WHERE organization_id = ? AND company_id IN (${d})`,[a,...c]),await e.query(`DELETE FROM crm_deals WHERE organization_id = ? AND company_id IN (${d})`,[a,...c]),await e.query(`DELETE FROM crm_contacts WHERE organization_id = ? AND company_id IN (${d})`,[a,...c]),await e.query(`DELETE FROM crm_companies WHERE organization_id = ? AND id IN (${d})`,[a,...c])}async function z(a,b,c){let d=b.filter(a=>Number.isInteger(a)).slice(0,500);if(!d.length)return;await q();let e=d.map(()=>"?").join(",");await n().query(`UPDATE crm_companies SET status = ? WHERE organization_id = ? AND id IN (${e})`,[c.slice(0,20),a,...d])}async function A(a,b,c){await q();let[d]=await n().query("INSERT INTO crm_contacts (organization_id, company_id, name, role, email, phone, department, influence) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",[a,b,c.name.slice(0,190),(c.role??"").slice(0,120),(c.email??"").slice(0,190),(c.phone??"").slice(0,60),(c.department??"").slice(0,60),(c.influence??"none").slice(0,20)]);return d.insertId}async function B(a,b){await q();let[c]=await n().query("SELECT * FROM crm_contacts WHERE company_id = ? AND organization_id = ? ORDER BY id ASC",[b,a]);return c}async function C(a,b){await q(),await n().query("DELETE FROM crm_contacts WHERE id = ? AND organization_id = ?",[b,a])}async function D(a,b){await q();let c=["ct.organization_id = ?"],d=[a];if(b.q){c.push("(ct.name LIKE ? OR ct.email LIKE ? OR ct.role LIKE ? OR co.name LIKE ?)");let a=`%${b.q}%`;d.push(a,a,a,a)}b.influence&&(c.push("ct.influence = ?"),d.push(b.influence));let e="FROM crm_contacts ct JOIN crm_companies co ON co.id = ct.company_id AND co.organization_id = ct.organization_id",f=`WHERE ${c.join(" AND ")}`,g=n(),[k]=await g.query(`SELECT COUNT(*) AS n ${e} ${f}`,d),l=Number(k[0]?.n??0),{offset:m,pageSize:o,page:p,pageCount:r}=h(b.page,b.pageSize,l),s=function(a,b){let c=j.has(a)?i[a]:i.name;return`ORDER BY ${c} ${1===b?"ASC":"DESC"}, ct.id DESC`}(b.sortKey,b.sortDir),[t]=await g.query(`SELECT ct.*, co.name AS company_name ${e} ${f} ${s} LIMIT ? OFFSET ?`,[...d,o,m]);return{rows:t,total:l,page:p,pageCount:r}}async function E(a,b,c){await q();let[d]=await n().query("INSERT INTO crm_deals (organization_id, company_id, title, value, stage, probability, expected_close, owner) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",[a,b,c.title.slice(0,190),c.value??0,(c.stage??"new").slice(0,20),c.probability??null,c.expectedClose||null,(c.owner??"").slice(0,120)]);return d.insertId}async function F(a,b={}){if(await q(),null!=b.companyId){let[c]=await n().query("SELECT * FROM crm_deals WHERE organization_id = ? AND company_id = ? ORDER BY updated_at DESC",[a,b.companyId]);return c}let[c]=await n().query("SELECT * FROM crm_deals WHERE organization_id = ? ORDER BY updated_at DESC LIMIT 1000",[a]);return c}async function G(a,b,c){await q();let d=[],e=[];void 0!==c.title&&(d.push("title=?"),e.push(c.title.slice(0,190))),void 0!==c.value&&(d.push("value=?"),e.push(c.value)),void 0!==c.stage&&(d.push("stage=?"),e.push(c.stage.slice(0,20))),void 0!==c.probability&&(d.push("probability=?"),e.push(c.probability)),void 0!==c.expectedClose&&(d.push("expected_close=?"),e.push(c.expectedClose||null)),void 0!==c.owner&&(d.push("owner=?"),e.push(c.owner.slice(0,120))),d.length&&(e.push(b,a),await n().query(`UPDATE crm_deals SET ${d.join(", ")} WHERE id = ? AND organization_id = ?`,e))}async function H(a,b){await q(),await n().query("DELETE FROM crm_deals WHERE id = ? AND organization_id = ?",[b,a])}async function I(a,b){await q();let c=["d.organization_id = ?"],d=[a];if(b.q){c.push("(d.title LIKE ? OR co.name LIKE ?)");let a=`%${b.q}%`;d.push(a,a)}b.stage&&(c.push("d.stage = ?"),d.push(b.stage));let e="FROM crm_deals d JOIN crm_companies co ON co.id = d.company_id AND co.organization_id = d.organization_id",f=`WHERE ${c.join(" AND ")}`,g=n(),[i]=await g.query(`SELECT COUNT(*) AS n ${e} ${f}`,d),j=Number(i[0]?.n??0),{offset:m,pageSize:o,page:p,pageCount:r}=h(b.page,b.pageSize,j),s=function(a,b){let c=l.has(a)?k[a]:k.value;return`ORDER BY ${c} ${1===b?"ASC":"DESC"}, d.id DESC`}(b.sortKey,b.sortDir),[t]=await g.query(`SELECT d.*, co.name AS company_name ${e} ${f} ${s} LIMIT ? OFFSET ?`,[...d,o,m]);return{rows:t,total:j,page:p,pageCount:r}}async function J(a,b){await q();let[c]=await n().query("INSERT INTO crm_activities (organization_id, company_id, contact_id, type, summary) VALUES (?, ?, ?, ?, ?)",[a,b.companyId,b.contactId??null,(b.type??"note").slice(0,20),b.summary.slice(0,500)]);return c.insertId}async function K(a,b,c=50){await q();let[d]=await n().query("SELECT * FROM crm_activities WHERE company_id = ? AND organization_id = ? ORDER BY id DESC LIMIT ?",[b,a,c]);return d}function L(){return m.__crmAuthSchema||(m.__crmAuthSchema=(async()=>{let a=n();await a.query(`
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
      `)})().catch(a=>{throw m.__crmAuthSchema=void 0,a})),m.__crmAuthSchema}async function M(){await L();let[a]=await n().query("SELECT COUNT(*) AS n FROM crm_users");return Number(a[0]?.n??0)}async function N(a){await L();let[b]=await n().query("SELECT * FROM crm_users WHERE email = ? AND status = 'active' LIMIT 1",[a.toLowerCase()]);return b[0]??null}async function O(a){await L();let[b]=await n().query("SELECT * FROM crm_users WHERE id = ? LIMIT 1",[a]);return b[0]??null}async function P(a){await L(),await n().query("UPDATE crm_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?",[a])}async function Q(a){await L(),await n().query("INSERT INTO crm_sessions (user_id, organization_id, token_hash, expires_at) VALUES (?, ?, ?, ?)",[a.userId,a.organizationId,a.tokenHash,a.expiresAt])}async function R(a){await L();let[b]=await n().query("SELECT * FROM crm_sessions WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP LIMIT 1",[a]);return b[0]??null}async function S(a){await L(),await n().query("INSERT INTO crm_audit_logs (organization_id, user_id, actor_email, action, entity, entity_id, summary) VALUES (?, ?, ?, ?, ?, ?, ?)",[a.organizationId,a.userId,a.actorEmail.slice(0,190),a.action.slice(0,40),a.entity.slice(0,40),a.entityId??null,(a.summary??"").slice(0,255)])}},28303:a=>{function b(a){var b=Error("Cannot find module '"+a+"'");throw b.code="MODULE_NOT_FOUND",b}b.keys=()=>[],b.resolve=b,b.id=28303,a.exports=b},50505:(a,b,c)=>{"use strict";c.d(b,{DY:()=>l,Hn:()=>j,WI:()=>k,dw:()=>i,w7:()=>f,yi:()=>h,zL:()=>e});let d=[{id:"new",label:"New lead",probability:10,open:!0},{id:"qualified",label:"Qualified",probability:20,open:!0},{id:"contacted",label:"Contacted",probability:30,open:!0},{id:"discovery",label:"Discovery",probability:45,open:!0},{id:"meeting",label:"Meeting",probability:60,open:!0},{id:"quote",label:"Quote sent",probability:75,open:!0},{id:"negotiation",label:"Negotiation",probability:85,open:!0},{id:"won",label:"Won",probability:100,open:!1},{id:"lost",label:"Lost",probability:0,open:!1}],e=d.filter(a=>a.open),f=d.map(a=>a.id),g=new Map(d.map(a=>[a.id,a]));function h(a){return g.has(a)}function i(a){return g.get(a)??d[0]}function j(a){return g.get(a)?.label??a}function k(a){let b=Object.fromEntries(f.map(a=>[a,{count:0,value:0}])),c=0,d=0,e=0,h=0,j=0,k=0;for(let f of a){let a=g.get(f.stage)?f.stage:"new";b[a].count+=1,b[a].value+=f.value,i(a).open?(c+=f.value,d+=function(a){let b=i(a.stage);if(!b.open)return"won"===b.id?a.value:0;let c=null!=a.probability?a.probability:b.probability;return Math.round(a.value*Math.max(0,Math.min(100,c))/100)}(f),h+=1):"won"===a?(e+=f.value,j+=1):k+=1}let l=j+k,m=l?Math.round(j/l*100):0;return{open:c,weighted:d,won:e,openCount:h,wonCount:j,lostCount:k,winRate:m,byStage:b}}function l(a){let b=30;a.hasWebsite&&(b+=15),a.industryMatch&&(b+=25);let c=a.employees??0;return c>=200?b+=20:c>=50?b+=15:c>=10&&(b+=8),(a.annualValue??0)>=2e4&&(b+=10),Math.max(0,Math.min(100,b))}}};