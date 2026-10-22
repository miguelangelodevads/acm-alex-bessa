import COURSE from "/data/course.js";

const flat = COURSE.flatMap((m) =>
  m.topics.flatMap((t) =>
    t.lessons.map((l) => ({
      ...l,
      module: m.id,
      moduleTitle: m.title,
      topic: t.id,
      topicTitle: t.title,
    })),
  ),
);
const byId = new Map(flat.map((l) => [l.id, l]));
const $ = (s) => document.querySelector(s);
const KEY = "acme-classroom-v1";
let state = {
  selected: flat[0].id,
  edits: {},
  completed: [],
  notes: {},
  positions: {},
  autoplay: false,
};
let storageOK = true;
try {
  const v = JSON.parse(localStorage.getItem(KEY) || "null");
  if (v && typeof v === "object") {
    state = { ...state, ...v };
    if (!byId.has(state.selected)) state.selected = flat[0].id;
    if (!Array.isArray(state.completed)) state.completed = [];
    for (const k of ["edits", "notes", "positions"])
      if (!state[k] || typeof state[k] !== "object" || Array.isArray(state[k]))
        state[k] = {};
  }
} catch {
  storageOK = false;
}
let expanded = new Set([byId.get(state.selected).module]),
  tab = "about",
  session = 0,
  playing = false,
  saveTimer,
  toastTimer;
