const express = require('express');
const catalystSDK = require('zcatalyst-sdk-node');

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  const catalyst = catalystSDK.initialize(req);
  res.locals.catalyst = catalyst;
  next();
});

//GET API. Get existing tasks if any from the server.
app.get('/all', async (req, res) => {
  try {
    const { catalyst } = res.locals;

    const page = parseInt(req.query.page);
    const perPage = parseInt(req.query.perPage);

    const zcql = catalyst.zcql();

    const hasMore = await zcql
      .executeZCQLQuery(`SELECT COUNT(ROWID) FROM TodoItems`)
      .then((rows) => parseInt(rows[0].TodoItems.ROWID) > page * perPage);

    const todoItems = await zcql
      .executeZCQLQuery(
        `SELECT ROWID,Notes FROM TodoItems LIMIT  ${
          (page - 1) * perPage + 1
        },${perPage}`
      )
      .then((rows) =>
        rows.map((row) => ({
          id: row.TodoItems.ROWID,
          notes: row.TodoItems.Notes,
        }))
      );

    res.status(200).send({
      status: 'success',
      data: {
        todoItems,
        hasMore,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      status: 'failure',
      message: "We're unable to process the request.",
    });
  }
});

// POST API. Contains the logic to create a task
app.post('/add', async (req, res) => {
  try {
    const { notes } = req.body;
    const { catalyst } = res.locals;

    const table = catalyst.datastore().table('TodoItems');

    const { ROWID: id } = await table.insertRow({
      Notes: notes,
    });

    res.status(200).send({
      status: 'success',
      data: {
        todoItem: {
          id,
          notes,
        },
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      status: 'failure',
      message: "We're unable to process the request.",
    });
  }
});

// DELETE API. Contains the logic to delete a task.
app.delete('/:ROWID', async (req, res) => {
  try {
    const { ROWID } = req.params;
    const { catalyst } = res.locals;

    const table = catalyst.datastore().table('TodoItems');

    await table.deleteRow(ROWID);

    res.status(200).send({
      status: 'success',
      data: {
        todoItem: {
          id: ROWID,
        },
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      status: 'failure',
      message: "We're unable to process the request.",
    });
  }
});

module.exports = app;
