const DBInterface = require('../DatabaseInterface');
const logger = require('../utils/logger.js');

class BaseModel {
  /**
   * @name getColumns
   * @description gets the columns for the given model
   * @return {Promise}
   */
  static getColumns() {
    if (this.columns) Promise.resolve(this.columns);

    const query = `
      SELECT
        *
      FROM
        ${this.tableName}
      LIMIT 1
    `;

    return this.query(query, [])
      .then(result => {
        this.columns = result.fields.map(f => f.name);
        return this.columns;
      });
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
        return this.createRelationshipModels(model, parameters);
      });
  }

  /**
   * @name createRelationshipModels
   * @description generates models for has type relationships on this model
   * @param {Object} model - parent model
   * @param {Array} parameters - data to create models with
   * @return {Promise}
   */
  static createRelationshipModels(model, parameters) {
    if (!this.relationships) return model;

    logger.warning('Only has_* type relationship models will be generated through parent model.');
    const promiseArray = this.relationships
      .filter(rel => rel.hasMany || rel.hasOne)
      .map(rel => {
        const data = parameters[rel.as] || [];
        const relModels = data.map(datum => {
          return rel.model.createModel(datum)
        });
        return Promise.all(relModels)
          .then(result => ({ model: result, as: rel.as }));
      });

    return Promise.all(promiseArray)
      .then(rels => {
        logger.info(rels)
        rels.forEach( rel => model[rel.as] = rel.model );
        return model;
      });
  }

  /**
   * @name save
   * @description persist model and it's dependents to the database
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
      .then(result => _queryToModel(result, thisClass))
      .then(result => result[0])
      .then(model => {
        const relationships = thisClass.relationships || [];
        const saveRelationships = relationships
          .filter(rel => rel.hasMany || rel.hasOne)
          .map(rel => {
            const models = this[rel.as] || [];
            // NOTE: assigns foreign key to children
            models.forEach(m => m[thisClass.primaryKey] = model[thisClass.primaryKey]);
            return rel.model.save(models)
              .then(models => ({ key: rel.as, models: models }));
          })

        return Promise.all(saveRelationships)
          .then(results => {
            results.forEach(result => {
              model[result.key] = result.models;
            });
            return model;
          });
      })
  }

  /**
   * @name save
   * @description persist model and it's dependents to the database
   * @param {Array} - array of models to be saved
   * @return {Promise}
   */
  static save(models) {
    return this.getColumns()
      .then(columns => {
        // TODO: cache columns without primary key to prevent needing to filter?
        const insert = `INSERT INTO ${this.tableName} (${columns.filter(c => c !== this.primaryKey)})`;
        const params = [];
        let paramCount = 1;

        const valuesArray = models.map(model => {
          const values = [];
          columns.forEach(col => {
            if (col === this.primaryKey) return;
            values.push(`$${paramCount}`);
            paramCount++;
            params.push(model[col] || null);
          });
          return '(' + values.join(',') + ')';
        });

        const query = `
          ${insert}
          VALUES ${valuesArray.join(',\n')}
          RETURNING *;
        `;

        return this.query(query, params);
      })
      .then(result => _queryToModel(result, this))
  }

  /**
   * @name find
   * @description finds object matching given primary key
   * @param {Object} queryOptions
   * @return {Promise}
   */
  static find(queryOptions) {
    // TODO: combine find and search. if queryOptions is string or number, use
    //  as PK. if it is an object, create where clause to search
    const query = `
      SELECT
        *
      FROM
        ${this.tableName}
      WHERE
        ${this.primaryKey} = '${queryOptions[this.primaryKey]}'
    `;

    return this.query(query, [])
      .then(queryResult => _queryToModel(queryResult, this));
  }

  /**
   * @name deepFind
   * @description
   * @param
   * @return
   */
  static deepFind(options) {
    const query = `
      SELECT
        row_to_json(t)
      FROM (
        SELECT
          *
          ${this.genRelationshipSelect()}
        FROM
          ${this.tableName}
        WHERE
          ${this.primaryKey} = $1
        ) t
    `;

    return this.query(query, [ options[this.primaryKey] ])
      .then(result => {
        if (result.rows.length < 1) return null;
        return result.rows[0].row_to_json;
      })
      .catch(logger.error);
  }

  /**
   * @name genRelationshipSelect
   * @description generates nested select for sql query
   * @return {String}
   */
  static genRelationshipSelect() {
    if (!this.relationships) return '';
    return this.relationships.map(rel => {
      const on = rel.on ||
        `${this.tableName}.${this.primaryKey} = ` +
        `${rel.model.tableName}.${this.primaryKey}\n`;

      return `
      , (
        SELECT
          array_to_json(array_agg(row_to_json(x)))
        FROM (
          SELECT
            *
            ${rel.model.genRelationshipSelect()}
          FROM
            ${rel.model.tableName}
          WHERE
            ${on}
        ) AS x
      ) AS ${rel.as}
      `;
    }).join('\n');
  }

  // TODO: combine with find and deep find
  // TODO: rename this to just search?
  /**
   * @name searchQuery
   * @description finds object matching given query options
   * @param {String} queryOptions
   * @return {Promise}
   */
  static searchQuery(queryOptions) {
    return this.getColumns()
      .then(columns => {
        const whereClause = columns
          .filter(col => queryOptions[col] !== undefined)
          .map((column, idx) => `${column} = $${idx + 1}`).join(',');

        const values = columns
          .filter(col => queryOptions[col] !== undefined)
          .map(col => queryOptions[col]);

        const query = `
          SELECT
            *
          FROM
            ${this.tableName}
          WHERE
            ${whereClause}
        `;

        return this.query(query, values)
          .then(queryResult => _queryToModel(queryResult, this));
      });
  }

  // TODO: improve save to be able to update or create with save method
  /**
   * @name update
   * @description updates a given record
   * @param {Object} id - object containing the primary key name and
   *  value of row to update
   * @return {Promise}
   */
  static update(id, params) {
    return this.getColumns()
      .then(columns => {
        // TODO: sanitize parameters
        const valueString = columns
            .filter(col => params[col] !== undefined)
            .map((column, idx) => `${column} = $${idx + 2}`).join(',');
        const values = columns
            .filter(col => params[col] !== undefined)
            .map(col => params[col]);
        values.unshift(id);

        const query = `
          UPDATE
            ${this.tableName}
          SET
            ${valueString}
          WHERE
            ${this.primaryKey} = $1
          RETURNING
            *
        `;

        return this.query(query, values)
          .then(queryResult => _queryToModel(queryResult, this));
      });
  }



  /**
   * @name addRelationship
   * @description adds a new relational relatationship to this model
   * @param {Object} options - object with relationship info
   */
  static addRelationship(options) {
    if (!this.relationships) this.relationships = [];
    if (!options.as) options.as = options.model.tableName;

    this.relationships.push(options);
  }

  /**
   * @name query
   * @description intermediate function for db querying, unwraps connection promise
   * @param {String} query - sql query to execute
   * @param {Array} params - parameters for query injection
   * @return {Promise}
   */
  static query(query, params) {
    return this.connection
      .then(connection => {
        return _getQuery(connection, query, params);
      });
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
      .then(queryResult => _queryToModel(queryResult, this));
  }

  /**
   * @name closeConnection
   * @description closes the connection to the server. used for testing and debugging
   */
  static closeConnection() {
    logger.warning('DB CONNECTION IS SHARED BY ALL MODELS, ONLY CALL THIS ON PROGRAM EXIT');
    this.connection.then(conn => conn.end())
  }
}


// NOTE: PRIVATE METHODS

/**
 * @name _getQuery
 * @description executes query on database
 * @param {Object} connection - connection to db
 * @param {String} query - sql query to execute
 * @param {Array} params - parameters for query injection
 * @return {Promise}
 */
function _getQuery(connection, query, params) {
  logger.debug(query, params);
  return (new Promise((resolve, reject) => {
    connection.query(query, params || [], (err, res) => {
      if (err) return reject(err);
      return resolve(res);
    });
  }));
}

/**
 * @name queryToModel
 * @description converts query results to model objects
 * @param {Object} queryResult
 * @param {Function} modelClass
 * @return {Promise}
 */
function _queryToModel(queryResult, modelClass) {
  const rows = queryResult.rows;
  return rows.map(row => {
    const model = new modelClass();
    Object.keys(row).forEach(key => model[key] = row[key]);
    return model;
  });
}


// NOTE: static attributes

BaseModel.connection = DBInterface.getConnection();

module.exports = BaseModel;
