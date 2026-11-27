"use strict";
/* Écho — radios & podcasts, version ordinateur (appli web installable depuis Chrome). */

// ───────────────────────── Données ─────────────────────────
const RF = "https://stream.radiofrance.fr";
// Radios connues : quand on en ajoute une, on reprend son flux officiel, son logo et ses titres
const CATALOGUE = [
  { id: "couleur3", nom: "Couleur 3", slogan: "RTS · Lausanne", couleur: "#FF78CD", sombre: true, logo: "logos/logo_couleur3.png",
    flux: ["https://stream.srg-ssr.ch/m/couleur3/mp3_128"], meta: null },
  { id: "meuh", nom: "Radio Meuh", slogan: "La Clusaz", couleur: "#F2EFE8", sombre: true, logo: "logos/logo_meuh.png",
    flux: ["https://radiomeuh.ice.infomaniak.ch/radiomeuh-128.mp3"], meta: null },
  { id: "fip", nom: "FIP", slogan: "La radio éclectique", couleur: "#E1017A", logo: "logos/logo_fip.png",
    flux: [`${RF}/fip/fip_hifi.m3u8`, `${RF}/fip/fip_midfi.mp3`], meta: { rf: 7 } },
  { id: "fippop", nom: "FIP Pop", slogan: "Webradio FIP", couleur: "#017A93", logo: "logos/logo_fippop.png",
    flux: [`${RF}/fippop/fippop_hifi.m3u8`], meta: { rf: 78 } },
  { id: "fipjazz", nom: "FIP Jazz", slogan: "Webradio FIP", couleur: "#00475A", logo: "logos/logo_fipjazz.png",
    flux: [`${RF}/fipjazz/fipjazz_hifi.m3u8`], meta: { rf: 65 } },
  { id: "fipcultes", nom: "FIP Cultes", slogan: "Webradio FIP", couleur: "#0B2B3C", logo: "logos/logo_fipcultes.png",
    flux: [`${RF}/fipcultes/fipcultes_hifi.m3u8`], meta: { rf: 709 } },
  { id: "nova", nom: "Radio Nova", slogan: "Le grand mix", couleur: "#000000", logo: "logos/logo_nova.png",
    flux: ["https://novazz.ice.infomaniak.ch/novazz-128.mp3"], meta: { nova: "radio-nova" } },
  { id: "nostalgie", nom: "Nostalgie", slogan: "Les plus grands tubes", couleur: "#1B4093", logo: "logos/logo_nostalgie.png",
    flux: ["https://streaming.nrjaudio.fm/oug7girb92oc"], meta: { nrj: 197 } },
];

const THEMES_PODCASTS = [
  ["Tendances", null], ["Humour", 1303], ["Actualités", 1489], ["Société & culture", 1324], ["Histoire", 1487],
  ["True crime", 1488], ["Musique", 1310], ["Fiction", 1483], ["Sciences", 1533], ["Éducation", 1304],
  ["Santé & bien-être", 1512], ["Business", 1321], ["Technologie", 1318], ["Jeux vidéo", 1509], ["Sport", 1545], ["Arts", 1301],
  ["Cinéma & séries", 1309], ["Loisirs", 1502], ["Enfants & famille", 1305],
];

const MODES = [
  { id: "sombre", nom: "Sombre", fond: "#0F0B10", carte: "#1C161D", texte: "#FFFFFF", doux: "#B9AEB8" },
  { id: "noir", nom: "Noir absolu", fond: "#000000", carte: "#121212", texte: "#FFFFFF", doux: "#AAAAAA" },
  { id: "clair", nom: "Clair", fond: "#F7F3F5", carte: "#FFFFFF", texte: "#1A1418", doux: "#6E6470" },
];
const COULEURS = [
  { id: "rose", nom: "Rose orangé", a1: "#FF2D8A", a2: "#FF9A2E" },
  { id: "ocean", nom: "Océan", a1: "#00B4D8", a2: "#3A86FF" },
  { id: "menthe", nom: "Menthe", a1: "#14C98A", a2: "#9ED93A" },
  { id: "neon", nom: "Violet néon", a1: "#9D4EDD", a2: "#FF4FD8" },
  { id: "soleil", nom: "Coucher de soleil", a1: "#FF5E3A", a2: "#FFB627" },
  { id: "cerise", nom: "Cerise", a1: "#E0115F", a2: "#FF6B6B" },
  { id: "lagon", nom: "Lagon", a1: "#00C2A8", a2: "#00A3FF" },
  { id: "irise", nom: "Irisé", a1: "#E0218A", a2: "#1FB8B0" },
];

