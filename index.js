const express = require('express')
const app = express();

app.use(express.json())
let arraySplitInfo = []

function calCulatePercentage(amount, splitInfo) {
    splitInfo.forEach(info => {
        if (info.SplitType === 'PERCENTAGE') {
            if (amount < 0 || amount < info.SplitValue) {
                amount = -1
                return amount
            }
            let percent = (info.SplitValue * amount) / 100
                amount -= percent
                arraySplitInfo.push({
                    "SplitEntityId": info.SplitEntityId,
                    "Amount": info.SplitValue
                })
        }
    })
    return amount
}

function calCulateFlat(amount, splitInfo) {
    splitInfo.forEach(info => {
        if (info.SplitType === 'FLAT') {
            if (amount < 0 || amount < info.SplitValue) {
                amount = -1;
                return amount
            }
            amount -= info.SplitValue
            arraySplitInfo.push({
                "SplitEntityId": info.SplitEntityId,
                "Amount": info.SplitValue
            })
        }
    })
    return amount;
}

function calCulateRatio(amount, splitInfo) {
    let totalRatioAmount = 0
    let totalRatio =  0
    splitInfo.forEach(info => {
        if (info.SplitType === 'RATIO') {
            totalRatio += info.SplitValue
        }
    })

    splitInfo.forEach(info => {
        if (info.SplitType === 'RATIO') {
            let ratioAmount = 0
            totalRatioAmount = totalRatioAmount > 0 ? totalRatioAmount : amount
            if (amount < 0 || amount < info.SplitValue) {
                totalRatioAmount = -1
                return totalRatioAmount
            }
            ratioAmount = ((info.SplitValue / totalRatio) * amount)
                arraySplitInfo.push({
                    "SplitEntityId": info.SplitEntityId,
                    "Amount": ratioAmount
                })
                totalRatioAmount = totalRatioAmount - ratioAmount
        }
    })
    return totalRatioAmount
}


app.post('/split-payments/compute', (req, res) => {
    const ID = req.body.ID
    const Amount = req.body.Amount
    const SplitInfo = req.body.SplitInfo
    let Balance = Amount

    if (Balance < 0) {
        res.status(400).json({
            message: "Insufficient balance!"
        })
    }
    if (SplitInfo.length < 1 || SplitInfo.length > 20) {
        res.status(400).json({
            message: "minimum of (1) and maximum of (20) SplitInfo expected!"
        })
    }
    Balance = calCulateFlat(Balance, SplitInfo)
    if (Balance == -1) {
        return res.status(400).json({
        message: "Unable to complete the request insufficient balance"
        })
    }
    Balance = calCulatePercentage(Balance, SplitInfo)
    if (Balance == -1) {
        return res.status(400).json({
        message: "Unable to complete the request insufficient balance"
        })
    }
    Balance = calCulateRatio(Balance, SplitInfo)
    if (Balance == -1) {
        return res.status(400).json({
        message: "Unable to complete the request insufficient balance"
        })
    }
    const splitBreakdown = arraySplitInfo
    arraySplitInfo = []

    res.status(200).json({
        ID: ID,
        Balance: Balance,
        SplitBreakdown: splitBreakdown
    })

})

app.get('/', (req, res) => res.status(200).send('Welcome to Lannister Pay TPSS endpoint!'))

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log('Server started!'))
