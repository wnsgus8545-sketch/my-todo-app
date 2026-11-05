// 할 일 목록 앱
// 데이터는 브라우저의 localStorage에 저장돼요. (나중에 Firestore로 바꿀 수 있어요)

const STORAGE_KEY = "my-todo-app";

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const count = document.getElementById("todo-count");
const clearDone = document.getElementById("clear-done");
const filterButtons = document.querySelectorAll(".filters button");

let todos = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let filter = "all";

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function render() {
  list.innerHTML = "";

  const visible = todos.filter((t) =>
    filter === "active" ? !t.done : filter === "done" ? t.done : true
  );

  if (visible.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "할 일이 없어요 🎉";
    list.appendChild(empty);
  }

  for (const todo of visible) {
    const li = document.createElement("li");
    if (todo.done) li.classList.add("done");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.addEventListener("change", () => {
      todo.done = checkbox.checked;
      save();
      render();
    });

    const text = document.createElement("span");
    text.textContent = todo.text; // textContent를 써서 HTML이 실행되지 않게 해요

    const del = document.createElement("button");
    del.className = "delete";
    del.textContent = "✕";
    del.title = "삭제";
    del.addEventListener("click", () => {
      todos = todos.filter((t) => t.id !== todo.id);
      save();
      render();
    });

    li.append(checkbox, text, del);
    list.appendChild(li);
  }

  const left = todos.filter((t) => !t.done).length;
  count.textContent = `남은 할 일 ${left}개`;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  todos.push({ id: Date.now(), text, done: false });
  input.value = "";
  save();
  render();
});

clearDone.addEventListener("click", () => {
  todos = todos.filter((t) => !t.done);
  save();
  render();
});

filterButtons.forEach((btn) =>
  btn.addEventListener("click", () => {
    filter = btn.dataset.filter;
    filterButtons.forEach((b) => b.classList.toggle("active", b === btn));
    render();
  })
);

render();
