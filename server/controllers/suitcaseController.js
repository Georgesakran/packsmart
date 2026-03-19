const db = require("../config/db");

const getSuitcases = (req,res) => {
    const query = "SELECT * FROM suitcases";

    db.query(query, (err, results) => {
        if(err){
            console.error("Error fetching suitcases : " , err.message);
            return res.status(500).json({message:"Server error"});
        }
        res.status(200).json(results);
    });
};

module.exports = {getSuitcases};