const db = require('../config/db.config');

exports.getappuser = async (req, res) => {
    try {
        const query = 'SELECT * FROM app_user_reg';
        db.query(query, (err, results) => {
            if (err) {
                return res.status(500).json({ error: err });
            }
            res.status(200).json(results);
        });
    } catch (error) {
        console.log(error)
    }
}

