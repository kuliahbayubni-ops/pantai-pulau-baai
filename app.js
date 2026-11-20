const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const fmt=(v,d=1)=>v==null||isNaN(v)?'–':v.toLocaleString('id-ID',{minimumFractionDigits:d,maximumFractionDigits:d});
const sg=v=>(v>0?'+':'')+fmt(v)+'%';

/* ---------- Tabs (hash) ---------- */
const TABS=['beranda','referensi','simulasi','data-satelit','tentang'];let simLoaded=false;
function route(){let t=location.hash.slice(1);if(t==='berita'){t='referensi';history.replaceState(null,'','#referensi')}if(!TABS.includes(t))t='beranda';
$$('section.tab').forEach(s=>s.classList.toggle('on',s.id==='t-'+t));
$$('nav a').forEach(a=>a.classList.toggle('on',a.dataset.t===t));
if(t==='simulasi'&&!simLoaded)loadSim();if(t==='data-satelit')drawAll();window.scrollTo(0,0)}
addEventListener('hashchange',route);

/* ---------- Simulasi (iframe) ---------- */
function loadSim(){simLoaded=true;$('#simf').src='simulasi.html?v=bd2a2e32'}
addEventListener('message',e=>{if(e.data&&e.data.simH){const f=$('#simf');if(f)f.style.height=Math.max(600,e.data.simH+4)+'px'}});

/* ---------- Data ---------- */
function parseCSV(t){const L=t.trim().split(/\r?\n/),h=L[0].split(',');return L.slice(1).map(l=>{const v=l.split(','),o={};h.forEach((k,i)=>{const x=v[i];o[k]=(x===''||x==null)?null:(isNaN(+x)?x:+x)});return o})}
const ZT=$('#csv-zona').textContent.trim(),BT=$('#csv-bulanan').textContent.trim();
const Z=parseCSV(ZT),B=parseCSV(BT);
const Q=[...new Set(Z.map(r=>r.kuartal))].sort(),OUT='2020-10';
const ROM={'01':'I','04':'II','07':'III','10':'IV'};
const ql=q=>'Kuartal '+ROM[q.slice(5)]+' '+q.slice(0,4),qs=q=>'K'+ROM[q.slice(5)]+' '+q.slice(2,4);
const BLN=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const ml=m=>BLN[+m.slice(5)-1]+' '+m.slice(0,4);
const ZN={MULUT_ALUR:'Mulut alur',TIMUR_PIER:'Sisi timur pier',BARAT_PIER:'Sisi barat pier',KONTROL:'Pantai pembanding'};
const ZC={MULUT_ALUR:'--z1',TIMUR_PIER:'--z2',BARAT_PIER:'--z3',KONTROL:'--z4'};
const val=(z,q)=>{const r=Z.find(r=>r.zona===z&&r.kuartal===q);return r?r.luas_air_tetap_ha:null};
const isBase=q=>q<'2023'&&q!==OUT;
const baseMean=(z,m)=>{const v=Q.filter(q=>isBase(q)&&q.slice(5)===m).map(q=>val(z,q));return v.reduce((a,b)=>a+b,0)/v.length};
const anom=(z,q)=>val(z,q)/baseMean(z,q.slice(5))*100-100;
const ZONES=['MULUT_ALUR','TIMUR_PIER','BARAT_PIER'];
const SEL={};ZONES.forEach(z=>SEL[z]=Q.map(q=>anom(z,q)-anom('KONTROL',q)));
// Ambang = sekitar 2 dan 4 kali simpangan baku selisih 2019-2022 (sama dengan simulasi)
const TH={MULUT_ALUR:{sg:-3,kr:-6},TIMUR_PIER:{sg:-5.8,kr:-11.6},BARAT_PIER:{sg:-1.4,kr:-2.8}};
const iOUT=Q.indexOf(OUT);

/* ---------- Chart engine (SVG) ---------- */
function chart(host,o){const W=900,H=o.h||330,L=56,R=16,T=18,Bm=40,n=o.labels.length;
const pw=W-L-R,ph=H-T-Bm,x=i=>L+(n<2?pw/2:i*pw/(n-1)),bw=o.bars?pw/n*.7:0,xb=i=>L+(i+.5)*pw/n;const X=o.bars?xb:x;
const y=v=>T+ph-(v-o.ymin)/(o.ymax-o.ymin)*ph;let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.aria||''}">`;
const mu=css('--mu'),bd=css('--bd');
(o.shade||[]).forEach(([a,b,c])=>s+=`<rect x="${X(a)-(o.bars?pw/n/2:0)}" y="${T}" width="${X(b)-X(a)+(o.bars?pw/n:0)}" height="${ph}" fill="${c}" opacity=".5"/>`);
if(o.band)s+=`<rect x="${L}" y="${y(o.band[1])}" width="${pw}" height="${y(o.band[0])-y(o.band[1])}" fill="${mu}" opacity=".14"/>`;
o.ticks.forEach(t=>s+=`<line x1="${L}" x2="${W-R}" y1="${y(t)}" y2="${y(t)}" stroke="${bd}" stroke-width="1"/><text x="${L-7}" y="${y(t)+4}" text-anchor="end" font-size="12" fill="${mu}">${o.yf?o.yf(t):t}</text>`);
if(o.ytitle)s+=`<text transform="translate(14 ${T+ph/2}) rotate(-90)" text-anchor="middle" font-size="12" fill="${mu}">${o.ytitle}</text>`;
o.labels.forEach((l,i)=>{if(o.xshow(i))s+=`<text x="${X(i)}" y="${H-Bm+18}" text-anchor="middle" font-size="12" fill="${mu}">${o.xl(i)}</text><line x1="${X(i)}" x2="${X(i)}" y1="${T+ph}" y2="${T+ph+4}" stroke="${mu}"/>`});
(o.hl||[]).forEach(h=>s+=`<line x1="${L}" x2="${W-R}" y1="${y(h.v)}" y2="${y(h.v)}" stroke="${h.c}" stroke-width="1.6" stroke-dasharray="6 4"/><text x="${W-R-4}" y="${y(h.v)-5}" text-anchor="end" font-size="12" fill="${h.c}" font-weight="700">${h.t}</text>`);
(o.marks||[]).forEach((m,k)=>s+=`<line x1="${X(m.i)}" x2="${X(m.i)}" y1="${T}" y2="${T+ph}" stroke="${mu}" stroke-dasharray="2 3"/><text x="${X(m.i)>L+pw*.7?X(m.i)-4:X(m.i)+4}" text-anchor="${X(m.i)>L+pw*.7?'end':'start'}" y="${T+12+k*14}" font-size="11.5" fill="${mu}">${m.t}</text>`);
o.series.forEach(se=>{if(se.hide)return;const c=se.c;
 if(se.bar){se.v.forEach((v,i)=>{if(v==null)return;const yy=y(Math.max(v,0)),h=Math.abs(y(v)-y(0));s+=`<rect x="${X(i)-bw/2}" y="${yy}" width="${bw}" height="${h}" fill="${c}" opacity=".8" rx="2"/>`});return}
 let d='',pen=false;se.v.forEach((v,i)=>{const ok=v!=null&&!(se.skip||[]).includes(i);if(ok){d+=(pen?'L':'M')+X(i).toFixed(1)+' '+y(Math.max(o.ymin,Math.min(o.ymax,v))).toFixed(1);pen=true}else pen=false});
 s+=`<path d="${d}" fill="none" stroke="${c}" stroke-width="${se.w||2.4}" stroke-linejoin="round" ${se.dash?'stroke-dasharray="5 4"':''}/>`;
 se.v.forEach((v,i)=>{if(v==null)return;const sk=(se.skip||[]).includes(i);
  if(sk&&se.outlier){s+=`<rect x="${X(i)-6}" y="${T+ph-14}" width="12" height="12" transform="rotate(45 ${X(i)} ${T+ph-8})" fill="${mu}"/>`}
  else if(sk){s+=`<circle cx="${X(i)}" cy="${y(v)}" r="3.4" fill="none" stroke="${c}" stroke-width="1.5"/>`}
  else if(se.dots!==false)s+=`<circle cx="${X(i)}" cy="${y(v)}" r="${se.r||2.8}" fill="${c}"/>`})});
