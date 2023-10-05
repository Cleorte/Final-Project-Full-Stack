// load express and nedb-promises modules
const express = require("express");
const nedb = require("nedb-promises");
const bcrypt = require("bcrypt"); // load bcrypt module

// create app and initialize database
const app = express();
const db = nedb.create("userInfo.jsonl");
const db2 = nedb.create("todos.jsonl");

// serve static files
app.use(express.static("public"));

//decode and encode json response
app.use(express.json());

app.get("/users", (req, res) => {
  // GET all data
  db.find({})
    .then((docs) => res.send(docs))
    .catch((error) => res.send({ error }));
});

app.post("/auth", (req, res) => {
  console.log(req.body);
  db.findOne({ username: req.body.username })
    .then((userDoc) => {
      if (userDoc) {
        // TODO check entered password matches hashed password
        if (bcrypt.compareSync(req.body.password, userDoc.password)) {
          userDoc.token = "" + Math.random() + Math.random();
          db.updateOne(
            { username: req.body.username },
            { $set: { token: userDoc.token } }
          ).then((r) => {
            delete userDoc.password;
            //seinding todos with the docs
            db2.find({ username: userDoc.username }).then((todoDocs) => {
              userDoc.todos = todoDocs;
              res.send(userDoc);
            });
          });
        } else {
          res.send({ error: "Login Failed." });
        }
        console.log("found doc");
      } else {
        console.log("no doc found");
        res.send({ error: "Username not found." });
      }
    })
    .catch((error) => res.send({ error }));
});

app.post("/users", (req, res) => {
  if (
    !req.body.username ||
    !req.body.password ||
    !req.body.email ||
    !req.body.name
  ) {
    res.send({ error: "Missing fields." });
  } else {
    db.findOne({ username: req.body.username }).then((doc) => {
      if (doc) {
        res.send({ error: "Username already exists." });
      } else {
        req.body.password = bcrypt.hashSync(
          req.body.password,
          bcrypt.genSaltSync()
        );
        req.body.token = "" + Math.random() + Math.random();
        console.log(req.body.token);
        db.insertOne(req.body)
          .then((doc) => {
            delete doc.password;
            res.send(doc);
          })
          .catch((error) => res.send({ error }));
      }
    });
  }
});

app.patch("/users/:username/:token", (req, res) => {
  db.updateOne(
    { username: req.params.username, token: req.params.token },
    { $set: req.body }
  )
    .then((result) => {
      if (result) {
        res.send({ ok: true });
      } else {
        res.send({ error: "Something went wrong." });
      }
    })
    .catch((error) => res.send({ error }));
});

app.delete("/users/:username/:token", (req, res) => {
  db.deleteOne({ username: req.params.username, token: req.params.token })

    .then((result) => {
      if (result) {
        res.send({ ok: true });
      } else {
        res.send({ error: "Something went wrong." });
      }
    })

    .catch((error) => res.send({ error }));
});

//deleting the token after user logs out
app.delete("/auth/:username/:token", (req, res) => {
  db.updateOne(
    { token: req.params.token, username: req.params.username },
    { $set: { token: null } }
  )
    .then((result) => {
      if (result) {
        res.send({ ok: true });
      } else {
        res.send({ error: "Couldn't delete token." });
      }
    })
    .catch((error) => res.send({ error }));
});

app.post("/todo/:username/:token", (req, res) => {
  // check if user is authenticated
  db.findOne({ username: req.params.username, token: req.params.token })
    .then((userDoc) => {
      if (userDoc) {
        // user is authenticated, allow creating new todo
        db2
          .insertOne(req.body)
          .then((doc) => {
            if (doc) {
              res.send({ id: doc._id });
            } else {
              res.send({ error: "Something went wrong." });
            }
          })
          .catch((error) => res.send({ error }));
      } else {
        res.send({ error: "User not authenticated." });
      }
    })
    .catch((error) => res.send({ error }));
});

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++FINAL PROJECT

app.patch("/todo/:username/:token/:_id", (req, res) => {
  db2.update(
    { _id: req.params._id },
    { $set: { completed: req.body.completed } },
    (err) => {
      if (err) {
        res.send({ error: err.message });
      } else {
        res.send({ _id: req.params._id, completed: req.body.completed });
      }
    }
  );
});

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++FINAL PROJECT

// default route
app.all("*", (req, res) => {
  res.status(404).send({ error: "Invalid URL." });
});

// start server
app.listen(3001, () => console.log("Server started on http://localhost:3001"));
