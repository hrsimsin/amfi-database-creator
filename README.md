# amfi-database-creator
This package can be used for creating / updating a MongoDB database with up-to-date information about Indian Mutual Funds fetched from the AMFI portal. 

## Usage
```javascript
const DbCreator = require('amfi-database-creator');

const dbUrl = 'mongodb://localhost:27017/amfi-db';

const dbCreator = new DbCreator(dbUrl);

dbCreator.updateDB();
```
