exports.id=118,exports.ids=[118],exports.modules={28303:a=>{function b(a){var b=Error("Cannot find module '"+a+"'");throw b.code="MODULE_NOT_FOUND",b}b.keys=()=>[],b.resolve=b,b.id=28303,a.exports=b},35552:(a,b,c)=>{"use strict";c.d(b,{Bw:()=>g,C1:()=>l,Et:()=>v,Fg:()=>D,IP:()=>r,JT:()=>m,Kd:()=>w,MO:()=>t,PH:()=>p,RC:()=>n,RO:()=>y,_:()=>B,eK:()=>j,f8:()=>o,fs:()=>E,iG:()=>x,ik:()=>s,kF:()=>q,kl:()=>C,mm:()=>k,ro:()=>u,s3:()=>z});var d=c(29382);let e=globalThis;function f(){return e.__cmsPool||(e.__cmsPool=d.createPool({host:process.env.DB_HOST||"localhost",port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER||"",password:process.env.DB_PASSWORD||"",database:process.env.DB_NAME||"",waitForConnections:!0,connectionLimit:5,charset:"utf8mb4_general_ci"})),e.__cmsPool}async function g(){if(!process.env.DB_NAME)return!1;try{return await f().query("SELECT 1"),!0}catch{return!1}}async function h(a,b,c,d){let[e]=await a.query("SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",[b,c]);0===Number(e[0]?.n??0)&&await a.query(`ALTER TABLE \`${b}\` ADD COLUMN ${d}`)}function i(){return e.__crmSchema||(e.__crmSchema=(async()=>{let a=f();await a.query(`
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
      `),await h(a,"crm_companies","organization_id","organization_id INT UNSIGNED NOT NULL DEFAULT 0"),await h(a,"crm_contacts","organization_id","organization_id INT UNSIGNED NOT NULL DEFAULT 0"),await h(a,"crm_deals","organization_id","organization_id INT UNSIGNED NOT NULL DEFAULT 0"),await h(a,"crm_activities","organization_id","organization_id INT UNSIGNED NOT NULL DEFAULT 0")})().catch(a=>{throw e.__crmSchema=void 0,a})),e.__crmSchema}async function j(a,b){await i();let[c]=await f().query(`INSERT INTO crm_companies (organization_id, name, industry, city, website, employees, annual_value, status, account_manager, industry_match)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[a,b.name.slice(0,190),(b.industry??"").slice(0,120),(b.city??"").slice(0,120),(b.website??"").slice(0,300),b.employees??null,b.annualValue??0,(b.status??"lead").slice(0,20),(b.accountManager??"").slice(0,120),+!!b.industryMatch]);return c.insertId}async function k(a,b={}){await i();let c=["organization_id = ?"],d=[a];if(b.q){c.push("(name LIKE ? OR industry LIKE ? OR city LIKE ?)");let a=`%${b.q}%`;d.push(a,a,a)}b.status&&(c.push("status = ?"),d.push(b.status));let[e]=await f().query(`SELECT * FROM crm_companies WHERE ${c.join(" AND ")} ORDER BY updated_at DESC LIMIT 500`,d);return e}async function l(a,b){await i();let[c]=await f().query("SELECT * FROM crm_companies WHERE id = ? AND organization_id = ? LIMIT 1",[b,a]);return c[0]??null}async function m(a,b,c){await i(),await f().query("UPDATE crm_companies SET name=?, industry=?, city=?, website=?, employees=?, annual_value=?, status=?, account_manager=?, industry_match=? WHERE id=? AND organization_id=?",[c.name.slice(0,190),(c.industry??"").slice(0,120),(c.city??"").slice(0,120),(c.website??"").slice(0,300),c.employees??null,c.annualValue??0,(c.status??"lead").slice(0,20),(c.accountManager??"").slice(0,120),+!!c.industryMatch,b,a])}async function n(a,b){await i();let c=f();await c.query("DELETE FROM crm_activities WHERE company_id = ? AND organization_id = ?",[b,a]),await c.query("DELETE FROM crm_deals WHERE company_id = ? AND organization_id = ?",[b,a]),await c.query("DELETE FROM crm_contacts WHERE company_id = ? AND organization_id = ?",[b,a]),await c.query("DELETE FROM crm_companies WHERE id = ? AND organization_id = ?",[b,a])}async function o(a,b={}){await i();let c=["c.organization_id = ?"],d=[a];if(b.q){c.push("(c.name LIKE ? OR c.industry LIKE ? OR c.city LIKE ?)");let a=`%${b.q}%`;d.push(a,a,a)}b.status&&(c.push("c.status = ?"),d.push(b.status));let[e]=await f().query(`SELECT c.*,
       (SELECT COUNT(*) FROM crm_contacts ct WHERE ct.company_id = c.id) AS contacts,
       (SELECT COUNT(*) FROM crm_deals d WHERE d.company_id = c.id AND d.stage NOT IN ('won','lost')) AS open_deals,
       (SELECT COALESCE(SUM(d.value),0) FROM crm_deals d WHERE d.company_id = c.id AND d.stage NOT IN ('won','lost')) AS open_value,
       (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.company_id = c.id) AS last_activity
       FROM crm_companies c
      WHERE ${c.join(" AND ")}
      ORDER BY c.updated_at DESC LIMIT 500`,d);return e}async function p(a,b){let c=b.filter(a=>Number.isInteger(a)).slice(0,500);if(!c.length)return;await i();let d=c.map(()=>"?").join(","),e=f();await e.query(`DELETE FROM crm_activities WHERE organization_id = ? AND company_id IN (${d})`,[a,...c]),await e.query(`DELETE FROM crm_deals WHERE organization_id = ? AND company_id IN (${d})`,[a,...c]),await e.query(`DELETE FROM crm_contacts WHERE organization_id = ? AND company_id IN (${d})`,[a,...c]),await e.query(`DELETE FROM crm_companies WHERE organization_id = ? AND id IN (${d})`,[a,...c])}async function q(a,b,c){let d=b.filter(a=>Number.isInteger(a)).slice(0,500);if(!d.length)return;await i();let e=d.map(()=>"?").join(",");await f().query(`UPDATE crm_companies SET status = ? WHERE organization_id = ? AND id IN (${e})`,[c.slice(0,20),a,...d])}async function r(a,b,c){await i();let[d]=await f().query("INSERT INTO crm_contacts (organization_id, company_id, name, role, email, phone, department, influence) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",[a,b,c.name.slice(0,190),(c.role??"").slice(0,120),(c.email??"").slice(0,190),(c.phone??"").slice(0,60),(c.department??"").slice(0,60),(c.influence??"none").slice(0,20)]);return d.insertId}async function s(a,b){await i();let[c]=await f().query("SELECT * FROM crm_contacts WHERE company_id = ? AND organization_id = ? ORDER BY id ASC",[b,a]);return c}async function t(a,b){await i(),await f().query("DELETE FROM crm_contacts WHERE id = ? AND organization_id = ?",[b,a])}async function u(a,b,c){await i();let[d]=await f().query("INSERT INTO crm_deals (organization_id, company_id, title, value, stage, probability, expected_close, owner) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",[a,b,c.title.slice(0,190),c.value??0,(c.stage??"new").slice(0,20),c.probability??null,c.expectedClose||null,(c.owner??"").slice(0,120)]);return d.insertId}async function v(a,b={}){if(await i(),null!=b.companyId){let[c]=await f().query("SELECT * FROM crm_deals WHERE organization_id = ? AND company_id = ? ORDER BY updated_at DESC",[a,b.companyId]);return c}let[c]=await f().query("SELECT * FROM crm_deals WHERE organization_id = ? ORDER BY updated_at DESC LIMIT 1000",[a]);return c}async function w(a,b,c){await i();let d=[],e=[];void 0!==c.title&&(d.push("title=?"),e.push(c.title.slice(0,190))),void 0!==c.value&&(d.push("value=?"),e.push(c.value)),void 0!==c.stage&&(d.push("stage=?"),e.push(c.stage.slice(0,20))),void 0!==c.probability&&(d.push("probability=?"),e.push(c.probability)),void 0!==c.expectedClose&&(d.push("expected_close=?"),e.push(c.expectedClose||null)),void 0!==c.owner&&(d.push("owner=?"),e.push(c.owner.slice(0,120))),d.length&&(e.push(b,a),await f().query(`UPDATE crm_deals SET ${d.join(", ")} WHERE id = ? AND organization_id = ?`,e))}async function x(a,b){await i(),await f().query("DELETE FROM crm_deals WHERE id = ? AND organization_id = ?",[b,a])}async function y(a,b){await i();let[c]=await f().query("INSERT INTO crm_activities (organization_id, company_id, contact_id, type, summary) VALUES (?, ?, ?, ?, ?)",[a,b.companyId,b.contactId??null,(b.type??"note").slice(0,20),b.summary.slice(0,500)]);return c.insertId}async function z(a,b,c=50){await i();let[d]=await f().query("SELECT * FROM crm_activities WHERE company_id = ? AND organization_id = ? ORDER BY id DESC LIMIT ?",[b,a,c]);return d}function A(){return e.__crmAuthSchema||(e.__crmAuthSchema=(async()=>{let a=f();await a.query(`
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
      `)})().catch(a=>{throw e.__crmAuthSchema=void 0,a})),e.__crmAuthSchema}async function B(){await A();let[a]=await f().query("SELECT COUNT(*) AS n FROM crm_users");return Number(a[0]?.n??0)}async function C(a){await A();let[b]=await f().query("SELECT * FROM crm_users WHERE id = ? LIMIT 1",[a]);return b[0]??null}async function D(a){await A();let[b]=await f().query("SELECT * FROM crm_sessions WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP LIMIT 1",[a]);return b[0]??null}async function E(a){await A(),await f().query("INSERT INTO crm_audit_logs (organization_id, user_id, actor_email, action, entity, entity_id, summary) VALUES (?, ?, ?, ?, ?, ?, ?)",[a.organizationId,a.userId,a.actorEmail.slice(0,190),a.action.slice(0,40),a.entity.slice(0,40),a.entityId??null,(a.summary??"").slice(0,255)])}}};