let catalogSha = null;
let githubBusy = false;
function esc(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function current() {
  let l = byId.get(state.selected);
  return { ...l, ...state.edits[l.id] };
}
function toast(s) {
  $("#toast").textContent = s;
  $("#toast").style.display = "block";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").style.display = "none"), 4200);
}
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    storageOK = true;
    return true;
  } catch {
    storageOK = false;
    toast(
      "Não foi possível salvar no navegador. Exporte uma cópia para guardar suas alterações.",
    );
    return false;
  }
}
function notice(s) {
  $("#player-notice").textContent = s;
  $("#player-notice").style.display = s ? "block" : "none";
}
function renderMenu() {
  const q = $("#search").value.toLocaleLowerCase("pt-BR").trim();
  let html = "";
  for (const m of COURSE) {
    let groups = m.topics
      .map((t) => {
        let ls = t.lessons.filter((l) => {
          let e = state.edits[l.id] || {};
          return (
            !q ||
            [
              e.title || l.title,
              e.description || l.description,
              t.title,
              m.title,
              "aula " + l.number,
            ]
              .join(" ")
              .toLocaleLowerCase("pt-BR")
              .includes(q)
          );
        });
        return { ...t, lessons: ls };
      })
      .filter((t) => t.lessons.length);
    if (!groups.length) continue;
    let count = m.topics.reduce((n, t) => n + t.lessons.length, 0),
      done = m.topics
        .flatMap((t) => t.lessons)
        .filter((l) => state.completed.includes(l.id)).length;
    html +=
      '<div class="module ' +
      (expanded.has(m.id) || q ? "open" : "") +
      '"><button class="module-toggle" data-module="' +
      m.id +
      '" aria-expanded="' +
      (expanded.has(m.id) || !!q) +
      '"><span class="module-number">0' +
      m.id +
      "</span><span><strong>" +
      esc(m.title) +
      "</strong><small>" +
      count +
      " aulas · " +
      done +
      ' concluídas</small></span><span class="chevron">⌄</span></button><div class="module-body">';
    for (const t of groups) {
      html +=
        '<h3 class="topic-title">' +
        String(t.id).padStart(2, "0") +
        " / " +
        esc(t.title) +
        "</h3>";
      for (const l of t.lessons) {
        let done = state.completed.includes(l.id),
          title = state.edits[l.id]?.title || l.title;
        html +=
          '<button class="lesson-row ' +
          (l.id === state.selected ? "active " : "") +
          (done ? "done" : "") +
          '" data-lesson="' +
          l.id +
          '" ' +
          (l.id === state.selected ? 'aria-current="true"' : "") +
          '><span class="row-icon">' +
          (done ? "✓" : l.id === state.selected ? "▶" : "▷") +
          '</span><span class="row-title">' +
          esc(title) +
          '<span class="row-sub">Aula ' +
          String(l.number).padStart(2, "0") +
          " · Módulo " +
          m.id +
          "</span></span></button>";
      }
    }
    html += "</div></div>";
  }
  $("#module-list").innerHTML =
    html ||
    '<p class="empty">Nenhuma aula encontrada. Tente outro assunto.</p>';
  const done = new Set(state.completed.filter((id) => byId.has(id))).size,
    p = Math.round((done / flat.length) * 100);
  $("#progress-text").textContent =
    done + " de " + flat.length + " aulas concluídas";
  $("#progress-percent").textContent = p + "%";
  $("#progress-fill").style.width = p + "%";
  $(".progress-track").setAttribute("aria-valuenow", done);
}
function renderDetails() {
  const l = current(),
    idx = flat.findIndex((x) => x.id === l.id);
  $("#lesson-label").textContent =
    "MÓDULO 0" + l.module + " • AULA " + String(l.number).padStart(2, "0");
  $("#lesson-title").textContent =
    state.edits[l.id]?.title ||
    (l.published
      ? l.title
      : l.topicTitle +
        " · Parte " +
        (COURSE[l.module - 1].topics
          .find((t) => t.id === l.topic)
          .lessons.findIndex((x) => x.id === l.id) +
          1));
  $("#description").textContent = l.description;
  $("#complete").classList.toggle("complete", state.completed.includes(l.id));
  $("#complete").textContent = state.completed.includes(l.id)
    ? "✓  Aula concluída"
    : "○  Marcar como concluída";
  $("#previous").disabled = idx === 0;
  $("#next").disabled = idx === flat.length - 1;
  renderTab();
}
function showCover() {
  playing = false;
  session++;
  const l = current();
  $("#player").innerHTML =
    '<div class="cover"><div class="orb"></div><div class="code">&lt;/&gt;</div><p>' +
    esc(l.topicTitle) +
    "</p><small>Módulo 0" +
    l.module +
    " · Aula " +
    String(l.number).padStart(2, "0") +
    '</small><button class="play" id="play">▶ &nbsp;' +
    (state.positions[l.id] > 3 ? "Continuar aula" : "Assistir aula") +
    '</button><div class="cover-bottom"><span>ACME / NEXT.JS FULL STACK</span><span>DO CONCEITO À PRÁTICA ↗</span></div></div>';
  $("#play").onclick = startPlayer;
  $("#player-status").textContent = "Pronto para aprender";
  notice("");
}
function selectLesson(id, start = false) {
  if (!byId.has(id)) return;
  state.selected = id;
  expanded.add(byId.get(id).module);
  persist();
  renderMenu();
  renderDetails();
  showCover();
  closeDrawer();
  if (start) startPlayer();
}
function embedFallback(id, sid) {
  if (sid !== session || id !== state.selected) return;
  $("#player").innerHTML =
    '<iframe src="https://drive.google.com/file/d/' +
    id +
    '/preview" title="' +
    esc(current().title) +
    '" allow="autoplay; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>';
  $("#player-status").textContent = "Player do Google Drive";
  notice(
    "Usando o player do Drive. Toque em reproduzir. Neste modo, use “Próxima aula” para avançar; a passagem automática e a retomada no segundo exato não ficam disponíveis.",
  );
}
function startPlayer() {
  playing = true;
  const id = state.selected,
    sid = ++session;
  $("#player").innerHTML =
    '<video controls playsinline preload="metadata" aria-label="Vídeo da aula"></video>';
  const v = $("#player video");
  $("#player-status").textContent = "Abrindo sua aula...";
  notice("");
  const loadTimeout = setTimeout(() => {
    if (sid === session && v.readyState === 0) embedFallback(id, sid);
  }, 12000);
  v.onloadedmetadata = () => {
    clearTimeout(loadTimeout);
    if (sid !== session) return;
    if (state.positions[id] > 0 && state.positions[id] < v.duration - 3)
      v.currentTime = state.positions[id];
    $("#player-status").textContent = "Player contínuo · ACME";
    v.play().catch(() =>
      notice("Toque no botão de reproduzir para começar a aula."),
    );
  };
  v.onerror = () => {
    clearTimeout(loadTimeout);
    embedFallback(id, sid);
  };
  v.ontimeupdate = () => {
    if (sid !== session) return;
    state.positions[id] = v.currentTime;
    if (!saveTimer)
      saveTimer = setTimeout(() => {
        persist();
        saveTimer = null;
      }, 2000);
  };
  v.onended = () => {
    if (sid !== session) return;
    if (!state.completed.includes(id)) state.completed.push(id);
    delete state.positions[id];
    persist();
    renderMenu();
    renderDetails();
    const idx = flat.findIndex((l) => l.id === id);
    if (state.autoplay && idx < flat.length - 1)
      selectLesson(flat[idx + 1].id, true);
    else if (idx === flat.length - 1)
      toast("Você chegou ao fim das aulas disponíveis!");
  };
  v.src = "/media/" + id;
}
function renderTab() {
  const l = current();
  document.querySelectorAll("[data-tab]").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === tab);
    b.setAttribute("aria-selected", b.dataset.tab === tab);
  });
  const el = $("#tab-content");
  if (tab === "about") {
    el.innerHTML =
      "<h3>O próximo passo do seu projeto</h3><p>" +
      esc(l.description) +
      '</p><div class="feature-grid"><div class="mini-card"><b>⌘ &nbsp;Aprenda na prática</b>Assista e aplique no projeto ACME.</div><div class="mini-card"><b>✎ &nbsp;Faça do seu jeito</b>Edite os assuntos e registre suas descobertas.</div></div><p style="font-size:11px;margin-top:20px">Os assuntos iniciais seguem as pastas do professor. Os títulos específicos de cada gravação podem ser preenchidos por você.</p>';
  } else if (tab === "notes") {
    el.innerHTML =
      '<h3>Suas ideias também fazem parte da aula.</h3><textarea class="notes" id="notes" aria-label="Anotações pessoais desta aula" maxlength="20000" placeholder="O que você aprendeu? Anote conceitos, dúvidas e comandos importantes..."></textarea><div class="note-label">Salvamento automático neste navegador · anotações pessoais</div>';
    $("#notes").value = state.notes[l.id] || "";
    $("#notes").oninput = (e) => {
      state.notes[l.id] = e.target.value;
      persist();
    };
  } else {
    el.innerHTML =
      '<h3>Tudo à mão para continuar.</h3><a class="resource" target="_blank" rel="noopener" href="https://drive.google.com/file/d/1drGcaBEKRdkrR43z4iOoBpGJ077nO5RP/view"><span>▤</span><span>Planejamento do projeto ACME<small>Documento original do professor · acme.md</small></span><span style="margin-left:auto">↗</span></a><a class="resource" target="_blank" rel="noopener" href="https://drive.google.com/drive/folders/1qkuEUYe7Y7L99rTwfC6tBPWkkEELlcvf"><span>⌘</span><span>Arquivos de configuração<small>settings.json e tsconfig.json · Módulo 1</small></span><span style="margin-left:auto">↗</span></a><a class="resource" target="_blank" rel="noopener" href="' +
      esc(l.url) +
      '"><span>▷</span><span>Abrir esta aula no Drive<small>Vídeo original do professor</small></span><span style="margin-left:auto">↗</span></a>';
  }
}
function closeDrawer() {
  document.body.classList.remove("drawer-open");
}
$("#open-menu").onclick = () => {
  document.body.classList.add("drawer-open");
  $("#close-menu").focus();
};
$("#close-menu").onclick = () => {
  closeDrawer();
  $("#open-menu").focus();
};
$("#overlay").onclick = closeDrawer;
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeDrawer();
});
$("#module-list").onclick = (e) => {
  let b = e.target.closest("[data-module]");
  if (b) {
    let id = +b.dataset.module;
    expanded.has(id) ? expanded.delete(id) : expanded.add(id);
    renderMenu();
  }
  b = e.target.closest("[data-lesson]");
  if (b) selectLesson(b.dataset.lesson, playing);
};
$("#search").oninput = renderMenu;
$("#autoplay").checked = !!state.autoplay;
$("#autoplay").onchange = (e) => {
  state.autoplay = e.target.checked;
  persist();
  if (state.autoplay)
    toast(
      "Passagem automática ativada para o player contínuo. No player do Drive, o avanço é manual.",
    );
};
$("#previous").onclick = () => {
  const i = flat.findIndex((l) => l.id === state.selected);
  if (i > 0) selectLesson(flat[i - 1].id, playing);
};
$("#next").onclick = () => {
  const i = flat.findIndex((l) => l.id === state.selected);
  if (i < flat.length - 1) selectLesson(flat[i + 1].id, playing);
};
$("#complete").onclick = () => {
  const id = state.selected;
  state.completed = state.completed.includes(id)
    ? state.completed.filter((x) => x !== id)
    : [...state.completed, id];
  persist();
  renderMenu();
  renderDetails();
};
document.querySelectorAll("[data-tab]").forEach(
  (b) =>
    (b.onclick = () => {
      tab = b.dataset.tab;
      renderTab();
    }),
);
$("#edit").onclick = () => {
  const l = current();
  $("#edit-title").value =
    state.edits[l.id]?.title || $("#lesson-title").textContent;
  $("#edit-description").value = l.description;
  $("#editor").showModal();
};
$("#cancel-edit").onclick = () => $("#editor").close();
$("#edit-form").onsubmit = (e) => {
  e.preventDefault();
  const title = $("#edit-title").value.trim();
  if (!title) return;
  state.edits[state.selected] = {
    title,
    description: $("#edit-description").value.trim(),
  };
  let saved = persist();
  renderMenu();
  renderDetails();
  $("#editor").close();
  if (saved) toast("Assunto atualizado neste navegador.");
};
function download(name, obj) {
  const u = URL.createObjectURL(
    new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 5000);
}
$("#export").onclick = () =>
  download("acme-minhas-aulas.json", {
    version: 1,
    exportedAt: new Date().toISOString(),
    state,
  });
