import "dotenv/config";
import express from "express";
const app=express(), PORT=Number(process.env.PORT||3000);
const OLLAMA_URL=process.env.OLLAMA_URL||"http://127.0.0.1:11434";
const OLLAMA_MODEL=process.env.OLLAMA_MODEL||"qwen3:0.6b";
app.use(express.json({limit:"1mb"})); app.use(express.static("public"));

const OVERPASS_ENDPOINTS=["https://overpass-api.de/api/interpreter","https://overpass.kumi.systems/api/interpreter"];
const TAGS={
 cafe:[["amenity","cafe"]],restaurant:[["amenity","restaurant"]],fast_food:[["amenity","fast_food"]],
 library:[["amenity","library"]],bookstore:[["shop","books"]],coworking:[["office","coworking"],["amenity","coworking"]],
 park:[["leisure","park"],["leisure","garden"]],museum:[["tourism","museum"]],hotel:[["tourism","hotel"],["tourism","hostel"]],
 gym:[["leisure","fitness_centre"],["amenity","gym"]],pharmacy:[["amenity","pharmacy"]],bakery:[["shop","bakery"],["amenity","bakery"]],
 bar:[["amenity","bar"],["amenity","pub"]],university:[["amenity","university"]],community:[["amenity","community_centre"]]
};
const ALIAS={coffee:["cafe"],coffee_shop:["cafe"],study:["cafe","library","bookstore","coworking","university"],
studying:["cafe","library","bookstore","coworking","university"],work:["cafe","library","coworking","university"],
workspace:["coworking","cafe","library"],lunch:["restaurant","fast_food","cafe","bakery"],dinner:["restaurant","bar","cafe"],
food:["restaurant","fast_food","cafe","bakery"],drinks:["cafe","bar"]};

