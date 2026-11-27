"use strict";
/* Radio Francis — version bureau (appli web installable depuis Chrome). */

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
  ["Santé & bien-être", 1512], ["Business", 1321], ["Technologie", 1318], ["Sport", 1545], ["Arts", 1301],
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
const ecrire = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const echap = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const temps = (s) => { s = Math.max(0, Math.floor(s || 0)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(x).padStart(2, "0")}` : `${m}:${String(x).padStart(2, "0")}`; };
const propre = (t) => { t = String(t || "").replace(/\s+/g, " ").trim();
  const l = t.replace(/[^A-Za-zÀ-ÿ]/g, ""); if (l && l === l.toUpperCase() && l.length > 3) t = t.toLowerCase().replace(/(^|[\s(\-'"])(\p{L})/gu, (m, a, b) => a + b.toUpperCase()); return t; };
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
  document.querySelectorAll(".onglets button").forEach((b, i) => b.classList.toggle("actif", i === p));
  const b = document.querySelectorAll(".onglets button")[p];
  const g = $("#goutte"); g.style.left = b.offsetLeft + "px"; g.style.width = b.offsetWidth + "px";
  g.animate([{ transform: "scaleY(1)" }, { transform: "scaleY(.82) scaleX(1.08)" }, { transform: "scaleY(1)" }], { duration: 450 });
  document.querySelectorAll(".page").forEach((el) => (el.style.transform = `translateX(${-100 * p}%)`));
  // Titre qui se transforme lettre par lettre
  const mot = p === 0 ? "adios" : "odcasts";
  $("#titre .lettre1").textContent = p === 0 ? "R" : "P";
  $("#titre-reste").innerHTML = [...mot].map((l, i) => `<span style="animation-delay:${i * 40}ms">${l}</span>`).join("");
}
document.querySelectorAll(".onglets button").forEach((b) => b.addEventListener("click", () => allerPage(+b.dataset.page)));
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return;
  if (e.key === "ArrowRight") allerPage(1); if (e.key === "ArrowLeft") allerPage(0);
  if (e.key === " ") { e.preventDefault(); basculerLecture(); }
});

// ───────────────────────── Radios ─────────────────────────
let perso = lire("radiosPerso", []);
const toutes = () => perso;
const titres = {}; // id → {titre, artiste, pochette}

function afficherRadios() {
  $("#radios-vide").hidden = toutes().length > 0;
  $("#grille-radios").innerHTML = toutes().map((s) => {
    const t = titres[s.id];
    const fond = `linear-gradient(160deg, ${s.couleur}, ${melange(s.couleur, "#000000", .25)})`;
    return `<div class="tuile ${s.sombre ? "sombre" : ""} ${courant?.type === "radio" && courant.id === s.id ? "en-cours" : ""}" data-radio="${s.id}" style="background:${fond}">
      ${s.logo ? `<img class="logo" src="${echap(s.logo)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'initiale',textContent:'${echap(s.nom[0])}'}))">`
        : `<div class="initiale">${echap(s.nom[0])}</div>`}
      <div class="etat"><div class="eq"><i></i><i></i><i></i></div></div>
      ${s.perso ? `<button class="retirer" data-retirer="${s.id}" title="Retirer">✕</button>` : ""}
      <div class="nom">${echap(s.nom)}</div>
      <div class="t1">${echap(t ? t.titre : s.slogan)}</div>
      <div class="t2">${echap(t ? t.artiste : "")}</div>
    </div>`;
  }).join("");
}
$("#grille-radios").addEventListener("click", (e) => {
  const r = e.target.closest("[data-retirer]");
  if (r) { e.stopPropagation(); perso = perso.filter((s) => s.id !== r.dataset.retirer); ecrire("radiosPerso", perso); afficherRadios(); return; }
  const t = e.target.closest("[data-radio]"); if (!t) return;
  const s = toutes().find((x) => x.id === t.dataset.radio);
  if (courant?.type === "radio" && courant.id === s.id && !audio.paused) arreter(); else jouerRadio(s);
});

// Titre en cours (quand le site de la radio l'autorise depuis un navigateur)
async function titreRadio(s) {
  const m = s.meta || {};
  try {
    if (m.rf) {
      const d = await json(`https://api.radiofrance.fr/livemeta/live/${m.rf}/webrf_webradio_player`);
      const n = d.now; if (!n || !n.songUuid) return null;
      return { titre: propre(n.firstLine), artiste: propre(n.secondLine || ""), pochette: n.cover ? `https://www.radiofrance.fr/pikapi/images/${n.cover}/400x400` : null };
    }
    if (m.nova) {
      const arr = await json("https://www.nova.fr/radios-data/www.nova.fr/all.json");
      const o = arr.find((x) => x.radio?.code === m.nova)?.currentTrack; if (!o?.title) return null;
      return { titre: propre(o.title), artiste: propre(o.artist), pochette: o.media_url || null };
    }
    if (m.nrj) {
      const d = await json(`https://players.nrjaudio.fm/wr_api/live/fr?act=get_cur&id_wr=${m.nrj}&cp=utf8&fmt=json`);
      const o = d.itms?.[0]; if (!o || String(o.type).toUpperCase() !== "SINGLE" || !o.tit) return null;
      return { titre: propre(o.tit), artiste: propre(o.art), pochette: o.cov ? `https://players.nrjaudio.fm/live-metadata/player/img/600x/${o.cov}` : null };
    }
  } catch { /* le site refuse l'accès depuis un navigateur */ }
  return null;
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
  const t = await titreRadio(s);
  if (t && !t.pochette && t.artiste) t.pochette = await pochetteDeezer(t.titre, t.artiste);
  if (courant?.type !== "radio" || courant.id !== s.id) return;
  const avant = titres[s.id];
  if (t) titres[s.id] = t; else delete titres[s.id];
  if (JSON.stringify(avant) !== JSON.stringify(t)) { afficherRadios(); majLecteur(); }
}
setInterval(majTitre, 20000);

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
async function couleurImage(url) {
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
  $("#grille-podcasts").innerHTML = suivis.map((p) => `<div class="tuile" data-podcast="${echap(p.feed)}"
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
let themeRecherche = "Radios";
function ouvrirRecherche() {
  ouvrir("#panneau-recherche"); $("#champ-recherche").value = "";
  themeRecherche = page === 0 ? "Radios" : "Tendances";
  afficherPuces(); chercher();
}
function afficherPuces() {
  const noms = ["Radios", ...THEMES_PODCASTS.map((t) => t[0])];
  $("#puces-recherche").innerHTML = noms.map((n) => `<button class="puce ${n === themeRecherche ? "actif" : ""}" data-theme="${echap(n)}">${echap(n)}</button>`).join("");
  $("#puces-recherche .actif")?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
}
$("#puces-recherche").addEventListener("click", (e) => { const b = e.target.closest("[data-theme]"); if (!b) return; themeRecherche = b.dataset.theme; $("#champ-recherche").value = ""; afficherPuces(); chercher(); });
let minuterieRecherche;
$("#champ-recherche").addEventListener("input", () => { clearTimeout(minuterieRecherche); minuterieRecherche = setTimeout(chercher, 400); });

const serveursRB = ["de1", "fi1", "nl1"];
async function radiosRB(chemin) {
  for (const s of serveursRB) { try { return await json(`https://${s}.api.radio-browser.info/json/${chemin}`); } catch {} }
  return [];
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
  zone.innerHTML = `<div class="chargement">Recherche…</div>`;
  try {
    let html = "";
    if (q.length >= 2) {
      const [radios, pods] = await Promise.all([
        radiosRB(`stations/search?name=${encodeURIComponent(q)}&limit=20&hidebroken=true&order=clickcount&reverse=true`),
        jsonp(`https://itunes.apple.com/search?media=podcast&country=fr&limit=20&term=${encodeURIComponent(q)}`).then((d) => (d.results || []).map(depuisItunes).filter(Boolean)).catch(() => []),
      ]);
      html = (radios.length ? `<div class="titre-liste">Radios</div>` + lignesRadios(radios) : "") +
        (pods.length ? `<div class="titre-liste">Podcasts</div>` + lignesPodcasts(pods) : "");
    } else if (themeRecherche === "Radios") {
      const radios = await radiosRB(`stations/bycountrycodeexact/FR?limit=40&hidebroken=true&order=clickcount&reverse=true`);
      html = `<div class="titre-liste">Les radios les plus écoutées en France</div>` + lignesRadios(radios);
    } else {
      const g = THEMES_PODCASTS.find((t) => t[0] === themeRecherche)?.[1];
      const pods = await podcastsPopulaires(g);
      html = `<div class="titre-liste">${themeRecherche === "Tendances" ? "Les podcasts les plus écoutés en France" : "Les plus écoutés · " + echap(themeRecherche)}</div>` + lignesPodcasts(pods);
    }
    zone.innerHTML = html || `<p class="doux">Aucun résultat.</p>`;
  } catch { zone.innerHTML = `<p class="erreur">Impossible de joindre l'annuaire. Vérifie ta connexion.</p>`; }
}
let derniersResultats = { radios: [], pods: [] };
function lignesRadios(radios) {
  const vus = new Set(); radios = radios.filter((r) => r.url_resolved && !vus.has(r.stationuuid) && vus.add(r.stationuuid));
  derniersResultats.radios = radios;
  return radios.map((r) => {
    const deja = toutes().some((s) => s.flux[0] === r.url_resolved);
    return `<div class="ligne">${r.favicon ? `<img src="${echap(r.favicon)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">` : `<div class="ini">${echap((r.name || "?")[0])}</div>`}
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
const cleNom = (n) => String(n || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]/g, "");
function radioDepuisRB(r) {
  // Radio connue (FIP, Nova…) : flux officiel, logo et titres en cours
  const connue = CATALOGUE.find((c) => cleNom(c.nom) === cleNom(r.name) || cleNom(c.nom) === cleNom(r.name).replace(/^radio/, ""));
  if (connue) return { ...connue, perso: true };
  const couleurs = ["#E1017A", "#017A93", "#6A1B9A", "#1B4093", "#C2185B", "#00796B", "#E65100", "#283593"];
  let h = 0; for (const c of r.name) h = (h * 31 + c.charCodeAt(0)) | 0;
  return { id: "rb-" + r.stationuuid, nom: propre(r.name), slogan: [r.country, r.tags?.split(",")[0]].filter(Boolean).join(" · "),
    couleur: couleurs[Math.abs(h) % couleurs.length], logo: r.favicon || null, flux: [r.url_resolved], meta: null, perso: true };
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
function ouvrir(sel) { $(sel).hidden = false; }
document.querySelectorAll("[data-fermer]").forEach((b) => b.addEventListener("click", () => (b.closest(".panneau").hidden = true)));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") document.querySelectorAll(".panneau:not([hidden])").forEach((p) => (p.hidden = true)); });
$("#bouton-recherche").addEventListener("click", ouvrirRecherche);
$("#bouton-options").addEventListener("click", () => { afficherOptions(); ouvrir("#panneau-options"); });
$("#lecteur").addEventListener("click", (e) => { if (courant?.type === "podcast" && !e.target.closest("button,input,label")) ouvrirPodcast(courant.podcast); });

// ───────────────────────── Démarrage ─────────────────────────
appliquerTheme();
afficherRadios();
afficherPodcasts();
requestAnimationFrame(() => allerPage(0));
window.addEventListener("resize", () => allerPage(page));
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
