const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const { error } = require("console");
const app = express();
const PORT = 7000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
})

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        return cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        return cb(null, file.originalname);
    }
})

const upload = multer({ storage });

app.post('/upload', upload.single('File-to-be-Uploaded'), async (req, res) => {
    const csvFilePath = 'uploads/'
    const csv = require('csvtojson')
    
    try {
        const jsonObj = await csv().fromFile(req.file.path);

        // Convert date format manually
        for (let i = 0; i < jsonObj.length; i++) {
            const dateParts = jsonObj[i].Date.split('-'); // Assuming Date is a string like '12-15-2021'
            const convertedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
            jsonObj[i].Date = convertedDate;
        }

        console.log(jsonObj);

        // Insert the converted jsonObj into MongoDB
        const insertedData = await user.create(jsonObj);
        console.log("Inserted data:", insertedData);

        res.sendFile(__dirname + '/API/api.html');
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("An error occurred while processing the file.");
    }
})

const userschema = new mongoose.Schema({
    Date: {
        type: String,
        require: true
    },
    Description: {
        type: String,
        require: true
    },
    Amount: {
        type: Number,
        require: true
    },
    Currency: {
        type: String,
        require: true
    }
});

const user = mongoose.model("user", userschema);
mongoose
    .connect("mongodb+srv://Piyush99673:132002@cluster9.cxkvnts.mongodb.net/Transaction-Assignment?retryWrites=true&w=majority")
    .then(() => {
        console.log("connected to database");
    })
    .catch((error) => console.log(error));


    //Getting Data from database using StartDate and EndDate
    // Working Completely Fine now
    async function getDataByDateRange(start, end) {
        try {
            console.log("Searching for data between", start, "and", end);
            
            const dataofdates = await user.find({
                Date: {
                    $gte: start,
                    $lte: end
                }
            });
    
            console.log("Found data:", dataofdates);
    
            return dataofdates;
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    }


app.post('/gettransaction', (req, res) => {
    let start = req.body.startDate;
    let end = req.body.endDate;
    console.log(start);
    console.log(end);
    getDataByDateRange(start, end)
        .then((result) => {
            console.log(result); // Use "result" instead of "results"
            res.send("You can View the Results on the console Now :)"); // Send the result as the response
        })
        .catch((error) => {
            console.error(error);
            res.status(500).send("An error occurred while fetching data.");
        });
})


//INSERTING THE DATA INTO THE DATABASE 
//Working Now completely fine 
async function insertDataIntoDatabase(obj) {
    const results = await user.insertMany(obj);
    return results;
}


app.post('/insert', (req, res) => {
    const obj = { Date: req.body.date, Description: req.body.DescriptionId, Amount: req.body.amount, Currency: req.body.Currency };
    insertDataIntoDatabase(obj).then((answer) => {
        console.log(answer);
        res.send("Data inserted successfully");
    })

})


// DELETING THE DATA FROM DATABASE
//Working Completely Fine
async function deleteDataFromDatabase(objtobedeleted) {
    const results = await user.deleteOne(objtobedeleted);
    return results.deletedCount;
}

app.post('/delete', (req, res) => {
    const objtobedeleted = { Date: req.body.date, Description: req.body.DescriptionId, Amount: req.body.amount, Currency: req.body.Currency };
    deleteDataFromDatabase(objtobedeleted).then((answer) => {
        console.log(answer + " Documents were deleted");
        res.send(`Deleted Succesfully`);
    })
})

//Editing the data in the database
async function editDataInDatabase(originalDate, originalDescription, originalAmount, originalCurrency, newDate, newDescription, newAmount, newCurrency) {
    try {
        const updatedData = await user.findOneAndUpdate(
            {
                Date: originalDate,
                Description: originalDescription,
                Amount: originalAmount,
                Currency: originalCurrency
            },
            {
                Date: newDate,
                Description: newDescription,
                Amount: newAmount,
                Currency: newCurrency
            },
            { new: true } // This option returns the updated document
        );
        if (!updatedData) {
            console.log("Data not found for editing");
            return null;
        }

        console.log("Updated data:", updatedData);
        return updatedData;
    } catch (error) {
        console.error("Error editing data:", error);
        throw error;
    }
}


app.post('/edit', (req, res) => {
    editDataInDatabase(req.body.originalDate, req.body.originalDescription, req.body.originalAmount, req.body.originalCurrency, req.body.newDate, req.body.newDescription, req.body.newAmount, req.body.newCurrency);
    res.send("Document Edited Successfully");
})

app.listen(PORT, () => {
    console.log(`listening on Port ${PORT}`);
})