    
var todos = []

var ENTER_KEY = 13;
var ESCAPE_KEY = 27; 

var listTemplate = document.getElementById("list").innerHTML
Handlebars.registerPartial("list", listTemplate);

var util = {                     //these two functions taken from todoMVC jQuery
    uuid: function () {                  

        var i, random;
        var uuid = '';                     

        for (i = 0; i < 32; i++) {
            random = Math.random() * 16 | 0;
            if (i === 8 || i === 12 || i === 16 || i === 20) {
                uuid += '-';
            }
            uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
        }

        return uuid;                        
    },

    store: function (namespace, data) {       
			if (arguments.length > 1) {             
				return localStorage.setItem(namespace, JSON.stringify(data)); 
			} else {
                var store = localStorage.getItem(namespace);
                if (store) {
                    return JSON.parse(store)
                } else {
                    return []
                }          
			}
		}      

}

var App = {

    init: function(){

        todos = util.store('nested-todos');
        var mainTemplate = document.getElementById("main").innerHTML;
        this.mainTemplate = Handlebars.compile(mainTemplate);
        this.bindEvents();
        this.render();   
    },

    bindEvents: function(){

        var todoInput = document.querySelector('#todoInput')
        todoInput.addEventListener('keyup', this.addTodo.bind(this))
        var todoList = document.querySelector('#todoList')
        todoList.addEventListener('keyup', this.updateTodo.bind(this))
        todoList.addEventListener('click', this.actionHandler.bind(this))

    },

    actionHandler: function(event){
        
        if (event.target.localName == 'span') {
            if (event.target.textContent == 'Add') {
                view.createSubTodoList(event)
            } else if (event.target.textContent == 'Completed') {
                this.completedTodo(event)
            } else{
                this.deleteTodo(event)
            }
        } else {
            return;
        }    
    },

    addTodo: function(event){
        if (event.which !== ENTER_KEY) {
            return;
        }
        value = event.target.value;
        todos.push({
            id: util.uuid(),
            value: value,
            isCompleted: false,
            todos: []
        })
        event.target.value = "";
        this.render();
    },

    updateTodo: function(event){

        if (event.which === ESCAPE_KEY) {
            this.render();
        } else if(event.which === ENTER_KEY) {
            if (event.target.value === "") {
                this.render();
            }
            var isNewTodoClassAdded = event.target.closest('li').classList.contains('newtodo')
            if (isNewTodoClassAdded) {
                this.addSubTodo(event)
            } else {
                this.editTodo(event)
            }
        }else{
            return;
        }
    },

    addSubTodo: function(event){

        var masterTodoId = event.target.closest('li').id;
        var value = event.target.value;              
        var todosMaster = this.getElementFromId(todos, masterTodoId)
        subTodoId = util.uuid();
        todosMaster.element.todos.push({
            id: subTodoId,
            value: value,
            completed: false,
            todos: []
            });	
        event.target.closest('li').classList.remove('newtodo')
        event.target.closest('li').id = subTodoId;
        if (todosMaster.parent.completed) {
            todosMaster.parent.completed = false;
        }
        this.render();
    },

    editTodo: function(event){

        var masterTodoId = event.target.closest('li').getAttribute('id');
        var editedValue = event.target.value;
        var todosMaster = this.getElementFromId(todos, masterTodoId);
        todosMaster.element.value = editedValue
        this.render()
    },

    deleteTodo: function(event){
        debugger;
        var closetLi = event.target.closest('li');
        var idToDelete = closetLi.id;
        var masterTodos = this.getElementFromId(todos, idToDelete);
        if (masterTodos.isParentFound) {
            masterTodos.parent.todos.splice(masterTodos.index, 1)
        }else{
            todos.splice(masterTodos.index, 1)
        }
        this.render()
    },

    completedTodo: function(){

        var id = event.target.closest('li').id;
        var todo = this.getElementFromId(todos, id)
        var listElement = todo.element;
        if (listElement.completed) {
            listElement.completed = false;
        }
        else{
            listElement.completed = true;
            subTodos = this.getSubTodos(listElement.todos)
            subTodos.forEach(function(subTodo){
                if (!subTodo.completed) {
                    subTodo.completed = true;
                }
            });
        }

        this.render();
    },

    getElementFromId: function(todos, id){

        for(var i = 0; i< todos.length; i++){ 
            var result = this.getElementFromId(todos[i].todos, id)
            if(todos[i].id.toString() === id){
                return {
                    element: todos[i],
                    index: i,
                    isParentFound: false
                }
            }
            if (result) {
                if(!result.isParentFound){
                    result.parent = todos[i];
                    result.isParentFound = true;
                }
                return result;
            }  
        }
    },

    getSubTodos: function(arr){
        if (!arr) {
           return [];
        }
        return arr.reduce(function(r, i){
            return r.concat([i]).concat(App.getSubTodos(i.todos));
        }, []);
    },


    render: function(){

        var todoList = document.getElementById("todoList");
        todoList.innerHTML = this.mainTemplate({todos: todos})
        util.store('nested-todos', todos);
    }
}

var view = {

    createSubTodoList: function(event){
        
        var elementClicked = event.target;
        var closetLi= elementClicked.closest("li")
        var masterListId = closetLi.getAttribute('id');
        if(closetLi.children[2]){
            closetLi = closetLi.children[2];
        }else{
            var newList  = document.createElement("ul");
            closetLi.appendChild(newList)
            closetLi = closetLi.children[2]; 
        }
        var id = masterListId;
        var subTodoList = document.createElement("li");
        subTodoList.id = id;
        subTodoList.classList.add("newtodo")
        var subTodoInput = document.createElement("input");
        subTodoInput.type = "text";                  
        subTodoList.appendChild(subTodoInput);                        
        closetLi.appendChild(subTodoList);
    }
}

App.init();