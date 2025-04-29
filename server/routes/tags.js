const express = require("express")
const mongoose = require('mongoose');
const User = require("../models/User")
const Tags = require("../models/Tags")
const Transactions = require("../models/Transactions")
const verifyToken = require("../middleware/auth");

const router = express.Router();

router.get("/get" ,verifyToken, async (req,res) => {
    try{
      const id = req.user.id
      const tag = await Tags.find({user_id : id})
      const tag_array = tag.map(opt => opt.name)
      console.log(tag_array)
      res.json(tag_array)
    }
    catch(err){
      console.log(err)
    }
  })

  router.post("/new" , verifyToken , async (req, res) => {
    try{
        const id = req.user.id
        const {name} = req.body
      const newTag = new Tags({user_id : id, name})
      const saveTag = await newTag.save()
      console.log(saveTag)
      res.status(200).send(saveTag)
    }
    catch(err){
      console.log(err)
    }
  })


module.exports = router;