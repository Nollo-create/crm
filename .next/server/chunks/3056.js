exports.id=3056,exports.ids=[3056],exports.modules={28303:a=>{function b(a){var b=Error("Cannot find module '"+a+"'");throw b.code="MODULE_NOT_FOUND",b}b.keys=()=>[],b.resolve=b,b.id=28303,a.exports=b},31100:(a,b,c)=>{"use strict";c.d(b,{BB:()=>e,Oj:()=>n,Qd:()=>h,aD:()=>i,xM:()=>f,zk:()=>k});let d=["new","working","qualified","unqualified","converted"],e={new:"New",working:"Working",qualified:"Qualified",unqualified:"Unqualified",converted:"Converted"};function f(a){return d.includes(a)}let g=["web","referral","event","cold","import","other"],h={web:"Website",referral:"Referral",event:"Event",cold:"Cold outreach",import:"Imported",other:"Other"};function i(a){return g.includes(a)}let j=["low","normal","high"];function k(a){return j.includes(a)}let l={name:"l.name",company:"l.company",source:"l.source",status:"l.status",score:"l.lead_score",created:"l.id"},m=new Set(Object.keys(l));function n(a,b){let c=m.has(a)?l[a]:l.score;return`ORDER BY ${c} ${1===b?"ASC":"DESC"}, l.id DESC`}},39887:(a,b,c)=>{"use strict";function d(a){return`INV-${String(a).padStart(4,"0")}`}function e(a,b,c){return"sent"===a&&!!b&&b.slice(0,10)<c}c.d(b,{Ib:()=>e,N6:()=>d})},47554:(a,b,c)=>{"use strict";c.d(b,{RlV:()=>a2,Tvo:()=>a1,ROY:()=>ag,IP1:()=>Q,bv:()=>bp,zEn:()=>aJ,J5E:()=>aB,hi3:()=>aF,wWn:()=>ax,I9W:()=>aE,W3D:()=>aD,dts:()=>ay,dDN:()=>aL,tVd:()=>aK,_5M:()=>aA,FeU:()=>az,xSL:()=>aC,tyz:()=>aM,_Zg:()=>aI,PHg:()=>J,DLX:()=>O,jtr:()=>M,kFX:()=>K,jvu:()=>P,BBy:()=>N,Mwi:()=>bj,bCV:()=>ac,vGP:()=>ab,VnY:()=>b0,KPv:()=>ar,PBT:()=>bH,cQd:()=>bL,JI4:()=>bz,_aR:()=>bI,Iqf:()=>bQ,eK9:()=>A,ros:()=>X,las:()=>bb,Hbf:()=>a8,tRt:()=>al,mlv:()=>b1,UI8:()=>bx,cjV:()=>bh,jwg:()=>bY,UTO:()=>as,Mlm:()=>I,BwP:()=>t,$yT:()=>aj,Lh4:()=>bS,RCX:()=>G,MOQ:()=>V,iGU:()=>ae,uoo:()=>ba,srg:()=>aq,Z42:()=>aW,GOs:()=>be,Klv:()=>bf,nuN:()=>bc,LlO:()=>bT,QaE:()=>D,dOi:()=>bE,C1Z:()=>C,blr:()=>R,iil:()=>bq,Dj0:()=>bw,NEz:()=>$,qK7:()=>a5,F1Z:()=>bs,AJ:()=>av,DTb:()=>am,jCc:()=>bA,EeC:()=>aZ,kqY:()=>a3,SAY:()=>bJ,Vyp:()=>at,ebT:()=>bn,HrH:()=>bm,FgH:()=>bZ,aHn:()=>bO,htw:()=>bV,klJ:()=>bW,zxu:()=>b_,v8v:()=>bF,M1H:()=>a_,s3O:()=>ah,nak:()=>ai,d53:()=>bP,lJ8:()=>b5,mmj:()=>B,tdK:()=>H,I8F:()=>T,ik7:()=>U,jQD:()=>W,Eyz:()=>_,EtW:()=>Y,NEY:()=>aa,fIQ:()=>af,WBm:()=>bo,rDL:()=>bk,oMG:()=>a7,_JW:()=>aT,BHE:()=>ao,Tu0:()=>bC,RzM:()=>by,t2U:()=>bg,xud:()=>bi,i09:()=>a0,tBn:()=>aU,d4e:()=>bd,FWM:()=>bD,vPO:()=>bl,zJ5:()=>aQ,W5t:()=>aP,jxb:()=>aR,hTo:()=>aS,fSM:()=>aO,LB3:()=>aN,c5x:()=>aV,Fi5:()=>bu,EYT:()=>au,SC_:()=>bG,qk$:()=>b6,NE9:()=>bR,ntz:()=>bv,hEL:()=>ad,V3H:()=>bt,rMt:()=>ap,ECM:()=>bB,fnl:()=>a$,eBY:()=>a4,lYZ:()=>bX,qut:()=>br,tlM:()=>bU,INn:()=>b$,zKE:()=>bN,JTl:()=>E,lH9:()=>F,CI6:()=>S,Kd8:()=>Z,sax:()=>a9,Q6B:()=>an,blG:()=>bM,L_Q:()=>bK,$Qc:()=>a6,fsW:()=>b4});var d=c(29382),e=c(50505);let f={name:"c.name",industry:"c.industry",contacts:"contacts",openValue:"open_value",annualValue:"c.annual_value",score:"c.lead_score",health:"health_rank",lastActivity:"last_activity"},g=new Set(Object.keys(f));function h(a,b,c){let d=Math.min(100,Math.max(1,Math.floor(b)||25)),e=Math.max(1,Math.ceil(c/d)),f=Math.min(Math.max(1,Math.floor(a)||1),e);return{page:f,pageSize:d,offset:(f-1)*d,pageCount:e}}let i={name:"ct.name",role:"ct.role",company:"co.name",email:"ct.email",influence:"ct.influence"},j=new Set(Object.keys(i));var k=c(31100);let l={title:"d.title",company:"co.name",value:"d.value",stage:`FIELD(d.stage, ${e.w7.map(a=>`'${a}'`).join(", ")})`,expectedClose:"d.expected_close",created:"d.id"},m=new Set(Object.keys(l)),n={created:"a.created_at",type:"a.type",company:"co.name"},o=new Set(Object.keys(n));var p=c(85750);c(39887);let q=globalThis,r="1"===process.env.DB_SCHEMA_ALWAYS_VERIFY;function s(){return q.__cmsPool||(q.__cmsPool=d.createPool({host:process.env.DB_HOST||"localhost",port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER||"",password:process.env.DB_PASSWORD||"",database:process.env.DB_NAME||"",waitForConnections:!0,connectionLimit:Math.max(1,Number(process.env.DB_POOL_SIZE)||8),maxIdle:Math.max(1,Number(process.env.DB_POOL_SIZE)||8),idleTimeout:6e4,enableKeepAlive:!0,keepAliveInitialDelay:1e4,queueLimit:0,charset:"utf8mb4_general_ci"})),q.__cmsPool}async function t(){if(!process.env.DB_NAME)return!1;try{return await s().query("SELECT 1"),!0}catch{return!1}}async function u(a,b,c,d){let[e]=await a.query("SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",[b,c]);0===Number(e[0]?.n??0)&&await a.query(`ALTER TABLE \`${b}\` ADD COLUMN ${d}`)}async function v(a,b,c,d){let[e]=await a.query("SELECT COUNT(*) AS n FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?",[b,c]);0===Number(e[0]?.n??0)&&await a.query(`ALTER TABLE \`${b}\` ADD INDEX \`${c}\` (${d})`)}async function w(a,b){if(await a.query("CREATE TABLE IF NOT EXISTS crm_schema_meta (k VARCHAR(24) NOT NULL PRIMARY KEY, v VARCHAR(40) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),r)return!1;let[c]=await a.query("SELECT v FROM crm_schema_meta WHERE k = ? LIMIT 1",[b]);return c[0]?.v==="148"}async function x(a,b){await a.query("INSERT INTO crm_schema_meta (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)",[b,"148"])}function y(){return q.__crmSchema||(q.__crmSchema=(async()=>{let a=s();await w(a,"core")||(await a.query(`
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
      `),await u(a,"crm_companies","organization_id","organization_id INT UNSIGNED NOT NULL DEFAULT 0"),await u(a,"crm_contacts","organization_id","organization_id INT UNSIGNED NOT NULL DEFAULT 0"),await u(a,"crm_deals","organization_id","organization_id INT UNSIGNED NOT NULL DEFAULT 0"),await u(a,"crm_activities","organization_id","organization_id INT UNSIGNED NOT NULL DEFAULT 0"),await u(a,"crm_companies","lead_score","lead_score TINYINT UNSIGNED NOT NULL DEFAULT 0"),await u(a,"crm_contacts","mobile","mobile VARCHAR(40) NOT NULL DEFAULT ''"),await u(a,"crm_contacts","linkedin","linkedin VARCHAR(200) NOT NULL DEFAULT ''"),await u(a,"crm_contacts","notes","notes TEXT NULL"),await u(a,"crm_companies","legal_name","legal_name VARCHAR(190) NOT NULL DEFAULT ''"),await u(a,"crm_companies","phone","phone VARCHAR(60) NOT NULL DEFAULT ''"),await u(a,"crm_companies","email","email VARCHAR(190) NOT NULL DEFAULT ''"),await u(a,"crm_companies","country","country VARCHAR(120) NOT NULL DEFAULT ''"),await u(a,"crm_companies","address","address VARCHAR(300) NOT NULL DEFAULT ''"),await u(a,"crm_companies","vat_id","vat_id VARCHAR(40) NOT NULL DEFAULT ''"),await u(a,"crm_companies","description","description TEXT NULL"),await u(a,"crm_leads","priority","priority VARCHAR(12) NOT NULL DEFAULT 'normal'"),await u(a,"crm_leads","owner","owner VARCHAR(120) NOT NULL DEFAULT ''"),await u(a,"crm_leads","owner_user_id","owner_user_id INT UNSIGNED NULL"),await u(a,"crm_deals","owner_user_id","owner_user_id INT UNSIGNED NULL"),await u(a,"crm_deals","contact_id","contact_id INT UNSIGNED NULL"),await u(a,"crm_deals","notes","notes TEXT NULL"),await u(a,"crm_deals","closed_at","closed_at TIMESTAMP NULL"),await u(a,"crm_deals","loss_reason","loss_reason VARCHAR(40) NOT NULL DEFAULT ''"),await u(a,"crm_activities","deal_id","deal_id INT UNSIGNED NULL"),await u(a,"crm_quotes","public_token","public_token VARCHAR(64) NOT NULL DEFAULT ''"),await u(a,"crm_quotes","sent_at","sent_at TIMESTAMP NULL"),await u(a,"crm_quotes","decided_at","decided_at TIMESTAMP NULL"),await u(a,"crm_quotes","client_name","client_name VARCHAR(190) NOT NULL DEFAULT ''"),await v(a,"crm_deals","idx_deal_org_stage","organization_id, stage, closed_at"),await v(a,"crm_activities","idx_activity_org","organization_id, id"),await v(a,"crm_activities","idx_activity_deal","deal_id"),await v(a,"crm_activities","idx_activity_contact","contact_id"),await v(a,"crm_leads","idx_lead_created","organization_id, created_at"),await x(a,"core"))})().catch(a=>{throw q.__crmSchema=void 0,a})),q.__crmSchema}function z(a){return(0,e.DY)({hasWebsite:!!(a.website??"").trim(),employees:a.employees??null,industryMatch:!!a.industryMatch,annualValue:a.annualValue??0})}async function A(a,b){await y();let[c]=await s().query(`INSERT INTO crm_companies (organization_id, name, industry, city, website, employees, annual_value, status, account_manager, industry_match, lead_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[a,b.name.slice(0,190),(b.industry??"").slice(0,120),(b.city??"").slice(0,120),(b.website??"").slice(0,300),b.employees??null,b.annualValue??0,(b.status??"lead").slice(0,20),(b.accountManager??"").slice(0,120),+!!b.industryMatch,z(b)]);return c.insertId}async function B(a,b={}){await y();let c=["organization_id = ?"],d=[a];if(b.q){c.push("(name LIKE ? OR industry LIKE ? OR city LIKE ?)");let a=`%${b.q}%`;d.push(a,a,a)}b.status&&(c.push("status = ?"),d.push(b.status));let[e]=await s().query(`SELECT * FROM crm_companies WHERE ${c.join(" AND ")} ORDER BY updated_at DESC LIMIT 500`,d);return e}async function C(a,b){await y();let[c]=await s().query("SELECT * FROM crm_companies WHERE id = ? AND organization_id = ? LIMIT 1",[b,a]);return c[0]??null}async function D(a,b,c){await y();let d=b.trim();if(d.length<2)return[];let e=["name LIKE ?"],f=[a,`%${d}%`],g=c.trim().replace(/^https?:\/\//i,"").replace(/^www\./i,"").split("/")[0].toLowerCase();g.length>3&&(e.push("(website <> '' AND LOWER(website) LIKE ?)"),f.push(`%${g}%`));let[h]=await s().query(`SELECT * FROM crm_companies WHERE organization_id = ? AND (${e.join(" OR ")}) ORDER BY name ASC LIMIT 5`,f);return h}async function E(a,b,c){await y(),await s().query("UPDATE crm_companies SET name=?, industry=?, city=?, website=?, employees=?, annual_value=?, status=?, account_manager=?, industry_match=?, lead_score=? WHERE id=? AND organization_id=?",[c.name.slice(0,190),(c.industry??"").slice(0,120),(c.city??"").slice(0,120),(c.website??"").slice(0,300),c.employees??null,c.annualValue??0,(c.status??"lead").slice(0,20),(c.accountManager??"").slice(0,120),+!!c.industryMatch,z(c),b,a])}async function F(a,b,c){await y(),await s().query("UPDATE crm_companies SET legal_name=?, phone=?, email=?, country=?, address=?, vat_id=?, description=? WHERE id=? AND organization_id=?",[c.legalName.slice(0,190),c.phone.slice(0,60),c.email.slice(0,190),c.country.slice(0,120),c.address.slice(0,300),c.vatId.slice(0,40),(c.description??"").slice(0,2e3),b,a])}async function G(a,b){await y();let c=s();await c.query("DELETE FROM crm_activities WHERE company_id = ? AND organization_id = ?",[b,a]),await c.query("DELETE FROM crm_deals WHERE company_id = ? AND organization_id = ?",[b,a]),await c.query("DELETE FROM crm_contacts WHERE company_id = ? AND organization_id = ?",[b,a]),await c.query("DELETE FROM crm_companies WHERE id = ? AND organization_id = ?",[b,a])}async function H(a,b){await y();let c=["c.organization_id = ?"],d=[a];if(b.q){c.push("(c.name LIKE ? OR c.industry LIKE ? OR c.city LIKE ?)");let a=`%${b.q}%`;d.push(a,a,a)}b.status&&(c.push("c.status = ?"),d.push(b.status)),b.statuses&&b.statuses.length&&(c.push(`c.status IN (${b.statuses.map(()=>"?").join(", ")})`),d.push(...b.statuses));let e=`WHERE ${c.join(" AND ")}`,i=s(),[j]=await i.query(`SELECT COUNT(*) AS n FROM crm_companies c ${e}`,d),k=Number(j[0]?.n??0),{offset:l,pageSize:m,page:n,pageCount:o}=h(b.page,b.pageSize,k),p=function(a,b){let c=g.has(a)?f[a]:f.score;return`ORDER BY ${c} ${1===b?"ASC":"DESC"}, c.id DESC`}(b.sortKey,b.sortDir),[q]=await i.query(`SELECT c.*,
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
       LIMIT ? OFFSET ?`,[...d,m,l]);return{rows:q,total:k,page:n,pageCount:o}}async function I(a){await y();let b=s(),[c]=await b.query(`SELECT
       COALESCE(SUM(status = 'customer'), 0) AS customers,
       COALESCE(SUM(status = 'at_risk'), 0) AS at_risk,
       COALESCE(SUM(CASE WHEN status IN ('customer', 'at_risk') THEN annual_value ELSE 0 END), 0) AS arr
     FROM crm_companies WHERE organization_id = ?`,[a]),[d]=await b.query("SELECT COALESCE(SUM(value), 0) AS won FROM crm_deals WHERE organization_id = ? AND stage = 'won'",[a]);return{customers:Number(c[0]?.customers??0),atRisk:Number(c[0]?.at_risk??0),arr:Number(c[0]?.arr??0),won:Number(d[0]?.won??0)}}async function J(a,b){let c=b.filter(a=>Number.isInteger(a)).slice(0,500);if(!c.length)return;await y();let d=c.map(()=>"?").join(","),e=s();await e.query(`DELETE FROM crm_activities WHERE organization_id = ? AND company_id IN (${d})`,[a,...c]),await e.query(`DELETE FROM crm_deals WHERE organization_id = ? AND company_id IN (${d})`,[a,...c]),await e.query(`DELETE FROM crm_contacts WHERE organization_id = ? AND company_id IN (${d})`,[a,...c]),await e.query(`DELETE FROM crm_companies WHERE organization_id = ? AND id IN (${d})`,[a,...c])}async function K(a,b,c){let d=b.filter(a=>Number.isInteger(a)).slice(0,500);if(!d.length)return;await y();let e=d.map(()=>"?").join(",");await s().query(`UPDATE crm_companies SET status = ? WHERE organization_id = ? AND id IN (${e})`,[c.slice(0,20),a,...d])}function L(a){return a.filter(a=>Number.isInteger(a)).slice(0,500)}async function M(a,b,c){let d=L(b);d.length&&(await y(),await s().query(`DELETE FROM crm_leads WHERE organization_id = ? AND id IN (${d.map(()=>"?").join(",")})${c?.sql??""}`,[a,...d,...c?.params??[]]))}async function N(a,b,c,d){let e=L(b);e.length&&(await y(),await s().query(`UPDATE crm_leads SET status = ? WHERE organization_id = ? AND id IN (${e.map(()=>"?").join(",")})${d?.sql??""}`,[c.slice(0,20),a,...e,...d?.params??[]]))}async function O(a,b,c){let d=L(b);d.length&&(await y(),await s().query(`DELETE FROM crm_deals WHERE organization_id = ? AND id IN (${d.map(()=>"?").join(",")})${c?.sql??""}`,[a,...d,...c?.params??[]]))}async function P(a,b,c,d){let e=L(b);e.length&&(await y(),await s().query(`UPDATE crm_deals SET stage = ?, closed_at = NULL, loss_reason = '' WHERE organization_id = ? AND id IN (${e.map(()=>"?").join(",")})${d?.sql??""}`,[c.slice(0,20),a,...e,...d?.params??[]]))}async function Q(a,b,c){await y();let[d]=await s().query(`INSERT INTO crm_contacts (organization_id, company_id, name, role, email, phone, department, influence, mobile, linkedin, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[a,b,c.name.slice(0,190),(c.role??"").slice(0,120),(c.email??"").slice(0,190),(c.phone??"").slice(0,60),(c.department??"").slice(0,60),(c.influence??"none").slice(0,20),(c.mobile??"").slice(0,40),(c.linkedin??"").slice(0,200),(c.notes??"").slice(0,2e3)]);return d.insertId}async function R(a,b){await y();let[c]=await s().query(`SELECT ct.*, COALESCE(co.name, '') AS company_name
       FROM crm_contacts ct
       LEFT JOIN crm_companies co ON co.id = ct.company_id AND co.organization_id = ct.organization_id
      WHERE ct.id = ? AND ct.organization_id = ? LIMIT 1`,[b,a]);return c[0]??null}async function S(a,b,c){await y(),await s().query(`UPDATE crm_contacts SET name=?, role=?, email=?, phone=?, department=?, influence=?, mobile=?, linkedin=?, notes=?
       WHERE id=? AND organization_id=?`,[c.name.slice(0,190),(c.role??"").slice(0,120),(c.email??"").slice(0,190),(c.phone??"").slice(0,60),(c.department??"").slice(0,60),(c.influence??"none").slice(0,20),(c.mobile??"").slice(0,40),(c.linkedin??"").slice(0,200),(c.notes??"").slice(0,2e3),b,a])}async function T(a,b,c=50){await y();let[d]=await s().query("SELECT * FROM crm_activities WHERE contact_id = ? AND organization_id = ? ORDER BY id DESC LIMIT ?",[b,a,c]);return d}async function U(a,b){await y();let[c]=await s().query("SELECT * FROM crm_contacts WHERE company_id = ? AND organization_id = ? ORDER BY id ASC",[b,a]);return c}async function V(a,b){await y(),await s().query("DELETE FROM crm_contacts WHERE id = ? AND organization_id = ?",[b,a])}async function W(a,b){await y();let c=["ct.organization_id = ?"],d=[a];if(b.q){c.push("(ct.name LIKE ? OR ct.email LIKE ? OR ct.role LIKE ? OR co.name LIKE ?)");let a=`%${b.q}%`;d.push(a,a,a,a)}b.influence&&(c.push("ct.influence = ?"),d.push(b.influence));let e="FROM crm_contacts ct JOIN crm_companies co ON co.id = ct.company_id AND co.organization_id = ct.organization_id",f=`WHERE ${c.join(" AND ")}`,g=s(),[k]=await g.query(`SELECT COUNT(*) AS n ${e} ${f}`,d),l=Number(k[0]?.n??0),{offset:m,pageSize:n,page:o,pageCount:p}=h(b.page,b.pageSize,l),q=function(a,b){let c=j.has(a)?i[a]:i.name;return`ORDER BY ${c} ${1===b?"ASC":"DESC"}, ct.id DESC`}(b.sortKey,b.sortDir),[r]=await g.query(`SELECT ct.*, co.name AS company_name ${e} ${f} ${q} LIMIT ? OFFSET ?`,[...d,n,m]);return{rows:r,total:l,page:o,pageCount:p}}async function X(a,b,c){await y();let[d]=await s().query(`INSERT INTO crm_deals (organization_id, company_id, title, value, stage, probability, expected_close, owner, owner_user_id, contact_id, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[a,b,c.title.slice(0,190),c.value??0,(c.stage??"new").slice(0,20),c.probability??null,c.expectedClose||null,(c.owner??"").slice(0,120),c.ownerUserId??null,c.contactId??null,(c.notes??"").slice(0,2e3)]);return d.insertId}async function Y(a,b={}){await y();let c=b.ownerScope?.sql??"",d=b.ownerScope?.params??[];if(null!=b.companyId){let[e]=await s().query(`SELECT * FROM crm_deals WHERE organization_id = ? AND company_id = ?${c} ORDER BY updated_at DESC`,[a,b.companyId,...d]);return e}let[e]=await s().query(`SELECT * FROM crm_deals WHERE organization_id = ?${c} ORDER BY updated_at DESC LIMIT 1000`,[a,...d]);return e}async function Z(a,b,c){await y();let d=[],e=[];void 0!==c.title&&(d.push("title=?"),e.push(c.title.slice(0,190))),void 0!==c.value&&(d.push("value=?"),e.push(c.value)),void 0!==c.stage&&(d.push("stage=?"),e.push(c.stage.slice(0,20))),void 0!==c.probability&&(d.push("probability=?"),e.push(c.probability)),void 0!==c.expectedClose&&(d.push("expected_close=?"),e.push(c.expectedClose||null)),void 0!==c.owner&&(d.push("owner=?"),e.push(c.owner.slice(0,120))),void 0!==c.contactId&&(d.push("contact_id=?"),e.push(c.contactId??null)),void 0!==c.notes&&(d.push("notes=?"),e.push((c.notes??"").slice(0,2e3))),d.length&&(e.push(b,a),await s().query(`UPDATE crm_deals SET ${d.join(", ")} WHERE id = ? AND organization_id = ?`,e))}async function $(a,b){await y();let[c]=await s().query(`SELECT d.*, COALESCE(co.name, '') AS company_name, ct.name AS contact_name
       FROM crm_deals d
       LEFT JOIN crm_companies co ON co.id = d.company_id AND co.organization_id = d.organization_id
       LEFT JOIN crm_contacts ct ON ct.id = d.contact_id AND ct.organization_id = d.organization_id
      WHERE d.id = ? AND d.organization_id = ? LIMIT 1`,[b,a]);return c[0]??null}async function _(a,b,c=50){await y();let[d]=await s().query("SELECT * FROM crm_activities WHERE deal_id = ? AND organization_id = ? ORDER BY id DESC LIMIT ?",[b,a,c]);return d}async function aa(a,b,c){await y();let[d]=await s().query(`SELECT * FROM crm_deals WHERE contact_id = ? AND organization_id = ?${c?.sql??""} ORDER BY updated_at DESC LIMIT 50`,[b,a,...c?.params??[]]);return d}async function ab(a,b){await y();let c=await s().getConnection();try{await c.beginTransaction();let[d]=await c.query("SELECT company_id FROM crm_deals WHERE id = ? AND organization_id = ? FOR UPDATE",[b,a]),e=d[0];if(!e)return await c.rollback(),null;return await c.query("UPDATE crm_deals SET stage = 'won', probability = 100, closed_at = CURRENT_TIMESTAMP, loss_reason = '' WHERE id = ? AND organization_id = ?",[b,a]),await c.query("UPDATE crm_companies SET status = 'customer' WHERE id = ? AND organization_id = ? AND status <> 'customer'",[e.company_id,a]),await c.commit(),{companyId:e.company_id}}catch(a){throw await c.rollback(),a}finally{c.release()}}async function ac(a,b,c){await y();let[d]=await s().query("SELECT company_id FROM crm_deals WHERE id = ? AND organization_id = ? LIMIT 1",[b,a]),e=d[0];return e?(await s().query("UPDATE crm_deals SET stage = 'lost', probability = 0, closed_at = CURRENT_TIMESTAMP, loss_reason = ? WHERE id = ? AND organization_id = ?",[c.slice(0,40),b,a]),{companyId:e.company_id}):null}async function ad(a,b,c){await y();let[d]=await s().query("SELECT company_id FROM crm_deals WHERE id = ? AND organization_id = ? LIMIT 1",[b,a]),e=d[0];return e?(await s().query("UPDATE crm_deals SET stage = ?, closed_at = NULL, loss_reason = '' WHERE id = ? AND organization_id = ?",[c.slice(0,20),b,a]),{companyId:e.company_id}):null}async function ae(a,b){await y(),await s().query("DELETE FROM crm_deals WHERE id = ? AND organization_id = ?",[b,a])}async function af(a,b){await y();let c=["d.organization_id = ?"],d=[a];if(b.q){c.push("(d.title LIKE ? OR co.name LIKE ?)");let a=`%${b.q}%`;d.push(a,a)}b.stage&&(c.push("d.stage = ?"),d.push(b.stage));let e="FROM crm_deals d JOIN crm_companies co ON co.id = d.company_id AND co.organization_id = d.organization_id",f=`WHERE ${c.join(" AND ")}${b.ownerScope?.sql??""}`;b.ownerScope?.params.length&&d.push(...b.ownerScope.params);let g=s(),[i]=await g.query(`SELECT COUNT(*) AS n ${e} ${f}`,d),j=Number(i[0]?.n??0),{offset:k,pageSize:n,page:o,pageCount:p}=h(b.page,b.pageSize,j),q=function(a,b){let c=m.has(a)?l[a]:l.value;return`ORDER BY ${c} ${1===b?"ASC":"DESC"}, d.id DESC`}(b.sortKey,b.sortDir),[r]=await g.query(`SELECT d.*, co.name AS company_name ${e} ${f} ${q} LIMIT ? OFFSET ?`,[...d,n,k]);return{rows:r,total:j,page:o,pageCount:p}}async function ag(a,b){await y();let[c]=await s().query("INSERT INTO crm_activities (organization_id, company_id, contact_id, deal_id, type, summary) VALUES (?, ?, ?, ?, ?, ?)",[a,b.companyId,b.contactId??null,b.dealId??null,(b.type??"note").slice(0,20),b.summary.slice(0,500)]);return c.insertId}async function ah(a,b,c=50){await y();let[d]=await s().query("SELECT * FROM crm_activities WHERE company_id = ? AND organization_id = ? ORDER BY id DESC LIMIT ?",[b,a,c]);return d}async function ai(a,b){await y();let c=["a.organization_id = ?"],d=[a];if(b.q){c.push("(a.summary LIKE ? OR co.name LIKE ?)");let a=`%${b.q}%`;d.push(a,a)}b.type&&(c.push("a.type = ?"),d.push(b.type)),b.sinceDays&&b.sinceDays>0&&c.push(`a.created_at >= DATE_SUB(NOW(), INTERVAL ${Math.floor(b.sinceDays)} DAY)`);let e="FROM crm_activities a JOIN crm_companies co ON co.id = a.company_id AND co.organization_id = a.organization_id",f=`WHERE ${c.join(" AND ")}`,g=s(),[i]=await g.query(`SELECT COUNT(*) AS n ${e} ${f}`,d),j=Number(i[0]?.n??0),{offset:k,pageSize:l,page:m,pageCount:p}=h(b.page,b.pageSize,j),q=function(a,b){let c=o.has(a)?n[a]:n.created;return`ORDER BY ${c} ${1===b?"ASC":"DESC"}, a.id DESC`}(b.sortKey,b.sortDir),[r]=await g.query(`SELECT a.*, co.name AS company_name ${e} ${f} ${q} LIMIT ? OFFSET ?`,[...d,l,k]);return{rows:r,total:j,page:m,pageCount:p}}async function aj(a,b){await y(),await s().query("DELETE FROM crm_activities WHERE id = ? AND organization_id = ?",[b,a])}function ak(a){return(0,e.DY)({hasWebsite:!!(a.website??"").trim(),employees:a.employees??null,industryMatch:!!a.industryMatch,annualValue:a.annualValue??0})}async function al(a,b){await y();let[c]=await s().query(`INSERT INTO crm_leads (organization_id, name, company, title, email, phone, source, status, industry, website, employees, annual_value, industry_match, lead_score, notes, priority, owner, owner_user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[a,b.name.slice(0,190),(b.company??"").slice(0,190),(b.title??"").slice(0,120),(b.email??"").slice(0,190),(b.phone??"").slice(0,60),(b.source??"other").slice(0,30),(b.status??"new").slice(0,20),(b.industry??"").slice(0,120),(b.website??"").slice(0,300),b.employees??null,b.annualValue??0,+!!b.industryMatch,ak(b),(b.notes??"").slice(0,500),(b.priority??"normal").slice(0,12),(b.owner??"").slice(0,120),b.ownerUserId??null]);return c.insertId}async function am(a,b){await y();let[c]=await s().query("SELECT * FROM crm_leads WHERE id = ? AND organization_id = ? LIMIT 1",[b,a]);return c[0]??null}async function an(a,b,c){await y(),await s().query(`UPDATE crm_leads SET name=?, company=?, title=?, email=?, phone=?, source=?, industry=?, website=?, employees=?, annual_value=?, industry_match=?, lead_score=?, notes=?, priority=?, owner=?
       WHERE id=? AND organization_id=?`,[c.name.slice(0,190),(c.company??"").slice(0,190),(c.title??"").slice(0,120),(c.email??"").slice(0,190),(c.phone??"").slice(0,60),(c.source??"other").slice(0,30),(c.industry??"").slice(0,120),(c.website??"").slice(0,300),c.employees??null,c.annualValue??0,+!!c.industryMatch,ak(c),(c.notes??"").slice(0,500),(c.priority??"normal").slice(0,12),(c.owner??"").slice(0,120),b,a])}async function ao(a,b){await y();let c=["l.organization_id = ?"],d=[a];if(b.q){c.push("(l.name LIKE ? OR l.company LIKE ? OR l.email LIKE ?)");let a=`%${b.q}%`;d.push(a,a,a)}b.status&&(c.push("l.status = ?"),d.push(b.status)),b.source&&(c.push("l.source = ?"),d.push(b.source));let e=`WHERE ${c.join(" AND ")}${b.ownerScope?.sql??""}`;b.ownerScope?.params.length&&d.push(...b.ownerScope.params);let f=s(),[g]=await f.query(`SELECT COUNT(*) AS n FROM crm_leads l ${e}`,d),i=Number(g[0]?.n??0),{offset:j,pageSize:l,page:m,pageCount:n}=h(b.page,b.pageSize,i),o=(0,k.Oj)(b.sortKey,b.sortDir),[p]=await f.query(`SELECT l.* FROM crm_leads l ${e} ${o} LIMIT ? OFFSET ?`,[...d,l,j]);return{rows:p,total:i,page:m,pageCount:n}}async function ap(a,b,c){await y(),await s().query("UPDATE crm_leads SET status = ? WHERE id = ? AND organization_id = ?",[c.slice(0,20),b,a])}async function aq(a,b){await y(),await s().query("DELETE FROM crm_leads WHERE id = ? AND organization_id = ?",[b,a])}async function ar(a,b,c={}){await y();let d=await s().getConnection();try{await d.beginTransaction();let[e]=await d.query("SELECT * FROM crm_leads WHERE id = ? AND organization_id = ? FOR UPDATE",[b,a]),f=e[0];if(!f)return await d.rollback(),null;if(f.converted_company_id)return await d.commit(),{companyId:f.converted_company_id,dealId:null,createdCompany:!1};let g=0;if(c.companyId){let[b]=await d.query("SELECT id FROM crm_companies WHERE id = ? AND organization_id = ? LIMIT 1",[c.companyId,a]);b[0]&&(g=Number(b[0].id))}let h=0===g;if(h){let b=ak({website:f.website,employees:f.employees,industryMatch:!!f.industry_match,annualValue:f.annual_value}),[c]=await d.query(`INSERT INTO crm_companies (organization_id, name, industry, city, website, employees, annual_value, status, account_manager, industry_match, lead_score)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'active', '', ?, ?)`,[a,(f.company||f.name).slice(0,190),f.industry.slice(0,120),"",f.website.slice(0,300),f.employees,f.annual_value,f.industry_match,b]);g=c.insertId}if(f.name.trim()){let b=!1;if(f.email.trim()){let[c]=await d.query("SELECT id FROM crm_contacts WHERE company_id = ? AND organization_id = ? AND email = ? LIMIT 1",[g,a,f.email]);b=!!c[0]}b||await d.query(`INSERT INTO crm_contacts (organization_id, company_id, name, role, email, phone, department, influence)
             VALUES (?, ?, ?, ?, ?, ?, '', 'none')`,[a,g,f.name.slice(0,190),f.title.slice(0,120),f.email.slice(0,190),f.phone.slice(0,60)])}let i=null;if(c.deal&&c.deal.title.trim()){let[b]=await d.query("INSERT INTO crm_deals (organization_id, company_id, title, value, stage, probability, expected_close, owner) VALUES (?, ?, ?, ?, ?, NULL, NULL, '')",[a,g,c.deal.title.slice(0,190),c.deal.value??0,(c.deal.stage??"new").slice(0,20)]);i=b.insertId}return await d.query("UPDATE crm_leads SET status = 'converted', converted_company_id = ? WHERE id = ? AND organization_id = ?",[g,b,a]),await d.commit(),{companyId:g,dealId:i,createdCompany:h}}catch(a){throw await d.rollback(),a}finally{d.release()}}async function as(a,b){await y();let[c]=await s().query("INSERT INTO crm_tasks (organization_id, company_id, title, notes, due_date, priority) VALUES (?, ?, ?, ?, ?, ?)",[a,b.companyId??null,b.title.slice(0,300),(b.notes??"").slice(0,500),b.dueDate||null,(b.priority??"normal").slice(0,10)]);return c.insertId}async function at(a){let b=(a||"").trim();if(b.length<8)return null;await y();let c=s(),[d]=await c.query("SELECT q.*, co.name AS company_name FROM crm_quotes q JOIN crm_companies co ON co.id = q.company_id AND co.organization_id = q.organization_id WHERE q.public_token = ? LIMIT 1",[b.slice(0,64)]),e=d[0];if(!e)return null;let[f]=await c.query("SELECT * FROM crm_quote_items WHERE quote_id = ? AND organization_id = ? ORDER BY id ASC",[e.id,e.organization_id]);return{quote:e,items:f}}async function au(a,b,c){let d=(a||"").trim();if(d.length<8)return null;await y();let e=s(),[f]=await e.query("SELECT * FROM crm_quotes WHERE public_token = ? LIMIT 1",[d.slice(0,64)]),g=f[0];if(!g)return null;let h="accepted"===g.status||"declined"===g.status,i=new Date().toISOString().slice(0,10),j=g.valid_until?new Date(g.valid_until).toISOString().slice(0,10):null,k=!h&&(0,p.GE)(j,i);return h||k||await e.query("UPDATE crm_quotes SET status = ?, decided_at = CURRENT_TIMESTAMP, client_name = ? WHERE id = ? AND organization_id = ?",[b,c.slice(0,190),g.id,g.organization_id]),{organizationId:g.organization_id,quoteId:g.id,companyId:g.company_id,status:h||k?g.status:b,alreadyDecided:h,expired:k}}async function av(a){let b=(a||"").trim();if(b.length<8)return null;await aX(),await y();let c=s(),[d]=await c.query("SELECT i.*, co.name AS company_name FROM crm_invoices i JOIN crm_companies co ON co.id = i.company_id AND co.organization_id = i.organization_id WHERE i.public_token = ? LIMIT 1",[b.slice(0,64)]),e=d[0];if(!e)return null;let[f]=await c.query("SELECT * FROM crm_invoice_items WHERE invoice_id = ? AND organization_id = ? ORDER BY id ASC",[e.id,e.organization_id]);return{invoice:e,items:f}}async function aw(a,b){await y();let[c]=await s().query(a,[b]);return c.map(a=>({status:String(a.k),n:Number(a.n),value:Number(a.v??0)}))}let ax=a=>aw("SELECT status AS k, COUNT(*) AS n, COALESCE(SUM(annual_value),0) AS v FROM crm_companies WHERE organization_id = ? GROUP BY status",a),ay=a=>aw("SELECT stage AS k, COUNT(*) AS n, COALESCE(SUM(value),0) AS v FROM crm_deals WHERE organization_id = ? GROUP BY stage",a),az=a=>aw("SELECT status AS k, COUNT(*) AS n FROM crm_leads WHERE organization_id = ? GROUP BY status",a),aA=a=>aw("SELECT source AS k, COUNT(*) AS n FROM crm_leads WHERE organization_id = ? GROUP BY source",a),aB=a=>aw("SELECT type AS k, COUNT(*) AS n FROM crm_activities WHERE organization_id = ? GROUP BY type",a),aC=a=>aw("SELECT status AS k, COUNT(*) AS n, COALESCE(SUM(total_cents),0) AS v FROM crm_quotes WHERE organization_id = ? GROUP BY status",a);async function aD(a){await y();let[b]=await s().query(`SELECT COALESCE(NULLIF(owner, ''), 'Unassigned') AS owner,
       COALESCE(SUM(CASE WHEN stage = 'won' THEN value ELSE 0 END), 0) AS won,
       COALESCE(SUM(CASE WHEN stage NOT IN ('won','lost') THEN value ELSE 0 END), 0) AS open,
       COALESCE(SUM(CASE WHEN stage = 'won' THEN 1 ELSE 0 END), 0) AS won_n,
       COALESCE(SUM(CASE WHEN stage = 'lost' THEN 1 ELSE 0 END), 0) AS lost_n,
       COUNT(*) AS n
     FROM crm_deals WHERE organization_id = ? GROUP BY owner ORDER BY won DESC, open DESC LIMIT 20`,[a]);return b.map(a=>({owner:String(a.owner),won:Number(a.won),open:Number(a.open),n:Number(a.n),wonCount:Number(a.won_n),lostCount:Number(a.lost_n)}))}async function aE(a){await y();let[b]=await s().query(`SELECT DATE_FORMAT(expected_close, '%Y-%m') AS month, stage, COALESCE(SUM(value),0) AS value
     FROM crm_deals
     WHERE organization_id = ? AND stage NOT IN ('won','lost') AND expected_close IS NOT NULL
     GROUP BY month, stage ORDER BY month ASC`,[a]);return b.map(a=>({month:String(a.month),stage:String(a.stage),value:Number(a.value)}))}async function aF(a){await y();let[b]=await s().query("SELECT COUNT(*) AS n FROM crm_activities WHERE organization_id = ? AND created_at >= NOW() - INTERVAL 30 DAY",[a]);return Number(b[0]?.n??0)}let aG="DATE_SUB(DATE_FORMAT(NOW(),'%Y-%m-01'), INTERVAL 11 MONTH)";async function aH(a,b){await y();let[c]=await s().query(a,[b]);return c.map(a=>({month:String(a.month),n:Number(a.n),v:Number(a.v??0)}))}let aI=a=>aH(`SELECT DATE_FORMAT(closed_at,'%Y-%m') AS month, COUNT(*) AS n, COALESCE(SUM(value),0) AS v
     FROM crm_deals WHERE organization_id = ? AND stage = 'won' AND closed_at IS NOT NULL AND closed_at >= ${aG}
     GROUP BY month ORDER BY month ASC`,a),aJ=a=>aH(`SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, COUNT(*) AS n
     FROM crm_activities WHERE organization_id = ? AND created_at >= ${aG}
     GROUP BY month ORDER BY month ASC`,a),aK=a=>aH(`SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, COUNT(*) AS n
     FROM crm_leads WHERE organization_id = ? AND created_at >= ${aG}
     GROUP BY month ORDER BY month ASC`,a),aL=a=>aH(`SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, COUNT(*) AS n, COALESCE(SUM(value),0) AS v
     FROM crm_deals WHERE organization_id = ? AND created_at >= ${aG}
     GROUP BY month ORDER BY month ASC`,a);async function aM(a,b){await y();let[c]=await s().query(`SELECT d.id, d.title, d.value, d.stage, co.name AS company_name
     FROM crm_deals d JOIN crm_companies co ON co.id = d.company_id AND co.organization_id = d.organization_id
     WHERE d.organization_id = ? AND d.stage NOT IN ('won','lost')
     ORDER BY d.value DESC LIMIT ?`,[a,Number(b)||8]);return c.map(a=>({id:Number(a.id),title:String(a.title),companyName:String(a.company_name),value:Number(a.value),stage:String(a.stage)}))}async function aN(a,b,c){await y();let d=Number(b)||30,[e]=await s().query(`SELECT c.id, c.name,
       DATEDIFF(NOW(), (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.company_id = c.id)) AS last_days
     FROM crm_companies c
     WHERE c.organization_id = ? AND c.status IN ('customer','at_risk')
       AND ((SELECT MAX(a.created_at) FROM crm_activities a WHERE a.company_id = c.id) IS NULL
            OR (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.company_id = c.id) < NOW() - INTERVAL ${d} DAY)
     ORDER BY last_days IS NULL DESC, last_days DESC LIMIT ?`,[a,Number(c)||5]);return e.map(a=>({id:Number(a.id),name:String(a.name),lastDays:null==a.last_days?null:Number(a.last_days)}))}async function aO(a,b){await y();let[c]=await s().query(`SELECT d.id, d.company_id, d.title, co.name AS company_name, DATEDIFF(NOW(), d.expected_close) AS days
     FROM crm_deals d JOIN crm_companies co ON co.id = d.company_id AND co.organization_id = d.organization_id
     WHERE d.organization_id = ? AND d.stage NOT IN ('won','lost') AND d.expected_close IS NOT NULL AND d.expected_close < CURDATE()
     ORDER BY d.expected_close ASC LIMIT ?`,[a,Number(b)||5]);return c.map(a=>({id:Number(a.id),companyId:Number(a.company_id),companyName:String(a.company_name),title:String(a.title),days:Number(a.days)}))}async function aP(a,b,c){await y();let d=Number(b)||60,[e]=await s().query(`SELECT id, name, company, lead_score FROM crm_leads
     WHERE organization_id = ? AND status IN ('new','working') AND lead_score >= ${d}
     ORDER BY lead_score DESC LIMIT ?`,[a,Number(c)||5]);return e.map(a=>({id:Number(a.id),name:String(a.name),company:String(a.company),score:Number(a.lead_score)}))}async function aQ(a,b,c){await y();let d=Number(b)||7,[e]=await s().query(`SELECT q.id, co.name AS company_name, DATEDIFF(NOW(), q.created_at) AS days
     FROM crm_quotes q JOIN crm_companies co ON co.id = q.company_id AND co.organization_id = q.organization_id
     WHERE q.organization_id = ? AND q.status = 'sent' AND q.created_at < NOW() - INTERVAL ${d} DAY
     ORDER BY q.created_at ASC LIMIT ?`,[a,Number(c)||5]);return e.map(a=>({id:Number(a.id),companyName:String(a.company_name),days:Number(a.days)}))}async function aR(a,b,c){await y();let d=Number(b)||14,[e]=await s().query(`SELECT d.id, d.company_id, d.title, co.name AS company_name,
            DATEDIFF(NOW(), (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.deal_id = d.id)) AS idle_days
     FROM crm_deals d JOIN crm_companies co ON co.id = d.company_id AND co.organization_id = d.organization_id
     WHERE d.organization_id = ? AND d.stage NOT IN ('won','lost') AND d.created_at < NOW() - INTERVAL ${d} DAY
       AND ((SELECT MAX(a.created_at) FROM crm_activities a WHERE a.deal_id = d.id) IS NULL
            OR (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.deal_id = d.id) < NOW() - INTERVAL ${d} DAY)
     ORDER BY idle_days IS NULL DESC, idle_days DESC LIMIT ?`,[a,Number(c)||5]);return e.map(a=>({id:Number(a.id),companyId:Number(a.company_id),companyName:String(a.company_name),title:String(a.title),idleDays:null==a.idle_days?null:Number(a.idle_days)}))}async function aS(a,b,c){await y();let d=Number(b)||7,[e]=await s().query(`SELECT co.id, co.name, DATEDIFF(NOW(), MAX(d.closed_at)) AS days
     FROM crm_companies co JOIN crm_deals d ON d.company_id = co.id AND d.organization_id = co.organization_id
     WHERE co.organization_id = ? AND d.stage = 'won' AND d.closed_at IS NOT NULL AND d.closed_at >= NOW() - INTERVAL ${d} DAY
     GROUP BY co.id, co.name
     ORDER BY MAX(d.closed_at) DESC LIMIT ?`,[a,Number(c)||5]);return e.map(a=>({id:Number(a.id),name:String(a.name),days:Number(a.days)}))}async function aT(a){await y();let[b]=await s().query("SELECT * FROM crm_automations WHERE organization_id = ? AND enabled = 1 ORDER BY id ASC",[a]);return b}async function aU(a,b,c,d){await y();let e=s();await e.query("INSERT INTO crm_automation_runs (organization_id, automation_id, created_count, summary) VALUES (?, ?, ?, ?)",[a,b,c,d.slice(0,255)]),await e.query("UPDATE crm_automations SET last_run_at = CURRENT_TIMESTAMP, created_count = created_count + ? WHERE id = ? AND organization_id = ?",[c,b,a])}async function aV(a,b){await y();let[c]=await s().query("SELECT 1 FROM crm_tasks WHERE organization_id = ? AND title = ? AND done = 0 LIMIT 1",[a,b]);return c.length>0}async function aW(){await y();let[a]=await s().query("SELECT DISTINCT organization_id FROM crm_automations WHERE enabled = 1 ORDER BY organization_id");return a.map(a=>Number(a.organization_id))}function aX(){return q.__crmAuthSchema||(q.__crmAuthSchema=(async()=>{let a=s();await w(a,"auth")||(await a.query(`
        CREATE TABLE IF NOT EXISTS crm_organizations (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(190) NOT NULL DEFAULT '',
          slug VARCHAR(120) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_org_slug (slug)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await u(a,"crm_organizations","plan","plan VARCHAR(24) NOT NULL DEFAULT 'pro'"),await u(a,"crm_organizations","billing_email","billing_email VARCHAR(190) NOT NULL DEFAULT ''"),await u(a,"crm_organizations","billing_name","billing_name VARCHAR(190) NOT NULL DEFAULT ''"),await u(a,"crm_organizations","billing_address","billing_address VARCHAR(500) NOT NULL DEFAULT ''"),await u(a,"crm_organizations","tax_id","tax_id VARCHAR(40) NOT NULL DEFAULT ''"),await u(a,"crm_organizations","api_frozen","api_frozen TINYINT NOT NULL DEFAULT 0"),await u(a,"crm_organizations","ai_paused","ai_paused TINYINT NOT NULL DEFAULT 0"),await u(a,"crm_organizations","automations_paused","automations_paused TINYINT NOT NULL DEFAULT 0"),await u(a,"crm_organizations","restrict_member_visibility","restrict_member_visibility TINYINT NOT NULL DEFAULT 0"),await u(a,"crm_organizations","require_admin_mfa","require_admin_mfa TINYINT NOT NULL DEFAULT 0"),await u(a,"crm_meetings","reminded","reminded TINYINT(1) NOT NULL DEFAULT 0"),await a.query(`
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
      `),await u(a,"crm_users","totp_secret","totp_secret VARCHAR(255) NOT NULL DEFAULT ''"),await u(a,"crm_users","totp_enabled","totp_enabled TINYINT NOT NULL DEFAULT 0"),await a.query(`
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
      `),await u(a,"crm_sessions","ip","ip VARCHAR(45) NOT NULL DEFAULT ''"),await u(a,"crm_sessions","user_agent","user_agent VARCHAR(255) NOT NULL DEFAULT ''"),await u(a,"crm_sessions","last_used_at","last_used_at TIMESTAMP NULL"),await a.query(`
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
      `),await u(a,"crm_audit_logs","ip","ip VARCHAR(45) NOT NULL DEFAULT ''"),await u(a,"crm_audit_logs","user_agent","user_agent VARCHAR(255) NOT NULL DEFAULT ''"),await a.query(`
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
      `),await u(a,"crm_api_keys","expires_at","expires_at TIMESTAMP NULL"),await u(a,"crm_api_keys","scopes","scopes VARCHAR(255) NOT NULL DEFAULT 'companies,contacts,deals'"),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_security_alerts (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          type VARCHAR(40) NOT NULL DEFAULT '',
          severity VARCHAR(10) NOT NULL DEFAULT 'medium',
          message VARCHAR(300) NOT NULL DEFAULT '',
          actor_email VARCHAR(190) NOT NULL DEFAULT '',
          meta VARCHAR(500) NOT NULL DEFAULT '',
          acknowledged_at TIMESTAMP NULL,
          acknowledged_by VARCHAR(190) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_alert_org (organization_id, acknowledged_at, id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await u(a,"crm_organizations","security_webhook_url","security_webhook_url VARCHAR(500) NOT NULL DEFAULT ''"),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_email_settings (
          organization_id INT UNSIGNED NOT NULL PRIMARY KEY,
          host VARCHAR(190) NOT NULL DEFAULT '',
          port INT UNSIGNED NOT NULL DEFAULT 587,
          secure TINYINT NOT NULL DEFAULT 0,
          username VARCHAR(190) NOT NULL DEFAULT '',
          password_enc VARCHAR(1024) NOT NULL DEFAULT '',
          from_name VARCHAR(120) NOT NULL DEFAULT '',
          from_email VARCHAR(190) NOT NULL DEFAULT '',
          enabled TINYINT NOT NULL DEFAULT 0,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await u(a,"crm_email_settings","imap_host","imap_host VARCHAR(190) NOT NULL DEFAULT ''"),await u(a,"crm_email_settings","imap_port","imap_port INT UNSIGNED NOT NULL DEFAULT 993"),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_email_sync (
          organization_id INT UNSIGNED NOT NULL PRIMARY KEY,
          last_uid BIGINT UNSIGNED NOT NULL DEFAULT 0,
          uid_validity BIGINT UNSIGNED NOT NULL DEFAULT 0,
          last_synced_at TIMESTAMP NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_heartbeat (
          id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
          last_cron_at TIMESTAMP NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_notifications (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          user_email VARCHAR(190) NULL,
          type VARCHAR(40) NOT NULL DEFAULT '',
          title VARCHAR(300) NOT NULL DEFAULT '',
          href VARCHAR(300) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_notif_org (organization_id, id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await u(a,"crm_users","notifications_seen_at","notifications_seen_at TIMESTAMP NULL"),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_meetings (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          title VARCHAR(200) NOT NULL DEFAULT '',
          starts_at TIMESTAMP NOT NULL,
          duration_min INT UNSIGNED NOT NULL DEFAULT 30,
          company_id INT UNSIGNED NULL,
          contact_id INT UNSIGNED NULL,
          deal_id INT UNSIGNED NULL,
          location VARCHAR(200) NOT NULL DEFAULT '',
          notes TEXT NULL,
          created_by VARCHAR(190) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_meeting_org (organization_id, starts_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_capture_forms (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          token VARCHAR(64) NOT NULL,
          name VARCHAR(120) NOT NULL DEFAULT '',
          title VARCHAR(200) NOT NULL DEFAULT '',
          description VARCHAR(500) NOT NULL DEFAULT '',
          success_message VARCHAR(500) NOT NULL DEFAULT '',
          redirect_url VARCHAR(500) NOT NULL DEFAULT '',
          require_company TINYINT(1) NOT NULL DEFAULT 0,
          notify TINYINT(1) NOT NULL DEFAULT 1,
          active TINYINT(1) NOT NULL DEFAULT 1,
          submissions INT UNSIGNED NOT NULL DEFAULT 0,
          created_by VARCHAR(190) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_capture_token (token),
          INDEX idx_capture_org (organization_id, id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_goals (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          owner_user_id INT UNSIGNED NOT NULL DEFAULT 0,
          metric VARCHAR(20) NOT NULL DEFAULT 'revenue',
          period_month VARCHAR(7) NOT NULL DEFAULT '',
          target_amount BIGINT UNSIGNED NOT NULL DEFAULT 0,
          created_by VARCHAR(190) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_goal (organization_id, owner_user_id, metric, period_month),
          INDEX idx_goal_period (organization_id, period_month)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_commission_rates (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          owner_user_id INT UNSIGNED NOT NULL DEFAULT 0,
          rate_bp INT UNSIGNED NOT NULL DEFAULT 0,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_comm_rate (organization_id, owner_user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_commission_payouts (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          owner_user_id INT UNSIGNED NOT NULL,
          period_month VARCHAR(7) NOT NULL DEFAULT '',
          amount_cents BIGINT UNSIGNED NOT NULL DEFAULT 0,
          paid_by VARCHAR(190) NOT NULL DEFAULT '',
          note VARCHAR(300) NOT NULL DEFAULT '',
          paid_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_comm_payout (organization_id, owner_user_id, period_month),
          INDEX idx_comm_payout_period (organization_id, period_month)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_invoices (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          company_id INT UNSIGNED NOT NULL,
          quote_id INT UNSIGNED NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'draft',
          issue_date DATE NULL,
          due_date DATE NULL,
          total_cents INT UNSIGNED NOT NULL DEFAULT 0,
          notes VARCHAR(500) NOT NULL DEFAULT '',
          public_token VARCHAR(64) NOT NULL DEFAULT '',
          paid_at TIMESTAMP NULL,
          paid_amount_cents INT UNSIGNED NOT NULL DEFAULT 0,
          payment_method VARCHAR(40) NOT NULL DEFAULT '',
          created_by VARCHAR(190) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_invoice_org (organization_id, status),
          INDEX idx_invoice_company (company_id),
          INDEX idx_invoice_token (public_token)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_invoice_items (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          invoice_id INT UNSIGNED NOT NULL,
          name VARCHAR(190) NOT NULL DEFAULT '',
          unit_price_cents INT UNSIGNED NOT NULL DEFAULT 0,
          quantity INT UNSIGNED NOT NULL DEFAULT 1,
          line_total_cents INT UNSIGNED NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_invitem_invoice (invoice_id, id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_email_templates (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          name VARCHAR(120) NOT NULL DEFAULT '',
          subject VARCHAR(300) NOT NULL DEFAULT '',
          body TEXT NULL,
          created_by VARCHAR(190) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_tmpl_org (organization_id, name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_email_sends (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          token CHAR(48) NOT NULL,
          contact_id INT UNSIGNED NULL,
          company_id INT UNSIGNED NULL,
          deal_id INT UNSIGNED NULL,
          to_email VARCHAR(190) NOT NULL DEFAULT '',
          subject VARCHAR(300) NOT NULL DEFAULT '',
          sent_by VARCHAR(190) NOT NULL DEFAULT '',
          sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          opened_at TIMESTAMP NULL,
          open_count INT UNSIGNED NOT NULL DEFAULT 0,
          UNIQUE KEY uq_send_token (token),
          INDEX idx_send_org (organization_id, id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_scheduled_emails (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          scheduled_by VARCHAR(190) NOT NULL DEFAULT '',
          to_email VARCHAR(190) NOT NULL DEFAULT '',
          subject VARCHAR(300) NOT NULL DEFAULT '',
          body TEXT NULL,
          contact_id INT UNSIGNED NULL,
          company_id INT UNSIGNED NULL,
          deal_id INT UNSIGNED NULL,
          track TINYINT NOT NULL DEFAULT 1,
          send_at TIMESTAMP NOT NULL,
          status VARCHAR(12) NOT NULL DEFAULT 'pending',
          error VARCHAR(300) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          sent_at TIMESTAMP NULL,
          INDEX idx_sched_due (status, send_at),
          INDEX idx_sched_org (organization_id, status, send_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_sequences (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          name VARCHAR(120) NOT NULL DEFAULT '',
          stop_on_open TINYINT NOT NULL DEFAULT 0,
          created_by VARCHAR(190) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_seq_org (organization_id, name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_sequence_steps (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          sequence_id INT UNSIGNED NOT NULL,
          step_order INT UNSIGNED NOT NULL DEFAULT 0,
          delay_days INT UNSIGNED NOT NULL DEFAULT 0,
          subject VARCHAR(300) NOT NULL DEFAULT '',
          body TEXT NULL,
          INDEX idx_step_seq (sequence_id, step_order)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await a.query(`
        CREATE TABLE IF NOT EXISTS crm_sequence_enrollments (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          organization_id INT UNSIGNED NOT NULL,
          sequence_id INT UNSIGNED NOT NULL,
          contact_id INT UNSIGNED NULL,
          company_id INT UNSIGNED NULL,
          to_email VARCHAR(190) NOT NULL DEFAULT '',
          recipient_name VARCHAR(190) NOT NULL DEFAULT '',
          company_name VARCHAR(190) NOT NULL DEFAULT '',
          enrolled_by VARCHAR(190) NOT NULL DEFAULT '',
          current_step INT UNSIGNED NOT NULL DEFAULT 0,
          next_send_at TIMESTAMP NOT NULL,
          status VARCHAR(12) NOT NULL DEFAULT 'active',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_enr_due (status, next_send_at),
          INDEX idx_enr_org (organization_id, sequence_id),
          INDEX idx_enr_contact (organization_id, contact_id, status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await u(a,"crm_email_sends","enrollment_id","enrollment_id BIGINT UNSIGNED NULL"),await x(a,"auth"))})().catch(a=>{throw q.__crmAuthSchema=void 0,a})),q.__crmAuthSchema}let aY={api:"api_frozen",ai:"ai_paused",automations:"automations_paused",restrict_members:"restrict_member_visibility",require_admin_mfa:"require_admin_mfa"};async function aZ(a){await aX();let[b]=await s().query("SELECT api_frozen, ai_paused, automations_paused, restrict_member_visibility, require_admin_mfa FROM crm_organizations WHERE id = ? LIMIT 1",[a]),c=b[0];return{apiFrozen:!!c?.api_frozen,aiPaused:!!c?.ai_paused,automationsPaused:!!c?.automations_paused,restrictMembers:!!c?.restrict_member_visibility,requireAdminMfa:!!c?.require_admin_mfa}}async function a$(a,b,c){let d=aY[b];return!!d&&(await aX(),await s().query(`UPDATE crm_organizations SET ${d} = ? WHERE id = ?`,[+!!c,a]),!0)}async function a_(a,b){await aX();let[c]=await s().query(`INSERT INTO crm_security_alerts (organization_id, type, severity, message, actor_email, meta)
       VALUES (?, ?, ?, ?, ?, ?)`,[a,b.type.slice(0,40),b.severity.slice(0,10),b3(b.message).slice(0,300),b3(b.actorEmail??"").slice(0,190),b3(b.meta??"").slice(0,500)]);return c.insertId}async function a0(a,b={}){await aX();let c=b.onlyActive?"AND acknowledged_at IS NULL":"",d=Math.min(Math.max(b.limit??50,1),200),[e]=await s().query(`SELECT * FROM crm_security_alerts WHERE organization_id = ? ${c} ORDER BY id DESC LIMIT ?`,[a,d]);return e}async function a1(a,b,c){await aX(),await s().query("UPDATE crm_security_alerts SET acknowledged_at = CURRENT_TIMESTAMP, acknowledged_by = ? WHERE organization_id = ? AND id = ? AND acknowledged_at IS NULL",[c.slice(0,190),a,b])}async function a2(a,b){await aX();let[c]=await s().query("UPDATE crm_security_alerts SET acknowledged_at = CURRENT_TIMESTAMP, acknowledged_by = ? WHERE organization_id = ? AND acknowledged_at IS NULL",[b.slice(0,190),a]);return c.affectedRows??0}async function a3(a){await aX();let[b]=await s().query("SELECT security_webhook_url FROM crm_organizations WHERE id = ? LIMIT 1",[a]);return String(b[0]?.security_webhook_url??"")}async function a4(a,b){await aX(),await s().query("UPDATE crm_organizations SET security_webhook_url = ? WHERE id = ?",[b.slice(0,500),a])}async function a5(a){await aX();let[b]=await s().query("SELECT * FROM crm_email_settings WHERE organization_id = ? LIMIT 1",[a]);return b[0]??null}async function a6(a,b){await aX();let c=null===b.passwordEnc?"":", password_enc = VALUES(password_enc)";await s().query(`INSERT INTO crm_email_settings (organization_id, host, port, secure, username, password_enc, from_name, from_email, enabled, imap_host, imap_port)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE host = VALUES(host), port = VALUES(port), secure = VALUES(secure),
       username = VALUES(username)${c}, from_name = VALUES(from_name), from_email = VALUES(from_email), enabled = VALUES(enabled),
       imap_host = VALUES(imap_host), imap_port = VALUES(imap_port)`,[a,b.host.slice(0,190),b.port,+!!b.secure,b.username.slice(0,190),(b.passwordEnc??"").slice(0,1024),b.fromName.slice(0,120),b.fromEmail.slice(0,190),+!!b.enabled,b.imapHost.slice(0,190),b.imapPort])}async function a7(a){await aX();let[b]=await s().query("SELECT * FROM crm_email_templates WHERE organization_id = ? ORDER BY name ASC, id ASC",[a]);return b}async function a8(a,b){await aX();let[c]=await s().query("INSERT INTO crm_email_templates (organization_id, name, subject, body, created_by) VALUES (?, ?, ?, ?, ?)",[a,b.name.slice(0,120),b.subject.slice(0,300),b.body.slice(0,2e4),b.createdBy.slice(0,190)]);return c.insertId}async function a9(a,b,c){await aX(),await s().query("UPDATE crm_email_templates SET name = ?, subject = ?, body = ? WHERE id = ? AND organization_id = ?",[c.name.slice(0,120),c.subject.slice(0,300),c.body.slice(0,2e4),b,a])}async function ba(a,b){await aX(),await s().query("DELETE FROM crm_email_templates WHERE id = ? AND organization_id = ?",[b,a])}async function bb(a,b){await aX(),await s().query(`INSERT INTO crm_email_sends (organization_id, token, contact_id, company_id, deal_id, to_email, subject, sent_by, enrollment_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,[a,b.token.slice(0,48),b.contactId??null,b.companyId??null,b.dealId??null,b.toEmail.slice(0,190),b.subject.slice(0,300),b.sentBy.slice(0,190),b.enrollmentId??null])}async function bc(a){await aX();let[b]=await s().query("SELECT 1 FROM crm_email_sends WHERE enrollment_id = ? AND opened_at IS NOT NULL LIMIT 1",[a]);return b.length>0}async function bd(a){await aX();let[b]=await s().query("SELECT organization_id, contact_id, company_id, deal_id, subject, sent_by, to_email, opened_at FROM crm_email_sends WHERE token = ? LIMIT 1",[a]),c=b[0];return c?(await s().query("UPDATE crm_email_sends SET opened_at = COALESCE(opened_at, CURRENT_TIMESTAMP), open_count = open_count + 1 WHERE token = ?",[a]),{firstOpen:null===c.opened_at,organizationId:c.organization_id,contactId:c.contact_id,companyId:c.company_id,dealId:c.deal_id,subject:String(c.subject??""),sentBy:String(c.sent_by??""),toEmail:String(c.to_email??"")}):null}async function be(a){await aX();let[b]=await s().query(`SELECT COUNT(*) AS sent_all,
            COALESCE(SUM(opened_at IS NOT NULL), 0) AS opened_all,
            COALESCE(SUM(sent_at >= (NOW() - INTERVAL 30 DAY)), 0) AS sent_30,
            COALESCE(SUM(sent_at >= (NOW() - INTERVAL 30 DAY) AND opened_at IS NOT NULL), 0) AS opened_30
       FROM crm_email_sends WHERE organization_id = ?`,[a]),c=b[0]??{};return{sentAll:Number(c.sent_all??0),openedAll:Number(c.opened_all??0),sent30:Number(c.sent_30??0),opened30:Number(c.opened_30??0)}}async function bf(a){await aX();let[b]=await s().query(`SELECT sent_by AS rep, COUNT(*) AS sent, COALESCE(SUM(opened_at IS NOT NULL), 0) AS opened
       FROM crm_email_sends WHERE organization_id = ? GROUP BY sent_by ORDER BY sent DESC LIMIT 10`,[a]);return b.map(a=>({rep:String(a.rep??""),sent:Number(a.sent??0),opened:Number(a.opened??0)}))}async function bg(a,b=25){await aX(),await y();let[c]=await s().query(`SELECT s.id, s.to_email, s.subject, s.sent_by, s.sent_at, s.opened_at, s.open_count, s.company_id, co.name AS company_name
       FROM crm_email_sends s
       LEFT JOIN crm_companies co ON co.id = s.company_id AND co.organization_id = s.organization_id
      WHERE s.organization_id = ? ORDER BY s.id DESC LIMIT ?`,[a,Math.min(Math.max(b,1),100)]);return c}async function bh(a,b){await aX();let[c]=await s().query(`INSERT INTO crm_scheduled_emails (organization_id, scheduled_by, to_email, subject, body, contact_id, company_id, deal_id, track, send_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[a,b.scheduledBy.slice(0,190),b.toEmail.slice(0,190),b.subject.slice(0,300),b.body.slice(0,2e4),b.contactId??null,b.companyId??null,b.dealId??null,+!!b.track,b.sendAt]);return c.insertId}async function bi(a,b=50){await aX();let[c]=await s().query(`SELECT * FROM crm_scheduled_emails WHERE organization_id = ?
       ORDER BY (status = 'pending') DESC, send_at ASC LIMIT ?`,[a,Math.min(Math.max(b,1),200)]);return c}async function bj(a,b){await aX(),await s().query("UPDATE crm_scheduled_emails SET status = 'canceled' WHERE id = ? AND organization_id = ? AND status = 'pending'",[b,a])}async function bk(a=40){await aX();let[b]=await s().query("SELECT * FROM crm_scheduled_emails WHERE status = 'pending' AND send_at <= NOW() ORDER BY send_at ASC LIMIT ?",[Math.min(Math.max(a,1),100)]);return b}async function bl(a,b,c=""){await aX(),await s().query("UPDATE crm_scheduled_emails SET status = ?, error = ?, sent_at = CURRENT_TIMESTAMP WHERE id = ?",[b,c.slice(0,300),a])}async function bm(a,b){await aX();let[c]=await s().query("SELECT * FROM crm_sequence_steps WHERE sequence_id = ? AND organization_id = ? ORDER BY step_order ASC",[b,a]);return c}async function bn(a,b){await aX();let[c]=await s().query("SELECT id, name, stop_on_open, created_by, 0 AS step_count, 0 AS active_count, 0 AS total_enrolled FROM crm_sequences WHERE id = ? AND organization_id = ? LIMIT 1",[b,a]);return c[0]??null}async function bo(a=30){await aX();let[b]=await s().query("SELECT * FROM crm_sequence_enrollments WHERE status = 'active' AND next_send_at <= NOW() ORDER BY next_send_at ASC LIMIT ?",[Math.min(Math.max(a,1),100)]);return b}async function bp(a,b){await aX(),await s().query("UPDATE crm_sequence_enrollments SET current_step = ?, next_send_at = COALESCE(?, next_send_at), status = ? WHERE id = ?",[b.currentStep,b.nextSendAt,b.status,a])}async function bq(a,b){await y();let[c]=await s().query(`SELECT ct.id, ct.name, ct.company_id, co.name AS company_name
       FROM crm_contacts ct LEFT JOIN crm_companies co ON co.id = ct.company_id AND co.organization_id = ct.organization_id
      WHERE ct.organization_id = ? AND LOWER(ct.email) = LOWER(?) LIMIT 1`,[a,b]),d=c[0];return d?{id:d.id,name:String(d.name??""),companyId:d.company_id,companyName:String(d.company_name??"")}:null}async function br(a,b){await aX();let[c]=await s().query("UPDATE crm_sequence_enrollments SET status = 'stopped' WHERE organization_id = ? AND contact_id = ? AND status = 'active'",[a,b]);return c.affectedRows??0}async function bs(a){await aX();let[b]=await s().query("SELECT last_uid, uid_validity FROM crm_email_sync WHERE organization_id = ? LIMIT 1",[a]),c=b[0];return{lastUid:Number(c?.last_uid??0),uidValidity:Number(c?.uid_validity??0)}}async function bt(a,b,c){await aX(),await s().query(`INSERT INTO crm_email_sync (organization_id, last_uid, uid_validity, last_synced_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE last_uid = VALUES(last_uid), uid_validity = VALUES(uid_validity), last_synced_at = CURRENT_TIMESTAMP`,[a,b,c])}async function bu(){await aX();let[a]=await s().query("SELECT organization_id, imap_host, imap_port, username, password_enc FROM crm_email_settings WHERE imap_host <> '' AND enabled = 1 LIMIT 50");return a}async function bv(){await aX(),await s().query("INSERT INTO crm_heartbeat (id, last_cron_at) VALUES (1, CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE last_cron_at = CURRENT_TIMESTAMP")}async function bw(){await aX();let[a]=await s().query("SELECT last_cron_at FROM crm_heartbeat WHERE id = 1 LIMIT 1");return a[0]?.last_cron_at??null}async function bx(a,b){await aX(),await s().query("INSERT INTO crm_notifications (organization_id, user_email, type, title, href) VALUES (?, ?, ?, ?, ?)",[a,b.userEmail??null,b.type.slice(0,40),b.title.slice(0,300),(b.href??"").slice(0,300)])}async function by(a,b,c=20){await aX();let[d]=await s().query(`SELECT id, type, title, href, created_at FROM crm_notifications
      WHERE organization_id = ? AND (user_email IS NULL OR user_email = ?)
      ORDER BY id DESC LIMIT ?`,[a,b,Math.min(Math.max(c,1),100)]);return d}async function bz(a,b,c){await aX();let[d]=await s().query(`SELECT COUNT(*) AS n FROM crm_notifications
      WHERE organization_id = ? AND (user_email IS NULL OR user_email = ?) AND created_at > COALESCE(?, '1970-01-01 00:00:00')`,[a,b,c]);return Number(d[0]?.n??0)}async function bA(a){await aX();let[b]=await s().query("SELECT notifications_seen_at FROM crm_users WHERE id = ? LIMIT 1",[a]);return b[0]?.notifications_seen_at??null}async function bB(a){await aX(),await s().query("UPDATE crm_users SET notifications_seen_at = CURRENT_TIMESTAMP WHERE id = ?",[a])}async function bC(a){await aX();let[b]=await s().query(`SELECT id, organization_id, title, starts_at, created_by
       FROM crm_meetings
      WHERE reminded = 0 AND starts_at > NOW() AND starts_at <= (NOW() + INTERVAL ? MINUTE)
      ORDER BY starts_at ASC LIMIT 200`,[Math.max(1,Math.min(240,Math.round(a)))]);return b}async function bD(a){await s().query("UPDATE crm_meetings SET reminded = 1 WHERE id = ?",[a])}async function bE(a){await aX();let[b]=await s().query("SELECT * FROM crm_capture_forms WHERE token = ? LIMIT 1",[a.slice(0,64)]);return b[0]??null}async function bF(a){await s().query("UPDATE crm_capture_forms SET submissions = submissions + 1 WHERE id = ?",[a])}async function bG(a,b){await aX();let[c]=await s().query("DELETE FROM crm_sessions WHERE organization_id = ? AND id <> ?",[a,b]);return c.affectedRows??0}async function bH(a){await aX();let[b]=await s().query("SELECT COUNT(*) AS n FROM crm_sessions WHERE organization_id = ? AND expires_at > NOW()",[a]);return Number(b[0]?.n??0)}async function bI(){await aX();let[a]=await s().query("SELECT COUNT(*) AS n FROM crm_users");return Number(a[0]?.n??0)}async function bJ(a){await aX();let[b]=await s().query("SELECT * FROM crm_organizations WHERE id = ? LIMIT 1",[a]);return b[0]??null}async function bK(a,b,c){await aX(),await s().query("UPDATE crm_organizations SET name = ?, slug = ? WHERE id = ?",[b.slice(0,190),c.slice(0,120),a])}async function bL(a){await aX();let[b]=await s().query("SELECT COUNT(*) AS n FROM crm_users WHERE organization_id = ?",[a]);return Number(b[0]?.n??0)}async function bM(a,b){await aX(),await s().query("UPDATE crm_organizations SET plan = ? WHERE id = ?",[b.slice(0,24),a])}async function bN(a,b){await aX(),await s().query("UPDATE crm_organizations SET billing_email = ?, billing_name = ?, billing_address = ?, tax_id = ? WHERE id = ?",[b.billingEmail.slice(0,190),b.billingName.slice(0,190),b.billingAddress.slice(0,500),b.taxId.slice(0,40),a])}async function bO(a){await y(),await aX();let b=s(),c=c=>b.query(c,[a]).then(([a])=>Number(a[0]?.n??0)),[d,e,f,g]=await Promise.all([c("SELECT COUNT(*) AS n FROM crm_users WHERE organization_id = ?"),c("SELECT COUNT(*) AS n FROM crm_companies WHERE organization_id = ?"),c("SELECT COUNT(*) AS n FROM crm_contacts WHERE organization_id = ?"),c("SELECT COUNT(*) AS n FROM crm_deals WHERE organization_id = ?")]);return{users:d,companies:e,contacts:f,deals:g}}async function bP(a){await aX();let[b]=await s().query("SELECT * FROM crm_api_keys WHERE organization_id = ? ORDER BY id DESC",[a]);return b}async function bQ(a,b){await aX();let[c]=await s().query("INSERT INTO crm_api_keys (organization_id, name, key_hash, last4, created_by_email, expires_at, scopes) VALUES (?, ?, ?, ?, ?, ?, ?)",[a,b.name.slice(0,120),b.keyHash.slice(0,64),b.last4.slice(0,8),b.createdByEmail.slice(0,190),b.expiresAt??null,(b.scopes||"companies,contacts,deals").slice(0,255)]);return c.insertId}async function bR(a,b,c){await aX(),await s().query("UPDATE crm_api_keys SET enabled = ? WHERE id = ? AND organization_id = ?",[+!!c,b,a])}async function bS(a,b){await aX(),await s().query("DELETE FROM crm_api_keys WHERE id = ? AND organization_id = ?",[b,a])}async function bT(a){await aX();let[b]=await s().query("SELECT id, organization_id, scopes FROM crm_api_keys WHERE key_hash = ? AND enabled = 1 AND (expires_at IS NULL OR expires_at > NOW()) LIMIT 1",[a]),c=b[0];return c?{id:c.id,organizationId:c.organization_id,scopes:c.scopes}:null}async function bU(a){await aX(),await s().query("UPDATE crm_api_keys SET last_used_at = CURRENT_TIMESTAMP, request_count = request_count + 1 WHERE id = ?",[a]).catch(()=>{})}async function bV(a){await aX();let[b]=await s().query("SELECT * FROM crm_users WHERE email = ? AND status = 'active' LIMIT 1",[a.toLowerCase()]);return b[0]??null}async function bW(a){await aX();let[b]=await s().query("SELECT * FROM crm_users WHERE id = ? LIMIT 1",[a]);return b[0]??null}async function bX(a){await aX(),await s().query("UPDATE crm_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?",[a])}async function bY(a){await aX(),await s().query("INSERT INTO crm_sessions (user_id, organization_id, token_hash, expires_at, ip, user_agent, last_used_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",[a.userId,a.organizationId,a.tokenHash,a.expiresAt,(a.ip??"").slice(0,45),(a.userAgent??"").slice(0,255)])}async function bZ(a){await aX();let[b]=await s().query("SELECT * FROM crm_sessions WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP LIMIT 1",[a]);return b[0]??null}async function b$(a,b){try{await s().query("UPDATE crm_sessions SET last_used_at = CURRENT_TIMESTAMP, ip = IF(ip IS NULL OR ip = '', ?, ip), user_agent = IF(user_agent IS NULL OR user_agent = '', ?, user_agent) WHERE token_hash = ?",[(b?.ip??"").slice(0,45),(b?.userAgent??"").slice(0,255),a])}catch{}}async function b_(a){await aX();let[b]=await s().query("SELECT totp_secret, totp_enabled FROM crm_users WHERE id = ? LIMIT 1",[a]),c=b[0];return c?{secret:String(c.totp_secret??""),enabled:!!c.totp_enabled}:null}async function b0(a,b){await aX();let[c]=await s().query("UPDATE crm_recovery_codes SET used_at = CURRENT_TIMESTAMP WHERE user_id = ? AND code_hash = ? AND used_at IS NULL",[a,b]);return(c.affectedRows??0)>0}async function b1(a,b,c){await aX(),await s().query("INSERT INTO crm_mfa_challenges (user_id, token_hash, expires_at) VALUES (?, ?, ?)",[a,b,c])}let b2=RegExp("[\\u0000-\\u001F\\u007F-\\u009F\\u2028\\u2029]","g");function b3(a){return String(a??"").replace(b2," ")}async function b4(a){await aX(),await s().query("INSERT INTO crm_audit_logs (organization_id, user_id, actor_email, action, entity, entity_id, summary, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",[a.organizationId,a.userId,b3(a.actorEmail).slice(0,190),a.action.slice(0,40),a.entity.slice(0,40),a.entityId??null,b3(a.summary??"").slice(0,255),(a.ip??"").slice(0,45),b3(a.userAgent??"").slice(0,255)])}async function b5(a,b=100){await aX();let[c]=await s().query("SELECT * FROM crm_audit_logs WHERE organization_id = ? ORDER BY id DESC LIMIT ?",[a,b]);return c}async function b6(a){await aX();let b=s(),c=async c=>{let[d]=await b.query(c,[a]);return Number(d[0]?.n??0)},[d,e,f,g,h,i,j,k]=await Promise.all([c("SELECT COUNT(*) AS n FROM crm_sessions WHERE organization_id = ? AND expires_at > NOW()"),c("SELECT COUNT(*) AS n FROM crm_sessions WHERE organization_id = ? AND expires_at > NOW() AND COALESCE(last_used_at, created_at) < NOW() - INTERVAL 30 DAY"),c("SELECT COUNT(*) AS n FROM crm_audit_logs WHERE organization_id = ? AND action = 'login_failed' AND created_at >= NOW() - INTERVAL 24 HOUR"),c("SELECT COUNT(*) AS n FROM crm_users WHERE organization_id = ?"),c("SELECT COUNT(*) AS n FROM crm_users WHERE organization_id = ? AND role IN ('owner','admin')"),c("SELECT COUNT(*) AS n FROM crm_users WHERE organization_id = ? AND role IN ('owner','admin') AND status = 'active' AND totp_enabled = 0"),c("SELECT COUNT(*) AS n FROM crm_api_keys WHERE organization_id = ? AND enabled = 1"),c("SELECT COUNT(*) AS n FROM crm_api_keys WHERE organization_id = ? AND enabled = 1 AND COALESCE(last_used_at, created_at) < NOW() - INTERVAL 90 DAY")]);return{activeSessions:d,staleSessions:e,failedLogins24h:f,users:g,admins:h,adminsWithoutMfa:i,apiKeysEnabled:j,apiKeysIdle:k}}},50505:(a,b,c)=>{"use strict";c.d(b,{DY:()=>n,Hn:()=>l,Qq:()=>h,WI:()=>m,an:()=>d,dw:()=>k,ub:()=>o,w7:()=>f,yi:()=>j,zL:()=>e});let d=[{id:"new",label:"New lead",probability:10,open:!0},{id:"qualified",label:"Qualified",probability:20,open:!0},{id:"contacted",label:"Contacted",probability:30,open:!0},{id:"discovery",label:"Discovery",probability:45,open:!0},{id:"meeting",label:"Meeting",probability:60,open:!0},{id:"quote",label:"Quote sent",probability:75,open:!0},{id:"negotiation",label:"Negotiation",probability:85,open:!0},{id:"won",label:"Won",probability:100,open:!1},{id:"lost",label:"Lost",probability:0,open:!1}],e=d.filter(a=>a.open),f=d.map(a=>a.id),g=["price","competitor","no_budget","timing","no_response","wrong_fit","other"];function h(a){return g.includes(a)}let i=new Map(d.map(a=>[a.id,a]));function j(a){return i.has(a)}function k(a){return i.get(a)??d[0]}function l(a){return i.get(a)?.label??a}function m(a){let b=Object.fromEntries(f.map(a=>[a,{count:0,value:0}])),c=0,d=0,e=0,g=0,h=0,j=0;for(let f of a){let a=i.get(f.stage)?f.stage:"new";b[a].count+=1,b[a].value+=f.value,k(a).open?(c+=f.value,d+=function(a){let b=k(a.stage);if(!b.open)return"won"===b.id?a.value:0;let c=null!=a.probability?a.probability:b.probability;return Math.round(a.value*Math.max(0,Math.min(100,c))/100)}(f),g+=1):"won"===a?(e+=f.value,h+=1):j+=1}let l=h+j,m=l?Math.round(h/l*100):0;return{open:c,weighted:d,won:e,openCount:g,wonCount:h,lostCount:j,winRate:m,byStage:b}}function n(a){let b=30;a.hasWebsite&&(b+=15),a.industryMatch&&(b+=25);let c=a.employees??0;return c>=200?b+=20:c>=50?b+=15:c>=10&&(b+=8),(a.annualValue??0)>=2e4&&(b+=10),Math.max(0,Math.min(100,b))}function o(a){let b=[{label:"Base",points:30}];a.hasWebsite&&b.push({label:"Has a website",points:15}),a.industryMatch&&b.push({label:"Industry fit",points:25});let c=a.employees??0;return c>=200?b.push({label:"200+ employees",points:20}):c>=50?b.push({label:"50+ employees",points:15}):c>=10&&b.push({label:"10+ employees",points:8}),(a.annualValue??0)>=2e4&&b.push({label:"Annual value ≥ €20k",points:10}),{total:Math.max(0,Math.min(100,b.reduce((a,b)=>a+b.points,0))),factors:b}}},85750:(a,b,c)=>{"use strict";function d(a){return`Q-${String(a).padStart(4,"0")}`}function e(a,b){return!!a&&a.slice(0,10)<b}c.d(b,{GE:()=>e,yx:()=>d})}};