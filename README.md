# amfi-database-creator

This package can be used for creating / updating a MongoDB database with up-to-date information about Indian Mutual Funds fetched from the AMFI portal.

## Usage

```javascript
(async () => {

  const navDB = await (require("amfi-database-creator")).getInstance(Config.databaseUrl);
  const MutualFund = navDB.MutualFund;

  await navDB.updateDB();

  const fund = await MutualFund.findOne();

})();
```
