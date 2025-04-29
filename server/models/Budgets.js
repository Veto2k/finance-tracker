const Tags = require("./Tags");
const mongoose = require("mongoose");

const BudgetSchema = new mongoose.Schema({
    user_id : {
        type: mongoose.Schema.Types.ObjectId,
        ref : "User",
        required: true
    },
    name : { 
        type: String , 
        ref: "Tags",
        required:true
    },
    current:{
        type: Number,
        default: 0
    },
    limit: { 
        type: Number, 
        required: true 
    },
    startDate: { 
        type: Date, 
        default: Date.now 
    },
    endDate: {
        type: Date,
        default: function() { 
            return new Date(this.startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        }
    }

})

BudgetSchema.pre("save", function(next) {
    if (!this.endDate) {
        this.endDate = new Date(this.startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
    next();
});

const Budgets = mongoose.model("Budgets", BudgetSchema);
module.exports = Budgets