// ───────────────────────── Outils ─────────────────────────
const $ = (s) => document.querySelector(s);
const lire = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const PARTAGES = ["radiosPerso", "podcasts", "positions", "theme"];
const ecrire = (k, v) => {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
  // Données du compte : on note l'heure du changement et on prévient la synchronisation
  if (PARTAGES.includes(k)) { try { localStorage.setItem("maj", String(Date.now())); } catch {} window.changementLocal?.(); }
};
const echap = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const temps = (s) => { s = Math.max(0, Math.floor(s || 0)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(x).padStart(2, "0")}` : `${m}:${String(x).padStart(2, "0")}`; };
const propre = (t) => { t = String(t || "").replace(/\s+/g, " ").trim();
  const l = t.replace(/[^A-Za-zÀ-ÿ]/g, ""); if (l && l === l.toUpperCase() && l.length > 3) t = t.toLowerCase().replace(/(^|[\s(\-'"])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()); return t; };
const cleNom = (n) => String(n || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const melange = (a, b, k) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const x = p(a), y = p(b); return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, "0")).join(""); };

let nJsonp = 0;
function jsonp(url, param = "callback") {
  return new Promise((ok, ko) => {
    const nom = "__rf" + (++nJsonp);
    const s = document.createElement("script");
    const fin = () => { delete window[nom]; s.remove(); };
    const minuterie = setTimeout(() => { fin(); ko(new Error("délai")); }, 15000);
    window[nom] = (d) => { clearTimeout(minuterie); fin(); ok(d); };
    s.onerror = () => { clearTimeout(minuterie); fin(); ko(new Error("réseau")); };
    s.src = url + (url.includes("?") ? "&" : "?") + param + "=" + nom;
    document.head.appendChild(s);
  });
}
async function json(url, ms = 12000) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
  try { const r = await fetch(url, { signal: c.signal }); if (!r.ok) throw new Error(r.status); return await r.json(); }
  finally { clearTimeout(t); }
}

// ───────────────────────── Thème ─────────────────────────
let theme = lire("theme", { mode: "sombre", couleur: "rose" });
function appliquerTheme() {
  const m = MODES.find((x) => x.id === theme.mode) || MODES[0];
  const c = COULEURS.find((x) => x.id === theme.couleur) || COULEURS[0];
  const r = document.documentElement.style;
  r.setProperty("--fond", m.fond); r.setProperty("--carte", m.carte); r.setProperty("--texte", m.texte); r.setProperty("--doux", m.doux);
  r.setProperty("--a1", c.a1); r.setProperty("--a2", c.a2);
  if (c.id === "irise") r.setProperty("--degrade", "linear-gradient(120deg,#FF1F3D,#E0218A 30%,#8B2FD8 55%,#1FB8B0 78%,#FF7A59)");
  else r.removeProperty("--degrade");
  document.documentElement.classList.toggle("clair", m.id === "clair");
  document.querySelector('meta[name="theme-color"]').content = m.fond;
  ecrire("theme", theme);
  majLecteur();
}
function afficherOptions() {
  $("#choix-modes").innerHTML = MODES.map((m) => `<button data-mode="${m.id}" class="${m.id === theme.mode ? "actif" : ""}">
    <span class="carre" style="background:${m.fond};box-shadow:inset 0 -18px 0 ${m.carte}"></span>${m.nom}</button>`).join("");
  $("#choix-couleurs").innerHTML = COULEURS.map((c) => `<button data-couleur="${c.id}" class="${c.id === theme.couleur ? "actif" : ""}">
    <span class="rond" style="background:linear-gradient(135deg,${c.a1},${c.a2})"></span>${c.nom}</button>`).join("");
}
$("#panneau-options").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-mode],button[data-couleur]"); if (!b) return;
  if (b.dataset.mode) theme.mode = b.dataset.mode; else theme.couleur = b.dataset.couleur;
  appliquerTheme(); afficherOptions();
});

// ───────────────────────── Onglets / pages ─────────────────────────
let page = 0;
function allerPage(p) {
  page = p;
  document.querySelectorAll("#onglets button").forEach((b, i) => b.classList.toggle("actif", i === p));
  const b = document.querySelectorAll("#onglets button")[p];
  const g = $("#goutte"); g.style.left = b.offsetLeft + "px"; g.style.width = b.offsetWidth + "px";
  g.animate([{ transform: "scaleY(1)" }, { transform: "scaleY(.82) scaleX(1.08)" }, { transform: "scaleY(1)" }], { duration: 450 });
  document.querySelectorAll(".page").forEach((el, i) => { el.style.transform = `translateX(${-100 * p}%)`; el.classList.toggle("actif", i === p); });
  // Titre qui se transforme lettre par lettre
  const mot = p === 0 ? "adios" : "odcasts";
  $("#titre .lettre1").textContent = p === 0 ? "R" : "P";
  $("#titre-reste").innerHTML = [...mot].map((l, i) => `<span style="animation-delay:${i * 40}ms">${l}</span>`).join("");
}
document.querySelectorAll("#onglets button").forEach((b) => b.addEventListener("click", () => allerPage(+b.dataset.page)));
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return;
  if (e.key === "ArrowRight") allerPage(1); if (e.key === "ArrowLeft") allerPage(0);
  if (e.key === " ") { e.preventDefault(); basculerLecture(); }
});

// ───────────────────────── Radios ─────────────────────────
let perso = lire("radiosPerso", []);
const toutes = () => perso;
const titres = {}; // id → {titre, artiste, pochette}

// ───── Logos vérifiés : on essaie plusieurs images et on garde la première qui est nette ─────
function candidatsLogo(nom, logo, flux) {
  const l = [];
  if (logo) l.push(logo);
  if (annuaire) {
    const c = cleNom(nom);
    annuaire.filter((r) => r.favicon && (r.cle === c || (flux && flux.includes(r.url_resolved))))
      .sort((a, b) => b.clickcount - a.clickcount).forEach((r) => l.push(r.favicon));
  }
  return [...new Set(l.filter((u) => /^(https?:|logos\/)/.test(u)))].slice(0, 8);
}
function imgLogo(classe, nom, liste, idRadio = "") {
  const ini = echap((nom || "?")[0]);
  if (!liste.length) return `<div class="${classe === "logo" ? "initiale" : "ini"}">${ini}</div>`;
  return `<img class="${classe}" src="${echap(liste[0])}" alt="" loading="lazy" referrerpolicy="no-referrer"
    data-c="${echap(JSON.stringify(liste))}" data-i="0" data-ini="${ini}" data-radio-logo="${echap(idRadio)}"
    onload="verifLogo(this)" onerror="suivantLogo(this)">`;
}
window.suivantLogo = (img) => {
  const l = JSON.parse(img.dataset.c), i = +img.dataset.i + 1;
  if (i < l.length) { img.dataset.i = i; img.src = l[i]; return; }
  const d = document.createElement("div");
  d.className = img.classList.contains("logo") ? "initiale" : "ini"; d.textContent = img.dataset.ini;
  img.replaceWith(d);
};
window.verifLogo = (img) => {
  const w = img.naturalWidth, h = img.naturalHeight;
  if (w < 64 || h < 64) return suivantLogo(img); // trop petit : flou
  const r = w / h;
  img.classList.toggle("large", r < 0.85 || r > 1.18); // logo en longueur : posé sur fond clair, sans déformation
  // On retient le logo qui marche pour la prochaine fois (et pour le téléphone)
  const id = img.dataset.radioLogo;
  if (id) {
    const s = perso.find((x) => x.id === id);
    if (s && s.logo !== img.src && !String(s.logo || "").startsWith("logos/")) { s.logo = img.src; clearTimeout(window.__logos); window.__logos = setTimeout(() => ecrire("radiosPerso", perso), 1500); }
  }
};

function afficherRadios() {
  $("#radios-vide").hidden = toutes().length > 0;
  $("#grille-radios").innerHTML = toutes().map((s) => {
    const t = titres[s.id];
    const fond = `linear-gradient(160deg, ${s.couleur}, ${melange(s.couleur, "#000000", .25)})`;
    return `<div class="tuile ${s.sombre ? "sombre" : ""} ${courant?.type === "radio" && courant.id === s.id ? "en-cours" : ""}" draggable="true" data-radio="${s.id}" style="background:${fond}">
      ${imgLogo("logo", s.nom, candidatsLogo(s.nom, s.logo, s.flux), s.id)}
      <div class="etat"><div class="eq"><i></i><i></i><i></i></div></div>
      ${s.perso ? `<button class="retirer" data-retirer="${s.id}" title="Retirer">✕</button>` : ""}
      <div class="nom">${echap(s.nom)}</div>
      <div class="t1">${echap(t ? t.titre : s.slogan)}</div>
      <div class="t2">${echap(t ? t.artiste : "")}</div>
    </div>`;
  }).join("");
  if (toutes().some((s) => !verifiees?.has(s.id))) setTimeout(() => majTuiles(), 0);
}
$("#grille-radios").addEventListener("click", (e) => {
  const r = e.target.closest("[data-retirer]");
  if (r) { e.stopPropagation(); perso = perso.filter((s) => s.id !== r.dataset.retirer); ecrire("radiosPerso", perso); afficherRadios(); return; }
  const t = e.target.closest("[data-radio]"); if (!t) return;
  const s = toutes().find((x) => x.id === t.dataset.radio);
  if (courant?.type === "radio" && courant.id === s.id && !audio.paused) arreter(); else jouerRadio(s);
});

// ───── Titre en cours ─────
// On interroge les sites des radios ; quand un site refuse les navigateurs, on passe par un relais public.
// Plusieurs relais publics : on retient, pour chaque site, le chemin qui a marché la dernière fois.
const RELAIS = [
  (u) => u,
  (u) => "https://api.allorigins.win/raw?url=" + encodeURIComponent(u),
  (u) => "https://api.codetabs.com/v1/proxy/?quest=" + encodeURIComponent(u),
  (u) => "https://corsproxy.io/?url=" + encodeURIComponent(u),
];
const routeHote = {};
const memoire = {}; // réponses récentes partagées entre vignettes (ex. le fichier Nova commun)
async function lireTexte(url) {
  const m = memoire[url]; if (m && Date.now() - m.t < 4000) return m.p;
  const hote = new URL(url).host;
  const ordre = [...RELAIS.keys()]; const pref = routeHote[hote];
  if (pref != null) { ordre.splice(ordre.indexOf(pref), 1); ordre.unshift(pref); }
  const p = (async () => {
    let err;
    for (const i of ordre) {
      const c = new AbortController(); const t = setTimeout(() => c.abort(), i === 0 ? 5000 : 8000);
      try {
        const r = await fetch(RELAIS[i](url), { signal: c.signal, cache: "no-store" });
        if (!r.ok) throw new Error(r.status);
        const txt = await r.text(); routeHote[hote] = i; return txt;
      } catch (e) { err = e; } finally { clearTimeout(t); }
    }
    throw err;
  })();
  memoire[url] = { t: Date.now(), p }; p.catch(() => delete memoire[url]);
  return p;
}
const lireJson = async (url) => JSON.parse(await lireTexte(url));
const sansAccent = (x) => String(x || "").normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
function metaDe(s) {
  if (s.meta && Object.keys(s.meta).length) return s.meta;
  const p = String(s.metaTexte || "").split(":");
  if (p[0] === "rf") return { rf: +p[1] || 7 };
  if (p[0] === "nova") return { nova: p[1] };
  if (p[0] === "nrj") return { nrj: +p[1] };
  if (p[0] === "oui") return { oui: p[1] };
  if (p[0] === "lag") return { lag: [p[1], +p[2] || 1] };
  return officielParNom(s) || { icy: true };
}
// Radios ajoutées depuis l'annuaire : on reconnaît les grandes radios par leur nom ou leur flux (comme sur le téléphone)
const OUI_HOTES = {"ouifm.ice.infomaniak.ch":"2174546520932614531","ouifm3.ice.infomaniak.ch":"3134161803443976427","ouifm5.ice.infomaniak.ch":"3134161803443976526","ouifm2.ice.infomaniak.ch":"3134161803443976382","ouifmtopoftheweek.ice.infomaniak.ch":"3754485939764896014","ouifmgaragerock.ice.infomaniak.ch":"1016696403088961793","ouifmgirlsrock.ice.infomaniak.ch":"3864441174941011218","ouifmrockfrancais.ice.infomaniak.ch":"3820775684199026845","ouifmbluesnrock.ice.infomaniak.ch":"3134161803443976485","ouifmbringthenoise.ice.infomaniak.ch":"4004502594738215513","ouifmsummertime.ice.infomaniak.ch":"3652031559378160590","ouifmacoustic.ice.infomaniak.ch":"3906034555622012146","ouifmwoodstock.ice.infomaniak.ch":"3707948669989820452","ouifmlesslowsdurock.ice.infomaniak.ch":"3818508936105954443","ouifmganja.ice.infomaniak.ch":"3540892623380233022","ouifmrock60s.ice.infomaniak.ch":"3540892623380233039","ouifmrock70s.ice.infomaniak.ch":"3540892623380233057","ouifmrock80s.ice.infomaniak.ch":"3610476513821993259","ouifmrock90s.ice.infomaniak.ch":"3610476513821993340","ouifmrock2000s.ice.infomaniak.ch":"3652031559378160547","ouifmrocknfood.ice.infomaniak.ch":"3796007387461058949"};
const OFFICIELS = {
  franceinter: { rf: 1 }, franceinfo: { rf: 2 }, francemusique: { rf: 4 }, franceculture: { rf: 5 }, mouv: { rf: 6 }, fip: { rf: 7 },
  nostalgie: { nrj: 197 }, nrj: { nrj: 158 }, cheriefm: { nrj: 190 }, cherie: { nrj: 190 }, rireetchansons: { nrj: 200 }, rirechansons: { nrj: 200 },
  europe2: { lag: ["www.europe2.fr", 1] }, rfm: { lag: ["www.rfm.fr", 1] }, ouifm: { oui: "2174546520932614531" },
};
const EXTRAS = ["classics", "classic", "hits", "new", "80", "90", "2000", "best", "love", "rock", "dance", "jazz", "pop", "hiphop", "reggae", "soul", "nuit", "nouvelle", "chill", "latino", "rap"];
function officielParNom(s) {
  for (const f of s.flux || []) { try { const id = OUI_HOTES[new URL(f).host]; if (id) return { oui: id }; } catch {} }
  const mots = String(s.nom || "").normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  if (mots.includes("nova") || mots.includes("novazz")) return { nova: "?" + s.nom };
  const m = mots[0] === "radio" ? mots.slice(1) : mots;
  let trouve = null, n = 0, debut = "";
  m.slice(0, 4).forEach((w, i) => { debut += w; if (OFFICIELS[debut]) { trouve = OFFICIELS[debut]; n = i + 1; } });
  if (trouve && m.slice(n).some((w) => EXTRAS.includes(w) && !(w === "rock" && trouve.oui))) return null;
  return trouve;
}
const INUTILES = ["publicit", "advert", "jingle", "en direct", "live stream", "unknown", "inconnu", "now playing", "info goes here", "untitled", "no title"];
const utile = (t) => t && t.titre && !INUTILES.some((x) => (t.titre + " " + t.artiste).toLowerCase().includes(x)) && !/^\d+$/.test(t.titre);
async function titreIcecast(flux) {
  for (const u of flux) {
    try {
      const url = new URL(u);
      const d = await lireJson(url.origin + "/status-json.xsl");
      let src = d.icestats?.source; if (!src) continue;
      if (!Array.isArray(src)) src = [src];
      const s = src.find((x) => String(x.listenurl || "").endsWith(url.pathname)) || (src.length === 1 ? src[0] : null);
      const brut = s?.title || (s?.artist ? `${s.artist} - ${s.title || ""}` : "");
      if (!brut) continue;
      const i = brut.indexOf(" - ");
      return i > 0 ? { artiste: propre(brut.slice(0, i)), titre: propre(brut.slice(i + 3)), pochette: null } : { artiste: "", titre: propre(brut), pochette: null };
    } catch {}
  }
  return null;
}
async function titreRadio(s) {
  const m = metaDe(s);
  try {
    if (m.rf) {
      const d = await lireJson(`https://api.radiofrance.fr/livemeta/live/${m.rf}/webrf_webradio_player`);
      const n = d.now; if (!n || !n.songUuid) return null;
      return { titre: propre(n.firstLine), artiste: propre(n.secondLine || ""), pochette: n.cover ? `https://www.radiofrance.fr/pikapi/images/${n.cover}/400x400` : null };
    }
    if (m.nova) {
      const arr = await lireJson("https://www.nova.fr/radios-data/www.nova.fr/all.json");
      const cible = m.nova.startsWith("?") ? sansAccent(m.nova.slice(1)) : null;
      const r = cible ? (arr.find((x) => sansAccent(x.radio?.name) === cible) || arr.find((x) => sansAccent(x.radio?.name).includes(cible.replace(/^radio/, "")) || cible.includes(sansAccent(x.radio?.code))))
        : arr.find((x) => x.radio?.code === m.nova);
      const o = r?.currentTrack; if (!o?.title) return null;
      return { titre: propre(o.title), artiste: propre(o.artist), pochette: o.media_url || null };
    }
    if (m.nrj) {
      const d = await lireJson(`https://players.nrjaudio.fm/wr_api/live/fr?act=get_cur&id_wr=${m.nrj}&cp=utf8&fmt=json`);
      const o = d.itms?.[0]; if (!o || String(o.type).toUpperCase() !== "SINGLE" || !o.tit) return null;
      return { titre: propre(o.tit), artiste: propre(o.art), pochette: o.cov ? `https://players.nrjaudio.fm/live-metadata/player/img/600x/${o.cov}` : null };
    }
    if (m.oui) {
      const d = await lireJson(`https://www.ouifm.fr/api/TitleDiffusions?size=1&radioStreamId=${m.oui}&date=${Date.now()}`);
      const t = d?.[0]?.title; if (!t?.title) return null;
      return { titre: propre(t.title), artiste: propre(t.artist || ""), pochette: /^https?:/.test(t.coverUrl || "") ? t.coverUrl : null };
    }
    if (m.lag) {
      const o = await lireJson(`https://${m.lag[0]}/cache/titrage/${m.lag[1]}`);
      const cur = (o.nowplaying || []).find((e) => String(e.status).toLowerCase() === "playing") || o;
      if (!cur.title) return null;
      return { titre: propre(cur.title), artiste: propre(cur.artist || ""), pochette: cur.imageUrl || cur.image || null };
    }
    return await titreIcecast(s.flux || []);
  } catch { return null; }
}
async function pochetteDeezer(titre, artiste) {
  try {
    const d = await jsonp(`https://api.deezer.com/search?q=${encodeURIComponent(`artist:"${artiste}" track:"${titre}"`)}&limit=1&output=jsonp`);
    return d.data?.[0]?.album?.cover_xl || d.data?.[0]?.album?.cover_big || null;
  } catch { return null; }
}
async function majTitre() {
  if (courant?.type !== "radio") return;
  const s = toutes().find((x) => x.id === courant.id); if (!s) return;
  let t = await titreRadio(s);
  if (!utile(t)) t = null;
  if (t && !t.pochette && t.artiste) t.pochette = await pochetteDeezer(t.titre, t.artiste);
  if (courant?.type !== "radio" || courant.id !== s.id) return;
  const avant = titres[s.id];
  if (t) titres[s.id] = t; else delete titres[s.id];
  if (JSON.stringify(avant) !== JSON.stringify(t)) { afficherRadios(); majLecteur(); }
}
setInterval(majTitre, 5000);