if(o.cur!=null)s+=`<line x1="${X(o.cur)}" x2="${X(o.cur)}" y1="${T}" y2="${T+ph}" stroke="${css('--tx')}" stroke-width="1.5"/>`;
s+=`<line id="hv" x1="0" x2="0" y1="${T}" y2="${T+ph}" stroke="${mu}" visibility="hidden"/><rect x="${L}" y="${T}" width="${pw}" height="${ph}" fill="transparent" class="ov"/></svg><div class="tip"></div>`;
host.innerHTML=s;const sv=host.querySelector('svg'),tip=host.querySelector('.tip'),hv=sv.querySelector('#hv');
function at(ev){const p=sv.createSVGPoint();p.x=ev.clientX;p.y=ev.clientY;const q=p.matrixTransform(sv.getScreenCTM().inverse());
 let i=o.bars?Math.floor((q.x-L)/(pw/n)):Math.round((q.x-L)/pw*(n-1));return Math.max(0,Math.min(n-1,i))}
sv.querySelector('.ov').addEventListener('pointermove',ev=>{const i=at(ev);hv.setAttribute('x1',X(i));hv.setAttribute('x2',X(i));hv.setAttribute('visibility','visible');
 tip.innerHTML=o.tip(i);tip.style.display='block';const r=host.getBoundingClientRect();let lx=ev.clientX-r.left+14;if(lx>r.width-270)lx=ev.clientX-r.left-270;tip.style.left=Math.max(0,lx)+'px';tip.style.top=(ev.clientY-r.top-10)+'px'});
sv.querySelector('.ov').addEventListener('pointerleave',()=>{tip.style.display='none';hv.setAttribute('visibility','hidden')});
if(o.click)sv.querySelector('.ov').addEventListener('click',ev=>o.click(at(ev)))}
const nice=(a,b,st)=>{const t=[];for(let v=Math.ceil(a/st)*st;v<=b+1e-9;v+=st)t.push(+v.toFixed(6));return t};

/* ---------- 1. Indeks peringatan dini ---------- */
let ZS='MULUT_ALUR',QI=Q.length-1,timer=null;
$('#zbtn').innerHTML=ZONES.map(z=>`<button data-z="${z}">${ZN[z]}</button>`).join('');
$$('#zbtn button').forEach(b=>b.onclick=()=>{ZS=b.dataset.z;drawEWS()});
$('#qs').max=Q.length-1;$('#qs').oninput=e=>{QI=+e.target.value;drawEWS()};
$('#play').onclick=()=>{if(timer){clearInterval(timer);timer=null;$('#play').textContent='▶ Putar waktu';return}
 if(QI>=Q.length-1)QI=0;$('#play').textContent='⏸ Jeda';timer=setInterval(()=>{QI++;drawEWS();if(QI>=Q.length-1){clearInterval(timer);timer=null;$('#play').textContent='▶ Putar waktu'}},650)};
function stat(z,i){const v=SEL[z][i],t=TH[z];if(i===iOUT)return['tidak wajar (data dibuang)',css('--mu')];
 if(v<=t.kr)return['KRITIS',css('--rd')];if(v<=t.sg)return['SIAGA',css('--wn')];if(v>=-t.sg)return['di atas kisaran normal',css('--ac')];return['normal',css('--ok')]}
function drawEWS(){$$('#zbtn button').forEach(b=>b.classList.toggle('on',b.dataset.z===ZS));$('#qs').value=QI;
 const v=SEL[ZS],t=TH[ZS],c=css(ZC[ZS]),lo=Math.min(-14,t.kr-2),hi=12;
 chart($('#ch-ews'),{labels:Q,ymin:lo,ymax:hi,ticks:nice(lo,hi,lo<-14?4:3),yf:v=>v+'%',ytitle:'Selisih terhadap pembanding (%)',band:[t.sg,-t.sg],
  hl:[{v:t.sg,c:css('--wn'),t:'Siaga '+fmt(t.sg)+'%'},{v:t.kr,c:css('--rd'),t:'Kritis '+fmt(t.kr)+'%'}],
  marks:[{i:Q.indexOf('2025-01'),t:'Mar 2025: alur tertutup'},{i:Q.indexOf('2025-04'),t:'Jun 2025: pengerukan resmi'}],
  series:[{v,c,skip:[iOUT],outlier:true,r:3.4}],cur:QI,xshow:i=>Q[i].endsWith('-01'),xl:i=>Q[i].slice(0,4),
  aria:'Grafik indeks peringatan dini '+ZN[ZS],click:i=>{QI=i;drawEWS()},
  tip:i=>`<b>${ql(Q[i])}</b><br>${ZN[ZS]}: ${sg(v[i])}<br>Status: <b style="color:${stat(ZS,i)[1]}">${stat(ZS,i)[0]}</b>`});
 $('#lg-ews').innerHTML=`<span><i style="background:${c}"></i>${ZN[ZS]}</span><span><i style="background:${css('--mu')};opacity:.35;height:10px"></i>kisaran normal 2019–2022</span><span>◆ Kuartal IV 2020: ${sg(v[iOUT])}, tidak wajar, di luar skala</span>`;
 const [st,sc]=stat(ZS,QI);$('#qst').innerHTML=`${ql(Q[QI])}: selisih ${ZN[ZS].toLowerCase()} <span style="color:${sc}">${sg(v[QI])} · ${st}</span>`;
 $('#chips').innerHTML=ZONES.map(z=>{const[s2,c2]=stat(z,QI);return`<div class="chip" style="border-left:4px solid ${css(ZC[z])}"><span>${ZN[z]} · ${qs(Q[QI])}</span><strong>${sg(SEL[z][QI])}</strong><span style="color:${c2};font-weight:700">${s2}</span><span> (siaga ${fmt(TH[z].sg)}%, kritis ${fmt(TH[z].kr)}%)</span></div>`}).join('')}

