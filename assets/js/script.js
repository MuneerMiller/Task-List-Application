document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "task-list.tasks";
    const TRASH_ICON =
        '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/>' +
        '<path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>';

    const form = document.querySelector("#newTask");
    const taskInput = document.querySelector("#taskInput");
    const errorMessage = document.querySelector("#taskError");
    const taskContainer = document.querySelector(".tasks");
    const emptyState = document.querySelector("#emptyState");
    const summary = document.querySelector("#summary");
    const clearCompletedButton = document.querySelector("#clear-completed");

    let tasks = loadTasks();
    let newTaskId = null; // only the task just added fades in

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        addTask(taskInput.value);
    });

    taskInput.addEventListener("input", () => showError(""));
    clearCompletedButton.addEventListener("click", clearCompletedTasks);

    render();

    // Saved tasks survive a page refresh. Storage can be unavailable (for
    // example in some private windows), so the app still works without it.
    function loadTasks() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            return Array.isArray(saved) ? saved : [];
        } catch {
            return [];
        }
    }

    function saveTasks() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        } catch {
            // Nothing to do: the list still works for this visit.
        }
    }

    function addTask(text) {
        const name = text.trim();
        if (name === "") {
            showError("Please type a task before adding it.");
            taskInput.focus();
            return;
        }

        tasks.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2), name, done: false });
        newTaskId = tasks[tasks.length - 1].id;
        saveTasks();
        taskInput.value = "";
        render();
        newTaskId = null;
        taskContainer.scrollTop = taskContainer.scrollHeight;
    }

    function toggleTask(id, done) {
        const task = tasks.find((t) => t.id === id);
        if (task) task.done = done;
        saveTasks();
        render();
    }

    function removeTask(id) {
        const element = taskContainer.querySelector(`[data-id="${id}"]`);
        tasks = tasks.filter((t) => t.id !== id);
        saveTasks();
        if (element) {
            element.classList.add("removing");
            setTimeout(render, 300);
        } else {
            render();
        }
    }

    function clearCompletedTasks() {
        tasks = tasks.filter((t) => !t.done);
        saveTasks();
        render();
    }

    function showError(text) {
        errorMessage.textContent = text;
        taskInput.setAttribute("aria-invalid", text ? "true" : "false");
    }

    function render() {
        taskContainer.replaceChildren(...tasks.map(createTaskElement));

        const doneCount = tasks.filter((t) => t.done).length;
        emptyState.hidden = tasks.length > 0;
        summary.textContent = tasks.length ? `${doneCount} of ${tasks.length} done` : "";
        clearCompletedButton.disabled = doneCount === 0;
    }

    function createTaskElement(task) {
        const item = document.createElement("li");
        item.className = task.id === newTaskId ? "task new" : "task";
        item.dataset.id = task.id;

        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.done;
        checkbox.addEventListener("change", () => toggleTask(task.id, checkbox.checked));

        const taskText = document.createElement("span");
        taskText.textContent = task.name; // textContent, so typed HTML is shown, never run
        taskText.classList.toggle("checked", task.done);

        label.append(checkbox, taskText);

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete";
        deleteButton.setAttribute("aria-label", `Delete "${task.name}"`);
        deleteButton.innerHTML = TRASH_ICON;
        deleteButton.addEventListener("click", () => removeTask(task.id));

        item.append(label, deleteButton);
        return item;
    }
});