// Titres de toutes les vignettes (pas seulement la radio en cours), mis à jour sans redessiner la grille
function majTexteTuile(s) {
  const el = document.querySelector(`#grille-radios [data-radio="${CSS.escape(s.id)}"]`); if (!el) return;
  const t = titres[s.id];
  el.querySelector(".t1").textContent = t ? t.titre : s.slogan || "";
  el.querySelector(".t2").textContent = t ? t.artiste : "";
  el.classList.toggle("avec-titre", !!t);
}
var tuilesEnCours = false;
var verifiees = new Set(); // radios déjà interrogées au moins une fois
async function majTuiles() {
  if (tuilesEnCours || document.hidden) return;
  tuilesEnCours = true;
  try {
    const file = [...toutes()];
    const travail = async () => {
      for (let s; (s = file.shift()); ) {
        let t = await titreRadio(s); if (!utile(t)) t = null;
        const ancien = titres[s.id];
        if (t) titres[s.id] = { ...t, pochette: ancien?.titre === t.titre ? ancien.pochette : t.pochette }; else delete titres[s.id];
        verifiees.add(s.id);
        majTexteTuile(s);
      }
    };
    await Promise.all([travail(), travail(), travail()]);
  } finally { tuilesEnCours = false; }
}
setInterval(majTuiles, 5000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) majTuiles(); });
majTuiles();

