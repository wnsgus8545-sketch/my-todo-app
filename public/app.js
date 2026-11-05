// 할 일 목록 앱
// 데이터는 브라우저의 localStorage에 저장돼요. (나중에 Firestore로 바꿀 수 있어요)
//
// 할 일 하나의 모양:
// { id, text, done, due: "2026-11-10" 또는 null, important: true/false, category: "work" | "personal" | "study" | null }
// 배열 순서 = 화면에 보이는 순서예요. (드래그나 ☆로 순서를 바꾸면 배열 순서가 바뀌어요)

const STORAGE_KEY = "my-todo-app";
const THEME_KEY = "my-todo-theme";

const CATEGORIES = {
  work: "회사",
  personal: "개인",
  study: "공부",
};

// ── 화면 요소 가져오기 ──
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const dueInput = document.getElementById("todo-due");
const categoryInput = document.getElementById("todo-category");
const list = document.getElementById("todo-list");
const count = document.getElementById("todo-count");
const clearDone = document.getElementById("clear-done");
const statusButtons = document.querySelectorAll("#status-filters button");
const categoryButtons = document.querySelectorAll("#category-filters button");
const themeToggle = document.getElementById("theme-toggle");

// ── 상태 ──
let todos = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]").map((t) => ({
  // 예전 버전에서 저장한 할 일에는 새 항목이 없어서 기본값을 채워 줘요
  due: null,
  important: false,
  category: null,
  ...t,
}));
let statusFilter = "all";
let categoryFilter = "all";

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// ── 날짜 도우미 ──

// 오늘 날짜를 "2026-11-05" 형식으로 (내 컴퓨터 시간 기준)
function todayString() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// "2026-11-10" 같은 날짜 문자열은 그대로 비교해도 순서가 맞아요
function dueStatus(todo) {
  if (!todo.due || todo.done) return "normal";
  const today = todayString();
  if (todo.due < today) return "overdue";
  if (todo.due === today) return "today";
  return "normal";
}

function formatDue(todo) {
  const [, m, d] = todo.due.split("-");
  const label = `${Number(m)}/${Number(d)}`;
  const status = dueStatus(todo);
  if (status === "today") return "📅 오늘까지";
  if (status === "overdue") return `📅 ${label} · 지남`;
  return `📅 ${label}`;
}

// ── 화면 그리기 ──
function isVisible(todo) {
  if (statusFilter === "active" && todo.done) return false;
  if (statusFilter === "done" && !todo.done) return false;
  if (categoryFilter !== "all" && todo.category !== categoryFilter) return false;
  return true;
}

function render() {
  list.innerHTML = "";
  const visible = todos.filter(isVisible);

  if (visible.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = todos.length === 0 ? "할 일이 없어요 🎉" : "조건에 맞는 할 일이 없어요";
    list.appendChild(empty);
  }

  for (const todo of visible) {
    list.appendChild(createItem(todo));
  }

  const left = todos.filter((t) => !t.done).length;
  const overdue = todos.filter((t) => dueStatus(t) === "overdue").length;
  count.textContent = `남은 할 일 ${left}개` + (overdue ? ` · 기한 지남 ${overdue}개` : "");
}

function createItem(todo) {
  const li = document.createElement("li");
  li.dataset.id = todo.id;
  if (todo.done) li.classList.add("done");
  if (dueStatus(todo) === "overdue") li.classList.add("overdue");

  // ⠿ 드래그 손잡이
  const handle = document.createElement("span");
  handle.className = "handle";
  handle.textContent = "⠿";
  handle.title = "끌어서 순서 바꾸기";
  setupDrag(handle, li);

  // 완료 체크박스
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = todo.done;
  checkbox.addEventListener("change", () => {
    todo.done = checkbox.checked;
    save();
    render();
  });

  // ☆ 중요 표시: 켜면 맨 위로 올라가요
  const star = document.createElement("button");
  star.type = "button";
  star.className = "star" + (todo.important ? " on" : "");
  star.textContent = todo.important ? "★" : "☆";
  star.title = todo.important ? "중요 표시 해제" : "중요 표시";
  star.addEventListener("click", () => {
    todo.important = !todo.important;
    if (todo.important) {
      todos = [todo, ...todos.filter((t) => t.id !== todo.id)];
    }
    save();
    render();
  });

  // 할 일 내용 + 태그/날짜
  const body = document.createElement("div");
  body.className = "body";

  const text = document.createElement("div");
  text.className = "text";
  text.textContent = todo.text; // textContent를 써서 HTML이 실행되지 않게 해요
  text.title = "더블클릭해서 수정";
  text.addEventListener("dblclick", () => startEdit(todo, text));

  const meta = document.createElement("div");
  meta.className = "meta";
  if (todo.category && CATEGORIES[todo.category]) {
    const tag = document.createElement("span");
    tag.className = `tag tag-${todo.category}`;
    tag.textContent = CATEGORIES[todo.category];
    meta.appendChild(tag);
  }
  if (todo.due) {
    const due = document.createElement("span");
    due.className = "due " + dueStatus(todo);
    due.textContent = formatDue(todo);
    meta.appendChild(due);
  }

  body.append(text, meta);

  // ✕ 삭제
  const del = document.createElement("button");
  del.type = "button";
  del.className = "delete";
  del.textContent = "✕";
  del.title = "삭제";
  del.addEventListener("click", () => {
    todos = todos.filter((t) => t.id !== todo.id);
    save();
    render();
  });

  li.append(handle, checkbox, star, body, del);
  return li;
}