/* ---------- 2. Data mentah ---------- */
const RZ=['MULUT_ALUR','TIMUR_PIER','BARAT_PIER','KONTROL'],RH={};
$('#rbtn').innerHTML=RZ.map(z=>`<button data-z="${z}" class="on" style="border-color:${css(ZC[z])}">${ZN[z]}</button>`).join('');
$$('#rbtn button').forEach(b=>b.onclick=()=>{RH[b.dataset.z]=!RH[b.dataset.z];b.classList.toggle('on',!RH[b.dataset.z]);drawRaw()});
function drawRaw(){chart($('#ch-raw'),{labels:Q,ymin:0,ymax:200,ticks:nice(0,200,40),yf:v=>v+' ha',ytitle:'Luas air tetap (ha)',
 series:RZ.map(z=>({v:Q.map(q=>val(z,q)),c:css(ZC[z]),hide:RH[z],skip:[iOUT],outlier:true,dash:z==='KONTROL'})),
 marks:[{i:Q.indexOf('2025-01'),t:'Mar 2025'}],xshow:i=>Q[i].endsWith('-01'),xl:i=>Q[i].slice(0,4),aria:'Luas air tetap per zona',
 tip:i=>`<b>${ql(Q[i])}</b>${i===iOUT?' <i>(tidak wajar)</i>':''}<br>`+RZ.filter(z=>!RH[z]).map(z=>{const r=Z.find(r=>r.zona===z&&r.kuartal===Q[i]);return`<span style="color:${css(ZC[z])}">●</span> ${ZN[z]}: ${fmt(r.luas_air_tetap_ha)} ha (${r.jumlah_citra} citra)`}).join('<br>')})}

/* ---------- 3. Bulanan ---------- */
const MET={ndti:{n:'Kekeruhan (NDTI)',d:3,lo:-.45,hi:0,st:.1,yt:'NDTI (makin tinggi makin keruh)',c:'--sand',q:true},
 frac_air:{n:'Fraksi air',d:1,lo:0,hi:100,st:20,yt:'Fraksi air area studi (%)',c:'--z1',q:true,pct:true},
 hujan_mm:{n:'Curah hujan (CHIRPS)',d:0,lo:0,hi:700,st:100,yt:'Curah hujan bulanan (mm)',c:'--z3',q:false,bar:true}};
let MS='ndti';const MBAD=B.map((r,i)=>r.jumlah_citra<=3?i:-1).filter(i=>i>=0);
$('#mbtn').innerHTML=Object.keys(MET).map(k=>`<button data-m="${k}">${MET[k].n}</button>`).join('');
$$('#mbtn button').forEach(b=>b.onclick=()=>{MS=b.dataset.m;drawMon()});
function drawMon(){$$('#mbtn button').forEach(b=>b.classList.toggle('on',b.dataset.m===MS));const m=MET[MS],c=css(m.c);
 const v=B.map(r=>r[MS]==null?null:(m.pct?r[MS]*100:r[MS]));const skip=m.q?MBAD:[];
 const lab=B.map(r=>r.bulan);const shade=[];B.forEach((r,i)=>{const mo=+r.bulan.slice(5);if(mo===9&&i+1<B.length)shade.push([i,Math.min(i+1,B.length-1),css('--ac2')])});
 chart($('#ch-mon'),{labels:lab,ymin:m.lo,ymax:m.hi,ticks:nice(m.lo,m.hi,m.st),yf:t=>m.pct?t+'%':(m.d?t.toFixed(1):t),ytitle:m.yt,
  series:[m.bar?{v,c,bar:true}:{v,c,skip,dots:true,r:2.2}],bars:m.bar,shade:m.bar?[]:shade,
  marks:[{i:lab.indexOf('2025-03'),t:'Mar 2025'}],xshow:i=>lab[i].endsWith('-01'),xl:i=>lab[i].slice(0,4),aria:m.n+' bulanan',
  tip:i=>{const r=B[i];return`<b>${ml(r.bulan)}</b><br>${m.n}: ${v[i]==null?'tidak ada data':fmt(v[i],m.d)+(m.pct?'%':m.bar?' mm':'')}<br>Jumlah citra: ${r.jumlah_citra}${m.q&&r.jumlah_citra<=3?' <i>(kurang bisa dipercaya)</i>':''}`}});
 const sea=BLN.map((_,k)=>{const xs=B.filter((r,i)=>+r.bulan.slice(5)===k+1&&!skip.includes(i)&&r[MS]!=null).map(r=>m.pct?r[MS]*100:r[MS]);return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null});
 const slo=MS==='frac_air'?40:m.lo,shi=MS==='frac_air'?65:(MS==='ndti'?0:m.hi*.7);
 chart($('#ch-sea'),{h:250,labels:BLN,ymin:slo,ymax:shi,ticks:nice(slo,shi,MS==='frac_air'?5:m.st),yf:t=>m.pct?t+'%':(m.d?t.toFixed(1):t),
  series:[MS==='ndti'?{v:sea.map(x=>x-slo+slo),c,bar:false,r:4,w:3}:{v:sea,c,bar:true}],bars:MS!=='ndti',xshow:()=>true,xl:i=>BLN[i],aria:'Pola musiman '+m.n,
  tip:i=>`<b>${BLN[i]}</b><br>Rata-rata ${m.n.toLowerCase()}: ${fmt(sea[i],m.d)}${m.pct?'%':m.bar?' mm':''}`});
 const ok=B.length-MBAD.length;$('#mon-note').textContent=m.q?`Rata-rata dihitung dari ${ok} bulan dengan lebih dari 3 citra (dari ${B.length} bulan). Pita biru muda pada grafik atas menandai September–Oktober, periode kekeruhan tertinggi.`:`Rata-rata dari seluruh bulan yang tersedia. Data hujan Oktober 2026 belum tersedia di CHIRPS saat data diambil.`}

