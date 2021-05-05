const http = require('http')
const sqlite = require('sqlite3')
const fs = require('fs');

const dbExists = fs.existsSync(__dirname + '/app.db')

const db = new sqlite.Database(__dirname + '/app.db')

const dbExec = async (sql, params) => new Promise((resolve, reject) => {
    db.run(sql, params, err => {
        if (err) {
            reject(err);
        }

        resolve()
    })
})

const dbGet = async (sql, params) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
        if (err) {
            reject(err);
        }

        resolve(row)
    })
})

if (!dbExists) {
    dbExec(`CREATE TABLE logs
            (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id    TEXT,
                message    TEXT,
                created_at TEXT
            )`)
    dbExec(`CREATE TABLE users
            (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name  TEXT,
                second_name TEXT
            )`)
}

http.get('http://www.dsdev.tech/logs/20210123', r => {
    let data = '';
    r.on('data', rData => {
        data += rData;
    }).on('end', async () => {
        const jsonData = JSON.parse(data);
        const logs = jsonData.logs.sort((a, b) => a.created_at >= b.created_at ? 1 : -1)
        for(const i in logs) {
            if(!logs.hasOwnProperty(i)) {
                continue;
            }
            let log = logs[i];
            if ((await dbGet('SELECT * FROM users WHERE id=?', [log.user_id])) === undefined) {
                await dbExec(
                    'INSERT INTO users (id, first_name, second_name) VALUES (?, ?, ?)',
                    [log.user_id, log.first_name, log.second_name]
                )
            }
            await dbExec(
                'INSERT INTO logs (user_id, message, created_at) VALUES (?, ?, ?)',
                [log.user_id, log.message, log.created_at]
            )
        }
    })
})