// ── 더블클릭 수정 ──
// Enter 또는 다른 곳 클릭 → 저장, Esc → 취소, 빈칸이면 원래 내용 유지
function startEdit(todo, textEl) {
  const editor = document.createElement("input");
  editor.type = "text";
  editor.className = "edit";
  editor.value = todo.text;
  textEl.replaceWith(editor);
  editor.focus();
  editor.select();

  let finished = false;
  function finish(shouldSave) {
    if (finished) return; // Enter 후 blur가 또 불려도 한 번만 처리
    finished = true;
    const value = editor.value.trim();
    if (shouldSave && value) {
      todo.text = value;
      save();
    }
    render();
  }

  editor.addEventListener("keydown", (e) => {
    if (e.key === "Enter") finish(true);
    if (e.key === "Escape") finish(false);
  });
  editor.addEventListener("blur", () => finish(true));
}

// ── 드래그로 순서 바꾸기 ──
// 마우스와 손가락(터치) 모두 되도록 pointer 이벤트를 써요
// 끄는 동안 항목이 화면에서 자리를 옮기기 때문에, 움직임과 손 떼기는 손잡이가 아니라
// 창(window) 전체에서 들어요. 그래야 중간에 이벤트를 놓치지 않아요.
function setupDrag(handle, li) {
  handle.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    li.classList.add("dragging");

    function onMove(ev) {
      const under = document.elementFromPoint(ev.clientX, ev.clientY);
      const target = under && under.closest("#todo-list li[data-id]");
      if (!target || target === li) return;

      // 대상 항목의 위쪽 절반이면 앞에, 아래쪽 절반이면 뒤에 끼워 넣어요
      const rect = target.getBoundingClientRect();
      const after = ev.clientY > rect.top + rect.height / 2;
      list.insertBefore(li, after ? target.nextSibling : target);
    }

    function onEnd() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      li.classList.remove("dragging");
      applyNewOrder();
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
  });
}

// 화면에 보이는 순서를 실제 데이터 순서에 반영해요.
// 필터로 일부만 보이는 경우, 보이는 항목들끼리만 자리를 바꾸고 숨은 항목은 제자리에 둬요.
function applyNewOrder() {
  const newIds = [...list.querySelectorAll("li[data-id]")].map((el) => Number(el.dataset.id));
  const moved = new Set(newIds);
  const byId = new Map(todos.map((t) => [t.id, t]));

  const result = todos.slice();
  let k = 0;
  todos.forEach((t, i) => {
    if (moved.has(t.id)) result[i] = byId.get(newIds[k++]);
  });

  todos = result;
  save();
  render();
}

// ── 할 일 추가 ──
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  todos.push({
    id: Date.now(),
    text,
    done: false,
    due: dueInput.value || null,
    important: false,
    category: categoryInput.value || null,
  });

  input.value = "";
  dueInput.value = "";
  // 카테고리는 같은 걸 연달아 추가할 때가 많아서 그대로 둬요
  save();
  render();
  input.focus();
});

clearDone.addEventListener("click", () => {
  todos = todos.filter((t) => !t.done);
  save();
  render();
});

// ── 필터 ──
statusButtons.forEach((btn) =>
  btn.addEventListener("click", () => {
    statusFilter = btn.dataset.filter;
    statusButtons.forEach((b) => b.classList.toggle("active", b === btn));
    render();
  })
);

categoryButtons.forEach((btn) =>
  btn.addEventListener("click", () => {
    categoryFilter = btn.dataset.category;
    categoryButtons.forEach((b) => b.classList.toggle("active", b === btn));
    render();
  })
);

// ── 다크 모드 ──
function updateThemeButton() {
  const dark = document.documentElement.dataset.theme === "dark";
  themeToggle.textContent = dark ? "☀️" : "🌙";
  themeToggle.title = dark ? "라이트 모드로" : "다크 모드로";
}

themeToggle.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem(THEME_KEY, next);
  updateThemeButton();
});

updateThemeButton();
render();