/* ---------- Tabel ---------- */
let DS='zona';const COLS={zona:'zona; kuartal (bulan awal kuartal); jumlah_citra = citra lolos saringan awan; frek_air = seberapa sering piksel terlihat sebagai air (0–1); luas_air_tetap_ha = luas area yang hampir selalu air; stumpf = rasio biru/hijau, eksploratori dan tidak dipakai.',
 bulanan:'bulan; jumlah_citra; ndti = indeks kekeruhan; merah_air = pantulan merah di air; frac_air = proporsi area berupa air (0–1); hujan_mm = curah hujan CHIRPS.'};
function drawTbl(){const T=DS==='zona'?ZT:BT,rows=T.split(/\r?\n/),h=rows[0].split(',');
 const bad=r=>DS==='zona'?r[1]===OUT:(+r[1]<=3);
 $('#tbl').innerHTML='<thead><tr>'+h.map(x=>`<th>${x}</th>`).join('')+'</tr></thead><tbody>'+rows.slice(1).map(l=>{const r=l.split(',');
  return`<tr${bad(r)?' class="bad"':''}>`+r.map((x,i)=>`<td>${x===''?'–':(i>1&&!isNaN(+x)?(+x).toLocaleString('id-ID',{maximumFractionDigits:i===2?0:4}):(DS==='zona'&&i===0?ZN[x]:x))}</td>`).join('')+'</tr>'}).join('')+'</tbody>';
 $('#colnote').textContent=COLS[DS];$$('#dbtn button[data-d]').forEach(b=>b.classList.toggle('on',b.dataset.d===DS))}
$$('#dbtn button[data-d]').forEach(b=>b.onclick=()=>{DS=b.dataset.d;drawTbl()});
if($('#copy'))$('#copy').onclick=async()=>{try{await navigator.clipboard.writeText(DS==='zona'?ZT:BT);$('#copied').textContent='Tersalin. Tempel ke Excel atau Notepad.'}catch(e){$('#copied').textContent='Penyalinan ditolak peramban. Pilih isi tabel lalu salin manual.'}};

/* ---------- Berita ---------- */
const NCAT={artikel:{n:'Artikel',c:'--z1'},video:{n:'Video',c:'--rd'},instagram:{n:'Instagram',c:'--z3'}};
const BERITA=[
 {d:'2025-04-30',src:'Pemprov Bengkulu',k:'artikel',t:'Wagub Mian Paparkan Masalah Pendangkalan Alur Pulau Baai ke Komisi II DPR RI: Ekonomi Bengkulu Tersendat, Pelindo Tak Serius Tangani Pendangkalan Alur',r:'Dalam rapat dengar pendapat dengan Komisi II DPR RI, Wakil Gubernur Bengkulu memaparkan pendangkalan alur dan meminta dukungan pemerintah pusat. Ia menyebut aktivitas pelabuhan terhenti sekitar tiga bulan, distribusi barang terganggu, dan antrean terjadi di SPBU karena kapal BBM tidak bisa bersandar.',u:'https://bengkuluprov.go.id/wagub-mian-paparkan-masalah-pendangkalan-alur-pulau-baai-ke-komisi-ii-dpr-ri-ekonomi-bengkulu-tersendat-pelindo-tak-serius-tangani-pendangkalan-alur/',img:'https://bengkuluprov.go.id/wp-content/uploads/2025/05/494424503_2382240762159075_3282316176394448400_n.jpg'},
 {d:'2025-06-23',src:'Kompas',k:'artikel',t:'Sudah Status Darurat, tapi Sedimentasi Alur Pelabuhan Pulau Baai Tetap Berlarut',r:'Pengerukan dipercepat dengan kapal penyedot pasir dan tambahan alat berat. Alur yang tertutup total sejak akhir Maret 2025 sempat tertutup lagi setelah gempa 23 Mei 2025, dan 15 kapal kandas di sekitar pelabuhan. Target awal alur 60 m × 4 m, sedangkan kondisi normal 150 m × 12 m.',u:'https://www.kompas.id/artikel/sudah-status-darurat-tapi-sedimentasi-alur-pelabuhan-pulau-baai-tetap-berlarut',img:'gambar/berita/kompas.jpg'},
 {d:'2025-07-04',src:'TVR Parlemen',k:'video',t:'Komisi V DPR RI: Segera Atasi Pendangkalan Pelabuhan Pulau Baai',r:'Liputan tentang desakan Komisi V DPR RI agar pendangkalan segera ditangani, karena sekitar 4.000 warga Pulau Enggano terisolasi dan ekonomi pulau terganggu selama berbulan-bulan.',u:'https://www.youtube.com/watch?v=wjliExn6JfQ',yt:'wjliExn6JfQ'},
 {d:'2025-07-16',src:'KOMPASTV',k:'video',t:'Warga Pulau Enggano Masih Terdampak Pendangkalan Alur Pelabuhan Pulau Baai',r:'Meski alur pelayaran mulai normal, harga pisang, kakao, emping melinjo, dan hasil tangkapan nelayan Enggano masih rendah. Ekonomi pulau belum pulih sepenuhnya.',u:'https://www.youtube.com/watch?v=UQwpXApBcbw',yt:'UQwpXApBcbw'},
 {d:'2026-09-30',src:'BRIN',k:'artikel',t:'Pendangkalan Pelabuhan Pulau Baai Puluhan Tahun, BRIN Dorong Peta Jalan Berbasis Riset',r:'BRIN meminta Pemprov Bengkulu menyusun peta jalan penanganan lintas sektor hingga 2045. Kedalaman alur disebut sekitar minus 8 meter, sehingga sebagian komoditas Bengkulu masih diekspor lewat Lampung.',u:'https://brin.go.id/news/130613/pendangkalan-pelabuhan-pulau-baai-puluhan-tahun-brin-dorong-peta-jalan-berbasis-riset',img:'gambar/berita/brin.jpg'},
 {d:'',src:'Instagram',k:'instagram',t:'Unggahan Instagram tentang pendangkalan Pulau Baai',r:'Unggahan foto di Instagram. Klik pratinjau untuk menampilkan unggahannya langsung di halaman ini, atau buka di Instagram.',u:'https://www.instagram.com/p/De1EW8nCajR/',ig:'p/De1EW8nCajR'},
 {d:'',src:'Instagram',k:'instagram',t:'Reel Instagram tentang pendangkalan Pulau Baai',r:'Video pendek (reel) di Instagram. Klik pratinjau untuk menampilkan reel langsung di halaman ini, atau buka di Instagram.',u:'https://www.instagram.com/reel/DLplQ1az_z8/',ig:'reel/DLplQ1az_z8'}];