// ───────────────────────── Lecture ─────────────────────────
const audio = $("#audio");
let hls = null;
let courant = null; // {type:"radio", id} ou {type:"podcast", episode, podcast}
audio.volume = lire("volume", 0.9);
$("#l-volume").value = Math.round(audio.volume * 100);
$("#l-volume").addEventListener("input", (e) => { audio.volume = e.target.value / 100; ecrire("volume", audio.volume); });

function charger(url) {
  if (hls) { hls.destroy(); hls = null; }
  if (/\.m3u8/i.test(url) && !audio.canPlayType("application/vnd.apple.mpegurl") && window.Hls?.isSupported()) {
    hls = new Hls({ lowLatencyMode: false }); hls.loadSource(url); hls.attachMedia(audio);
  } else { audio.src = url; }
  return audio.play();
}
async function jouerRadio(s) {
  sauverPosition();
  courant = { type: "radio", id: s.id };
  majLecteur(); afficherRadios();
  for (const url of s.flux) {
    try { await charger(url); break; } catch (e) { if (e.name === "NotAllowedError") break; }
  }
  majTitre();
}
function arreter() { audio.pause(); if (courant?.type === "radio") { if (hls) { hls.destroy(); hls = null; } audio.removeAttribute("src"); audio.load(); } majLecteur(); afficherRadios(); }
function basculerLecture() {
  if (!courant) return;
  if (audio.paused) { if (courant.type === "radio") jouerRadio(toutes().find((x) => x.id === courant.id)); else audio.play(); }
  else if (courant.type === "radio") arreter(); else audio.pause();
}
$("#l-lire").addEventListener("click", basculerLecture);
$("#l-moins15").addEventListener("click", () => (audio.currentTime = Math.max(0, audio.currentTime - 15)));
$("#l-plus30").addEventListener("click", () => (audio.currentTime += 30));
$("#l-barre").addEventListener("input", (e) => { if (audio.duration) audio.currentTime = e.target.value / 1000 * audio.duration; });
// Lecture continue des podcasts : l'épisode suivant de la liste démarre à la fin du précédent
$("#opt-continue").checked = lire("lectureContinue", true);
$("#opt-continue").addEventListener("change", (e) => ecrire("lectureContinue", e.target.checked));
audio.addEventListener("ended", () => {
  if (courant?.type !== "podcast" || !lire("lectureContinue", true)) return;
  const p = courant.podcast; if (!p.episodes?.length) return;
  const l = [...p.episodes].sort((a, b) => recentsDabord ? b.date - a.date : a.date - b.date);
  const i = l.findIndex((x) => x.audio === courant.episode.audio);
  const suivant = l.slice(i + 1).find((x) => { const q = positions[x.audio]; return !(q && q.tot && q.pos / q.tot > .95); });
  if (i >= 0 && suivant) { jouerEpisode(p, suivant); if (podcastOuvert === p) setTimeout(afficherEpisodes, 300); }
});
["play", "pause", "waiting", "playing", "ended"].forEach((ev) => audio.addEventListener(ev, () => { majLecteur(); if (ev === "pause") sauverPosition(); }));
audio.addEventListener("timeupdate", () => {
  if (courant?.type !== "podcast" || !audio.duration) return;
  $("#l-barre").value = audio.currentTime / audio.duration * 1000;
  $("#l-temps").textContent = temps(audio.currentTime); $("#l-reste").textContent = "−" + temps(audio.duration - audio.currentTime);
});
setInterval(sauverPosition, 5000);

function majLecteur() {
  const l = $("#lecteur");
  if (!courant) { l.hidden = true; $("#eq-entete").hidden = true; return; }
  l.hidden = false;
  const enLecture = !audio.paused;
  const charge = enLecture && audio.readyState < 3;
  $("#eq-entete").hidden = !enLecture;
  const b = $("#l-lire"); b.classList.toggle("en-lecture", enLecture); b.classList.toggle("charge", charge);
  const mode = MODES.find((x) => x.id === theme.mode) || MODES[0];
  let teinte = mode.carte, image = "", radio = "", texte = "";
  if (courant.type === "radio") {
    const s = toutes().find((x) => x.id === courant.id); const t = titres[courant.id];
    radio = s.nom; texte = t ? `${t.titre}${t.artiste ? " · " + t.artiste : ""}` : (enLecture ? "En direct" : s.slogan);
    image = t?.pochette || s.logo || "icons/icone-192.png";
    teinte = melange(mode.carte, s.couleur, theme.mode === "clair" ? .28 : .55);
    b.classList.add("direct"); l.classList.remove("podcast");
  } else {
    radio = courant.episode.titre; texte = courant.podcast.titre;
    image = courant.episode.image || courant.podcast.image || "icons/icone-192.png";
    teinte = melange(mode.carte, courant.podcast.couleur || "#FF2D8A", theme.mode === "clair" ? .28 : .55);
    b.classList.remove("direct"); l.classList.add("podcast");
  }
  l.style.setProperty("--teinte", teinte);
  $("#l-radio").textContent = radio; $("#l-titre").textContent = texte;
  if ($("#l-pochette").getAttribute("src") !== image) $("#l-pochette").src = image;
  const pod = courant.type === "podcast";
  $("#l-progression").hidden = !pod; $("#l-moins15").hidden = !pod; $("#l-plus30").hidden = !pod;
  // Touches multimédia, notification de Chrome, écran verrouillé
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: courant.type === "radio" ? (titres[courant.id]?.titre || radio) : radio,
      artist: courant.type === "radio" ? (titres[courant.id]?.artiste || "En direct") : texte,
      album: courant.type === "radio" ? radio : "Podcast",
      artwork: [{ src: new URL(image, location.href).href, sizes: "512x512" }],
    });
    navigator.mediaSession.playbackState = enLecture ? "playing" : "paused";
  }
}
if ("mediaSession" in navigator) {
  navigator.mediaSession.setActionHandler("play", basculerLecture);
  navigator.mediaSession.setActionHandler("pause", basculerLecture);
  navigator.mediaSession.setActionHandler("stop", arreter);
  navigator.mediaSession.setActionHandler("seekbackward", () => courant?.type === "podcast" && (audio.currentTime -= 15));
  navigator.mediaSession.setActionHandler("seekforward", () => courant?.type === "podcast" && (audio.currentTime += 30));
}

