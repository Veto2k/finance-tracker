const mongoose = require("mongoose")
const User = require("./User")

const TagSchema = new mongoose.Schema({
    user_id : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    name : {
        type: String,
        required: true
    }
})

TagSchema.index({ user_id: 1, name: 1 }, { unique: true });

const Tags = mongoose.model("Tags", TagSchema);
module.exports = Tags