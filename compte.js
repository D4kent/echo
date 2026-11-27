// Écho — compte Google : connexion et synchronisation avec l'appli Android (même format de données).
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const app = initializeApp({
  apiKey: "AIzaSyCb-WHFKhLwJsq4TLmu0LekJMrOjlAEG3A",
  authDomain: "radio-francis.firebaseapp.com",
  projectId: "radio-francis",
  storageBucket: "radio-francis.firebasestorage.app",
  messagingSenderId: "676555883283",
  appId: "1:676555883283:web:6ce5a7408bc949480b90e6",
});
const auth = getAuth(app);
const db = getFirestore(app);
const E = window.echo; // fonctions exposées par app.js

let ecoute = null, envoi = null, application = false, distantBrut = {};
const document_ = (uid) => doc(db, "utilisateurs", uid, "donnees", "principal");

// ───── Conversion vers / depuis le format partagé ─────
function metaVersTexte(s) {
  if (s.metaTexte) return s.metaTexte;
  const m = s.meta || {};
  if (m.rf) return `rf:${m.rf}:0`;
  if (m.nova) return `nova:${m.nova}`;
  if (m.nrj) return `nrj:${m.nrj}`;
  return "icy";
}
function texteVersMeta(t) {
  const p = String(t || "").split(":");
  if (p[0] === "rf") return { rf: +p[1] || 7 };
  if (p[0] === "nova") return { nova: p[1] };
  if (p[0] === "nrj") return { nrj: +p[1] };
  return null;
}
function exporter() {
  const d = E.donnees();
  const radios = d.radios.map((s) => {
    const integree = E.catalogue.some((c) => c.id === s.id);
    return { id: s.id, nom: s.nom, slogan: s.slogan || "", couleur: s.couleur, flux: s.flux, meta: metaVersTexte(s), integree,
      ...(s.logo && /^https?:/.test(s.logo) ? { logoUrl: s.logo } : {}) };
  });
  const positions = {};
  Object.entries(d.positions).forEach(([a, p]) => {
    positions[a] = p.tot && p.pos / p.tot > 0.95 ? { fini: true } : { pos: p.pos };
  });
  return {
    maj: d.maj || Date.now(),
    radios: JSON.stringify(radios),
    podcasts: JSON.stringify(d.podcasts.map((p) => ({ feed: p.feed, titre: p.titre, auteur: p.auteur || "", image: p.image || "" }))),
    positions: JSON.stringify(positions),
    theme: JSON.stringify(d.theme),
    // Données que seul le téléphone utilise : renvoyées telles quelles
    ...(distantBrut.favoris ? { favoris: distantBrut.favoris } : {}),
    ...(distantBrut.android ? { android: distantBrut.android } : {}),
  };
}
async function importer(d) {
  distantBrut = { favoris: d.favoris, android: d.android };
  const radios = JSON.parse(d.radios || "[]").map((r) => {
    const c = E.catalogue.find((x) => x.id === r.id);
    if (r.integree && c) return { ...c, perso: true };
    return { id: r.id, nom: r.nom, slogan: r.slogan || "", couleur: r.couleur || "#E1017A", flux: r.flux || [],
      metaTexte: r.meta, meta: texteVersMeta(r.meta), logo: r.logoUrl || null, perso: true };
  }).filter((s) => s.flux.length);
  const anciens = E.donnees().podcasts;
  const podcasts = JSON.parse(d.podcasts || "[]").map((p) => ({ ...anciens.find((a) => a.feed === p.feed), ...p, image: p.image || null }));
  const positions = {};
  Object.entries(JSON.parse(d.positions || "{}")).forEach(([a, p]) => {
    positions[a] = p.fini ? { pos: 1, tot: 1 } : { pos: p.pos || 0, tot: 0 };
  });
  application = true;
  await E.appliquer({ radios, podcasts, positions, theme: d.theme ? JSON.parse(d.theme) : null, maj: d.maj || Date.now() });
  application = false;
}

// ───── Synchronisation ─────
async function demarrer(uid) {
  E.etatCompte("Synchronisation…");
  try {
    const s = await getDoc(document_(uid));
    if (!s.exists()) await setDoc(document_(uid), exporter());
    else await importer(s.data()); // à la connexion, ce qui est dans le compte l'emporte
    E.etatCompte("");
  } catch (e) { console.warn(e); E.etatCompte("Synchronisation impossible : " + (e.code || e.message)); }
  ecoute?.();
  ecoute = onSnapshot(document_(uid), (s) => {
    if (!s.exists() || s.metadata.hasPendingWrites) return;
    const d = s.data();
    if ((d.maj || 0) > (E.donnees().maj || 0)) importer(d);
  });
}
function changementLocal() {
  if (application || !auth.currentUser) return;
  clearTimeout(envoi);
  envoi = setTimeout(() => setDoc(document_(auth.currentUser.uid), exporter(), { merge: true }).catch((e) => console.warn(e)), 2500);
}

onAuthStateChanged(auth, (u) => {
  E.compte(u ? { nom: u.displayName, email: u.email, photo: u.photoURL } : null);
  if (u) demarrer(u.uid); else { ecoute?.(); ecoute = null; }
});

window.connecterGoogle = async () => {
  try { await signInWithPopup(auth, new GoogleAuthProvider()); }
  catch (e) { if (e.code !== "auth/popup-closed-by-user") E.etatCompte("Connexion impossible : " + (e.code || e.message)); }
};
window.deconnecterGoogle = () => signOut(auth);
window.changementLocal = changementLocal;
