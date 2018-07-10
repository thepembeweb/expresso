const express = require('express');
const employeesRouter = express.Router();

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || './database.sqlite'
);

const timesheetsRouter = require('./timesheets.js');

employeesRouter.param('employeeId', (req, res, next, employeeId) => {
  const sql = 'SELECT * FROM Employee WHERE Employee.id = $employeeId';
  const values = { $employeeId: employeeId };
  db.get(sql, values, (error, employee) => {
    if (error) {
      next(error);
    } else if (employee) {
      req.employee = employee;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

employeesRouter.get('/', (req, res, next) => {
  db.all(
    'SELECT * FROM Employee WHERE Employee.is_current_employee = 1',
    (err, employees) => {
      if (err) {
        next(err);
      } else {
        res.status(200).json({ employees: employees });
      }
    }
  );
});

employeesRouter.get('/:employeeId', (req, res, next) => {
  res.status(200).json({ employee: req.employee });
});

employeesRouter.post('/', (req, res, next) => {
  const name = req.body.employee.name,
    position = req.body.employee.position,
    wage = req.body.employee.wage,
    isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;
  if (!name || !position || !wage) {
    return res.sendStatus(400);
  }

  const sql =
    'INSERT INTO Employee (name, position, wage, is_current_employee)' +
    'VALUES ($name, $position, $wage, $isCurrentEmployee)';
  const values = {
    $name: name,
    $position: position,
    $wage: wage,
    $isCurrentEmployee: isCurrentEmployee
  };

  db.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      db.get(
        `SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`,
        (error, employee) => {
          res.status(201).json({ employee: employee });
        }
      );
    }
  });
});

employeesRouter.put('/:employeeId', (req, res, next) => {
  const name = req.body.employee.name,
    position = req.body.employee.position,
    wage = req.body.employee.wage,
    isCurrentEmployee = req.body.employee.isCurrentEmployee === 0 ? 0 : 1;
  if (!name || !position || !wage) {
    return res.sendStatus(400);
  }

  const sql =
    'UPDATE Employee SET name = $name, position = $position, ' +
    'wage = $wage, is_current_employee = $isCurrentEmployee ' +
    'WHERE Employee.id = $employeeId';
  const values = {
    $name: name,
    $position: position,
    $wage: wage,
    $isCurrentEmployee: isCurrentEmployee,
    $employeeId: req.params.employeeId
  };

  db.run(sql, values, error => {
    if (error) {
      next(error);
    } else {
      db.get(
        `SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`,
        (error, employee) => {
          res.status(200).json({ employee: employee });
        }
      );
    }
  });
});

employeesRouter.delete('/:employeeId', (req, res, next) => {
  const sql =
    'UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = $employeeId';
  const values = { $employeeId: req.params.employeeId };

  db.run(sql, values, error => {
    if (error) {
      next(error);
    } else {
      db.get(
        `SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`,
        (error, employee) => {
          res.status(200).json({ employee: employee });
        }
      );
    }
  });
});

module.exports = employeesRouter;