const clean=s=>String(s||"").replace(/\s+/g," ").trim();
const tv=(t,k)=>String(t?.[k]||"").toLowerCase();
function km(a,b,c,d){const R=6371,p=Math.PI/180,x=(c-a)*p,y=(d-b)*p,h=Math.sin(x/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin(y/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
function normalize(x){
 x=x&&typeof x==="object"?x:{};
 let cats=Array.isArray(x.categories)?x.categories:[];
 cats=[...new Set(cats.flatMap(v=>ALIAS[String(v).toLowerCase()]||[String(v).toLowerCase()]).filter(v=>TAGS[v]))];
 return {categories:cats.length?cats:["cafe","restaurant","library","bookstore","coworking","park"],
 budget:["cheap","moderate","expensive","any"].includes(x.budget)?x.budget:"any",
 distance:["near","medium","any"].includes(x.distance)?x.distance:"any",
 quiet:+x.quiet||0,wifi:+x.wifi||0,outlets:+x.outlets||0,study:+x.study||0,work:+x.work||0,
 outdoor:+x.outdoor||0,food:+x.food||0,openNow:!!x.openNow,evening:!!x.evening,family:+x.family||0,romantic:+x.romantic||0,
 keywords:Array.isArray(x.keywords)?x.keywords.map(clean).filter(Boolean).slice(0,12):[]};
}
function fallback(q){
 const s=q.toLowerCase(), c=new Set(), add=(...x)=>x.forEach(v=>c.add(v));
 if(/coffee|cafe|café|espresso|latte/.test(s))add("cafe");
 if(/restaurant|dinner|lunch|meal|eat|food/.test(s))add("restaurant","fast_food","bakery");
 if(/study|studying|homework|read|reading/.test(s))add("cafe","library","bookstore","coworking","university");
 if(/work|laptop|remote|coworking|workspace/.test(s))add("cafe","coworking","library","university");
 if(/park|outdoor|outside|garden|green/.test(s))add("park");
 if(/book|bookstore/.test(s))add("bookstore","library");
 if(/museum|gallery/.test(s))add("museum");
 if(/gym|fitness/.test(s))add("gym");
 if(/hotel|hostel/.test(s))add("hotel");
 if(/pharmacy|medicine/.test(s))add("pharmacy");
 if(/bar|pub|drink/.test(s))add("bar","cafe");
 if(!c.size)add("cafe","restaurant","library","bookstore","coworking","park");
 return normalize({categories:[...c],budget:/cheap|budget|affordable|inexpensive/.test(s)?"cheap":"any",
 distance:/near|nearby|closest|close to|walking distance/.test(s)?"near":"any",
 quiet:/quiet|calm|peaceful|silent|study/.test(s)?3:0,wifi:/wifi|wi-fi|internet/.test(s)?3:0,
 outlets:/outlet|socket|plug|charging/.test(s)?3:0,study:/study|studying|homework|read/.test(s)?3:0,
 work:/work|laptop|remote|coworking|workspace/.test(s)?3:0,outdoor:/outdoor|outside|park|garden/.test(s)?3:0,
 food:/food|eat|meal|lunch|dinner/.test(s)?3:0,openNow:/open now|currently open|right now/.test(s),
 evening:/tonight|evening|late|after work/.test(s),romantic:/romantic|date|date night/.test(s)?3:0,
 keywords:s.split(/[^a-z0-9]+/).filter(w=>w.length>2).slice(0,12)});
}
async function ai(q){
 const prompt=`Return ONLY valid JSON for this place-search intent.
Schema {"categories":[],"budget":"cheap|moderate|expensive|any","distance":"near|medium|any","quiet":0,"wifi":0,"outlets":0,"study":0,"work":0,"outdoor":0,"food":0,"openNow":false,"evening":false,"family":0,"romantic":0,"keywords":[]}
Use 0-3 strengths. Categories: cafe,restaurant,fast_food,library,bookstore,coworking,park,museum,hotel,gym,pharmacy,bakery,bar,university,community.
Request: ${JSON.stringify(q)}`;
 try{
  const r=await fetch(`${OLLAMA_URL}/api/generate`,{method:"POST",headers:{"content-type":"application/json"},
   body:JSON.stringify({model:OLLAMA_MODEL,prompt,stream:false,options:{temperature:.1}})});
  if(!r.ok)throw Error(); const j=await r.json(),m=String(j.response||"").match(/\{[\s\S]*\}/);
  if(!m)throw Error(); return normalize(JSON.parse(m[0]));
 }catch{return fallback(q)}
}
function query(lat,lon,r,cats){let a=[];for(const c of cats)for(const [k,v] of TAGS[c]||[])a.push(`nwr["${k}"="${v}"](around:${r},${lat},${lon});`);return `[out:json][timeout:20];(${a.join("")});out center tags;`}
async function overpass(q){
 let last; for(const ep of OVERPASS_ENDPOINTS)try{
  const ac=new AbortController(),t=setTimeout(()=>ac.abort(),26000);
  const r=await fetch(ep,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded","user-agent":"Mappy-Free/0.4"},
  body:new URLSearchParams({data:q}),signal:ac.signal});clearTimeout(t);if(!r.ok){last=Error(`Overpass ${r.status}`);continue}return r.json();
 }catch(e){last=e} throw last||Error("Overpass unavailable");
}
function classify(t){const out=[];for(const [c,p] of Object.entries(TAGS))if(p.some(([k,v])=>tv(t,k)===v))out.push(c);return out.length?out:["place"]}
async function places(lat,lon,cats){
 let els=[];for(const r of [2500,5000]){els=(await overpass(query(lat,lon,r,cats))).elements||[];if(els.length>=18||r===5000)break}
 const seen=new Set();return els.map(e=>{
  const p=e.type==="node"?{lat:e.lat,lon:e.lon}:e.center; if(!p?.lat)return null;const t=e.tags||{},name=clean(t.name||t["name:en"]||t.brand);
  if(!name)return null;const key=`${name.toLowerCase()}|${p.lat.toFixed(5)}|${p.lon.toFixed(5)}`;if(seen.has(key))return null;seen.add(key);
  return {id:`${e.type}/${e.id}`,name,lat:p.lat,lon:p.lon,distance:km(lat,lon,p.lat,p.lon),tags:t,categories:classify(t),osm:`https://www.openstreetmap.org/${e.type}/${e.id}`};
 }).filter(Boolean)
}
function features(p){
 const t=p.tags||{},a=Object.values(t).join(" ").toLowerCase(),o=tv(t,"opening_hours");
 return {wifi:/wifi|wi-fi|internet/.test(a)||/^(yes|free|wlan)/.test(tv(t,"internet_access")),outlets:/outlet|socket|charging|power/.test(a),
 quiet:/quiet|silent|study|reading/.test(a)||p.categories.some(c=>["library","bookstore","coworking"].includes(c)),
 outdoor:/outdoor|terrace|garden|patio|park/.test(a)||p.categories.includes("park"),cheap:/cheap|budget|affordable|low/.test(a)||p.categories.some(c=>["fast_food","bakery"].includes(c)),
 food:p.categories.some(c=>["restaurant","fast_food","cafe","bakery"].includes(c)),family:/children|kids|family|playground/.test(a),
 romantic:/romantic|date|wine|cocktail|candle/.test(a)||p.categories.includes("bar"),opening:o,all:a}
}
function score(p,i){
 const f=features(p),re=[];let s=50,over=p.categories.filter(c=>i.categories.includes(c));
 s+=Math.min(24,over.length*12);if(over.length)re.push(`matches ${over.slice(0,2).join(" + ")}`);
 s+=i.distance==="near"?Math.max(0,18-p.distance*4.5):Math.max(0,8-p.distance*1.5);
 if(p.distance<.8)re.push("very close");else if(p.distance<2)re.push("nearby");
 const pref=(n,ok,label,pts=7)=>{if(n>0){if(ok){s+=pts*n/3;re.push(label)}else s-=pts*.45*n/3}};
 pref(i.wifi,f.wifi,"Wi-Fi/internet signal");pref(i.outlets,f.outlets,"possible charging signal");pref(i.quiet,f.quiet,"quiet/study signal");
 pref(i.study,f.quiet||p.categories.includes("library")||p.categories.includes("cafe"),"study-friendly");
 pref(i.work,f.wifi||p.categories.includes("coworking"),"work-friendly");pref(i.outdoor,f.outdoor,"outdoor signal");
 pref(i.food,f.food,"food available");pref(i.family,f.family,"family-friendly signal");pref(i.romantic,f.romantic,"date-night signal");
 if(i.budget==="cheap"){if(f.cheap){s+=9;re.push("budget-friendly signal")}else s-=2}
 const text=(p.name+" "+f.all).toLowerCase(),hits=i.keywords.filter(k=>text.includes(k)).slice(0,4);if(hits.length){s+=Math.min(8,hits.length*2);re.push(`matches "${hits.join(", ")}"`)};
 return {score:Math.max(0,Math.min(100,s)),reasons:[...new Set(re)].slice(0,4)}
}
function diversify(items){
 const pool=[...items].sort((a,b)=>b.baseScore-a.baseScore),chosen=[],used=new Map();
 while(pool.length&&chosen.length<8){let bi=0,bv=-1e9;for(let j=0;j<pool.length;j++){const p=pool[j],cat=p.categories[0]||"place",count=used.get(cat)||0;
  let v=p.baseScore+(count===0?3:count>=2?-4:0)-(chosen.some(x=>Math.abs(x.lat-p.lat)<.00015&&Math.abs(x.lon-p.lon)<.00015)?5:0);
  if(v>bv){bv=v;bi=j}}const p=pool.splice(bi,1)[0];chosen.push({...p,finalScore:Math.round(bv)});const c=p.categories[0]||"place";used.set(c,(used.get(c)||0)+1)}
 return chosen;
}
app.post("/api/search",async(req,res)=>{try{
 const {query:q,lat,lon}=req.body||{};if(!q||!Number.isFinite(+lat)||!Number.isFinite(+lon))return res.status(400).json({error:"query, lat and lon are required"});
 const intent=await ai(String(q)),cs=await places(+lat,+lon,intent.categories);if(!cs.length)return res.json({intent,candidateCount:0,results:[]});
 const ranked=diversify(cs.map(p=>{const s=score(p,intent);return {...p,baseScore:s.score,reasons:s.reasons}}));
 res.json({query:String(q),intent,candidateCount:cs.length,results:ranked.map((p,i)=>({rank:i+1,id:p.id,name:p.name,lat:p.lat,lon:p.lon,distanceKm:+p.distance.toFixed(2),score:p.finalScore,categories:p.categories,reasons:p.reasons,tags:p.tags,osm:p.osm})),source:"OpenStreetMap + Overpass",model:OLLAMA_MODEL});
}catch(e){console.error(e);res.status(502).json({error:"Place search failed. The public OpenStreetMap query service may be busy. Try again in a moment."})}});
app.get("/api/health",async(_q,res)=>{let ollama=false;try{ollama=(await fetch(`${OLLAMA_URL}/api/tags`)).ok}catch{}res.json({ok:true,ollama,model:OLLAMA_MODEL})});
app.get("*splat",(_q,res)=>res.sendFile(process.cwd()+"/public/index.html"));
app.listen(PORT,()=>console.log(`Mappy Free v0.4: http://localhost:${PORT}`));
