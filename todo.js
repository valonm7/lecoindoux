document.addEventListener('DOMContentLoaded', () => {
    const todoBtn = document.getElementById('todo-btn');
    const closeTodoPanelBtn = document.getElementById('close-todo-panel');
    const todoPanel = document.getElementById('todo-panel');
    const addTodoBtn = document.getElementById('add-todo-btn');
    const todoInput = document.getElementById('todo-input');
    const todoList = document.getElementById('todo-list');

    let todos = JSON.parse(localStorage.getItem('todos')) || [];

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

            const span = document.createElement('span');
            span.textContent = todo.text;
            span.classList.add('task-text');

            if (todo.status === 'Done') {
                span.classList.add('task-text-done');
            }
            

            span.addEventListener('dblclick', (event) => {
                event.stopPropagation();
                enableInlineEdit(span, index);
            });

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
                enableInlineEdit(span, index);
            });

            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '<i class="uil uil-trash-alt"></i>'; 
            removeBtn.title = 'Remove Task';
            removeBtn.addEventListener('click', (event) => {
                event.stopPropagation(); 
                removeTask(index, event);
            });

            li.appendChild(span);
            li.appendChild(statusSelect);
            li.appendChild(editBtn);
            li.appendChild(removeBtn);
            todoList.appendChild(li);
        });
    };


    const enableInlineEdit = (spanElement, index) => {
        const currentText = spanElement.textContent;
        const parent = spanElement.parentElement;
        

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
        

        parent.replaceChild(input, spanElement);
        input.focus();

        input.setSelectionRange(input.value.length, input.value.length);
    };
    

    const finishEditing = (inputElement, index) => {
        const newText = inputElement.value.trim();
        if (newText && newText !== todos[index].text) {
            todos[index].text = newText;
            saveTodos();
        }
        renderTodos();
    };

    const addTask = () => {
        const text = todoInput.value.trim();
        if (text) {
            todos.push({ text: text, status: 'Not Done' });
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