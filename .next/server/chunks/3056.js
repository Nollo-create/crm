exports.id=3056,exports.ids=[3056],exports.modules={28303:a=>{function b(a){var b=Error("Cannot find module '"+a+"'");throw b.code="MODULE_NOT_FOUND",b}b.keys=()=>[],b.resolve=b,b.id=28303,a.exports=b},31100:(a,b,c)=>{"use strict";c.d(b,{BB:()=>e,Oj:()=>n,Qd:()=>h,aD:()=>i,xM:()=>f,zk:()=>k});let d=["new","working","qualified","unqualified","converted"],e={new:"New",working:"Working",qualified:"Qualified",unqualified:"Unqualified",converted:"Converted"};function f(a){return d.includes(a)}let g=["web","referral","event","cold","import","other"],h={web:"Website",referral:"Referral",event:"Event",cold:"Cold outreach",import:"Imported",other:"Other"};function i(a){return g.includes(a)}let j=["low","normal","high"];function k(a){return j.includes(a)}let l={name:"l.name",company:"l.company",source:"l.source",status:"l.status",score:"l.lead_score",created:"l.id"},m=new Set(Object.keys(l));function n(a,b){let c=m.has(a)?l[a]:l.score;return`ORDER BY ${c} ${1===b?"ASC":"DESC"}, l.id DESC`}},47554:(a,b,c)=>{"use strict";c.d(b,{RO:()=>ab,IP:()=>L,zE:()=>aB,J5:()=>at,hi:()=>ax,wW:()=>ap,I9:()=>aw,W3:()=>av,dt:()=>aq,dD:()=>aD,tV:()=>aC,_5:()=>as,Fe:()=>ar,xS:()=>au,ty:()=>aE,_Z:()=>aA,PH:()=>E,DL:()=>J,jt:()=>H,kF:()=>F,jv:()=>K,BB:()=>I,bC:()=>Z,vG:()=>Y,KP:()=>am,PB:()=>aU,cQ:()=>aY,_:()=>aV,Iq:()=>a1,eK:()=>v,ro:()=>S,tR:()=>ag,jw:()=>a9,UT:()=>an,Ml:()=>D,Bw:()=>r,$y:()=>ae,Lh:()=>a3,RC:()=>B,MO:()=>Q,iG:()=>_,sr:()=>al,Z4:()=>aO,Ll:()=>a4,Q:()=>y,C1:()=>x,bl:()=>M,NE:()=>V,DT:()=>ah,Ee:()=>aR,SA:()=>aW,Fg:()=>ba,aH:()=>a_,ht:()=>a6,kl:()=>a7,s3:()=>ac,n:()=>ad,d5:()=>a0,lJ:()=>bd,mm:()=>w,td:()=>C,I8:()=>O,ik:()=>P,jQ:()=>R,Ey:()=>W,Et:()=>T,e2:()=>X,fI:()=>aa,_J:()=>aL,BH:()=>aj,tB:()=>aM,zJ:()=>aI,W5:()=>aH,jx:()=>aJ,hT:()=>aK,fS:()=>aG,LB:()=>aF,c5:()=>aN,SC:()=>aT,qk:()=>be,bW:()=>a2,hE:()=>$,rM:()=>ak,yK:()=>aS,lY:()=>a8,tl:()=>a5,IN:()=>bb,zK:()=>a$,JT:()=>z,lH:()=>A,CI:()=>N,Kd:()=>U,Q6:()=>ai,uI:()=>aZ,L_:()=>aX,fs:()=>bc});var d=c(29382),e=c(50505);let f={name:"c.name",industry:"c.industry",contacts:"contacts",openValue:"open_value",annualValue:"c.annual_value",score:"c.lead_score",health:"health_rank",lastActivity:"last_activity"},g=new Set(Object.keys(f));function h(a,b,c){let d=Math.min(100,Math.max(1,Math.floor(b)||25)),e=Math.max(1,Math.ceil(c/d)),f=Math.min(Math.max(1,Math.floor(a)||1),e);return{page:f,pageSize:d,offset:(f-1)*d,pageCount:e}}let i={name:"ct.name",role:"ct.role",company:"co.name",email:"ct.email",influence:"ct.influence"},j=new Set(Object.keys(i));var k=c(31100);let l={title:"d.title",company:"co.name",value:"d.value",stage:`FIELD(d.stage, ${e.w7.map(a=>`'${a}'`).join(", ")})`,expectedClose:"d.expected_close",created:"d.id"},m=new Set(Object.keys(l)),n={created:"a.created_at",type:"a.type",company:"co.name"},o=new Set(Object.keys(n));c(85750);let p=globalThis;function q(){return p.__cmsPool||(p.__cmsPool=d.createPool({host:process.env.DB_HOST||"localhost",port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER||"",password:process.env.DB_PASSWORD||"",database:process.env.DB_NAME||"",waitForConnections:!0,connectionLimit:5,charset:"utf8mb4_general_ci"})),p.__cmsPool}async function r(){if(!process.env.DB_NAME)return!1;try{return await q().query("SELECT 1"),!0}catch{return!1}}async function s(a,b,c,d){let[e]=await a.query("SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",[b,c]);0===Number(e[0]?.n??0)&&await a.query(`ALTER TABLE \`${b}\` ADD COLUMN ${d}`)}function t(){return p.__crmSchema||(p.__crmSchema=(async()=>{let a=q();await a.query(`
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
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_products (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL DEFAULT 0,
          name VARCHAR(190) NOT NULL DEFAULT '',
          sku VARCHAR(60) NOT NULL DEFAULT '',
          description VARCHAR(500) NOT NULL DEFAULT '',
          price_cents INT UNSIGNED NOT NULL DEFAULT 0,
          billing VARCHAR(20) NOT NULL DEFAULT 'onetime',
          active TINYINT(1) NOT NULL DEFAULT 1,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_product_org (organization_id, name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_quotes (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL DEFAULT 0,
          company_id INT UNSIGNED NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'draft',
          notes VARCHAR(500) NOT NULL DEFAULT '',
          valid_until DATE NULL,
          total_cents INT UNSIGNED NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_quote_org (organization_id, status),
          INDEX idx_quote_company (company_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_quote_items (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL DEFAULT 0,
          quote_id INT UNSIGNED NOT NULL,
          product_id INT UNSIGNED NULL,
          name VARCHAR(190) NOT NULL DEFAULT '',
          unit_price_cents INT UNSIGNED NOT NULL DEFAULT 0,
          quantity INT UNSIGNED NOT NULL DEFAULT 1,
          line_total_cents INT UNSIGNED NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_qitem_quote (quote_id, id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_automations (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL DEFAULT 0,
          template_key VARCHAR(40) NOT NULL DEFAULT '',
          name VARCHAR(190) NOT NULL DEFAULT '',
          params TEXT NULL,
          enabled TINYINT(1) NOT NULL DEFAULT 1,
          last_run_at TIMESTAMP NULL,
          created_count INT UNSIGNED NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_automation_org (organization_id, enabled)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_automation_runs (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL DEFAULT 0,
          automation_id INT UNSIGNED NOT NULL,
          created_count INT UNSIGNED NOT NULL DEFAULT 0,
          summary VARCHAR(255) NOT NULL DEFAULT '',
          ran_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_arun_org (organization_id, id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_tags (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL DEFAULT 0,
          name VARCHAR(60) NOT NULL DEFAULT '',
          color VARCHAR(20) NOT NULL DEFAULT 'electric',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_tag_org_name (organization_id, name),
          INDEX idx_tag_org (organization_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_entity_tags (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL DEFAULT 0,
          tag_id INT UNSIGNED NOT NULL,
          entity_type VARCHAR(16) NOT NULL DEFAULT '',
          entity_id INT UNSIGNED NOT NULL,
          UNIQUE KEY uq_entity_tag (organization_id, tag_id, entity_type, entity_id),
          INDEX idx_entity_tags (organization_id, entity_type, entity_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await s(a,"crm_companies","organization_id","organization_id INT UNSIGNED NOT NULL DEFAULT 0"),await s(a,"crm_contacts","organization_id","organization_id INT UNSIGNED NOT NULL DEFAULT 0"),await s(a,"crm_deals","organization_id","organization_id INT UNSIGNED NOT NULL DEFAULT 0"),await s(a,"crm_activities","organization_id","organization_id INT UNSIGNED NOT NULL DEFAULT 0"),await s(a,"crm_companies","lead_score","lead_score TINYINT UNSIGNED NOT NULL DEFAULT 0"),await s(a,"crm_contacts","mobile","mobile VARCHAR(40) NOT NULL DEFAULT ''"),await s(a,"crm_contacts","linkedin","linkedin VARCHAR(200) NOT NULL DEFAULT ''"),await s(a,"crm_contacts","notes","notes TEXT NULL"),await s(a,"crm_companies","legal_name","legal_name VARCHAR(190) NOT NULL DEFAULT ''"),await s(a,"crm_companies","phone","phone VARCHAR(60) NOT NULL DEFAULT ''"),await s(a,"crm_companies","email","email VARCHAR(190) NOT NULL DEFAULT ''"),await s(a,"crm_companies","country","country VARCHAR(120) NOT NULL DEFAULT ''"),await s(a,"crm_companies","address","address VARCHAR(300) NOT NULL DEFAULT ''"),await s(a,"crm_companies","vat_id","vat_id VARCHAR(40) NOT NULL DEFAULT ''"),await s(a,"crm_companies","description","description TEXT NULL"),await s(a,"crm_leads","priority","priority VARCHAR(12) NOT NULL DEFAULT 'normal'"),await s(a,"crm_leads","owner","owner VARCHAR(120) NOT NULL DEFAULT ''"),await s(a,"crm_deals","contact_id","contact_id INT UNSIGNED NULL"),await s(a,"crm_deals","notes","notes TEXT NULL"),await s(a,"crm_deals","closed_at","closed_at TIMESTAMP NULL"),await s(a,"crm_deals","loss_reason","loss_reason VARCHAR(40) NOT NULL DEFAULT ''"),await s(a,"crm_activities","deal_id","deal_id INT UNSIGNED NULL")})().catch(a=>{throw p.__crmSchema=void 0,a})),p.__crmSchema}function u(a){return(0,e.DY)({hasWebsite:!!(a.website??"").trim(),employees:a.employees??null,industryMatch:!!a.industryMatch,annualValue:a.annualValue??0})}async function v(a,b){await t();let[c]=await q().query(`INSERT INTO crm_companies (organization_id, name, industry, city, website, employees, annual_value, status, account_manager, industry_match, lead_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[a,b.name.slice(0,190),(b.industry??"").slice(0,120),(b.city??"").slice(0,120),(b.website??"").slice(0,300),b.employees??null,b.annualValue??0,(b.status??"lead").slice(0,20),(b.accountManager??"").slice(0,120),+!!b.industryMatch,u(b)]);return c.insertId}async function w(a,b={}){await t();let c=["organization_id = ?"],d=[a];if(b.q){c.push("(name LIKE ? OR industry LIKE ? OR city LIKE ?)");let a=`%${b.q}%`;d.push(a,a,a)}b.status&&(c.push("status = ?"),d.push(b.status));let[e]=await q().query(`SELECT * FROM crm_companies WHERE ${c.join(" AND ")} ORDER BY updated_at DESC LIMIT 500`,d);return e}async function x(a,b){await t();let[c]=await q().query("SELECT * FROM crm_companies WHERE id = ? AND organization_id = ? LIMIT 1",[b,a]);return c[0]??null}async function y(a,b,c){await t();let d=b.trim();if(d.length<2)return[];let e=["name LIKE ?"],f=[a,`%${d}%`],g=c.trim().replace(/^https?:\/\//i,"").replace(/^www\./i,"").split("/")[0].toLowerCase();g.length>3&&(e.push("(website <> '' AND LOWER(website) LIKE ?)"),f.push(`%${g}%`));let[h]=await q().query(`SELECT * FROM crm_companies WHERE organization_id = ? AND (${e.join(" OR ")}) ORDER BY name ASC LIMIT 5`,f);return h}async function z(a,b,c){await t(),await q().query("UPDATE crm_companies SET name=?, industry=?, city=?, website=?, employees=?, annual_value=?, status=?, account_manager=?, industry_match=?, lead_score=? WHERE id=? AND organization_id=?",[c.name.slice(0,190),(c.industry??"").slice(0,120),(c.city??"").slice(0,120),(c.website??"").slice(0,300),c.employees??null,c.annualValue??0,(c.status??"lead").slice(0,20),(c.accountManager??"").slice(0,120),+!!c.industryMatch,u(c),b,a])}async function A(a,b,c){await t(),await q().query("UPDATE crm_companies SET legal_name=?, phone=?, email=?, country=?, address=?, vat_id=?, description=? WHERE id=? AND organization_id=?",[c.legalName.slice(0,190),c.phone.slice(0,60),c.email.slice(0,190),c.country.slice(0,120),c.address.slice(0,300),c.vatId.slice(0,40),(c.description??"").slice(0,2e3),b,a])}async function B(a,b){await t();let c=q();await c.query("DELETE FROM crm_activities WHERE company_id = ? AND organization_id = ?",[b,a]),await c.query("DELETE FROM crm_deals WHERE company_id = ? AND organization_id = ?",[b,a]),await c.query("DELETE FROM crm_contacts WHERE company_id = ? AND organization_id = ?",[b,a]),await c.query("DELETE FROM crm_companies WHERE id = ? AND organization_id = ?",[b,a])}async function C(a,b){await t();let c=["c.organization_id = ?"],d=[a];if(b.q){c.push("(c.name LIKE ? OR c.industry LIKE ? OR c.city LIKE ?)");let a=`%${b.q}%`;d.push(a,a,a)}b.status&&(c.push("c.status = ?"),d.push(b.status)),b.statuses&&b.statuses.length&&(c.push(`c.status IN (${b.statuses.map(()=>"?").join(", ")})`),d.push(...b.statuses));let e=`WHERE ${c.join(" AND ")}`,i=q(),[j]=await i.query(`SELECT COUNT(*) AS n FROM crm_companies c ${e}`,d),k=Number(j[0]?.n??0),{offset:l,pageSize:m,page:n,pageCount:o}=h(b.page,b.pageSize,k),p=function(a,b){let c=g.has(a)?f[a]:f.score;return`ORDER BY ${c} ${1===b?"ASC":"DESC"}, c.id DESC`}(b.sortKey,b.sortDir),[r]=await i.query(`SELECT c.*,
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
       ${p}
       LIMIT ? OFFSET ?`,[...d,m,l]);return{rows:r,total:k,page:n,pageCount:o}}async function D(a){await t();let b=q(),[c]=await b.query(`SELECT
       COALESCE(SUM(status = 'customer'), 0) AS customers,
       COALESCE(SUM(status = 'at_risk'), 0) AS at_risk,
       COALESCE(SUM(CASE WHEN status IN ('customer', 'at_risk') THEN annual_value ELSE 0 END), 0) AS arr
     FROM crm_companies WHERE organization_id = ?`,[a]),[d]=await b.query("SELECT COALESCE(SUM(value), 0) AS won FROM crm_deals WHERE organization_id = ? AND stage = 'won'",[a]);return{customers:Number(c[0]?.customers??0),atRisk:Number(c[0]?.at_risk??0),arr:Number(c[0]?.arr??0),won:Number(d[0]?.won??0)}}async function E(a,b){let c=b.filter(a=>Number.isInteger(a)).slice(0,500);if(!c.length)return;await t();let d=c.map(()=>"?").join(","),e=q();await e.query(`DELETE FROM crm_activities WHERE organization_id = ? AND company_id IN (${d})`,[a,...c]),await e.query(`DELETE FROM crm_deals WHERE organization_id = ? AND company_id IN (${d})`,[a,...c]),await e.query(`DELETE FROM crm_contacts WHERE organization_id = ? AND company_id IN (${d})`,[a,...c]),await e.query(`DELETE FROM crm_companies WHERE organization_id = ? AND id IN (${d})`,[a,...c])}async function F(a,b,c){let d=b.filter(a=>Number.isInteger(a)).slice(0,500);if(!d.length)return;await t();let e=d.map(()=>"?").join(",");await q().query(`UPDATE crm_companies SET status = ? WHERE organization_id = ? AND id IN (${e})`,[c.slice(0,20),a,...d])}function G(a){return a.filter(a=>Number.isInteger(a)).slice(0,500)}async function H(a,b){let c=G(b);c.length&&(await t(),await q().query(`DELETE FROM crm_leads WHERE organization_id = ? AND id IN (${c.map(()=>"?").join(",")})`,[a,...c]))}async function I(a,b,c){let d=G(b);d.length&&(await t(),await q().query(`UPDATE crm_leads SET status = ? WHERE organization_id = ? AND id IN (${d.map(()=>"?").join(",")})`,[c.slice(0,20),a,...d]))}async function J(a,b){let c=G(b);c.length&&(await t(),await q().query(`DELETE FROM crm_deals WHERE organization_id = ? AND id IN (${c.map(()=>"?").join(",")})`,[a,...c]))}async function K(a,b,c){let d=G(b);d.length&&(await t(),await q().query(`UPDATE crm_deals SET stage = ?, closed_at = NULL, loss_reason = '' WHERE organization_id = ? AND id IN (${d.map(()=>"?").join(",")})`,[c.slice(0,20),a,...d]))}async function L(a,b,c){await t();let[d]=await q().query(`INSERT INTO crm_contacts (organization_id, company_id, name, role, email, phone, department, influence, mobile, linkedin, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[a,b,c.name.slice(0,190),(c.role??"").slice(0,120),(c.email??"").slice(0,190),(c.phone??"").slice(0,60),(c.department??"").slice(0,60),(c.influence??"none").slice(0,20),(c.mobile??"").slice(0,40),(c.linkedin??"").slice(0,200),(c.notes??"").slice(0,2e3)]);return d.insertId}async function M(a,b){await t();let[c]=await q().query(`SELECT ct.*, COALESCE(co.name, '') AS company_name
       FROM crm_contacts ct
       LEFT JOIN crm_companies co ON co.id = ct.company_id AND co.organization_id = ct.organization_id
      WHERE ct.id = ? AND ct.organization_id = ? LIMIT 1`,[b,a]);return c[0]??null}async function N(a,b,c){await t(),await q().query(`UPDATE crm_contacts SET name=?, role=?, email=?, phone=?, department=?, influence=?, mobile=?, linkedin=?, notes=?
       WHERE id=? AND organization_id=?`,[c.name.slice(0,190),(c.role??"").slice(0,120),(c.email??"").slice(0,190),(c.phone??"").slice(0,60),(c.department??"").slice(0,60),(c.influence??"none").slice(0,20),(c.mobile??"").slice(0,40),(c.linkedin??"").slice(0,200),(c.notes??"").slice(0,2e3),b,a])}async function O(a,b,c=50){await t();let[d]=await q().query("SELECT * FROM crm_activities WHERE contact_id = ? AND organization_id = ? ORDER BY id DESC LIMIT ?",[b,a,c]);return d}async function P(a,b){await t();let[c]=await q().query("SELECT * FROM crm_contacts WHERE company_id = ? AND organization_id = ? ORDER BY id ASC",[b,a]);return c}async function Q(a,b){await t(),await q().query("DELETE FROM crm_contacts WHERE id = ? AND organization_id = ?",[b,a])}async function R(a,b){await t();let c=["ct.organization_id = ?"],d=[a];if(b.q){c.push("(ct.name LIKE ? OR ct.email LIKE ? OR ct.role LIKE ? OR co.name LIKE ?)");let a=`%${b.q}%`;d.push(a,a,a,a)}b.influence&&(c.push("ct.influence = ?"),d.push(b.influence));let e="FROM crm_contacts ct JOIN crm_companies co ON co.id = ct.company_id AND co.organization_id = ct.organization_id",f=`WHERE ${c.join(" AND ")}`,g=q(),[k]=await g.query(`SELECT COUNT(*) AS n ${e} ${f}`,d),l=Number(k[0]?.n??0),{offset:m,pageSize:n,page:o,pageCount:p}=h(b.page,b.pageSize,l),r=function(a,b){let c=j.has(a)?i[a]:i.name;return`ORDER BY ${c} ${1===b?"ASC":"DESC"}, ct.id DESC`}(b.sortKey,b.sortDir),[s]=await g.query(`SELECT ct.*, co.name AS company_name ${e} ${f} ${r} LIMIT ? OFFSET ?`,[...d,n,m]);return{rows:s,total:l,page:o,pageCount:p}}async function S(a,b,c){await t();let[d]=await q().query(`INSERT INTO crm_deals (organization_id, company_id, title, value, stage, probability, expected_close, owner, contact_id, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[a,b,c.title.slice(0,190),c.value??0,(c.stage??"new").slice(0,20),c.probability??null,c.expectedClose||null,(c.owner??"").slice(0,120),c.contactId??null,(c.notes??"").slice(0,2e3)]);return d.insertId}async function T(a,b={}){if(await t(),null!=b.companyId){let[c]=await q().query("SELECT * FROM crm_deals WHERE organization_id = ? AND company_id = ? ORDER BY updated_at DESC",[a,b.companyId]);return c}let[c]=await q().query("SELECT * FROM crm_deals WHERE organization_id = ? ORDER BY updated_at DESC LIMIT 1000",[a]);return c}async function U(a,b,c){await t();let d=[],e=[];void 0!==c.title&&(d.push("title=?"),e.push(c.title.slice(0,190))),void 0!==c.value&&(d.push("value=?"),e.push(c.value)),void 0!==c.stage&&(d.push("stage=?"),e.push(c.stage.slice(0,20))),void 0!==c.probability&&(d.push("probability=?"),e.push(c.probability)),void 0!==c.expectedClose&&(d.push("expected_close=?"),e.push(c.expectedClose||null)),void 0!==c.owner&&(d.push("owner=?"),e.push(c.owner.slice(0,120))),void 0!==c.contactId&&(d.push("contact_id=?"),e.push(c.contactId??null)),void 0!==c.notes&&(d.push("notes=?"),e.push((c.notes??"").slice(0,2e3))),d.length&&(e.push(b,a),await q().query(`UPDATE crm_deals SET ${d.join(", ")} WHERE id = ? AND organization_id = ?`,e))}async function V(a,b){await t();let[c]=await q().query(`SELECT d.*, COALESCE(co.name, '') AS company_name, ct.name AS contact_name
       FROM crm_deals d
       LEFT JOIN crm_companies co ON co.id = d.company_id AND co.organization_id = d.organization_id
       LEFT JOIN crm_contacts ct ON ct.id = d.contact_id AND ct.organization_id = d.organization_id
      WHERE d.id = ? AND d.organization_id = ? LIMIT 1`,[b,a]);return c[0]??null}async function W(a,b,c=50){await t();let[d]=await q().query("SELECT * FROM crm_activities WHERE deal_id = ? AND organization_id = ? ORDER BY id DESC LIMIT ?",[b,a,c]);return d}async function X(a,b){await t();let[c]=await q().query("SELECT * FROM crm_deals WHERE contact_id = ? AND organization_id = ? ORDER BY updated_at DESC LIMIT 50",[b,a]);return c}async function Y(a,b){await t();let c=await q().getConnection();try{await c.beginTransaction();let[d]=await c.query("SELECT company_id FROM crm_deals WHERE id = ? AND organization_id = ? FOR UPDATE",[b,a]),e=d[0];if(!e)return await c.rollback(),null;return await c.query("UPDATE crm_deals SET stage = 'won', probability = 100, closed_at = CURRENT_TIMESTAMP, loss_reason = '' WHERE id = ? AND organization_id = ?",[b,a]),await c.query("UPDATE crm_companies SET status = 'customer' WHERE id = ? AND organization_id = ? AND status <> 'customer'",[e.company_id,a]),await c.commit(),{companyId:e.company_id}}catch(a){throw await c.rollback(),a}finally{c.release()}}async function Z(a,b,c){await t();let[d]=await q().query("SELECT company_id FROM crm_deals WHERE id = ? AND organization_id = ? LIMIT 1",[b,a]),e=d[0];return e?(await q().query("UPDATE crm_deals SET stage = 'lost', probability = 0, closed_at = CURRENT_TIMESTAMP, loss_reason = ? WHERE id = ? AND organization_id = ?",[c.slice(0,40),b,a]),{companyId:e.company_id}):null}async function $(a,b,c){await t();let[d]=await q().query("SELECT company_id FROM crm_deals WHERE id = ? AND organization_id = ? LIMIT 1",[b,a]),e=d[0];return e?(await q().query("UPDATE crm_deals SET stage = ?, closed_at = NULL, loss_reason = '' WHERE id = ? AND organization_id = ?",[c.slice(0,20),b,a]),{companyId:e.company_id}):null}async function _(a,b){await t(),await q().query("DELETE FROM crm_deals WHERE id = ? AND organization_id = ?",[b,a])}async function aa(a,b){await t();let c=["d.organization_id = ?"],d=[a];if(b.q){c.push("(d.title LIKE ? OR co.name LIKE ?)");let a=`%${b.q}%`;d.push(a,a)}b.stage&&(c.push("d.stage = ?"),d.push(b.stage));let e="FROM crm_deals d JOIN crm_companies co ON co.id = d.company_id AND co.organization_id = d.organization_id",f=`WHERE ${c.join(" AND ")}`,g=q(),[i]=await g.query(`SELECT COUNT(*) AS n ${e} ${f}`,d),j=Number(i[0]?.n??0),{offset:k,pageSize:n,page:o,pageCount:p}=h(b.page,b.pageSize,j),r=function(a,b){let c=m.has(a)?l[a]:l.value;return`ORDER BY ${c} ${1===b?"ASC":"DESC"}, d.id DESC`}(b.sortKey,b.sortDir),[s]=await g.query(`SELECT d.*, co.name AS company_name ${e} ${f} ${r} LIMIT ? OFFSET ?`,[...d,n,k]);return{rows:s,total:j,page:o,pageCount:p}}async function ab(a,b){await t();let[c]=await q().query("INSERT INTO crm_activities (organization_id, company_id, contact_id, deal_id, type, summary) VALUES (?, ?, ?, ?, ?, ?)",[a,b.companyId,b.contactId??null,b.dealId??null,(b.type??"note").slice(0,20),b.summary.slice(0,500)]);return c.insertId}async function ac(a,b,c=50){await t();let[d]=await q().query("SELECT * FROM crm_activities WHERE company_id = ? AND organization_id = ? ORDER BY id DESC LIMIT ?",[b,a,c]);return d}async function ad(a,b){await t();let c=["a.organization_id = ?"],d=[a];if(b.q){c.push("(a.summary LIKE ? OR co.name LIKE ?)");let a=`%${b.q}%`;d.push(a,a)}b.type&&(c.push("a.type = ?"),d.push(b.type)),b.sinceDays&&b.sinceDays>0&&c.push(`a.created_at >= DATE_SUB(NOW(), INTERVAL ${Math.floor(b.sinceDays)} DAY)`);let e="FROM crm_activities a JOIN crm_companies co ON co.id = a.company_id AND co.organization_id = a.organization_id",f=`WHERE ${c.join(" AND ")}`,g=q(),[i]=await g.query(`SELECT COUNT(*) AS n ${e} ${f}`,d),j=Number(i[0]?.n??0),{offset:k,pageSize:l,page:m,pageCount:p}=h(b.page,b.pageSize,j),r=function(a,b){let c=o.has(a)?n[a]:n.created;return`ORDER BY ${c} ${1===b?"ASC":"DESC"}, a.id DESC`}(b.sortKey,b.sortDir),[s]=await g.query(`SELECT a.*, co.name AS company_name ${e} ${f} ${r} LIMIT ? OFFSET ?`,[...d,l,k]);return{rows:s,total:j,page:m,pageCount:p}}async function ae(a,b){await t(),await q().query("DELETE FROM crm_activities WHERE id = ? AND organization_id = ?",[b,a])}function af(a){return(0,e.DY)({hasWebsite:!!(a.website??"").trim(),employees:a.employees??null,industryMatch:!!a.industryMatch,annualValue:a.annualValue??0})}async function ag(a,b){await t();let[c]=await q().query(`INSERT INTO crm_leads (organization_id, name, company, title, email, phone, source, status, industry, website, employees, annual_value, industry_match, lead_score, notes, priority, owner)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[a,b.name.slice(0,190),(b.company??"").slice(0,190),(b.title??"").slice(0,120),(b.email??"").slice(0,190),(b.phone??"").slice(0,60),(b.source??"other").slice(0,30),(b.status??"new").slice(0,20),(b.industry??"").slice(0,120),(b.website??"").slice(0,300),b.employees??null,b.annualValue??0,+!!b.industryMatch,af(b),(b.notes??"").slice(0,500),(b.priority??"normal").slice(0,12),(b.owner??"").slice(0,120)]);return c.insertId}async function ah(a,b){await t();let[c]=await q().query("SELECT * FROM crm_leads WHERE id = ? AND organization_id = ? LIMIT 1",[b,a]);return c[0]??null}async function ai(a,b,c){await t(),await q().query(`UPDATE crm_leads SET name=?, company=?, title=?, email=?, phone=?, source=?, industry=?, website=?, employees=?, annual_value=?, industry_match=?, lead_score=?, notes=?, priority=?, owner=?
       WHERE id=? AND organization_id=?`,[c.name.slice(0,190),(c.company??"").slice(0,190),(c.title??"").slice(0,120),(c.email??"").slice(0,190),(c.phone??"").slice(0,60),(c.source??"other").slice(0,30),(c.industry??"").slice(0,120),(c.website??"").slice(0,300),c.employees??null,c.annualValue??0,+!!c.industryMatch,af(c),(c.notes??"").slice(0,500),(c.priority??"normal").slice(0,12),(c.owner??"").slice(0,120),b,a])}async function aj(a,b){await t();let c=["l.organization_id = ?"],d=[a];if(b.q){c.push("(l.name LIKE ? OR l.company LIKE ? OR l.email LIKE ?)");let a=`%${b.q}%`;d.push(a,a,a)}b.status&&(c.push("l.status = ?"),d.push(b.status)),b.source&&(c.push("l.source = ?"),d.push(b.source));let e=`WHERE ${c.join(" AND ")}`,f=q(),[g]=await f.query(`SELECT COUNT(*) AS n FROM crm_leads l ${e}`,d),i=Number(g[0]?.n??0),{offset:j,pageSize:l,page:m,pageCount:n}=h(b.page,b.pageSize,i),o=(0,k.Oj)(b.sortKey,b.sortDir),[p]=await f.query(`SELECT l.* FROM crm_leads l ${e} ${o} LIMIT ? OFFSET ?`,[...d,l,j]);return{rows:p,total:i,page:m,pageCount:n}}async function ak(a,b,c){await t(),await q().query("UPDATE crm_leads SET status = ? WHERE id = ? AND organization_id = ?",[c.slice(0,20),b,a])}async function al(a,b){await t(),await q().query("DELETE FROM crm_leads WHERE id = ? AND organization_id = ?",[b,a])}async function am(a,b,c={}){await t();let d=await q().getConnection();try{await d.beginTransaction();let[e]=await d.query("SELECT * FROM crm_leads WHERE id = ? AND organization_id = ? FOR UPDATE",[b,a]),f=e[0];if(!f)return await d.rollback(),null;if(f.converted_company_id)return await d.commit(),{companyId:f.converted_company_id,dealId:null,createdCompany:!1};let g=0;if(c.companyId){let[b]=await d.query("SELECT id FROM crm_companies WHERE id = ? AND organization_id = ? LIMIT 1",[c.companyId,a]);b[0]&&(g=Number(b[0].id))}let h=0===g;if(h){let b=af({website:f.website,employees:f.employees,industryMatch:!!f.industry_match,annualValue:f.annual_value}),[c]=await d.query(`INSERT INTO crm_companies (organization_id, name, industry, city, website, employees, annual_value, status, account_manager, industry_match, lead_score)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'active', '', ?, ?)`,[a,(f.company||f.name).slice(0,190),f.industry.slice(0,120),"",f.website.slice(0,300),f.employees,f.annual_value,f.industry_match,b]);g=c.insertId}if(f.name.trim()){let b=!1;if(f.email.trim()){let[c]=await d.query("SELECT id FROM crm_contacts WHERE company_id = ? AND organization_id = ? AND email = ? LIMIT 1",[g,a,f.email]);b=!!c[0]}b||await d.query(`INSERT INTO crm_contacts (organization_id, company_id, name, role, email, phone, department, influence)
             VALUES (?, ?, ?, ?, ?, ?, '', 'none')`,[a,g,f.name.slice(0,190),f.title.slice(0,120),f.email.slice(0,190),f.phone.slice(0,60)])}let i=null;if(c.deal&&c.deal.title.trim()){let[b]=await d.query("INSERT INTO crm_deals (organization_id, company_id, title, value, stage, probability, expected_close, owner) VALUES (?, ?, ?, ?, ?, NULL, NULL, '')",[a,g,c.deal.title.slice(0,190),c.deal.value??0,(c.deal.stage??"new").slice(0,20)]);i=b.insertId}return await d.query("UPDATE crm_leads SET status = 'converted', converted_company_id = ? WHERE id = ? AND organization_id = ?",[g,b,a]),await d.commit(),{companyId:g,dealId:i,createdCompany:h}}catch(a){throw await d.rollback(),a}finally{d.release()}}async function an(a,b){await t();let[c]=await q().query("INSERT INTO crm_tasks (organization_id, company_id, title, notes, due_date, priority) VALUES (?, ?, ?, ?, ?, ?)",[a,b.companyId??null,b.title.slice(0,300),(b.notes??"").slice(0,500),b.dueDate||null,(b.priority??"normal").slice(0,10)]);return c.insertId}async function ao(a,b){await t();let[c]=await q().query(a,[b]);return c.map(a=>({status:String(a.k),n:Number(a.n),value:Number(a.v??0)}))}let ap=a=>ao("SELECT status AS k, COUNT(*) AS n, COALESCE(SUM(annual_value),0) AS v FROM crm_companies WHERE organization_id = ? GROUP BY status",a),aq=a=>ao("SELECT stage AS k, COUNT(*) AS n, COALESCE(SUM(value),0) AS v FROM crm_deals WHERE organization_id = ? GROUP BY stage",a),ar=a=>ao("SELECT status AS k, COUNT(*) AS n FROM crm_leads WHERE organization_id = ? GROUP BY status",a),as=a=>ao("SELECT source AS k, COUNT(*) AS n FROM crm_leads WHERE organization_id = ? GROUP BY source",a),at=a=>ao("SELECT type AS k, COUNT(*) AS n FROM crm_activities WHERE organization_id = ? GROUP BY type",a),au=a=>ao("SELECT status AS k, COUNT(*) AS n, COALESCE(SUM(total_cents),0) AS v FROM crm_quotes WHERE organization_id = ? GROUP BY status",a);async function av(a){await t();let[b]=await q().query(`SELECT COALESCE(NULLIF(owner, ''), 'Unassigned') AS owner,
       COALESCE(SUM(CASE WHEN stage = 'won' THEN value ELSE 0 END), 0) AS won,
       COALESCE(SUM(CASE WHEN stage NOT IN ('won','lost') THEN value ELSE 0 END), 0) AS open,
       COALESCE(SUM(CASE WHEN stage = 'won' THEN 1 ELSE 0 END), 0) AS won_n,
       COALESCE(SUM(CASE WHEN stage = 'lost' THEN 1 ELSE 0 END), 0) AS lost_n,
       COUNT(*) AS n
     FROM crm_deals WHERE organization_id = ? GROUP BY owner ORDER BY won DESC, open DESC LIMIT 20`,[a]);return b.map(a=>({owner:String(a.owner),won:Number(a.won),open:Number(a.open),n:Number(a.n),wonCount:Number(a.won_n),lostCount:Number(a.lost_n)}))}async function aw(a){await t();let[b]=await q().query(`SELECT DATE_FORMAT(expected_close, '%Y-%m') AS month, stage, COALESCE(SUM(value),0) AS value
     FROM crm_deals
     WHERE organization_id = ? AND stage NOT IN ('won','lost') AND expected_close IS NOT NULL
     GROUP BY month, stage ORDER BY month ASC`,[a]);return b.map(a=>({month:String(a.month),stage:String(a.stage),value:Number(a.value)}))}async function ax(a){await t();let[b]=await q().query("SELECT COUNT(*) AS n FROM crm_activities WHERE organization_id = ? AND created_at >= NOW() - INTERVAL 30 DAY",[a]);return Number(b[0]?.n??0)}let ay="DATE_SUB(DATE_FORMAT(NOW(),'%Y-%m-01'), INTERVAL 11 MONTH)";async function az(a,b){await t();let[c]=await q().query(a,[b]);return c.map(a=>({month:String(a.month),n:Number(a.n),v:Number(a.v??0)}))}let aA=a=>az(`SELECT DATE_FORMAT(closed_at,'%Y-%m') AS month, COUNT(*) AS n, COALESCE(SUM(value),0) AS v
     FROM crm_deals WHERE organization_id = ? AND stage = 'won' AND closed_at IS NOT NULL AND closed_at >= ${ay}
     GROUP BY month ORDER BY month ASC`,a),aB=a=>az(`SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, COUNT(*) AS n
     FROM crm_activities WHERE organization_id = ? AND created_at >= ${ay}
     GROUP BY month ORDER BY month ASC`,a),aC=a=>az(`SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, COUNT(*) AS n
     FROM crm_leads WHERE organization_id = ? AND created_at >= ${ay}
     GROUP BY month ORDER BY month ASC`,a),aD=a=>az(`SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, COUNT(*) AS n, COALESCE(SUM(value),0) AS v
     FROM crm_deals WHERE organization_id = ? AND created_at >= ${ay}
     GROUP BY month ORDER BY month ASC`,a);async function aE(a,b){await t();let[c]=await q().query(`SELECT d.id, d.title, d.value, d.stage, co.name AS company_name
     FROM crm_deals d JOIN crm_companies co ON co.id = d.company_id AND co.organization_id = d.organization_id
     WHERE d.organization_id = ? AND d.stage NOT IN ('won','lost')
     ORDER BY d.value DESC LIMIT ?`,[a,Number(b)||8]);return c.map(a=>({id:Number(a.id),title:String(a.title),companyName:String(a.company_name),value:Number(a.value),stage:String(a.stage)}))}async function aF(a,b,c){await t();let d=Number(b)||30,[e]=await q().query(`SELECT c.id, c.name,
       DATEDIFF(NOW(), (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.company_id = c.id)) AS last_days
     FROM crm_companies c
     WHERE c.organization_id = ? AND c.status IN ('customer','at_risk')
       AND ((SELECT MAX(a.created_at) FROM crm_activities a WHERE a.company_id = c.id) IS NULL
            OR (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.company_id = c.id) < NOW() - INTERVAL ${d} DAY)
     ORDER BY last_days IS NULL DESC, last_days DESC LIMIT ?`,[a,Number(c)||5]);return e.map(a=>({id:Number(a.id),name:String(a.name),lastDays:null==a.last_days?null:Number(a.last_days)}))}async function aG(a,b){await t();let[c]=await q().query(`SELECT d.id, d.company_id, d.title, co.name AS company_name, DATEDIFF(NOW(), d.expected_close) AS days
     FROM crm_deals d JOIN crm_companies co ON co.id = d.company_id AND co.organization_id = d.organization_id
     WHERE d.organization_id = ? AND d.stage NOT IN ('won','lost') AND d.expected_close IS NOT NULL AND d.expected_close < CURDATE()
     ORDER BY d.expected_close ASC LIMIT ?`,[a,Number(b)||5]);return c.map(a=>({id:Number(a.id),companyId:Number(a.company_id),companyName:String(a.company_name),title:String(a.title),days:Number(a.days)}))}async function aH(a,b,c){await t();let d=Number(b)||60,[e]=await q().query(`SELECT id, name, company, lead_score FROM crm_leads
     WHERE organization_id = ? AND status IN ('new','working') AND lead_score >= ${d}
     ORDER BY lead_score DESC LIMIT ?`,[a,Number(c)||5]);return e.map(a=>({id:Number(a.id),name:String(a.name),company:String(a.company),score:Number(a.lead_score)}))}async function aI(a,b,c){await t();let d=Number(b)||7,[e]=await q().query(`SELECT q.id, co.name AS company_name, DATEDIFF(NOW(), q.created_at) AS days
     FROM crm_quotes q JOIN crm_companies co ON co.id = q.company_id AND co.organization_id = q.organization_id
     WHERE q.organization_id = ? AND q.status = 'sent' AND q.created_at < NOW() - INTERVAL ${d} DAY
     ORDER BY q.created_at ASC LIMIT ?`,[a,Number(c)||5]);return e.map(a=>({id:Number(a.id),companyName:String(a.company_name),days:Number(a.days)}))}async function aJ(a,b,c){await t();let d=Number(b)||14,[e]=await q().query(`SELECT d.id, d.company_id, d.title, co.name AS company_name,
            DATEDIFF(NOW(), (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.deal_id = d.id)) AS idle_days
     FROM crm_deals d JOIN crm_companies co ON co.id = d.company_id AND co.organization_id = d.organization_id
     WHERE d.organization_id = ? AND d.stage NOT IN ('won','lost') AND d.created_at < NOW() - INTERVAL ${d} DAY
       AND ((SELECT MAX(a.created_at) FROM crm_activities a WHERE a.deal_id = d.id) IS NULL
            OR (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.deal_id = d.id) < NOW() - INTERVAL ${d} DAY)
     ORDER BY idle_days IS NULL DESC, idle_days DESC LIMIT ?`,[a,Number(c)||5]);return e.map(a=>({id:Number(a.id),companyId:Number(a.company_id),companyName:String(a.company_name),title:String(a.title),idleDays:null==a.idle_days?null:Number(a.idle_days)}))}async function aK(a,b,c){await t();let d=Number(b)||7,[e]=await q().query(`SELECT co.id, co.name, DATEDIFF(NOW(), MAX(d.closed_at)) AS days
     FROM crm_companies co JOIN crm_deals d ON d.company_id = co.id AND d.organization_id = co.organization_id
     WHERE co.organization_id = ? AND d.stage = 'won' AND d.closed_at IS NOT NULL AND d.closed_at >= NOW() - INTERVAL ${d} DAY
     GROUP BY co.id, co.name
     ORDER BY MAX(d.closed_at) DESC LIMIT ?`,[a,Number(c)||5]);return e.map(a=>({id:Number(a.id),name:String(a.name),days:Number(a.days)}))}async function aL(a){await t();let[b]=await q().query("SELECT * FROM crm_automations WHERE organization_id = ? AND enabled = 1 ORDER BY id ASC",[a]);return b}async function aM(a,b,c,d){await t();let e=q();await e.query("INSERT INTO crm_automation_runs (organization_id, automation_id, created_count, summary) VALUES (?, ?, ?, ?)",[a,b,c,d.slice(0,255)]),await e.query("UPDATE crm_automations SET last_run_at = CURRENT_TIMESTAMP, created_count = created_count + ? WHERE id = ? AND organization_id = ?",[c,b,a])}async function aN(a,b){await t();let[c]=await q().query("SELECT 1 FROM crm_tasks WHERE organization_id = ? AND title = ? AND done = 0 LIMIT 1",[a,b]);return c.length>0}async function aO(){await t();let[a]=await q().query("SELECT DISTINCT organization_id FROM crm_automations WHERE enabled = 1 ORDER BY organization_id");return a.map(a=>Number(a.organization_id))}function aP(){return p.__crmAuthSchema||(p.__crmAuthSchema=(async()=>{let a=q();await a.query(`
        CREATE TABLE IF NOT EXISTS crm_organizations (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(190) NOT NULL DEFAULT '',
          slug VARCHAR(120) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_org_slug (slug)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await s(a,"crm_organizations","plan","plan VARCHAR(24) NOT NULL DEFAULT 'pro'"),await s(a,"crm_organizations","billing_email","billing_email VARCHAR(190) NOT NULL DEFAULT ''"),await s(a,"crm_organizations","billing_name","billing_name VARCHAR(190) NOT NULL DEFAULT ''"),await s(a,"crm_organizations","billing_address","billing_address VARCHAR(500) NOT NULL DEFAULT ''"),await s(a,"crm_organizations","tax_id","tax_id VARCHAR(40) NOT NULL DEFAULT ''"),await s(a,"crm_organizations","api_frozen","api_frozen TINYINT NOT NULL DEFAULT 0"),await s(a,"crm_organizations","ai_paused","ai_paused TINYINT NOT NULL DEFAULT 0"),await s(a,"crm_organizations","automations_paused","automations_paused TINYINT NOT NULL DEFAULT 0"),await a.query(`
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
      `),await s(a,"crm_users","totp_secret","totp_secret VARCHAR(255) NOT NULL DEFAULT ''"),await s(a,"crm_users","totp_enabled","totp_enabled TINYINT NOT NULL DEFAULT 0"),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_recovery_codes (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          user_id INT UNSIGNED NOT NULL,
          code_hash CHAR(64) NOT NULL,
          used_at TIMESTAMP NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_recovery_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_mfa_challenges (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          user_id INT UNSIGNED NOT NULL,
          token_hash CHAR(64) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_mfa_token (token_hash),
          INDEX idx_mfa_user (user_id)
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
      `),await s(a,"crm_sessions","ip","ip VARCHAR(45) NOT NULL DEFAULT ''"),await s(a,"crm_sessions","user_agent","user_agent VARCHAR(255) NOT NULL DEFAULT ''"),await s(a,"crm_sessions","last_used_at","last_used_at TIMESTAMP NULL"),await a.query(`
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
      `),await s(a,"crm_audit_logs","ip","ip VARCHAR(45) NOT NULL DEFAULT ''"),await s(a,"crm_audit_logs","user_agent","user_agent VARCHAR(255) NOT NULL DEFAULT ''"),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_api_keys (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          name VARCHAR(120) NOT NULL DEFAULT '',
          key_hash CHAR(64) NOT NULL,
          last4 VARCHAR(8) NOT NULL DEFAULT '',
          created_by_email VARCHAR(190) NOT NULL DEFAULT '',
          enabled TINYINT NOT NULL DEFAULT 1,
          last_used_at TIMESTAMP NULL,
          request_count INT UNSIGNED NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_apikey_hash (key_hash),
          INDEX idx_apikey_org (organization_id, id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await s(a,"crm_api_keys","expires_at","expires_at TIMESTAMP NULL"),await s(a,"crm_api_keys","scopes","scopes VARCHAR(255) NOT NULL DEFAULT 'companies,contacts,deals'")})().catch(a=>{throw p.__crmAuthSchema=void 0,a})),p.__crmAuthSchema}let aQ={api:"api_frozen",ai:"ai_paused",automations:"automations_paused"};async function aR(a){await aP();let[b]=await q().query("SELECT api_frozen, ai_paused, automations_paused FROM crm_organizations WHERE id = ? LIMIT 1",[a]),c=b[0];return{apiFrozen:!!c?.api_frozen,aiPaused:!!c?.ai_paused,automationsPaused:!!c?.automations_paused}}async function aS(a,b,c){let d=aQ[b];return!!d&&(await aP(),await q().query(`UPDATE crm_organizations SET ${d} = ? WHERE id = ?`,[+!!c,a]),!0)}async function aT(a,b){await aP();let[c]=await q().query("DELETE FROM crm_sessions WHERE organization_id = ? AND id <> ?",[a,b]);return c.affectedRows??0}async function aU(a){await aP();let[b]=await q().query("SELECT COUNT(*) AS n FROM crm_sessions WHERE organization_id = ? AND expires_at > NOW()",[a]);return Number(b[0]?.n??0)}async function aV(){await aP();let[a]=await q().query("SELECT COUNT(*) AS n FROM crm_users");return Number(a[0]?.n??0)}async function aW(a){await aP();let[b]=await q().query("SELECT * FROM crm_organizations WHERE id = ? LIMIT 1",[a]);return b[0]??null}async function aX(a,b,c){await aP(),await q().query("UPDATE crm_organizations SET name = ?, slug = ? WHERE id = ?",[b.slice(0,190),c.slice(0,120),a])}async function aY(a){await aP();let[b]=await q().query("SELECT COUNT(*) AS n FROM crm_users WHERE organization_id = ?",[a]);return Number(b[0]?.n??0)}async function aZ(a,b){await aP(),await q().query("UPDATE crm_organizations SET plan = ? WHERE id = ?",[b.slice(0,24),a])}async function a$(a,b){await aP(),await q().query("UPDATE crm_organizations SET billing_email = ?, billing_name = ?, billing_address = ?, tax_id = ? WHERE id = ?",[b.billingEmail.slice(0,190),b.billingName.slice(0,190),b.billingAddress.slice(0,500),b.taxId.slice(0,40),a])}async function a_(a){await t(),await aP();let b=q(),c=c=>b.query(c,[a]).then(([a])=>Number(a[0]?.n??0)),[d,e,f,g]=await Promise.all([c("SELECT COUNT(*) AS n FROM crm_users WHERE organization_id = ?"),c("SELECT COUNT(*) AS n FROM crm_companies WHERE organization_id = ?"),c("SELECT COUNT(*) AS n FROM crm_contacts WHERE organization_id = ?"),c("SELECT COUNT(*) AS n FROM crm_deals WHERE organization_id = ?")]);return{users:d,companies:e,contacts:f,deals:g}}async function a0(a){await aP();let[b]=await q().query("SELECT * FROM crm_api_keys WHERE organization_id = ? ORDER BY id DESC",[a]);return b}async function a1(a,b){await aP();let[c]=await q().query("INSERT INTO crm_api_keys (organization_id, name, key_hash, last4, created_by_email, expires_at, scopes) VALUES (?, ?, ?, ?, ?, ?, ?)",[a,b.name.slice(0,120),b.keyHash.slice(0,64),b.last4.slice(0,8),b.createdByEmail.slice(0,190),b.expiresAt??null,(b.scopes||"companies,contacts,deals").slice(0,255)]);return c.insertId}async function a2(a,b,c){await aP(),await q().query("UPDATE crm_api_keys SET enabled = ? WHERE id = ? AND organization_id = ?",[+!!c,b,a])}async function a3(a,b){await aP(),await q().query("DELETE FROM crm_api_keys WHERE id = ? AND organization_id = ?",[b,a])}async function a4(a){await aP();let[b]=await q().query("SELECT id, organization_id, scopes FROM crm_api_keys WHERE key_hash = ? AND enabled = 1 AND (expires_at IS NULL OR expires_at > NOW()) LIMIT 1",[a]),c=b[0];return c?{id:c.id,organizationId:c.organization_id,scopes:c.scopes}:null}async function a5(a){await aP(),await q().query("UPDATE crm_api_keys SET last_used_at = CURRENT_TIMESTAMP, request_count = request_count + 1 WHERE id = ?",[a]).catch(()=>{})}async function a6(a){await aP();let[b]=await q().query("SELECT * FROM crm_users WHERE email = ? AND status = 'active' LIMIT 1",[a.toLowerCase()]);return b[0]??null}async function a7(a){await aP();let[b]=await q().query("SELECT * FROM crm_users WHERE id = ? LIMIT 1",[a]);return b[0]??null}async function a8(a){await aP(),await q().query("UPDATE crm_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?",[a])}async function a9(a){await aP(),await q().query("INSERT INTO crm_sessions (user_id, organization_id, token_hash, expires_at, ip, user_agent, last_used_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",[a.userId,a.organizationId,a.tokenHash,a.expiresAt,(a.ip??"").slice(0,45),(a.userAgent??"").slice(0,255)])}async function ba(a){await aP();let[b]=await q().query("SELECT * FROM crm_sessions WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP LIMIT 1",[a]);return b[0]??null}async function bb(a){try{await q().query("UPDATE crm_sessions SET last_used_at = CURRENT_TIMESTAMP WHERE token_hash = ?",[a])}catch{}}async function bc(a){await aP(),await q().query("INSERT INTO crm_audit_logs (organization_id, user_id, actor_email, action, entity, entity_id, summary, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",[a.organizationId,a.userId,a.actorEmail.slice(0,190),a.action.slice(0,40),a.entity.slice(0,40),a.entityId??null,(a.summary??"").slice(0,255),(a.ip??"").slice(0,45),(a.userAgent??"").slice(0,255)])}async function bd(a,b=100){await aP();let[c]=await q().query("SELECT * FROM crm_audit_logs WHERE organization_id = ? ORDER BY id DESC LIMIT ?",[a,b]);return c}async function be(a){await aP();let b=q(),c=async c=>{let[d]=await b.query(c,[a]);return Number(d[0]?.n??0)},[d,e,f,g,h,i,j,k]=await Promise.all([c("SELECT COUNT(*) AS n FROM crm_sessions WHERE organization_id = ? AND expires_at > NOW()"),c("SELECT COUNT(*) AS n FROM crm_sessions WHERE organization_id = ? AND expires_at > NOW() AND COALESCE(last_used_at, created_at) < NOW() - INTERVAL 30 DAY"),c("SELECT COUNT(*) AS n FROM crm_audit_logs WHERE organization_id = ? AND action = 'login_failed' AND created_at >= NOW() - INTERVAL 24 HOUR"),c("SELECT COUNT(*) AS n FROM crm_users WHERE organization_id = ?"),c("SELECT COUNT(*) AS n FROM crm_users WHERE organization_id = ? AND role IN ('owner','admin')"),c("SELECT COUNT(*) AS n FROM crm_users WHERE organization_id = ? AND role IN ('owner','admin') AND status = 'active' AND totp_enabled = 0"),c("SELECT COUNT(*) AS n FROM crm_api_keys WHERE organization_id = ? AND enabled = 1"),c("SELECT COUNT(*) AS n FROM crm_api_keys WHERE organization_id = ? AND enabled = 1 AND COALESCE(last_used_at, created_at) < NOW() - INTERVAL 90 DAY")]);return{activeSessions:d,staleSessions:e,failedLogins24h:f,users:g,admins:h,adminsWithoutMfa:i,apiKeysEnabled:j,apiKeysIdle:k}}},50505:(a,b,c)=>{"use strict";c.d(b,{DY:()=>n,Hn:()=>l,Qq:()=>h,WI:()=>m,an:()=>d,dw:()=>k,ub:()=>o,w7:()=>f,yi:()=>j,zL:()=>e});let d=[{id:"new",label:"New lead",probability:10,open:!0},{id:"qualified",label:"Qualified",probability:20,open:!0},{id:"contacted",label:"Contacted",probability:30,open:!0},{id:"discovery",label:"Discovery",probability:45,open:!0},{id:"meeting",label:"Meeting",probability:60,open:!0},{id:"quote",label:"Quote sent",probability:75,open:!0},{id:"negotiation",label:"Negotiation",probability:85,open:!0},{id:"won",label:"Won",probability:100,open:!1},{id:"lost",label:"Lost",probability:0,open:!1}],e=d.filter(a=>a.open),f=d.map(a=>a.id),g=["price","competitor","no_budget","timing","no_response","wrong_fit","other"];function h(a){return g.includes(a)}let i=new Map(d.map(a=>[a.id,a]));function j(a){return i.has(a)}function k(a){return i.get(a)??d[0]}function l(a){return i.get(a)?.label??a}function m(a){let b=Object.fromEntries(f.map(a=>[a,{count:0,value:0}])),c=0,d=0,e=0,g=0,h=0,j=0;for(let f of a){let a=i.get(f.stage)?f.stage:"new";b[a].count+=1,b[a].value+=f.value,k(a).open?(c+=f.value,d+=function(a){let b=k(a.stage);if(!b.open)return"won"===b.id?a.value:0;let c=null!=a.probability?a.probability:b.probability;return Math.round(a.value*Math.max(0,Math.min(100,c))/100)}(f),g+=1):"won"===a?(e+=f.value,h+=1):j+=1}let l=h+j,m=l?Math.round(h/l*100):0;return{open:c,weighted:d,won:e,openCount:g,wonCount:h,lostCount:j,winRate:m,byStage:b}}function n(a){let b=30;a.hasWebsite&&(b+=15),a.industryMatch&&(b+=25);let c=a.employees??0;return c>=200?b+=20:c>=50?b+=15:c>=10&&(b+=8),(a.annualValue??0)>=2e4&&(b+=10),Math.max(0,Math.min(100,b))}function o(a){let b=[{label:"Base",points:30}];a.hasWebsite&&b.push({label:"Has a website",points:15}),a.industryMatch&&b.push({label:"Industry fit",points:25});let c=a.employees??0;return c>=200?b.push({label:"200+ employees",points:20}):c>=50?b.push({label:"50+ employees",points:15}):c>=10&&b.push({label:"10+ employees",points:8}),(a.annualValue??0)>=2e4&&b.push({label:"Annual value ≥ €20k",points:10}),{total:Math.max(0,Math.min(100,b.reduce((a,b)=>a+b.points,0))),factors:b}}},85750:(a,b,c)=>{"use strict";function d(a){return`Q-${String(a).padStart(4,"0")}`}c.d(b,{yx:()=>d})}};