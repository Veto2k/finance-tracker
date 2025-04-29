const express = require("express")
const mongoose = require('mongoose');
const User = require("../models/User")
const Tags = require("../models/Tags")
const Transactions = require("../models/Transactions")
const verifyToken = require("../middleware/auth");

const router = express.Router();

router.get("/get" , verifyToken , async (req,res) => {
    try{
      let query = {}

     const user_id = req.user.id

      const {page = 1 , limit = 10 ,type = "" , search = "" , sortField = "" , sortOrder="asc" , searchTag=[] , startDate , endDate } = req.query

      query.user_id = user_id

      if (type && type.trim() !== "") {
        query.type = type;
      }

      if(searchTag && searchTag.length > 0)
      {
      const tagDocs = await Tags.find({ name: { $in: searchTag } });
  
        if (tagDocs.length !== searchTag.length) {
          return res.status(400).json({ error: "Some tags were not found in the database" });
        }
      const tagIds = tagDocs.map(tag => tag._id);
      query.tagId = { $all: tagIds };
      }

      if (search && search.trim() !== "") 
      {
        query.description =  { $regex: search , $options: 'i' } 
      }

      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

    let findQuery = Transactions.find(query).populate("tagId", "name")

    // Only apply sorting if sortField is provided by user
    if (sortField) {
      const sortOptions = { [sortField]: sortOrder === "asc" ? 1 : -1 };
      findQuery = findQuery.sort(sortOptions);
    }
    else{
      findQuery=findQuery.sort({_id:-1})
    }

      console.log(page)

      const skip = (page-1)*10

      console.log(query)
      const totalCount = await Transactions.countDocuments(query);
      const totalPages = Math.ceil(totalCount / limit);

      const transactions = await findQuery.skip(skip).limit(Number(limit))

      const formattedTransactions = transactions.map(transaction => ({
        _id: transaction._id,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        date: transaction.date,
        tags: transaction.tagId.map(tag => tag.name) // Extract tag names
      }));

      console.log(formattedTransactions); // Debugging output

      res.json({formattedTransactions, totalPages , totalCount});

    }
    catch(err){
      console.log(err)
    }
  })

  router.post('/add', verifyToken , async (req, res) => {
    try {
      const { description, amount, date, tags , type } = req.body; // `tags` is an array of tag IDs
  
      // Validate tag IDs
      const validTags = await Tags.find({ name: { $in: tags } });
      const tagIds = validTags.map(tag => tag._id);
  
      const newTransaction = new Transactions({
        user_id : req.user.id,
        description,
        amount,
        type,
        date: new Date(date), // ensure proper Date object
        tagId: tagIds
      });
  
      const savedTransaction = await newTransaction.save();
      res.status(201).json(savedTransaction);
    } catch (err) {
      console.error('Error saving transaction:', err);
      res.status(500).json({ error: 'Failed to add transaction' });
    }
  });

  router.put('/update/:id', verifyToken, async (req, res) => {
    try {
      const transactionId = req.params.id;
      const { description, amount, date, tags , type } = req.body; // tags = ['entertainment', 'food']
  
      if (!mongoose.Types.ObjectId.isValid(transactionId)) {
        return res.status(400).json({ error: 'Invalid transaction ID' });
      }
  
      // 1. Get existing tags from DB
      const validTags = await Tags.find({ name: { $in: tags } });

      const tagIds = validTags.map(tag => tag._id);

      // 5. Update the transaction
      const updatedTransaction = await Transactions.findByIdAndUpdate(
        transactionId,
        {
          description,
          amount,
          type,
          date: new Date(date),
          tagId: tagIds
        },
        { new: true }
      );

      if (!updatedTransaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.status(200).json(updatedTransaction);
  } catch (err) {
    console.error('Error updating transaction:', err);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

  router.put('/updateTags/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { tags } = req.body; // tags = [ "food", "travel" ]
    const user_id = req.user.id
  
    try {
      if (!Array.isArray(tags)) {
        return res.status(400).json({ error: "Tags must be an array of names" });
      }
  
      // Find all tags from Tag collection matching provided names
      const tagDocs = await Tags.find({ name: { $in: tags } , user_id: user_id });
  
      if (tagDocs.length !== tags.length) {
        return res.status(400).json({ error: "Some tags were not found in the database" });
      }
  
      const tagIds = tagDocs.map(tag => tag._id);
  
      // Update the transaction with tag _id references
      const updatedTransaction = await Transactions.findByIdAndUpdate(
        id,
        { tagId: tagIds },
        { new: true, runValidators: true }
      );
  
      if (!updatedTransaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
  
      res.json(updatedTransaction);
  
    } catch (err) {
      console.error("Error updating tags:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.delete('/delete/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
  
    try {
      const deletedTransaction = await Transactions.findByIdAndDelete(id);
  
      if (!deletedTransaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
  
      res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (err) {
      console.error('Error deleting transaction:', err);
      res.status(500).json({ message: 'Server error while deleting transaction' });
    }
  });

module.exports = router;