// ───────────────────────── Podcasts ─────────────────────────
let suivis = lire("podcasts", []);
let positions = lire("positions", {});
function sauverPosition() {
  if (courant?.type !== "podcast" || !audio.currentTime) return;
  positions[courant.episode.audio] = { pos: audio.currentTime, tot: audio.duration || 0 };
  ecrire("positions", positions);
}
// Couleur dominante d'une image ; si le site de l'image refuse, on la relit via un relais d'images (en tout petit)
async function couleurImage(url) {
  if (!url) return "#6A1B4D";
  const c = await couleurImage1(url);
  if (c !== "#6A1B4D") return c;
  return couleurImage1("https://images.weserv.nl/?w=32&h=32&url=" + encodeURIComponent(url.replace(/^https?:\/\//, "")));
}
async function couleurImage1(url) {
  return new Promise((ok) => {
    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => { try {
      const c = document.createElement("canvas"); c.width = c.height = 16; const x = c.getContext("2d"); x.drawImage(img, 0, 0, 16, 16);
      const d = x.getImageData(0, 0, 16, 16).data; let r = 0, g = 0, b = 0, n = 0, best = null, bs = -1;
      for (let i = 0; i < d.length; i += 4) { const R = d[i], G = d[i + 1], B = d[i + 2]; r += R; g += G; b += B; n++;
        const s = Math.max(R, G, B) - Math.min(R, G, B); if (s > bs) { bs = s; best = [R, G, B]; } }
      const c2 = bs > 60 ? best : [r / n, g / n, b / n];
      const f = Math.min(1, 150 / Math.max(...c2, 1)); // pas trop clair, pour le texte blanc
      ok("#" + c2.map((v) => Math.round(v * f).toString(16).padStart(2, "0")).join(""));
    } catch { ok("#6A1B4D"); } };
    img.onerror = () => ok("#6A1B4D"); img.src = url;
  });
}
function afficherPodcasts() {
  $("#podcasts-vide").hidden = suivis.length > 0;
  $("#grille-podcasts").innerHTML = suivis.map((p) => `<div class="tuile" draggable="true" data-podcast="${echap(p.feed)}"
      style="background:linear-gradient(160deg, ${p.couleur || "#6A1B4D"}, ${melange(p.couleur || "#6A1B4D", "#000000", .3)})">
      <img class="logo" src="${echap(p.image || "icons/icone-192.png")}" alt="" loading="lazy">
      <button class="retirer" data-retirer-pod="${echap(p.feed)}" title="Retirer">✕</button>
      <div class="nom">${echap(p.titre)}</div><div class="t2">${echap(p.auteur || "")}</div></div>`).join("");
}
$("#grille-podcasts").addEventListener("click", (e) => {
  const r = e.target.closest("[data-retirer-pod]");
  if (r) { e.stopPropagation(); suivis = suivis.filter((p) => p.feed !== r.dataset.retirerPod); ecrire("podcasts", suivis); afficherPodcasts(); return; }
  const t = e.target.closest("[data-podcast]"); if (t) ouvrirPodcast(suivis.find((p) => p.feed === t.dataset.podcast));
});
async function suivre(p) {
  if (suivis.some((x) => x.feed === p.feed)) return;
  p.couleur = await couleurImage(p.image);
  suivis.push(p); ecrire("podcasts", suivis); afficherPodcasts();
}

async function lireFlux(feed) {
  const r = await fetch(feed); if (!r.ok) throw new Error(r.status);
  const xml = new DOMParser().parseFromString(await r.text(), "text/xml");
  const txt = (el, sel) => el.querySelector(sel)?.textContent?.trim() || "";
  const canal = xml.querySelector("channel");
  const desc = txt(canal, ":scope > description").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const episodes = [...xml.querySelectorAll("item")].map((it) => {
    const enc = it.querySelector("enclosure");
    const img = [...it.getElementsByTagName("itunes:image")][0]?.getAttribute("href");
    const duree = [...it.getElementsByTagName("itunes:duration")][0]?.textContent || "";
    return { titre: txt(it, "title"), date: Date.parse(txt(it, "pubDate")) || 0, audio: enc?.getAttribute("url"),
      image: img || null, duree, resume: txt(it, "description").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() };
  }).filter((e) => e.audio);
  return { desc, episodes };
}
let podcastOuvert = null, recentsDabord = true;
async function ouvrirPodcast(p) {
  podcastOuvert = p; ouvrir("#panneau-podcast");
  // Couleurs du podcast pour toute la page (épisodes, halo du haut)
  const teinter = (c) => {
    const ok = c && c !== "#6A1B4D";
    $("#panneau-podcast").style.setProperty("--pod", ok ? melange(c, "#FFFFFF", .25) : "var(--a1)");
    $("#panneau-podcast").style.setProperty("--pod-fond", ok ? c : "var(--a1)");
  };
  teinter(p.couleur);
  if ((!p.couleur || p.couleur === "#6A1B4D") && p.image) couleurImage(p.image).then((c) => {
    if (c !== "#6A1B4D") { p.couleur = c; if (suivis.includes(p)) { ecrire("podcasts", suivis); afficherPodcasts(); } }
    if (podcastOuvert === p) teinter(c);
  });
  $("#p-image").src = p.image || "icons/icone-192.png"; $("#p-titre").textContent = p.titre; $("#p-auteur").textContent = p.auteur || "";
  $("#p-desc").textContent = ""; $("#episodes").innerHTML = `<div class="chargement">Chargement des épisodes…</div>`;
  try {
    const f = await lireFlux(p.feed);
    if (podcastOuvert !== p) return;
    p.episodes = f.episodes; $("#p-desc").textContent = f.desc; afficherEpisodes();
  } catch {
    $("#episodes").innerHTML = `<p class="erreur">Ce podcast ne laisse pas lire sa liste d'épisodes depuis un navigateur. Il reste disponible dans l'appli Android.</p>`;
  }
}
function afficherEpisodes() {
  const p = podcastOuvert; if (!p?.episodes) return;
  const l = [...p.episodes].sort((a, b) => recentsDabord ? b.date - a.date : a.date - b.date);
  $("#p-tri").textContent = recentsDabord ? "Plus récents" : "Plus anciens";
  $("#episodes").innerHTML = l.map((e) => {
    const pos = positions[e.audio]; const fini = pos && pos.tot && pos.pos / pos.tot > .95;
    const actif = courant?.type === "podcast" && courant.episode.audio === e.audio;
    const date = e.date ? new Date(e.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "";
    return `<div class="ligne episode ${fini && !actif ? "lu" : ""}" data-ep="${echap(e.audio)}">
      <img src="${echap(e.image || p.image || "icons/icone-192.png")}" alt="" loading="lazy">
      <div class="txt"><b>${echap(e.titre)}</b><small>${[date, e.duree].filter(Boolean).map(echap).join(" · ")}${fini ? " · ✓ Lu" : ""}</small>
        <div class="resume">${echap(e.resume)}</div>
        ${pos && pos.tot && !fini ? `<div class="avance"><i style="width:${Math.round(pos.pos / pos.tot * 100)}%"></i></div>` : ""}</div>
      <button class="jouer ${actif ? "actif" : ""} ${actif && !audio.paused ? "pause" : ""}" data-jouer="${echap(e.audio)}" aria-label="Lecture"></button>
    </div>`;
  }).join("");
}
$("#p-tri").addEventListener("click", () => { recentsDabord = !recentsDabord; afficherEpisodes(); });
$("#p-desc").addEventListener("click", (e) => e.currentTarget.classList.toggle("ouvert"));
$("#episodes").addEventListener("click", (e) => {
  const j = e.target.closest("[data-jouer]");
  if (j) {
    const ep = podcastOuvert.episodes.find((x) => x.audio === j.dataset.jouer);
    if (courant?.type === "podcast" && courant.episode.audio === ep.audio) { audio.paused ? audio.play() : audio.pause(); }
    else jouerEpisode(podcastOuvert, ep);
    setTimeout(afficherEpisodes, 300); return;
  }
  e.target.closest(".episode")?.classList.toggle("ouvert"); // toucher = déplier / replier
});
async function jouerEpisode(p, e) {
  sauverPosition();
  courant = { type: "podcast", podcast: p, episode: e };
  afficherRadios();
  try { await charger(e.audio); } catch {}
  const pos = positions[e.audio]; if (pos && pos.tot && pos.pos / pos.tot < .97) audio.currentTime = pos.pos;
  majLecteur();
}

// ───────────────────────── Recherche ─────────────────────────
// Deux recherches bien séparées : Radios ou Podcasts
const GENRES_RADIOS = [
  ["Populaires", null], ["Pop", "pop"], ["Rock", "rock"], ["Électro", "electronic"], ["Hip-hop", "hip hop"],
  ["Jazz", "jazz"], ["Classique", "classical"], ["Soul & funk", "soul"], ["Années 80", "80s"], ["Info", "news"], ["Talk", "talk"],
];
let modeRecherche = "radios";
let themeRecherche = "Populaires";
function ouvrirRecherche() {
  ouvrir("#panneau-recherche"); $("#champ-recherche").value = "";
  choisirMode(page === 0 ? "radios" : "podcasts");
}
function choisirMode(m) {
  modeRecherche = m;
  themeRecherche = m === "radios" ? "Populaires" : "Tendances";
  document.querySelectorAll("#mode-recherche button").forEach((b) => b.classList.toggle("actif", b.dataset.mode === m));
  const g = $("#goutte-recherche"), b = document.querySelector(`#mode-recherche button[data-mode="${m}"]`);
  g.style.left = b.offsetLeft + "px"; g.style.width = b.offsetWidth + "px";
  $("#champ-recherche").placeholder = m === "radios" ? "Nom d'une radio…" : "Nom d'un podcast, d'une émission…";
  afficherPuces(); chercher();
}
$("#mode-recherche").addEventListener("click", (e) => { const b = e.target.closest("[data-mode]"); if (b) choisirMode(b.dataset.mode); });
function afficherPuces() {
  const noms = (modeRecherche === "radios" ? GENRES_RADIOS : THEMES_PODCASTS).map((t) => t[0]);
  const zone = $("#puces-recherche");
  if (zone.dataset.mode !== modeRecherche) {
    zone.dataset.mode = modeRecherche;
    zone.innerHTML = `<div class="pastille" id="pastille"></div>` +
      noms.map((n) => `<button class="puce" data-theme="${echap(n)}">${echap(n)}</button>`).join("");
  }
  // La pastille glisse jusqu'à la catégorie choisie
  zone.querySelectorAll(".puce").forEach((b) => b.classList.toggle("actif", b.dataset.theme === themeRecherche));
  const b = zone.querySelector(".puce.actif"), p = $("#pastille");
  if (b && p) {
    p.style.left = b.offsetLeft + "px"; p.style.width = b.offsetWidth + "px"; p.style.top = b.offsetTop + "px"; p.style.height = b.offsetHeight + "px";
    p.animate([{ transform: "scaleY(1)" }, { transform: "scaleY(.85) scaleX(1.06)" }, { transform: "scaleY(1)" }], { duration: 420 });
    b.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }
}
$("#puces-recherche").addEventListener("click", (e) => { const b = e.target.closest("[data-theme]"); if (!b) return; themeRecherche = b.dataset.theme; $("#champ-recherche").value = ""; afficherPuces(); chercher(); });
let minuterieRecherche;
$("#champ-recherche").addEventListener("input", () => { clearTimeout(minuterieRecherche); minuterieRecherche = setTimeout(chercher, 400); });

// Annuaire des radios hébergé avec l'appli (mis à jour chaque jour) : rien à joindre d'extérieur
let annuaire = null;
async function chargerAnnuaire() {
  if (annuaire) return annuaire;
  const r = await fetch("donnees/radios.json", { cache: "no-cache" });
  if (!r.ok) throw new Error("annuaire " + r.status);
  annuaire = (await r.json()).map((x) => ({ stationuuid: x.id, name: x.n, url_resolved: x.u, favicon: x.f, tags: x.t,
    countrycode: x.c, country: x.c, bitrate: x.b, clickcount: x.k, cle: cleNom(x.n) }));
  return annuaire;
}
async function radiosLocales({ q, tag }) {
  const tout = await chargerAnnuaire();
  if (q) {
    const c = cleNom(q);
    return tout.filter((r) => r.cle.includes(c))
      .sort((a, b) => (b.cle.startsWith(c) - a.cle.startsWith(c)) || (b.countrycode === "FR") - (a.countrycode === "FR") || b.clickcount - a.clickcount)
      .slice(0, 50);
  }
  const fr = tout.filter((r) => r.countrycode === "FR");
  if (!tag) return fr.slice(0, 60);
  const avec = (l) => l.filter((r) => (r.tags || "").toLowerCase().split(",").some((t) => t.trim().includes(tag)));
  const res = avec(fr);
  return res.length >= 15 ? res.slice(0, 60) : [...res, ...avec(tout.filter((r) => r.countrycode !== "FR"))].slice(0, 60);
}
function depuisItunes(o) { return o.feedUrl ? { feed: o.feedUrl, titre: o.collectionName || o.trackName, auteur: o.artistName || "", image: o.artworkUrl600 || o.artworkUrl100 } : null; }
async function podcastsPopulaires(genre) {
  const g = genre ? `/genre=${genre}` : "";
  let ids = [];
  try { const d = await json(`https://itunes.apple.com/fr/rss/toppodcasts/limit=50${g}/json`); ids = (d.feed?.entry || []).map((e) => e.id?.attributes?.["im:id"]); }
  catch { const d = await jsonp(`https://itunes.apple.com/fr/rss/toppodcasts/limit=50${g}/json`); ids = (d.feed?.entry || []).map((e) => e.id?.attributes?.["im:id"]); }
  ids = [...new Set(ids.filter(Boolean))];
  if (!ids.length) return [];
  const d = await jsonp(`https://itunes.apple.com/lookup?id=${ids.join(",")}&country=fr`);
  const par = Object.fromEntries((d.results || []).map((r) => [String(r.collectionId), r]));
  return ids.map((i) => par[i] && depuisItunes(par[i])).filter(Boolean);
}
async function chercher() {
  const q = $("#champ-recherche").value.trim();
  const zone = $("#resultats");
  const mode = modeRecherche, theme = themeRecherche;
  zone.innerHTML = `<div class="chargement">Recherche…</div>`;
  let html = "";
  try {
    if (mode === "radios") {
      const tag = GENRES_RADIOS.find((t) => t[0] === theme)?.[1];
      const radios = await radiosLocales({ q: q.length >= 2 ? q : null, tag });
      const titre = q.length >= 2 ? "Radios trouvées" : tag ? `Radios · ${echap(theme)}` : "Les radios les plus écoutées en France";
      html = radios.length ? `<div class="titre-liste">${titre}</div>` + lignesRadios(radios) : `<p class="doux">Aucune radio trouvée.</p>`;
    } else {
      const g = THEMES_PODCASTS.find((t) => t[0] === theme)?.[1];
      const pods = q.length >= 2
        ? await jsonp(`https://itunes.apple.com/search?media=podcast&country=fr&limit=30&term=${encodeURIComponent(q)}`).then((d) => (d.results || []).map(depuisItunes).filter(Boolean))
        : await podcastsPopulaires(g);
      const titre = q.length >= 2 ? "Podcasts trouvés" : theme === "Tendances" ? "Les podcasts les plus écoutés en France" : "Les plus écoutés · " + echap(theme);
      html = pods.length ? `<div class="titre-liste">${titre}</div>` + lignesPodcasts(pods) : `<p class="doux">Aucun podcast trouvé.</p>`;
    }
  } catch (e) {
    html = mode === "radios"
      ? `<p class="erreur">Impossible de charger l'annuaire des radios.<br><small>${echap(e.message)}</small></p>`
      : `<p class="erreur">Impossible de joindre le catalogue des podcasts. Vérifie ta connexion.</p>`;
  }
  if (mode === modeRecherche && theme === themeRecherche) zone.innerHTML = html;
}
let derniersResultats = { radios: [], pods: [] };
/** Plusieurs fiches pour la même radio : on garde la meilleure (logo, flux sécurisé, qualité, écoutes). */
function meilleuresVersions(radios) {
  const groupes = new Map();
  for (const r of radios) {
    if (!r.url_resolved) continue;
    const k = cleNom(r.name).replace(/^(radio|rts)/, "") || r.stationuuid;
    (groupes.get(k) || groupes.set(k, []).get(k)).push(r);
  }
  const note = (r) => (r.favicon ? 4 : 0) + (r.url_resolved.startsWith("https") ? 2 : 0) +
    (r.bitrate >= 128 ? 2 : r.bitrate >= 96 ? 1 : 0) + Math.log10(1 + (r.clickcount || 0));
  return [...groupes.values()].map((g) => {
    const best = [...g].sort((a, b) => note(b) - note(a))[0];
    return { ...best, logos: [...new Set(g.filter((x) => x.favicon).sort((a, b) => b.clickcount - a.clickcount).map((x) => x.favicon))] };
  });
}
function lignesRadios(radios) {
  radios = meilleuresVersions(radios);
  derniersResultats.radios = radios;
  return radios.map((r) => {
    const deja = toutes().some((s) => s.flux[0] === r.url_resolved);
    const connue = CATALOGUE.find((c) => cleNom(c.nom).replace(/^radio/, "") === cleNom(r.name).replace(/^(radio|rts)/, ""));
    return `<div class="ligne">${imgLogo("vignette", r.name, connue ? [connue.logo] : candidatsLogo(r.name, r.logos?.[0] || r.favicon, [r.url_resolved]))}
      <div class="txt"><b>${echap(r.name)}</b><small>${echap([r.country, r.tags?.split(",")[0], r.bitrate ? r.bitrate + " kbps" : ""].filter(Boolean).join(" · "))}</small></div>
      <button class="bouton gris" data-ecouter="${echap(r.stationuuid)}">Écouter</button>
      <button class="bouton ${deja ? "gris" : ""}" data-ajouter-radio="${echap(r.stationuuid)}" ${deja ? "disabled" : ""}>${deja ? "Ajoutée" : "Ajouter"}</button></div>`;
  }).join("");
}
function lignesPodcasts(pods) {
  const vus = new Set(); pods = pods.filter((p) => !vus.has(p.feed) && vus.add(p.feed));
  derniersResultats.pods = pods;
  return pods.map((p) => {
    const deja = suivis.some((x) => x.feed === p.feed);
    return `<div class="ligne"><img src="${echap(p.image)}" alt="" loading="lazy"><div class="txt"><b>${echap(p.titre)}</b><small>${echap(p.auteur)}</small></div>
      <button class="bouton ${deja ? "gris" : ""}" data-ajouter-pod="${echap(p.feed)}" ${deja ? "disabled" : ""}>${deja ? "Ajouté" : "Ajouter"}</button></div>`;
  }).join("");
}
function radioDepuisRB(r) {
  // Radio connue (FIP, Nova…) : flux officiel, logo et titres en cours
  const connue = CATALOGUE.find((c) => cleNom(c.nom) === cleNom(r.name) || cleNom(c.nom) === cleNom(r.name).replace(/^radio/, ""));
  if (connue) return { ...connue, perso: true };
  const couleurs = ["#E1017A", "#017A93", "#6A1B9A", "#1B4093", "#C2185B", "#00796B", "#E65100", "#283593"];
  let h = 0; for (const c of r.name) h = (h * 31 + c.charCodeAt(0)) | 0;
  return { id: "rb-" + r.stationuuid, nom: propre(r.name), slogan: [r.country, r.tags?.split(",")[0]].filter(Boolean).join(" · "),
    couleur: couleurs[Math.abs(h) % couleurs.length], logo: r.logos?.[0] || r.favicon || null, flux: [r.url_resolved], meta: null, perso: true };
}
$("#resultats").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.ecouter) { const r = derniersResultats.radios.find((x) => x.stationuuid === b.dataset.ecouter); jouerRadio(radioDepuisRB(r)); }
  if (b.dataset.ajouterRadio) {
    const r = derniersResultats.radios.find((x) => x.stationuuid === b.dataset.ajouterRadio);
    perso.push(radioDepuisRB(r)); ecrire("radiosPerso", perso); afficherRadios();
    b.textContent = "Ajoutée"; b.classList.add("gris"); b.disabled = true;
  }
  if (b.dataset.ajouterPod) {
    suivre(derniersResultats.pods.find((x) => x.feed === b.dataset.ajouterPod));
    b.textContent = "Ajouté"; b.classList.add("gris"); b.disabled = true;
  }
});

// ───────────────────────── Panneaux ─────────────────────────
// Voile sombre derrière les fenêtres (recherche, épisodes) ; un clic dessus ferme la fenêtre du dessus
function majVoile() {
  const v = $("#voile"), reste = document.querySelector(".panneau.fenetre:not([hidden]):not(.sortie)");
  if (reste) { v.classList.remove("sortie"); v.hidden = false;
    v.classList.toggle("leger", !document.querySelector(".panneau.fenetre:not(.laterale):not([hidden]):not(.sortie)")); return; }
  if (v.hidden) return;
  v.classList.add("sortie");
  setTimeout(() => { if (!document.querySelector(".panneau.fenetre:not([hidden]):not(.sortie)")) v.hidden = true; v.classList.remove("sortie"); }, 280);
}
function ouvrir(sel) { const p = $(sel); clearTimeout(p._sortie); p.classList.remove("sortie"); p.hidden = false; majVoile(); }
function fermerPanneau(p) {
  if (!p || p.hidden || p.classList.contains("sortie")) return;
  if (!p.classList.contains("fenetre")) { p.hidden = true; majVoile(); return; }
  p.classList.add("sortie"); majVoile();
  p._sortie = setTimeout(() => { p.hidden = true; p.classList.remove("sortie"); }, 280);
}
document.querySelectorAll("[data-fermer]").forEach((b) => b.addEventListener("click", () => fermerPanneau(b.closest(".panneau"))));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { const l = [...document.querySelectorAll(".panneau:not([hidden]):not(.sortie)")]; if (l.length) fermerPanneau(l[l.length - 1]); } });
$("#voile").addEventListener("click", () => { const l = [...document.querySelectorAll(".panneau.fenetre:not([hidden]):not(.sortie)")]; if (l.length) fermerPanneau(l[l.length - 1]); });
$("#bouton-recherche").addEventListener("click", ouvrirRecherche);
$("#bouton-options").addEventListener("click", () => { afficherOptions(); afficherCompte(); ouvrir("#panneau-options"); });
$("#lecteur").addEventListener("click", (e) => { if (courant?.type === "podcast" && !e.target.closest("button,input,label")) ouvrirPodcast(courant.podcast); });

