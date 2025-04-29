const express = require("express")
const mongoose = require("mongoose")
const Tags = require("../models/Tags")
const User = require("../models/User")
const Transactions = require("../models/Transactions")
const Budgets = require("../models/Budgets")
const verifyToken = require("../middleware/auth");

const router = express.Router()

router.get('/get', verifyToken, async(req, res) => {
    try {
        const id = req.user.id;
        
        let { startDate } = req.query;
        const currentDate = new Date();
        
        if (!startDate) {
            startDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), 1));
        } else {
            startDate = new Date(startDate);
        }

        const endDate = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth() + 1, 0));
        
        console.log(startDate)

        const budgets = await Budgets.find({ 
            user_id: id,
            startDate: {
                $gte: startDate,
                $lte: endDate
            }
        }).sort({ _id: -1 });

        
        console.log(budgets)
        

        // Extract all unique names from budgets
        const tagNames = budgets.map(budget => budget.name);


        // Find all matching tags in the database
        const validTags = await Tags.find({ 
            user_id: id,
            name: { $in: tagNames },
            
        });


        // Create a map of { name: _id } for quick lookup
        const tagMap = new Map(validTags.map(tag => [tag.name, tag._id]));



        // Replace name with id in the tags array
        const tags = budgets.map(budget => ({
            _id: budget._id,
            id: tagMap.get(budget.name) || null,
            name: budget.name,
            current: budget.current,
            limit: budget.limit,
            startDate: budget.startDate,
            endDate: budget.endDate
        }));

        // Update current amounts based on transactions
        for(let i = 0; i < tags.length; i++) { 
            if (!tags[i].id) continue;
            
            const transactions = await Transactions.find({ 
                tagId: tags[i].id,
                user_id: id,
                date: { $gte: new Date(tags[i].startDate), $lte: new Date(tags[i].endDate) },
                type: "expenditure"
            });

            const total = transactions.reduce((sum, t) => sum + t.amount, 0);

            if (total !== tags[i].current) {
                tags[i].current = total;
                await Budgets.findByIdAndUpdate(tags[i]._id, { current: total });
            }
        }

        res.json(tags);
    } catch(err) {
        console.error("Error in budget route:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get('/tags' ,verifyToken, async(req , res) => {
    try{
        const id = req.user.id

        let { startDate = "", endDate = "" } = req.query;
        if (startDate == "" && endDate == "") 
        {
            const currentDate = new Date();
            startDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), 1));
            endDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth() + 1, 0));
        }

        const transactions = await Transactions.find({user_id : id ,
             date: { $gte: new Date(startDate), $lte: new Date(endDate)} ,
                 type: "expenditure" })
        const tags_ids = transactions.map(transaction => transaction.tagId)
        const flatArray = tags_ids.flat();
        
        const uniqueObjectIds = [
            ...new Map(flatArray.map(obj => [obj.toHexString(), obj])).values()
          ];

          console.log(uniqueObjectIds)
        
        const tags = await Tags.find({user_id : id , _id: { $in: uniqueObjectIds }})
        const tag_names = tags.map(tag => tag.name)
        console.log(tag_names)
        const budgets = await Budgets.find({user_id : id , startDate: { $gte: new Date(startDate) }, endDate: { $lte: new Date(endDate) }})
        console.log(budgets)
        const budget_names = budgets.map(budget => budget.name)
        const plausible_budgets = tag_names.filter(tag => !budget_names.includes(tag))
        res.send(plausible_budgets)
    }
    catch(err){
        console.log(err)
        res.status(404)
    }
})

router.post('/add' ,verifyToken , async(req,res) => {
    try{
    const { name , limit , startDate , endDate=''} = req.body
    const user_id = req.user.id
    
    let valid = await Tags.find({name : {$in: name}})

    if (valid == "")
    {
        return res.send({messade : "Tha name does not exist"})
    }
    
    valid = await User.find({_id : { $in: user_id }})

    if (valid == "")
    {
        return res.send({messade : "Tha user_id invalid does not exist"})
    }

    const newBudget = new Budgets({
        user_id,
        name,
        limit,
        startDate,
        endDate
    })

    const savedBudget = await newBudget.save()

    console.log(savedBudget)

    res.status(200).send({message : "Budget added successfully"})

    }
    catch(err){
        console.log(err)
        res.status(404)
    }

})

router.put('/edit/:id' ,verifyToken , async(req,res) => {
    try{
        const {id} = req.params
        const {limit , startDate , endDate} = req.body
        const user_id = req.user.id

        const updatedBudget = await Budgets.findByIdAndUpdate(id , {limit , startDate , endDate})

        res.status(200).send({message : "Budget updated successfully"})
        console.log(updatedBudget)
    }
    catch(err){
        console.log(err)
        res.status(404)
    }
})  

router.delete('/delete/:id' ,verifyToken , async(req,res) => {
    try{
        const {id} = req.params
        const user_id = req.user.id

        const deletedBudget = await Budgets.findByIdAndDelete(id)

        res.status(200).send({message : "Budget deleted successfully"})
        console.log(deletedBudget)
    }
    catch(err){
        console.log(err)
        res.status(404)
    }
})                                                                                              




module.exports = router;