const BLN2=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const tgl=d=>d?+d.slice(8)+' '+BLN2[+d.slice(5,7)-1]+' '+d.slice(0,4):'';
/* Video dan Instagram bisa diputar di halaman hanya di website GitHub; di tempat lain dibuka di situs aslinya */
const CAN_EMBED=/github\.io$/.test(location.hostname);
let NK='semua',NO='asc';
$('#nw-cat').innerHTML=`<button data-k="semua">Semua (${BERITA.length})</button>`+Object.keys(NCAT).map(k=>`<button data-k="${k}">${NCAT[k].n} (${BERITA.filter(b=>b.k===k).length})</button>`).join('');
$$('#nw-cat button').forEach(b=>b.onclick=()=>{NK=b.dataset.k;drawNews()});
$$('#nw-ord button').forEach(b=>b.onclick=()=>{NO=b.dataset.o;drawNews()});
const DT=BERITA.filter(b=>b.d).map(b=>b.d).sort();
/*stat lama*/void `<div class="kpi"><strong>${BERITA.filter(b=>b.k==='artikel').length} artikel</strong><span>dari pemerintah daerah, media, dan lembaga riset</span></div><div class="kpi r"><strong>${BERITA.filter(b=>b.k==='video').length} video</strong><span>liputan televisi di YouTube</span></div><div class="kpi"><strong>${BERITA.filter(b=>b.k==='instagram').length} unggahan</strong><span>di Instagram</span></div><div class="kpi w"><strong>${tgl(DT[0]).replace(/^\d+ /,'')} – ${tgl(DT[DT.length-1]).replace(/^\d+ /,'')}</strong><span>rentang waktu liputan</span></div>`;
const IGI='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor"/></svg>';
function thumb(b,i){if(!b.yt&&!b.ig&&!b.img)return`<a class="nwt" href="${esc(b.u)}" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true"><span class="nwph">${esc(b.src)}</span><span class="nwk">${NCAT[b.k].n}</span></a>`;const lbl=`<span class="nwk">${NCAT[b.k].n}</span>`;
 if(b.yt)return`<button class="nwt" data-i="${i}" aria-label="Putar video: ${esc(b.t)}"><img src="https://i.ytimg.com/vi/${b.yt}/hqdefault.jpg" alt="" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'nwph',textContent:'${esc(b.src)}'}))"><span class="play" aria-hidden="true">▶</span>${lbl}</button>`;
 if(b.ig)return`<button class="nwt ig" data-i="${i}" aria-label="Tampilkan pratinjau Instagram"><span class="nwph igph">${IGI}<b>${b.ig.startsWith('reel')?'Reel':'Unggahan'} Instagram</b><small>${CAN_EMBED?'Klik untuk menampilkan pratinjau':'Klik untuk membuka di Instagram'}</small></span>${lbl}</button>`;
 return`<a class="nwt" href="${esc(b.u)}" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true"><img src="${esc(b.img)}" alt="" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'nwph',textContent:'${esc(b.src)}'}))">${lbl}</a>`}
function drawNews(){$$('#nw-cat button').forEach(b=>b.classList.toggle('on',b.dataset.k===NK));$$('#nw-ord button').forEach(b=>b.classList.toggle('on',b.dataset.o===NO));
 const L=BERITA.map((b,i)=>({...b,i})).filter(b=>NK==='semua'||b.k===NK).sort((a,b)=>!a.d?1:!b.d?-1:(NO==='asc'?a.d.localeCompare(b.d):b.d.localeCompare(a.d)));
 $('#nw-list').innerHTML=L.map(b=>`<article class="nw" style="--c:var(${NCAT[b.k].c})">${thumb(b,b.i)}<div class="nwb"><div class="meta"><span class="src">${esc(b.src)}</span>${b.d?`<span>${tgl(b.d)}</span>`:''}</div><h3>${esc(b.t)}</h3><p>${esc(b.r)}</p><a class="rd" href="${esc(b.u)}" target="_blank" rel="noopener noreferrer">${b.k==='video'?'Tonton di YouTube':b.k==='instagram'?'Buka di Instagram':'Baca di sumber'} ↗</a></div></article>`).join('');
 $$('#nw-list button.nwt').forEach(t=>t.onclick=()=>{const b=BERITA[+t.dataset.i];
  if(!CAN_EMBED){window.open(b.u,'_blank','noopener');return}
  const f=document.createElement('iframe');f.className=b.yt?'nwv':'nwv igv';f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';f.allowFullscreen=true;f.title=b.t;
  f.src=b.yt?`https://www.youtube-nocookie.com/embed/${b.yt}?autoplay=1&rel=0`:`https://www.instagram.com/${b.ig}/embed`;t.replaceWith(f)})}

/* ---------- Referensi ilmiah dan dokumen ---------- */
const SCI=[
 {a:'Arifin, L., Hutagaol, J. P., & Hanafi, M.',y:'2003',t:'Pendangkalan alur pelayaran di Pelabuhan Pulau Baai Bengkulu',j:'Jurnal Geologi Kelautan',v:'1(3), 29–37',doi:'10.32693/jgk.1.3.2003.101',u:'https://doi.org/10.32693/jgk.1.3.2003.101',lk:'Buka artikel (DOI)',
  f:'Survei pemeruman, arus, dan pasang surut menunjukkan kedalaman kolam dan alur sekitar 12 m. Arus saat pasang lebih kuat sehingga pengendapan lebih besar saat air pasang, diperkuat arus sepanjang pantai yang membawa sedimen ke alur. Tipe pasang surutnya campuran ganda dengan beda tinggi muka air 1,53 m.',
  p:'Mekanisme simulasi: arus pasang lebih kuat dari surut, arus sepanjang pantai, dan skala kedalaman alur 12 m.'},
 {a:'Hutari, P. Z., Johan, Y., & Negara, B. F. S. P.',y:'2018',t:'Analisis sedimentasi di Pelabuhan Pulau Baai Kota Bengkulu',j:'Jurnal Enggano',v:'3(1), 129–143',u:'https://scholar.google.com/scholar?q=%22Analisis+sedimentasi+di+Pelabuhan+Pulau+Baai+Kota+Bengkulu%22',lk:'Cari di Google Scholar',
  f:'Sampel sedimen dari enam lokasi (Februari–Maret 2016) seluruhnya bertekstur pasir. Laju sedimentasi tertinggi tercatat di alur pelayaran dan terendah di muara sungai.',
  p:'Jenis sedimen (pasir) dalam simulasi dan penentuan lokasi zona pengamatan citra satelit di sekitar pier dan mulut alur.'},
 {a:'Mawardi',y:'2016',t:'Inovasi mengatasi pendangkalan pada Pelabuhan Tapak Paderi Kota Bengkulu',j:'Inersia: Jurnal Teknik Sipil',v:'8(1)',u:'https://garuda.kemdiktisaintek.go.id/documents/detail/1225880',lk:'Buka di Garuda',x:'Pelabuhan lain di Kota Bengkulu',
  f:'Di Pelabuhan Tapak Paderi, sedimen di pintu masuk pelabuhan berasal dari Sungai Air Bengkulu akibat erosi dan penambangan di hulu, dengan arus dominan dari utara ke selatan. Penelitian ini mengusulkan bangunan groin untuk menahan sedimen sebelum masuk ke pelabuhan.',
  p:'Konteks bahwa pendangkalan pelabuhan adalah masalah berulang di pesisir Kota Bengkulu, serta contoh solusi struktural sebagai bahan tindak lanjut.'}];
