const db = require("../config/db");

const getItems = (req,res) => {
    const query = "SELECT * FROM items WHERE is_active = TRUE";

    db.query(query, (err, results) => {
        if(err){
            console.error("Error fetching items : " , err.message);
            return res.status(500).json({message:"Server error"});
        }
        res.status(200).json(results);
    });
};

module.exports = {getItems};