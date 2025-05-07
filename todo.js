document.addEventListener('DOMContentLoaded', () => {
    const todoBtn = document.getElementById('todo-btn');
    const closeTodoPanelBtn = document.getElementById('close-todo-panel');
    const todoPanel = document.getElementById('todo-panel');
    const addTodoBtn = document.getElementById('add-todo-btn');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');

    // Add a version check to force update to Albanian version
    const currentVersion = "albanian_1.0";
    const savedVersion = localStorage.getItem('todos_version');
    
    // Clear localStorage if version doesn't match
    if (savedVersion !== currentVersion) {
        localStorage.removeItem('todos');
        localStorage.setItem('todos_version', currentVersion);
    }

    let todos = JSON.parse(localStorage.getItem('todos')) || [];

    const initialTasks = [
            { text: "Kontrollo dhe përditëso tekstin në faqe kryesore.", status: "Not Done", href: "#home" },
            { text: "Përmirëso përmbajtjen e seksionit \"Rreth Nesh\".", status: "Not Done", href: "#about" },
            { text: "Optimizoni imazhet e produkteve (ëmbëlsira, pastiçeri).", status: "Not Done", href: "#menu" },
            { text: "Shto përshkrime më të detajuara për çdo produkt.", status: "Not Done", href: "#menu" },
            { text: "Përditëso formularin e kontaktit dhe testo dërgimin.", status: "Not Done", href: "#contact" },
            { text: "Lidhu saktë butonat e rrjeteve sociale.", status: "Not Done", href: "#contact" },
            { text: "Rregullo seksionin \"Menuja Jonë\" me çmimet përkatëse.", status: "Not Done", href: "#menu" },
            { text: "Sigurohu që seksioni i dëshmive të duket bukur.", status: "Not Done", href: "#testimonials" },
            { text: "Përmirëso fundfaqen me të gjitha informacionet e biznesit.", status: "Not Done", href: "#contact" },
            { text: "Sigurohu që faqja të jetë e përshtatur mirë për pajisjet mobile.", status: "Not Done", href: "#home" }
];

    if (todos.length === 0) {
        todos = initialTasks;
        localStorage.setItem('todos', JSON.stringify(todos));
    }

    const saveTodos = () => {
        localStorage.setItem('todos', JSON.stringify(todos));
    };

    const renderTodos = () => {
        todoList.innerHTML = ''; 
        todos.forEach((todo, index) => {
            const li = document.createElement('li');
            li.classList.add('todo-item');

            li.classList.remove('done', 'in-progress', 'not-done');

            if (todo.status === 'In Progress') {
                li.classList.add('in-progress');
            } else if (todo.status === 'Not Done') { 
                li.classList.add('not-done');
            } else { 
                li.classList.add('done'); 
            }

            li.dataset.index = index; 

            const taskElement = document.createElement(todo.href ? 'a' : 'span');
            taskElement.textContent = todo.text;
            taskElement.classList.add('task-text');

            if (todo.href) {
                taskElement.href = todo.href;
                taskElement.addEventListener('click', (e) => {
                    // Allow default link behavior but also close panel
                    // e.preventDefault(); // Remove this if you want instant navigation
                    const targetId = todo.href.substring(1);
                    const section = document.getElementById(targetId);
                    if(section) {
                       section.scrollIntoView({ behavior: 'smooth' });
                    }
                    todoPanel.classList.remove('show'); 
                });
            } else {
                 // Remove the dblclick editing for non-link tasks
                 taskElement.addEventListener('click', (event) => {
                     event.stopPropagation();
                 });
            }

            if (todo.status === 'Done') {
                taskElement.classList.add('task-text-done');
            }

            const statusSelect = document.createElement('select');
            statusSelect.innerHTML = `
                <option value="Not Done" ${todo.status === 'Not Done' ? 'selected' : ''}>Not Done</option>
                <option value="In Progress" ${todo.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                <option value="Done" ${todo.status === 'Done' ? 'selected' : ''}>Done</option>
            `;
            statusSelect.addEventListener('change', (e) => updateStatus(index, e.target.value));

            const editBtn = document.createElement('button');
            editBtn.innerHTML = '<i class="uil uil-edit"></i>'; 
            editBtn.title = 'Edit Task';
            editBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                // Ensure editing works on the text element (<a> or <span>)
                enableInlineEdit(taskElement, index);
            });

            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '<i class="uil uil-trash-alt"></i>'; 
            removeBtn.title = 'Remove Task';
            removeBtn.addEventListener('click', (event) => {
                event.stopPropagation(); 
                removeTask(index, event);
            });

            li.appendChild(taskElement);
            li.appendChild(statusSelect);
            li.appendChild(editBtn);
            li.appendChild(removeBtn);
            todoList.appendChild(li);
        });
    };

    const enableInlineEdit = (taskElement, index) => {
        const currentText = taskElement.textContent;
        const parent = taskElement.parentElement;
        

        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.classList.add('inline-edit-input');
        
       
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                finishEditing(input, index);
            } else if (e.key === 'Escape') {
                
                renderTodos();
            }
        });
        
        input.addEventListener('blur', () => {
            finishEditing(input, index);
        });
        

        parent.replaceChild(input, taskElement);
        input.focus();

        input.setSelectionRange(input.value.length, input.value.length);
    };
    

    const finishEditing = (inputElement, index) => {
        const newText = inputElement.value.trim();
        if (newText && newText !== todos[index].text) {
            todos[index].text = newText;
            // Decide if editing should remove the href. Let's keep it for now.
            // todos[index].href = null; // Uncomment to remove link on edit
            saveTodos();
        }
        renderTodos();
    };

    const addTask = () => {
        const text = todoInput.value.trim();
        if (text) {
            todos.push({ text: text, status: 'Not Done', href: '#home' });
            todoInput.value = ''; 
            saveTodos();
            renderTodos();
        }
    };

    const removeTask = (index, event) => {

        if (event) {
            event.stopPropagation();
        }
        todos.splice(index, 1);
        saveTodos();
        renderTodos();
    };

    const editTask = (index) => {
    
        const spanElement = document.querySelector(`li[data-index="${index}"] .task-text`);
        if (spanElement) {
            enableInlineEdit(spanElement, index);
        }
    };

    const updateStatus = (index, newStatus) => {
        todos[index].status = newStatus;
        saveTodos();
        renderTodos(); 
    };

    
    if (todoBtn) {
        todoBtn.addEventListener('click', () => {
            todoPanel.classList.add('show');
        });
    }

    if (closeTodoPanelBtn) {
        closeTodoPanelBtn.addEventListener('click', () => {
            todoPanel.classList.remove('show');
        });
    }

    if (addTodoBtn) {
        addTodoBtn.addEventListener('click', addTask);
    }


    if (todoInput) {
        todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addTask();
            }
        });
    }

    document.addEventListener('click', (event) => {
        
        if (todoPanel.classList.contains('show')) {
            
            const isClickInsidePanel = todoPanel.contains(event.target);
            const isClickOnToggleButton = todoBtn ? todoBtn.contains(event.target) : false;

            if (!isClickInsidePanel && !isClickOnToggleButton) {
                todoPanel.classList.remove('show');
            }
        }
    });

    
    renderTodos();
});