function citeText(r){return `${r.a} (${r.y}). ${r.t}. ${r.j}, ${r.v}.${r.doi?' https://doi.org/'+r.doi:''}`}
$('#ref-sci').innerHTML=SCI.map((r,i)=>`<article class="ref"><span class="no">${i+1}</span><div><p class="cit">${esc(r.a)} (${r.y}). ${esc(r.t)}. <i>${esc(r.j)}</i>, ${esc(r.v)}.${r.x?`<span class="tagx">${esc(r.x)}</span>`:''}</p>
<dl><dt>Temuan utama</dt><dd>${esc(r.f)}</dd><dt>Dipakai untuk</dt><dd>${esc(r.p)}</dd></dl>
<div class="acts"><a href="${esc(r.u)}" target="_blank" rel="noopener noreferrer">${esc(r.lk)} ↗</a><button data-ci="${i}">Salin sitasi</button><span class="ok"></span></div></div></article>`).join('');
$$('#ref-sci button[data-ci]').forEach(b=>b.onclick=async()=>{const ok=b.nextElementSibling;try{await navigator.clipboard.writeText(citeText(SCI[+b.dataset.ci]));ok.textContent='Sitasi tersalin.'}catch(e){ok.textContent='Gagal menyalin. Pilih teks sitasi lalu salin manual.'}});
const DOCS=[
 {t:'Instruksi Presiden Nomor 12 Tahun 2025',d:'Upaya penanganan keadaan tertentu untuk normalisasi alur pelayaran Pelabuhan Pulau Baai, transportasi dan logistik, serta percepatan pembangunan Pulau Enggano. Ditetapkan 24 Juni 2025.',u:'https://peraturan.bpk.go.id/Details/329086/inpres-no-12-tahun-2025',lk:'JDIH BPK'},
 {t:'Citra satelit Sentinel-2 (program Copernicus)',d:'Citra optik resolusi 10 m periode 2019–2026, sumber indikator kekeruhan dan luas air tetap pada tab Data Satelit.'},
 {t:'Curah hujan CHIRPS',d:'Data curah hujan bulanan untuk area studi pada tab Data Satelit.',u:'https://www.chc.ucsb.edu/data/chirps',lk:'Climate Hazards Center'},
 {t:'Google Earth Engine',d:'Platform pengolahan citra satelit yang dipakai untuk mengambil dan merangkum data per bulan dan per kuartal.',u:'https://earthengine.google.com',lk:'earthengine.google.com'}];
$('#ref-doc').innerHTML=DOCS.map((r,i)=>`<article class="ref"><span class="no">${String.fromCharCode(65+i)}</span><div><p class="cit"><b>${esc(r.t)}</b></p><p class="note" style="margin:0 0 6px">${esc(r.d)}</p>${r.u?`<div class="acts"><a href="${esc(r.u)}" target="_blank" rel="noopener noreferrer">${esc(r.lk)} ↗</a></div>`:''}</div></article>`).join('');
const nMedia=BERITA.length;
$('#ref-stat').innerHTML=`<div class="kpi"><strong>${SCI.length} artikel ilmiah</strong><span>tentang sedimentasi pelabuhan di Bengkulu</span></div><div class="kpi r"><strong>${nMedia} liputan media</strong><span>artikel, video, dan unggahan</span></div><div class="kpi w"><strong>${DOCS.length} data dan dokumen</strong><span>peraturan, citra satelit, dan curah hujan</span></div>`;

/* ---------- Galeri ---------- */
const GAL=[
 {id:'area-studi',t:'Area studi',c:'Kotak area studi Pelabuhan Pulau Baai di Google Earth Engine.'},
 {id:'zona',t:'Empat zona pengamatan',c:'Peta dasar satelit dengan kotak zona dari skrip Earth Engine. Merah = sisi barat pier (ujung semenanjung pelabuhan), kuning = mulut alur masuk, hijau = sisi timur pier termasuk pulau kecil di depan alur, putih = pantai pembanding di utara yang jauh dari pengaruh pelabuhan.'},
 {id:'fa-2019',t:'Frekuensi air 2019 (kondisi awal)',c:'Menunjukkan seberapa sering tiap titik terlihat sebagai air sepanjang tahun. Biru tua = hampir selalu air, cokelat = hampir selalu darat, biru muda dan krem = kadang air kadang darat (zona pasang surut atau pasir yang timbul tenggelam). Pada 2019 tanggul pasir di sisi timur memanjang dari utara hingga hampir menyatu dengan pulau kecil di depan alur, dengan pita pasir krem di sepanjang sisi lautnya.'},
 {id:'fa-2022',t:'Frekuensi air 2022',c:'Cara membaca sama seperti 2019. Polanya masih mirip: tanggul pasir timur memanjang ke arah pulau kecil, dan celah di antaranya hanya berupa jalur sempit biru muda, yaitu air dangkal yang kadang kering. Pangkal tanggul di sebelah utara tampak lebih lebar dengan pasir krem.'},
 {id:'fa-2025',t:'Frekuensi air 2025',c:'Bentuknya berubah jelas. Ujung tanggul pasir timur kini lebih pendek dan melengkung masuk ke arah teluk, sehingga terbuka celah air yang lebar antara tanggul dan pulau kecil. Ujung timur pulau kecil berwarna putih krem (pasir yang baru timbul). Di laut depan mulut alur muncul bercak biru lebih muda, yaitu area yang lebih jarang terbaca sebagai air: kemungkinan dangkalan atau air yang sangat keruh.'},
 {id:'wa-2023',t:'Warna asli 2023',c:'Gabungan (median) citra Sentinel-2 sepanjang 2023 yang awannya di bawah 20%, dalam warna seperti dilihat mata. Tanggul pasir timur tampak sebagai garis pasir putih tipis yang berakhir di depan pulau kecil, dan celah di antaranya berupa air hijau toska yang dangkal. Air di dalam kolam pelabuhan gelap dan keruh.'},
 {id:'wa-2025',t:'Warna asli 2025',c:'Dibandingkan 2023, pasir putih di pulau kecil bertambah, terutama di sisi utara dan timurnya, dan ujung tanggul pasir timur membentuk kait pasir putih. Celah di antara keduanya masih terbuka. Warna toska di depan mulut alur menandakan dasar perairan yang dangkal.'},
 {id:'wa-2026',t:'Warna asli 2026',c:'Perubahan paling mencolok: hamparan pasir putih luas memanjang dari pulau kecil ke arah tanggul pasir timur dan hampir menutup celah di antara keduanya. Penyebabnya belum dapat dipastikan, bisa endapan alami atau pasir hasil pengerukan yang ditumpuk di samping alur. Citra tampak sedikit berkabut karena gabungan tahun 2026 memakai lebih sedikit citra bebas awan.'}];
