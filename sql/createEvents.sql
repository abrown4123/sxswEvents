DROP TABLE IF EXISTS events;

CREATE TABLE events (
  event_id BIGSERIAL PRIMARY KEY,
  event_link VARCHAR NOT NULL UNIQUE,
  event_name VARCHAR NOT NULL,
  event_time_string VARCHAR,
  event_time TIMESTAMP,
  venue_link VARCHAR,
  venue_name VARCHAR,
  venue_address VARCHAR,
  primary_entry VARCHAR,
  event_description TEXT
);

CREATE UNIQUE INDEX event_id_index ON events (event_id);
