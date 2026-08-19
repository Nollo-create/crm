exports.id=8156,exports.ids=[8156],exports.modules={7816:(a,b,c)=>{"use strict";c.d(b,{m:()=>g});var d=c(68545),e=c(19423),f=c(29875);async function g(a,b){let c=await (0,d.zxu)(a);if(!c||!c.enabled)return!1;let g=(b??"").replace(/\s/g,"");if(/^\d{6}$/.test(g)){let a=(0,e.wu)(c.secret);return!!a&&(0,f.lS)(a,g,Math.floor(Date.now()/1e3))}return!!g&&(0,d.VnY)(a,(0,f.$m)(b))}},11766:(a,b,c)=>{"use strict";c.d(b,{Xe:()=>h,ak:()=>e});let d=["high","normal","low"];function e(a){return d.includes(a)}let f={due:"t.due_date",priority:"FIELD(t.priority, 'high', 'normal', 'low')",title:"t.title",created:"t.id"},g=new Set(Object.keys(f));function h(a,b){let c=1===b?"ASC":"DESC",d=g.has(a)?a:"due";return"due"===d?`ORDER BY t.due_date IS NULL, t.due_date ${c}, t.id DESC`:`ORDER BY ${f[d]} ${c}, t.id DESC`}},14860:(a,b,c)=>{"use strict";c.d(b,{Ht:()=>l,J0:()=>p,OC:()=>m,dC:()=>r,ky:()=>q,xw:()=>n});var d=c(70495),e=c(69206),f=c(94306),g=c(66896),h=c(68545),i=c(35356),j=c(97037);async function k(){try{let a=await (0,d.b3)(),b=(0,i.x)(a);return{ip:("unknown"===b?"":b).slice(0,45),userAgent:(a.get("user-agent")||"").slice(0,255)}}catch{return{ip:"",userAgent:""}}}async function l(){let a=await (0,d.UL)(),b=a.get(f.Q)?.value;if(!b)return null;let c=(0,f.QK)(b),e=await (0,h.FgH)(c).catch(()=>null);if(!e)return null;let i=await (0,h.klJ)(e.user_id).catch(()=>null);if(!i||"active"!==i.status)return null;let j=e.last_used_at?new Date(e.last_used_at).getTime():0;return Date.now()-j>3e5&&(0,h.INn)(c),{userId:i.id,organizationId:i.organization_id,email:i.email,name:i.name,role:(0,g.aU)(i.role)}}async function m(){let a=await l();return a||(0,e.redirect)("/login"),a}async function n(){let a=await m();return(0,g.$3)(a.role,"record:write")?{session:a}:{error:"Your role is read-only — ask an admin for edit access."}}async function o(a,b){let c=(0,f.F$)(),d=new Date(Date.now()+864e5*f.g_),e=await k();return await (0,h.jwg)({userId:a,organizationId:b,tokenHash:(0,f.QK)(c),expiresAt:d,ip:e.ip,userAgent:e.userAgent}),{name:f.Q,value:c,options:{httpOnly:!0,secure:!0,sameSite:"lax",path:"/",expires:d,domain:j.XX.cookieDomain||void 0}}}async function p(a,b){let{name:c,value:e,options:f}=await o(a,b);(await (0,d.UL)()).set(c,e,f)}async function q(){let a=await (0,d.UL)(),b=a.get(f.Q)?.value;b&&await (0,h.g9z)((0,f.QK)(b)).catch(()=>{}),a.delete(f.Q)}async function r(){let a=await (0,d.UL)(),b=a.get(f.Q)?.value;if(!b)return null;let c=await (0,h.FgH)((0,f.QK)(b)).catch(()=>null);return c?.id??null}},16268:(a,b,c)=>{"use strict";c.d(b,{iC:()=>u,Zm:()=>w,UH:()=>t,H_:()=>v});var d=c(91488);c(27806);var e=c(69206),f=c(70495),g=c(68545),h=c(31391),i=c(14860),j=c(94306),k=c(55435),l=c(97037);async function m(a){let b=(0,j.F$)(),c=new Date(Date.now()+6e4*k.f4);return await (0,g.mlv)(a,(0,j.QK)(b),c),{name:k.A1,value:b,options:{httpOnly:!0,secure:!0,sameSite:"lax",path:"/",expires:c,domain:l.XX.cookieDomain||void 0}}}async function n(a){let{name:b,value:c,options:d}=await m(a);(await (0,f.UL)()).set(b,c,d)}var o=c(7816),p=c(29965),q=c(79699),r=c(35356);async function s(){return(0,r.x)(await (0,f.b3)())}async function t(a){let b,c=await s(),d=(0,q.Eb)(`setup:ip:${c}`,{limit:5,windowMs:36e5,blockMs:18e5});if(!d.ok)return{error:(0,q.o7)(d.retryAfter)};try{b=await (0,g._aR)()}catch{return{error:"Database not reachable — check the server configuration."}}if(b>0)return{error:"Setup has already been completed. Please sign in."};let e=a.orgName.trim(),f=a.email.trim().toLowerCase();if(!e)return{error:"Organization name is required."};if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f))return{error:"Enter a valid email address."};if(a.password.length<8)return{error:"Password must be at least 8 characters."};let j=await (0,g.ECR)(e,e.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,120)||"org"),k=await (0,h.E)(a.password),l=await (0,g.kgp)({organizationId:j,email:f,name:a.name.trim(),passwordHash:k,role:"owner"});return await (0,i.J0)(l,j),await (0,p.Q)({organizationId:j,userId:l,actorEmail:f,action:"setup",summary:`created organization ${e}`}),{ok:!0}}async function u(a){let b,c=a.email.trim().toLowerCase(),d=await s(),e=`login:ip:${d}`,f=`login:email:${c}`,j=(0,q.Eb)(e,{limit:15,windowMs:3e5,blockMs:9e5});if(!j.ok)return{error:(0,q.o7)(j.retryAfter)};let k=(0,q.Eb)(f,{limit:8,windowMs:3e5,blockMs:9e5});if(!k.ok)return{error:(0,q.o7)(k.retryAfter)};try{b=await (0,g.htw)(c)}catch{return{error:"Database not reachable — check the server configuration."}}let l=await (0,h.B)(a.password,b?.password_hash??"scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");return b&&l?((0,q.Z4)(f),(0,q.Z4)(e),b.totp_enabled)?(await n(b.id),{mfaRequired:!0}):(await (0,i.J0)(b.id,b.organization_id),await (0,g.lYZ)(b.id).catch(()=>{}),await (0,p.Q)({organizationId:b.organization_id,userId:b.id,actorEmail:b.email,action:"login"}),{ok:!0}):(b&&!l&&await (0,p.Q)({organizationId:b.organization_id,userId:b.id,actorEmail:b.email,action:"login_failed",summary:"wrong password"}),{error:"Invalid email or password."})}async function v(a){let b=await (0,f.UL)(),c=b.get(k.A1)?.value;if(!c)return{error:"Your sign-in step expired — please sign in again."};let d=await s(),e=(0,q.Eb)(`mfa-login:ip:${d}`,{limit:12,windowMs:3e5,blockMs:9e5});if(!e.ok)return{error:(0,q.o7)(e.retryAfter)};let h=(0,j.QK)(c),l=await (0,g.e8U)(h).catch(()=>null);if(!l)return b.delete(k.A1),{error:"Your sign-in step expired — please sign in again."};let m=await (0,g.klJ)(l.userId).catch(()=>null);if(!m||"active"!==m.status)return await (0,g.Vws)(h).catch(()=>{}),b.delete(k.A1),{error:"Please sign in again."};let n=(0,q.Eb)(`mfa-login:user:${m.id}`,{limit:8,windowMs:3e5,blockMs:9e5});return n.ok?await (0,o.m)(m.id,a.code)?(await (0,g.Vws)(h).catch(()=>{}),b.delete(k.A1),await (0,i.J0)(m.id,m.organization_id),await (0,g.lYZ)(m.id).catch(()=>{}),await (0,p.Q)({organizationId:m.organization_id,userId:m.id,actorEmail:m.email,action:"login",summary:"with 2FA"}),{ok:!0}):(await (0,p.Q)({organizationId:m.organization_id,userId:m.id,actorEmail:m.email,action:"login_failed",summary:"wrong 2FA code"}),{error:"That code didn't match. Try again."}):{error:(0,q.o7)(n.retryAfter)}}async function w(){let a=await (0,i.Ht)().catch(()=>null);a&&await (0,p.Q)({organizationId:a.organizationId,userId:a.userId,actorEmail:a.email,action:"logout"}),await (0,i.ky)(),(0,e.redirect)("/login")}(0,c(40410).D)([t,u,v,w]),(0,d.A)(t,"4089577babdf1bdaaeb376f23c1d964df745b2db11",null),(0,d.A)(u,"407e781c90c7d4198c320b449497180af50ec93006",null),(0,d.A)(v,"40ff433fd3460e334b2fc88050c8eaa189e5358f8f",null),(0,d.A)(w,"004e8c36e25e401db64fd6d60de89515976aeeaae3",null)},19423:(a,b,c)=>{"use strict";c.d(b,{MG:()=>g,S:()=>f,wu:()=>h});var d=c(77598);function e(){let a=(process.env.MFA_ENCRYPTION_KEY??"").trim();return a.length<16?null:(0,d.createHash)("sha256").update(a).digest()}function f(){return null!==e()}function g(a){let b=e();return b?function(a,b){let c=(0,d.randomBytes)(12),e=(0,d.createCipheriv)("aes-256-gcm",a,c),f=Buffer.concat([e.update(b,"utf8"),e.final()]),g=e.getAuthTag();return["v1",c.toString("base64"),g.toString("base64"),f.toString("base64")].join(".")}(b,a):null}function h(a){let b=e();return b?function(a,b){try{let[c,e,f,g]=b.split(".");if("v1"!==c||!e||!f||!g)return null;let h=(0,d.createDecipheriv)("aes-256-gcm",a,Buffer.from(e,"base64"));return h.setAuthTag(Buffer.from(f,"base64")),Buffer.concat([h.update(Buffer.from(g,"base64")),h.final()]).toString("utf8")}catch{return null}}(b,a):null}},25591:(a,b,c)=>{Promise.resolve().then(c.bind(c,68734))},29875:(a,b,c)=>{"use strict";c.d(b,{$m:()=>k,R4:()=>i,b5:()=>j,lS:()=>g,nP:()=>h,tn:()=>f});var d=c(77598);let e="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";function f(a=20){return function(a){let b=0,c=0,d="";for(let f of a)for(c=c<<8|f,b+=8;b>=5;)d+=e[c>>>b-5&31],b-=5;return b>0&&(d+=e[c<<5-b&31]),d}((0,d.randomBytes)(a))}function g(a,b,c,f=1){let h=(b??"").replace(/\s/g,"");if(!/^\d{6}$/.test(h))return!1;let i=function(a){let b=a.toUpperCase().replace(/=+$/,"").replace(/\s/g,""),c=0,d=0,f=[];for(let a of b){let b=e.indexOf(a);-1!==b&&(d=d<<5|b,(c+=5)>=8&&(f.push(d>>>c-8&255),c-=8))}return Buffer.from(f)}(a),j=Math.floor(c/30),k=Buffer.from(h);for(let a=-f;a<=f;a++){if(j+a<0)continue;let b=Buffer.from(function(a,b,c=6){let e=Buffer.alloc(8);e.writeUInt32BE(Math.floor(b/0x100000000),0),e.writeUInt32BE(b>>>0,4);let f=(0,d.createHmac)("sha1",a).update(e).digest(),g=15&f[f.length-1];return(((127&f[g])<<24|f[g+1]<<16|f[g+2]<<8|f[g+3])%10**c).toString().padStart(c,"0")}(i,j+a,6));if(b.length===k.length&&(0,d.timingSafeEqual)(b,k))return!0}return!1}function h(a,b,c="Sajtpress CRM"){let d=encodeURIComponent(`${c}:${b}`),e=new URLSearchParams({secret:a,issuer:c,algorithm:"SHA1",digits:"6",period:"30"});return`otpauth://totp/${d}?${e.toString()}`}function i(a){return a.replace(/(.{4})/g,"$1 ").trim()}function j(a=10){let b="abcdefghijkmnpqrstuvwxyz23456789",c=[];for(let e=0;e<a;e++){let a=(0,d.randomBytes)(8),e="";for(let c of a)e+=b[c%b.length];c.push(`${e.slice(0,4)}-${e.slice(4,8)}`)}return c}function k(a){let b=(a??"").toLowerCase().replace(/[^a-z0-9]/g,"");return(0,d.createHash)("sha256").update(b).digest("hex")}},29965:(a,b,c)=>{"use strict";c.d(b,{Q:()=>i,h:()=>h});var d=c(70495),e=c(68545),f=c(35356);async function g(){try{let a=await (0,d.b3)(),b=(0,f.x)(a),c=("unknown"===b?"":b).slice(0,45),e=(a.get("user-agent")||"").slice(0,255);return{ip:c,userAgent:e}}catch{return{ip:"",userAgent:""}}}async function h(a,b,c,d=null,f=""){try{let h=await g();await (0,e.fsW)({organizationId:a.organizationId,userId:a.userId,actorEmail:a.email,action:b,entity:c,entityId:d,summary:f,ip:h.ip,userAgent:h.userAgent})}catch{}}async function i(a){try{let b=await g();await (0,e.fsW)({organizationId:a.organizationId,userId:a.userId,actorEmail:a.actorEmail,action:a.action,entity:"session",summary:a.summary??"",ip:b.ip,userAgent:b.userAgent})}catch{}}},31391:(a,b,c)=>{"use strict";c.d(b,{B:()=>g,E:()=>f});var d=c(55511);function e(a,b,c,e){return new Promise((f,g)=>{(0,d.scrypt)(a,b,c,e,(a,b)=>a?g(a):f(b))})}async function f(a){let b=(0,d.randomBytes)(16),c=await e(a.normalize("NFKC"),b,32,{N:16384,r:8,p:1,maxmem:0x4000000});return`scrypt$16384$8$1$${b.toString("base64")}$${c.toString("base64")}`}async function g(a,b){let c,f,g,h=b.split("$");if(6!==h.length||"scrypt"!==h[0])return!1;let i=Number(h[1]),j=Number(h[2]),k=Number(h[3]);try{c=Buffer.from(h[4],"base64"),f=Buffer.from(h[5],"base64")}catch{return!1}if(!Number.isInteger(i)||!Number.isInteger(j)||!Number.isInteger(k)||i<2||0===c.length||0===f.length)return!1;try{g=await e(a.normalize("NFKC"),c,f.length,{N:i,r:j,p:k,maxmem:0x4000000})}catch{return!1}return g.length===f.length&&(0,d.timingSafeEqual)(g,f)}},33340:(a,b,c)=>{"use strict";c.d(b,{ThemeProvider:()=>d});let d=(0,c(97954).registerClientReference)(function(){throw Error("Attempted to call ThemeProvider() from the server but ThemeProvider is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"D:\\crm\\src\\components\\theme-provider.tsx","ThemeProvider")},35356:(a,b,c)=>{"use strict";c.d(b,{x:()=>e});let d=Math.max(1,Number(process.env.TRUSTED_PROXY_HOPS)||1);function e(a){return function(a,b,c=d){let e=(a??"").split(",").map(a=>a.trim()).filter(Boolean);if(e.length){let a=Math.max(0,e.length-Math.max(1,c));if(e[a])return e[a]}return(b??"").trim()||"unknown"}(a.get("x-forwarded-for"),a.get("x-real-ip"))}},35790:(a,b,c)=>{"use strict";c.d(b,{DY:()=>l,Qq:()=>g,WI:()=>k,an:()=>d,dw:()=>j,w7:()=>e,yi:()=>i});let d=[{id:"new",label:"New lead",probability:10,open:!0},{id:"qualified",label:"Qualified",probability:20,open:!0},{id:"contacted",label:"Contacted",probability:30,open:!0},{id:"discovery",label:"Discovery",probability:45,open:!0},{id:"meeting",label:"Meeting",probability:60,open:!0},{id:"quote",label:"Quote sent",probability:75,open:!0},{id:"negotiation",label:"Negotiation",probability:85,open:!0},{id:"won",label:"Won",probability:100,open:!1},{id:"lost",label:"Lost",probability:0,open:!1}];d.filter(a=>a.open);let e=d.map(a=>a.id),f=["price","competitor","no_budget","timing","no_response","wrong_fit","other"];function g(a){return f.includes(a)}let h=new Map(d.map(a=>[a.id,a]));function i(a){return h.has(a)}function j(a){return h.get(a)??d[0]}function k(a){let b=Object.fromEntries(e.map(a=>[a,{count:0,value:0}])),c=0,d=0,f=0,g=0,i=0,k=0;for(let e of a){let a=h.get(e.stage)?e.stage:"new";b[a].count+=1,b[a].value+=e.value,j(a).open?(c+=e.value,d+=function(a){let b=j(a.stage);if(!b.open)return"won"===b.id?a.value:0;let c=null!=a.probability?a.probability:b.probability;return Math.round(a.value*Math.max(0,Math.min(100,c))/100)}(e),g+=1):"won"===a?(f+=e.value,i+=1):k+=1}let l=i+k,m=l?Math.round(i/l*100):0;return{open:c,weighted:d,won:f,openCount:g,wonCount:i,lostCount:k,winRate:m,byStage:b}}function l(a){let b=30;a.hasWebsite&&(b+=15),a.industryMatch&&(b+=25);let c=a.employees??0;return c>=200?b+=20:c>=50?b+=15:c>=10&&(b+=8),(a.annualValue??0)>=2e4&&(b+=10),Math.max(0,Math.min(100,b))}},38019:(a,b,c)=>{"use strict";c.d(b,{ar:()=>i,v9:()=>e,yx:()=>f});let d=["draft","sent","accepted","declined"];function e(a){return d.includes(a)}function f(a){return`Q-${String(a).padStart(4,"0")}`}let g={number:"q.id",company:"co.name",status:"q.status",total:"q.total_cents",created:"q.created_at"},h=new Set(Object.keys(g));function i(a,b){let c=h.has(a)?g[a]:g.created;return`ORDER BY ${c} ${1===b?"ASC":"DESC"}, q.id DESC`}},44943:(a,b,c)=>{"use strict";c.d(b,{cn:()=>f});var d=c(43249),e=c(58829);function f(...a){return(0,e.QP)((0,d.$)(a))}},45877:(a,b,c)=>{Promise.resolve().then(c.t.bind(c,81170,23)),Promise.resolve().then(c.t.bind(c,23597,23)),Promise.resolve().then(c.t.bind(c,36893,23)),Promise.resolve().then(c.t.bind(c,89748,23)),Promise.resolve().then(c.t.bind(c,6060,23)),Promise.resolve().then(c.t.bind(c,7184,23)),Promise.resolve().then(c.t.bind(c,69576,23)),Promise.resolve().then(c.t.bind(c,73041,23)),Promise.resolve().then(c.t.bind(c,51384,23))},51472:(a,b,c)=>{"use strict";c.r(b),c.d(b,{default:()=>k,metadata:()=>i,viewport:()=>j});var d=c(75338),e=c(18039),f=c.n(e),g=c(86802),h=c(33340);c(61135);let i={title:"Sajtpress CRM",description:"AI sales CRM for the Sajtpress platform."},j={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:[{media:"(prefers-color-scheme: light)",color:"#f8f9fb"},{media:"(prefers-color-scheme: dark)",color:"#0d0f14"}]};async function k({children:a}){let b=(await (0,g.b3)()).get("x-nonce")??void 0;return(0,d.jsx)("html",{lang:"en",suppressHydrationWarning:!0,children:(0,d.jsx)("body",{className:`${f().className} min-h-screen bg-background text-foreground antialiased`,children:(0,d.jsx)(h.ThemeProvider,{nonce:b,children:a})})})}},55435:(a,b,c)=>{"use strict";c.d(b,{A1:()=>f,Q:()=>d,f4:()=>g,g_:()=>e});let d="crm_session",e=30,f="crm_mfa",g=10},59645:(a,b,c)=>{"use strict";c.r(b),c.d(b,{default:()=>e});var d=c(97523);let e=async a=>[{type:"image/svg+xml",sizes:"any",url:(0,d.fillMetadataSegment)(".",await a.params,"icon.svg")+"?da2337cc9012af34"}]},61135:()=>{},65343:(a,b,c)=>{Promise.resolve().then(c.bind(c,33340))},66896:(a,b,c)=>{"use strict";c.d(b,{$3:()=>h,aU:()=>i,tm:()=>e});let d=["owner","admin","member","viewer"];function e(a){return d.includes(a)}let f={owner:3,admin:2,member:1,viewer:0},g={"company:read":"viewer","company:write":"member","company:delete":"admin","deal:read":"viewer","deal:write":"member","deal:delete":"admin","record:write":"member","member:manage":"admin","org:manage":"owner"};function h(a,b){return f[a]>=f[g[b]]}function i(a){return a&&e(a)?a:"viewer"}},68545:(a,b,c)=>{"use strict";c.d(b,{JVl:()=>bK,ROY:()=>aj,IP1:()=>T,TOG:()=>aO,zEn:()=>a3,J5E:()=>aX,hi3:()=>a_,wWn:()=>aT,I9W:()=>a$,W3D:()=>aZ,dts:()=>aU,dDN:()=>a5,tVd:()=>a4,_5M:()=>aW,FeU:()=>aV,xSL:()=>aY,tyz:()=>a6,_Zg:()=>a2,PHg:()=>K,DLX:()=>R,jtr:()=>P,kFX:()=>L,jvu:()=>S,BBy:()=>Q,Mwi:()=>bC,bCV:()=>af,vGP:()=>ae,VnY:()=>cy,KPv:()=>au,Sv0:()=>cj,JI4:()=>bQ,Hps:()=>cz,_aR:()=>cb,Ue7:()=>bg,fE5:()=>b$,eK9:()=>x,ros:()=>$,las:()=>bw,Hbf:()=>bt,D7t:()=>bL,tRt:()=>ao,qrd:()=>bT,mlv:()=>cA,UI8:()=>bO,ECR:()=>cc,WY4:()=>aA,bsN:()=>aG,cjV:()=>bA,ghm:()=>bG,jwg:()=>cm,VZj:()=>C,UTO:()=>av,kgp:()=>cd,Mlm:()=>J,$yT:()=>am,lgR:()=>bi,osy:()=>b0,DRX:()=>ca,RCX:()=>H,MOQ:()=>Y,iGU:()=>ah,uoo:()=>bv,srg:()=>at,Fv9:()=>bV,Vws:()=>cC,DDd:()=>aD,wcN:()=>aL,h8F:()=>aQ,lD$:()=>bJ,g9z:()=>cs,vq0:()=>az,ZIZ:()=>cv,fti:()=>aF,y5H:()=>aH,GOs:()=>bx,Klv:()=>by,a6:()=>cu,QaE:()=>A,OeD:()=>bf,C1Z:()=>z,blr:()=>U,NEz:()=>ab,qK7:()=>bq,DTb:()=>ap,kXg:()=>bY,e8U:()=>cB,jCc:()=>bR,EeC:()=>bn,kqY:()=>bp,fns:()=>aJ,ebT:()=>bF,HrH:()=>bE,FgH:()=>cn,htw:()=>ce,klJ:()=>cf,zxu:()=>cw,M1H:()=>bo,s3O:()=>ak,nak:()=>al,lJ8:()=>cG,eWg:()=>bk,fyF:()=>bd,y2C:()=>b1,TKy:()=>b8,Pwf:()=>b6,mmj:()=>y,kN5:()=>M,tdK:()=>I,I8F:()=>W,CCc:()=>bN,ik7:()=>X,jQD:()=>Z,Eyz:()=>ac,EtW:()=>_,NEY:()=>ad,fIQ:()=>ai,oMG:()=>bs,_JW:()=>be,z87:()=>b3,BHE:()=>ar,DmS:()=>bX,qOI:()=>bZ,RzM:()=>bP,AwV:()=>aE,rCC:()=>aI,t2U:()=>bz,xud:()=>bB,d21:()=>bD,Mfh:()=>cp,cBF:()=>B,Khm:()=>aw,ZZm:()=>ci,tBn:()=>bj,_nL:()=>N,zJ5:()=>ba,W5t:()=>a9,jxb:()=>bb,hTo:()=>bc,fSM:()=>a8,LB3:()=>a7,OYh:()=>b5,c5x:()=>bl,H0o:()=>b9,Uyt:()=>cx,Z0m:()=>bI,WNl:()=>cr,NYU:()=>cq,zh9:()=>aR,hEL:()=>ag,Zke:()=>E,rMt:()=>as,ECM:()=>bS,uqI:()=>aC,Z$B:()=>aP,uNf:()=>ax,lYZ:()=>cg,ifC:()=>cl,hA1:()=>ct,wTD:()=>aM,VuW:()=>bM,iON:()=>D,WDZ:()=>bh,INn:()=>co,Udg:()=>b_,JTl:()=>F,lH9:()=>G,CI6:()=>V,Kd8:()=>aa,sax:()=>bu,Q6B:()=>aq,znU:()=>bU,vc9:()=>aB,Gac:()=>aK,PR7:()=>bH,lCH:()=>ay,ejV:()=>ch,v_$:()=>ck,BKd:()=>b7,$Qc:()=>br,VSW:()=>b2,ZIJ:()=>b4,fsW:()=>cF});var d=c(56275),e=c(35790);let f={name:"c.name",industry:"c.industry",contacts:"contacts",openValue:"open_value",annualValue:"c.annual_value",score:"c.lead_score",health:"health_rank",lastActivity:"last_activity"},g=new Set(Object.keys(f));function h(a,b,c){let d=Math.min(100,Math.max(1,Math.floor(b)||25)),e=Math.max(1,Math.ceil(c/d)),f=Math.min(Math.max(1,Math.floor(a)||1),e);return{page:f,pageSize:d,offset:(f-1)*d,pageCount:e}}let i={name:"ct.name",role:"ct.role",company:"co.name",email:"ct.email",influence:"ct.influence"},j=new Set(Object.keys(i));var k=c(72653);let l={title:"d.title",company:"co.name",value:"d.value",stage:`FIELD(d.stage, ${e.w7.map(a=>`'${a}'`).join(", ")})`,expectedClose:"d.expected_close",created:"d.id"},m=new Set(Object.keys(l));var n=c(11766);let o={created:"a.created_at",type:"a.type",company:"co.name"},p=new Set(Object.keys(o));var q=c(71480),r=c(38019);let s=globalThis;function t(){return s.__cmsPool||(s.__cmsPool=d.createPool({host:process.env.DB_HOST||"localhost",port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER||"",password:process.env.DB_PASSWORD||"",database:process.env.DB_NAME||"",waitForConnections:!0,connectionLimit:5,charset:"utf8mb4_general_ci"})),s.__cmsPool}async function u(a,b,c,d){let[e]=await a.query("SELECT COUNT(*) AS n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",[b,c]);0===Number(e[0]?.n??0)&&await a.query(`ALTER TABLE \`${b}\` ADD COLUMN ${d}`)}function v(){return s.__crmSchema||(s.__crmSchema=(async()=>{let a=t();await a.query(`
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
      `),await u(a,"crm_companies","organization_id","organization_id INT UNSIGNED NOT NULL DEFAULT 0"),await u(a,"crm_contacts","organization_id","organization_id INT UNSIGNED NOT NULL DEFAULT 0"),await u(a,"crm_deals","organization_id","organization_id INT UNSIGNED NOT NULL DEFAULT 0"),await u(a,"crm_activities","organization_id","organization_id INT UNSIGNED NOT NULL DEFAULT 0"),await u(a,"crm_companies","lead_score","lead_score TINYINT UNSIGNED NOT NULL DEFAULT 0"),await u(a,"crm_contacts","mobile","mobile VARCHAR(40) NOT NULL DEFAULT ''"),await u(a,"crm_contacts","linkedin","linkedin VARCHAR(200) NOT NULL DEFAULT ''"),await u(a,"crm_contacts","notes","notes TEXT NULL"),await u(a,"crm_companies","legal_name","legal_name VARCHAR(190) NOT NULL DEFAULT ''"),await u(a,"crm_companies","phone","phone VARCHAR(60) NOT NULL DEFAULT ''"),await u(a,"crm_companies","email","email VARCHAR(190) NOT NULL DEFAULT ''"),await u(a,"crm_companies","country","country VARCHAR(120) NOT NULL DEFAULT ''"),await u(a,"crm_companies","address","address VARCHAR(300) NOT NULL DEFAULT ''"),await u(a,"crm_companies","vat_id","vat_id VARCHAR(40) NOT NULL DEFAULT ''"),await u(a,"crm_companies","description","description TEXT NULL"),await u(a,"crm_leads","priority","priority VARCHAR(12) NOT NULL DEFAULT 'normal'"),await u(a,"crm_leads","owner","owner VARCHAR(120) NOT NULL DEFAULT ''"),await u(a,"crm_leads","owner_user_id","owner_user_id INT UNSIGNED NULL"),await u(a,"crm_deals","owner_user_id","owner_user_id INT UNSIGNED NULL"),await u(a,"crm_deals","contact_id","contact_id INT UNSIGNED NULL"),await u(a,"crm_deals","notes","notes TEXT NULL"),await u(a,"crm_deals","closed_at","closed_at TIMESTAMP NULL"),await u(a,"crm_deals","loss_reason","loss_reason VARCHAR(40) NOT NULL DEFAULT ''"),await u(a,"crm_activities","deal_id","deal_id INT UNSIGNED NULL"),await u(a,"crm_quotes","public_token","public_token VARCHAR(64) NOT NULL DEFAULT ''"),await u(a,"crm_quotes","sent_at","sent_at TIMESTAMP NULL"),await u(a,"crm_quotes","decided_at","decided_at TIMESTAMP NULL"),await u(a,"crm_quotes","client_name","client_name VARCHAR(190) NOT NULL DEFAULT ''")})().catch(a=>{throw s.__crmSchema=void 0,a})),s.__crmSchema}function w(a){return(0,e.DY)({hasWebsite:!!(a.website??"").trim(),employees:a.employees??null,industryMatch:!!a.industryMatch,annualValue:a.annualValue??0})}async function x(a,b){await v();let[c]=await t().query(`INSERT INTO crm_companies (organization_id, name, industry, city, website, employees, annual_value, status, account_manager, industry_match, lead_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[a,b.name.slice(0,190),(b.industry??"").slice(0,120),(b.city??"").slice(0,120),(b.website??"").slice(0,300),b.employees??null,b.annualValue??0,(b.status??"lead").slice(0,20),(b.accountManager??"").slice(0,120),+!!b.industryMatch,w(b)]);return c.insertId}async function y(a,b={}){await v();let c=["organization_id = ?"],d=[a];if(b.q){c.push("(name LIKE ? OR industry LIKE ? OR city LIKE ?)");let a=`%${b.q}%`;d.push(a,a,a)}b.status&&(c.push("status = ?"),d.push(b.status));let[e]=await t().query(`SELECT * FROM crm_companies WHERE ${c.join(" AND ")} ORDER BY updated_at DESC LIMIT 500`,d);return e}async function z(a,b){await v();let[c]=await t().query("SELECT * FROM crm_companies WHERE id = ? AND organization_id = ? LIMIT 1",[b,a]);return c[0]??null}async function A(a,b,c){await v();let d=b.trim();if(d.length<2)return[];let e=["name LIKE ?"],f=[a,`%${d}%`],g=c.trim().replace(/^https?:\/\//i,"").replace(/^www\./i,"").split("/")[0].toLowerCase();g.length>3&&(e.push("(website <> '' AND LOWER(website) LIKE ?)"),f.push(`%${g}%`));let[h]=await t().query(`SELECT * FROM crm_companies WHERE organization_id = ? AND (${e.join(" OR ")}) ORDER BY name ASC LIMIT 5`,f);return h}async function B(a){await v();let[b]=await t().query("SELECT id, name, color FROM crm_tags WHERE organization_id = ? ORDER BY name ASC",[a]);return b}async function C(a,b,c){await v();let[d]=await t().query("INSERT INTO crm_tags (organization_id, name, color) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)",[a,b.slice(0,60),c.slice(0,20)]);return d.insertId}async function D(a,b,c){await v();let[d]=await t().query(`SELECT t.id, t.name, t.color FROM crm_entity_tags et
       JOIN crm_tags t ON t.id = et.tag_id AND t.organization_id = et.organization_id
      WHERE et.organization_id = ? AND et.entity_type = ? AND et.entity_id = ? ORDER BY t.name ASC`,[a,b.slice(0,16),c]);return d}async function E(a,b,c,d){await v();let e=d.filter(a=>Number.isInteger(a)).slice(0,50),f=b.slice(0,16),g=await t().getConnection();try{for(let b of(await g.beginTransaction(),await g.query("DELETE FROM crm_entity_tags WHERE organization_id = ? AND entity_type = ? AND entity_id = ?",[a,f,c]),e))await g.query("INSERT IGNORE INTO crm_entity_tags (organization_id, tag_id, entity_type, entity_id) VALUES (?, ?, ?, ?)",[a,b,f,c]);await g.commit()}catch(a){throw await g.rollback(),a}finally{g.release()}}async function F(a,b,c){await v(),await t().query("UPDATE crm_companies SET name=?, industry=?, city=?, website=?, employees=?, annual_value=?, status=?, account_manager=?, industry_match=?, lead_score=? WHERE id=? AND organization_id=?",[c.name.slice(0,190),(c.industry??"").slice(0,120),(c.city??"").slice(0,120),(c.website??"").slice(0,300),c.employees??null,c.annualValue??0,(c.status??"lead").slice(0,20),(c.accountManager??"").slice(0,120),+!!c.industryMatch,w(c),b,a])}async function G(a,b,c){await v(),await t().query("UPDATE crm_companies SET legal_name=?, phone=?, email=?, country=?, address=?, vat_id=?, description=? WHERE id=? AND organization_id=?",[c.legalName.slice(0,190),c.phone.slice(0,60),c.email.slice(0,190),c.country.slice(0,120),c.address.slice(0,300),c.vatId.slice(0,40),(c.description??"").slice(0,2e3),b,a])}async function H(a,b){await v();let c=t();await c.query("DELETE FROM crm_activities WHERE company_id = ? AND organization_id = ?",[b,a]),await c.query("DELETE FROM crm_deals WHERE company_id = ? AND organization_id = ?",[b,a]),await c.query("DELETE FROM crm_contacts WHERE company_id = ? AND organization_id = ?",[b,a]),await c.query("DELETE FROM crm_companies WHERE id = ? AND organization_id = ?",[b,a])}async function I(a,b){await v();let c=["c.organization_id = ?"],d=[a];if(b.q){c.push("(c.name LIKE ? OR c.industry LIKE ? OR c.city LIKE ?)");let a=`%${b.q}%`;d.push(a,a,a)}b.status&&(c.push("c.status = ?"),d.push(b.status)),b.statuses&&b.statuses.length&&(c.push(`c.status IN (${b.statuses.map(()=>"?").join(", ")})`),d.push(...b.statuses));let e=`WHERE ${c.join(" AND ")}`,i=t(),[j]=await i.query(`SELECT COUNT(*) AS n FROM crm_companies c ${e}`,d),k=Number(j[0]?.n??0),{offset:l,pageSize:m,page:n,pageCount:o}=h(b.page,b.pageSize,k),p=function(a,b){let c=g.has(a)?f[a]:f.score;return`ORDER BY ${c} ${1===b?"ASC":"DESC"}, c.id DESC`}(b.sortKey,b.sortDir),[q]=await i.query(`SELECT c.*,
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
       LIMIT ? OFFSET ?`,[...d,m,l]);return{rows:q,total:k,page:n,pageCount:o}}async function J(a){await v();let b=t(),[c]=await b.query(`SELECT
       COALESCE(SUM(status = 'customer'), 0) AS customers,
       COALESCE(SUM(status = 'at_risk'), 0) AS at_risk,
       COALESCE(SUM(CASE WHEN status IN ('customer', 'at_risk') THEN annual_value ELSE 0 END), 0) AS arr
     FROM crm_companies WHERE organization_id = ?`,[a]),[d]=await b.query("SELECT COALESCE(SUM(value), 0) AS won FROM crm_deals WHERE organization_id = ? AND stage = 'won'",[a]);return{customers:Number(c[0]?.customers??0),atRisk:Number(c[0]?.at_risk??0),arr:Number(c[0]?.arr??0),won:Number(d[0]?.won??0)}}async function K(a,b){let c=b.filter(a=>Number.isInteger(a)).slice(0,500);if(!c.length)return;await v();let d=c.map(()=>"?").join(","),e=t();await e.query(`DELETE FROM crm_activities WHERE organization_id = ? AND company_id IN (${d})`,[a,...c]),await e.query(`DELETE FROM crm_deals WHERE organization_id = ? AND company_id IN (${d})`,[a,...c]),await e.query(`DELETE FROM crm_contacts WHERE organization_id = ? AND company_id IN (${d})`,[a,...c]),await e.query(`DELETE FROM crm_companies WHERE organization_id = ? AND id IN (${d})`,[a,...c])}async function L(a,b,c){let d=b.filter(a=>Number.isInteger(a)).slice(0,500);if(!d.length)return;await v();let e=d.map(()=>"?").join(",");await t().query(`UPDATE crm_companies SET status = ? WHERE organization_id = ? AND id IN (${e})`,[c.slice(0,20),a,...d])}async function M(a){await v();let[b]=await t().query(`SELECT c.id, c.name, c.website, c.email, c.vat_id, c.city, c.status, c.created_at,
       (SELECT COUNT(*) FROM crm_contacts ct WHERE ct.company_id = c.id AND ct.organization_id = c.organization_id) AS contact_count,
       (SELECT COUNT(*) FROM crm_deals d WHERE d.company_id = c.id AND d.organization_id = c.organization_id) AS deal_count,
       (SELECT COUNT(*) FROM crm_activities a WHERE a.company_id = c.id AND a.organization_id = c.organization_id) AS activity_count
     FROM crm_companies c WHERE c.organization_id = ? ORDER BY c.id ASC`,[a]);return b}async function N(a,b,c){if(!Number.isInteger(b)||!Number.isInteger(c)||b===c)return null;await v();let d=await t().getConnection();try{let[e]=await d.query("SELECT id FROM crm_companies WHERE organization_id = ? AND id IN (?, ?)",[a,b,c]);if(2!==e.length)return null;await d.beginTransaction();let f=async(e,f="company_id")=>{let[g]=await d.query(`UPDATE ${e} SET ${f} = ? WHERE ${f} = ? AND organization_id = ?`,[b,c,a]);return g.affectedRows},g=await f("crm_contacts"),h=await f("crm_deals"),i=await f("crm_activities"),j=await f("crm_quotes"),k=await f("crm_tasks"),l=await f("crm_meetings");return await f("crm_email_sends"),await f("crm_scheduled_emails"),await f("crm_sequence_enrollments"),await f("crm_leads","converted_company_id"),await d.query("UPDATE IGNORE crm_entity_tags SET entity_id = ? WHERE organization_id = ? AND entity_type = 'company' AND entity_id = ?",[b,a,c]),await d.query("DELETE FROM crm_entity_tags WHERE organization_id = ? AND entity_type = 'company' AND entity_id = ?",[a,c]),await d.query(`UPDATE crm_companies p JOIN crm_companies d ON d.id = ? AND d.organization_id = ?
         SET p.industry = IF(p.industry = '', d.industry, p.industry),
             p.city = IF(p.city = '', d.city, p.city),
             p.website = IF(p.website = '', d.website, p.website),
             p.account_manager = IF(p.account_manager = '', d.account_manager, p.account_manager),
             p.legal_name = IF(p.legal_name = '', d.legal_name, p.legal_name),
             p.phone = IF(p.phone = '', d.phone, p.phone),
             p.email = IF(p.email = '', d.email, p.email),
             p.country = IF(p.country = '', d.country, p.country),
             p.address = IF(p.address = '', d.address, p.address),
             p.vat_id = IF(p.vat_id = '', d.vat_id, p.vat_id),
             p.employees = COALESCE(p.employees, d.employees),
             p.annual_value = IF(p.annual_value = 0, d.annual_value, p.annual_value)
       WHERE p.id = ? AND p.organization_id = ?`,[c,a,b,a]),await d.query("DELETE FROM crm_companies WHERE id = ? AND organization_id = ?",[c,a]),await d.commit(),{contacts:g,deals:h,activities:i,quotes:j,tasks:k,meetings:l}}catch(a){throw await d.rollback().catch(()=>{}),a}finally{d.release()}}function O(a){return a.filter(a=>Number.isInteger(a)).slice(0,500)}async function P(a,b,c){let d=O(b);d.length&&(await v(),await t().query(`DELETE FROM crm_leads WHERE organization_id = ? AND id IN (${d.map(()=>"?").join(",")})${c?.sql??""}`,[a,...d,...c?.params??[]]))}async function Q(a,b,c,d){let e=O(b);e.length&&(await v(),await t().query(`UPDATE crm_leads SET status = ? WHERE organization_id = ? AND id IN (${e.map(()=>"?").join(",")})${d?.sql??""}`,[c.slice(0,20),a,...e,...d?.params??[]]))}async function R(a,b,c){let d=O(b);d.length&&(await v(),await t().query(`DELETE FROM crm_deals WHERE organization_id = ? AND id IN (${d.map(()=>"?").join(",")})${c?.sql??""}`,[a,...d,...c?.params??[]]))}async function S(a,b,c,d){let e=O(b);e.length&&(await v(),await t().query(`UPDATE crm_deals SET stage = ?, closed_at = NULL, loss_reason = '' WHERE organization_id = ? AND id IN (${e.map(()=>"?").join(",")})${d?.sql??""}`,[c.slice(0,20),a,...e,...d?.params??[]]))}async function T(a,b,c){await v();let[d]=await t().query(`INSERT INTO crm_contacts (organization_id, company_id, name, role, email, phone, department, influence, mobile, linkedin, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[a,b,c.name.slice(0,190),(c.role??"").slice(0,120),(c.email??"").slice(0,190),(c.phone??"").slice(0,60),(c.department??"").slice(0,60),(c.influence??"none").slice(0,20),(c.mobile??"").slice(0,40),(c.linkedin??"").slice(0,200),(c.notes??"").slice(0,2e3)]);return d.insertId}async function U(a,b){await v();let[c]=await t().query(`SELECT ct.*, COALESCE(co.name, '') AS company_name
       FROM crm_contacts ct
       LEFT JOIN crm_companies co ON co.id = ct.company_id AND co.organization_id = ct.organization_id
      WHERE ct.id = ? AND ct.organization_id = ? LIMIT 1`,[b,a]);return c[0]??null}async function V(a,b,c){await v(),await t().query(`UPDATE crm_contacts SET name=?, role=?, email=?, phone=?, department=?, influence=?, mobile=?, linkedin=?, notes=?
       WHERE id=? AND organization_id=?`,[c.name.slice(0,190),(c.role??"").slice(0,120),(c.email??"").slice(0,190),(c.phone??"").slice(0,60),(c.department??"").slice(0,60),(c.influence??"none").slice(0,20),(c.mobile??"").slice(0,40),(c.linkedin??"").slice(0,200),(c.notes??"").slice(0,2e3),b,a])}async function W(a,b,c=50){await v();let[d]=await t().query("SELECT * FROM crm_activities WHERE contact_id = ? AND organization_id = ? ORDER BY id DESC LIMIT ?",[b,a,c]);return d}async function X(a,b){await v();let[c]=await t().query("SELECT * FROM crm_contacts WHERE company_id = ? AND organization_id = ? ORDER BY id ASC",[b,a]);return c}async function Y(a,b){await v(),await t().query("DELETE FROM crm_contacts WHERE id = ? AND organization_id = ?",[b,a])}async function Z(a,b){await v();let c=["ct.organization_id = ?"],d=[a];if(b.q){c.push("(ct.name LIKE ? OR ct.email LIKE ? OR ct.role LIKE ? OR co.name LIKE ?)");let a=`%${b.q}%`;d.push(a,a,a,a)}b.influence&&(c.push("ct.influence = ?"),d.push(b.influence));let e="FROM crm_contacts ct JOIN crm_companies co ON co.id = ct.company_id AND co.organization_id = ct.organization_id",f=`WHERE ${c.join(" AND ")}`,g=t(),[k]=await g.query(`SELECT COUNT(*) AS n ${e} ${f}`,d),l=Number(k[0]?.n??0),{offset:m,pageSize:n,page:o,pageCount:p}=h(b.page,b.pageSize,l),q=function(a,b){let c=j.has(a)?i[a]:i.name;return`ORDER BY ${c} ${1===b?"ASC":"DESC"}, ct.id DESC`}(b.sortKey,b.sortDir),[r]=await g.query(`SELECT ct.*, co.name AS company_name ${e} ${f} ${q} LIMIT ? OFFSET ?`,[...d,n,m]);return{rows:r,total:l,page:o,pageCount:p}}async function $(a,b,c){await v();let[d]=await t().query(`INSERT INTO crm_deals (organization_id, company_id, title, value, stage, probability, expected_close, owner, owner_user_id, contact_id, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[a,b,c.title.slice(0,190),c.value??0,(c.stage??"new").slice(0,20),c.probability??null,c.expectedClose||null,(c.owner??"").slice(0,120),c.ownerUserId??null,c.contactId??null,(c.notes??"").slice(0,2e3)]);return d.insertId}async function _(a,b={}){await v();let c=b.ownerScope?.sql??"",d=b.ownerScope?.params??[];if(null!=b.companyId){let[e]=await t().query(`SELECT * FROM crm_deals WHERE organization_id = ? AND company_id = ?${c} ORDER BY updated_at DESC`,[a,b.companyId,...d]);return e}let[e]=await t().query(`SELECT * FROM crm_deals WHERE organization_id = ?${c} ORDER BY updated_at DESC LIMIT 1000`,[a,...d]);return e}async function aa(a,b,c){await v();let d=[],e=[];void 0!==c.title&&(d.push("title=?"),e.push(c.title.slice(0,190))),void 0!==c.value&&(d.push("value=?"),e.push(c.value)),void 0!==c.stage&&(d.push("stage=?"),e.push(c.stage.slice(0,20))),void 0!==c.probability&&(d.push("probability=?"),e.push(c.probability)),void 0!==c.expectedClose&&(d.push("expected_close=?"),e.push(c.expectedClose||null)),void 0!==c.owner&&(d.push("owner=?"),e.push(c.owner.slice(0,120))),void 0!==c.contactId&&(d.push("contact_id=?"),e.push(c.contactId??null)),void 0!==c.notes&&(d.push("notes=?"),e.push((c.notes??"").slice(0,2e3))),d.length&&(e.push(b,a),await t().query(`UPDATE crm_deals SET ${d.join(", ")} WHERE id = ? AND organization_id = ?`,e))}async function ab(a,b){await v();let[c]=await t().query(`SELECT d.*, COALESCE(co.name, '') AS company_name, ct.name AS contact_name
       FROM crm_deals d
       LEFT JOIN crm_companies co ON co.id = d.company_id AND co.organization_id = d.organization_id
       LEFT JOIN crm_contacts ct ON ct.id = d.contact_id AND ct.organization_id = d.organization_id
      WHERE d.id = ? AND d.organization_id = ? LIMIT 1`,[b,a]);return c[0]??null}async function ac(a,b,c=50){await v();let[d]=await t().query("SELECT * FROM crm_activities WHERE deal_id = ? AND organization_id = ? ORDER BY id DESC LIMIT ?",[b,a,c]);return d}async function ad(a,b,c){await v();let[d]=await t().query(`SELECT * FROM crm_deals WHERE contact_id = ? AND organization_id = ?${c?.sql??""} ORDER BY updated_at DESC LIMIT 50`,[b,a,...c?.params??[]]);return d}async function ae(a,b){await v();let c=await t().getConnection();try{await c.beginTransaction();let[d]=await c.query("SELECT company_id FROM crm_deals WHERE id = ? AND organization_id = ? FOR UPDATE",[b,a]),e=d[0];if(!e)return await c.rollback(),null;return await c.query("UPDATE crm_deals SET stage = 'won', probability = 100, closed_at = CURRENT_TIMESTAMP, loss_reason = '' WHERE id = ? AND organization_id = ?",[b,a]),await c.query("UPDATE crm_companies SET status = 'customer' WHERE id = ? AND organization_id = ? AND status <> 'customer'",[e.company_id,a]),await c.commit(),{companyId:e.company_id}}catch(a){throw await c.rollback(),a}finally{c.release()}}async function af(a,b,c){await v();let[d]=await t().query("SELECT company_id FROM crm_deals WHERE id = ? AND organization_id = ? LIMIT 1",[b,a]),e=d[0];return e?(await t().query("UPDATE crm_deals SET stage = 'lost', probability = 0, closed_at = CURRENT_TIMESTAMP, loss_reason = ? WHERE id = ? AND organization_id = ?",[c.slice(0,40),b,a]),{companyId:e.company_id}):null}async function ag(a,b,c){await v();let[d]=await t().query("SELECT company_id FROM crm_deals WHERE id = ? AND organization_id = ? LIMIT 1",[b,a]),e=d[0];return e?(await t().query("UPDATE crm_deals SET stage = ?, closed_at = NULL, loss_reason = '' WHERE id = ? AND organization_id = ?",[c.slice(0,20),b,a]),{companyId:e.company_id}):null}async function ah(a,b){await v(),await t().query("DELETE FROM crm_deals WHERE id = ? AND organization_id = ?",[b,a])}async function ai(a,b){await v();let c=["d.organization_id = ?"],d=[a];if(b.q){c.push("(d.title LIKE ? OR co.name LIKE ?)");let a=`%${b.q}%`;d.push(a,a)}b.stage&&(c.push("d.stage = ?"),d.push(b.stage));let e="FROM crm_deals d JOIN crm_companies co ON co.id = d.company_id AND co.organization_id = d.organization_id",f=`WHERE ${c.join(" AND ")}${b.ownerScope?.sql??""}`;b.ownerScope?.params.length&&d.push(...b.ownerScope.params);let g=t(),[i]=await g.query(`SELECT COUNT(*) AS n ${e} ${f}`,d),j=Number(i[0]?.n??0),{offset:k,pageSize:n,page:o,pageCount:p}=h(b.page,b.pageSize,j),q=function(a,b){let c=m.has(a)?l[a]:l.value;return`ORDER BY ${c} ${1===b?"ASC":"DESC"}, d.id DESC`}(b.sortKey,b.sortDir),[r]=await g.query(`SELECT d.*, co.name AS company_name ${e} ${f} ${q} LIMIT ? OFFSET ?`,[...d,n,k]);return{rows:r,total:j,page:o,pageCount:p}}async function aj(a,b){await v();let[c]=await t().query("INSERT INTO crm_activities (organization_id, company_id, contact_id, deal_id, type, summary) VALUES (?, ?, ?, ?, ?, ?)",[a,b.companyId,b.contactId??null,b.dealId??null,(b.type??"note").slice(0,20),b.summary.slice(0,500)]);return c.insertId}async function ak(a,b,c=50){await v();let[d]=await t().query("SELECT * FROM crm_activities WHERE company_id = ? AND organization_id = ? ORDER BY id DESC LIMIT ?",[b,a,c]);return d}async function al(a,b){await v();let c=["a.organization_id = ?"],d=[a];if(b.q){c.push("(a.summary LIKE ? OR co.name LIKE ?)");let a=`%${b.q}%`;d.push(a,a)}b.type&&(c.push("a.type = ?"),d.push(b.type)),b.sinceDays&&b.sinceDays>0&&c.push(`a.created_at >= DATE_SUB(NOW(), INTERVAL ${Math.floor(b.sinceDays)} DAY)`);let e="FROM crm_activities a JOIN crm_companies co ON co.id = a.company_id AND co.organization_id = a.organization_id",f=`WHERE ${c.join(" AND ")}`,g=t(),[i]=await g.query(`SELECT COUNT(*) AS n ${e} ${f}`,d),j=Number(i[0]?.n??0),{offset:k,pageSize:l,page:m,pageCount:n}=h(b.page,b.pageSize,j),q=function(a,b){let c=p.has(a)?o[a]:o.created;return`ORDER BY ${c} ${1===b?"ASC":"DESC"}, a.id DESC`}(b.sortKey,b.sortDir),[r]=await g.query(`SELECT a.*, co.name AS company_name ${e} ${f} ${q} LIMIT ? OFFSET ?`,[...d,l,k]);return{rows:r,total:j,page:m,pageCount:n}}async function am(a,b){await v(),await t().query("DELETE FROM crm_activities WHERE id = ? AND organization_id = ?",[b,a])}function an(a){return(0,e.DY)({hasWebsite:!!(a.website??"").trim(),employees:a.employees??null,industryMatch:!!a.industryMatch,annualValue:a.annualValue??0})}async function ao(a,b){await v();let[c]=await t().query(`INSERT INTO crm_leads (organization_id, name, company, title, email, phone, source, status, industry, website, employees, annual_value, industry_match, lead_score, notes, priority, owner, owner_user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[a,b.name.slice(0,190),(b.company??"").slice(0,190),(b.title??"").slice(0,120),(b.email??"").slice(0,190),(b.phone??"").slice(0,60),(b.source??"other").slice(0,30),(b.status??"new").slice(0,20),(b.industry??"").slice(0,120),(b.website??"").slice(0,300),b.employees??null,b.annualValue??0,+!!b.industryMatch,an(b),(b.notes??"").slice(0,500),(b.priority??"normal").slice(0,12),(b.owner??"").slice(0,120),b.ownerUserId??null]);return c.insertId}async function ap(a,b){await v();let[c]=await t().query("SELECT * FROM crm_leads WHERE id = ? AND organization_id = ? LIMIT 1",[b,a]);return c[0]??null}async function aq(a,b,c){await v(),await t().query(`UPDATE crm_leads SET name=?, company=?, title=?, email=?, phone=?, source=?, industry=?, website=?, employees=?, annual_value=?, industry_match=?, lead_score=?, notes=?, priority=?, owner=?
       WHERE id=? AND organization_id=?`,[c.name.slice(0,190),(c.company??"").slice(0,190),(c.title??"").slice(0,120),(c.email??"").slice(0,190),(c.phone??"").slice(0,60),(c.source??"other").slice(0,30),(c.industry??"").slice(0,120),(c.website??"").slice(0,300),c.employees??null,c.annualValue??0,+!!c.industryMatch,an(c),(c.notes??"").slice(0,500),(c.priority??"normal").slice(0,12),(c.owner??"").slice(0,120),b,a])}async function ar(a,b){await v();let c=["l.organization_id = ?"],d=[a];if(b.q){c.push("(l.name LIKE ? OR l.company LIKE ? OR l.email LIKE ?)");let a=`%${b.q}%`;d.push(a,a,a)}b.status&&(c.push("l.status = ?"),d.push(b.status)),b.source&&(c.push("l.source = ?"),d.push(b.source));let e=`WHERE ${c.join(" AND ")}${b.ownerScope?.sql??""}`;b.ownerScope?.params.length&&d.push(...b.ownerScope.params);let f=t(),[g]=await f.query(`SELECT COUNT(*) AS n FROM crm_leads l ${e}`,d),i=Number(g[0]?.n??0),{offset:j,pageSize:l,page:m,pageCount:n}=h(b.page,b.pageSize,i),o=(0,k.Oj)(b.sortKey,b.sortDir),[p]=await f.query(`SELECT l.* FROM crm_leads l ${e} ${o} LIMIT ? OFFSET ?`,[...d,l,j]);return{rows:p,total:i,page:m,pageCount:n}}async function as(a,b,c){await v(),await t().query("UPDATE crm_leads SET status = ? WHERE id = ? AND organization_id = ?",[c.slice(0,20),b,a])}async function at(a,b){await v(),await t().query("DELETE FROM crm_leads WHERE id = ? AND organization_id = ?",[b,a])}async function au(a,b,c={}){await v();let d=await t().getConnection();try{await d.beginTransaction();let[e]=await d.query("SELECT * FROM crm_leads WHERE id = ? AND organization_id = ? FOR UPDATE",[b,a]),f=e[0];if(!f)return await d.rollback(),null;if(f.converted_company_id)return await d.commit(),{companyId:f.converted_company_id,dealId:null,createdCompany:!1};let g=0;if(c.companyId){let[b]=await d.query("SELECT id FROM crm_companies WHERE id = ? AND organization_id = ? LIMIT 1",[c.companyId,a]);b[0]&&(g=Number(b[0].id))}let h=0===g;if(h){let b=an({website:f.website,employees:f.employees,industryMatch:!!f.industry_match,annualValue:f.annual_value}),[c]=await d.query(`INSERT INTO crm_companies (organization_id, name, industry, city, website, employees, annual_value, status, account_manager, industry_match, lead_score)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'active', '', ?, ?)`,[a,(f.company||f.name).slice(0,190),f.industry.slice(0,120),"",f.website.slice(0,300),f.employees,f.annual_value,f.industry_match,b]);g=c.insertId}if(f.name.trim()){let b=!1;if(f.email.trim()){let[c]=await d.query("SELECT id FROM crm_contacts WHERE company_id = ? AND organization_id = ? AND email = ? LIMIT 1",[g,a,f.email]);b=!!c[0]}b||await d.query(`INSERT INTO crm_contacts (organization_id, company_id, name, role, email, phone, department, influence)
             VALUES (?, ?, ?, ?, ?, ?, '', 'none')`,[a,g,f.name.slice(0,190),f.title.slice(0,120),f.email.slice(0,190),f.phone.slice(0,60)])}let i=null;if(c.deal&&c.deal.title.trim()){let[b]=await d.query("INSERT INTO crm_deals (organization_id, company_id, title, value, stage, probability, expected_close, owner) VALUES (?, ?, ?, ?, ?, NULL, NULL, '')",[a,g,c.deal.title.slice(0,190),c.deal.value??0,(c.deal.stage??"new").slice(0,20)]);i=b.insertId}return await d.query("UPDATE crm_leads SET status = 'converted', converted_company_id = ? WHERE id = ? AND organization_id = ?",[g,b,a]),await d.commit(),{companyId:g,dealId:i,createdCompany:h}}catch(a){throw await d.rollback(),a}finally{d.release()}}async function av(a,b){await v();let[c]=await t().query("INSERT INTO crm_tasks (organization_id, company_id, title, notes, due_date, priority) VALUES (?, ?, ?, ?, ?, ?)",[a,b.companyId??null,b.title.slice(0,300),(b.notes??"").slice(0,500),b.dueDate||null,(b.priority??"normal").slice(0,10)]);return c.insertId}async function aw(a,b){await v();let c=["t.organization_id = ?"],d=[a];b.q&&(c.push("t.title LIKE ?"),d.push(`%${b.q}%`)),void 0!==b.done&&(c.push("t.done = ?"),d.push(+!!b.done)),b.priority&&(c.push("t.priority = ?"),d.push(b.priority)),"overdue"===b.due?c.push("t.due_date IS NOT NULL AND t.due_date < CURDATE()"):"today"===b.due?c.push("t.due_date = CURDATE()"):"week"===b.due&&c.push("t.due_date IS NOT NULL AND t.due_date >= CURDATE() AND t.due_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)");let e="FROM crm_tasks t LEFT JOIN crm_companies co ON co.id = t.company_id AND co.organization_id = t.organization_id",f=`WHERE ${c.join(" AND ")}`,g=t(),[i]=await g.query(`SELECT COUNT(*) AS n ${e} ${f}`,d),j=Number(i[0]?.n??0),{offset:k,pageSize:l,page:m,pageCount:o}=h(b.page,b.pageSize,j),p=(0,n.Xe)(b.sortKey,b.sortDir),[q]=await g.query(`SELECT t.*, co.name AS company_name ${e} ${f} ${p} LIMIT ? OFFSET ?`,[...d,l,k]);return{rows:q,total:j,page:m,pageCount:o}}async function ax(a,b,c){await v(),await t().query("UPDATE crm_tasks SET done = ? WHERE id = ? AND organization_id = ?",[+!!c,b,a])}async function ay(a,b,c){await v();let d=[],e=[];void 0!==c.title&&(d.push("title=?"),e.push(c.title.slice(0,300))),void 0!==c.notes&&(d.push("notes=?"),e.push((c.notes??"").slice(0,500))),void 0!==c.dueDate&&(d.push("due_date=?"),e.push(c.dueDate||null)),void 0!==c.priority&&(d.push("priority=?"),e.push(c.priority.slice(0,10))),d.length&&(e.push(b,a),await t().query(`UPDATE crm_tasks SET ${d.join(", ")} WHERE id = ? AND organization_id = ?`,e))}async function az(a,b){await v(),await t().query("DELETE FROM crm_tasks WHERE id = ? AND organization_id = ?",[b,a])}async function aA(a,b){await v();let[c]=await t().query("INSERT INTO crm_products (organization_id, name, sku, description, price_cents, billing, active) VALUES (?, ?, ?, ?, ?, ?, ?)",[a,b.name.slice(0,190),(b.sku??"").slice(0,60),(b.description??"").slice(0,500),Math.max(0,Math.round(b.priceCents??0)),(b.billing??"onetime").slice(0,20),+(!1!==b.active)]);return c.insertId}async function aB(a,b,c){await v(),await t().query("UPDATE crm_products SET name=?, sku=?, description=?, price_cents=?, billing=?, active=? WHERE id=? AND organization_id=?",[c.name.slice(0,190),(c.sku??"").slice(0,60),(c.description??"").slice(0,500),Math.max(0,Math.round(c.priceCents??0)),(c.billing??"onetime").slice(0,20),+(!1!==c.active),b,a])}async function aC(a,b,c){await v(),await t().query("UPDATE crm_products SET active = ? WHERE id = ? AND organization_id = ?",[+!!c,b,a])}async function aD(a,b){await v(),await t().query("DELETE FROM crm_products WHERE id = ? AND organization_id = ?",[b,a])}async function aE(a,b){await v();let c=["p.organization_id = ?"],d=[a];if(b.q){c.push("(p.name LIKE ? OR p.sku LIKE ?)");let a=`%${b.q}%`;d.push(a,a)}void 0!==b.active&&(c.push("p.active = ?"),d.push(+!!b.active)),b.billing&&(c.push("p.billing = ?"),d.push(b.billing));let e=`WHERE ${c.join(" AND ")}`,f=t(),[g]=await f.query(`SELECT COUNT(*) AS n FROM crm_products p ${e}`,d),i=Number(g[0]?.n??0),{offset:j,pageSize:k,page:l,pageCount:m}=h(b.page,b.pageSize,i),n=(0,q.Rr)(b.sortKey,b.sortDir),[o]=await f.query(`SELECT p.*, (SELECT COUNT(*) FROM crm_quote_items qi WHERE qi.product_id = p.id AND qi.organization_id = p.organization_id) AS quote_uses
       FROM crm_products p ${e} ${n} LIMIT ? OFFSET ?`,[...d,k,j]);return{rows:o,total:i,page:l,pageCount:m}}async function aF(a,b){await v();let[c]=await t().query("SELECT * FROM crm_products WHERE id = ? AND organization_id = ? LIMIT 1",[b,a]),d=c[0];return d?aA(a,{name:`${d.name} (copy)`.slice(0,190),sku:d.sku,description:d.description,priceCents:d.price_cents,billing:d.billing,active:!0}):null}async function aG(a,b,c={}){await v();let[d]=await t().query("INSERT INTO crm_quotes (organization_id, company_id, notes, valid_until) VALUES (?, ?, ?, ?)",[a,b,(c.notes??"").slice(0,500),c.validUntil||null]);return d.insertId}async function aH(a,b){await v();let c=await aJ(a,b);if(!c)return null;let d=await aG(a,c.quote.company_id,{notes:c.quote.notes,validUntil:null});for(let b of c.items)await aO(a,d,{productId:b.product_id,name:b.name,unitPriceCents:b.unit_price_cents,quantity:b.quantity});return d}async function aI(a,b){await v();let c=["q.organization_id = ?"],d=[a];b.q&&(c.push("co.name LIKE ?"),d.push(`%${b.q}%`)),b.status&&(c.push("q.status = ?"),d.push(b.status));let e="FROM crm_quotes q JOIN crm_companies co ON co.id = q.company_id AND co.organization_id = q.organization_id",f=`WHERE ${c.join(" AND ")}`,g=t(),[i]=await g.query(`SELECT COUNT(*) AS n ${e} ${f}`,d),j=Number(i[0]?.n??0),{offset:k,pageSize:l,page:m,pageCount:n}=h(b.page,b.pageSize,j),o=(0,r.ar)(b.sortKey,b.sortDir),[p]=await g.query(`SELECT q.*, co.name AS company_name ${e} ${f} ${o} LIMIT ? OFFSET ?`,[...d,l,k]);return{rows:p,total:j,page:m,pageCount:n}}async function aJ(a,b){await v();let c=t(),[d]=await c.query("SELECT q.*, co.name AS company_name FROM crm_quotes q JOIN crm_companies co ON co.id = q.company_id AND co.organization_id = q.organization_id WHERE q.id = ? AND q.organization_id = ? LIMIT 1",[b,a]),e=d[0];if(!e)return null;let[f]=await c.query("SELECT * FROM crm_quote_items WHERE quote_id = ? AND organization_id = ? ORDER BY id ASC",[b,a]);return{quote:e,items:f}}async function aK(a,b,c){await v();let d=[],e=[];void 0!==c.status&&(d.push("status=?"),e.push(c.status.slice(0,20))),void 0!==c.notes&&(d.push("notes=?"),e.push(c.notes.slice(0,500))),void 0!==c.validUntil&&(d.push("valid_until=?"),e.push(c.validUntil||null)),d.length&&(e.push(b,a),await t().query(`UPDATE crm_quotes SET ${d.join(", ")} WHERE id = ? AND organization_id = ?`,e))}async function aL(a,b){await v();let c=t();await c.query("DELETE FROM crm_quote_items WHERE quote_id = ? AND organization_id = ?",[b,a]),await c.query("DELETE FROM crm_quotes WHERE id = ? AND organization_id = ?",[b,a])}async function aM(a,b,c){await v();let d=t(),[e]=await d.query("SELECT public_token FROM crm_quotes WHERE id = ? AND organization_id = ? LIMIT 1",[b,a]),f=e[0];if(!f)return null;let g=f.public_token||c.slice(0,64);return await d.query("UPDATE crm_quotes SET public_token = ?, status = IF(status = 'draft', 'sent', status), sent_at = COALESCE(sent_at, CURRENT_TIMESTAMP) WHERE id = ? AND organization_id = ?",[g,b,a]),g}async function aN(a,b){await t().query("UPDATE crm_quotes SET total_cents = (SELECT COALESCE(SUM(line_total_cents), 0) FROM crm_quote_items WHERE quote_id = ? AND organization_id = ?) WHERE id = ? AND organization_id = ?",[b,a,b,a])}async function aO(a,b,c){await v();let d=Math.max(1,Math.round(c.quantity||1)),e=Math.max(0,Math.round(c.unitPriceCents||0));await t().query("INSERT INTO crm_quote_items (organization_id, quote_id, product_id, name, unit_price_cents, quantity, line_total_cents) VALUES (?, ?, ?, ?, ?, ?, ?)",[a,b,c.productId??null,c.name.slice(0,190),e,d,d*e]),await aN(a,b)}async function aP(a,b,c,d){await v();let e=Math.max(1,Math.round(d));await t().query("UPDATE crm_quote_items SET quantity = ?, line_total_cents = unit_price_cents * ? WHERE id = ? AND quote_id = ? AND organization_id = ?",[e,e,c,b,a]),await aN(a,b)}async function aQ(a,b,c){await v(),await t().query("DELETE FROM crm_quote_items WHERE id = ? AND quote_id = ? AND organization_id = ?",[c,b,a]),await aN(a,b)}async function aR(a,b){await v();let c=`%${b}%`,[d]=await t().query("SELECT * FROM crm_products WHERE organization_id = ? AND active = 1 AND (name LIKE ? OR sku LIKE ?) ORDER BY name ASC LIMIT 8",[a,c,c]);return d}async function aS(a,b){await v();let[c]=await t().query(a,[b]);return c.map(a=>({status:String(a.k),n:Number(a.n),value:Number(a.v??0)}))}let aT=a=>aS("SELECT status AS k, COUNT(*) AS n, COALESCE(SUM(annual_value),0) AS v FROM crm_companies WHERE organization_id = ? GROUP BY status",a),aU=a=>aS("SELECT stage AS k, COUNT(*) AS n, COALESCE(SUM(value),0) AS v FROM crm_deals WHERE organization_id = ? GROUP BY stage",a),aV=a=>aS("SELECT status AS k, COUNT(*) AS n FROM crm_leads WHERE organization_id = ? GROUP BY status",a),aW=a=>aS("SELECT source AS k, COUNT(*) AS n FROM crm_leads WHERE organization_id = ? GROUP BY source",a),aX=a=>aS("SELECT type AS k, COUNT(*) AS n FROM crm_activities WHERE organization_id = ? GROUP BY type",a),aY=a=>aS("SELECT status AS k, COUNT(*) AS n, COALESCE(SUM(total_cents),0) AS v FROM crm_quotes WHERE organization_id = ? GROUP BY status",a);async function aZ(a){await v();let[b]=await t().query(`SELECT COALESCE(NULLIF(owner, ''), 'Unassigned') AS owner,
       COALESCE(SUM(CASE WHEN stage = 'won' THEN value ELSE 0 END), 0) AS won,
       COALESCE(SUM(CASE WHEN stage NOT IN ('won','lost') THEN value ELSE 0 END), 0) AS open,
       COALESCE(SUM(CASE WHEN stage = 'won' THEN 1 ELSE 0 END), 0) AS won_n,
       COALESCE(SUM(CASE WHEN stage = 'lost' THEN 1 ELSE 0 END), 0) AS lost_n,
       COUNT(*) AS n
     FROM crm_deals WHERE organization_id = ? GROUP BY owner ORDER BY won DESC, open DESC LIMIT 20`,[a]);return b.map(a=>({owner:String(a.owner),won:Number(a.won),open:Number(a.open),n:Number(a.n),wonCount:Number(a.won_n),lostCount:Number(a.lost_n)}))}async function a$(a){await v();let[b]=await t().query(`SELECT DATE_FORMAT(expected_close, '%Y-%m') AS month, stage, COALESCE(SUM(value),0) AS value
     FROM crm_deals
     WHERE organization_id = ? AND stage NOT IN ('won','lost') AND expected_close IS NOT NULL
     GROUP BY month, stage ORDER BY month ASC`,[a]);return b.map(a=>({month:String(a.month),stage:String(a.stage),value:Number(a.value)}))}async function a_(a){await v();let[b]=await t().query("SELECT COUNT(*) AS n FROM crm_activities WHERE organization_id = ? AND created_at >= NOW() - INTERVAL 30 DAY",[a]);return Number(b[0]?.n??0)}let a0="DATE_SUB(DATE_FORMAT(NOW(),'%Y-%m-01'), INTERVAL 11 MONTH)";async function a1(a,b){await v();let[c]=await t().query(a,[b]);return c.map(a=>({month:String(a.month),n:Number(a.n),v:Number(a.v??0)}))}let a2=a=>a1(`SELECT DATE_FORMAT(closed_at,'%Y-%m') AS month, COUNT(*) AS n, COALESCE(SUM(value),0) AS v
     FROM crm_deals WHERE organization_id = ? AND stage = 'won' AND closed_at IS NOT NULL AND closed_at >= ${a0}
     GROUP BY month ORDER BY month ASC`,a),a3=a=>a1(`SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, COUNT(*) AS n
     FROM crm_activities WHERE organization_id = ? AND created_at >= ${a0}
     GROUP BY month ORDER BY month ASC`,a),a4=a=>a1(`SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, COUNT(*) AS n
     FROM crm_leads WHERE organization_id = ? AND created_at >= ${a0}
     GROUP BY month ORDER BY month ASC`,a),a5=a=>a1(`SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, COUNT(*) AS n, COALESCE(SUM(value),0) AS v
     FROM crm_deals WHERE organization_id = ? AND created_at >= ${a0}
     GROUP BY month ORDER BY month ASC`,a);async function a6(a,b){await v();let[c]=await t().query(`SELECT d.id, d.title, d.value, d.stage, co.name AS company_name
     FROM crm_deals d JOIN crm_companies co ON co.id = d.company_id AND co.organization_id = d.organization_id
     WHERE d.organization_id = ? AND d.stage NOT IN ('won','lost')
     ORDER BY d.value DESC LIMIT ?`,[a,Number(b)||8]);return c.map(a=>({id:Number(a.id),title:String(a.title),companyName:String(a.company_name),value:Number(a.value),stage:String(a.stage)}))}async function a7(a,b,c){await v();let d=Number(b)||30,[e]=await t().query(`SELECT c.id, c.name,
       DATEDIFF(NOW(), (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.company_id = c.id)) AS last_days
     FROM crm_companies c
     WHERE c.organization_id = ? AND c.status IN ('customer','at_risk')
       AND ((SELECT MAX(a.created_at) FROM crm_activities a WHERE a.company_id = c.id) IS NULL
            OR (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.company_id = c.id) < NOW() - INTERVAL ${d} DAY)
     ORDER BY last_days IS NULL DESC, last_days DESC LIMIT ?`,[a,Number(c)||5]);return e.map(a=>({id:Number(a.id),name:String(a.name),lastDays:null==a.last_days?null:Number(a.last_days)}))}async function a8(a,b){await v();let[c]=await t().query(`SELECT d.id, d.company_id, d.title, co.name AS company_name, DATEDIFF(NOW(), d.expected_close) AS days
     FROM crm_deals d JOIN crm_companies co ON co.id = d.company_id AND co.organization_id = d.organization_id
     WHERE d.organization_id = ? AND d.stage NOT IN ('won','lost') AND d.expected_close IS NOT NULL AND d.expected_close < CURDATE()
     ORDER BY d.expected_close ASC LIMIT ?`,[a,Number(b)||5]);return c.map(a=>({id:Number(a.id),companyId:Number(a.company_id),companyName:String(a.company_name),title:String(a.title),days:Number(a.days)}))}async function a9(a,b,c){await v();let d=Number(b)||60,[e]=await t().query(`SELECT id, name, company, lead_score FROM crm_leads
     WHERE organization_id = ? AND status IN ('new','working') AND lead_score >= ${d}
     ORDER BY lead_score DESC LIMIT ?`,[a,Number(c)||5]);return e.map(a=>({id:Number(a.id),name:String(a.name),company:String(a.company),score:Number(a.lead_score)}))}async function ba(a,b,c){await v();let d=Number(b)||7,[e]=await t().query(`SELECT q.id, co.name AS company_name, DATEDIFF(NOW(), q.created_at) AS days
     FROM crm_quotes q JOIN crm_companies co ON co.id = q.company_id AND co.organization_id = q.organization_id
     WHERE q.organization_id = ? AND q.status = 'sent' AND q.created_at < NOW() - INTERVAL ${d} DAY
     ORDER BY q.created_at ASC LIMIT ?`,[a,Number(c)||5]);return e.map(a=>({id:Number(a.id),companyName:String(a.company_name),days:Number(a.days)}))}async function bb(a,b,c){await v();let d=Number(b)||14,[e]=await t().query(`SELECT d.id, d.company_id, d.title, co.name AS company_name,
            DATEDIFF(NOW(), (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.deal_id = d.id)) AS idle_days
     FROM crm_deals d JOIN crm_companies co ON co.id = d.company_id AND co.organization_id = d.organization_id
     WHERE d.organization_id = ? AND d.stage NOT IN ('won','lost') AND d.created_at < NOW() - INTERVAL ${d} DAY
       AND ((SELECT MAX(a.created_at) FROM crm_activities a WHERE a.deal_id = d.id) IS NULL
            OR (SELECT MAX(a.created_at) FROM crm_activities a WHERE a.deal_id = d.id) < NOW() - INTERVAL ${d} DAY)
     ORDER BY idle_days IS NULL DESC, idle_days DESC LIMIT ?`,[a,Number(c)||5]);return e.map(a=>({id:Number(a.id),companyId:Number(a.company_id),companyName:String(a.company_name),title:String(a.title),idleDays:null==a.idle_days?null:Number(a.idle_days)}))}async function bc(a,b,c){await v();let d=Number(b)||7,[e]=await t().query(`SELECT co.id, co.name, DATEDIFF(NOW(), MAX(d.closed_at)) AS days
     FROM crm_companies co JOIN crm_deals d ON d.company_id = co.id AND d.organization_id = co.organization_id
     WHERE co.organization_id = ? AND d.stage = 'won' AND d.closed_at IS NOT NULL AND d.closed_at >= NOW() - INTERVAL ${d} DAY
     GROUP BY co.id, co.name
     ORDER BY MAX(d.closed_at) DESC LIMIT ?`,[a,Number(c)||5]);return e.map(a=>({id:Number(a.id),name:String(a.name),days:Number(a.days)}))}async function bd(a){await v();let[b]=await t().query("SELECT * FROM crm_automations WHERE organization_id = ? ORDER BY id ASC",[a]);return b}async function be(a){await v();let[b]=await t().query("SELECT * FROM crm_automations WHERE organization_id = ? AND enabled = 1 ORDER BY id ASC",[a]);return b}async function bf(a,b){await v();let[c]=await t().query("SELECT * FROM crm_automations WHERE id = ? AND organization_id = ? LIMIT 1",[b,a]);return c[0]??null}async function bg(a,b){await v();let[c]=await t().query("INSERT INTO crm_automations (organization_id, template_key, name, params) VALUES (?, ?, ?, ?)",[a,b.templateKey.slice(0,40),b.name.slice(0,190),JSON.stringify(b.params??{})]);return c.insertId}async function bh(a,b,c){await v(),await t().query("UPDATE crm_automations SET enabled = ? WHERE id = ? AND organization_id = ?",[+!!c,b,a])}async function bi(a,b){await v(),await t().query("DELETE FROM crm_automations WHERE id = ? AND organization_id = ?",[b,a])}async function bj(a,b,c,d){await v();let e=t();await e.query("INSERT INTO crm_automation_runs (organization_id, automation_id, created_count, summary) VALUES (?, ?, ?, ?)",[a,b,c,d.slice(0,255)]),await e.query("UPDATE crm_automations SET last_run_at = CURRENT_TIMESTAMP, created_count = created_count + ? WHERE id = ? AND organization_id = ?",[c,b,a])}async function bk(a,b=50){await v();let[c]=await t().query(`SELECT r.*, COALESCE(a.name, 'Automation') AS name FROM crm_automation_runs r
     LEFT JOIN crm_automations a ON a.id = r.automation_id AND a.organization_id = r.organization_id
     WHERE r.organization_id = ? ORDER BY r.id DESC LIMIT ?`,[a,b]);return c}async function bl(a,b){await v();let[c]=await t().query("SELECT 1 FROM crm_tasks WHERE organization_id = ? AND title = ? AND done = 0 LIMIT 1",[a,b]);return c.length>0}function bm(){return s.__crmAuthSchema||(s.__crmAuthSchema=(async()=>{let a=t();await a.query(`
        CREATE TABLE IF NOT EXISTS crm_organizations (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(190) NOT NULL DEFAULT '',
          slug VARCHAR(120) NOT NULL DEFAULT '',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_org_slug (slug)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
      `),await u(a,"crm_organizations","plan","plan VARCHAR(24) NOT NULL DEFAULT 'pro'"),await u(a,"crm_organizations","billing_email","billing_email VARCHAR(190) NOT NULL DEFAULT ''"),await u(a,"crm_organizations","billing_name","billing_name VARCHAR(190) NOT NULL DEFAULT ''"),await u(a,"crm_organizations","billing_address","billing_address VARCHAR(500) NOT NULL DEFAULT ''"),await u(a,"crm_organizations","tax_id","tax_id VARCHAR(40) NOT NULL DEFAULT ''"),await u(a,"crm_organizations","api_frozen","api_frozen TINYINT NOT NULL DEFAULT 0"),await u(a,"crm_organizations","ai_paused","ai_paused TINYINT NOT NULL DEFAULT 0"),await u(a,"crm_organizations","automations_paused","automations_paused TINYINT NOT NULL DEFAULT 0"),await u(a,"crm_organizations","restrict_member_visibility","restrict_member_visibility TINYINT NOT NULL DEFAULT 0"),await u(a,"crm_organizations","require_admin_mfa","require_admin_mfa TINYINT NOT NULL DEFAULT 0"),await a.query(`
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
      `),await u(a,"crm_email_sends","enrollment_id","enrollment_id BIGINT UNSIGNED NULL")})().catch(a=>{throw s.__crmAuthSchema=void 0,a})),s.__crmAuthSchema}async function bn(a){await bm();let[b]=await t().query("SELECT api_frozen, ai_paused, automations_paused, restrict_member_visibility, require_admin_mfa FROM crm_organizations WHERE id = ? LIMIT 1",[a]),c=b[0];return{apiFrozen:!!c?.api_frozen,aiPaused:!!c?.ai_paused,automationsPaused:!!c?.automations_paused,restrictMembers:!!c?.restrict_member_visibility,requireAdminMfa:!!c?.require_admin_mfa}}async function bo(a,b){await bm();let[c]=await t().query(`INSERT INTO crm_security_alerts (organization_id, type, severity, message, actor_email, meta)
       VALUES (?, ?, ?, ?, ?, ?)`,[a,b.type.slice(0,40),b.severity.slice(0,10),cE(b.message).slice(0,300),cE(b.actorEmail??"").slice(0,190),cE(b.meta??"").slice(0,500)]);return c.insertId}async function bp(a){await bm();let[b]=await t().query("SELECT security_webhook_url FROM crm_organizations WHERE id = ? LIMIT 1",[a]);return String(b[0]?.security_webhook_url??"")}async function bq(a){await bm();let[b]=await t().query("SELECT * FROM crm_email_settings WHERE organization_id = ? LIMIT 1",[a]);return b[0]??null}async function br(a,b){await bm();let c=null===b.passwordEnc?"":", password_enc = VALUES(password_enc)";await t().query(`INSERT INTO crm_email_settings (organization_id, host, port, secure, username, password_enc, from_name, from_email, enabled, imap_host, imap_port)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE host = VALUES(host), port = VALUES(port), secure = VALUES(secure),
       username = VALUES(username)${c}, from_name = VALUES(from_name), from_email = VALUES(from_email), enabled = VALUES(enabled),
       imap_host = VALUES(imap_host), imap_port = VALUES(imap_port)`,[a,b.host.slice(0,190),b.port,+!!b.secure,b.username.slice(0,190),(b.passwordEnc??"").slice(0,1024),b.fromName.slice(0,120),b.fromEmail.slice(0,190),+!!b.enabled,b.imapHost.slice(0,190),b.imapPort])}async function bs(a){await bm();let[b]=await t().query("SELECT * FROM crm_email_templates WHERE organization_id = ? ORDER BY name ASC, id ASC",[a]);return b}async function bt(a,b){await bm();let[c]=await t().query("INSERT INTO crm_email_templates (organization_id, name, subject, body, created_by) VALUES (?, ?, ?, ?, ?)",[a,b.name.slice(0,120),b.subject.slice(0,300),b.body.slice(0,2e4),b.createdBy.slice(0,190)]);return c.insertId}async function bu(a,b,c){await bm(),await t().query("UPDATE crm_email_templates SET name = ?, subject = ?, body = ? WHERE id = ? AND organization_id = ?",[c.name.slice(0,120),c.subject.slice(0,300),c.body.slice(0,2e4),b,a])}async function bv(a,b){await bm(),await t().query("DELETE FROM crm_email_templates WHERE id = ? AND organization_id = ?",[b,a])}async function bw(a,b){await bm(),await t().query(`INSERT INTO crm_email_sends (organization_id, token, contact_id, company_id, deal_id, to_email, subject, sent_by, enrollment_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,[a,b.token.slice(0,48),b.contactId??null,b.companyId??null,b.dealId??null,b.toEmail.slice(0,190),b.subject.slice(0,300),b.sentBy.slice(0,190),b.enrollmentId??null])}async function bx(a){await bm();let[b]=await t().query(`SELECT COUNT(*) AS sent_all,
            COALESCE(SUM(opened_at IS NOT NULL), 0) AS opened_all,
            COALESCE(SUM(sent_at >= (NOW() - INTERVAL 30 DAY)), 0) AS sent_30,
            COALESCE(SUM(sent_at >= (NOW() - INTERVAL 30 DAY) AND opened_at IS NOT NULL), 0) AS opened_30
       FROM crm_email_sends WHERE organization_id = ?`,[a]),c=b[0]??{};return{sentAll:Number(c.sent_all??0),openedAll:Number(c.opened_all??0),sent30:Number(c.sent_30??0),opened30:Number(c.opened_30??0)}}async function by(a){await bm();let[b]=await t().query(`SELECT sent_by AS rep, COUNT(*) AS sent, COALESCE(SUM(opened_at IS NOT NULL), 0) AS opened
       FROM crm_email_sends WHERE organization_id = ? GROUP BY sent_by ORDER BY sent DESC LIMIT 10`,[a]);return b.map(a=>({rep:String(a.rep??""),sent:Number(a.sent??0),opened:Number(a.opened??0)}))}async function bz(a,b=25){await bm(),await v();let[c]=await t().query(`SELECT s.id, s.to_email, s.subject, s.sent_by, s.sent_at, s.opened_at, s.open_count, s.company_id, co.name AS company_name
       FROM crm_email_sends s
       LEFT JOIN crm_companies co ON co.id = s.company_id AND co.organization_id = s.organization_id
      WHERE s.organization_id = ? ORDER BY s.id DESC LIMIT ?`,[a,Math.min(Math.max(b,1),100)]);return c}async function bA(a,b){await bm();let[c]=await t().query(`INSERT INTO crm_scheduled_emails (organization_id, scheduled_by, to_email, subject, body, contact_id, company_id, deal_id, track, send_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[a,b.scheduledBy.slice(0,190),b.toEmail.slice(0,190),b.subject.slice(0,300),b.body.slice(0,2e4),b.contactId??null,b.companyId??null,b.dealId??null,+!!b.track,b.sendAt]);return c.insertId}async function bB(a,b=50){await bm();let[c]=await t().query(`SELECT * FROM crm_scheduled_emails WHERE organization_id = ?
       ORDER BY (status = 'pending') DESC, send_at ASC LIMIT ?`,[a,Math.min(Math.max(b,1),200)]);return c}async function bC(a,b){await bm(),await t().query("UPDATE crm_scheduled_emails SET status = 'canceled' WHERE id = ? AND organization_id = ? AND status = 'pending'",[b,a])}async function bD(a){await bm();let[b]=await t().query(`SELECT s.id, s.name, s.stop_on_open, s.created_by,
            (SELECT COUNT(*) FROM crm_sequence_steps st WHERE st.sequence_id = s.id) AS step_count,
            (SELECT COUNT(*) FROM crm_sequence_enrollments e WHERE e.sequence_id = s.id AND e.status = 'active') AS active_count,
            (SELECT COUNT(*) FROM crm_sequence_enrollments e WHERE e.sequence_id = s.id) AS total_enrolled
       FROM crm_sequences s WHERE s.organization_id = ? ORDER BY s.name ASC, s.id DESC`,[a]);return b}async function bE(a,b){await bm();let[c]=await t().query("SELECT * FROM crm_sequence_steps WHERE sequence_id = ? AND organization_id = ? ORDER BY step_order ASC",[b,a]);return c}async function bF(a,b){await bm();let[c]=await t().query("SELECT id, name, stop_on_open, created_by, 0 AS step_count, 0 AS active_count, 0 AS total_enrolled FROM crm_sequences WHERE id = ? AND organization_id = ? LIMIT 1",[b,a]);return c[0]??null}async function bG(a,b){await bm();let[c]=await t().query("INSERT INTO crm_sequences (organization_id, name, stop_on_open, created_by) VALUES (?, ?, ?, ?)",[a,b.name.slice(0,120),+!!b.stopOnOpen,b.createdBy.slice(0,190)]);return c.insertId}async function bH(a,b,c){await bm(),await t().query("UPDATE crm_sequences SET name = ?, stop_on_open = ? WHERE id = ? AND organization_id = ?",[c.name.slice(0,120),+!!c.stopOnOpen,b,a])}async function bI(a,b,c){await bm();let d=t();await d.query("DELETE FROM crm_sequence_steps WHERE sequence_id = ? AND organization_id = ?",[b,a]);for(let e=0;e<c.length;e++){let f=c[e];await d.query("INSERT INTO crm_sequence_steps (organization_id, sequence_id, step_order, delay_days, subject, body) VALUES (?, ?, ?, ?, ?, ?)",[a,b,e,Math.max(0,Math.min(365,0|f.delayDays)),f.subject.slice(0,300),f.body.slice(0,2e4)])}}async function bJ(a,b){await bm();let c=t();await c.query("DELETE FROM crm_sequence_steps WHERE sequence_id = ? AND organization_id = ?",[b,a]),await c.query("UPDATE crm_sequence_enrollments SET status = 'stopped' WHERE sequence_id = ? AND organization_id = ? AND status = 'active'",[b,a]),await c.query("DELETE FROM crm_sequences WHERE id = ? AND organization_id = ?",[b,a])}async function bK(a,b,c){await bm();let[d]=await t().query("SELECT 1 FROM crm_sequence_enrollments WHERE organization_id = ? AND sequence_id = ? AND contact_id = ? AND status = 'active' LIMIT 1",[a,b,c]);return d.length>0}async function bL(a,b){await bm();let[c]=await t().query(`INSERT INTO crm_sequence_enrollments (organization_id, sequence_id, contact_id, company_id, to_email, recipient_name, company_name, enrolled_by, current_step, next_send_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'active')`,[a,b.sequenceId,b.contactId??null,b.companyId??null,b.toEmail.slice(0,190),b.recipientName.slice(0,190),b.companyName.slice(0,190),b.enrolledBy.slice(0,190),b.nextSendAt]);return c.insertId}async function bM(a,b){await bm(),await t().query("UPDATE crm_sequence_enrollments SET status = 'stopped' WHERE id = ? AND organization_id = ? AND status = 'active'",[b,a])}async function bN(a,b){await bm();let[c]=await t().query(`SELECT e.id, e.sequence_id, e.status, e.current_step, s.name AS sequence_name
       FROM crm_sequence_enrollments e JOIN crm_sequences s ON s.id = e.sequence_id
      WHERE e.organization_id = ? AND e.contact_id = ? AND e.status = 'active' ORDER BY e.id DESC`,[a,b]);return c.map(a=>({id:a.id,sequenceId:a.sequence_id,sequenceName:String(a.sequence_name??""),status:a.status,currentStep:a.current_step}))}async function bO(a,b){await bm(),await t().query("INSERT INTO crm_notifications (organization_id, user_email, type, title, href) VALUES (?, ?, ?, ?, ?)",[a,b.userEmail??null,b.type.slice(0,40),b.title.slice(0,300),(b.href??"").slice(0,300)])}async function bP(a,b,c=20){await bm();let[d]=await t().query(`SELECT id, type, title, href, created_at FROM crm_notifications
      WHERE organization_id = ? AND (user_email IS NULL OR user_email = ?)
      ORDER BY id DESC LIMIT ?`,[a,b,Math.min(Math.max(c,1),100)]);return d}async function bQ(a,b,c){await bm();let[d]=await t().query(`SELECT COUNT(*) AS n FROM crm_notifications
      WHERE organization_id = ? AND (user_email IS NULL OR user_email = ?) AND created_at > COALESCE(?, '1970-01-01 00:00:00')`,[a,b,c]);return Number(d[0]?.n??0)}async function bR(a){await bm();let[b]=await t().query("SELECT notifications_seen_at FROM crm_users WHERE id = ? LIMIT 1",[a]);return b[0]?.notifications_seen_at??null}async function bS(a){await bm(),await t().query("UPDATE crm_users SET notifications_seen_at = CURRENT_TIMESTAMP WHERE id = ?",[a])}async function bT(a,b){await bm();let[c]=await t().query(`INSERT INTO crm_meetings (organization_id, title, starts_at, duration_min, company_id, contact_id, deal_id, location, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[a,b.title.slice(0,200),b.startsAt,b.durationMin,b.companyId??null,b.contactId??null,b.dealId??null,b.location.slice(0,200),b.notes.slice(0,5e3),b.createdBy.slice(0,190)]);return c.insertId}async function bU(a,b,c){await bm(),await t().query("UPDATE crm_meetings SET title=?, starts_at=?, duration_min=?, company_id=?, contact_id=?, deal_id=?, location=?, notes=? WHERE id=? AND organization_id=?",[c.title.slice(0,200),c.startsAt,c.durationMin,c.companyId??null,c.contactId??null,c.dealId??null,c.location.slice(0,200),c.notes.slice(0,5e3),b,a])}async function bV(a,b){await bm(),await t().query("DELETE FROM crm_meetings WHERE id = ? AND organization_id = ?",[b,a])}let bW=`SELECT m.id, m.title, m.starts_at, m.duration_min, m.company_id, m.contact_id, m.deal_id, m.location, m.notes, m.created_by,
         co.name AS company_name, ct.name AS contact_name
    FROM crm_meetings m
    LEFT JOIN crm_companies co ON co.id = m.company_id AND co.organization_id = m.organization_id
    LEFT JOIN crm_contacts ct ON ct.id = m.contact_id AND ct.organization_id = m.organization_id`;async function bX(a){await bm(),await v();let[b]=await t().query(`${bW} WHERE m.organization_id = ? AND m.starts_at >= (NOW() - INTERVAL 14 DAY) ORDER BY m.starts_at ASC LIMIT 200`,[a]);return b}async function bY(a,b){await bm(),await v();let[c]=await t().query(`${bW} WHERE m.id = ? AND m.organization_id = ? LIMIT 1`,[b,a]);return c[0]??null}async function bZ(a){await bm(),await v();let[b]=await t().query(`${bW} WHERE m.organization_id = ? AND DATE(m.starts_at) = CURDATE() ORDER BY m.starts_at ASC LIMIT 20`,[a]);return b}async function b$(a,b,c){await bm();let[d]=await t().query(`INSERT INTO crm_capture_forms (organization_id, token, name, title, description, success_message, redirect_url, require_company, notify, active, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[a,b.slice(0,64),c.name.slice(0,120),c.title.slice(0,200),c.description.slice(0,500),c.successMessage.slice(0,500),c.redirectUrl.slice(0,500),+!!c.requireCompany,+!!c.notify,+!!c.active,c.createdBy.slice(0,190)]);return d.insertId}async function b_(a,b,c){await bm(),await t().query(`UPDATE crm_capture_forms SET name = ?, title = ?, description = ?, success_message = ?, redirect_url = ?, require_company = ?, notify = ?, active = ?
       WHERE id = ? AND organization_id = ?`,[c.name.slice(0,120),c.title.slice(0,200),c.description.slice(0,500),c.successMessage.slice(0,500),c.redirectUrl.slice(0,500),+!!c.requireCompany,+!!c.notify,+!!c.active,b,a])}async function b0(a,b){await bm(),await t().query("DELETE FROM crm_capture_forms WHERE id = ? AND organization_id = ?",[b,a])}async function b1(a){await bm();let[b]=await t().query("SELECT * FROM crm_capture_forms WHERE organization_id = ? ORDER BY id DESC",[a]);return b}async function b2(a,b){await bm(),await t().query(`INSERT INTO crm_goals (organization_id, owner_user_id, metric, period_month, target_amount, created_by)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE target_amount = VALUES(target_amount)`,[a,b.ownerUserId,b.metric.slice(0,20),b.periodMonth.slice(0,7),Math.max(0,Math.round(b.target)),b.createdBy.slice(0,190)])}async function b3(a,b){await bm();let[c]=await t().query("SELECT * FROM crm_goals WHERE organization_id = ? AND period_month = ?",[a,b.slice(0,7)]);return c}async function b4(a,b,c){await v();let[d]=await t().query(`SELECT COALESCE(owner_user_id, 0) AS owner_user_id, COALESCE(SUM(value), 0) AS revenue, COUNT(*) AS deals
       FROM crm_deals
      WHERE organization_id = ? AND stage = 'won' AND closed_at >= ? AND closed_at < ?
      GROUP BY COALESCE(owner_user_id, 0)`,[a,b,c]);return d}async function b5(a,b,c){await v();let[d]=await t().query(`SELECT COALESCE(owner_user_id, 0) AS owner_user_id, COUNT(*) AS leads
       FROM crm_leads
      WHERE organization_id = ? AND created_at >= ? AND created_at < ?
      GROUP BY COALESCE(owner_user_id, 0)`,[a,b,c]);return d}async function b6(a){await bm();let[b]=await t().query("SELECT owner_user_id, rate_bp FROM crm_commission_rates WHERE organization_id = ?",[a]);return b}async function b7(a,b,c){await bm(),await t().query(`INSERT INTO crm_commission_rates (organization_id, owner_user_id, rate_bp) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE rate_bp = VALUES(rate_bp)`,[a,Math.max(0,Math.floor(b)),Math.max(0,Math.min(1e6,Math.round(c)))])}async function b8(a,b){await bm();let[c]=await t().query("SELECT owner_user_id, period_month, amount_cents, paid_by, paid_at FROM crm_commission_payouts WHERE organization_id = ? AND period_month = ?",[a,b.slice(0,7)]);return c}async function b9(a,b){await bm(),await t().query(`INSERT INTO crm_commission_payouts (organization_id, owner_user_id, period_month, amount_cents, paid_by)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE amount_cents = VALUES(amount_cents), paid_by = VALUES(paid_by), paid_at = CURRENT_TIMESTAMP`,[a,Math.floor(b.ownerUserId),b.periodMonth.slice(0,7),Math.max(0,Math.round(b.amountCents)),b.paidBy.slice(0,190)])}async function ca(a,b,c){await bm(),await t().query("DELETE FROM crm_commission_payouts WHERE organization_id = ? AND owner_user_id = ? AND period_month = ?",[a,Math.floor(b),c.slice(0,7)])}async function cb(){await bm();let[a]=await t().query("SELECT COUNT(*) AS n FROM crm_users");return Number(a[0]?.n??0)}async function cc(a,b){await bm();let[c]=await t().query("INSERT INTO crm_organizations (name, slug) VALUES (?, ?)",[a.slice(0,190),b.slice(0,120)]);return c.insertId}async function cd(a){await bm();let[b]=await t().query("INSERT INTO crm_users (organization_id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)",[a.organizationId,a.email.toLowerCase().slice(0,190),(a.name??"").slice(0,190),a.passwordHash.slice(0,255),(a.role??"member").slice(0,20)]);return b.insertId}async function ce(a){await bm();let[b]=await t().query("SELECT * FROM crm_users WHERE email = ? AND status = 'active' LIMIT 1",[a.toLowerCase()]);return b[0]??null}async function cf(a){await bm();let[b]=await t().query("SELECT * FROM crm_users WHERE id = ? LIMIT 1",[a]);return b[0]??null}async function cg(a){await bm(),await t().query("UPDATE crm_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?",[a])}async function ch(a,b){await bm(),await t().query("UPDATE crm_users SET password_hash = ? WHERE id = ?",[b,a])}async function ci(a){await bm();let[b]=await t().query("SELECT * FROM crm_users WHERE organization_id = ? ORDER BY created_at ASC",[a]);return b}async function cj(a){await bm();let[b]=await t().query("SELECT COUNT(*) AS n FROM crm_users WHERE organization_id = ? AND role = 'owner' AND status = 'active'",[a]);return Number(b[0]?.n??0)}async function ck(a,b,c){await bm(),await t().query("UPDATE crm_users SET role = ? WHERE id = ? AND organization_id = ?",[c.slice(0,20),b,a])}async function cl(a,b,c){await bm(),await t().query("UPDATE crm_users SET status = ? WHERE id = ? AND organization_id = ?",[c.slice(0,20),b,a])}async function cm(a){await bm(),await t().query("INSERT INTO crm_sessions (user_id, organization_id, token_hash, expires_at, ip, user_agent, last_used_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",[a.userId,a.organizationId,a.tokenHash,a.expiresAt,(a.ip??"").slice(0,45),(a.userAgent??"").slice(0,255)])}async function cn(a){await bm();let[b]=await t().query("SELECT * FROM crm_sessions WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP LIMIT 1",[a]);return b[0]??null}async function co(a){try{await t().query("UPDATE crm_sessions SET last_used_at = CURRENT_TIMESTAMP WHERE token_hash = ?",[a])}catch{}}async function cp(a){await bm();let[b]=await t().query(`SELECT * FROM crm_sessions WHERE user_id = ? AND expires_at > CURRENT_TIMESTAMP
     ORDER BY (last_used_at IS NULL), last_used_at DESC, id DESC`,[a]);return b}async function cq(a,b){await bm(),await t().query("DELETE FROM crm_sessions WHERE id = ? AND user_id = ?",[b,a])}async function cr(a,b){await bm();let[c]=await t().query("DELETE FROM crm_sessions WHERE user_id = ? AND id <> ?",[a,b]);return c.affectedRows??0}async function cs(a){await bm(),await t().query("DELETE FROM crm_sessions WHERE token_hash = ?",[a])}async function ct(a,b){await bm(),await t().query("UPDATE crm_users SET totp_secret = ?, totp_enabled = 0 WHERE id = ?",[b.slice(0,255),a])}async function cu(a){await bm(),await t().query("UPDATE crm_users SET totp_enabled = 1 WHERE id = ?",[a])}async function cv(a){await bm();let b=t();await b.query("UPDATE crm_users SET totp_secret = '', totp_enabled = 0 WHERE id = ?",[a]),await b.query("DELETE FROM crm_recovery_codes WHERE user_id = ?",[a])}async function cw(a){await bm();let[b]=await t().query("SELECT totp_secret, totp_enabled FROM crm_users WHERE id = ? LIMIT 1",[a]),c=b[0];return c?{secret:String(c.totp_secret??""),enabled:!!c.totp_enabled}:null}async function cx(a,b){await bm();let c=await t().getConnection();try{for(let d of(await c.beginTransaction(),await c.query("DELETE FROM crm_recovery_codes WHERE user_id = ?",[a]),b))await c.query("INSERT INTO crm_recovery_codes (user_id, code_hash) VALUES (?, ?)",[a,d]);await c.commit()}catch(a){throw await c.rollback().catch(()=>{}),a}finally{c.release()}}async function cy(a,b){await bm();let[c]=await t().query("UPDATE crm_recovery_codes SET used_at = CURRENT_TIMESTAMP WHERE user_id = ? AND code_hash = ? AND used_at IS NULL",[a,b]);return(c.affectedRows??0)>0}async function cz(a){await bm();let[b]=await t().query("SELECT COUNT(*) AS n FROM crm_recovery_codes WHERE user_id = ? AND used_at IS NULL",[a]);return Number(b[0]?.n??0)}async function cA(a,b,c){await bm(),await t().query("INSERT INTO crm_mfa_challenges (user_id, token_hash, expires_at) VALUES (?, ?, ?)",[a,b,c])}async function cB(a){await bm();let[b]=await t().query("SELECT user_id FROM crm_mfa_challenges WHERE token_hash = ? AND expires_at > CURRENT_TIMESTAMP LIMIT 1",[a]),c=b[0];return c?{userId:Number(c.user_id)}:null}async function cC(a){await bm(),await t().query("DELETE FROM crm_mfa_challenges WHERE token_hash = ?",[a])}let cD=RegExp("[\\u0000-\\u001F\\u007F-\\u009F\\u2028\\u2029]","g");function cE(a){return String(a??"").replace(cD," ")}async function cF(a){await bm(),await t().query("INSERT INTO crm_audit_logs (organization_id, user_id, actor_email, action, entity, entity_id, summary, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",[a.organizationId,a.userId,cE(a.actorEmail).slice(0,190),a.action.slice(0,40),a.entity.slice(0,40),a.entityId??null,cE(a.summary??"").slice(0,255),(a.ip??"").slice(0,45),cE(a.userAgent??"").slice(0,255)])}async function cG(a,b=100){await bm();let[c]=await t().query("SELECT * FROM crm_audit_logs WHERE organization_id = ? ORDER BY id DESC LIMIT ?",[a,b]);return c}},68734:(a,b,c)=>{"use strict";c.d(b,{ThemeProvider:()=>f});var d=c(21124),e=c(45523);function f({children:a,nonce:b}){return(0,d.jsx)(e.N,{attribute:"class",defaultTheme:"dark",enableSystem:!1,nonce:b,children:a})}},71480:(a,b,c)=>{"use strict";c.d(b,{Rr:()=>h,y6:()=>e});let d=["onetime","monthly","yearly"];function e(a){return d.includes(a)}let f={name:"p.name",sku:"p.sku",price:"p.price_cents",created:"p.id"},g=new Set(Object.keys(f));function h(a,b){let c=g.has(a)?f[a]:f.name;return`ORDER BY ${c} ${1===b?"ASC":"DESC"}, p.id DESC`}},72653:(a,b,c)=>{"use strict";c.d(b,{Oj:()=>l,aD:()=>g,xM:()=>e,zk:()=>i});let d=["new","working","qualified","unqualified","converted"];function e(a){return d.includes(a)}let f=["web","referral","event","cold","import","other"];function g(a){return f.includes(a)}let h=["low","normal","high"];function i(a){return h.includes(a)}let j={name:"l.name",company:"l.company",source:"l.source",status:"l.status",score:"l.lead_score",created:"l.id"},k=new Set(Object.keys(j));function l(a,b){let c=k.has(a)?j[a]:j.score;return`ORDER BY ${c} ${1===b?"ASC":"DESC"}, l.id DESC`}},79699:(a,b,c)=>{"use strict";c.d(b,{Eb:()=>f,Z4:()=>g,o7:()=>h});let d=new Map,e=0;function f(a,b,c=Date.now()){if(!(c-e<6e4))for(let[a,b]of(e=c,d))!(b.blockedUntil>c)&&c-b.windowStart>36e5&&d.delete(a);let g=d.get(a);return g&&g.blockedUntil>c?{ok:!1,retryAfter:Math.ceil((g.blockedUntil-c)/1e3)}:!g||c-g.windowStart>=b.windowMs?(d.set(a,{count:1,windowStart:c,blockedUntil:0}),{ok:!0,retryAfter:0}):(g.count+=1,g.count>b.limit)?(g.blockedUntil=c+(b.blockMs??b.windowMs),{ok:!1,retryAfter:Math.ceil((g.blockedUntil-c)/1e3)}):{ok:!0,retryAfter:0}}function g(a){void 0===a?d.clear():d.delete(a)}function h(a){if(a>=60){let b=Math.ceil(a/60);return`Too many attempts. Try again in ${b} minute${1===b?"":"s"}.`}return`Too many attempts. Try again in ${Math.max(1,a)} seconds.`}},87080:a=>{function b(a){var b=Error("Cannot find module '"+a+"'");throw b.code="MODULE_NOT_FOUND",b}b.keys=()=>[],b.resolve=b,b.id=87080,a.exports=b},87733:(a,b,c)=>{Promise.resolve().then(c.t.bind(c,54160,23)),Promise.resolve().then(c.t.bind(c,31603,23)),Promise.resolve().then(c.t.bind(c,68495,23)),Promise.resolve().then(c.t.bind(c,75170,23)),Promise.resolve().then(c.t.bind(c,77526,23)),Promise.resolve().then(c.t.bind(c,78922,23)),Promise.resolve().then(c.t.bind(c,29234,23)),Promise.resolve().then(c.t.bind(c,12263,23)),Promise.resolve().then(c.bind(c,82146))},94306:(a,b,c)=>{"use strict";c.d(b,{F$:()=>f,Q:()=>e.Q,QK:()=>g,g_:()=>e.g_});var d=c(55511),e=c(55435);function f(){return(0,d.randomBytes)(32).toString("base64url")}function g(a){return(0,d.createHash)("sha256").update(a).digest("hex")}},97037:(a,b,c)=>{"use strict";function d(a){return a.enabled&&""!==a.webappUrl&&""!==a.secret}c.d(b,{UJ:()=>d,XX:()=>e});let e=function(a=process.env){let b=(a.SAJTPRESS_INTEGRATION??"").trim().toLowerCase();return{enabled:"on"===b||"1"===b||"true"===b,webappUrl:(a.WEBAPP_INTERNAL_URL??"").trim().replace(/\/+$/,""),secret:(a.INTERNAL_API_SECRET??"").trim(),cookieDomain:(a.SESSION_COOKIE_DOMAIN??"").trim()}}()}};