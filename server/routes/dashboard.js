const express = require("express");
const mongoose = require("mongoose");
const Tags = require("../models/Tags");
const User = require("../models/User");
const Transactions = require("../models/Transactions");
const Budgets = require("../models/Budgets");
const verifyToken = require("../middleware/auth");

const router = express.Router();

router.get("/average_expenses", verifyToken, async (req, res) => {
    try {
        const id = req.user.id;
        const currentDate = new Date();

        const first_transaction = await Transactions.findOne().sort({date: 1});
        const FirstDate = first_transaction.date;

        const firstMonth = FirstDate.getFullYear() == currentDate.getFullYear() 
            ? new Date(Date.UTC(currentDate.getFullYear(), FirstDate.getMonth(), 1, 0, 0, 0))
            : new Date(Date.UTC(currentDate.getFullYear(), 0, 1, 0, 0, 0));

        const totalExpenses = [];
        const totalIncome = [];

        for (let month = firstMonth.getMonth(); month < currentDate.getMonth(); month++) {
            let setDate = new Date(Date.UTC(currentDate.getFullYear(), month, 1, 0, 0, 0));
            let nextMonthDate = new Date(setDate);
            nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

            let transactions = await Transactions.find({
                user_id: id,
                date: { $gte: setDate, $lte: nextMonthDate },
                type: "expenditure"
            });

            let price = transactions.map(transaction => transaction.amount);
            let monthAmount = price.reduce((sum, transaction) => sum + transaction, 0);

            let monthExpenses = {
                month: month + 1,
                amount: monthAmount
            };
            
            totalExpenses.push(monthExpenses);
        }

        for (let month = firstMonth.getMonth(); month < currentDate.getMonth(); month++) {
            let setDate = new Date(Date.UTC(currentDate.getFullYear(), month, 1, 0, 0, 0));
            let nextMonthDate = new Date(setDate);
            nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

            let transactions = await Transactions.find({
                user_id: id,
                date: { $gte: setDate, $lte: nextMonthDate },
                type: "revenue"
            });

            let price = transactions.map(transaction => transaction.amount);
            let monthAmount = price.reduce((sum, transaction) => sum + transaction, 0);

            let monthIncome = {
                month: month + 1,
                amount: monthAmount
            };
            
            totalIncome.push(monthIncome);
        }

        const avgExpenses = totalExpenses.reduce((sum, month) => sum + month.amount, 0) / totalExpenses.length || 0;
        const avgIncome = totalIncome.reduce((sum, month) => sum + month.amount, 0) / totalIncome.length || 0;
        const avgSavings = avgIncome - avgExpenses || 0;

        // Get this month's data
        const thisMonthStart = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), 1, 0, 0, 0));
        const thisMonthEnd = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth() + 1, 1, 0, 0, 0));

        const thisMonthExpenses = await Transactions.find({
            user_id: id,
            date: { $gte: thisMonthStart, $lte: thisMonthEnd },
            type: "expenditure"
        });

        const thisMonthIncome = await Transactions.find({
            user_id: id,
            date: { $gte: thisMonthStart, $lte: thisMonthEnd },
            type: "revenue"
        });

        const thisMonthExpensesTotal = thisMonthExpenses.reduce((sum, transaction) => sum + transaction.amount, 0);
        const thisMonthIncomeTotal = thisMonthIncome.reduce((sum, transaction) => sum + transaction.amount, 0);
        const thisMonthSavingsTotal = thisMonthIncomeTotal - thisMonthExpensesTotal;

        let expensesPercentageChange, incomePercentageChange, savingsPercentageChange;
        let expensesColor, incomeColor, savingsColor;

        
        if (thisMonthExpensesTotal > avgExpenses) {
            expensesPercentageChange = (thisMonthExpensesTotal - avgExpenses) / avgExpenses * 100;
            expensesColor = "red";
        } else {
            expensesPercentageChange = (avgExpenses - thisMonthExpensesTotal) / avgExpenses * 100;
            expensesColor = "green";
        }

        if (thisMonthIncomeTotal > avgIncome) {
            incomePercentageChange = (thisMonthIncomeTotal - avgIncome) / avgIncome * 100;
            incomeColor = "green";
        } else {
            incomePercentageChange = (avgIncome - thisMonthIncomeTotal) / avgIncome * 100;
            incomeColor = "red";
        }

        if (thisMonthSavingsTotal > avgSavings) {
            savingsPercentageChange = (thisMonthSavingsTotal - avgSavings) / avgSavings * 100;
            savingsColor = "green";
        } else {
            savingsPercentageChange = (avgSavings - thisMonthSavingsTotal) / avgSavings * 100;
            savingsColor = "red";
        }

        res.json({
            avgExpenses,
            avgIncome,
            avgSavings,
            thisMonthExpensesTotal,
            thisMonthIncomeTotal,
            thisMonthSavingsTotal,
            expensesPercentageChange,
            incomePercentageChange,
            savingsPercentageChange,
            expensesColor,
            incomeColor,
            savingsColor
        });

    } catch (error) {
        console.error("Error in dashboard route:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/budget", verifyToken, async (req, res) => {
    try {

        const currentDate = new Date();
        let startDate, endDate;
        
        if (req.query.startDate && req.query.endDate) {
            startDate = new Date(req.query.startDate);
            endDate = new Date(req.query.endDate);
        } else {
            // Default to current month
            startDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), 1)); // First day of current month
            endDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)); // Last day of current month
        }

        const id = req.user.id;
        const budgets = await Budgets.find({user_id: id, startDate: { $lte: endDate }, endDate: { $gte: startDate }});
        const sortedBudgets = budgets.map(budget => ({
            _id: budget._id,
            name: budget.name,
            current: budget.current,
            limit: budget.limit,
            percentage: budget.current * 100 / budget.limit,
            startDate: budget.startDate,
            endDate: budget.endDate,
        }));

        const topBudgets = sortedBudgets.sort((a, b) => b.percentage - a.percentage).slice(0, 3);

        res.json(topBudgets);
    }
    catch (error) {
        console.error("Error in budget_analysis route:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}); 

router.get("/transactions", verifyToken, async (req, res) => {
    try {
        const id = req.user.id;


        const { limit = 5 , sortField = 'amount' , sortOrder = 'desc' , startDate , endDate } = req.query

        

        let findQuery = Transactions.find({
            user_id: id,
            type: "expenditure",
            date: { $gte: startDate, $lte: endDate }
        }).sort({ [sortField]: sortOrder }).limit(limit);

        let transactions = await findQuery.populate("tagId", "name")

        const formattedTransactions = transactions.map(transaction => ({
            _id: transaction._id,
            description: transaction.description,
            amount: transaction.amount,
            type: transaction.type,
            date: transaction.date,
            tags: transaction.tagId.map(tag => tag.name) // Extract tag names
          }));

        res.json(formattedTransactions);
        
    }
    catch (error) {
        console.error("Error in transactions route:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/radial_graph", verifyToken, async (req, res) => {
    try {
        const id = req.user.id;
        const currentDate = new Date();

        const first_transaction = await Transactions.findOne().sort({date: 1});
        const FirstDate = first_transaction.date;

        let firstMonth;
        const monthsDiff = (currentDate.getFullYear() - FirstDate.getFullYear()) * 12 + (currentDate.getMonth() - FirstDate.getMonth());

        if (monthsDiff <= 4) {
            // FirstDate is within the last 4 months
            firstMonth = new Date(Date.UTC(FirstDate.getFullYear(), FirstDate.getMonth(), 1, 0, 0, 0));
        } else {
            // Get the month exactly 4 months before currentDate
            const priorDate = new Date(currentDate);
            priorDate.setUTCMonth(currentDate.getMonth() - 4);
            firstMonth = new Date(Date.UTC(priorDate.getFullYear(), priorDate.getMonth(), 1, 0, 0, 0));
        }

        const five_months_data = [];


        const monthMapping = {
            0: "January",
            1: "February",
            2: "March",
            3: "April",
            4: "May",
            5: "June",
            6: "July",
            7: "August",
            8: "September",
            9: "October",
            10: "November",
            11: "December"
        }

        let month = firstMonth.getMonth()
        let year = firstMonth.getFullYear()

        for (let i = 0; i < 5; i++) 
        {

            let setDate = new Date(Date.UTC(year, month, 1, 0, 0, 0));
            let nextMonthDate = new Date(setDate);
            nextMonthDate.setUTCMonth(nextMonthDate.getUTCMonth() + 1);

            let transactions_expenses = await Transactions.find({
                user_id: id,
                date: { $gte: setDate, $lte: nextMonthDate },
                type: "expenditure"
            });

            let price_expenses = transactions_expenses.map(transaction => transaction.amount);
            let monthly_expenses = price_expenses.reduce((sum, transaction) => sum + transaction, 0);

            let transactions_income = await Transactions.find({
                user_id: id,
                date: { $gte: setDate, $lte: nextMonthDate },
                type: "revenue"
            });

            let price_income = transactions_income.map(transaction => transaction.amount);
            let monthly_income = price_income.reduce((sum, transaction) => sum + transaction, 0);

            let month_data = {
                month: monthMapping[month],
                expenses: monthly_expenses,
                income: monthly_income,
                savings: monthly_income - monthly_expenses
            };
            
            five_months_data.push(month_data);

            if (month == 11) {
                year = year + 1;
                month = 0;
            } else {
                month = month + 1;
            }
        }

        res.json(five_months_data);

    }
    catch (error) {
        console.error("Error in radial_graph route:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/bar_graph", verifyToken, async (req, res) => {
    try {
        const id = new mongoose.Types.ObjectId(req.user.id);
        
        // Get dates from query params or use defaults
        const currentDate = new Date();
        let startDate, endDate;
        
        if (req.query.startDate && req.query.endDate) {
            startDate = new Date(req.query.startDate);
            endDate = new Date(req.query.endDate);
        } else {
            // Default to current month
            startDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), 1)); // First day of current month
            endDate = new Date(Date.UTC(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)); // Last day of current month
        }

        console.log("Date range:", { startDate, endDate });
        
        const result = await Tags.aggregate([
            {
                $match: {
                    user_id: id
                }
            },
            {
                $project: {
                    user_id: 0
                }
            },
            {
                $lookup: {
                    from: 'transactions',
                    let: { tagId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $in: ['$$tagId', '$tagId'] },
                                        { $eq: ['$user_id', id] },
                                        { $eq: ['$type', 'expenditure'] },
                                        { 
                                            $gte: ['$date', startDate]
                                        },
                                        { 
                                            $lte: ['$date', endDate]
                                        }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'transactions'
                }
            },
            { $unwind: '$transactions' },
            {
                $group: {
                    _id: '$name',
                    totalamount: { $sum: '$transactions.amount' }
                }
            },
            {
                $sort: {
                    totalamount: -1
                }
            }
        ]);

        console.log("Aggregation result:", result);
        res.json(result);
    }
    catch (error) {
        console.error("Error in bar_graph route:", error);
        console.error("Error details:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