const GAL2=[
 {id:'g-selisih',t:'Selisih zona terhadap pantai pembanding',c:'Per kuartal, pola musiman sudah dikoreksi. Negatif berarti area air menyempit. Pita abu-abu = kisaran normal 2019–2022 (±2 simpangan baku). Kuartal IV 2020 tidak ditampilkan karena datanya tidak wajar.'},
 {id:'g-zona',t:'Luas perairan tetap per zona',c:'Air lebih dari 50% pengamatan Sentinel-2, per kuartal, dengan rata-rata 2019–2021 sebagai pembanding. Tanda x = Kuartal IV 2020, dibuang karena tidak wajar.'},
 {id:'g-ndti',t:'Kekeruhan air (NDTI) per bulan, grafik GEE',c:'Ekspor langsung dari Google Earth Engine. Semua bulan ikut tergambar, termasuk bulan dengan sedikit citra karena awan.'},
 {id:'g-frac',t:'Fraksi air di area studi per bulan, grafik GEE',c:'Ekspor langsung dari Google Earth Engine. Hampir semua lonjakan tajam (akhir 2020, awal 2021, awal 2022, awal 2023, Januari 2025, Januari 2026) terjadi pada bulan dengan 3 citra atau kurang akibat awan, jadi bukan perubahan pantai yang nyata.'}];
let IMG={};try{IMG=JSON.parse($('#img-data').textContent)}catch(e){}
/* Galeri: gambar bawaan + gambar yang diunggah pemilik lewat penyimpanan artifact (db + assets) */
let ST={img:{},cap:{},title:{},extra:[]},ED=null,DBREF=null,DBOK=false,saving=Promise.resolve();
const srcOf=id=>IMG[id]||null;
const ttl=g=>ST.title[g.id]||g.t,cap=g=>ST.cap[g.id]??g.c;
function fig(g){const src=srcOf(g.id);if(!src&&!ED)return'';
 let h=`<figure data-id="${esc(g.id)}">`+(src?`<img src="${esc(src)}" alt="${esc(ttl(g))}">`:`<div class="ph">Belum ada gambar<br>(${esc(ttl(g))})</div>`)+`<figcaption><b>${esc(ttl(g))}</b><span class="cp">${esc(cap(g))}</span>`;
 if(ED){h+=`<div class="ebar"><button data-a="up">${src?'Ganti gambar':'Unggah gambar'}</button><button data-a="cap">Ubah teks</button>${ST.img[g.id]?'<button data-a="del">Hapus unggahan</button>':''}${g.x?'<button data-a="rm">Hapus kotak</button>':''}</div><div class="emsg note"></div>`}
 return h+'</figcaption></figure>'}
function renderGal(){const L1=GAL.concat(ST.extra.map(x=>({...x,x:true})));
 $('#gal').innerHTML=L1.map(fig).join('')+(ED?`<figure class="add"><div class="ph"><span>Tambah gambar baru<br><button data-a="add" style="margin-top:8px">+ Tambah kotak</button></span></div><figcaption class="note">Untuk citra lain dari GEE yang ingin ditampilkan.</figcaption></figure>`:'');
 $('#gal2').innerHTML=GAL2.map(fig).join('');
 ['#gal','#gal2'].forEach(s=>{const has=$(s).querySelector('figure');$(s).style.display=has?'':'none';const nx=$(s).nextElementSibling;if(nx&&nx.classList.contains('empty'))nx.remove();if(!has)$(s).insertAdjacentHTML('afterend','<p class="note empty">'+(GSTATE==='loading'?'Memuat gambar…':GSTATE==='offline'?'Gambar galeri hanya tampil pada versi online website. Buka tautan website saat terhubung ke internet dan masuk ke akun Claude.':GSTATE==='error'?'Gambar tidak dapat dimuat saat ini. Coba muat ulang halaman.':'Gambar belum ditambahkan.')+'</p>')});
 $$('#gal img,#gal2 img').forEach(im=>im.onclick=()=>lbOpen(im));
 $$('#gal img,#gal2 img').forEach(im=>im.onerror=()=>{im.replaceWith(Object.assign(document.createElement('div'),{className:'ph',textContent:'Gambar tidak dapat dimuat'}))})}