$("#import").onclick = () => $("#import-file").click();
$("#import-file").onchange = async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    if (f.size > 2000000) throw Error("Arquivo muito grande.");
    const p = JSON.parse(await f.text());
    if (p.version !== 1 || !p.state || typeof p.state !== "object")
      throw Error("Formato de cópia inválido.");
    const incoming = p.state;
    const edits = {},
      notes = {},
      positions = {};
    for (const l of flat) {
      const edit = incoming.edits?.[l.id];
      if (
        edit &&
        typeof edit.title === "string" &&
        edit.title.trim() &&
        edit.title.length <= 160 &&
        typeof edit.description === "string" &&
        edit.description.length <= 3000
      )
        edits[l.id] = { title: edit.title, description: edit.description };
      if (typeof incoming.notes?.[l.id] === "string")
        notes[l.id] = incoming.notes[l.id].slice(0, 20000);
      if (
        Number.isFinite(incoming.positions?.[l.id]) &&
        incoming.positions[l.id] >= 0
      )
        positions[l.id] = incoming.positions[l.id];
    }
    if (
      !confirm(
        "Mesclar esta cópia com seus dados atuais? Os títulos e anotações da cópia substituem os correspondentes neste navegador.",
      )
    )
      return;
    state.edits = { ...state.edits, ...edits };
    state.notes = { ...state.notes, ...notes };
    state.positions = { ...state.positions, ...positions };
    state.completed = [
      ...new Set([
        ...state.completed,
        ...(Array.isArray(incoming.completed)
          ? incoming.completed.filter((id) => byId.has(id))
          : []),
      ]),
    ];
    persist();
    renderMenu();
    renderDetails();
    toast("Cópia importada. Sua organização está atualizada.");
  } catch (err) {
    toast("Não foi possível importar: " + err.message);
  }
  e.target.value = "";
};
$("#github").onclick = async () => {
  $("#github-dialog").showModal();
  $("#send-github").disabled = true;
  $("#github-status").textContent = "Verificando configuração...";
  try {
    const r = await fetch("/api/github/status");
    const d = await r.json();
    $("#github-status").textContent = d.configured
      ? "Destino: " +
        d.repository +
        " · " +
        d.branch +
        ". O envio cria um commit com os assuntos atuais."
      : "O envio ainda precisa ser configurado: repositório GitHub, credencial protegida e administrador. Você já pode editar e exportar uma cópia. Nenhum envio foi feito.";
    $("#send-github").disabled = !d.configured;
    catalogSha = d.sha || null;
  } catch {
    $("#github-status").textContent =
      "Não foi possível verificar o GitHub. Suas edições locais continuam disponíveis.";
  }
};
$("#close-github").onclick = () => $("#github-dialog").close();
$("#send-github").onclick = async () => {
  if (githubBusy) return;
  githubBusy = true;
  $("#send-github").disabled = true;
  $("#github-status").textContent = "Enviando as alterações...";
  try {
    const r = await fetch("/api/github/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sha: catalogSha,
        requestId: crypto.randomUUID(),
        lessons: flat.map((l) => ({
          id: l.id,
          title: state.edits[l.id]?.title || l.title,
          description: state.edits[l.id]?.description || l.description,
        })),
      }),
    });
    const d = await r.json();
    if (!r.ok) throw Error(d.error || "Não foi possível salvar.");
    catalogSha = d.sha;
    $("#github-status").textContent =
      "Commit criado no GitHub. A publicação do seu site depende da automação de hospedagem configurada.";
    toast("Títulos enviados ao GitHub.");
  } catch (e) {
    $("#github-status").textContent =
      e.message + " Nenhum reenvio automático será feito.";
  } finally {
    githubBusy = false;
  }
};
async function loadPublishedCatalog() {
  try {
    const r = await fetch("/api/catalog");
    if (!r.ok) return;
    const d = await r.json();
    if (Array.isArray(d.lessons)) {
      for (const l of d.lessons)
        if (
          byId.has(l.id) &&
          typeof l.title === "string" &&
          typeof l.description === "string"
        ) {
          const base = byId.get(l.id);
          base.title = l.title;
          base.description = l.description;
          base.published = true;
          for (const m of COURSE)
            for (const t of m.topics) {
              const original = t.lessons.find((x) => x.id === l.id);
              if (original) {
                original.title = l.title;
                original.description = l.description;
              }
            }
        }
      renderMenu();
      renderDetails();
    }
  } catch {}
}
renderMenu();
renderDetails();
showCover();
loadPublishedCatalog();
if (!storageOK)
  notice(
    "O armazenamento do navegador está indisponível. Exporte sua organização para guardar as alterações.",
  );
