const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const user = users.find((user) => user.username === username);

  if(!user) {
    return response.status(404).json({error: 'User not found.'});
  }

  request.user = user;
  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const userAlreadyExists = users.some((user) => user.username === username);
  if(userAlreadyExists) {
    return response.status(400).json({error: 'User already exists.'});
  }

  users.push({
    id: uuidv4(),
    name,
    username,
    todos: []
  });

  const addedUser = users.at(users.length - 1);
  return response.status(201).json(addedUser);
});

app.get('/users', (request, response) => {
  return response.json(users);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  }

  user.todos.push(newTodo);

  return response.status(201).json(newTodo);
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { id } = request.params;
  const { user } = request;

  const taskToUpdate = user.todos.find((todo) => todo.id === id);
  if(!taskToUpdate) {
    return response.status(404).json({error: 'Task not found.'});
  }
  taskToUpdate.title = title;
  taskToUpdate.deadline = new Date(deadline);

  return response.json(taskToUpdate);
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { user } = request;

  const taskDone = user.todos.find((todo) => todo.id === id);
  if(!taskDone) {
    return response.status(404).json({error: 'Task not found.'});
  }

  taskDone.done = true;
  return response.json(taskDone);
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { user } = request;

  const todoToDelete = user.todos.find((todo) => todo.id === id);

  if(!todoToDelete) {
    return response.status(404).json({error: 'Task not found.'});
  }

  user.todos.splice(todoToDelete, 1);
  return response.status(204).send();
});

module.exports = app;