function allG(){return GAL.concat(GAL2,ST.extra.map(x=>({...x,x:true})))}
function save(){saving=saving.then(()=>DBREF.set(JSON.parse(JSON.stringify(ST)))).catch(e=>{throw e});return saving}
const ERRS={too_large:'File terlalu besar (maksimal 20 MB).',unsupported_type:'Format tidak didukung. Pakai PNG, JPG, atau WebP.',quota_or_state:'Penyimpanan penuh atau tidak tersedia.',rate_limited:'Terlalu cepat, coba lagi sebentar lagi.',invalid_argument:'Penyimpanan menolak perubahan ini.',quota_exceeded:'Penyimpanan penuh.'};
const emsg=(f,t)=>{const m=f&&f.querySelector('.emsg');if(m)m.textContent=t};
document.addEventListener('click',async ev=>{const b=ev.target.closest('button[data-a]');if(!b||!ED||!DBOK)return;const f=b.closest('figure'),id=f&&f.dataset.id,a=b.dataset.a;
 try{
 if(a==='up'){const inp=Object.assign(document.createElement('input'),{type:'file',accept:'image/png,image/jpeg,image/webp,image/gif'});
  inp.onchange=async()=>{const file=inp.files[0];if(!file)return;emsg(f,'Mengunggah…');
   try{const r=await ED.upload(file);const old=ST.img[id];ST.img={...ST.img,[id]:r.id};await save();renderGal();if(old)ED.delete(old).catch(()=>{})}
   catch(e){emsg(f,ERRS[e&&e.code]||'Gagal mengunggah. Coba lagi.')}};inp.click()}
 else if(a==='cap'){const g=allG().find(x=>x.id===id),fc=f.querySelector('figcaption');
  fc.innerHTML=`<label class="note">Judul<input class="ti" value="${esc(ttl(g))}"></label><label class="note">Keterangan<textarea class="tc" rows="3">${esc(cap(g))}</textarea></label><div class="ebar"><button data-a="capsave" class="on">Simpan</button><button data-a="capx">Batal</button></div><div class="emsg note"></div>`}
 else if(a==='capsave'){const t=f.querySelector('.ti').value.trim(),c=f.querySelector('.tc').value.trim();const ex=ST.extra.findIndex(x=>x.id===id);
  if(ex>=0){ST.extra=ST.extra.map((x,i)=>i===ex?{...x,t:t||x.t,c}:x)}else{ST.title={...ST.title,[id]:t};ST.cap={...ST.cap,[id]:c}}
  emsg(f,'Menyimpan…');await save();renderGal()}
 else if(a==='capx'){renderGal()}
 else if(a==='del'){if(b.dataset.ok!=='1'){b.dataset.ok='1';b.textContent='Klik lagi untuk menghapus';return}
  const old=ST.img[id],n={...ST.img};delete n[id];ST.img=n;await save();renderGal();if(old)ED.delete(old).catch(()=>{})}
 else if(a==='rm'){if(b.dataset.ok!=='1'){b.dataset.ok='1';b.textContent='Klik lagi untuk menghapus kotak';return}
  const old=ST.img[id],n={...ST.img};delete n[id];ST.img=n;ST.extra=ST.extra.filter(x=>x.id!==id);await save();renderGal();if(old)ED.delete(old).catch(()=>{})}
 else if(a==='add'){ST.extra=ST.extra.concat([{id:'x'+Date.now().toString(36),t:'Gambar baru',c:'Tulis keterangan gambar di sini.'}]);await save();renderGal()}
 }catch(e){emsg(f,ERRS[e&&e.code]||'Gagal menyimpan. Coba lagi.')}});
let GSTATE='loading';
renderGal();
async function getClaude(){for(let i=0;i<1;i++){if(window.claude&&typeof window.claude.use==='function')return window.claude;await new Promise(r=>setTimeout(r,250))}return null}
function applySnap(sn,ed,tm){const d=sn&&sn.exists?sn.data():{};ST={img:{...(d.img||{})},cap:{...(d.cap||{})},title:{...(d.title||{})},extra:Array.isArray(d.extra)?d.extra.filter(x=>x&&typeof x.id==='string').map(x=>({id:x.id,t:String(x.t||''),c:String(x.c||'')})):[]};
 if(!(sn&&sn.metadata&&sn.metadata.fromCache)){clearTimeout(tm);DBOK=true;GSTATE='ready';if(ed&&!ED){ED=ed;$('#gal-ed').innerHTML='<b>Mode pemilik:</b> kamu bisa mengunggah, mengganti, dan menghapus gambar serta mengubah teksnya. Pengunjung lain tidak melihat tombol ini, dan kotak yang masih kosong disembunyikan dari mereka.'}}
 renderGal()}
(async()=>{const C=await getClaude();let db=null;if(C){try{db=await C.use('db')}catch(e){}}
 if(!db){GSTATE='offline';renderGal();return}
 let ed=null;try{ed=await C.use('assets')}catch(e){}
 DBREF=db.doc('galeri/data');const tm=setTimeout(()=>{if(ed)$('#gal-ed').textContent='Penyimpanan gambar belum terhubung. Muat ulang halaman nanti.'},10000);
 DBREF.get().then(sn=>{if(GSTATE!=='ready')applySnap(sn,ed,tm)}).catch(()=>{});
 DBREF.onSnapshot(sn=>applySnap(sn,ed,tm),e=>{clearTimeout(tm);GSTATE='error';renderGal();if(ed)$('#gal-ed').textContent='Penyimpanan gambar tidak tersedia saat ini.'})})();
/* Lightbox: judul, keterangan, dan navigasi sebelumnya/berikutnya */
let LB=[],LI=0;
function lbShow(){const x=LB[LI];if(!x)return;const im=$('#lb img');im.src=x.src;im.alt=x.t;$('#lb h3').textContent=x.t;$('#lb p').textContent=x.c;$('#lb .lbk').textContent=x.g+' · '+(LI+1)+' dari '+LB.length;
 const one=LB.length<2;$('#lb-prev').style.visibility=one?'hidden':'';$('#lb-next').style.visibility=one?'hidden':''}
function lbOpen(im){const all=$$('#gal img,#gal2 img');LB=all.map(m=>{const f=m.closest('figure');return{src:m.src,t:f.querySelector('b').textContent,c:f.querySelector('.cp').textContent,g:m.closest('#gal')?'Galeri citra':'Grafik'}});
 LI=Math.max(0,all.indexOf(im));lbShow();$('#lb').style.display='flex';document.body.style.overflow='hidden';$('#lb-close').focus()}
function lbClose(){$('#lb').style.display='none';document.body.style.overflow=''}
function lbGo(d){if(!LB.length)return;LI=(LI+d+LB.length)%LB.length;lbShow()}
$('#lb-prev').onclick=e=>{e.stopPropagation();lbGo(-1)};$('#lb-next').onclick=e=>{e.stopPropagation();lbGo(1)};$('#lb-close').onclick=lbClose;
$('#lb').addEventListener('click',e=>{if(e.target===$('#lb'))lbClose()});
addEventListener('keydown',e=>{if($('#lb').style.display!=='flex')return;if(e.key==='Escape')lbClose();else if(e.key==='ArrowLeft')lbGo(-1);else if(e.key==='ArrowRight')lbGo(1)});
let tx=null;$('#lb').addEventListener('touchstart',e=>{tx=e.touches[0].clientX},{passive:true});
$('#lb').addEventListener('touchend',e=>{if(tx==null)return;const dx=e.changedTouches[0].clientX-tx;tx=null;if(Math.abs(dx)>50)lbGo(dx<0?1:-1)});

function drawAll(){drawEWS();drawRaw();drawMon();drawTbl()}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(location.hash==='#data-satelit')drawAll()});
drawNews();
route();