window.addEventListener("pagehide", persist);

let installPrompt = null,
  swRegistration = null,
  reloadForUpdate = false;
function pwaDisplay() {
  const installed =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  $("#pwa-install").hidden = installed;
  $("#pwa-install").style.display = installed ? "none" : "";
}
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installPrompt = e;
  $("#pwa-install").textContent = "＋ Instalar aplicativo";
  pwaDisplay();
});
window.addEventListener("appinstalled", () => {
  installPrompt = null;
  pwaDisplay();
  toast("ACME Aulas instalado. Acesse pela tela inicial.");
});
window
  .matchMedia("(display-mode: standalone)")
  .addEventListener("change", pwaDisplay);
$("#pwa-install").onclick = async () => {
  if (installPrompt) {
    const prompt = installPrompt;
    installPrompt = null;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted")
      toast("Instalação solicitada ao navegador.");
    return;
  }
  const ua = navigator.userAgent;
  const ios =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  let steps = ios
    ? [
        "Abra este endereço no Safari.",
        "Toque em Compartilhar e escolha “Adicionar à Tela de Início”.",
        "Confirme o nome ACME Aulas e toque em “Adicionar”.",
      ]
    : /Android/i.test(ua)
      ? [
          "Abra o link no Chrome ou em um navegador compatível, fora do navegador interno do ChatGPT.",
          "No menu ⋮, procure “Instalar aplicativo” ou “Instalar e criar atalho” e escolha “Instalar”.",
          "Escolha instalar como aplicativo. Um simples atalho pode exibir a marca do navegador.",
        ]
      : [
          "Abra o site no Chrome ou Edge.",
          "Procure o ícone de instalação na barra de endereço ou a opção “Instalar” no menu do navegador.",
          "Confirme para abrir o ACME Aulas em uma janela própria.",
        ];
  $("#install-steps").innerHTML = steps
    .map((x) => "<li>" + esc(x) + "</li>")
    .join("");
  $("#install-dialog").showModal();
};
$("#close-install").onclick = () => $("#install-dialog").close();
function connectionStatus() {
  $("#connection-state").classList.toggle("visible", !navigator.onLine);
}
window.addEventListener("online", connectionStatus);
window.addEventListener("offline", connectionStatus);
connectionStatus();
pwaDisplay();
if ("serviceWorker" in navigator && window.isSecureContext) {
  navigator.serviceWorker
    .register("/sw.js", { scope: "/", updateViaCache: "none" })
    .then((reg) => {
      swRegistration = reg;
      $("#pwa-registration-status").textContent =
        "Estrutura do aplicativo registrada neste navegador.";
      function offer() {
        if (reg.waiting && navigator.serviceWorker.controller) {
          $("#pwa-update").style.display = "inline-flex";
        }
      }
      offer();
      reg.addEventListener("updatefound", () => {
        const w = reg.installing;
        if (w)
          w.addEventListener("statechange", () => {
            if (w.state === "installed") offer();
          });
      });
    })
    .catch(() => {
      $("#pwa-registration-status").textContent =
        "Não foi possível preparar a instalação neste navegador. O curso continua disponível pelo site.";
    });
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloadForUpdate) location.reload();
  });
} else {
  $("#pwa-registration-status").textContent =
    "Para instalar, abra o endereço HTTPS publicado em um navegador compatível.";
}
$("#pwa-update").onclick = () => {
  if (swRegistration?.waiting) {
    persist();
    reloadForUpdate = true;
    swRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
  }
};
