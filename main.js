const nav = require('india-mutual-fund-info');
const mongoose = require('mongoose');

const MetaModel = mongoose.model('Meta', new mongoose.Schema({ lastUpdated: Date }));
const MutualFundSchema = new mongoose.Schema({
    'Scheme Code': { type: String, index: true, unique: true },
    'ISIN Div Payout/ISIN Growth': String,
    'ISIN Div Reinvestment': String,
    'Scheme Name': String,
    'AMC Name': String,
    'Scheme Type': String,
    'NAVs': [{
        '_id': String,
        'NAV': String
    }]
},{strict:'false'});
const MutualFundModel = mongoose.model('MutualFund', MutualFundSchema);


class DbCreator {

    constructor(dbUrl) {
        this.dbUrl = dbUrl;
        this.ms1Day = 24 * 60 * 60 * 1000;
    }

    dateEquals = (d1, d2) => { return d1.getDate() == d2.getDate() && d1.getMonth() == d2.getMonth() && d1.getFullYear() == d2.getFullYear() };
    dateStr = date => `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;

    async createMeta() {
        var meta = await MetaModel.create({
            lastUpdated: '2006-03-31T00:00:00.000Z'
        });
        return (meta);
    }

    async getLastUpdated() {
        const metas = await MetaModel.find();
        var meta = metas[0];
        if (meta === undefined)
            meta = await this.createMeta();
        return new Date(meta.lastUpdated);
    }

    async update90() {
        const lastUpdated = await this.getLastUpdated();
        const now = new Date(Date.now());
        const from = new Date(lastUpdated.getTime() + this.ms1Day);
        const to = (now.getTime() - from.getTime() > 90 * this.ms1Day) ? new Date(from.getTime() + 90 * this.ms1Day) : now;

        const data = await nav.history(from, to);

        var uniques = {};
        for (let item of data) {
            if (!(item['Scheme Code'] in uniques)) {
                uniques[item['Scheme Code']] = item;
                uniques[item['Scheme Code']]['NAVs'] = [];
            }
            uniques[item['Scheme Code']]['NAVs'].push({ '_id': item['Date'], 'NAV': item['Net Asset Value'] });
        }
        uniques = Object.values(uniques);
        var count = 0;

        for (let item of uniques) {
            const { NAVs, ...info } = item;
            await MutualFundModel.updateOne({ 'Scheme Code': item['Scheme Code'] }, {
                ...info,
                $addToSet: {
                    'NAVs': { $each: NAVs }
                }
            }, { upsert: true });
            count += 1;
        }
        const date = to.getDate();
        const month = to.getMonth() + 1;
        const year = to.getFullYear();
        await MetaModel.updateOne({}, {
            lastUpdated: `${year}-${month < 10 ? `0${month}` : month}-${date < 10 ? `0${date}` : date}T00:00:00.000Z`
        });
        console.log(`Updated period ${this.dateStr(from)} - ${this.dateStr(to)}. ${count} documents updated in transaction.`);
    }

    async updateDB() {
        this.conn = await mongoose.connect(this.dbUrl);
        var lastUpdated = await this.getLastUpdated();
        console.log(`DB last updated on ${this.dateStr(lastUpdated)}`);
        var now = new Date(Date.now());
        while (!this.dateEquals(lastUpdated, now)) {
            await this.update90();
            lastUpdated = await this.getLastUpdated();
        }
        this.conn.disconnect();
    }
}


const db = new DbCreator('mongodb://localhost:27017/portfolio-manager-2');
db.updateDB();