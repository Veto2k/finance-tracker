const mongoose = require("mongoose")
const Tags = require("./Tags")

const TransactionSchema = new mongoose.Schema({
    user_id : {
        type: mongoose.Schema.Types.ObjectId,
        ref : "User",
        required: true
    },
    description : { 
        type: String , 
        required: true
    },
    amount: { 
        type: Number, 
        required: true 
    },
    tagId: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Tags", 
        required: true 
    }],
    date: { 
        type: Date, 
        default: Date.now 
    },
    type: {
        type: String
    }
})

const Transactions = mongoose.model("Transactions", TransactionSchema);
module.exports = Transactions