// ───────────────────────── Bulles de présentation ─────────────────────────
const BULLES = [
  ["É", "Bienvenue sur Écho", "Tes radios et tes podcasts préférés, réunis au même endroit. Un clic et ça joue."],
  ["＋", "Ajoute tes radios", "Clique sur la loupe, cherche une radio par son nom ou par style, puis « Ajouter ». Clique sur une vignette pour écouter."],
  ["♪", "Et tes podcasts", "Passe sur l'onglet Podcasts : suis tes émissions, déplie un épisode pour lire son résumé, reprends là où tu t'étais arrêté."],
  ["⌨", "Au clavier", "Espace pour lecture / pause, flèches gauche et droite pour changer d'onglet, Échap pour fermer. Les touches multimédia marchent aussi."],
  ["G", "Garde tout avec Google", "Connecte ton compte Google : tes radios et tes podcasts te suivent sur ton ordinateur et ton téléphone."],
];
let bulle = 0;
function afficherBulle() {
  $("#bulles-piste").style.transform = `translateX(${-100 * bulle}%)`;
  $("#points").innerHTML = BULLES.map((_, i) => `<i class="${i === bulle ? "actif" : ""}"></i>`).join("");
  const fin = bulle === BULLES.length - 1;
  $("#accueil-passer").textContent = fin ? "Plus tard" : "Passer";
  const b = $("#accueil-suivant");
  b.className = fin ? "bouton google" : "bouton";
  b.innerHTML = fin ? "<b>G</b> Se connecter avec Google" : "Suivant";
}
function ouvrirAccueil() {
  $("#bulles-piste").innerHTML = BULLES.map(([s, t, p]) => `<div class="une-bulle"><div class="rond-bulle">${s}</div><h2>${t}</h2><p>${p}</p></div>`).join("");
  bulle = 0; afficherBulle(); $("#accueil").hidden = false;
}
function fermerAccueil() { $("#accueil").hidden = true; ecrire("accueilVu", true); }
$("#accueil-passer").addEventListener("click", fermerAccueil);
$("#accueil-suivant").addEventListener("click", () => {
  if (bulle < BULLES.length - 1) { bulle++; afficherBulle(); }
  else { fermerAccueil(); window.connecterGoogle?.(); }
});

