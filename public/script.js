"use strict";

const $ = document.querySelector.bind(document);

// login link action
$("#loginLink").addEventListener("click", openLoginScreen);

//register link action
$("#registerLink").addEventListener("click", openRegisterScreen);

// logout link action
$("#logoutLink").addEventListener("click", openLoginScreen);

//todo button action
$("#todoButton").addEventListener("click", addClickableDiv);
//delete token upon logout
$("#logoutLink").addEventListener("click", ()=>{
  fetch('/auth/' + $('#username').innerText + '/' + authToken, {
    method: "DELETE"
  })
  .then((r) => r.json())
  .then(doc => {
    
    if (doc.error) {
      showError(doc.error);
    } else {
      openLoginScreen();
    }
  })
  .catch((err) => showError("ERROR: " + err));

});

// Sign In button action
$("#loginBtn").addEventListener("click", () => {
  // check to make sure username/password aren't blank
  if (!$("#loginUsername").value || !$("#loginPassword").value) return;
  var data = {
    username: $("#loginUsername").value,
    password: $("#loginPassword").value,
  };
  fetch("/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then((r) => r.json())
    .then((doc) => {
      if (doc.error) {
        showError(doc.error);
      } else {
        openHomeScreen(doc);
      }
    })
    .catch((error) => console.error({ error }));
});

// Register button action
$("#registerBtn").addEventListener("click", () => {
  // check to make sure no fields aren't blank
  if (
    !$("#registerUsername").value ||
    !$("#registerPassword").value ||
    !$("#registerName").value ||
    !$("#registerEmail").value
  ) {
    showError("All fields are required.");
    return;
  }
  // grab all user info from input fields, and POST it to /users
  var data = {
    username: $("#registerUsername").value,
    password: $("#registerPassword").value,
    name: $("#registerName").value,
    email: $("#registerEmail").value,
  };
  fetch("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then((r) => r.json())
    .then((doc) => {
      if (doc.error) {
        showError(doc.error);
      } else {
        alert("Succesfully Registered!");
        openHomeScreen(doc);
      }
    })
});

//add user input to todo list
function addClickableDiv(doc = {}) {
  var d = document.createElement("div");
  $("#todolist").appendChild(d);
  d.innerHTML = doc.todo || $("#todoContent").value;

  d.addEventListener("click", function () {
    d.classList.add("completed");
    fetch("/todo/" + username + "/" + authToken + "/" + d.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    })
      .then((r) => r.json())
      .then((doc) => {
        if (doc.completed) {
          this.classList.add("completed");
        }
      });
  });

  d.addEventListener("dblclick", function () {
    d.classList.remove("completed");

    fetch("/todo/" + username + "/" + authToken + "/" + d.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: false }),
    })
      .then((r) => r.json())
      .then((doc) => {
        if (!doc.completed) {
          this.classList.remove("completed");
        }
      });
  });

  if (doc.todo) {
    d.id = doc._id;
    if (doc.completed) {
      d.classList.add("completed");
    }
  } else {
    fetch("/todo/" + username + "/" + authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        todo: $("#todoContent").value,
        username,
        completed: false,
      }),
    })
      .then((r) => r.json())
      .then((doc) => {
        if (doc.error) {
          showError(doc.error);
        } else {
          d.id = doc.id;
        }
      })
      .catch((error) => console.error({ error }));
    $("#todoContent").value = "";
  }
}

function showError(err) {
  // show error in dedicated error div
  $("#error").innerText = err;
}

function resetInputs() {
  // clear all input values
  var inputs = document.getElementsByTagName("input");
  for (var input of inputs) {
    input.value = "";
  }
}

var authToken, username;
function openHomeScreen(doc) {
  if (doc.todos) {
    doc.todos.forEach(addClickableDiv);
  }
  username = doc.username;
  authToken = doc.token;
  // hide other screens, clear inputs, clear error
  $("#loginScreen").classList.add("hidden");
  $("#registerScreen").classList.add("hidden");
  resetInputs();
  showError("");
  // reveal home screen
  $("#homeScreen").classList.remove("hidden");
  // display name, username
  $("#name").innerText = doc.name;
  $("#username").innerText = doc.username;
  // display updatable user info in input fields
  $("#updateName").value = doc.name;
  $("#updateEmail").value = doc.email;
  // clear prior userlist
  $("#userlist").innerHTML = "";
}

function openLoginScreen() {
  // hide other screens, clear inputs, clear error
  $("#registerScreen").classList.add("hidden");
  $("#homeScreen").classList.add("hidden");
  $("#todolist").innerHTML = "";
  resetInputs();
  showError("");
  // reveal login screen
  $("#loginScreen").classList.remove("hidden");
}

function openRegisterScreen() {
  // hide other screens, clear inputs, clear error
  $("#loginScreen").classList.add("hidden");
  $("#homeScreen").classList.add("hidden");
  resetInputs();
  showError("");
  // reveal register screen
  $("#registerScreen").classList.remove("hidden");
}
