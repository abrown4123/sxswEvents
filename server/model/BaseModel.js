const dbConnection = require('../dbConnection.js');

/** defines BaseModel class */
class BaseModel {
  /**
   * @name constructor
   * @description base class for all models
   */
  constructor() {
  }

  /**
   * @name createModel
   * @description creates a new model object
   * @param {Object} parameters - object containing the values for the model
   * @return {Promise}
   */
  static createModel(parameters) {
    parameters = parameters || {};
    return this.getColumns()
      .then(columns => {
        const model = new this();
        columns.forEach(col => {
          if (col === this.primaryKey) return;
          model[col] = parameters[col];
        });
        return model;
      });
  }

  /**
   * @name getColumns
   * @description gets the columns for the given model
   * @return {Promise}
   */
  static getColumns() {
    const query = `
      SELECT
        *
      FROM
        ${this.tableName}
      LIMIT 1
    `;

    if (!this.columns) {
      return this.query(query, [])
        .then(result => {
          this.columns = result.fields.map(f => f.name);
          return this.columns;
        });
    }

    return Promise.resolve(this.columns);
  }

  /**
   * @name query
   * @description intermediate function for db querying
   * @param {String} query - sql query to execute
   * @param {Array} params - parameters for query injection
   * @return {Promise}
   */
  static query(query, params) {
    console.log(query);
    return this.connection
      .then(connection => {
        return this._getQuery(connection, query, params);
      });
  }

  /**
   * @name _getQuery
   * @description executes query on database
   * @param {Object} connection - connection to db
   * @param {String} query - sql query to execute
   * @param {Array} params - parameters for query injection
   * @return {Promise}
   */
  static _getQuery(connection, query, params) {
    if (global.logQueries) console.log(query);
    return (new Promise((resolve, reject) => {
      connection.query(query, params || [], (err, res) => {
        if (err) return reject(err);
        return resolve(res);
      });
    }));
  }

  /**
   * @name save
   * @description persists a model to the database
   * @return {Promise}
   */
  save() {
    // if primary key is populated then object is persisted
    // make save and update different methods to avoid confusion?
    const thisClass = this.constructor;

    return thisClass.getColumns()
      .then(columns => {
        const colsWithValues = columns.filter(col => this[col] !== undefined);
        const columnNames = colsWithValues.join(', ');
        const params = colsWithValues.map(column => this[column]);
        const valueString =
          colsWithValues.map((c, idx) => `$${idx + 1}`).join(', ');

        const query = `
          INSERT INTO ${thisClass.tableName} (${columnNames})
          VALUES (${valueString})
          RETURNING *;
        `;

        return thisClass.query(query, params);
      })
      .then(queryResult => thisClass.queryToModel(queryResult));
  }

  /**
   * @name update
   * @description updates a given record
   * @param {Object} id - object containing the primary key name and
   *  value of row to update
   * @return {Promise}
   */
  update() {
    const thisClass = this.constructor;

    return thisClass.getColumns()
      .then(columns => {
        // TODO: sanitize parameters
        const valueString =
          columns.map((column, idx) => `${column} = $${idx + 2}`).join(',');
        const values = columns.map(col => this[col]);
        values.unshift(this[thisClass.primaryKey]);

        const query = `
          UPDATE
            ${thisClass.tableName}
          SET
            ${valueString}
          WHERE
            ${thisClass.primaryKey} = $1
          RETURNING
            *
        `;

        return thisClass.query(query, values)
          .then(queryResult => thisClass.queryToModel(queryResult));
      });
  }

  /**
   * @name destroy
   * @description deletes record associated with this model
   * @return {Promise}
   */
  destroy() {
    const thisClass = this.constructor;
    const primaryKey = thisClass.primaryKey;

    const query = `
      DELETE FROM
        ${thisClass.tableName}
      WHERE
        ${primaryKey} = $1
      RETURNING
        *
    `;

    return thisClass.query(query, [ this[primaryKey] ])
      .then(queryResult => thisClass.queryToModel(queryResult));
  }

  /**
   * @name find
   * @description finds object matching given primary key
   * @param {Object} queryOptions
   * @return {Promise}
   */
  static find(queryOptions) {
    const query = `
      SELECT
        *
      FROM
        ${this.tableName}
      WHERE
        ${this.primaryKey} = '${queryOptions[this.primaryKey]}'
    `;

    return this.query(query, [])
      .then(queryResult => this.queryToModel(queryResult));
  }

  /**
   * @name searchQuery
   * @description finds object matching given query options
   * @param {String} queryOptions
   * @return {Promise}
   */
  static searchQuery(queryOptions) {
    // NOTE: use this for query method
    const whereClause = Object.keys(queryOptions).map(key => {
      return `${key} = '${queryOptions[key]}'`;
    }).join(' AND ');

    const query = `
      SELECT
        *
      FROM
        ${this.tableName}
      WHERE
        ${whereClause}
    `;

    return this.query(query, [])
      .then(queryResult => this.queryToModel(queryResult));
  }

  /**
   * @name get
   * @description gets objects from table
   * @param {String} limit - max number of results to return
   * @return {Promise}
   */
  static get(limit) {
    const resultLimit = limit || 10;

    const query = `
      SELECT
        *
      FROM
        ${this.tableName}
      LIMIT
        ${resultLimit}
    `;

    return this.query(query, [])
      .then(queryResult => this.queryToModel(queryResult));
  }

  /**
   * @name queryToModel
   * @description converts query results to model objects
   * @param {Object} queryResult
   * @return {Promise}
   */
  static queryToModel(queryResult) {
    const rows = queryResult.rows;
    return rows.map(row => {
      const model = new this();
      Object.keys(row).forEach(key => model[key] = row[key]);
      return model;
    });
  }
}

BaseModel.connection = dbConnection;

module.exports = BaseModel;