// ───────────────────────── Logos manquants ─────────────────────────
// Radios venues du téléphone sans logo : on cherche dans les radios connues, puis dans l'annuaire
async function completerLogos() {
  const sans = perso.filter((s) => !s.logo);
  if (!sans.length) return;
  let tout = [];
  try { tout = await chargerAnnuaire(); } catch {}
  let change = false;
  for (const s of sans) {
    const c = cleNom(s.nom).replace(/^(rts|radio)/, "");
    const connue = CATALOGUE.find((x) => cleNom(x.nom).replace(/^radio/, "") === c);
    if (connue) { s.logo = connue.logo; change = true; continue; }
    const parFlux = tout.find((r) => r.favicon && s.flux.includes(r.url_resolved));
    const parNom = tout.find((r) => r.favicon && r.cle === cleNom(s.nom));
    const r = parFlux || parNom;
    if (r) { s.logo = r.favicon; change = true; }
  }
  if (change) { ecrire("radiosPerso", perso); afficherRadios(); }
}

// ───────────────────────── Compte Google (voir compte.js) ─────────────────────────
let compteActuel = null, etatSync = "";
function afficherCompte() {
  const z = $("#zone-compte"); if (!z) return;
  if (compteActuel) {
    z.innerHTML = `<div class="compte">${compteActuel.photo ? `<img src="${echap(compteActuel.photo)}" alt="" referrerpolicy="no-referrer">` : `<div class="ini">${echap((compteActuel.nom || "?")[0])}</div>`}
      <div><b>${echap(compteActuel.nom || "Connecté")}</b><small>${echap(compteActuel.email || "")}</small></div></div>
      <p class="${etatSync ? "doux" : "ok"}">${echap(etatSync || "✓ Synchronisé avec ton téléphone")}</p>
      <button class="bouton gris" id="b-deconnexion">Se déconnecter</button>`;
    $("#b-deconnexion").onclick = () => window.deconnecterGoogle?.();
  } else {
    z.innerHTML = `<button class="bouton google" id="b-connexion"><b>G</b> Se connecter avec Google</button>
      ${etatSync ? `<p class="erreur">${echap(etatSync)}</p>` : ""}`;
    $("#b-connexion").onclick = () => window.connecterGoogle?.();
  }
}
window.echo = {
  catalogue: CATALOGUE,
  donnees: () => ({ radios: perso, podcasts: suivis, positions, theme, maj: +localStorage.getItem("maj") || 0 }),
  async appliquer(d) {
    perso = d.radios; suivis = d.podcasts; positions = d.positions;
    if (d.theme) theme = { mode: d.theme.mode || "sombre", couleur: d.theme.couleur || "rose" };
    for (const p of suivis) if (!p.couleur && p.image) p.couleur = await couleurImage(p.image);
    localStorage.setItem("radiosPerso", JSON.stringify(perso)); localStorage.setItem("podcasts", JSON.stringify(suivis));
    localStorage.setItem("positions", JSON.stringify(positions)); localStorage.setItem("theme", JSON.stringify(theme));
    localStorage.setItem("maj", String(d.maj));
    appliquerTheme(); afficherRadios(); afficherPodcasts();
    setTimeout(completerLogos, 500);
  },
  etatCompte(t) { etatSync = t; afficherCompte(); },
  compte(c) { compteActuel = c; afficherCompte(); },
};

