const express = require('express')
const app = express();

app.use(express.json())
let arraySplitInfo = []

/*
    Everything is being done in this single file and not really refactored 
    in order to submit before deadline as I started very late. 
    Also this is my first NodeJs Endpoint as I work mostly with Java Springboot for REST API creation.
    Thank you, looking forward to learning from you. 
*/

// function to calculate percentage and return balance having calculated percentage
function calCulatePercentage(amount, splitInfo) {
    splitInfo.forEach(info => {
        // check only element which split type is percentage
        if (info.SplitType === 'PERCENTAGE') {
            // constraint making dure amount is not less than zero and also not less than split value
            // if either of the two happen, then return -1
            if (amount < 0 || amount < info.SplitValue) {
                amount = -1
                return amount
            }
            // after confirmation, percentage can now be calculated
            let percent = (info.SplitValue * amount) / 100
                amount -= percent
                // add id and value to an array for each splitinfo based on percentage
                arraySplitInfo.push({
                    "SplitEntityId": info.SplitEntityId,
                    "Amount": info.SplitValue
                })
        }
    })
    // return balance after successful operation
    return amount
}

// function to calculate flat and return balance having calculated flat
function calCulateFlat(amount, splitInfo) {
    // looping through SplitInfo to get flat as type
    splitInfo.forEach(info => {
        // check only element which split type is flat
        if (info.SplitType === 'FLAT') {
            // constraint making sure amount is not less than zero and also not less than split value
            // if either of the two happen, then return -1
            if (amount < 0 || amount < info.SplitValue) {
                amount = -1;
                return amount
            }
            // after confirmation, flat can now be calculated
            amount -= info.SplitValue
            // add id and value to an array for each splitinfo based on percentage
            arraySplitInfo.push({
                "SplitEntityId": info.SplitEntityId,
                "Amount": info.SplitValue
            })
        }
    })
    // return balance after successful operation
    return amount;
}

// function to calculate ratio and return balance having calculated flat
function calCulateRatio(amount, splitInfo) {
    let totalRatioAmount = 0 // use as placeholder for ratio deduction
    let totalRatio =  0 // to sum all ratio for division
    splitInfo.forEach(info => {
        // looping through SplitInfo to get ratio as type
        if (info.SplitType === 'RATIO') {
            // sum all ratio to total ratio
            totalRatio += info.SplitValue
        }
    })

    // looping through SplitInfo to get ratio as type
    splitInfo.forEach(info => {
        // check only element which split type is ratio
        if (info.SplitType === 'RATIO') {
            let ratioAmount = 0 // ratio amount holder
            // initially totalRatioAmount would be 0 then initialize it to the amount passed which is remaining balance
            // once totalRatioAmount is greater than 0 then it has been initialized already then continue computation
            totalRatioAmount = totalRatioAmount > 0 ? totalRatioAmount : amount 
            // constraint making sure amount is not less than zero and also not less than split value
            // if either of the two happen, then return -1
            if (amount < 0 || amount < info.SplitValue) {
                totalRatioAmount = -1
                return totalRatioAmount
            }
            // after confirmation, ratio can now be calculated
            ratioAmount = ((info.SplitValue / totalRatio) * amount)
                arraySplitInfo.push({
                    "SplitEntityId": info.SplitEntityId,
                    "Amount": ratioAmount
                })
                totalRatioAmount -= ratioAmount
        }
    })
    // return totalRatioAmount after successful operation
    return totalRatioAmount
}


app.post('/split-payments/compute', (req, res) => {
    // get only needed field for computation
    const ID = req.body.ID
    const Amount = req.body.Amount
    const SplitInfo = req.body.SplitInfo
    let Balance = Amount

    // constraint to check if Amount input is less than zero, then bad request would be sent
    if (Balance < 0) {
        res.status(400).json({
            message: "Insufficient balance!"
        })
    }
    // constraint to check for the length of array if no object is there or object there are above 20, then bad request would be sent
    if (SplitInfo.length < 1 || SplitInfo.length > 20) {
        res.status(400).json({
            message: "minimum of (1) and maximum of (20) SplitInfo expected!"
        })
    }
    // Calculate flat and return balance to variable balance
    Balance = calCulateFlat(Balance, SplitInfo)
    // check if balance gotten is -1 then return bad request
    if (Balance == -1) {
        return res.status(400).json({
        message: "Unable to complete the request insufficient balance"
        })
    }
    // Calculate percentage and return balance to variable balance
    Balance = calCulatePercentage(Balance, SplitInfo)
    // check if balance gotten is -1 then return bad request
    if (Balance == -1) {
        return res.status(400).json({
        message: "Unable to complete the request insufficient balance"
        })
    }
    // Calculate ratio and return balance to variable balance
    Balance = calCulateRatio(Balance, SplitInfo)
    // check if balance gotten is -1 then return bad request
    if (Balance == -1) {
        return res.status(400).json({
        message: "Unable to complete the request insufficient balance"
        })
    }
    // once all the condition has been met, put all data in arraySplit into SplitBreakDown 
    // in order to empty arraySplit to avoid appending another request into it

    const splitBreakdown = arraySplitInfo
    arraySplitInfo = []

    res.status(200).json({
        ID: ID,
        Balance: Balance,
        SplitBreakdown: splitBreakdown
    })

})

// just to test get endpoint when deploy to heroku
// app.get('/', (req, res) => res.status(200).send('Welcome to Lannister Pay TPSS endpoint!'))

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log('Server started!'))
