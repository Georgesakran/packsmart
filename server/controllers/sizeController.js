const db = require("../config/db");

const getSizeMultipliers = (req,res) => {
    const query = "SELECT * FROM size_multipliers";

    db.query(query, (err, results) => {
        if(err){
            console.error("Error fetching size multipliers : " , err.message);
            return res.status(500).json({message:"Server error"});
        }
        res.status(200).json(results);
    });
};

module.exports ={getSizeMultipliers}