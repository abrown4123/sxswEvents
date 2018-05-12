const BaseModel = require('./BaseModel');

class SxswEventModel extends BaseModel {
  
}

SxswEventModel.primaryKey = 'event_id';
SxswEventModel.tableName = 'events';

module.exports = SxswEventModel;