// ───────────────────────── Déplacer les vignettes (glisser-déposer) ─────────────────────────
function deplacable(grille, attr, onOrdre) {
  let tenue = null;
  grille.addEventListener("dragstart", (e) => {
    tenue = e.target.closest(`[${attr}]`); if (!tenue) return;
    tenue.classList.add("tenue"); e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "");
  });
  grille.addEventListener("dragover", (e) => {
    if (!tenue) return; e.preventDefault();
    const cible = e.target.closest(`[${attr}]`); if (!cible || cible === tenue) return;
    // Animation douce des autres vignettes (FLIP)
    const avant = new Map([...grille.children].map((el) => [el, el.getBoundingClientRect()]));
    const r = cible.getBoundingClientRect();
    const apres = (e.clientX - r.left) > r.width / 2;
    grille.insertBefore(tenue, apres ? cible.nextSibling : cible);
    for (const el of grille.children) {
      const a = avant.get(el), b = el.getBoundingClientRect();
      if (!a || el === tenue) continue;
      const dx = a.left - b.left, dy = a.top - b.top;
      if (dx || dy) el.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: "none" }], { duration: 220, easing: "cubic-bezier(.3,.9,.4,1)" });
    }
  });
  grille.addEventListener("dragend", () => {
    if (!tenue) return; tenue.classList.remove("tenue"); tenue = null;
    onOrdre([...grille.querySelectorAll(`[${attr}]`)].map((el) => el.getAttribute(attr)));
  });
}
deplacable($("#grille-radios"), "data-radio", (ids) => {
  perso = ids.map((id) => perso.find((s) => s.id === id)).filter(Boolean); ecrire("radiosPerso", perso);
});
deplacable($("#grille-podcasts"), "data-podcast", (ids) => {
  suivis = ids.map((f) => suivis.find((p) => p.feed === f)).filter(Boolean); ecrire("podcasts", suivis);
});

// ───────────────────────── Démarrage ─────────────────────────
appliquerTheme();
afficherRadios();
afficherPodcasts();
requestAnimationFrame(() => allerPage(0));
window.addEventListener("resize", () => allerPage(page));
if (!lire("accueilVu", false)) ouvrirAccueil();
completerLogos();
chargerAnnuaire().then(() => afficherRadios()).catch(() => {});
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});

// ───── Logo : au survol il part en écho et se reforme ─────
$(".marque")?.addEventListener("click", (e) => e.preventDefault());
$(".marque")?.addEventListener("mouseenter", (e) => {
  const m = e.currentTarget, logo = m.querySelector(".logo-echo");
  if (m.classList.contains("echo")) return;
  m.classList.add("echo");
  const copies = [];
  // Les échos partent vers la droite en grossissant et s'effacent, puis reviennent se fondre dans le logo
  [[60, 1.15, 0], [130, 1.3, 90], [210, 1.45, 180], [-50, 1.1, 40]].forEach(([dx, sc, d]) => {
    const f = document.createElement("div"); f.className = "fantome";
    f.appendChild(logo.cloneNode(true));
    f.style.setProperty("--dx", dx + "px"); f.style.setProperty("--s", sc);
    f.style.animation = `echo-copie .55s ${d}ms cubic-bezier(.2,.7,.3,1) both, echo-retour .5s ${700 + d / 2}ms cubic-bezier(.4,0,.3,1) both`;
    m.appendChild(f); copies.push(f);
  });
  setTimeout(() => { copies.forEach((f) => f.remove()); m.classList.remove("echo"); }, 1350);
});
